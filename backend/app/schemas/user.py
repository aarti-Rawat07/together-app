from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    name: str
    username: str
    email: EmailStr
    avatar_url: Optional[str] = None
    status: Optional[str] = "offline"


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class UserSearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    username: str
    email: str
    avatar_url: Optional[str] = None
    status: str
    connection_status: Optional[str] = None
    contact_id: Optional[int] = None


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    status: Optional[str] = None
