import { Playlist } from '@/types';

export interface RecommendationCriteria {
  searchQuery?: string;
  connectedOtts?: string[];
}

export interface ScoredPlaylist {
  playlist: Playlist;
  score: number;
  breakdown: {
    popularityScore: number;
    ottFreshnessScore: number;
  };
}

/**
 * 남의 밥상 통합 추천 산식 (Unified Recommendation Engine)
 * FinalScore = (Popularity * 0.70) + (OttFreshness * 0.30)
 * Note: 시간대 필터링 및 카테고리가 완전히 제거되어 인기도 및 실시간 데이터 중심 랭킹이 적용됩니다.
 */
export function rankAndRecommendPlaylists(
  playlists: Playlist[],
  criteria: RecommendationCriteria
): Playlist[] {
  const { searchQuery = '', connectedOtts = [] } = criteria;

  const scored: ScoredPlaylist[] = playlists.map((pl) => {
    // 1. Popularity Score (0.0 ~ 1.0 based on log fork count & active watchers)
    const forkFactor = Math.log(1 + (pl.fork_count || 0)) / Math.log(500);
    const watcherFactor = (pl.active_watchers || 1) / 50;
    const popularityScore = Math.min(1.0, forkFactor * 0.7 + watcherFactor * 0.3);

    // 2. OTT Freshness Score (0.0 ~ 1.0)
    let ottFreshnessScore = 0.3;
    if (pl.is_ott_scraped) {
      ottFreshnessScore = 1.0;
      if (pl.platform && connectedOtts.includes(pl.platform.toLowerCase())) {
        ottFreshnessScore = 1.2;
      }
    }

    // Final Composite Score
    const finalScore = (popularityScore * 0.70) + (ottFreshnessScore * 0.30);

    return {
      playlist: pl,
      score: finalScore,
      breakdown: {
        popularityScore,
        ottFreshnessScore
      }
    };
  });

  // Search Filter
  let filtered = scored;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = scored.filter(({ playlist: pl }) => 
      pl.title.toLowerCase().includes(q) ||
      pl.author.toLowerCase().includes(q)
    );
  }

  // Sort Descending by Composite Score
  filtered.sort((a, b) => b.score - a.score);

  return filtered.map((item) => item.playlist);
}
