from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class ContactRequestCreate(BaseModel):
    addressee_username_or_email: str


class ContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requester_id: int
    addressee_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    requester: UserResponse
    addressee: UserResponse
    partner: Optional[UserResponse] = None


class ContactStatusUpdate(BaseModel):
    status: str  # ACCEPTED, REJECTED, BLOCKED
