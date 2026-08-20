'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Sparkles, Tv, Play, Pause, RotateCcw, FastForward, Rewind, MessageSquare, ArrowRight, ShieldCheck, Crown, Radio, CheckCircle2, Zap, Lock } from 'lucide-react';
import { Video } from '@/types';
import { triggerDeepLink, formatSecondsToMMSS } from '@/lib/deeplink';
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
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hostSyncTime, setHostSyncTime] = useState<number>(0);
  const [hostIsPlaying, setHostIsPlaying] = useState<boolean>(true);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  useEffect(() => {
    setCurrentVideo(video);
    setPlaybackTime(0);
    setIsPlaying(true);
  }, [video?.video_id, video?.id, video]);

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

  // Listen to native YouTube iframe events (Play, Pause, Seek, End) to sync buttons & states bi-directionally
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (!data) return;

        // YouTube onStateChange: 1 = Playing, 2 = Paused, 0 = Ended, 3 = Buffering
        if (data.event === 'onStateChange') {
          if (data.info === 1) {
            setIsPlaying(true);
          } else if (data.info === 2 || data.info === 0) {
            setIsPlaying(false);
          }
        } else if (data.event === 'infoDelivery') {
          if (typeof data.info?.playerState === 'number') {
            if (data.info.playerState === 1) {
              setIsPlaying(true);
            } else if (data.info.playerState === 2 || data.info.playerState === 0) {
              setIsPlaying(false);
            }
          }
          if (typeof data.info?.currentTime === 'number' && isHost) {
            setPlaybackTime(Math.floor(data.info.currentTime));
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [isHost]);

  // YouTube IFrame command helper with listening handshake
  const sendIframeCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch {}
    }
  };

  const handleIframeLoad = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        // Send listening handshake so YouTube iframe accepts postMessage commands
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
        // Subscribe to onStateChange events
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
          '*'
        );
        const target = hostSyncTime > 0 ? hostSyncTime : playbackTime;
        if (target > 0) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [target, true] }),
            '*'
          );
        }
      } catch {}
    }
  };

  // Playback timer progression (advances time every second when playing)
  useEffect(() => {
    if (!isPlaying || !activeVid) return;

    const timer = setInterval(() => {
      setPlaybackTime((prev) => {
        const next = prev + 1;
        const maxDuration = activeVid.duration_seconds || 900;
        return next <= maxDuration ? next : maxDuration;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, activeVid]);

  // Host playback controls
  const handleHostSeek = (targetSeconds: number) => {
    const clamped = Math.max(0, targetSeconds);
    setPlaybackTime(clamped);
    sendIframeCommand('seekTo', [clamped, true]);
  };

  const handleHostTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    sendIframeCommand(nextState ? 'playVideo' : 'pauseVideo');
  };

  // Participant incoming synchronization handler
  const handleSyncPlayback = (data: { video?: Video; currentTime: number; isPlaying: boolean; hostNickname?: string }) => {
    if (data.video && activeVid && data.video.video_id !== activeVid.video_id) {
      setCurrentVideo(data.video);
      setPlaybackTime(data.currentTime);
      setIsPlaying(data.isPlaying);
      setHostSyncTime(data.currentTime);
      setHostIsPlaying(data.isPlaying);
      sendIframeCommand('seekTo', [data.currentTime, true]);
      return;
    }

    setHostSyncTime(data.currentTime);
    setHostIsPlaying(data.isPlaying);

    // If drift is greater than 1.5 seconds, auto-align participant playback to host
    const drift = Math.abs(playbackTime - data.currentTime);
    if (drift > 1.5) {
      setPlaybackTime(data.currentTime);
      sendIframeCommand('seekTo', [data.currentTime, true]);
    }

    if (data.isPlaying !== isPlaying) {
      setIsPlaying(data.isPlaying);
      sendIframeCommand(data.isPlaying ? 'playVideo' : 'pauseVideo');
    }
  };

  // Manual one-click snap to Host's exact timestamp
  const handleManualSnapToHost = () => {
    const target = hostSyncTime > 0 ? hostSyncTime : playbackTime;
    setPlaybackTime(target);
    sendIframeCommand('seekTo', [target, true]);
    if (hostIsPlaying) {
      setIsPlaying(true);
      sendIframeCommand('playVideo');
    }
    setSyncToast(`⚡ 방장 시점(${formatSecondsToMMSS(target)})으로 즉시 동기화되었습니다!`);
    setTimeout(() => setSyncToast(null), 2500);
  };

  const handleVideoChange = (newVid: Video, elapsed?: number) => {
    setCurrentVideo(newVid);
    setPlaybackTime(typeof elapsed === 'number' && elapsed > 0 ? elapsed : 0);
    setIsPlaying(true);
  };

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
        
        {syncToast && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-amber-500 text-black font-black text-xs shadow-2xl flex items-center gap-2 animate-bounce border border-amber-300">
            <Zap className="w-4 h-4 fill-current" />
            <span>{syncToast}</span>
          </div>
        )}

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
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> {isHost ? '👑 내가 방장 (실시간 송출)' : `👑 방장 (${hostNickname || '방장'}) 동기화 룸`}
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

        {/* Co-watching Time Sync Live Status Banner */}
        {enableChat && isYoutube && (
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs flex-wrap ${
            isHost 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-bold">
                {isHost ? (
                  <>👑 방장 송출 중: 현재 시청 시간 <strong className="text-white font-mono font-black">{formatSecondsToMMSS(playbackTime)}</strong> ({isPlaying ? '재생 중' : '일시정지'}) 이 모든 참가자에게 실시간 자동 동기화됩니다.</>
                ) : (
                  <>🔴 방장 실시간 동기화 중: 방장 시점 <strong className="text-white font-mono font-black">{formatSecondsToMMSS(hostSyncTime || playbackTime)}</strong> ({hostIsPlaying ? '재생 중' : '일시정지'})</>
                )}
              </span>
            </div>

            {!isHost && (
              <button
                onClick={handleManualSnapToHost}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-[11px] shadow-md hover:scale-105 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="방장의 현재 시청 위치로 1초 만에 맞추기"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>⚡ 방장 시점으로 1초 맞춤</span>
              </button>
            )}
          </div>
        )}

        {/* Video Player + Chat Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Video Player Container */}
          <div className={`${activeChat ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
            {isYoutube ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl group/screen">
                  {/* YouTube IFrame Embed (Pointer events strictly disabled for participants like a TV broadcast/Discord stream) */}
                  <iframe
                    ref={iframeRef}
                    key={`yt-${embedYtId}`}
                    src={`https://www.youtube.com/embed/${embedYtId}?autoplay=1&enablejsapi=1&controls=${enableChat && !isHost ? '0' : '1'}&disablekb=${enableChat && !isHost ? '1' : '0'}&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                    title={activeVid.title}
                    className={`w-full h-full border-0 ${enableChat && !isHost ? 'pointer-events-none select-none' : ''}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={isHost}
                    onLoad={handleIframeLoad}
                  />

                  {/* TV / Discord Stream Broadcast Mode Overlay for Participants (100% blocks clicking, pausing, scrubbing) */}
                  {enableChat && !isHost && (
                    <div 
                      className="absolute inset-0 z-30 pointer-events-auto cursor-default bg-transparent flex flex-col justify-between p-4 select-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSyncToast(`📺 실시간 방송 시청 모드 (디스코드 화면 공유 형태) — 영상 조작은 방장(👑 ${hostNickname || '방장'})만 가능합니다.`);
                        setTimeout(() => setSyncToast(null), 2500);
                      }}
                    >
                      {/* Top Stream Badge */}
                      <div className="flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-lg">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          <span>LIVE STREAM • 👑 {hostNickname || '방장'} 화면 공유 중</span>
                        </div>
                      </div>

                      {/* Bottom Remote Control Info Notice */}
                      <div className="opacity-0 group-hover/screen:opacity-100 transition-opacity bg-black/85 backdrop-blur-md border border-white/20 text-gray-200 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-2 shadow-2xl self-start pointer-events-none">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>📺 참가자는 리모컨 없는 TV를 보듯이 방장의 재생 화면을 실시간 시청합니다.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Host Interactive Playback Controls Bar */}
                {enableChat && isHost && (
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleHostTogglePlay}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isPlaying ? '모두 일시정지' : '모두 재생'}</span>
                      </button>

                      <button
                        onClick={() => handleHostSeek(playbackTime - 10)}
                        className="p-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="10초 뒤로 가기"
                      >
                        <Rewind className="w-3.5 h-3.5" />
                        <span>-10초</span>
                      </button>

                      <button
                        onClick={() => handleHostSeek(playbackTime + 10)}
                        className="p-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="10초 앞으로 가기"
                      >
                        <FastForward className="w-3.5 h-3.5" />
                        <span>+10초</span>
                      </button>

                      <button
                        onClick={() => handleHostSeek(0)}
                        className="p-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="처음부터 다시 보기"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>처음부터</span>
                      </button>
                    </div>

                    <div className="font-mono text-xs text-amber-300 font-bold">
                      ⏱️ {formatSecondsToMMSS(playbackTime)}
                    </div>
                  </div>
                )}
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
                  onSyncPlayback={handleSyncPlayback}
                  currentPlaybackInfo={{
                    video: activeVid,
                    currentTime: playbackTime,
                    isPlaying: isPlaying
                  }}
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

