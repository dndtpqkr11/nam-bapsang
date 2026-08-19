'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { PlaylistCard } from '@/components/PlaylistCard';
import { UrlParserInput } from '@/components/UrlParserInput';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { OttConnectModal } from '@/components/OttConnectModal';
import { Playlist, Video } from '@/types';
import { fetchPlaylists, fetchOttRecommendations, forkPlaylist, createPlaylist, deletePlaylist, fetchYouTubeTrendingVideos } from '@/lib/api';
import { rankAndRecommendPlaylists } from '@/lib/recommendationEngine';
import { formatSecondsToMMSS } from '@/lib/deeplink';
import { 
  Flame, Clock, Sparkles, Filter, Users, X, CheckCircle2, Search, 
  Zap, ArrowLeft, ChevronRight, Tv, Radio, Utensils, Trash2, Users2, Eye, Globe, Share2, Play, Eye as ViewIcon, TrendingUp, Loader2, Pencil, Timer, Link2, Crown
} from 'lucide-react';

const FALLBACK_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-1',
    title: '🍱 [슈카월드] 전설의 주총꾼썰',
    author: '김철수',
    author_id: 'u-1',
    category: '식사 반찬',
    total_duration_sec: 1195,
    fork_count: 452,
    active_watchers: 38,
    videos: [
      {
        id: 'v-1',
        title: '[레전썰] 10만명이 봤던 전설의 주총꾼썰',
        platform: 'youtube',
        video_id: 'JdRcM4fLwgE',
        duration_seconds: 1195,
        thumbnail_url: 'https://i.ytimg.com/vi/JdRcM4fLwgE/hqdefault.jpg',
        channel_title: '슈카월드'
      }
    ]
  },
  {
    id: 'pl-2',
    title: '🍱 [침착맨] 시청자 밥상머리 훈수하기 꿀잼 토크',
    author: '김영희',
    author_id: 'u-2',
    category: '식사 반찬',
    total_duration_sec: 2065,
    fork_count: 398,
    active_watchers: 44,
    videos: [
      {
        id: 'v-2',
        title: '시청자 밥상머리 훈수하기 꿀잼 토크',
        platform: 'youtube',
        video_id: 'ZHaOU6E4pWU',
        duration_seconds: 2065,
        thumbnail_url: 'https://i.ytimg.com/vi/ZHaOU6E4pWU/hqdefault.jpg',
        channel_title: '침착맨'
      }
    ]
  },
  {
    id: 'pl-3',
    title: '🔥 [안녕하세요원이입니다잘부탁드립니다] 경주에서 올라온 아이돌',
    author: '이영희',
    author_id: 'u-3',
    category: '식사 반찬',
    total_duration_sec: 520,
    fork_count: 212,
    active_watchers: 19,
    videos: [
      {
        id: 'v-3',
        title: '경주에서 올라온 아이돌',
        platform: 'youtube',
        video_id: '4m9eLr-NofA',
        duration_seconds: 520,
        thumbnail_url: 'https://i.ytimg.com/vi/4m9eLr-NofA/hqdefault.jpg',
        channel_title: '안녕하세요원이입니다잘부탁드립니다'
      }
    ]
  },
  {
    id: 'pl-4',
    title: '💪 [불지옥 피트니스] 보디빌더 김강민 오픈 전향 & 분석',
    author: '박민수',
    author_id: 'u-4',
    category: '식사 반찬',
    total_duration_sec: 639,
    fork_count: 256,
    active_watchers: 22,
    videos: [
      {
        id: 'v-4',
        title: "'나바 황제' 보디빌더 김강민 분석 & 근손실 방지",
        platform: 'youtube',
        video_id: 'i793jZWW0Sw',
        duration_seconds: 639,
        thumbnail_url: 'https://i.ytimg.com/vi/i793jZWW0Sw/hqdefault.jpg',
        channel_title: '불지옥 피트니스'
      }
    ]
  },
  {
    id: 'pl-5',
    title: '🎧 [오선의 미국 증시 라이브] 실적 브리핑 & 증시 핫클립 라이브',
    author: '정수진',
    author_id: 'u-5',
    category: '식사 반찬',
    total_duration_sec: 750,
    fork_count: 195,
    active_watchers: 15,
    videos: [
      {
        id: 'v-5',
        title: '실적 브리핑 & 증시 이슈 핫클립',
        platform: 'youtube',
        video_id: 'skKZ-Kv5xWw',
        duration_seconds: 750,
        thumbnail_url: 'https://i.ytimg.com/vi/skKZ-Kv5xWw/hqdefault.jpg',
        channel_title: '오선의 미국 증시 라이브'
      }
    ]
  },
  {
    id: 'pl-6',
    title: '📱 [ITSub잇섭] 지금 난리난 갤럭시 S26 이슈? 솔직 가성비 리뷰',
    author: 'ITSub잇섭',
    author_id: 'u-6',
    category: '식사 반찬',
    total_duration_sec: 707,
    fork_count: 380,
    active_watchers: 27,
    videos: [
      {
        id: 'v-6',
        title: '지금 난리난 갤럭시 S26 이슈? 제발! 꼭 확인해보세요',
        platform: 'youtube',
        video_id: 'TigCEb283aU',
        duration_seconds: 707,
        thumbnail_url: 'https://i.ytimg.com/vi/TigCEb283aU/hqdefault.jpg',
        channel_title: 'ITSub잇섭'
      }
    ]
  },
  {
    id: 'pl-7',
    title: '🍜 [숏박스] 나 잠깐 누워있는 거야',
    author: '숏박스',
    author_id: 'u-7',
    category: '식사 반찬',
    total_duration_sec: 390,
    fork_count: 310,
    active_watchers: 42,
    videos: [
      {
        id: 'v-7',
        title: '나 잠깐 누워있는 거야',
        platform: 'youtube',
        video_id: 'QohVI6EXAGM',
        duration_seconds: 390,
        thumbnail_url: 'https://i.ytimg.com/vi/QohVI6EXAGM/hqdefault.jpg',
        channel_title: '숏박스'
      }
    ]
  },
  {
    id: 'pl-8',
    title: '🍕 [피식대학Psick Univ] 명예영국인 진에게 한국말로 묻다',
    author: '피식대학Psick Univ',
    author_id: 'u-8',
    category: '식사 반찬',
    total_duration_sec: 820,
    fork_count: 265,
    active_watchers: 31,
    videos: [
      {
        id: 'v-8',
        title: '[한글자막] 명예영국인 진에게 한국말로 묻다',
        platform: 'youtube',
        video_id: 'C93ONUWK308',
        duration_seconds: 820,
        thumbnail_url: 'https://i.ytimg.com/vi/C93ONUWK308/hqdefault.jpg',
        channel_title: '피식대학Psick Univ'
      }
    ]
  }
];

