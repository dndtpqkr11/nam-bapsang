from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./nambapsang.db"
)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

try:
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
except Exception as err:
    print(f"Primary DB engine init skipped: {err}")
    try:
        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False, future=True)
        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
    except Exception:
        engine = None
        AsyncSessionLocal = None

# Base Model Class
class Base(DeclarativeBase):
    pass

async def get_db():
    if AsyncSessionLocal is None:
        yield None
        return
    try:
        async with AsyncSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()
    except Exception as e:
        print(f"DB Session error fallback: {e}")
        yield None
