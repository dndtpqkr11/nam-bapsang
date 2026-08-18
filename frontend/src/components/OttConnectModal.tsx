'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Tv, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface OttConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (connectedOtts: string[]) => void;
}

export interface OttPlatform {
  id: string;
  name: string;
  color: string;
  icon: string;
  desc: string;
  requiresSubscription: boolean;
}

export const OTT_PLATFORMS: OttPlatform[] = [
  {
    id: 'youtube',
    name: 'YouTube / Premium',
    color: 'from-red-600 to-rose-700',
    icon: '▶️',
    desc: '무료 시청 가능 & 프리미엄 광고 제거 지원',
    requiresSubscription: false
  },
  {
    id: 'netflix',
    name: 'Netflix (넷플릭스)',
    color: 'from-red-700 to-red-900',
    icon: '🎬',
    desc: '영화, 드라마, 애니메이션 본편 직접 앱 연동',
    requiresSubscription: true
  },
  {
    id: 'tving',
    name: 'Tving (티빙)',
    color: 'from-rose-600 to-red-600',
    icon: '🍿',
    desc: '국내 인기 예능, 실시간 라이브 & 드라마',
    requiresSubscription: true
  },
  {
    id: 'coupang',
    name: 'Coupang Play (쿠팡플레이)',
    color: 'from-blue-600 to-cyan-600',
    icon: '⚽',
    desc: '스포츠 중계, 독점 예능 & 영화 시리즈',
    requiresSubscription: true
  },
  {
    id: 'disney',
    name: 'Disney+ (디즈니+)',
    color: 'from-blue-700 to-indigo-900',
    icon: '🏰',
    desc: '마블, 디즈니, 아바타 & 애니메이션 시리즈',
    requiresSubscription: true
  },
  {
    id: 'wavve',
    name: 'Wavve (웨이브)',
    color: 'from-cyan-600 to-blue-700',
    icon: '🌊',
    desc: '지상파 방송 다시보기 & 해외 명작 시리즈',
    requiresSubscription: true
  }
];

export const OttConnectModal: React.FC<OttConnectModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [connected, setConnected] = useState<string[]>(['youtube']);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const saved = localStorage.getItem('connected_otts');
    if (saved) {
      try {
        setConnected(JSON.parse(saved));
      } catch {
        setConnected(['youtube']);
      }
    } else {
      localStorage.setItem('connected_otts', JSON.stringify(['youtube']));
    }
  }, []);

  if (!isOpen) return null;

  const handleToggleConnect = (id: string) => {
    setLoadingId(id);
    setTimeout(() => {
      let updated: string[];
      if (connected.includes(id)) {
        updated = connected.filter((item) => item !== id);
      } else {
        updated = [...connected, id];
      }
      setConnected(updated);
      localStorage.setItem('connected_otts', JSON.stringify(updated));
      onUpdate(updated);
      setLoadingId(null);
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-panel rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-white/15 shadow-2xl relative pointer-events-auto z-10">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>OTT 서비스 연동 설정</span>
              </h3>
              <p className="text-xs text-gray-400">보유하신 OTT 계정을 연동하면 원터치 딥링크 시청 가능</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-3 text-xs text-orange-300">
          <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0" />
          <span>연동 시 개인 계정 비밀번호는 저장되지 않으며, 앱 직접 이탈 딥링크용 상태로만 활용됩니다.</span>
        </div>

        {/* OTT Platform List */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {OTT_PLATFORMS.map((ott) => {
            const isConn = connected.includes(ott.id);
            const isLoading = loadingId === ott.id;

            return (
              <div
                key={ott.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                  isConn
                    ? 'bg-white/10 border-orange-500/40 shadow-md'
                    : 'bg-white/5 border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${ott.color} flex items-center justify-center text-xl shadow-md shrink-0`}>
                    {ott.icon}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{ott.name}</span>
                      {isConn && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 연동됨
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 font-medium">{ott.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleConnect(ott.id)}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 shrink-0 cursor-pointer ${
                    isLoading
                      ? 'bg-gray-700 text-gray-400 cursor-wait'
                      : isConn
                      ? 'bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-gray-300 border border-white/10'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 hover:scale-105'
                  }`}
                >
                  {isLoading ? '처리 중...' : isConn ? '연동 해제' : '연동하기'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl orange-gradient-btn text-white text-sm font-bold shadow-lg transition-all cursor-pointer"
          >
            설정 완료
          </button>
        </div>

      </div>
    </div>
  );
};
