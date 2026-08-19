import asyncio
import uuid
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set

router = APIRouter()

# In-Memory WebSocket Manager (coupled with Redis, Host State & Chat History)
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.room_hosts: Dict[str, str] = {} # playlist_id -> host_session_id
        self.room_chat_history: Dict[str, List[dict]] = {} # playlist_id -> List of recent 50 chat messages
        self.room_video_state: Dict[str, dict] = {} # playlist_id -> { "video": dict, "started_at": float }

    async def connect(self, playlist_id: str, websocket: WebSocket) -> str:
        await websocket.accept()
        if playlist_id not in self.active_connections:
            self.active_connections[playlist_id] = set()
        self.active_connections[playlist_id].add(websocket)

        session_id = str(uuid.uuid4())[:8]

        # 방장이 없으면 첫 번째 접속자가 방장(Host) 할당
        if playlist_id not in self.room_hosts or not self.active_connections[playlist_id]:
            self.room_hosts[playlist_id] = session_id

        # Redis Set에 활성 유저 세션 추가
        try:
            from app.core.redis import get_redis_client
            r = await get_redis_client()
            await r.sadd(f"presence:{playlist_id}", session_id)
        except Exception:
            pass

        # Send recent chat history (max 50) to newly connected user
        if playlist_id in self.room_chat_history and self.room_chat_history[playlist_id]:
            try:
                await websocket.send_json({
                    "type": "CHAT_HISTORY",
                    "playlist_id": playlist_id,
                    "history": self.room_chat_history[playlist_id]
                })
            except Exception:
                pass

        # Send current video playback state & elapsed time to newly connected user for 100% time sync
        if playlist_id in self.room_video_state and self.room_video_state[playlist_id]:
            try:
                st = self.room_video_state[playlist_id]
                import time
                elapsed = max(0, int(time.time() - st.get("started_at", time.time())))
                await websocket.send_json({
                    "type": "SYNC_VIDEO_STATE",
                    "playlist_id": playlist_id,
                    "video": st.get("video"),
                    "elapsed_seconds": elapsed
                })
            except Exception:
                pass

        await self.broadcast_count(playlist_id)
        return session_id

    async def disconnect(self, playlist_id: str, websocket: WebSocket, session_id: str):
        if playlist_id in self.active_connections:
            self.active_connections[playlist_id].discard(websocket)
            if not self.active_connections[playlist_id]:
                del self.active_connections[playlist_id]

        try:
            from app.core.redis import get_redis_client
            r = await get_redis_client()
            await r.srem(f"presence:{playlist_id}", session_id)
        except Exception:
            pass

        await self.broadcast_count(playlist_id)

    async def get_watcher_count(self, playlist_id: str) -> int:
        try:
            from app.core.redis import get_redis_client
            r = await get_redis_client()
            redis_count = await r.scard(f"presence:{playlist_id}")
            if redis_count > 0:
                return redis_count
        except Exception:
            pass
        return len(self.active_connections.get(playlist_id, set()))

    async def broadcast_count(self, playlist_id: str):
        count = await self.get_watcher_count(playlist_id)
        message = {
            "type": "PRESENCE_UPDATE",
            "playlist_id": playlist_id,
            "active_watchers": count
        }
        await self.broadcast_payload(playlist_id, message)

    async def broadcast_payload(self, playlist_id: str, payload: dict):
        dead_sockets = set()
        for socket in self.active_connections.get(playlist_id, set()):
            try:
                await socket.send_json(payload)
            except Exception:
                dead_sockets.add(socket)

        for dead in dead_sockets:
            self.active_connections[playlist_id].discard(dead)

manager = ConnectionManager()

@router.get("/{playlist_id}/count")
async def get_active_watchers_count(playlist_id: str):
    """
    Redis 인메모리 캐시 기반 현재 합석 동시 시청자 수 집계
    """
    count = await manager.get_watcher_count(playlist_id)
    return {"playlist_id": playlist_id, "active_watchers": count}

@router.websocket("/ws/{playlist_id}")
async def websocket_presence(websocket: WebSocket, playlist_id: str):
    """
    실시간 방장 합석 라이브 모드 & 실시간 채팅 / 영상 동기화 WebSocket 엔드포인트
    """
    session_id = await manager.connect(playlist_id, websocket)
    try:
        while True:
            text = await websocket.receive_text()
            if text == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    payload = json.loads(text)
                    msg_type = payload.get("type")

                    if msg_type == "CHAT_MESSAGE":
                        chat_event = {
                            "type": "CHAT_MESSAGE",
                            "playlist_id": playlist_id,
                            "nickname": payload.get("nickname", "익명의 밥상러"),
                            "text": payload.get("text", ""),
                            "timestamp": payload.get("timestamp"),
                            "is_host": payload.get("is_host", False),
                            "sender_id": payload.get("sender_id") or session_id,
                            "msg_id": payload.get("msg_id") or str(uuid.uuid4())
                        }
                        
                        # Store in room_chat_history (Max 50)
                        if playlist_id not in manager.room_chat_history:
                            manager.room_chat_history[playlist_id] = []
                        manager.room_chat_history[playlist_id].append(chat_event)
                        if len(manager.room_chat_history[playlist_id]) > 50:
                            manager.room_chat_history[playlist_id] = manager.room_chat_history[playlist_id][-50:]

                        await manager.broadcast_payload(playlist_id, chat_event)

                    elif msg_type == "HOST_CHANGE_VIDEO":
                        # 방장에 의한 영상 교체 동기화 및 시작 시각 타임스탬프 기록
                        video_payload = payload.get("video", {})
                        import time
                        manager.room_video_state[playlist_id] = {
                            "video": video_payload,
                            "started_at": time.time()
                        }

                        sync_event = {
                            "type": "HOST_CHANGE_VIDEO",
                            "playlist_id": playlist_id,
                            "video": video_payload,
                            "elapsed_seconds": 0,
                            "host_nickname": payload.get("host_nickname", "👑 방장"),
                            "system_message": f"👑 {payload.get('host_nickname', '방장')} 님이 실시간 반찬 영상을 교체하셨습니다!"
                        }
                        await manager.broadcast_payload(playlist_id, sync_event)

                except Exception:
                    pass
    except (WebSocketDisconnect, Exception):
        await manager.disconnect(playlist_id, websocket, session_id)
