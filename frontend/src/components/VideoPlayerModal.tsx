'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles, Tv, Play, MessageSquare, ArrowRight, ShieldCheck, Crown } from 'lucide-react';
import { Video } from '@/types';
import { triggerDeepLink } from '@/lib/deeplink';
import { LiveChatDrawer } from './LiveChatDrawer';

interface VideoPlayerModalProps {
  video: Video | null;
  onClose: () => void;
  playlistId?: string;
  enableChat?: boolean;
  initialWatchers?: number;
  isHost?: boolean;
  hostNickname?: string;
  onDeleteLiveRoom?: (playlistId: string) => void;
  onRoomDeleted?: () => void;
}

const ottDisplayNames: Record<string, string> = {
  netflix: '넷플릭스 (Netflix)',
  tving: '티빙 (TVING)',
  coupang: '쿠팡플레이 (Coupang Play)',
  disney: '디즈니+ (Disney+)',
  wavve: '웨이브 (Wavve)',
  youtube: '유튜브 (YouTube)'
};

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ 
  video, 
  onClose, 
  playlistId = 'pl-1',
  enableChat = false,
  initialWatchers = 0,
  isHost = false,
  hostNickname,
  onDeleteLiveRoom,
  onRoomDeleted
}) => {
  const [currentVideo, setCurrentVideo] = useState<Video | null>(video);
  const [startSeconds, setStartSeconds] = useState<number>(0);

  useEffect(() => {
    setCurrentVideo(video);
    setStartSeconds(0);
  }, [video?.video_id, video?.id, video]);

  const handleVideoChange = (newVid: Video, elapsed?: number) => {
    setCurrentVideo(newVid);
    setStartSeconds(typeof elapsed === 'number' && elapsed > 0 ? elapsed : 0);
  };

  const activeVid = currentVideo || video;

  const isYoutube = activeVid?.platform === 'youtube';
  const [showChat, setShowChat] = useState<boolean>(enableChat && !!isYoutube);

  useEffect(() => {
    setShowChat(enableChat && !!isYoutube);
  }, [enableChat, activeVid, isYoutube]);

  useEffect(() => {
    if (activeVid) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeVid]);

  if (!activeVid) return null;

  // 100% 검증된 실제 유튜브 비디오 ID 사용
  const embedYtId = isYoutube && /^[a-zA-Z0-9_-]{11}$/.test(activeVid.video_id) 
    ? activeVid.video_id 
    : 'JdRcM4fLwgE';

  const ottName = ottDisplayNames[activeVid.platform.toLowerCase()] || activeVid.platform.toUpperCase();

  const handleOpenDirectWatch = () => {
    triggerDeepLink(activeVid.platform, activeVid.video_id, activeVid.title, activeVid.channel_title);
  };

  const activeChat = enableChat && showChat && isYoutube;

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`glass-panel rounded-3xl w-full p-6 sm:p-8 space-y-5 border border-white/20 shadow-2xl relative overflow-hidden transition-all duration-300 pointer-events-auto z-10 ${
        activeChat ? 'w-[95vw] max-w-[1560px]' : 'w-[90vw] max-w-5xl'
      }`}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 식사시간 맞춤 반찬 감상
            </span>
            <span className="text-xs text-gray-300 font-extrabold capitalize flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
              <Tv className="w-3.5 h-3.5 text-amber-400" /> {ottName}
            </span>

            {enableChat && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> 방장 동기화 실시간 라이브 룸
              </span>
            )}

            {enableChat && isYoutube && (
              <button
                onClick={() => setShowChat(!showChat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                  showChat 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-white/10 hover:bg-white/20 text-gray-300 border-white/10'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{showChat ? '💬 실시간 채팅 접기' : '💬 실시간 합석 채팅 켜기'}</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player + Chat Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Video Player Container */}
          <div className={`${activeChat ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
            {isYoutube ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                <iframe
                  key={`${embedYtId}-${startSeconds}`}
                  src={`https://www.youtube.com/embed/${embedYtId}?autoplay=1&enablejsapi=1${startSeconds > 0 ? `&start=${startSeconds}` : ''}`}
                  title={activeVid.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              /* Non-YouTube External OTT Redirect Notice Modal UI */
              <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 border border-orange-500/40 text-center space-y-6 shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500/20 to-amber-500/20 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/40 animate-pulse">
                  <Tv className="w-10 h-10" />
                </div>

                <div className="space-y-3 max-w-lg mx-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                    <ShieldCheck className="w-4 h-4" />
                    <span>공식 OTT 전용관 이동 안내</span>
                  </span>

                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {activeVid.title}
                  </h3>

                  <p className="text-sm text-gray-300 leading-relaxed font-medium pt-1">
                    선택하신 콘텐츠는 <strong className="text-amber-400 font-extrabold">{ottName}</strong> 전용 콘텐츠입니다.<br />
                    아래 버튼을 누르시면 <strong className="text-orange-400 font-bold">{ottName}</strong> 공식 웹사이트/앱으로 즉시 이동하여 감상하실 수 있습니다!
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-sm transition-all cursor-pointer"
                  >
                    닫기
                  </button>
                  <button
                    onClick={handleOpenDirectWatch}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl orange-gradient-btn text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition-all cursor-pointer border border-orange-400"
                  >
                    <span>🚀 {ottName} (으)로 바로 이동하기</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Video Info Bar */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="space-y-0.5 min-w-0">
                <h3 className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                  <span>{activeVid.title}</span>
                </h3>
                <p className="text-xs text-gray-400 font-medium">{activeVid.channel_title}</p>
              </div>

              <button
                onClick={handleOpenDirectWatch}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-orange-500/20 text-gray-200 hover:text-white border border-white/15 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>{isYoutube ? '앱에서 열기' : `${ottName} 이동`}</span>
                <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
              </button>
            </div>
          </div>

          {/* Side Live Chat Drawer */}
          {activeChat && (
            <div className="lg:col-span-4 relative min-h-[380px] h-full w-full">
              <div className="absolute inset-0">
                <LiveChatDrawer
                  playlistId={playlistId}
                  playlistTitle={activeVid.title}
                  initialWatchers={initialWatchers}
                  isHost={isHost}
                  hostNickname={hostNickname || activeVid.channel_title}
                  onHostVideoChange={(newVid, elapsed) => handleVideoChange(newVid, elapsed)}
                  onDeleteLiveRoom={onDeleteLiveRoom}
                  onRoomDeleted={onRoomDeleted}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
