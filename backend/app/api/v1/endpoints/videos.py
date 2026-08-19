from fastapi import APIRouter, HTTPException, Header, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.video import Video as VideoModel
from app.services.youtube import YouTubeMetadataService

router = APIRouter()
yt_service = YouTubeMetadataService()

class VideoParseRequest(BaseModel):
    url: str

@router.get("/search")
async def search_youtube(q: str = Query(..., description="유튜브 검색 키워드 또는 URL")):
    """
    유튜브 검색창 키워드 연동 및 영상 긁어오기 API
    """
    items = await yt_service.search_youtube_videos(q)
    return {"success": True, "count": len(items), "data": items}

@router.get("/trending")
async def get_youtube_trending():
    """
    유튜브 알고리즘 실시간 인기 동영상 순위 모음 반환 (yt-dlp 실시간 스크래퍼)
    """
    items = await yt_service.get_youtube_trending_videos()
    return {"success": True, "data": items}

@router.post("/parse")
async def parse_video_url(req: VideoParseRequest, db: AsyncSession = Depends(get_db)):
    """
    1. 유튜브/OTT URL에서 비디오 ID 추출
    2. yt-dlp 실시간 스크래핑으로 100% 실제 러닝타임 및 제목 추출
    3. PostgreSQL DB 캐시 저장 및 동기화
    """
    video_id = yt_service.extract_video_id(req.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="유효하지 않은 YouTube URL 형식입니다.")

    # 1. On-Demand Fetch via YouTube yt-dlp / API
    try:
        metadata = await yt_service.get_video_metadata(req.url)

        # DB Caching Check
        stmt = select(VideoModel).where(VideoModel.platform == "youtube", VideoModel.video_id == video_id)
        res = await db.execute(stmt)
        existing_video = res.scalars().first()

        if existing_video:
            # 기존 캐시가 더미 데이터였을 경우 실시간 수집 메타데이터로 업데이트
            existing_video.title = metadata["title"]
            existing_video.thumbnail_url = metadata["thumbnail_url"]
            existing_video.duration_seconds = metadata["duration_seconds"]
            existing_video.channel_title = metadata["channel_title"]
            await db.commit()
            await db.refresh(existing_video)

            return {
                "success": True,
                "cached": True,
                "data": {
                    "id": f"v-{existing_video.id}",
                    "platform": existing_video.platform,
                    "video_id": existing_video.video_id,
                    "title": existing_video.title,
                    "thumbnail_url": existing_video.thumbnail_url,
                    "duration_seconds": existing_video.duration_seconds,
                    "channel_title": existing_video.channel_title
                }
            }

        # 신규 DB 수집 저장
        new_video = VideoModel(
            platform=metadata["platform"],
            video_id=metadata["video_id"],
            title=metadata["title"],
            thumbnail_url=metadata["thumbnail_url"],
            duration_seconds=metadata["duration_seconds"],
            channel_title=metadata["channel_title"]
        )
        db.add(new_video)
        await db.commit()
        await db.refresh(new_video)

        return {
            "success": True,
            "cached": False,
            "data": {
                "id": f"v-{new_video.id}",
                "platform": new_video.platform,
                "video_id": new_video.video_id,
                "title": new_video.title,
                "thumbnail_url": new_video.thumbnail_url,
                "duration_seconds": new_video.duration_seconds,
                "channel_title": new_video.channel_title
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"메타데이터 추출 실패: {str(e)}")

@router.get("/{platform}/{content_id}/redirect")
async def get_deeplink_redirect(platform: str, content_id: str, user_agent: str = Header(default="")):
    """
    영상 클릭 시 원본 앱/웹 딥링크 라우팅 정보 반환 (트래픽 0%)
    """
    routing_info = DeepLinkRouter.generate_routing_info(platform, content_id, user_agent)
    return {"success": True, "routing": routing_info}
