import json
import time
from typing import Dict, Optional, Any
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.room import Room, PlaybackState
from app.models.message import Message
from app.models.user import User


class RoomConnectionManager:
    def __init__(self):
        # Structure: room_uuid -> { user_id: WebSocket }
        self.active_rooms: Dict[str, Dict[int, WebSocket]] = {}
        # Global presence: user_id -> set of active global WebSockets
        self.global_presence: Dict[int, set[WebSocket]] = {}

    def get_room_participants_count(self, room_uuid: str) -> int:
        """Return number of currently active connected users in a room."""
        if room_uuid in self.active_rooms:
            return len(self.active_rooms[room_uuid])
        return 0

    def is_user_in_room(self, room_uuid: str, user_id: int) -> bool:
        """Check if user is currently connected to the room."""
        return room_uuid in self.active_rooms and user_id in self.active_rooms[room_uuid]

    async def connect(self, websocket: WebSocket, room: Room, user: User) -> bool:
        """
        Accept and register a user to a room.
        Strictly enforces the 2-participant limit.
        """
        room_uuid = room.uuid_token
        user_id = user.id

        # 1. Authorization check
        if not room.is_member(user_id):
            await websocket.accept()
            await websocket.send_json({
                "type": "ERROR",
                "payload": {"message": "You are not an authorized member of this private room."}
            })
            await websocket.close(code=4003, reason="Unauthorized: Not a room member")
            return False

        # 2. Strict 2-person participant check
        current_members = self.active_rooms.get(room_uuid, {})
        if user_id not in current_members and len(current_members) >= 2:
            await websocket.accept()
            await websocket.send_json({
                "type": "ERROR",
                "payload": {"message": "Room is full. Only two people can join a Together session."}
            })
            await websocket.close(code=4008, reason="Room is full. Maximum 2 participants allowed.")
            return False

        await websocket.accept()

        if room_uuid not in self.active_rooms:
            self.active_rooms[room_uuid] = {}

        self.active_rooms[room_uuid][user_id] = websocket

        # Broadcast partner presence update
        await self.broadcast_to_room(
            room_uuid=room_uuid,
            message={
                "type": "PRESENCE",
                "payload": {
                    "user_id": user_id,
                    "username": user.username,
                    "name": user.name,
                    "status": "ONLINE",
                    "in_room": True,
                    "timestamp": time.time(),
                    "active_users": list(self.active_rooms[room_uuid].keys())
                }
            },
            exclude_user_id=None
        )

        return True

    def disconnect(self, room_uuid: str, user_id: int):
        """Remove user's websocket connection and clean up empty rooms."""
        if room_uuid in self.active_rooms:
            if user_id in self.active_rooms[room_uuid]:
                del self.active_rooms[room_uuid][user_id]
            
            if not self.active_rooms[room_uuid]:
                del self.active_rooms[room_uuid]

    async def broadcast_to_room(
        self,
        room_uuid: str,
        message: Dict[str, Any],
        exclude_user_id: Optional[int] = None
    ):
        """Broadcast a message payload to all (or peer) connections in the room."""
        if room_uuid not in self.active_rooms:
            return

        dead_connections = []
        for uid, ws in self.active_rooms[room_uuid].items():
            if exclude_user_id is not None and uid == exclude_user_id:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead_connections.append(uid)

        for uid in dead_connections:
            self.disconnect(room_uuid, uid)

    async def send_to_peer(
        self,
        room_uuid: str,
        sender_id: int,
        message: Dict[str, Any]
    ):
        """Send message directly to the other participant in the 2-person room."""
        if room_uuid not in self.active_rooms:
            return

        for uid, ws in self.active_rooms[room_uuid].items():
            if uid != sender_id:
                try:
                    await ws.send_json(message)
                except Exception:
                    self.disconnect(room_uuid, uid)


# Global singleton connection manager
manager = RoomConnectionManager()
