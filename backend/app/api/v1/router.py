from fastapi import APIRouter
from app.api.v1.endpoints import videos, playlists, presence, recommendations, auth, ott

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth & Profile"])
api_router.include_router(videos.router, prefix="/videos", tags=["Videos & DeepLink"])
api_router.include_router(playlists.router, prefix="/playlists", tags=["Playlists & Fork"])
api_router.include_router(presence.router, prefix="/presence", tags=["Realtime Presence (합석 모드)"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["ML Curation"])
api_router.include_router(ott.router, prefix="/ott", tags=["OTT Crawler & Curation"])
