import uuid
import time
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.playlist import Playlist as PlaylistModel, PlaylistItem
from app.models.video import Video as VideoModel
from app.models.user import User as UserModel

router = APIRouter()

SHARED_LIVE_ROOMS: List[dict] = []

class CreateVideoItemRequest(BaseModel):
    title: str
    platform: str
    video_id: str
    duration_seconds: int
    thumbnail_url: str
    channel_title: Optional[str] = "추천 채널"

class CreatePlaylistRequest(BaseModel):
    title: str
    category: str
    videos: List[CreateVideoItemRequest]
    author_name: Optional[str] = "독고다이"
    is_live: Optional[bool] = False

@router.get("")
async def list_playlists(
    target_runtime: Optional[int] = Query(default=900, description="목표 런타임 (초 단위, 기본 900초=15분)"),
    category: Optional[str] = None,
    db: Optional[AsyncSession] = Depends(get_db)
):
    """
    PostgreSQL DB 및 공유 라이브 피드에서 플레이리스트 피드를 조회합니다.
    """
    formatted_data = list(SHARED_LIVE_ROOMS)

    if db is not None:
        try:
            stmt = select(PlaylistModel).options(
                selectinload(PlaylistModel.author),
                selectinload(PlaylistModel.items).selectinload(PlaylistItem.video)
            )
            if category:
                stmt = stmt.where(PlaylistModel.category == category)

            result = await db.execute(stmt)
            playlists = result.scalars().all()

            for pl in playlists:
                pl_id = f"pl-{pl.id}"
                if not any(r["id"] == pl_id for r in formatted_data):
                    formatted_data.append({
                        "id": pl_id,
                        "title": pl.title,
                        "author": pl.author.nickname if pl.author else "익명",
                        "author_id": f"u-{pl.author_id}",
                        "category": pl.category,
                        "total_duration_sec": pl.total_duration_sec,
                        "fork_count": pl.fork_count,
                        "active_watchers": 12,
                        "videos": [
                            {
                                "id": f"v-{item.video.id}",
                                "title": item.video.title,
                                "platform": item.video.platform,
                                "video_id": item.video.video_id,
                                "duration_seconds": item.video.duration_seconds,
                                "thumbnail_url": item.video.thumbnail_url,
                                "channel_title": item.video.channel_title
                            }
                            for item in pl.items
                        ]
                    })
        except Exception as db_err:
            print(f"DB fetch warning (memory list active): {db_err}")

    return {"success": True, "count": len(formatted_data), "data": formatted_data}

@router.post("")
async def create_playlist(
    payload: CreatePlaylistRequest,
    db: Optional[AsyncSession] = Depends(get_db)
):
    """
    새로운 15분 식사 맞춤 밥상(플레이리스트)을 생성하고 메모리 버스 및 DB에 공유 저장합니다.
    """
    global SHARED_LIVE_ROOMS
    try:
        if not payload.videos:
            raise HTTPException(status_code=400, detail="최소 1개 이상의 영입 비디오가 필요합니다.")

        total_duration = sum(v.duration_seconds for v in payload.videos)
        author_name = payload.author_name or "독고다이"
        unique_id = str(uuid.uuid4())[:8]

        created_videos = [
            {
                "id": f"v-{v.video_id}",
                "title": v.title,
                "platform": v.platform,
                "video_id": v.video_id,
                "duration_seconds": v.duration_seconds,
                "thumbnail_url": v.thumbnail_url,
                "channel_title": v.channel_title or "추천 채널"
            }
            for v in payload.videos
        ]

        room_id = f"pl-live-{unique_id}" if payload.is_live else f"pl-{unique_id}"

        res_data = {
            "id": room_id,
            "title": payload.title,
            "author": author_name,
            "author_id": "u-user",
            "category": payload.category,
            "total_duration_sec": total_duration,
            "fork_count": 0,
            "active_watchers": 1,
            "is_live": payload.is_live,
            "videos": created_videos
        }

        # ALWAYS insert into SHARED_LIVE_ROOMS in-memory list
        SHARED_LIVE_ROOMS = [r for r in SHARED_LIVE_ROOMS if r["id"] != res_data["id"]]
        SHARED_LIVE_ROOMS.insert(0, res_data)

        # Try DB persistence if db session is available
        if db is not None:
            try:
                stmt_user = select(UserModel).limit(1)
                res_user = await db.execute(stmt_user)
                user = res_user.scalars().first()
                author_id = user.id if user else 1

                new_playlist = PlaylistModel(
                    title=payload.title,
                    category=payload.category,
                    author_id=author_id,
                    total_duration_sec=total_duration,
                    fork_count=0
                )
                db.add(new_playlist)
                await db.commit()
            except Exception as db_err:
                print(f"DB save warning (memory list active): {db_err}")

        return {
            "success": True,
            "data": res_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"create_playlist error fallback: {e}")
        fallback_data = {
            "id": f"pl-live-{int(time.time())}",
            "title": payload.title,
            "author": payload.author_name or "독고다이",
            "author_id": "u-user",
            "category": payload.category,
            "total_duration_sec": sum(v.duration_seconds for v in payload.videos),
            "fork_count": 0,
            "active_watchers": 1,
            "is_live": payload.is_live,
            "videos": [
                {
                    "id": f"v-{v.video_id}",
                    "title": v.title,
                    "platform": v.platform,
                    "video_id": v.video_id,
                    "duration_seconds": v.duration_seconds,
                    "thumbnail_url": v.thumbnail_url,
                    "channel_title": v.channel_title
                }
                for v in payload.videos
            ]
        }
        SHARED_LIVE_ROOMS.insert(0, fallback_data)
        return {"success": True, "data": fallback_data}

