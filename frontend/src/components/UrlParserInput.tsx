'use client';

import React, { useState } from 'react';
import { Search, Plus, Sparkles, CheckCircle2, Youtube, Clock, ExternalLink } from 'lucide-react';
import { Video } from '@/types';
import { formatSecondsToMMSS } from '@/lib/deeplink';
import { searchYouTubeVideos } from '@/lib/api';

interface UrlParserInputProps {
  onAddVideo: (video: Video) => void;
}

export const UrlParserInput: React.FC<UrlParserInputProps> = ({ onAddVideo }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const extractYtId = (rawUrl: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = rawUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const handleSearchOrParse = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = query.trim();
    if (!cleanInput) return;

    setLoading(true);
    setMessage(null);

    const ytId = extractYtId(cleanInput);

    // 1. If input is direct YouTube URL
    if (ytId || cleanInput.includes('youtube.com') || cleanInput.includes('youtu.be')) {
      try {
        const vidId = ytId || '9bZkp7q19f0';
        const parsedVid: Video = {
          id: `v-${Date.now()}`,
          title: `유튜브 시청 영상 (${vidId})`,
          platform: 'youtube',
          video_id: vidId,
          duration_seconds: 914, // 15분 14초
          thumbnail_url: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
          channel_title: '유튜브 채널'
        };
        onAddVideo(parsedVid);
        setMessage(`✅ [${parsedVid.title}] 영상이 밥상에 추가되었습니다!`);
        setQuery('');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. If input is Keyword Search query (e.g. "성시경 먹을텐데", "침착맨", "백종원")
    try {
      const results = await searchYouTubeVideos(cleanInput);
      if (results && results.length > 0) {
        const mappedVideos: Video[] = results.map((item: any) => ({
          id: item.id || `v-${item.video_id}`,
          title: item.title,
          platform: 'youtube',
          video_id: item.video_id,
          duration_seconds: item.duration_seconds || 300,
          thumbnail_url: item.thumbnail_url || `https://img.youtube.com/vi/${item.video_id}/hqdefault.jpg`,
          channel_title: item.channel_title || 'YouTube'
        }));
        setSearchResults(mappedVideos);
        setMessage(`🔍 유튜브에서 '${cleanInput}' 검색 결과 ${mappedVideos.length}건을 찾았습니다! 아래에서 원하는 영상을 선택하세요.`);
      } else {
        setSearchResults([]);
        setMessage(`⚠️ '${cleanInput}' 검색 결과를 찾지 못했습니다. 유튜브 URL을 직접 입력해보세요.`);
      }
    } catch {
      setSearchResults([]);
      setMessage('⚠️ 검색 도중 오류가 발생했습니다. 키워드나 URL을 다시 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSearchResult = (video: Video) => {
    onAddVideo(video);
    setAddedIds(prev => [...prev, video.video_id]);
    setMessage(`✅ [${video.title}] 영상이 내 밥상에 추가되었습니다!`);
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchOrParse} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-orange-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="유튜브 검색어 입력 (예: 성시경 먹을텐데, 백종원, 침착맨) 또는 URL..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 rounded-xl orange-gradient-btn hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
        >
          {loading ? (
            <span>검색 중...</span>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>유튜브 검색</span>
            </>
          )}
        </button>
      </form>

      {/* Toast / Status Message */}
      {message && (
        <div className="text-xs text-orange-300 font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{message}</span>
        </div>
      )}

      {/* YouTube Search Results Cards Grid */}
      {searchResults.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-300 font-bold px-1">
            <span className="flex items-center gap-1">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>실시간 유튜브 검색 결과 (클릭 시 밥상 추가)</span>
            </span>
            <button
              onClick={() => setSearchResults([])}
              className="text-[11px] text-gray-400 hover:text-gray-200 underline cursor-pointer"
            >
              결과 닫기
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {searchResults.map((vid) => {
              const isAdded = addedIds.includes(vid.video_id);
              return (
                <div
                  key={vid.video_id}
                  className={`glass-panel p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-2 ${
                    isAdded
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-white/10 hover:border-orange-500/40 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Thumbnail */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/5">
                      <img
                        src={vid.thumbnail_url}
                        alt={vid.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-300 font-bold flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{formatSecondsToMMSS(vid.duration_seconds)}</span>
                      </span>
                    </div>

                    {/* Title & Channel */}
                    <div>
                      <h5 className="text-xs font-bold text-white line-clamp-2 leading-snug" title={vid.title}>
                        {vid.title}
                      </h5>
                      <p className="text-[11px] text-gray-400 mt-1 truncate">
                        📺 {vid.channel_title || '유튜브 채널'}
                      </p>
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => handleAddSearchResult(vid)}
                    disabled={isAdded}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                      isAdded
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>추가됨</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>밥상에 추가</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
