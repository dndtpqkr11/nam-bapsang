'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThumbsUp, Clock, ChevronDown, ChevronUp, User, Sparkles, ExternalLink, Radio, Trash2, Share2, Pencil, Timer, Crown } from 'lucide-react';
import { Playlist, Video } from '@/types';
import { RealtimeBadge } from './RealtimeBadge';
import { VideoItem } from './VideoItem';
import { formatSecondsToMMSS } from '@/lib/deeplink';

interface PlaylistCardProps {
  playlist: Playlist;
  onFork: (id: string) => void;
  onPlayVideo?: (video: Video) => void;
  onDeletePlaylist?: (id: string) => void;
  onDeleteVideo?: (playlistId: string, videoIndex: number) => void;
  onEditPlaylist?: (playlist: Playlist) => void;
  showLiveBadge?: boolean;
  isJoined?: boolean;
}

const getStoredCount = (id: string, defaultCount: number): number => {
  if (typeof window === 'undefined') return defaultCount;
  try {
    const raw = localStorage.getItem('playlist_recommend_counts');
    if (raw) {
      const countsMap = JSON.parse(raw);
      if (typeof countsMap[id] === 'number') {
        return countsMap[id];
      }
    }
  } catch {}
  return defaultCount;
};

const setStoredCount = (id: string, newCount: number) => {
  if (typeof window === 'undefined') return;
  try {
    let countsMap: Record<string, number> = {};
    const raw = localStorage.getItem('playlist_recommend_counts');
    if (raw) countsMap = JSON.parse(raw);
    countsMap[id] = newCount;
    localStorage.setItem('playlist_recommend_counts', JSON.stringify(countsMap));
  } catch {}
};

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ 
  playlist, 
  onFork, 
  onPlayVideo,
  onDeletePlaylist,
  onDeleteVideo,
  onEditPlaylist,
  showLiveBadge = false,
  isJoined = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [recommended, setRecommended] = useState(false);
  const [recommendCount, setRecommendCount] = useState(playlist.fork_count || 0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawIds = localStorage.getItem('recommended_playlist_ids');
        if (rawIds) {
          const savedIds: string[] = JSON.parse(rawIds);
          setRecommended(savedIds.includes(playlist.id));
        } else {
          setRecommended(false);
        }
      } catch {
        setRecommended(false);
      }

      setRecommendCount(getStoredCount(playlist.id, playlist.fork_count || 0));
    }
  }, [playlist.id, playlist.fork_count]);

  const handleRecommendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    let savedIds: string[] = [];
    let savedObjects: Playlist[] = [];

    if (typeof window !== 'undefined') {
      try {
        const rawIds = localStorage.getItem('recommended_playlist_ids');
        if (rawIds) savedIds = JSON.parse(rawIds);

        const rawObjs = localStorage.getItem('recommended_playlists_objects');
        if (rawObjs) savedObjects = JSON.parse(rawObjs);
      } catch {}
    }

    const currentCount = getStoredCount(playlist.id, playlist.fork_count || 0);

    if (recommended) {
      const newCount = Math.max(0, currentCount - 1);
      setRecommended(false);
      setRecommendCount(newCount);
      setStoredCount(playlist.id, newCount);

      savedIds = savedIds.filter(id => id !== playlist.id);
      savedObjects = savedObjects.filter(item => item.id !== playlist.id);
    } else {
      const newCount = currentCount + 1;
      setRecommended(true);
      setRecommendCount(newCount);
      setStoredCount(playlist.id, newCount);

      if (!savedIds.includes(playlist.id)) savedIds.push(playlist.id);
      const updatedPlaylistObj = { ...playlist, fork_count: newCount };
      if (!savedObjects.some(item => item.id === playlist.id)) {
        savedObjects.push(updatedPlaylistObj);
      } else {
        savedObjects = savedObjects.map(item => item.id === playlist.id ? updatedPlaylistObj : item);
      }
      onFork(playlist.id);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('recommended_playlist_ids', JSON.stringify(savedIds));
      localStorage.setItem('recommended_playlists_objects', JSON.stringify(savedObjects));
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/playlists/${playlist.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      alert(`📋 상대방 전달용 반찬 공유 링크가 클립보드에 복사되었습니다!\n\n공유 링크:\n${shareUrl}`);
    } else {
      alert(`공유 링크: ${shareUrl}`);
    }
  };

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMaster, setIsMaster] = useState<boolean>(false);

  useEffect(() => {
    const checkRole = () => {
      if (typeof window !== 'undefined') {
        try {
          const userStr = localStorage.getItem('user');
          const userRole = localStorage.getItem('user_role');
          const u = userStr ? JSON.parse(userStr) : null;
          setCurrentUser(u);
          const masterActive = u?.role === 'master' || userRole === 'master' || u?.email === 'master@bapsang.com' || u?.nickname === '혼밥마스터';
          setIsMaster(Boolean(masterActive));
        } catch {
          setIsMaster(false);
        }
      }
    };

    checkRole();
    window.addEventListener('storage', checkRole);
    window.addEventListener('auth_change', checkRole);
    return () => {
      window.removeEventListener('storage', checkRole);
      window.removeEventListener('auth_change', checkRole);
    };
  }, []);

  const isAuthor = (currentUser && (
    (playlist.author_id && playlist.author_id === `u-${currentUser.id}`) ||
    (playlist.author && playlist.author === currentUser.nickname) ||
    (playlist.author && playlist.author === `${currentUser.nickname} (방장)`) ||
    (typeof window !== 'undefined' && localStorage.getItem('user_nickname') && playlist.author === localStorage.getItem('user_nickname'))
  )) || (
    playlist.author_id === 'u-me' || 
    playlist.id.startsWith('pl-my-') || 
    playlist.id.startsWith('pl-live-user-')
  );

  const canDelete = Boolean(isMaster || isAuthor);

  // Meal duration tag badge
  const durationSec = playlist.total_duration_sec || 0;
  const getDurationTag = () => {
    if (durationSec <= 450) {
      return { text: '⏱️ 5분 컷 속성식', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    } else if (durationSec <= 1050) {
      return { text: '🍱 15분 컷 표준식', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
    } else {
      return { text: '🍲 20분+ 여유식', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    }
  };

  const durTag = getDurationTag();

  return (
    <div className={`glass-panel rounded-2xl p-5 border transition-all duration-300 group relative ${
      showLiveBadge
        ? 'border-rose-500/30 hover:border-rose-500/60 bg-gradient-to-br from-rose-950/20 via-black/40 to-amber-950/20 shadow-lg shadow-rose-950/20'
        : 'border-white/10 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10'
    }`}>
      {/* Top Bar: Badges + Action Buttons */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        {/* Badges Area */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {showLiveBadge ? (
            <>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">방장: {playlist.author || '독고다이'}</span>
              </span>
              <RealtimeBadge playlistId={playlist.id} initialWatchers={playlist.active_watchers ?? 0} isJoined={isJoined} />
            </>
          ) : (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-inner ${durTag.color}`}>
              {durTag.text}
            </span>
          )}
        </div>

        {/* Action Buttons (Share + Edit + Delete + Recommend) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            onClick={handleShareClick}
            title="상대방에게 반찬 공유하기"
            className="p-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {isAuthor && onEditPlaylist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditPlaylist(playlist);
              }}
              title="내가 차린 반찬 제목 & 메뉴 수정하기"
              className="p-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {canDelete && onDeletePlaylist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(isMaster ? '👑 [마스터 관리자] 정말 이 반찬/플레이리스트를 전체 멸실 삭제하시겠습니까?' : '정말 이 방/반찬을 삭제하시겠습니까?')) {
                  onDeletePlaylist(playlist.id);
                }
              }}
              title={isMaster ? "👑 [마스터 관리자] 전체 삭제 권한" : "내가 개설한 방/반찬 삭제"}
              className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isMaster
                  ? 'bg-red-600/40 hover:bg-red-600/80 text-red-200 border border-red-500/60 shadow-lg shadow-red-950/50'
                  : 'bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-300" />
              {isMaster && <span className="text-[10px] font-black text-red-200">삭제</span>}
            </button>
          )}

          <button
            onClick={handleRecommendClick}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
              recommended
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                : 'bg-white/10 hover:bg-orange-600 hover:text-white text-gray-300 shadow-md hover:shadow-orange-600/30'
            }`}
            title={recommended ? '클릭 시 추천 취소' : '이 반찬 추천하기'}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${recommended ? 'text-emerald-400' : ''}`} />
            <span>{recommended ? '추천' : '추천'}</span>
            <span className="opacity-80">({recommendCount})</span>
          </button>
        </div>
      </div>

      {/* Full-width Title Row */}
      <Link href={`/playlists/${playlist.id}`} className="group-hover:text-orange-300 transition-colors block mb-3">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug flex items-center gap-1.5">
          <span>{playlist.title}</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-400 shrink-0" />
        </h3>
      </Link>

      {/* Metadata Bar */}
      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 text-xs text-gray-300">
        <div className="flex items-center gap-1 text-gray-400">
          <User className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="font-medium text-white truncate max-w-[120px]">{playlist.author || '방장'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 font-medium">
            영상 {playlist.videos ? playlist.videos.length : 0}개
          </span>
          <span className="flex items-center gap-1 font-bold text-orange-400">
            <Clock className="w-3.5 h-3.5" />
            총 {formatSecondsToMMSS(playlist.total_duration_sec)}
          </span>
        </div>
      </div>

      {/* Videos List (Expandable) */}
      {playlist.videos && playlist.videos.length > 0 && (
        <div className="mt-3 space-y-2">
          {playlist.videos.slice(0, expanded ? playlist.videos.length : 2).map((vid, idx) => (
            <VideoItem 
              key={vid.id || idx} 
              video={vid} 
              index={idx}
              onPlayInApp={onPlayVideo}
              onDeleteVideo={onDeleteVideo ? () => onDeleteVideo(playlist.id, idx) : undefined}
            />
          ))}

          {playlist.videos.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-orange-400 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              {expanded ? (
                <>
                  <span>접기</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>영상 {playlist.videos.length - 2}개 더보기</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
