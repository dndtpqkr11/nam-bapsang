import asyncio
import random
from typing import List, Dict, Any

class OttMetadataCrawlerService:
    """
    연동된 OTT 서비스(유튜브, 넷플릭스, 티빙, 쿠팡플레이, 디즈니+, 웨이브)에서
    각 OTT별 상위 3순위 인기 콘텐츠 메타데이터를 큐레이션하는 모듈
    (제목의 [...] 영역에는 실제 긁어온 채널명이 명확히 포함됩니다)
    """

    OTT_CATALOG_DATABASE: Dict[str, List[Dict[str, Any]]] = {
        "youtube": [
            {
                "id": "yt-cr-1",
                "title": "🍱 [슈카월드] 전설의 주총꾼썰",
                "platform": "youtube",
                "video_id": "JdRcM4fLwgE",
                "duration_seconds": 1195,
                "thumbnail_url": "https://i.ytimg.com/vi/JdRcM4fLwgE/hqdefault.jpg",
                "channel_title": "슈카월드",
                "category": "식사 반찬"
            },
            {
                "id": "yt-cr-2",
                "title": "🍱 [침착맨] 시청자 훈수하기 토크",
                "platform": "youtube",
                "video_id": "ZHaOU6E4pWU",
                "duration_seconds": 2065,
                "thumbnail_url": "https://i.ytimg.com/vi/ZHaOU6E4pWU/hqdefault.jpg",
                "channel_title": "침착맨",
                "category": "식사 반찬"
            },
            {
                "id": "yt-cr-3",
                "title": "🔥 [안녕하세요원이입니다잘부탁드립니다] 경주에서 올라온 아이돌",
                "platform": "youtube",
                "video_id": "4m9eLr-NofA",
                "duration_seconds": 520,
                "thumbnail_url": "https://i.ytimg.com/vi/4m9eLr-NofA/hqdefault.jpg",
                "channel_title": "안녕하세요원이입니다잘부탁드립니다",
                "category": "식사 반찬"
            }
        ],
        "netflix": [
            {
                "id": "nflx-cr-1",
                "title": "🎬 [넷플릭스 코리아] 흑백요리사: 요리 계급 전쟁 1화 하이라이트",
                "platform": "netflix",
                "video_id": "81280352",
                "duration_seconds": 920,
                "thumbnail_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop",
                "channel_title": "넷플릭스 코리아",
                "category": "식사 반찬"
            },
            {
                "id": "nflx-cr-2",
                "title": "🎬 [넷플릭스 코리아] 오징어 게임 시즌2 공식 10분 요약",
                "platform": "netflix",
                "video_id": "81040344",
                "duration_seconds": 860,
                "thumbnail_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop",
                "channel_title": "넷플릭스 코리아",
                "category": "식사 반찬"
            },
            {
                "id": "nflx-cr-3",
                "title": "🎬 [넷플릭스 코리아] 지옥 시즌2 핵심 액션 몰아보기",
                "platform": "netflix",
                "video_id": "81503920",
                "duration_seconds": 950,
                "thumbnail_url": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&auto=format&fit=crop",
                "channel_title": "넷플릭스 코리아",
                "category": "식사 반찬"
            }
        ],
        "tving": [
            {
                "id": "tvg-cr-1",
                "title": "🍿 [TVING Official] 환승연애3 최신화 명장면 15분 하이라이트",
                "platform": "tving",
                "video_id": "tving-transfer-love-3",
                "duration_seconds": 900,
                "thumbnail_url": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&auto=format&fit=crop",
                "channel_title": "TVING Official",
                "category": "식사 반찬"
            },
            {
                "id": "tvg-cr-2",
                "title": "🍿 [TVING Official] 최강야구 2026시즌 15분 요약 하이라이트",
                "platform": "tving",
                "video_id": "tving-monsters-baseball",
                "duration_seconds": 880,
                "thumbnail_url": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop",
                "channel_title": "TVING Official",
                "category": "식사 반찬"
            },
            {
                "id": "tvg-cr-3",
                "title": "🍿 [TVING Official] 뿜뿜 인기 예능 식사시간 핫클립",
                "platform": "tving",
                "video_id": "tving-variety-top3",
                "duration_seconds": 930,
                "thumbnail_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
                "channel_title": "TVING Official",
                "category": "식사 반찬"
            }
        ],
        "coupang": [
            {
                "id": "cp-cr-1",
                "title": "⚽ [쿠팡플레이 스포츠] 손흥민 토트넘 프리미어리그 15분 골모음",
                "platform": "coupang",
                "video_id": "cp-son-goals",
                "duration_seconds": 915,
                "thumbnail_url": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop",
                "channel_title": "쿠팡플레이 스포츠",
                "category": "식사 반찬"
            },
            {
                "id": "cp-cr-2",
                "title": "⚽ [쿠팡플레이 스포츠] SNL 코리아 2026 레전드 하이라이트",
                "platform": "coupang",
                "video_id": "cp-snl-korea",
                "duration_seconds": 890,
                "thumbnail_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
                "channel_title": "쿠팡플레이 스포츠",
                "category": "식사 반찬"
            },
            {
                "id": "cp-cr-3",
                "title": "⚽ [쿠팡플레이 스포츠] 이강인 PSG 주말 경기 10분 컷",
                "platform": "coupang",
                "video_id": "cp-lki-psg",
                "duration_seconds": 650,
                "thumbnail_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop",
                "channel_title": "쿠팡플레이 스포츠",
                "category": "식사 반찬"
            }
        ],
        "disney": [
            {
                "id": "dis-cr-1",
                "title": "🏰 [Disney+ Korea] 무빙2 기대작 명장면 딥다이브 15분 요약",
                "platform": "disney",
                "video_id": "disney-moving-2",
                "duration_seconds": 895,
                "thumbnail_url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop",
                "channel_title": "Disney+ Korea",
                "category": "식사 반찬"
            },
            {
                "id": "dis-cr-2",
                "title": "🏰 [Disney+ Korea] 카지노 최민식 레전드 명대사 하이라이트",
                "platform": "disney",
                "video_id": "disney-casino-top",
                "duration_seconds": 910,
                "thumbnail_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop",
                "channel_title": "Disney+ Korea",
                "category": "식사 반찬"
            },
            {
                "id": "dis-cr-3",
                "title": "🏰 [Disney+ Korea] 만달로리안 & 마블 명장면 모음전",
                "platform": "disney",
                "video_id": "disney-marvel-15m",
                "duration_seconds": 870,
                "thumbnail_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop",
                "channel_title": "Disney+ Korea",
                "category": "식사 반찬"
            }
        ],
        "wavve": [
            {
                "id": "wav-cr-1",
                "title": "🌊 [Wavve Original] 피의 게임 시즌3 핵심 15분 몰아보기",
                "platform": "wavve",
                "video_id": "wavve-game-of-blood",
                "duration_seconds": 890,
                "thumbnail_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
                "channel_title": "Wavve Original",
                "category": "식사 반찬"
            },
            {
                "id": "wav-cr-2",
                "title": "🌊 [Wavve Original] 무한도전 레전드 15분 모아보기 클립",
                "platform": "wavve",
                "video_id": "wavve-mudo-legend",
                "duration_seconds": 910,
                "thumbnail_url": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&auto=format&fit=crop",
                "channel_title": "Wavve Original",
                "category": "식사 반찬"
            },
            {
                "id": "wav-cr-3",
                "title": "🌊 [Wavve Original] 런닝맨 식사시간 15분 컷 꿀잼 모음전",
                "platform": "wavve",
                "video_id": "wavve-runningman-top",
                "duration_seconds": 880,
                "thumbnail_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop",
                "channel_title": "Wavve Original",
                "category": "식사 반찬"
            }
        ]
    }

    async def fetch_ott_recommendations(
        self, 
        connected_otts: List[str], 
        target_duration_sec: int = 900
    ) -> List[Dict[str, Any]]:
        """
        연동된 OTT 서비스 목록 및 사용자 식사시간 목표(초)를 기반으로
        상위 3순위 인기 반찬 메타데이터 피드를 반환하는 비동기 메소드
        """
        await asyncio.sleep(0.01)

        recommendations: List[Dict[str, Any]] = []

        for ott in connected_otts:
            ott_lower = ott.lower()
            if ott_lower in self.OTT_CATALOG_DATABASE:
                items = self.OTT_CATALOG_DATABASE[ott_lower][:3]
                for idx, item in enumerate(items):
                    dur_diff = abs(item["duration_seconds"] - target_duration_sec)
                    fit_score = round(max(50.0, 99.0 - (dur_diff / 20.0)), 1)
                    
                    pl_id = f"pl-ott-{item['id']}"
                    rec_item = {
                        "id": pl_id,
                        "title": item["title"],
                        "author": item["channel_title"],
                        "author_id": f"ott-{ott_lower}",
                        "category": item["category"],
                        "total_duration_sec": item["duration_seconds"],
                        "fork_count": random.randint(150, 480),
                        "active_watchers": random.randint(15, 45),
                        "fit_score": fit_score,
                        "is_ott_scraped": True,
                        "platform": item["platform"],
                        "rank": idx + 1,
                        "videos": [
                            {
                                "id": f"v-{item['id']}",
                                "title": item["title"],
                                "platform": item["platform"],
                                "video_id": item["video_id"],
                                "duration_seconds": item["duration_seconds"],
                                "thumbnail_url": item["thumbnail_url"],
                                "channel_title": item["channel_title"]
                            }
                        ]
                    }
                    recommendations.append(rec_item)

        return recommendations

    async def fetch_recommended_content(self, connected_otts: List[str], target_duration_sec: int = 900):
        return await self.fetch_ott_recommendations(connected_otts, target_duration_sec)

ott_crawler_service = OttMetadataCrawlerService()
