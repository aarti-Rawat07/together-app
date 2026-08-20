import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, and_

from app.database import get_db
from app.models.user import User
from app.models.contact import Contact
from app.models.notification import Notification
from app.schemas.contact import ContactRequestCreate, ContactResponse
from app.schemas.user import UserResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.get("", response_model=Dict[str, List[ContactResponse]])
async def get_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all contacts separated into accepted, pending_sent, and pending_received."""
    stmt = select(Contact).options(
        selectinload(Contact.requester),
        selectinload(Contact.addressee),
    ).where(
        or_(Contact.requester_id == current_user.id, Contact.addressee_id == current_user.id)
    )
    result = await db.execute(stmt)
    contacts = result.scalars().all()

    accepted: List[ContactResponse] = []
    pending_sent: List[ContactResponse] = []
    pending_received: List[ContactResponse] = []

    for c in contacts:
        partner_obj = c.addressee if c.requester_id == current_user.id else c.requester
        contact_res = ContactResponse(
            id=c.id,
            requester_id=c.requester_id,
            addressee_id=c.addressee_id,
            status=c.status,
            created_at=c.created_at,
            updated_at=c.updated_at,
            requester=UserResponse.model_validate(c.requester),
            addressee=UserResponse.model_validate(c.addressee),
            partner=UserResponse.model_validate(partner_obj)
        )

        if c.status == "ACCEPTED":
            accepted.append(contact_res)
        elif c.status == "PENDING":
            if c.requester_id == current_user.id:
                pending_sent.append(contact_res)
            else:
                pending_received.append(contact_res)

    return {
        "accepted": accepted,
        "pending_sent": pending_sent,
        "pending_received": pending_received,
    }


@router.post("/request", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def send_contact_request(
    payload: ContactRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query_term = payload.addressee_username_or_email.strip().lower()
    
    # 1. Find the target user
    stmt = select(User).where(
        or_(User.username == query_term, User.email == query_term)
    )
    result = await db.execute(stmt)
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with provided username or email."
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot send a connection request to yourself."
        )

    # 2. Check existing relationship
    c_stmt = select(Contact).options(
        selectinload(Contact.requester),
        selectinload(Contact.addressee)
    ).where(
        or_(
            and_(Contact.requester_id == current_user.id, Contact.addressee_id == target_user.id),
            and_(Contact.requester_id == target_user.id, Contact.addressee_id == current_user.id),
        )
    )
    c_result = await db.execute(c_stmt)
    existing = c_result.scalar_one_or_none()

    if existing:
        if existing.status == "ACCEPTED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already connected with this user.")
        elif existing.status == "PENDING":
            if existing.requester_id == current_user.id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Connection request already sent.")
            else:
                # Target already sent request to current user, auto-accept it!
                existing.status = "ACCEPTED"
                await db.commit()
                await db.refresh(existing)
                return ContactResponse(
                    id=existing.id,
                    requester_id=existing.requester_id,
                    addressee_id=existing.addressee_id,
                    status=existing.status,
                    created_at=existing.created_at,
                    updated_at=existing.updated_at,
                    requester=UserResponse.model_validate(existing.requester),
                    addressee=UserResponse.model_validate(existing.addressee),
                    partner=UserResponse.model_validate(target_user)
                )

    # 3. Create new Contact request
    new_contact = Contact(
        requester_id=current_user.id,
        addressee_id=target_user.id,
        status="PENDING"
    )
    db.add(new_contact)
    
    # Create notification for target user
    notif = Notification(
        user_id=target_user.id,
        sender_id=current_user.id,
        type="CONTACT_REQUEST",
        title="New Connection Request ❤️",
        message=f"{current_user.name} (@{current_user.username}) sent you a connection request.",
        data=json.dumps({"requester_id": current_user.id, "username": current_user.username})
    )
    db.add(notif)

    await db.commit()
    await db.refresh(new_contact)

    return ContactResponse(
        id=new_contact.id,
        requester_id=new_contact.requester_id,
        addressee_id=new_contact.addressee_id,
        status=new_contact.status,
        created_at=new_contact.created_at,
        updated_at=new_contact.updated_at,
        requester=UserResponse.model_validate(current_user),
        addressee=UserResponse.model_validate(target_user),
        partner=UserResponse.model_validate(target_user)
    )


@router.post("/{contact_id}/accept", response_model=ContactResponse)
async def accept_contact_request(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Contact).options(
        selectinload(Contact.requester),
        selectinload(Contact.addressee)
    ).where(Contact.id == contact_id)
    result = await db.execute(stmt)
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection request not found.")

    if contact.addressee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to accept this request."
        )

    contact.status = "ACCEPTED"
    
    # Notify original requester
    notif = Notification(
        user_id=contact.requester_id,
        sender_id=current_user.id,
        type="CONTACT_ACCEPTED",
        title="Connection Accepted! 🎉",
        message=f"{current_user.name} accepted your connection request. You can now start a Together session!",
        data=json.dumps({"partner_id": current_user.id, "username": current_user.username})
    )
    db.add(notif)

    await db.commit()
    await db.refresh(contact)

    return ContactResponse(
        id=contact.id,
        requester_id=contact.requester_id,
        addressee_id=contact.addressee_id,
        status=contact.status,
        created_at=contact.created_at,
        updated_at=contact.updated_at,
        requester=UserResponse.model_validate(contact.requester),
        addressee=UserResponse.model_validate(contact.addressee),
        partner=UserResponse.model_validate(contact.requester)
    )


@router.post("/{contact_id}/reject")
async def reject_contact_request(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Contact).where(Contact.id == contact_id)
    result = await db.execute(stmt)
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection request not found.")

    if contact.addressee_id != current_user.id and contact.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    await db.delete(contact)
    await db.commit()
    return {"message": "Connection request removed."}


@router.delete("/{contact_id}")
async def remove_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Contact).where(Contact.id == contact_id)
    result = await db.execute(stmt)
    contact = result.scalar_one_or_none()

    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found.")

    if contact.requester_id != current_user.id and contact.addressee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    await db.delete(contact)
    await db.commit()
    return {"message": "Contact removed."}
