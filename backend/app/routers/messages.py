from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.room import Room
from app.models.message import Message
from app.schemas.message import MessageResponse
from app.auth.dependencies import get_current_user
from app.services.room_service import get_room_by_uuid

router = APIRouter(prefix="/rooms", tags=["Messages"])


@router.get("/{room_uuid}/messages", response_model=List[MessageResponse])
async def get_room_messages(
    room_uuid: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch persistent chat history for a private room. Only accessible to room members."""
    room = await get_room_by_uuid(db, room_uuid)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")

    if not room.is_member(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You cannot view messages for a room you do not belong to."
        )

    stmt = select(Message).options(
        selectinload(Message.sender)
    ).where(
        Message.room_id == room.id
    ).order_by(Message.created_at.asc()).offset(offset).limit(limit)

    result = await db.execute(stmt)
    messages = result.scalars().all()

    return messages
