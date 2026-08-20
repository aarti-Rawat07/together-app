from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_

from app.database import get_db
from app.models.user import User
from app.models.contact import Contact
from app.schemas.user import UserResponse, UserSearchResponse, UserProfileUpdate
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/search", response_model=List[UserSearchResponse])
async def search_users(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search users by username, name, or email, excluding the caller."""
    search_term = f"%{q.strip()}%"
    stmt = select(User).where(
        and_(
            User.id != current_user.id,
            or_(
                User.username.ilike(search_term),
                User.email.ilike(search_term),
                User.name.ilike(search_term),
            )
        )
    ).limit(20)
    result = await db.execute(stmt)
    users = result.scalars().all()

    # Find connection status for each user relative to current_user
    user_ids = [u.id for u in users]
    if not user_ids:
        return []

    c_stmt = select(Contact).where(
        or_(
            and_(Contact.requester_id == current_user.id, Contact.addressee_id.in_(user_ids)),
            and_(Contact.addressee_id == current_user.id, Contact.requester_id.in_(user_ids)),
        )
    )
    c_result = await db.execute(c_stmt)
    contacts = c_result.scalars().all()

    # Map contact status
    contact_map = {}
    for c in contacts:
        other_id = c.addressee_id if c.requester_id == current_user.id else c.requester_id
        if c.status == "ACCEPTED":
            c_status = "ACCEPTED"
        elif c.status == "PENDING":
            c_status = "PENDING_SENT" if c.requester_id == current_user.id else "PENDING_RECEIVED"
        else:
            c_status = c.status
        contact_map[other_id] = (c_status, c.id)

    response = []
    for u in users:
        c_status, c_id = contact_map.get(u.id, (None, None))
        response.append(UserSearchResponse(
            id=u.id,
            name=u.name,
            username=u.username,
            email=u.email,
            avatar_url=u.avatar_url,
            status=u.status,
            connection_status=c_status,
            contact_id=c_id,
        ))

    return response


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.status is not None:
        current_user.status = payload.status

    await db.commit()
    await db.refresh(current_user)
    return current_user
