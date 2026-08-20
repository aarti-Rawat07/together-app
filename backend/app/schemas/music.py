from typing import List, Optional
from pydantic import BaseModel


class Track(BaseModel):
    id: str
    title: str
    artist: str
    album: Optional[str] = "Together Session"
    duration: float  # in seconds
    url: str         # audio file streaming URL
    cover_url: str   # album artwork image URL
    category: Optional[str] = "Lo-Fi Romance"


class CategoryResponse(BaseModel):
    id: str
    name: str
    tracks: List[Track]
