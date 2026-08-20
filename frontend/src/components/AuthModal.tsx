'use client';

import React, { useState } from 'react';
import { X, UserPlus, LogIn, Mail, Lock, User, AlertCircle, CheckCircle2, Crown, Key, ShieldCheck } from 'lucide-react';
import { signupUser, loginUser, promoteUser } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { nickname: string; email: string; role?: string }) => void;
  initialMode?: 'login' | 'signup' | 'promote';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup'
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'promote'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [masterKey, setMasterKey] = useState('MASTER2026');
  const [showMasterInput, setShowMasterInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed.email && !email) setEmail(parsed.email);
            if (parsed.nickname && !nickname) setNickname(parsed.nickname);
          } catch {}
        }
      }
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'promote') {
        if (!masterKey.trim()) {
          throw new Error('마스터 보안키를 입력해주세요.');
        }
        const data = await promoteUser(masterKey.trim(), email.trim() || undefined);
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        const userObj = data.user || { nickname: nickname || '혼밥마스터', email: email || 'master@bapsang.com', role: 'master' };
        userObj.role = 'master';
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('user_role', 'master');
        if (userObj.nickname) localStorage.setItem('user_nickname', userObj.nickname);
        
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('auth_change'));

        onSuccess(userObj);
        onClose();
      } else if (mode === 'signup') {
        if (!nickname.trim()) {
          throw new Error('닉네임을 입력해주세요.');
        }
        const data = await signupUser(email, password, nickname, showMasterInput ? masterKey.trim() : undefined);
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        const userObj = data.user || { nickname, email, role: (showMasterInput && masterKey.trim() === 'MASTER2026') ? 'master' : 'user' };
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('user_role', userObj.role || 'user');
        if (userObj.nickname) localStorage.setItem('user_nickname', userObj.nickname);

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('auth_change'));

        onSuccess(userObj);
        onClose();
      } else {
        const data = await loginUser(email, password, showMasterInput ? masterKey.trim() : undefined);
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        const userObj = data.user || { nickname: email.split('@')[0], email, role: (showMasterInput && masterKey.trim() === 'MASTER2026') ? 'master' : 'user' };
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('user_role', userObj.role || 'user');
        if (userObj.nickname) localStorage.setItem('user_nickname', userObj.nickname);

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('auth_change'));

        onSuccess(userObj);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/20 relative space-y-5 shadow-2xl animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Headers */}
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mode === 'signup'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>회원가입</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mode === 'login'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>로그인</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('promote');
              setError(null);
              setMasterKey('MASTER2026');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mode === 'promote'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md shadow-amber-500/30'
                : 'text-amber-400/80 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>👑 마스터 승격</span>
          </button>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {mode === 'signup' && '🍱 남의 밥상 회원가입'}
            {mode === 'login' && '🍱 남의 밥상 로그인'}
            {mode === 'promote' && '👑 마스터 관리자 즉시 승격'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'signup' && '가입 후 나만의 15분 맞춤 플레이리스트를 자유롭게 즐겨보세요.'}
            {mode === 'login' && '등록된 이메일과 비밀번호로 로그인하세요.'}
            {mode === 'promote' && '마스터 보안키를 입력하여 현재/기존 계정을 전체 관리자 권한으로 승격합니다.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'promote' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>마스터 관리자 보안키 인증</span>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  마스터 보안키 (기본: MASTER2026)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    placeholder="MASTER2026"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 text-sm text-amber-300 font-mono font-bold border border-amber-500/40 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  승격할 계정 이메일 (선택)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="현재 로그인된 이메일 또는 새 이메일"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              
              <p className="text-[10px] text-amber-400/90 leading-relaxed">
                * 승격 즉시 상단 👑 황금 마스터 배지가 활성화되며, [남이 차린 반찬]을 포함한 모든 밥상 및 라이브방 전체 멸실 삭제 권한을 획득합니다.
              </p>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  닉네임
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="예: 혼밥마스터"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Master Key Input Option */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowMasterInput(!showMasterInput)}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1 cursor-pointer select-none"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{showMasterInput ? '🔑 마스터 인증키 입력 접기' : '🔑 가입과 동시에 마스터 관리자로 승격하시겠습니까?'}</span>
                </button>

                {showMasterInput && (
                  <div className="mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 animate-fadeIn">
                    <label className="block text-[11px] font-bold text-amber-300">
                      마스터 보안키 입력
                    </label>
                    <div className="relative">
                      <Crown className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={masterKey}
                        onChange={(e) => setMasterKey(e.target.value)}
                        placeholder="MASTER2026"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 text-xs text-amber-200 placeholder-amber-500/50 border border-amber-500/40 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {mode !== 'promote' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  이메일 주소
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'login' && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMasterInput(!showMasterInput)}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1 cursor-pointer select-none"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{showMasterInput ? '🔑 마스터 인증키 입력 접기' : '🔑 로그인과 동시에 마스터 관리자로 승격'}</span>
              </button>

              {showMasterInput && (
                <div className="mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 animate-fadeIn">
                  <label className="block text-[11px] font-bold text-amber-300">
                    마스터 보안키 입력
                  </label>
                  <div className="relative">
                    <Crown className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={masterKey}
                      onChange={(e) => setMasterKey(e.target.value)}
                      placeholder="MASTER2026"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 text-xs text-amber-200 placeholder-amber-500/50 border border-amber-500/40 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl disabled:opacity-40 text-xs font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'promote'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-amber-500/30'
                  : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30'
              }`}
            >
              {loading ? (
                <span>처리 중...</span>
              ) : mode === 'promote' ? (
                <>
                  <Crown className="w-4 h-4" />
                  <span>👑 마스터 관리자로 승격 완료</span>
                </>
              ) : mode === 'signup' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>회원가입 완료 및 로그인</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>로그인</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

