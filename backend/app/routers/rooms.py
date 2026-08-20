import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.room import Room
from app.models.notification import Notification
from app.schemas.room import RoomCreate, RoomResponse
from app.auth.dependencies import get_current_user
from app.services.room_service import (
    get_or_create_private_room,
    get_room_by_uuid,
    get_user_active_room,
)

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_or_join_room(
    payload: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Start or resume a private 2-person room with an accepted contact.
    Enforces strict 2-member access and contact relationship.
    """
    room = await get_or_create_private_room(
        db=db,
        creator_id=current_user.id,
        partner_id=payload.partner_id
    )

    # Notify the partner that a room was started
    notif = Notification(
        user_id=payload.partner_id,
        sender_id=current_user.id,
        type="ROOM_INVITE",
        title="Together Session Started ❤️",
        message=f"{current_user.name} is waiting for you in your private room!",
        data=json.dumps({"room_uuid": room.uuid_token, "creator_name": current_user.name})
    )
    db.add(notif)
    await db.commit()

    return room


@router.get("/active/current", response_model=RoomResponse)
async def get_current_active_room(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the active Together session for the logged-in user if one exists."""
    room = await get_user_active_room(db, current_user.id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active Together room found for user."
        )
    return room


@router.get("/{room_uuid}", response_model=RoomResponse)
async def get_room(
    room_uuid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve room details by UUID.
    Strictly checks that the requesting user is one of the 2 authorized room members.
    """
    room = await get_room_by_uuid(db, room_uuid)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found."
        )

    # CRITICAL: Strict 2-person room membership authorization
    if not room.is_member(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Room is private. Only the two authorized participants can join this Together session."
        )

    return room


@router.post("/{room_uuid}/leave")
async def leave_room(
    room_uuid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    room = await get_room_by_uuid(db, room_uuid)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")

    if not room.is_member(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

    return {"message": "Left room successfully."}
