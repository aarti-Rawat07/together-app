from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    sender_id: Optional[int] = None
    type: str
    title: str
    message: str
    data: Optional[str] = None
    is_read: bool
    created_at: datetime
    sender: Optional[UserResponse] = None
