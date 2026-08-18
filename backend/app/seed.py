import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import engine, Base, AsyncSessionLocal
from app.models.user import User
from app.models.video import Video
from app.models.playlist import Playlist, PlaylistItem
from app.models.fork_log import ForkLog

async def seed_database():
    print("Database re-seeding started with verified popular YouTube videos...")
    
    # Recreate tables to ensure fresh clean state
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Seed users
        u1 = User(email="syuka@bapsang.com", hashed_password="hashed_pw_1", nickname="슈카월드", total_fork_earned=452)
        u2 = User(email="chim@bapsang.com", hashed_password="hashed_pw_2", nickname="침착맨", total_fork_earned=398)
        u3 = User(email="ahn@bapsang.com", hashed_password="hashed_pw_3", nickname="안녕하세요원이입니다잘부탁드립니다", total_fork_earned=212)
        u4 = User(email="hell@bapsang.com", hashed_password="hashed_pw_4", nickname="불지옥 피트니스", total_fork_earned=256)
        u5 = User(email="oseon@bapsang.com", hashed_password="hashed_pw_5", nickname="오선의 미국 증시 라이브", total_fork_earned=195)
        u6 = User(email="itsub@bapsang.com", hashed_password="hashed_pw_6", nickname="ITSub잇섭", total_fork_earned=380)
        u7 = User(email="short@bapsang.com", hashed_password="hashed_pw_7", nickname="숏박스", total_fork_earned=310)
        u8 = User(email="psick@bapsang.com", hashed_password="hashed_pw_8", nickname="피식대학Psick Univ", total_fork_earned=265)

        session.add_all([u1, u2, u3, u4, u5, u6, u7, u8])
        await session.commit()
        for u in [u1, u2, u3, u4, u5, u6, u7, u8]:
            await session.refresh(u)

        # Seed 8 standalone single-video items with REAL YouTube video IDs & exact scraped channel_title in [...]
        videos_data = [
          {
            "user": u1,
            "title": "🍱 [슈카월드] 전설의 주총꾼썰",
            "video_id": "JdRcM4fLwgE",
            "duration": 1195,
            "channel": "슈카월드",
            "thumb": "https://i.ytimg.com/vi/JdRcM4fLwgE/hqdefault.jpg",
            "forks": 452
          },
          {
            "user": u2,
            "title": "🍱 [침착맨] 시청자 밥상머리 훈수하기 꿀잼 토크",
            "video_id": "ZHaOU6E4pWU",
            "duration": 2065,
            "channel": "침착맨",
            "thumb": "https://i.ytimg.com/vi/ZHaOU6E4pWU/hqdefault.jpg",
            "forks": 398
          },
          {
            "user": u3,
            "title": "🔥 [안녕하세요원이입니다잘부탁드립니다] 경주에서 올라온 아이돌",
            "video_id": "4m9eLr-NofA",
            "duration": 520,
            "channel": "안녕하세요원이입니다잘부탁드립니다",
            "thumb": "https://i.ytimg.com/vi/4m9eLr-NofA/hqdefault.jpg",
            "forks": 212
          },
          {
            "user": u4,
            "title": "💪 [불지옥 피트니스] 보디빌더 김강민 오픈 전향 & 분석",
            "video_id": "i793jZWW0Sw",
            "duration": 639,
            "channel": "불지옥 피트니스",
            "thumb": "https://i.ytimg.com/vi/i793jZWW0Sw/hqdefault.jpg",
            "forks": 256
          },
          {
            "user": u5,
            "title": "🎧 [오선의 미국 증시 라이브] 실적 브리핑 & 증시 핫클립 라이브",
            "video_id": "skKZ-Kv5xWw",
            "duration": 750,
            "channel": "오선의 미국 증시 라이브",
            "thumb": "https://i.ytimg.com/vi/skKZ-Kv5xWw/hqdefault.jpg",
            "forks": 195
          },
          {
            "user": u6,
            "title": "📱 [ITSub잇섭] 지금 난리난 갤럭시 S26 이슈? 솔직 가성비 리뷰",
            "video_id": "TigCEb283aU",
            "duration": 707,
            "channel": "ITSub잇섭",
            "thumb": "https://i.ytimg.com/vi/TigCEb283aU/hqdefault.jpg",
            "forks": 380
          },
          {
            "user": u7,
            "title": "🍜 [숏박스] 나 잠깐 누워있는 거야",
            "video_id": "QohVI6EXAGM",
            "duration": 390,
            "channel": "숏박스",
            "thumb": "https://i.ytimg.com/vi/QohVI6EXAGM/hqdefault.jpg",
            "forks": 310
          },
          {
            "user": u8,
            "title": "🍕 [피식대학Psick Univ] 명예영국인 진에게 한국말로 묻다",
            "video_id": "C93ONUWK308",
            "duration": 820,
            "channel": "피식대학Psick Univ",
            "thumb": "https://i.ytimg.com/vi/C93ONUWK308/hqdefault.jpg",
            "forks": 265
          }
        ]

        for item in videos_data:
            vid = Video(
                platform="youtube",
                video_id=item["video_id"],
                title=item["title"],
                thumbnail_url=item["thumb"],
                duration_seconds=item["duration"],
                channel_title=item["channel"]
            )
            session.add(vid)
            await session.commit()
            await session.refresh(vid)

            pl = Playlist(
                title=item["title"],
                category="식사 반찬",
                author_id=item["user"].id,
                total_duration_sec=item["duration"],
                fork_count=item["forks"]
            )
            session.add(pl)
            await session.commit()
            await session.refresh(pl)

            pi = PlaylistItem(playlist_id=pl.id, video_id=vid.id, sequence_order=0)
            session.add(pi)
            await session.commit()

    print("Database re-seeded with exact channel titles in [...] successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())
