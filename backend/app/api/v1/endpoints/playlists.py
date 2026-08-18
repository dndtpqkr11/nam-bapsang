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
    db: AsyncSession = Depends(get_db)
):
    """
    PostgreSQL DB 및 공유 라이브 피드에서 플레이리스트 피드를 조회합니다.
    """
    try:
        stmt = select(PlaylistModel).options(
            selectinload(PlaylistModel.author),
            selectinload(PlaylistModel.items).selectinload(PlaylistItem.video)
        )
        if category:
            stmt = stmt.where(PlaylistModel.category == category)

        result = await db.execute(stmt)
        playlists = result.scalars().all()

        formatted_data = list(SHARED_LIVE_ROOMS)
        for pl in playlists:
            formatted_data.append({
                "id": f"pl-{pl.id}",
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

        return {"success": True, "count": len(formatted_data), "data": formatted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB 조회 에러: {str(e)}")

@router.post("")
async def create_playlist(
    payload: CreatePlaylistRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    새로운 15분 식사 맞춤 밥상(플레이리스트)을 생성하고 PostgreSQL DB에 저장합니다.
    """
    try:
        if not payload.videos:
            raise HTTPException(status_code=400, detail="최소 1개 이상의 영입 비디오가 필요합니다.")

        # 1. 작성자 유저 확인 (없으면 기본 1번 유저)
        stmt_user = select(UserModel).limit(1)
        res_user = await db.execute(stmt_user)
        user = res_user.scalars().first()
        author_id = user.id if user else 1

        total_duration = sum(v.duration_seconds for v in payload.videos)

        # 2. 플레이리스트 객체 생성
        new_playlist = PlaylistModel(
            title=payload.title,
            category=payload.category,
            author_id=author_id,
            total_duration_sec=total_duration,
            fork_count=0
        )
        db.add(new_playlist)
        await db.flush()

        # 3. 비디오 레코드 DB 할당 및 매핑
        created_videos = []
        for index, item in enumerate(payload.videos):
            stmt_v = select(VideoModel).where(VideoModel.platform == item.platform, VideoModel.video_id == item.video_id)
            res_v = await db.execute(stmt_v)
            vid = res_v.scalars().first()

            if not vid:
                vid = VideoModel(
                    platform=item.platform,
                    video_id=item.video_id,
                    title=item.title,
                    thumbnail_url=item.thumbnail_url,
                    duration_seconds=item.duration_seconds,
                    channel_title=item.channel_title
                )
                db.add(vid)
                await db.flush()

            playlist_item = PlaylistItem(
                playlist_id=new_playlist.id,
                video_id=vid.id,
                position=index
            )
            db.add(playlist_item)

            created_videos.append({
                "id": f"v-{vid.id}",
                "title": vid.title,
                "platform": vid.platform,
                "video_id": vid.video_id,
                "duration_seconds": vid.duration_seconds,
                "thumbnail_url": vid.thumbnail_url,
                "channel_title": vid.channel_title
            })

        await db.commit()
        await db.refresh(new_playlist)

        author_name = payload.author_name or (user.nickname if user else "독고다이")
        res_data = {
            "id": f"pl-live-{new_playlist.id}" if payload.is_live else f"pl-{new_playlist.id}",
            "title": new_playlist.title,
            "author": author_name,
            "author_id": f"u-{author_id}",
            "category": new_playlist.category,
            "total_duration_sec": total_duration,
            "fork_count": 0,
            "active_watchers": 1,
            "is_live": payload.is_live,
            "videos": created_videos
        }

        if payload.is_live:
            # Remove any duplicate room with same ID
            global SHARED_LIVE_ROOMS
            SHARED_LIVE_ROOMS = [r for r in SHARED_LIVE_ROOMS if r["id"] != res_data["id"]]
            SHARED_LIVE_ROOMS.insert(0, res_data)

        return {
            "success": True,
            "data": res_data
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"밥상 차리기 실패: {str(e)}")

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
