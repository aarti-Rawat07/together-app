import time
import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.room import Room, PlaybackState
from app.models.message import Message
from app.models.user import User
from app.websocket.manager import manager
from app.auth.dependencies import get_current_user_from_token_str
from app.services.room_service import get_room_by_uuid

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/rooms/{room_uuid}")
async def websocket_room_endpoint(
    websocket: WebSocket,
    room_uuid: str,
    token: Optional[str] = Query(None)
):
    """
    Real-time room communication endpoint for:
    - Strict 2-person room enforcement
    - Real-time text chat with DB persistence
    - Synchronized music playback & drift compensation
    - WebRTC voice chat signaling
    - Live presence & dynamic reactions
    """
    async with AsyncSessionLocal() as db:
        # 1. Authenticate user from JWT token
        if not token:
            await websocket.close(code=4001, reason="Authentication token missing")
            return

        user = await get_current_user_from_token_str(token, db)
        if not user:
            await websocket.close(code=4001, reason="Invalid or expired token")
            return

        # 2. Fetch room
        room = await get_room_by_uuid(db, room_uuid)
        if not room:
            await websocket.close(code=4004, reason="Room not found")
            return

        # 3. Connect via manager (enforcing 2-person limit & member authorization)
        connected = await manager.connect(websocket=websocket, room=room, user=user)
        if not connected:
            return

        # 4. Send initial room state to newly connected client
        playback_state = room.playback_state
        initial_state = {
            "type": "ROOM_INIT",
            "payload": {
                "room_uuid": room.uuid_token,
                "user_id": user.id,
                "active_participants": list(manager.active_rooms.get(room_uuid, {}).keys()),
                "playback": {
                    "track_id": playback_state.track_id if playback_state else "track-1",
                    "track_title": playback_state.track_title if playback_state else "Midnight Serenade",
                    "track_artist": playback_state.track_artist if playback_state else "Aura & Echo",
                    "track_url": playback_state.track_url if playback_state else "/static/music/midnight_serenade.mp3",
                    "track_cover_url": playback_state.track_cover_url if playback_state else "",
                    "track_duration": playback_state.track_duration if playback_state else 184.0,
                    "is_playing": playback_state.is_playing if playback_state else False,
                    "position": playback_state.position if playback_state else 0.0,
                    "server_timestamp": playback_state.server_timestamp if playback_state else time.time(),
                } if playback_state else None
            }
        }
        await websocket.send_json(initial_state)

    # Main WebSocket event loop
    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except Exception:
                continue

            event_type = data.get("type")
            payload = data.get("payload", {})

            # --- CHAT MESSAGE ---
            if event_type == "CHAT_MESSAGE":
                content = payload.get("content", "").strip()
                if content:
                    async with AsyncSessionLocal() as db:
                        # Save message to DB
                        msg = Message(
                            room_id=room.id,
                            sender_id=user.id,
                            content=content
                        )
                        db.add(msg)
                        await db.commit()
                        await db.refresh(msg)

                        msg_out = {
                            "type": "CHAT_MESSAGE",
                            "payload": {
                                "id": msg.id,
                                "room_id": room.id,
                                "sender_id": user.id,
                                "sender_name": user.name,
                                "sender_username": user.username,
                                "sender_avatar": user.avatar_url,
                                "content": content,
                                "created_at": msg.created_at.isoformat(),
                            }
                        }
                    await manager.broadcast_to_room(room_uuid, msg_out)

            # --- MUSIC EVENTS ---
            elif event_type == "MUSIC_PLAY":
                current_server_time = time.time()
                pos = float(payload.get("position", 0.0))
                track_id = payload.get("track_id")

                async with AsyncSessionLocal() as db:
                    stmt = select(PlaybackState).where(PlaybackState.room_id == room.id)
                    res = await db.execute(stmt)
                    pb = res.scalar_one_or_none()
                    if pb:
                        pb.is_playing = True
                        pb.position = pos
                        pb.server_timestamp = current_server_time
                        if track_id:
                            pb.track_id = track_id
                        pb.updated_by_user_id = user.id
                        await db.commit()

                await manager.broadcast_to_room(room_uuid, {
                    "type": "MUSIC_STATE",
                    "payload": {
                        "track_id": track_id or (pb.track_id if pb else "track-1"),
                        "is_playing": True,
                        "position": pos,
                        "server_timestamp": current_server_time,
                        "updated_by_user_id": user.id,
                    }
                })

            elif event_type == "MUSIC_PAUSE":
                current_server_time = time.time()
                pos = float(payload.get("position", 0.0))

                async with AsyncSessionLocal() as db:
                    stmt = select(PlaybackState).where(PlaybackState.room_id == room.id)
                    res = await db.execute(stmt)
                    pb = res.scalar_one_or_none()
                    if pb:
                        pb.is_playing = False
                        pb.position = pos
                        pb.server_timestamp = current_server_time
                        pb.updated_by_user_id = user.id
                        await db.commit()

                await manager.broadcast_to_room(room_uuid, {
                    "type": "MUSIC_STATE",
                    "payload": {
                        "track_id": pb.track_id if pb else "track-1",
                        "is_playing": False,
                        "position": pos,
                        "server_timestamp": current_server_time,
                        "updated_by_user_id": user.id,
                    }
                })

            elif event_type == "MUSIC_SEEK":
                current_server_time = time.time()
                pos = float(payload.get("position", 0.0))

                async with AsyncSessionLocal() as db:
                    stmt = select(PlaybackState).where(PlaybackState.room_id == room.id)
                    res = await db.execute(stmt)
                    pb = res.scalar_one_or_none()
                    if pb:
                        pb.position = pos
                        pb.server_timestamp = current_server_time
                        pb.updated_by_user_id = user.id
                        await db.commit()

                await manager.broadcast_to_room(room_uuid, {
                    "type": "MUSIC_SEEK",
                    "payload": {
                        "position": pos,
                        "server_timestamp": current_server_time,
                        "updated_by_user_id": user.id,
                    }
                })

            elif event_type == "MUSIC_CHANGE_TRACK":
                current_server_time = time.time()
                async with AsyncSessionLocal() as db:
                    stmt = select(PlaybackState).where(PlaybackState.room_id == room.id)
                    res = await db.execute(stmt)
                    pb = res.scalar_one_or_none()
                    if pb:
                        pb.track_id = payload.get("track_id", pb.track_id)
                        pb.track_title = payload.get("title", pb.track_title)
                        pb.track_artist = payload.get("artist", pb.track_artist)
                        pb.track_url = payload.get("url", pb.track_url)
                        pb.track_cover_url = payload.get("cover_url", pb.track_cover_url)
                        pb.track_duration = float(payload.get("duration", pb.track_duration))
                        pb.is_playing = payload.get("autoplay", True)
                        pb.position = 0.0
                        pb.server_timestamp = current_server_time
                        pb.updated_by_user_id = user.id
                        await db.commit()

                await manager.broadcast_to_room(room_uuid, {
                    "type": "MUSIC_CHANGE_TRACK",
                    "payload": {
                        "track_id": payload.get("track_id"),
                        "title": payload.get("title"),
                        "artist": payload.get("artist"),
                        "url": payload.get("url"),
                        "cover_url": payload.get("cover_url"),
                        "duration": payload.get("duration"),
                        "is_playing": payload.get("autoplay", True),
                        "position": 0.0,
                        "server_timestamp": current_server_time,
                        "updated_by_user_id": user.id,
                    }
                })

            elif event_type == "MUSIC_SYNC_REQUEST":
                # Compute real-time server elapsed position
                current_server_time = time.time()
                async with AsyncSessionLocal() as db:
                    stmt = select(PlaybackState).where(PlaybackState.room_id == room.id)
                    res = await db.execute(stmt)
                    pb = res.scalar_one_or_none()
                    if pb:
                        current_pos = pb.position
                        if pb.is_playing:
                            elapsed = current_server_time - pb.server_timestamp
                            current_pos = min(pb.position + elapsed, pb.track_duration)

                        await websocket.send_json({
                            "type": "MUSIC_SYNC_RESPONSE",
                            "payload": {
                                "track_id": pb.track_id,
                                "is_playing": pb.is_playing,
                                "position": current_pos,
                                "server_timestamp": current_server_time,
                            }
                        })

            # --- WEBRTC SIGNALING (OFFER, ANSWER, ICE CANDIDATE, VOICE STATUS) ---
            elif event_type in ("WEBRTC_OFFER", "WEBRTC_ANSWER", "WEBRTC_ICE_CANDIDATE", "WEBRTC_VOICE_STATUS"):
                # Forward directly to the peer in this 2-person room
                await manager.send_to_peer(
                    room_uuid=room_uuid,
                    sender_id=user.id,
                    message={
                        "type": event_type,
                        "sender_id": user.id,
                        "payload": payload
                    }
                )

            # --- REACTIONS ---
            elif event_type == "REACTION":
                emoji = payload.get("emoji", "❤️")
                await manager.broadcast_to_room(room_uuid, {
                    "type": "REACTION",
                    "payload": {
                        "emoji": emoji,
                        "sender_id": user.id,
                        "sender_name": user.name,
                        "timestamp": time.time()
                    }
                })

            # --- TYPING INDICATOR ---
            elif event_type == "TYPING":
                await manager.send_to_peer(room_uuid, user.id, {
                    "type": "TYPING",
                    "payload": {
                        "user_id": user.id,
                        "is_typing": payload.get("is_typing", False)
                    }
                })

    except WebSocketDisconnect:
        manager.disconnect(room_uuid, user.id)
        # Notify peer that partner disconnected
        await manager.broadcast_to_room(
            room_uuid=room_uuid,
            message={
                "type": "PRESENCE",
                "payload": {
                    "user_id": user.id,
                    "username": user.username,
                    "name": user.name,
                    "status": "OFFLINE",
                    "in_room": False,
                    "timestamp": time.time(),
                    "active_users": list(manager.active_rooms.get(room_uuid, {}).keys())
                }
            }
        )
    except Exception as e:
        manager.disconnect(room_uuid, user.id)
