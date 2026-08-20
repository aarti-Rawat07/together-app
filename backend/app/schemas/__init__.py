from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserResponse, UserSearchResponse, UserProfileUpdate
from app.schemas.contact import ContactRequestCreate, ContactResponse, ContactStatusUpdate
from app.schemas.room import RoomCreate, RoomResponse, PlaybackStateResponse, PlaybackStateUpdate
from app.schemas.message import MessageCreate, MessageResponse
from app.schemas.notification import NotificationResponse
from app.schemas.music import Track, CategoryResponse
from app.schemas.websocket import WSMessage

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "UserSearchResponse",
    "UserProfileUpdate",
    "ContactRequestCreate",
    "ContactResponse",
    "ContactStatusUpdate",
    "RoomCreate",
    "RoomResponse",
    "PlaybackStateResponse",
    "PlaybackStateUpdate",
    "MessageCreate",
    "MessageResponse",
    "NotificationResponse",
    "Track",
    "CategoryResponse",
    "WSMessage",
]