function generateFallbackOttPlaylists(savedOtts: string[]): Playlist[] {
  const catalog: Record<string, Playlist[]> = {
    youtube: [
      {
        id: 'pl-ott-yt-1',
        title: '🍱 [슈카월드] 전설의 주총꾼썰',
        author: '슈카월드',
        author_id: 'ott-youtube',
        category: '식사 반찬',
        total_duration_sec: 1195,
        fork_count: 452,
        active_watchers: 38,
        is_ott_scraped: true,
        platform: 'youtube',
        videos: [{
          id: 'v-yt-1',
          title: '[레전썰] 10만명이 봤던 전설의 주총꾼썰',
          platform: 'youtube',
          video_id: 'JdRcM4fLwgE',
          duration_seconds: 1195,
          thumbnail_url: 'https://i.ytimg.com/vi/JdRcM4fLwgE/hqdefault.jpg',
          channel_title: '슈카월드'
        }]
      },
      {
        id: 'pl-ott-yt-2',
        title: '🍱 [침착맨] 시청자 훈수하기 토크',
        author: '침착맨',
        author_id: 'ott-youtube',
        category: '식사 반찬',
        total_duration_sec: 2065,
        fork_count: 398,
        active_watchers: 44,
        is_ott_scraped: true,
        platform: 'youtube',
        videos: [{
          id: 'v-yt-2',
          title: '시청자 밥상머리 훈수하기 꿀잼 토크',
          platform: 'youtube',
          video_id: 'ZHaOU6E4pWU',
          duration_seconds: 2065,
          thumbnail_url: 'https://i.ytimg.com/vi/ZHaOU6E4pWU/hqdefault.jpg',
          channel_title: '침착맨'
        }]
      },
      {
        id: 'pl-ott-yt-3',
        title: '🔥 [안녕하세요원이입니다잘부탁드립니다] 경주에서 올라온 아이돌',
        author: '안녕하세요원이입니다잘부탁드립니다',
        author_id: 'ott-youtube',
        category: '식사 반찬',
        total_duration_sec: 520,
        fork_count: 212,
        active_watchers: 19,
        is_ott_scraped: true,
        platform: 'youtube',
        videos: [{
          id: 'v-yt-3',
          title: '경주에서 올라온 아이돌',
          platform: 'youtube',
          video_id: '4m9eLr-NofA',
          duration_seconds: 520,
          thumbnail_url: 'https://i.ytimg.com/vi/4m9eLr-NofA/hqdefault.jpg',
          channel_title: '안녕하세요원이입니다잘부탁드립니다'
        }]
      }
    ],
    netflix: [
      {
        id: 'pl-ott-nflx-1',
        title: '🎬 [넷플릭스 코리아] 흑백요리사: 요리 계급 전쟁 1화 하이라이트',
        author: '넷플릭스 코리아',
        author_id: 'ott-netflix',
        category: '식사 반찬',
        total_duration_sec: 920,
        fork_count: 289,
        active_watchers: 34,
        is_ott_scraped: true,
        platform: 'netflix',
        videos: [{
          id: 'v-nflx-1',
          title: '흑백요리사 1화 하이라이트 요약',
          platform: 'netflix',
          video_id: '81280352',
          duration_seconds: 920,
          thumbnail_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop',
          channel_title: '넷플릭스 코리아'
        }]
      },
      {
        id: 'pl-ott-nflx-2',
        title: '🎬 [넷플릭스 코리아] 오징어 게임 시즌2 공식 10분 요약',
        author: '넷플릭스 코리아',
        author_id: 'ott-netflix',
        category: '식사 반찬',
        total_duration_sec: 860,
        fork_count: 310,
        active_watchers: 42,
        is_ott_scraped: true,
        platform: 'netflix',
        videos: [{
          id: 'v-nflx-2',
          title: '오징어 게임 시즌2 공식 요약',
          platform: 'netflix',
          video_id: '81040344',
          duration_seconds: 860,
          thumbnail_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop',
          channel_title: '넷플릭스 코리아'
        }]
      },
      {
        id: 'pl-ott-nflx-3',
        title: '🎬 [넷플릭스 코리아] 지옥 시즌2 핵심 액션 몰아보기',
        author: '넷플릭스 코리아',
        author_id: 'ott-netflix',
        category: '식사 반찬',
        total_duration_sec: 950,
        fork_count: 240,
        active_watchers: 25,
        is_ott_scraped: true,
        platform: 'netflix',
        videos: [{
          id: 'v-nflx-3',
          title: '지옥 시즌2 핵심 몰아보기',
          platform: 'netflix',
          video_id: '81503920',
          duration_seconds: 950,
          thumbnail_url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&auto=format&fit=crop',
          channel_title: '넷플릭스 코리아'
        }]
      }
    ],
    tving: [
      {
        id: 'pl-ott-tvg-1',
        title: '🍿 [TVING Official] 환승연애3 최신화 명장면 15분 하이라이트',
        author: 'TVING Official',
        author_id: 'ott-tving',
        category: '식사 반찬',
        total_duration_sec: 900,
        fork_count: 198,
        active_watchers: 19,
        is_ott_scraped: true,
        platform: 'tving',
        videos: [{
          id: 'v-tvg-1',
          title: '환승연애3 15분 하이라이트',
          platform: 'tving',
          video_id: 'tving-transfer-love-3',
          duration_seconds: 900,
          thumbnail_url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&auto=format&fit=crop',
          channel_title: 'TVING Official'
        }]
      },
      {
        id: 'pl-ott-tvg-2',
        title: '🍿 [TVING Official] 최강야구 2026시즌 15분 요약 하이라이트',
        author: 'TVING Official',
        author_id: 'ott-tving',
        category: '식사 반찬',
        total_duration_sec: 880,
        fork_count: 220,
        active_watchers: 28,
        is_ott_scraped: true,
        platform: 'tving',
        videos: [{
          id: 'v-tvg-2',
          title: '최강야구 15분 요약',
          platform: 'tving',
          video_id: 'tving-monsters-baseball',
          duration_seconds: 880,
          thumbnail_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop',
          channel_title: 'TVING Official'
        }]
      },
      {
        id: 'pl-ott-tvg-3',
        title: '🍿 [TVING Official] 뿜뿜 인기 예능 식사시간 핫클립',
        author: 'TVING Official',
        author_id: 'ott-tving',
        category: '식사 반찬',
        total_duration_sec: 930,
        fork_count: 175,
        active_watchers: 15,
        is_ott_scraped: true,
        platform: 'tving',
        videos: [{
          id: 'v-tvg-3',
          title: '인기 예능 핫클립 편집본',
          platform: 'tving',
          video_id: 'tving-variety-top3',
          duration_seconds: 930,
          thumbnail_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop',
          channel_title: 'TVING Official'
        }]
      }
    ],
    coupang: [
      {
        id: 'pl-ott-cp-1',
        title: '⚽ [쿠팡플레이 스포츠] 손흥민 토트넘 프리미어리그 15분 골모음',
        author: '쿠팡플레이 스포츠',
        author_id: 'ott-coupang',
        category: '식사 반찬',
        total_duration_sec: 915,
        fork_count: 245,
        active_watchers: 42,
        is_ott_scraped: true,
        platform: 'coupang',
        videos: [{
          id: 'v-cp-1',
          title: '손흥민 15분 골 하이라이트',
          platform: 'coupang',
          video_id: 'cp-son-goals',
          duration_seconds: 915,
          thumbnail_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop',
          channel_title: '쿠팡플레이 스포츠'
        }]
      },
      {
        id: 'pl-ott-cp-2',
        title: '⚽ [쿠팡플레이 스포츠] SNL 코리아 2026 레전드 하이라이트',
        author: '쿠팡플레이 스포츠',
        author_id: 'ott-coupang',
        category: '식사 반찬',
        total_duration_sec: 890,
        fork_count: 290,
        active_watchers: 36,
        is_ott_scraped: true,
        platform: 'coupang',
        videos: [{
          id: 'v-cp-2',
          title: 'SNL 코리아 하이라이트',
          platform: 'coupang',
          video_id: 'cp-snl-korea',
          duration_seconds: 890,
          thumbnail_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop',
          channel_title: '쿠팡플레이 스포츠'
        }]
      },
      {
        id: 'pl-ott-cp-3',
        title: '⚽ [쿠팡플레이 스포츠] 이강인 PSG 주말 경기 10분 컷',
        author: '쿠팡플레이 스포츠',
        author_id: 'ott-coupang',
        category: '식사 반찬',
        total_duration_sec: 650,
        fork_count: 210,
        active_watchers: 22,
        is_ott_scraped: true,
        platform: 'coupang',
        videos: [{
          id: 'v-cp-3',
          title: '이강인 PSG 10분 컷',
          platform: 'coupang',
          video_id: 'cp-lki-psg',
          duration_seconds: 650,
          thumbnail_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop',
          channel_title: '쿠팡플레이 스포츠'
        }]
      }
    ],
    disney: [
      {
        id: 'pl-ott-dis-1',
        title: '🏰 [Disney+ Korea] 무빙2 기대작 명장면 딥다이브 15분 요약',
        author: 'Disney+ Korea',
        author_id: 'ott-disney',
        category: '식사 반찬',
        total_duration_sec: 895,
        fork_count: 312,
        active_watchers: 27,
        is_ott_scraped: true,
        platform: 'disney',
        videos: [{
          id: 'v-dis-1',
          title: '무빙2 명장면 딥다이브',
          platform: 'disney',
          video_id: 'disney-moving-2',
          duration_seconds: 895,
          thumbnail_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop',
          channel_title: 'Disney+ Korea'
        }]
      },
      {
        id: 'pl-ott-dis-2',
        title: '🏰 [Disney+ Korea] 카지노 최민식 레전드 명대사 하이라이트',
        author: 'Disney+ Korea',
        author_id: 'ott-disney',
        category: '식사 반찬',
        total_duration_sec: 910,
        fork_count: 260,
        active_watchers: 20,
        is_ott_scraped: true,
        platform: 'disney',
        videos: [{
          id: 'v-dis-2',
          title: '카지노 최민식 명대사',
          platform: 'disney',
          video_id: 'disney-casino-top',
          duration_seconds: 910,
          thumbnail_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop',
          channel_title: 'Disney+ Korea'
        }]
      },
      {
        id: 'pl-ott-dis-3',
        title: '🏰 [Disney+ Korea] 만달로리안 & 마블 명장면 모음전',
        author: 'Disney+ Korea',
        author_id: 'ott-disney',
        category: '식사 반찬',
        total_duration_sec: 870,
        fork_count: 245,
        active_watchers: 18,
        is_ott_scraped: true,
        platform: 'disney',
        videos: [{
          id: 'v-dis-3',
          title: '만달로리안 명장면 모음전',
          platform: 'disney',
          video_id: 'disney-marvel-15m',
          duration_seconds: 870,
          thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop',
          channel_title: 'Disney+ Korea'
        }]
      }
    ],
    wavve: [
      {
        id: 'pl-ott-wav-1',
        title: '🌊 [Wavve Original] 피의 게임 시즌3 핵심 15분 몰아보기',
        author: 'Wavve Original',
        author_id: 'ott-wavve',
        category: '식사 반찬',
        total_duration_sec: 890,
        fork_count: 178,
        active_watchers: 15,
        is_ott_scraped: true,
        platform: 'wavve',
        videos: [{
          id: 'v-wav-1',
          title: '피의 게임 시즌3 핵심 몰아보기',
          platform: 'wavve',
          video_id: 'wavve-game-of-blood',
          duration_seconds: 890,
          thumbnail_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop',
          channel_title: 'Wavve Original'
        }]
      },
      {
        id: 'pl-ott-wav-2',
        title: '🌊 [Wavve Original] 무한도전 레전드 15분 모아보기 클립',
        author: 'Wavve Original',
        author_id: 'ott-wavve',
        category: '식사 반찬',
        total_duration_sec: 910,
        fork_count: 210,
        active_watchers: 25,
        is_ott_scraped: true,
        platform: 'wavve',
        videos: [{
          id: 'v-wav-2',
          title: '무한도전 15분 모아보기 클립',
          platform: 'wavve',
          video_id: 'wavve-mudo-legend',
          duration_seconds: 910,
          thumbnail_url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&auto=format&fit=crop',
          channel_title: 'Wavve Original'
        }]
      },
      {
        id: 'pl-ott-wav-3',
        title: '🌊 [Wavve Original] 런닝맨 식사시간 15분 컷 꿀잼 모음전',
        author: 'Wavve Original',
        author_id: 'ott-wavve',
        category: '식사 반찬',
        total_duration_sec: 880,
        fork_count: 190,
        active_watchers: 19,
        is_ott_scraped: true,
        platform: 'wavve',
        videos: [{
          id: 'v-wav-3',
          title: '런닝맨 15분 컷 꿀잼 모음전',
          platform: 'wavve',
          video_id: 'wavve-runningman-top',
          duration_seconds: 880,
          thumbnail_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
          channel_title: 'Wavve Original'
        }]
      }
    ]
  };

  const results: Playlist[] = [];
  savedOtts.forEach((plat) => {
    const key = plat.toLowerCase();
    if (catalog[key]) {
      results.push(...catalog[key]);
    }
  });
  return results;
}

