from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class PlaybackStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int
    track_id: Optional[str] = None
    track_title: Optional[str] = None
    track_artist: Optional[str] = None
    track_url: Optional[str] = None
    track_cover_url: Optional[str] = None
    track_duration: float = 0.0
    is_playing: bool = False
    position: float = 0.0
    server_timestamp: float = 0.0
    updated_by_user_id: Optional[int] = None


class PlaybackStateUpdate(BaseModel):
    track_id: Optional[str] = None
    track_title: Optional[str] = None
    track_artist: Optional[str] = None
    track_url: Optional[str] = None
    track_cover_url: Optional[str] = None
    track_duration: Optional[float] = None
    is_playing: Optional[bool] = None
    position: Optional[float] = None


class RoomCreate(BaseModel):
    partner_id: int


class RoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid_token: str
    creator_id: int
    partner_id: int
    is_active: bool
    created_at: datetime
    creator: UserResponse
    partner: UserResponse
    playback_state: Optional[PlaybackStateResponse] = None
