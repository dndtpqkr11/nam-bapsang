import redis.asyncio as aioredis
import os
from typing import Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client: Optional[aioredis.Redis] = None

async def get_redis_client() -> aioredis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    return redis_client
