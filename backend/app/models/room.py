import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    uuid_token = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()), nullable=False)
    
    # Strictly 2 participants: Creator (User A) and Partner (User B)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    partner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_rooms")
    partner = relationship("User", foreign_keys=[partner_id], back_populates="joined_rooms")
    
    playback_state = relationship("PlaybackState", back_populates="room", uselist=False, cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="room", cascade="all, delete-orphan", order_by="Message.created_at")

    def is_member(self, user_id: int) -> bool:
        """Returns True if the user_id is one of the exactly two authorized participants."""
        return user_id in (self.creator_id, self.partner_id)


class PlaybackState(Base):
    __tablename__ = "playback_states"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    track_id = Column(String(100), nullable=True, default="track-1")
    track_title = Column(String(200), nullable=True, default="Midnight Serenade")
    track_artist = Column(String(200), nullable=True, default="Together Lo-Fi")
    track_url = Column(String(500), nullable=True, default="/static/music/track1.mp3")
    track_cover_url = Column(String(500), nullable=True, default="/static/music/cover1.jpg")
    track_duration = Column(Float, default=180.0)
    
    is_playing = Column(Boolean, default=False, nullable=False)
    position = Column(Float, default=0.0, nullable=False)  # playback position in seconds
    server_timestamp = Column(Float, default=0.0, nullable=False)  # time.time() when playback state changed
    
    updated_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    room = relationship("Room", back_populates="playback_state")
