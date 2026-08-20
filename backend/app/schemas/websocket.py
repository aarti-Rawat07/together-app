from typing import Any, Optional, Dict
from pydantic import BaseModel


class WSMessage(BaseModel):
    type: str  # CHAT_MESSAGE, MUSIC_PLAY, MUSIC_PAUSE, MUSIC_SEEK, MUSIC_CHANGE_TRACK, MUSIC_SYNC_REQUEST, WEBRTC_*, REACTION, PRESENCE
    payload: Optional[Dict[str, Any]] = None
    sender_id: Optional[int] = None
    timestamp: Optional[float] = None
