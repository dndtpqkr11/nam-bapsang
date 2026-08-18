'use client';

import React, { useState } from 'react';
import { X, UserPlus, LogIn, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signupUser, loginUser } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { nickname: string; email: string }) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup'
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!nickname.trim()) {
          throw new Error('닉네임을 입력해주세요.');
        }
        const data = await signupUser(email, password, nickname);
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        const userObj = data.user || { nickname, email };
        localStorage.setItem('user', JSON.stringify(userObj));
        onSuccess(userObj);
        onClose();
      } else {
        const data = await loginUser(email, password);
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        const userObj = data.user || { nickname: email.split('@')[0], email };
        localStorage.setItem('user', JSON.stringify(userObj));
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
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>회원가입</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>로그인</span>
          </button>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {mode === 'signup' ? '🍱 남의 밥상 회원가입' : '🍱 남의 밥상 로그인'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'signup'
              ? '가입 후 나만의 15분 맞춤 플레이리스트를 저장해보세요.'
              : '등록된 이메일과 비밀번호로 로그인하세요.'}
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
          {mode === 'signup' && (
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
          )}

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

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>처리 중...</span>
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
