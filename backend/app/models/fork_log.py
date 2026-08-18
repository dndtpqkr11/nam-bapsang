from sqlalchemy import Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class ForkLog(Base):
    __tablename__ = "fork_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_playlist_id: Mapped[int] = mapped_column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    forked_playlist_id: Mapped[int] = mapped_column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
