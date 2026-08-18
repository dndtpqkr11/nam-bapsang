from fastapi import APIRouter, Query
from typing import List, Optional
from app.services.ott_crawler import ott_crawler_service

router = APIRouter()

@router.get("/recommendations")
async def get_ott_crawled_recommendations(
    platforms: str = Query(default="youtube,netflix", description="쉼표로 구분된 연동 OTT 플랫폼 목록"),
    target_runtime: int = Query(default=900, description="목표 러닝타임(초)")
):
    """
    연동된 OTT 서비스(유튜브, 넷플릭스, 티빙, 쿠팡플레이, 디즈니+, 웨이브)에서
    실시간으로 긁어온 15분 맞춤 밥상 큐레이션 결과를 반환합니다.
    """
    platform_list = [p.strip() for p in platforms.split(",") if p.strip()]
    recommendations = await ott_crawler_service.fetch_ott_recommendations(platform_list, target_runtime)
    
    return {
        "success": True,
        "connected_count": len(platform_list),
        "platforms": platform_list,
        "total_crawled_count": len(recommendations),
        "data": recommendations
    }
