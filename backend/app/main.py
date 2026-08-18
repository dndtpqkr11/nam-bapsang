from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.api.v1.endpoints.presence import websocket_presence

app = FastAPI(
    title="남의 밥상 (MealTable) API",
    description="15분 맞춤형 OTT 플레이리스트 공유 및 실시간 소셜 시청 플랫폼 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.websocket("/ws/{playlist_id}")
@app.websocket("/api/v1/presence/ws/{playlist_id}")
async def direct_websocket(websocket: WebSocket, playlist_id: str):
    await websocket_presence(websocket, playlist_id)

@app.on_event("startup")
async def on_startup():
    # 테이블 자동 생성 (개발 환경)
    try:
        from app.core.database import engine, Base
        import app.models  # Register ORM models
        if engine is not None:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("Database tables initialized.")
    except Exception as e:
        print(f"DB connection skipped or failed: {e}")

@app.get("/")
async def root():
    return {
        "service": "남의 밥상 (MealTable)",
        "status": "online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