@router.get("/{playlist_id}")
async def get_playlist_detail(playlist_id: str, db: AsyncSession = Depends(get_db)):
    """
    플레이리스트 상세 정보 조회
    """
    try:
        clean_id = int(playlist_id.replace("pl-", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="유효하지 않은 플레이리스트 ID입니다.")

    stmt = select(PlaylistModel).options(
        selectinload(PlaylistModel.author),
        selectinload(PlaylistModel.items).selectinload(PlaylistItem.video)
    ).where(PlaylistModel.id == clean_id)

    res = await db.execute(stmt)
    pl = res.scalars().first()
    if not pl:
        raise HTTPException(status_code=404, detail="플레이리스트를 찾을 수 없습니다.")

    return {
        "success": True,
        "data": {
            "id": f"pl-{pl.id}",
            "title": pl.title,
            "author": pl.author.nickname if pl.author else "익명",
            "author_id": f"u-{pl.author_id}",
            "category": pl.category,
            "total_duration_sec": pl.total_duration_sec,
            "fork_count": pl.fork_count,
            "videos": [
                {
                    "id": f"v-{item.video.id}",
                    "title": item.video.title,
                    "platform": item.video.platform,
                    "video_id": item.video.video_id,
                    "duration_seconds": item.video.duration_seconds,
                    "thumbnail_url": item.video.thumbnail_url,
                    "channel_title": item.video.channel_title
                }
                for item in pl.items
            ]
        }
    }

@router.post("/{playlist_id}/fork")
async def fork_playlist(playlist_id: str, db: AsyncSession = Depends(get_db)):
    """
    타 유저의 플레이리스트 원터치 포크 (PostgreSQL DB fork_count 업데이트 및 복제 생성)
    """
    try:
        clean_id = int(playlist_id.replace("pl-", "").replace("fork-", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="유효하지 않은 플레이리스트 ID입니다.")

    stmt = select(PlaylistModel).where(PlaylistModel.id == clean_id)
    res = await db.execute(stmt)
    original_pl = res.scalars().first()
    if not original_pl:
        raise HTTPException(status_code=404, detail="원작 플레이리스트를 찾을 수 없습니다.")

    original_pl.fork_count += 1

    forked_pl = PlaylistModel(
        title=f"{original_pl.title}",
        category=original_pl.category,
        author_id=original_pl.author_id,
        total_duration_sec=original_pl.total_duration_sec,
        fork_count=0,
        forked_from_id=original_pl.id
    )
    db.add(forked_pl)
    await db.commit()
    await db.refresh(original_pl)

    return {
        "success": True,
        "message": "플레이리스트가 PostgreSQL DB에 포크 저장되었습니다!",
        "original_fork_count": original_pl.fork_count
    }

@router.delete("/{playlist_id}")
async def delete_playlist(playlist_id: str, db: AsyncSession = Depends(get_db)):
    """
    내가 차린 밥상(플레이리스트) 및 공유 라이브 방 삭제 API
    """
    global SHARED_LIVE_ROOMS
    SHARED_LIVE_ROOMS = [r for r in SHARED_LIVE_ROOMS if r["id"] != playlist_id]
    try:
        clean_id_str = playlist_id.replace("pl-live-", "").replace("pl-my-", "").replace("pl-", "")
        clean_id = int(clean_id_str)
        stmt = select(PlaylistModel).where(PlaylistModel.id == clean_id)
        res = await db.execute(stmt)
        pl = res.scalars().first()
        if pl:
            await db.delete(pl)
            await db.commit()
    except Exception:
        pass
    return {"success": True, "message": "밥상 및 라이브 방이 삭제되었습니다."}
