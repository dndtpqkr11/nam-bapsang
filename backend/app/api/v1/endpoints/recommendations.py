from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
import pandas as pd
from app.core.database import get_db
from app.models.playlist import Playlist as PlaylistModel, PlaylistItem
from app.ml.cluster_model import MealtimeCurationEngine

router = APIRouter()
curation_engine = MealtimeCurationEngine()

CLUSTER_LABELS = {
  0: "군집 #0 (지식/인포테인먼트 파)",
  1: "군집 #1 (예능/Shorts 파)",
  2: "군집 #2 (영화/드라마 몰아보기 파)",
  3: "군집 #3 (테크/IT 리뷰 파)"
}

@router.get("/mealtime")
async def get_mealtime_recommendations(
    target_sec: Optional[int] = Query(default=900, description="목표 식사 시간(초 단위, 기본 900초=15분)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Pandas 전처리를 활용하여 목표 식사 시간(15분 ± 3분)에 가장 부합하는 플레이리스트 피드를 반환합니다.
    """
    stmt = select(PlaylistModel).options(
        selectinload(PlaylistModel.author),
        selectinload(PlaylistModel.items).selectinload(PlaylistItem.video)
    )
    res = await db.execute(stmt)
    playlists = res.scalars().all()

    if not playlists:
        return {"success": True, "target_mealtime_sec": target_sec, "recommended": []}

    raw_data = []
    for pl in playlists:
        raw_data.append({
            "id": f"pl-{pl.id}",
            "title": pl.title,
            "author": pl.author.nickname if pl.author else "익명",
            "category": pl.category,
            "total_duration_sec": pl.total_duration_sec,
            "fork_count": pl.fork_count,
            "videos_count": len(pl.items)
        })

    df = pd.DataFrame(raw_data)
    engine = MealtimeCurationEngine(target_duration_sec=target_sec)
    filtered_df = engine.filter_playlists_by_mealtime(df)

    return {
        "success": True,
        "target_mealtime_sec": target_sec,
        "count": len(filtered_df),
        "recommended": filtered_df.to_dict(orient="records")
    }

@router.get("/cluster")
async def get_cluster_recommendations(
    user_id: int = Query(default=1, description="유저 ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    TensorFlow 유저 임베딩 및 군집화(Clustering) 모델 기반 맞춤 추천 피드를 반환합니다.
    """
    # 10개 카테고리 선호도 벡터 스코어 예시 [경제, 인포테인먼트, 먹방, 예능, 드라마, 기술, 스포츠, 음악, 영화, 뉴스]
    mock_category_scores = [0.8, 0.9, 0.2, 0.4, 0.1, 0.7, 0.0, 0.3, 0.5, 0.6]
    cluster_id = curation_engine.predict_user_cluster(user_id, mock_category_scores)
    cluster_label = CLUSTER_LABELS.get(cluster_id, f"군집 #{cluster_id}")

    # Fetch playlists from DB to recommend for this cluster
    stmt = select(PlaylistModel).options(
        selectinload(PlaylistModel.author),
        selectinload(PlaylistModel.items).selectinload(PlaylistItem.video)
    ).limit(3)
    res = await db.execute(stmt)
    playlists = res.scalars().all()

    recommended_items = []
    for pl in playlists:
        recommended_items.append({
            "id": f"pl-{pl.id}",
            "title": pl.title,
            "author": pl.author.nickname if pl.author else "익명",
            "category": pl.category,
            "total_duration_sec": pl.total_duration_sec,
            "fork_count": pl.fork_count
        })

    return {
        "success": True,
        "user_id": user_id,
        "assigned_cluster_id": cluster_id,
        "assigned_cluster": cluster_label,
        "recommendation_reason": "비슷한 시청 습관 및 포크 기록을 가진 유저 군집이 즐겨찾은 15분 플레이리스트입니다.",
        "recommended_playlists": recommended_items
    }
