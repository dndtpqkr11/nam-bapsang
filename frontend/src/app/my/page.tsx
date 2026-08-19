'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { PlaylistCard } from '@/components/PlaylistCard';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { UrlParserInput } from '@/components/UrlParserInput';
import { Playlist, Video } from '@/types';
import { fetchPlaylists, deletePlaylist } from '@/lib/api';
import { formatSecondsToMMSS } from '@/lib/deeplink';
import { Bookmark, User, Utensils, CheckCircle2, ArrowLeft, ThumbsUp, Pencil, X, Trash2, Crown } from 'lucide-react';

export default function MyPage() {
  const [profile, setProfile] = useState<{ nickname: string; email: string }>({
    nickname: '혼밥마스터',
    email: 'master@bapsang.com'
  });
  const [user, setUser] = useState<{ nickname: string; email: string; role?: string } | null>(null);

  const [myCreated, setMyCreated] = useState<Playlist[]>([]);
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<Playlist[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'recommended'>('all');

  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftVideos, setDraftVideos] = useState<Video[]>([]);
  const [submittingModal, setSubmittingModal] = useState<boolean>(false);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {}
      }

      // Load my created playlists and live rooms
      let savedList: Playlist[] = [];
      const savedCreated = localStorage.getItem('my_created_playlists');
      if (savedCreated) {
        try { savedList = JSON.parse(savedCreated); } catch {}
      }

      const savedLive = localStorage.getItem('user_live_rooms');
      if (savedLive) {
        try {
          const parsedLive: Playlist[] = JSON.parse(savedLive);
          parsedLive.forEach((room) => {
            if (!savedList.some((p) => p.id === room.id)) {
              savedList.unshift(room);
            }
          });
        } catch {}
      }
      setMyCreated(savedList);

      // Load recommended playlists
      const savedRecObjs = localStorage.getItem('recommended_playlists_objects');
      if (savedRecObjs) {
        try {
          setRecommendedPlaylists(JSON.parse(savedRecObjs));
        } catch {}
      }

      const savedRecIds = localStorage.getItem('recommended_playlist_ids');
      if (savedRecIds) {
        try {
          setRecommendedIds(JSON.parse(savedRecIds));
        } catch {}
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenEditModal = (pl: Playlist) => {
    setEditingPlaylist(pl);
    setDraftTitle(pl.title);
    setDraftVideos(pl.videos || []);
    setIsModalOpen(true);
  };

  const handleAddVideoToDraft = (video: Video) => {
    setDraftVideos(prev => [...prev, video]);
    showToast('영상이 리스트에 추가되었습니다!');
  };

  const handleEditSubmit = () => {
    if (!editingPlaylist) return;

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

    const updatedPl: Playlist = {
      ...editingPlaylist,
      title: finalTitle,
      total_duration_sec: totalSec,
      videos: finalVideos
    };

    const updatedCreatedList = myCreated.map(pl => pl.id === editingPlaylist.id ? updatedPl : pl);
    setMyCreated(updatedCreatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('my_created_playlists', JSON.stringify(updatedCreatedList));
    }

    showToast('✏️ 반찬 제목 및 메뉴 구성이 성공적으로 수정되었습니다!');
    setEditingPlaylist(null);
    setIsModalOpen(false);
    setSubmittingModal(false);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try { await deletePlaylist(playlistId); } catch {}

    const updatedCreated = myCreated.filter(pl => pl.id !== playlistId);
    setMyCreated(updatedCreated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('my_created_playlists', JSON.stringify(updatedCreated));
      try {
        const liveRooms: Playlist[] = JSON.parse(localStorage.getItem('user_live_rooms') || '[]');
        const updatedLive = liveRooms.filter(pl => pl.id !== playlistId);
        localStorage.setItem('user_live_rooms', JSON.stringify(updatedLive));
      } catch {}
      try {
        let hostRoomIds: string[] = JSON.parse(localStorage.getItem('my_host_room_ids') || '[]');
        hostRoomIds = hostRoomIds.filter(id => id !== playlistId);
        localStorage.setItem('my_host_room_ids', JSON.stringify(hostRoomIds));
      } catch {}
    }

    showToast('🗑️ 차린 반찬/라이브 방이 보관함과 목록에서 삭제되었습니다.');
  };

  const handleDeleteVideo = (playlistId: string, videoIndex: number) => {
    const targetPl = myCreated.find(pl => pl.id === playlistId);
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

    const updatedCreatedList = myCreated.map(pl => pl.id === playlistId ? updatedPl : pl);
    setMyCreated(updatedCreatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('my_created_playlists', JSON.stringify(updatedCreatedList));
    }

    showToast('🗑️ 선택하신 영상 컨텐츠가 삭제되었습니다.');
  };

  const recommendedList = recommendedPlaylists.filter(pl => recommendedIds.includes(pl.id));
  const displayNickname = (typeof window !== 'undefined' && (localStorage.getItem('user_nickname') || (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')!).nickname))) || user?.nickname || profile.nickname || '독고다이';

  const isAnyModalActive = isModalOpen || playingVideo !== null;

  return (
    <div className="min-h-screen pb-24 text-gray-100 bg-[#080b11]">
      <Navbar onOpenCreateModal={() => {}} />

      {/* Video Player Modal (No chat for My Page) */}
      <VideoPlayerModal
        video={playingVideo}
        enableChat={false}
        onClose={() => setPlayingVideo(null)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 px-5 py-3.5 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-2xl flex items-center gap-2.5 animate-bounce border border-orange-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Sub-header */}
      <div className="border-b border-white/10 bg-white/5 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>메인 피드로 돌아가기</span>
          </Link>
          <div className="text-xs text-orange-400 font-bold flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5" />
            <span>내 보관함 (내 반찬 & 추천 분리)</span>
          </div>
        </div>
      </div>

      <main className={`max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8 transition-all ${
        isAnyModalActive ? 'pointer-events-none select-none opacity-50' : ''
      }`}>
        
        {/* Profile Card */}
        <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-500/30">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>{displayNickname}</span>
                  {user?.role === 'master' ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black border border-amber-500/40 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>👑 마스터</span>
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                      🍚 일반
                    </span>
                  )}
                </h1>
                <p className="text-xs text-gray-400 mt-1">{user ? user.email : profile.email}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="text-center px-4">
                <div className="text-xs text-gray-400">내가 차린 반찬</div>
                <div className="text-lg font-bold text-orange-400 flex items-center justify-center gap-1 mt-0.5">
                  <Utensils className="w-4 h-4" />
                  <span>{myCreated.length}개</span>
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center px-4">
                <div className="text-xs text-gray-400">추천한 반찬 수</div>
                <div className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{recommendedList.length}개</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Saved & Created Playlists Filter Tabs & Separated Sections */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                  activeTab === 'all'
                    ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                }`}
              >
                <span>전체 보관함 ({myCreated.length + recommendedList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                  activeTab === 'my'
                    ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                }`}
              >
                <span>내가 차린 반찬 ({myCreated.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('recommended')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                  activeTab === 'recommended'
                    ? 'bg-amber-500 text-black border-amber-400 font-black shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                }`}
              >
                <span>내가 추천한 반찬 ({recommendedList.length})</span>
              </button>
            </div>
          </div>

          {/* Section 1: 내가 차린 반찬 */}
          {(activeTab === 'all' || activeTab === 'my') && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-400" />
                  <span>내가 차린 반찬 ({myCreated.length}개)</span>
                </h3>
              </div>

              {myCreated.length === 0 ? (
                <div className="text-center py-10 rounded-2xl bg-white/5 border border-white/10 text-gray-400 space-y-2">
                  <p className="text-sm font-semibold">아직 직접 차린 반찬이 없습니다.</p>
                  <Link
                    href="/"
                    className="inline-block px-4 py-2 rounded-xl orange-gradient-btn text-white text-xs font-bold shadow-md mt-1"
                  >
                    + 메인에서 새 맞춤 반찬 차리기
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {myCreated.map((pl) => (
                    <PlaylistCard 
                      key={`my-${pl.id}`} 
                      playlist={pl} 
                      onFork={() => {}} 
                      onPlayVideo={(v) => setPlayingVideo(v)}
                      onDeletePlaylist={handleDeletePlaylist}
                      onDeleteVideo={handleDeleteVideo}
                      onEditPlaylist={handleOpenEditModal}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Divider when in 'all' tab */}
          {activeTab === 'all' && myCreated.length > 0 && recommendedList.length > 0 && (
            <div className="border-b border-white/10 my-6" />
          )}

          {/* Section 2: 내가 추천한 반찬 */}
          {(activeTab === 'all' || activeTab === 'recommended') && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-amber-400" />
                  <span>내가 추천한 반찬 ({recommendedList.length}개)</span>
                </h3>
              </div>

              {recommendedList.length === 0 ? (
                <div className="text-center py-10 rounded-2xl bg-white/5 border border-white/10 text-gray-400 space-y-2">
                  <p className="text-sm font-semibold">아직 추천한 반찬이 없습니다.</p>
                  <p className="text-xs text-gray-500">
                    메인 피드에서 마음에 드는 반찬 카드의 <strong className="text-emerald-400 font-bold">[👍 추천]</strong> 버튼을 누르시면 이곳에 보관됩니다!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {recommendedList.map((pl) => (
                    <PlaylistCard 
                      key={`rec-${pl.id}`} 
                      playlist={pl} 
                      onFork={() => {}} 
                      onPlayVideo={(v) => setPlayingVideo(v)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

      </main>

      {/* EDIT PLAYLIST MODAL */}
      {isModalOpen && editingPlaylist && (
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
                <Pencil className="w-5 h-5 text-amber-400" />
                <span>내가 차린 반찬 수정하기</span>
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
                  placeholder="예: 🍱 슈카월드 & 침착맨 식사 꿀조합 반찬"
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
                onClick={handleEditSubmit}
                disabled={submittingModal}
                className="px-6 py-2.5 rounded-xl orange-gradient-btn text-white text-sm font-bold shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {submittingModal ? '수정 중...' : '반찬 수정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
