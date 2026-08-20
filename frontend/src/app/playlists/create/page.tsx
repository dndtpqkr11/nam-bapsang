'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { UrlParserInput } from '@/components/UrlParserInput';
import { Video, Playlist } from '@/types';
import { formatSecondsToMMSS } from '@/lib/deeplink';
import { createPlaylist } from '@/lib/api';

export default function CreatePlaylistPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('점심식사');
  const [videos, setVideos] = useState<Video[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAddVideo = (video: Video) => {
    setVideos((prev) => [...prev, video]);
  };

  const handleRemoveVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const totalSec = videos.reduce((acc, v) => acc + v.duration_seconds, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || videos.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      // 1. 백엔드 API 연동하여 PostgreSQL DB에 저장
      const newPlaylist = await createPlaylist({ title, category, videos });

      // 2. 로컬 스토리지 보관함에도 저장하여 무조건 100% 지속
      let savedCreated: Playlist[] = [];
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('my_created_playlists');
        if (existing) {
          try { savedCreated = JSON.parse(existing); } catch {}
        }
        savedCreated.unshift(newPlaylist);
        localStorage.setItem('my_created_playlists', JSON.stringify(savedCreated));
      }

      showToast('🎉 새 15분 반찬이 DB에 성공적으로 차려졌습니다! 메인 피드로 이동합니다.');
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: any) {
      // 백엔드 연결 불가 시 클라이언트 내 만능 지속 보장
      const fallbackPl: Playlist = {
        id: `pl-my-${Date.now()}`,
        title,
        author: '나의 반찬',
        author_id: 'u-me',
        category,
        total_duration_sec: totalSec,
        fork_count: 0,
        active_watchers: 0,
        videos
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

      showToast('🎉 새 15분 반찬이 성공적으로 생성되었습니다!');
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen pb-16 bg-[#0B0C10] text-gray-100">
      <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>메인 피드로 돌아가기</span>
          </Link>
          <span className="text-sm font-bold text-white">새 반찬 차리기 (플레이리스트 생성)</span>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-2xl flex items-center gap-2.5 animate-bounce border border-orange-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 pt-8">
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-400" />
              <span>나만의 15분 맞춤 플레이리스트 만들기</span>
            </h1>
            <p className="text-xs text-gray-400">
              식사 시간에 시청할 영상 URL을 추가하여 나만의 꿀조합 반찬을 만드세요.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                플레이리스트 제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 🍱 점심 혼밥용 15분 이슈 요약 꿀조합"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-orange-500"
              />
            </div>


            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                영상 추가 (유튜브/넷플릭스 URL 파싱)
              </label>
              <UrlParserInput onAddVideo={handleAddVideo} />
            </div>

            {/* Added Videos List */}
            {videos.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>담긴 영상 목록 ({videos.length}개)</span>
                  <span className="text-orange-400">총 {formatSecondsToMMSS(totalSec)}</span>
                </div>

                <div className="space-y-2">
                  {videos.map((vid, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate font-medium text-white">{vid.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-gray-400">{formatSecondsToMMSS(vid.duration_seconds)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(idx)}
                          className="text-gray-400 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
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
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs sm:text-sm font-semibold transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting || !title.trim() || videos.length === 0}
              className={`px-6 py-2.5 rounded-xl orange-gradient-btn text-white text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer ${
                submitting || !title.trim() || videos.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? '반찬 차리는 중...' : '반찬 등록하기'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
