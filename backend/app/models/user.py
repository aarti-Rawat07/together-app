from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(255), nullable=True)
    status = Column(String(20), default="offline")  # online, offline, in_room
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    sent_requests = relationship(
        "Contact",
        foreign_keys="Contact.requester_id",
        back_populates="requester",
        cascade="all, delete-orphan"
    )
    received_requests = relationship(
        "Contact",
        foreign_keys="Contact.addressee_id",
        back_populates="addressee",
        cascade="all, delete-orphan"
    )
    created_rooms = relationship(
        "Room",
        foreign_keys="Room.creator_id",
        back_populates="creator"
    )
    joined_rooms = relationship(
        "Room",
        foreign_keys="Room.partner_id",
        back_populates="partner"
    )
    messages = relationship(
        "Message",
        back_populates="sender",
        cascade="all, delete-orphan"
    )
    notifications = relationship(
        "Notification",
        foreign_keys="Notification.user_id",
        back_populates="user",
        cascade="all, delete-orphan"
    )
