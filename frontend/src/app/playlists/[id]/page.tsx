'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, ThumbsUp, Users, Share2, Play, Sparkles, CheckCircle2 } from 'lucide-react';
import { Playlist, Video } from '@/types';
import { fetchPlaylistDetail, forkPlaylist, deletePlaylist } from '@/lib/api';
import { RealtimeBadge } from '@/components/RealtimeBadge';
import { VideoItem } from '@/components/VideoItem';
import { LiveChatDrawer } from '@/components/LiveChatDrawer';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { formatSecondsToMMSS } from '@/lib/deeplink';

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params?.id as string;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recommended, setRecommended] = useState<boolean>(false);
  const [recommendCount, setRecommendCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      if (!playlistId) return;
      setLoading(true);
      const data = await fetchPlaylistDetail(playlistId);
      
      if (!isMounted) return;

      if (data) {
        setPlaylist(data);
        setRecommendCount(data.fork_count || 0);
      } else {
        // Fallback sample data if not found in DB
        const fallback: Playlist = {
          id: playlistId || 'pl-1',
          title: '🍱 슈카월드 & 침착맨 15분 식사 꿀조합 반찬',
          author: '혼밥마스터',
          author_id: 'u-1',
          category: '식사 반찬',
          total_duration_sec: 890,
          fork_count: 142,
          active_watchers: 28,
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
        };
        setPlaylist(fallback);
        setRecommendCount(fallback.fork_count);
      }
      setLoading(false);
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [playlistId]);

  const handleRecommend = async () => {
    if (!playlist) return;
    if (recommended) {
      setRecommended(false);
      setRecommendCount((prev) => Math.max(0, prev - 1));
      showToast('추천이 취소되었습니다.');
    } else {
      try {
        const newCount = await forkPlaylist(playlist.id);
        setRecommendCount(newCount);
        setRecommended(true);
        showToast('이 반찬을 추천하셨습니다!');
      } catch (err) {
        setRecommendCount((prev) => prev + 1);
        setRecommended(true);
        showToast('이 반찬을 추천하셨습니다!');
      }
    }
  };

  const handleShareClick = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('📋 상대방 공유 링크가 클립보드에 복사되었습니다!');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b11] text-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-orange-400 text-lg font-bold animate-pulse">
          <Sparkles className="w-6 h-6 animate-spin" />
          <span>맞춤 반찬 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (!playlist) return null;

  // 실시간 합석 반찬 여부 식별 (live- 로 시작하는 실시간 반찬이면 채팅 켜기)
  const isLivePlaylist = playlist.id.startsWith('live-') || playlist.id.startsWith('pl-live-');

  const myNicknameStr = (typeof window !== 'undefined' && (localStorage.getItem('user_nickname') || (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')!).nickname))) || '독고다이';
  const myHostRoomIds: string[] = (typeof window !== 'undefined' && localStorage.getItem('my_host_room_ids'))
    ? (() => { try { return JSON.parse(localStorage.getItem('my_host_room_ids')!); } catch { return []; } })()
    : [];
  const isHostUser = isLivePlaylist && (
    playlist.author === myNicknameStr || 
    playlist.author === `${myNicknameStr} (방장)` || 
    playlist.author_id === 'u-me' ||
    myHostRoomIds.includes(playlist.id)
  );

  const handleDeleteLiveRoom = async (id: string) => {
    try { await deletePlaylist(id); } catch {}
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-gray-100 pb-20">
      <VideoPlayerModal 
        video={playingVideo}
        enableChat={isLivePlaylist}
        playlistId={playlist.id}
        isHost={isHostUser}
        hostNickname={playlist.author}
        onDeleteLiveRoom={handleDeleteLiveRoom}
        onClose={() => setPlayingVideo(null)}
        onRoomDeleted={() => {
          setPlayingVideo(null);
          router.push('/');
        }}
      />

      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 px-5 py-3.5 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-2xl flex items-center gap-2.5 animate-bounce border border-orange-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>메인 반찬 피드로 돌아가기</span>
          </button>
          
          <div className="flex items-center gap-3">
            {isLivePlaylist && (
              <RealtimeBadge playlistId={playlist.id} initialWatchers={playlist.active_watchers || 1} />
            )}
          </div>
        </div>
      </div>

      <main className={`max-w-6xl mx-auto px-4 sm:px-6 pt-6 grid gap-8 ${
        isLivePlaylist ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'
      }`}>
        
        {/* Playlist Details & Videos */}
        <div className={`${isLivePlaylist ? 'lg:col-span-2' : 'col-span-1'} space-y-6`}>
          
          {/* Header Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {playlist.title}
              </h1>

              <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-400 flex-wrap pt-1">
                <span className="text-white font-bold px-3 py-1 rounded-full bg-white/10 border border-white/10">
                  👨‍🍳 작성자: {playlist.author}
                </span>
                <span className="flex items-center gap-1 font-bold text-orange-400">
                  <Clock className="w-4 h-4" />
                  총 {formatSecondsToMMSS(playlist.total_duration_sec)}
                </span>
                <span className="text-gray-400">
                  동영상 {playlist.videos.length}개 조합
                </span>
              </div>
            </div>

            {/* Main Primary Controls */}
            <div className="pt-2 flex items-center gap-3 flex-wrap border-t border-white/10">
              <button
                onClick={() => setPlayingVideo(playlist.videos[0])}
                className="flex-1 min-w-[180px] py-3.5 px-6 rounded-2xl orange-gradient-btn text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>15분 맞춤 연속 재생 시작</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareClick}
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-blue-400 border border-white/10 transition-all cursor-pointer"
                  title="링크 공유하기"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleRecommend}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all duration-200 shadow-lg cursor-pointer ${
                    recommended
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:scale-105 shadow-orange-500/30'
                  }`}
                  title={recommended ? '클릭 시 추천 취소' : '이 반찬 추천하기'}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{recommended ? '추천함' : '추천'}</span>
                  <span>({recommendCount})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Video List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span>차려진 반찬 메뉴 구성 ({playlist.videos.length}개)</span>
            </h3>

            <div className="space-y-3">
              {playlist.videos.map((vid, idx) => (
                <VideoItem
                  key={vid.id || idx}
                  video={vid}
                  index={idx}
                  onPlayInApp={(v) => setPlayingVideo(v)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Chat Panel (Only rendered if Live Playlist) */}
        {isLivePlaylist && (
          <div className="lg:col-span-1 h-[600px] lg:h-auto lg:sticky lg:top-24">
            <LiveChatDrawer
              playlistId={playlist.id}
              playlistTitle={playlist.title}
              isHost={isHostUser}
              hostNickname={playlist.author}
              onDeleteLiveRoom={handleDeleteLiveRoom}
              onRoomDeleted={() => {
                router.push('/');
              }}
            />
          </div>
        )}

      </main>
    </div>
  );
}
