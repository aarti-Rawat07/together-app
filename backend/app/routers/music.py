import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from pydantic import BaseModel

from app.schemas.music import Track, CategoryResponse
from app.services.music_provider import default_music_provider
from app.models.user import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/music", tags=["Music"])


class CustomUrlRequest(BaseModel):
    title: str
    artist: str
    url: str
    cover_url: Optional[str] = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80"
    category: Optional[str] = "Custom Songs"


@router.get("/tracks", response_model=List[Track])
async def list_tracks(current_user: User = Depends(get_current_user)):
    """Retrieve catalog of available tracks."""
    return await default_music_provider.get_tracks()


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(current_user: User = Depends(get_current_user)):
    """Retrieve music categories."""
    return await default_music_provider.get_categories()


@router.get("/search", response_model=List[Track])
async def search_tracks(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user)
):
    """Search tracks by title, artist, album, or category."""
    return await default_music_provider.search_tracks(q)


@router.get("/tracks/{track_id}", response_model=Track)
async def get_track(track_id: str, current_user: User = Depends(get_current_user)):
    track = await default_music_provider.get_track(track_id)
    if not track:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Track not found.")
    return track


@router.post("/upload", response_model=Track, status_code=status.HTTP_201_CREATED)
async def upload_audio_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    artist: str = Form("Custom Artist"),
    category: str = Form("Uploaded Songs"),
    current_user: User = Depends(get_current_user)
):
    """Upload a real MP3/audio file from device to play together in sync."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"]:
        raise HTTPException(status_code=400, detail="Unsupported audio format. Please upload an MP3, WAV, or M4A file.")

    static_dir = os.path.join(os.path.dirname(__file__), "..", "..", "static", "music")
    os.makedirs(static_dir, exist_ok=True)

    unique_filename = f"user_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(static_dir, unique_filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    audio_url = f"/static/music/{unique_filename}"
    new_track = Track(
        id=f"upload-{uuid.uuid4().hex[:8]}",
        title=title.strip(),
        artist=artist.strip(),
        album="My Uploads",
        duration=240.0,  # default duration estimate
        url=audio_url,
        cover_url="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
        category=category.strip()
    )

    await default_music_provider.add_track(new_track)
    return new_track


@router.post("/custom-url", response_model=Track, status_code=status.HTTP_201_CREATED)
async def add_custom_url_track(
    payload: CustomUrlRequest,
    current_user: User = Depends(get_current_user)
):
    """Add a direct MP3/Audio URL from the web to play together in sync."""
    new_track = Track(
        id=f"url-{uuid.uuid4().hex[:8]}",
        title=payload.title.strip(),
        artist=payload.artist.strip(),
        album="Custom Web Audio",
        duration=240.0,
        url=payload.url.strip(),
        cover_url=payload.cover_url or "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
        category=payload.category or "Custom Songs"
    )

    await default_music_provider.add_track(new_track)
    return new_track
