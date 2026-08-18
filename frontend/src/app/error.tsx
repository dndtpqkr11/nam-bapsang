'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured client page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-gray-100 flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center space-y-6 border border-white/10 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">
            일시적인 페이지 연결 오류
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            페이지 전환 중 네트워크 또는 모듈 갱신 상태가 누락되었습니다. <br />
            아래 버튼을 눌러 다시 시도해주세요.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>다시 시도 (Reset)</span>
          </button>
          
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs border border-white/10 transition-all active:scale-95"
          >
            <Home className="w-4 h-4 text-orange-400" />
            <span>메인 피드</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
