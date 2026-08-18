'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Utensils, Sparkles, BookmarkPlus, LogOut, User, CheckCircle2, Tv, Crown } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { OttConnectModal } from '@/components/OttConnectModal';

interface NavbarProps {
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateModal }) => {
  const [user, setUser] = useState<{ nickname: string; email: string; role?: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isOttModalOpen, setIsOttModalOpen] = useState(false);
  const [connectedOtts, setConnectedOtts] = useState<string[]>(['youtube']);

  useEffect(() => {
    // Check authentication state from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    }

    const savedOtts = localStorage.getItem('connected_otts');
    if (savedOtts) {
      try {
        setConnectedOtts(JSON.parse(savedOtts));
      } catch {
        setConnectedOtts(['youtube']);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    setUser(null);
    showToast('로그아웃 되었습니다.');
  };

  const handleAuthSuccess = (loggedUser: { nickname: string; email: string; role?: string }) => {
    setUser(loggedUser);
    showToast(`${loggedUser.nickname}님 환영합니다! ${loggedUser.role === 'master' ? '👑 (마스터 관리자 권한)' : ''}`);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <>
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-orange-600 text-white font-semibold text-sm shadow-2xl flex items-center gap-2 animate-bounce border border-orange-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <AuthModal
        key={`${authMode}-${isAuthModalOpen}`}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

      <OttConnectModal
        isOpen={isOttModalOpen}
        onClose={() => setIsOttModalOpen(false)}
        onUpdate={(updated) => {
          setConnectedOtts(updated);
          showToast(`OTT 연동 설정이 업데이트되었습니다. (${updated.length}개 서비스 연동 중)`);
        }}
      />

      <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                남의 반찬 <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30">15분 컷</span>
              </h1>
              <p className="text-xs text-gray-400">식사 맞춤 OTT 콘텐츠 플레이리스트</p>
            </div>
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* OTT Connect Button */}
            <button
              onClick={() => setIsOttModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs sm:text-sm font-bold transition-all duration-200 border border-white/10 cursor-pointer"
            >
              <Tv className="w-4 h-4 text-amber-400" />
              <span>OTT 연동</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-extrabold text-[10px] border border-orange-500/30">
                {connectedOtts.length}개
              </span>
            </button>

            <Link
              href="/my"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs sm:text-sm font-semibold transition-all duration-200"
            >
              <BookmarkPlus className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">내 보관함</span>
            </Link>

            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-md shadow-orange-600/30 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>반찬 차리기</span>
            </button>

            {/* User Profile / Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className={`hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${
                  user.role === 'master'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                    : 'bg-white/5 text-gray-300 border-white/10'
                }`}>
                  {user.role === 'master' ? (
                    <>
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-black text-amber-300">{user.nickname} (마스터)</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-orange-400" />
                      <span className="font-bold text-white">{user.nickname} (일반)</span>
                    </>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors cursor-pointer"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                <button
                  onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  로그인
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-orange-400 border border-orange-500/30 transition-all cursor-pointer"
                >
                  회원가입
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
