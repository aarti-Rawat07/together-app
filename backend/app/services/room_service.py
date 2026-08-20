from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, and_

from app.models.room import Room, PlaybackState
from app.models.contact import Contact
from app.models.user import User


async def check_contact_relationship(db: AsyncSession, user_a_id: int, user_b_id: int) -> bool:
    """Verify that user A and user B are accepted contacts."""
    stmt = select(Contact).where(
        and_(
            Contact.status == "ACCEPTED",
            or_(
                and_(Contact.requester_id == user_a_id, Contact.addressee_id == user_b_id),
                and_(Contact.requester_id == user_b_id, Contact.addressee_id == user_a_id),
            )
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def get_or_create_private_room(db: AsyncSession, creator_id: int, partner_id: int) -> Room:
    """
    Start or resume a private room between two accepted contacts.
    Enforces strict 2-person room rule.
    """
    if creator_id == partner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start a private room with yourself."
        )

    # 1. Verify accepted contact relationship
    is_connected = await check_contact_relationship(db, creator_id, partner_id)
    if not is_connected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only start a Together room with an accepted contact."
        )

    # 2. Check for an existing active room between these two exact users
    stmt = select(Room).options(
        selectinload(Room.creator),
        selectinload(Room.partner),
        selectinload(Room.playback_state),
    ).where(
        and_(
            Room.is_active == True,
            or_(
                and_(Room.creator_id == creator_id, Room.partner_id == partner_id),
                and_(Room.creator_id == partner_id, Room.partner_id == creator_id),
            )
        )
    )
    result = await db.execute(stmt)
    existing_room = result.scalar_one_or_none()

    if existing_room:
        return existing_room

    # 3. Create new private room
    new_room = Room(
        creator_id=creator_id,
        partner_id=partner_id,
        is_active=True,
    )
    db.add(new_room)
    await db.flush()

    # Create associated default PlaybackState
    playback = PlaybackState(
        room_id=new_room.id,
        track_id="track-1",
        track_title="Midnight Serenade",
        track_artist="Aura & Echo",
        track_url="/static/music/midnight_serenade.mp3",
        track_cover_url="https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=60",
        track_duration=184.0,
        is_playing=False,
        position=0.0,
        server_timestamp=datetime.now(timezone.utc).timestamp(),
        updated_by_user_id=creator_id,
    )
    db.add(playback)
    await db.commit()

    # Reload with relations
    return await get_room_by_uuid(db, new_room.uuid_token)


async def get_room_by_uuid(db: AsyncSession, uuid_token: str) -> Optional[Room]:
    """Fetch room with all relationships by its UUID token."""
    stmt = select(Room).options(
        selectinload(Room.creator),
        selectinload(Room.partner),
        selectinload(Room.playback_state),
    ).where(Room.uuid_token == uuid_token)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_active_room(db: AsyncSession, user_id: int) -> Optional[Room]:
    """Find any active room that the user currently belongs to."""
    stmt = select(Room).options(
        selectinload(Room.creator),
        selectinload(Room.partner),
        selectinload(Room.playback_state),
    ).where(
        and_(
            Room.is_active == True,
            or_(Room.creator_id == user_id, Room.partner_id == user_id)
        )
    ).order_by(Room.created_at.desc())
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
