from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.contacts import router as contacts_router
from app.routers.rooms import router as rooms_router
from app.routers.messages import router as messages_router
from app.routers.music import router as music_router
from app.routers.notifications import router as notifications_router
from app.routers.ws import router as ws_router

__all__ = [
    "auth_router",
    "users_router",
    "contacts_router",
    "rooms_router",
    "messages_router",
    "music_router",
    "notifications_router",
    "ws_router",
]
