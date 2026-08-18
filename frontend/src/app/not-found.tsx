'use client';

import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, Home, Search, Compass, Sparkles, Clock, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0C10] text-gray-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Header Bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              남의 밥상 <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30">15분 컷</span>
            </h1>
          </div>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-semibold transition-all"
        >
          <Home className="w-4 h-4 text-orange-400" />
          <span>메인 피드로 돌아가기</span>
        </Link>
      </header>

      {/* Main 404 Content */}
      <main className="max-w-3xl mx-auto w-full text-center my-auto py-12 px-4 space-y-8">
        <div className="relative inline-block">
          {/* Animated Glow Background */}
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-600/30 via-amber-600/20 to-orange-500/30 rounded-full blur-2xl animate-pulse opacity-75" />

          {/* 404 Display */}
          <div className="relative glass-panel rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4 shadow-inner">
              <UtensilsCrossed className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full bg-orange-500/20 text-orange-400 font-mono text-xs font-bold border border-orange-500/30">
                HTTP ERROR 404 : PAGE NOT FOUND
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                빈 밥상입니다! <br />
                <span className="text-orange-400">요청하신 페이지를 찾을 수 없습니다.</span>
              </h2>
            </div>

            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              주소가 잘못되었거나 삭제된 플레이리스트일 수 있습니다. <br className="hidden sm:block" />
              아래의 15분 맞춤 밥상 피드에서 맛있는 OTT 영상 조합을 찾아보세요!
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition-all active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>15분 맞춤 피드 탐색하기</span>
              </Link>
              <Link
                href="/my"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-200 font-bold text-sm border border-white/10 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>내 보관함 가기</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Mealtime Suggestions */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10 text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
            <Clock className="w-4 h-4" />
            <span>추천 15분 컷 피드 바로가기</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/?duration=10"
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 transition-all text-xs space-y-1 block group"
            >
              <span className="font-bold text-white group-hover:text-orange-400 flex items-center justify-between">
                ⚡ 10분 컷 밥상
                <ArrowLeft className="w-3 h-3 rotate-180 text-gray-500 group-hover:text-orange-400" />
              </span>
              <p className="text-gray-400 text-[11px]">바쁜 날 빠르게 한 끼 해결</p>
            </Link>
            <Link
              href="/?duration=15"
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 transition-all text-xs space-y-1 block group"
            >
              <span className="font-bold text-white group-hover:text-orange-400 flex items-center justify-between">
                🍱 15분 컷 밥상
                <ArrowLeft className="w-3 h-3 rotate-180 text-gray-500 group-hover:text-orange-400" />
              </span>
              <p className="text-gray-400 text-[11px]">표준 식사 시간 황금 조합</p>
            </Link>
            <Link
              href="/?duration=20"
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 transition-all text-xs space-y-1 block group"
            >
              <span className="font-bold text-white group-hover:text-orange-400 flex items-center justify-between">
                🍲 20분 컷 밥상
                <ArrowLeft className="w-3 h-3 rotate-180 text-gray-500 group-hover:text-orange-400" />
              </span>
              <p className="text-gray-400 text-[11px]">여유로운 식사와 길게 시청</p>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 text-xs text-gray-500 border-t border-white/5">
        © 2026 남의 밥상 (MealTable) - 15분 맞춤형 OTT 플레이리스트 공유 및 실시간 소셜 시청 플랫폼
      </footer>
    </div>
  );
}