export default function HomePage() {
  const [playlists, setPlaylists] = useState<Playlist[]>(FALLBACK_PLAYLISTS);
  const [myCreatedPlaylists, setMyCreatedPlaylists] = useState<Playlist[]>([]);
  const [ottScrapedItems, setOttScrapedItems] = useState<Playlist[]>([]);
  const [youtubeTrending, setYoutubeTrending] = useState<any[]>([]);
  const [loadingTrending, setLoadingTrending] = useState<boolean>(true);
  const [savedOttsState, setSavedOttsState] = useState<string[]>(['youtube', 'netflix', 'tving']);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDurationTab, setSelectedDurationTab] = useState<'all' | '5min' | '15min' | '20min'>('all');
  const [selectedOttTab, setSelectedOttTab] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isOttModalOpen, setIsOttModalOpen] = useState<boolean>(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  // User created live rooms state (added directly to Live Room feed)
  const [userLiveRooms, setUserLiveRooms] = useState<Playlist[]>([]);
  const [isLiveRoomMode, setIsLiveRoomMode] = useState<boolean>(false);

  // Video Player Modal with Live Chat condition flag
  const [playingVideoState, setPlayingVideoState] = useState<{ video: Video; isLive?: boolean; playlistId?: string; initialWatchers?: number; isHost?: boolean; hostNickname?: string } | null>(null);

  // Demo state for previewing how other users see your playlists
  const [isPreviewingAsOtherUser, setIsPreviewingAsOtherUser] = useState<boolean>(false);

  // Modal Creation/Edit Form States
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftVideos, setDraftVideos] = useState<Video[]>([]);
  const [submittingModal, setSubmittingModal] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isModalOpen || isOttModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, isOttModalOpen]);

  const syncLocalCreated = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('my_created_playlists');
      if (saved) {
        try {
          const parsed: Playlist[] = JSON.parse(saved);
          setMyCreatedPlaylists(parsed);
          return parsed;
        } catch {}
      }
    }
    setMyCreatedPlaylists([]);
    return [];
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_live_rooms') {
        try {
          const fresh = e.newValue ? JSON.parse(e.newValue) : [];
          setUserLiveRooms(fresh);
        } catch {}
      }
      if (e.key === 'my_created_playlists') {
        try {
          const fresh = e.newValue ? JSON.parse(e.newValue) : [];
          setMyCreatedPlaylists(fresh);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadPlaylists = async () => {
    setLoading(true);
    const localCreated = syncLocalCreated();
    const localLive = syncLocalLiveRooms();
    try {
      const data = await fetchPlaylists(900);
      if (data && data.length > 0) {
        // Extract shared live rooms created by any user from backend
        const sharedLive = data.filter((pl) => (pl as any).is_live || pl.id.startsWith('pl-live-'));
        const sharedLiveMap = new Map<string, Playlist>();
        sharedLive.forEach((item) => sharedLiveMap.set(String(item.id), item));

        const localLiveMap = new Map<string, Playlist>();
        localLive.filter(item => item.id.startsWith('pl-live-user-')).forEach(item => localLiveMap.set(String(item.id), item));

        const allKeys = Array.from(sharedLiveMap.keys()).concat(Array.from(localLiveMap.keys()));
        const updatedLiveRooms = Array.from(new Set(allKeys))
          .map(id => sharedLiveMap.get(id) || localLiveMap.get(id)!)
          .filter(Boolean);

        setUserLiveRooms(updatedLiveRooms);
        setPlaylists(() => {
          const combinedMap = new Map<string, Playlist>();
          [...localCreated, ...data].forEach((pl) => combinedMap.set(String(pl.id), pl));
          return Array.from(combinedMap.values());
        });
      } else {
        const localLiveMap = new Map<string, Playlist>();
        localLive.filter(item => item.id.startsWith('pl-live-user-')).forEach(item => localLiveMap.set(String(item.id), item));
        setUserLiveRooms(Array.from(localLiveMap.values()));
        setPlaylists(() => {
          const combinedMap = new Map<string, Playlist>();
          [...localCreated, ...FALLBACK_PLAYLISTS].forEach((pl) => combinedMap.set(String(pl.id), pl));
          return Array.from(combinedMap.values());
        });
      }
    } catch {
      const localLiveMap = new Map<string, Playlist>();
      localLive.filter(item => item.id.startsWith('pl-live-user-')).forEach(item => localLiveMap.set(String(item.id), item));
      setUserLiveRooms(Array.from(localLiveMap.values()));
      setPlaylists(() => {
        const combinedMap = new Map<string, Playlist>();
        [...localCreated, ...FALLBACK_PLAYLISTS].forEach((pl) => combinedMap.set(String(pl.id), pl));
        return Array.from(combinedMap.values());
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOttScrapedFeeds = async () => {
    let savedOtts: string[] = ['youtube', 'netflix', 'tving'];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('connected_otts');
      if (saved) {
        try { savedOtts = JSON.parse(saved); } catch {}
      }
    }
    setSavedOttsState(savedOtts);
    const ottFeeds = await fetchOttRecommendations(savedOtts, 900);
    if (ottFeeds && ottFeeds.length > 0) {
      setOttScrapedItems(ottFeeds);
    } else {
      const fallbackOttFeeds = generateFallbackOttPlaylists(savedOtts);
      setOttScrapedItems(fallbackOttFeeds);
    }
  };

  const loadYoutubeTrending = async () => {
    setLoadingTrending(true);
    try {
      const items = await fetchYouTubeTrendingVideos();
      if (items && items.length > 0) {
        setYoutubeTrending(items);
      }
    } catch (err) {
      console.error('Trending fetch error:', err);
    } finally {
      setLoadingTrending(false);
    }
  };

  const syncLocalLiveRooms = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_live_rooms');
      if (saved) {
        try {
          const parsed: Playlist[] = JSON.parse(saved);
          setUserLiveRooms(parsed);
          return parsed;
        } catch {}
      }
    }
    setUserLiveRooms([]);
    return [];
  };

  useEffect(() => {
    syncLocalLiveRooms();
    loadPlaylists();
    loadOttScrapedFeeds();
    loadYoutubeTrending();

    // Auto-poll live room list from backend every 5 seconds for all users
    const pollInterval = setInterval(() => {
      loadPlaylists();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleFork = async (id: string) => {
    try {
      const newForkCount = await forkPlaylist(id);
      showToast(`이 반찬을 추천하셨습니다! (추천 수: ${newForkCount})`);
    } catch {
      showToast('이 반찬을 추천하셨습니다!');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPlaylist(null);
    setDraftTitle('');
    setDraftVideos([]);
    setIsLiveRoomMode(false);
    setIsModalOpen(true);
  };

  const handleOpenLiveRoomModal = () => {
    setEditingPlaylist(null);
    setDraftTitle('');
    setDraftVideos([]);
    setIsLiveRoomMode(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pl: Playlist) => {
    setEditingPlaylist(pl);
    setDraftTitle(pl.title);
    setDraftVideos(pl.videos || []);
    setIsModalOpen(true);
  };

  const handleDeleteLiveRoom = async (id: string) => {
    try {
      await deletePlaylist(id);
    } catch {}

    setUserLiveRooms((prev) => {
      const updated = prev.filter((pl) => pl.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_live_rooms', JSON.stringify(updated));
      }
      return updated;
    });

    const updatedCreated = myCreatedPlaylists.filter((pl) => pl.id !== id);
    setMyCreatedPlaylists(updatedCreated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('my_created_playlists', JSON.stringify(updatedCreated));
    }

    setPlaylists((prev) => prev.filter((pl) => pl.id !== id));

    if (playingVideoState?.playlistId === id) {
      setPlayingVideoState(null);
    }

    showToast('🗑️ 라이브 밥상방이 실제로 완전히 삭제되었습니다.');
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await deletePlaylist(playlistId);
    } catch {}

    const updatedCreated = myCreatedPlaylists.filter(pl => pl.id !== playlistId);
    setMyCreatedPlaylists(updatedCreated);

    setUserLiveRooms((prev) => {
      const updated = prev.filter((pl) => pl.id !== playlistId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_live_rooms', JSON.stringify(updated));
      }
      return updated;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('my_created_playlists', JSON.stringify(updatedCreated));
      try {
        let hostRoomIds: string[] = JSON.parse(localStorage.getItem('my_host_room_ids') || '[]');
        hostRoomIds = hostRoomIds.filter(id => id !== playlistId);
        localStorage.setItem('my_host_room_ids', JSON.stringify(hostRoomIds));
      } catch {}
    }

    setPlaylists(prev => prev.filter(pl => pl.id !== playlistId));

    if (playingVideoState?.playlistId === playlistId) {
      setPlayingVideoState(null);
    }

    showToast('🗑️ 내 보관함 및 라이브 목록에서 방/반찬이 삭제되었습니다.');
  };

  const handleDeleteVideoFromPlaylist = (playlistId: string, videoIndex: number) => {
    const targetPl = myCreatedPlaylists.find(pl => pl.id === playlistId);
    if (!targetPl) return;

    const updatedVideos = targetPl.videos.filter((_, idx) => idx !== videoIndex);
    if (updatedVideos.length === 0) {
      handleDeletePlaylist(playlistId);
      return;
    }

    const updatedTotalSec = updatedVideos.reduce((acc, v) => acc + v.duration_seconds, 0);
    const updatedPl = {
      ...targetPl,
      videos: updatedVideos,
      total_duration_sec: updatedTotalSec
    };

    const updatedCreatedList = myCreatedPlaylists.map(pl => pl.id === editingPlaylist?.id ? updatedPl : pl);
    setMyCreatedPlaylists(updatedCreatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('my_created_playlists', JSON.stringify(updatedCreatedList));
    }

    setPlaylists(prev => prev.map(pl => pl.id === playlistId ? updatedPl : pl));
    showToast('🗑️ 선택하신 영상 컨텐츠가 삭제되었습니다.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddVideoToDraft = (video: Video) => {
    const updated = [...draftVideos, video];
    setDraftVideos(updated);
    showToast('영상이 리스트에 추가되었습니다!');
  };

  const handleCreateOrEditPlaylistSubmit = async () => {
    if (submittingModal) return;

    setSubmittingModal(true);

    const finalTitle = draftTitle.trim() || '🍱 나만의 식사 꿀조합 반찬';
    let finalVideos = draftVideos;

    if (finalVideos.length === 0) {
      finalVideos = [
        {
          id: `v-${Date.now()}`,
          title: '🍱 식사시간 꿀조합 맞춤 영상',
          platform: 'youtube',
          video_id: 'JdRcM4fLwgE',
          duration_seconds: 180,
          thumbnail_url: 'https://i.ytimg.com/vi/JdRcM4fLwgE/hqdefault.jpg',
          channel_title: '식사 꿀조합 채널'
        }
      ];
    }

    const totalSec = finalVideos.reduce((acc, v) => acc + v.duration_seconds, 0);

    if (editingPlaylist) {
      const updatedPl: Playlist = {
        ...editingPlaylist,
        title: finalTitle,
        total_duration_sec: totalSec,
        videos: finalVideos
      };

      const updatedCreatedList = myCreatedPlaylists.map(pl => pl.id === editingPlaylist.id ? updatedPl : pl);
      setMyCreatedPlaylists(updatedCreatedList);
      if (typeof window !== 'undefined') {
        localStorage.setItem('my_created_playlists', JSON.stringify(updatedCreatedList));
      }

      setPlaylists(prev => prev.map(pl => pl.id === editingPlaylist.id ? updatedPl : pl));
      showToast('✏️ 반찬 제목 및 메뉴 구성이 성공적으로 수정되었습니다!');

      setDraftTitle('');
      setDraftVideos([]);
      setEditingPlaylist(null);
      setSubmittingModal(false);
      setIsModalOpen(false);
      return;
    }

    const myNickname = (typeof window !== 'undefined' && (localStorage.getItem('user_nickname') || (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')!).nickname))) || '독고다이';

    if (isLiveRoomMode) {
      // Flow 2: [라이브 방 열기] Mode (Appears ONLY in Live Tab, NOT in my storage)
      try {
        const createdPl = await createPlaylist({
          title: finalTitle,
          category: '식사 반찬',
          videos: finalVideos,
          author_name: myNickname,
          is_live: true
        });

        const liveRoom: Playlist = {
          ...createdPl,
          author: myNickname,
          author_id: 'u-me',
          active_watchers: 1
        };

        setUserLiveRooms((prev) => {
          const updated = [liveRoom, ...prev];
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_live_rooms', JSON.stringify(updated));
            try {
              const existing = JSON.parse(localStorage.getItem('my_host_room_ids') || '[]');
              if (!existing.includes(liveRoom.id)) {
                existing.push(liveRoom.id);
                localStorage.setItem('my_host_room_ids', JSON.stringify(existing));
              }

              // Also add to my_created_playlists for My Storage (내 보관함)
              let myCreated: Playlist[] = [];
              const rawCreated = localStorage.getItem('my_created_playlists');
              if (rawCreated) myCreated = JSON.parse(rawCreated);
              if (!myCreated.some(p => p.id === liveRoom.id)) {
                myCreated.unshift(liveRoom);
                localStorage.setItem('my_created_playlists', JSON.stringify(myCreated));
              }
            } catch {}
          }
          return updated;
        });
        syncLocalCreated();
        showToast(`🎉 👑 ${myNickname} 님의 라이브 밥상방이 목록에 즉시 개설되었습니다!`);

        if (finalVideos.length > 0) {
          setPlayingVideoState({
            video: finalVideos[0],
            isLive: true,
            playlistId: liveRoom.id,
            initialWatchers: 1,
            isHost: true,
            hostNickname: myNickname
          });
        }
      } catch {
        const fallbackPl: Playlist = {
          id: `pl-live-user-${Date.now()}`,
          title: finalTitle,
          author: myNickname,
          author_id: 'u-me',
          category: '식사 반찬',
          total_duration_sec: totalSec,
          fork_count: 0,
          active_watchers: 1,
          videos: finalVideos
        };

        setUserLiveRooms((prev) => {
          const updated = [fallbackPl, ...prev];
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_live_rooms', JSON.stringify(updated));
            try {
              const existing = JSON.parse(localStorage.getItem('my_host_room_ids') || '[]');
              if (!existing.includes(fallbackPl.id)) {
                existing.push(fallbackPl.id);
                localStorage.setItem('my_host_room_ids', JSON.stringify(existing));
              }

              // Also add fallbackPl to my_created_playlists for My Storage (내 보관함)
              let myCreated: Playlist[] = [];
              const rawCreated = localStorage.getItem('my_created_playlists');
              if (rawCreated) myCreated = JSON.parse(rawCreated);
              if (!myCreated.some(p => p.id === fallbackPl.id)) {
                myCreated.unshift(fallbackPl);
                localStorage.setItem('my_created_playlists', JSON.stringify(myCreated));
              }
            } catch {}
          }
          return updated;
        });
        syncLocalCreated();
        showToast(`🎉 👑 ${myNickname} 님의 라이브 밥상방이 목록에 즉시 개설되었습니다!`);

        if (finalVideos.length > 0) {
          setPlayingVideoState({
            video: finalVideos[0],
            isLive: true,
            playlistId: fallbackPl.id,
            initialWatchers: 1,
            isHost: true,
            hostNickname: myNickname
          });
        }
      } finally {
        setDraftTitle('');
        setDraftVideos([]);
        setEditingPlaylist(null);
        setSubmittingModal(false);
        setIsModalOpen(false);
      }
      return;
    }

    // Flow 1: [반찬 차리기] Mode (Saved to my storage & shared in 남이 차린 반찬)
    try {
      const createdPl = await createPlaylist({
        title: finalTitle,
        category: '식사 반찬',
        videos: finalVideos
      });
      createdPl.author = myNickname;

      if (typeof window !== 'undefined') {
        let savedCreated: Playlist[] = [];
        const existing = localStorage.getItem('my_created_playlists');
        if (existing) {
          try { savedCreated = JSON.parse(existing); } catch {}
        }
        savedCreated.unshift(createdPl);
        localStorage.setItem('my_created_playlists', JSON.stringify(savedCreated));
      }

      syncLocalCreated();
      setPlaylists((prev) => [createdPl, ...prev]);
      showToast('🎉 나만의 맞춤 반찬이 [내 보관함] 및 [남이 차린 반찬] 피드에 추가되었습니다!');
    } catch {
      const fallbackPl: Playlist = {
        id: `pl-my-${Date.now()}`,
        title: finalTitle,
        author: myNickname,
        author_id: 'u-me',
        category: '식사 반찬',
        total_duration_sec: totalSec,
        fork_count: 0,
        active_watchers: 1,
        videos: finalVideos
      };

      if (typeof window !== 'undefined') {
        let savedCreated: Playlist[] = [];
        const existing = localStorage.getItem('my_created_playlists');
        if (existing) {
          try { savedCreated = JSON.parse(existing); } catch {}
        }
        savedCreated.unshift(fallbackPl);
        localStorage.setItem('my_created_playlists', JSON.stringify(savedCreated));
      }

      syncLocalCreated();
      setPlaylists((prev) => [fallbackPl, ...prev]);
      showToast('🎉 나만의 맞춤 반찬이 [내 보관함] 및 [남이 차린 반찬] 피드에 추가되었습니다!');
    } finally {
      setDraftTitle('');
      setDraftVideos([]);
      setEditingPlaylist(null);
      setSubmittingModal(false);
      setIsModalOpen(false);
    }
  };

  // Deduplicate playlists by String(pl.id) to ensure zero duplicates across sections
  const seenIds = new Set<string>();
  const deduplicatedPlaylists: Playlist[] = [];

  for (const pl of [...playlists, ...ottScrapedItems]) {
    const idKey = String(pl.id);
    if (!seenIds.has(idKey)) {
      seenIds.add(idKey);
      deduplicatedPlaylists.push(pl);
    }
  }

  const allPlaylists = deduplicatedPlaylists;

  const baseFiltered = rankAndRecommendPlaylists(allPlaylists, {
    searchQuery: searchQuery,
    connectedOtts: savedOttsState
  });

  // 1. Live Co-watching Playlists (사용자가 직접 개설한 라이브 방만 표출)
  const liveCowatchingPlaylists = userLiveRooms;

  // 2. Playlists Created by Other Users (통합 남이 차린 반찬 - 내가 만든 밥상/보관함 카드는 중복 제거)
  const myNicknameStr = (typeof window !== 'undefined' && (localStorage.getItem('user_nickname') || (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')!).nickname))) || '독고다이';
  const myCreatedIdSet = new Set([
    ...myCreatedPlaylists.map((p) => String(p.id)),
    ...userLiveRooms.map((p) => String(p.id))
  ]);

  let otherUsersPlaylists = isPreviewingAsOtherUser
    ? baseFiltered
    : baseFiltered.filter((pl) => {
        const idStr = String(pl.id);
        const isMyAuthor = pl.author_id === 'u-me' || (pl.author && pl.author === myNicknameStr);
        return !isMyAuthor && !idStr.startsWith('pl-my-') && !myCreatedIdSet.has(idStr);
      });

  if (selectedDurationTab === '5min') {
    otherUsersPlaylists = otherUsersPlaylists.filter((pl) => (pl.total_duration_sec || 0) <= 450);
  } else if (selectedDurationTab === '15min') {
    otherUsersPlaylists = otherUsersPlaylists.filter((pl) => (pl.total_duration_sec || 0) > 450 && (pl.total_duration_sec || 0) <= 1050);
  } else if (selectedDurationTab === '20min') {
    otherUsersPlaylists = otherUsersPlaylists.filter((pl) => (pl.total_duration_sec || 0) > 1050);
  }

  if (selectedOttTab !== 'all') {
    otherUsersPlaylists = otherUsersPlaylists.filter((pl) => {
      const plat = (pl.platform || (pl.videos && pl.videos[0]?.platform) || 'youtube').toLowerCase();
      return plat === selectedOttTab.toLowerCase();
    });
  }

  const isAnyModalActive = isModalOpen || isOttModalOpen || playingVideoState !== null;

  const ottLabels: Record<string, string> = {
    youtube: '🔴 유튜브',
    netflix: '🎬 넷플릭스',
    tving: '🍿 티빙',
    coupang: '⚽ 쿠팡플레이',
    disney: '🏰 디즈니+',
    wavve: '🌊 웨이브'
  };

  return (
    <div className="min-h-screen pb-24 text-gray-100 bg-[#080b11]">
      <Navbar onOpenCreateModal={handleOpenCreateModal} />

      {/* Video Player Modal */}
      <VideoPlayerModal
        key={`${playingVideoState?.video?.video_id || 'vid'}-${playingVideoState?.playlistId || 'pl'}`}
        video={playingVideoState?.video || null}
        enableChat={!!playingVideoState?.isLive}
        playlistId={playingVideoState?.playlistId || playingVideoState?.video?.id || 'pl-1'}
        initialWatchers={playingVideoState?.initialWatchers || 38}
        isHost={playingVideoState?.isHost || false}
        hostNickname={playingVideoState?.hostNickname}
        onDeleteLiveRoom={(id) => handleDeleteLiveRoom(id)}
        onClose={() => setPlayingVideoState(null)}
        onRoomDeleted={() => setPlayingVideoState(null)}
      />

      {/* OTT Connect Modal triggered from unlinked prompt */}
      <OttConnectModal
        isOpen={isOttModalOpen}
        onClose={() => setIsOttModalOpen(false)}
        onUpdate={(updated) => {
          setSavedOttsState(updated);
          if (typeof window !== 'undefined') {
            localStorage.setItem('connected_otts', JSON.stringify(updated));
          }
          loadOttScrapedFeeds();
          showToast(`📡 OTT 계정 연동 상태가 동기화되었습니다! (${updated.length}개 연동 중)`);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 px-5 py-3.5 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-2xl flex items-center gap-2.5 animate-bounce border border-orange-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className={`max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-10 transition-all ${
        isAnyModalActive ? 'pointer-events-none select-none opacity-50' : ''
      }`}>
        
        {/* Premium Banner Section */}
        <section className="relative rounded-3xl p-8 sm:p-12 hero-banner-glow overflow-hidden shadow-2xl space-y-6">
          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-extrabold border border-orange-500/40 shadow-inner">
                <Sparkles className="w-4 h-4" />
                <span>식사 시간 맞춤 1초 컷 큐레이션</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-extrabold border border-rose-500/40 shadow-md">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                <span>동기화 실시간 밥상 합석 중</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-extrabold border border-cyan-500/30 shadow-md">
                <Tv className="w-3.5 h-3.5 text-cyan-400" />
                <span>유튜브 · 넷플릭스 밥상 핫클립 뷔페</span>
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              혼밥하기 싫은 사람 모여라! <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
                숨은 맛도리 영상 추천부터 실시간 온라인 합석까지
              </span>
            </h2>

            <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
              혼자 먹는 밥도 다 함께 즐겁게! 식사 시간에 딱 맞는 핫클립 영상 반찬을 고민 없이 골라 감상하세요.
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-3 flex items-center gap-8 flex-wrap text-xs sm:text-sm text-gray-300">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-extrabold text-white text-base">{allPlaylists.length}개</span>
                <span className="text-gray-400">등록 반찬</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span className="font-extrabold text-white text-base">실제 채널명 100% 검증</span>
                <span className="text-gray-400">핫클립 연동</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED AI RECOMMENDATION: 🔥 AI 추천: 유튜브 실시간 인기 핫클립 반찬 */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-950/70 via-amber-950/50 to-red-950/70 border border-red-500/50 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Flame className="w-6 h-6 text-red-500 animate-bounce" />
                <span>🔥 AI 추천: 유튜브 실시간 인기 핫클립 반찬</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-200">
                유튜브 최신 알고리즘 트렌드 피드의 100% 재생 검증 핫클립 동영상입니다!
              </p>
            </div>
            <button
              onClick={loadYoutubeTrending}
              className="text-xs px-3.5 py-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 font-extrabold border border-red-500/40 w-fit shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-red-400 animate-spin" />
              <span>실시간 핫클립 새로고침</span>
            </button>
          </div>

          {loadingTrending ? (
            <div className="py-16 text-center space-y-3 rounded-2xl bg-white/5 border border-white/10">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
              <p className="text-sm font-bold text-gray-300">
                🌐 유튜브 실시간 핫클립 피드에서 최신 동영상을 불러오고 있습니다...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {youtubeTrending.slice(0, 3).map((vid) => (
                <div 
                  key={vid.video_id}
                  onClick={() => setPlayingVideoState({ video: vid, isLive: false })}
                  className="glass-panel p-4 rounded-2xl border border-red-500/30 hover:border-red-500/70 transition-all hover:scale-[1.02] cursor-pointer space-y-3 relative group"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black/60">
                    <img 
                      src={vid.thumbnail_url} 
                      alt={vid.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-red-600/90 backdrop-blur-md text-white text-xs font-black shadow-lg">
                      {vid.tag}
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[11px] font-bold">
                      {formatSecondsToMMSS(vid.duration_seconds)}
                    </div>
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform border border-red-400/50">
                        <Play className="w-6 h-6 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-red-300 transition-colors">
                      {vid.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                      <span className="font-semibold text-gray-300 truncate max-w-[130px]">{vid.channel_title}</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1 shrink-0">
                        <ViewIcon className="w-3.5 h-3.5" />
                        {vid.views}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SEPARATE BOX 1: 🔴 혼밥러 모여라 (Live Co-Watching Box) */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/50 via-purple-950/40 to-rose-950/50 border border-rose-500/40 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
                <span>🔴 혼밥러 모여라 (방장 입맛대로 틀어주는 방)</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-300">
                방장이 틀어주는 추천 반찬(영상)을 함께 시청하며 이야기 나누는 동기화 라이브 합석방입니다! 방장 모드로 모두에게 원하는 영상을 직접 틀어주세요.
              </p>
            </div>

            <div className="flex items-center shrink-0 mt-2 sm:mt-0">
              <button
                onClick={handleOpenLiveRoomModal}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 border border-amber-300/40 whitespace-nowrap shrink-0"
              >
                <span>🔴 라이브 방 열기</span>
              </button>
            </div>
          </div>

          {liveCowatchingPlaylists.length > 4 && (
            <div className="flex items-center justify-between text-xs text-rose-300 font-bold px-1 -mt-2">
              <span className="flex items-center gap-1.5 text-[11px] bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full text-rose-300 animate-pulse">
                <span>👆 👇 상하로 드래그(스크롤)하여 {liveCowatchingPlaylists.length}개의 라이브 방을 탐색하세요</span>
              </span>
              <span className="text-gray-400 text-[11px] font-medium">한 박스 4개 기본 노출</span>
            </div>
          )}

          <div className="max-h-[600px] overflow-y-auto pr-1.5 custom-scrollbar">
            {liveCowatchingPlaylists.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 border border-white/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-base font-bold text-white">현재 진행 중인 실시간 합석 방이 없습니다.</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  상단의 <span className="text-rose-400 font-bold">[🔴 라이브 방 열기]</span> 버튼을 눌러 첫 번째 방장이 되어 함께 시청해보세요!
                </p>
                <button
                  onClick={handleOpenLiveRoomModal}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>지금 내가 방장 되어 라이브 방 열기</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {liveCowatchingPlaylists.map((pl) => {
                  const isJoined = playingVideoState?.isLive && playingVideoState?.playlistId === pl.id;
                  const myHostRoomIds: string[] = typeof window !== 'undefined' && localStorage.getItem('my_host_room_ids')
                    ? (() => { try { return JSON.parse(localStorage.getItem('my_host_room_ids')!); } catch { return []; } })()
                    : [];

                  const loggedUser = typeof window !== 'undefined' && localStorage.getItem('user')
                    ? (() => { try { return JSON.parse(localStorage.getItem('user')!); } catch { return null; } })()
                    : null;

                  const savedUserNickname = typeof window !== 'undefined' ? localStorage.getItem('user_nickname') : null;

                  const isUserCreatedRoom = myHostRoomIds.includes(pl.id) || (loggedUser && (
                    pl.author_id === `u-${loggedUser.id}` ||
                    pl.author === loggedUser.nickname ||
                    pl.author === `${loggedUser.nickname} (방장)`
                  )) || (savedUserNickname && (
                    pl.author === savedUserNickname ||
                    pl.author === `${savedUserNickname} (방장)`
                  )) || pl.author_id === 'u-me' || pl.id.startsWith('pl-live-user-');

                  return (
                    <PlaylistCard 
                      key={`live-${pl.id}`} 
                      playlist={pl} 
                      onFork={() => handleFork(pl.id)} 
                      onPlayVideo={(v) => setPlayingVideoState({ 
                        video: v, 
                        isLive: true, 
                        playlistId: pl.id,
                        initialWatchers: pl.active_watchers || 1,
                        isHost: isUserCreatedRoom,
                        hostNickname: pl.author || '방장'
                      })} 
                      showLiveBadge={true}
                      isJoined={isJoined}
                      onDeletePlaylist={(id) => handleDeleteLiveRoom(id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Toolbar: Search + Meal Duration Quick Filter Pills (MOVED BETWEEN '혼밥러 모여라' and '남이 차린 반찬') */}
        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111622] via-[#161c2c] to-[#111622] border border-cyan-500/40 shadow-xl">
            {/* Search Input */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-[280px]">
              <div className="flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-bold text-sm text-white shrink-0">통합 검색:</span>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="반찬 제목 또는 작성자 검색..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>
            </div>

            {/* Meal Duration Filter Pill Bar */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0">
              <span className="text-xs text-gray-400 font-bold mr-1 shrink-0 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-amber-400" /> 식사시간 맞춤:
              </span>
              {[
                { id: 'all', label: '⚡ 전체' },
                { id: '5min', label: '⏱️ 5분 컷 (속성식)' },
                { id: '15min', label: '🍱 15분 컷 (표준식)' },
                { id: '20min', label: '🍲 20분+ (여유식)' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedDurationTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                    selectedDurationTab === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md shadow-orange-500/20 scale-105'
                      : 'bg-white/5 hover:bg-white/15 text-gray-300 border-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SEPARATE BOX 2: 👥 남이 차린 반찬 (각 OTT별 상위 3순위 랭킹 + OTT 플랫폼 필터 탭 - NO CHAT) */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-blue-950/40 to-slate-900/90 border border-cyan-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col space-y-4 border-b border-white/10 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <Users2 className="w-6 h-6 text-cyan-400" />
                    <span>👥 남이 차린 반찬 ({otherUsersPlaylists.length}개)</span>
                  </h3>

                  {/* Demo preview toggle for verification */}
                  <button
                    onClick={() => {
                      const nextState = !isPreviewingAsOtherUser;
                      setIsPreviewingAsOtherUser(nextState);
                      showToast(nextState 
                        ? '👁️ 타 유저 시점 미리보기 모드: 내가 차린 반찬이 [남이 차린 반찬]에 노출되는 모습입니다!'
                        : '👁️ 내 시점 모드로 복귀되었습니다.'
                      );
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isPreviewingAsOtherUser
                        ? 'bg-amber-500 text-black border border-amber-400 font-extrabold shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                    title="다른 사람이 내 반찬을 볼 때 남이 차린 반찬에 뜨는 모습 미리보기"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isPreviewingAsOtherUser ? '타 유저 시점 (ON)' : '타 유저 시점 미리보기'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-gray-300">
                  각 OTT 플랫폼별 <strong className="text-cyan-400 font-extrabold">상위 3순위 인기 콘텐츠</strong> 랭킹 반찬입니다. 재생 버튼 클릭 시 해당 OTT 전용관 이동 안내가 표시됩니다!
                </p>
              </div>
            </div>

            {/* OTT Platform Filter Tabs Bar */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <span className="text-xs text-gray-400 font-bold mr-1 shrink-0 flex items-center gap-1">
                <Tv className="w-3.5 h-3.5 text-cyan-400" /> OTT 플랫폼 선택 (Top3 랭킹):
              </span>
              {[
                { id: 'all', label: '🌐 전체' },
                { id: 'youtube', label: '🔴 유튜브' },
                { id: 'netflix', label: '🎬 넷플릭스' },
                { id: 'tving', label: '🍿 티빙' },
                { id: 'coupang', label: '⚽ 쿠팡플레이' },
                { id: 'disney', label: '🏰 디즈니+' },
                { id: 'wavve', label: '🌊 웨이브' }
              ].map((ott) => (
                <button
                  key={ott.id}
                  onClick={() => setSelectedOttTab(ott.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                    selectedOttTab === ott.id
                      ? 'bg-cyan-500 text-black border-cyan-400 font-black shadow-lg shadow-cyan-500/30 scale-105'
                      : 'bg-white/5 hover:bg-white/15 text-gray-300 border-white/10 hover:text-white'
                  }`}
                >
                  {ott.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional rendering for unlinked OTT vs connected OTT list */}
          {selectedOttTab !== 'all' && !savedOttsState.includes(selectedOttTab) ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-cyan-500/40 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/40 animate-pulse">
                <Tv className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  <span>🔒 {ottLabels[selectedOttTab]} 연동이 해제되어 있습니다</span>
                </h4>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  현재 {ottLabels[selectedOttTab]} 서비스가 연동 해제 상태입니다.<br />
                  해당 OTT 플랫폼의 상위 3순위 맞춤 추천 반찬을 감상하시려면 계정 연동을 진행해 주세요!
                </p>
              </div>
              <button
                onClick={() => setIsOttModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm shadow-xl flex items-center gap-2 mx-auto hover:scale-105 transition-all cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
                <span>📡 {ottLabels[selectedOttTab]} 연동하러 가기</span>
              </button>
            </div>
          ) : (
            otherUsersPlaylists.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-white/5 text-gray-400 text-sm">
                선택하신 OTT 플랫폼 조건에 맞는 추천 반찬이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherUsersPlaylists.map((pl) => (
                  <PlaylistCard 
                    key={`other-${pl.id}`} 
                    playlist={pl} 
                    onFork={() => handleFork(pl.id)} 
                    onPlayVideo={(v) => setPlayingVideoState({ video: v, isLive: false })} 
                    showLiveBadge={false}
                  />
                ))}
              </div>
            )
          )}
        </section>

      </main>

      {/* CREATE / EDIT PLAYLIST MODAL */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              setEditingPlaylist(null);
            }
          }}
        >
          <div className="glass-panel rounded-3xl max-w-lg w-full p-8 space-y-6 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar pointer-events-auto z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {editingPlaylist ? <Pencil className="w-5 h-5 text-amber-400" /> : <Sparkles className="w-5 h-5 text-orange-400" />}
                <span>{editingPlaylist ? '내가 차린 반찬 수정하기' : isLiveRoomMode ? '👑 🔴 라이브 방장 밥상 개설하기' : '🍱 나만의 맞춤 반찬 차리기'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPlaylist(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1.5">반찬 제목</label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="예: 🍱 [슈카월드] & [침착맨] 식사 꿀조합 반찬"
                  className="w-full bg-[#151720] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1.5">영상 URL 추가 (유튜브/넷플릭스)</label>
                <UrlParserInput onAddVideo={handleAddVideoToDraft} />
              </div>

              {draftVideos.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-gray-300">담긴 영상 목록 ({draftVideos.length}개)</div>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {draftVideos.map((v, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="text-gray-400 font-bold">{i + 1}.</span>
                          <span className="truncate text-white font-medium">{v.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-orange-400 font-bold">{formatSecondsToMMSS(v.duration_seconds)}</span>
                          <button
                            onClick={() => setDraftVideos(prev => prev.filter((_, idx) => idx !== i))}
                            className="p-1 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all cursor-pointer"
                            title="담은 영상 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPlaylist(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-sm font-semibold transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleCreateOrEditPlaylistSubmit}
                disabled={submittingModal}
                className="px-6 py-2.5 rounded-xl orange-gradient-btn text-white text-sm font-bold shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {submittingModal ? '처리 중...' : editingPlaylist ? '반찬 수정 완료' : '반찬 등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
