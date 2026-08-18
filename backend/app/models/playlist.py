from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .video import Video

class Playlist(Base):
    __tablename__ = "playlists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="점심식사", index=True)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_duration_sec: Mapped[int] = mapped_column(Integer, default=0, index=True)
    fork_count: Mapped[int] = mapped_column(Integer, default=0)
    forked_from_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("playlists.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    author: Mapped["User"] = relationship("User", back_populates="playlists")
    items: Mapped[List["PlaylistItem"]] = relationship("PlaylistItem", back_populates="playlist", cascade="all, delete-orphan")

class PlaylistItem(Base):
    __tablename__ = "playlist_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    playlist_id: Mapped[int] = mapped_column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    sequence_order: Mapped[int] = mapped_column(Integer, default=0)

    playlist: Mapped["Playlist"] = relationship("Playlist", back_populates="items")
    video: Mapped["Video"] = relationship("Video")
