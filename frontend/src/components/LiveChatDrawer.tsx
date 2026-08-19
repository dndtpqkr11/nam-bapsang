'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Users, Sparkles, Flame, Smile, Radio, Crown, Tv, RefreshCw, Trash2, Search, Clock } from 'lucide-react';
import { Video } from '@/types';
import { searchYouTubeVideos } from '@/lib/api';
import { formatSecondsToMMSS } from '@/lib/deeplink';

interface ChatMessage {
  id: string;
  nickname: string;
  text: string;
  timestamp: string;
  isMe?: boolean;
  isSystem?: boolean;
  isHostMsg?: boolean;
}

interface LiveChatDrawerProps {
  playlistId: string;
  playlistTitle?: string;
  initialWatchers?: number;
  onHostVideoChange?: (video: Video, elapsedSeconds?: number) => void;
  onDeleteLiveRoom?: (playlistId: string) => void;
  onRoomDeleted?: () => void;
  isHost?: boolean;
  hostNickname?: string;
}

const PRESET_MESSAGES = [
  '🍚 잘 먹겠습니다!',
  '🍜 와 맛있겠다 ㅋㅋㅋ',
  '🍺 맛점/맛저 짠~',
  '👏 이번 비디오 대박!',
  '🔥 같이 보니까 꿀잼!'
];

const HOST_VIDEO_PRESETS: { title: string; video_id: string; channel_title: string }[] = [
  { title: '🍱 [슈카월드] 전설의 주총꾼썰', video_id: 'JdRcM4fLwgE', channel_title: '슈카월드' },
  { title: '🍱 [침착맨] 시청자 밥상머리 훈수하기', video_id: 'ZHaOU6E4pWU', channel_title: '침착맨' },
  { title: '🔥 [안녕하세요원이입니다잘부탁드립니다] 경주 아이돌', video_id: '4m9eLr-NofA', channel_title: '안녕하세요원이입니다잘부탁드립니다' },
  { title: '💪 [불지옥 피트니스] 보디빌더 김강민 오픈', video_id: 'i793jZWW0Sw', channel_title: '불지옥 피트니스' },
  { title: '📱 [ITSub잇섭] 갤럭시 S26 이슈 솔직 리뷰', video_id: 'TigCEb283aU', channel_title: 'ITSub잇섭' }
];

export const LiveChatDrawer: React.FC<LiveChatDrawerProps> = ({ 
  playlistId, 
  playlistTitle,
  initialWatchers = 38,
  onHostVideoChange,
  onDeleteLiveRoom,
  onRoomDeleted,
  isHost = false,
  hostNickname = '독고다이'
}) => {
  const baseWatchers = initialWatchers;
  const displayHostName = hostNickname || '혼밥방장';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-sys-1',
      nickname: '시스템',
      text: isHost 
        ? '👑 내가 이 밥상방의 방장입니다! 아래 [영상 틀기] 버튼으로 원하는 영상을 함께 시청해보세요.'
        : `👑 [${displayHostName}] 방장 님의 실시간 합석 라이브 방에 입장하셨습니다!`,
      timestamp: '방 안내',
      isSystem: true
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [nickname, setNickname] = useState<string>(isHost ? '나(방장)' : '나(식사중)');
  const [activeWatchers, setActiveWatchers] = useState<number>(baseWatchers + 1);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showHostControlPanel, setShowHostControlPanel] = useState<boolean>(false);
  const [customVideoUrlInput, setCustomVideoUrlInput] = useState<string>('');
  const [hostSearchQuery, setHostSearchQuery] = useState<string>('');
  const [hostSearchResults, setHostSearchResults] = useState<Video[]>([]);
  const [hostSearchLoading, setHostSearchLoading] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Persistent Client Session ID (to avoid deduplicating by nickname)
  const clientSessionIdRef = useRef<string>(
    typeof window !== 'undefined'
      ? `client-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`
      : 'client-anon'
  );

  // Track latest props & state in refs to prevent WebSocket reconnection on prop/state changes
  const nicknameRef = useRef(nickname);
  const isHostRef = useRef(isHost);
  const onHostVideoChangeRef = useRef(onHostVideoChange);
  const baseWatchersRef = useRef(baseWatchers);
  const onRoomDeletedRef = useRef(onRoomDeleted);

  useEffect(() => { nicknameRef.current = nickname; }, [nickname]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { onHostVideoChangeRef.current = onHostVideoChange; }, [onHostVideoChange]);
  useEffect(() => { baseWatchersRef.current = baseWatchers; }, [baseWatchers]);
  useEffect(() => { onRoomDeletedRef.current = onRoomDeleted; }, [onRoomDeleted]);

  useEffect(() => {
    if (chatScrollRef.current) {
      const el = chatScrollRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (isNearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    setActiveWatchers(baseWatchers + 1);
  }, [baseWatchers]);

  useEffect(() => {
    // 1. Initialize nickname from localStorage once on mount
    let myName = '독고다이';
    if (typeof window !== 'undefined') {
      let myNick = localStorage.getItem('user_nickname');
      if (!myNick) {
        const savedUserStr = localStorage.getItem('user');
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            if (parsed.nickname) myNick = parsed.nickname;
          } catch {}
        }
      }
      if (myNick) myName = myNick;
    }
    const initNick = isHost ? `${myName} (방장)` : myName;
    setNickname(initNick);
    nicknameRef.current = initNick;
  }, [isHost]);

  // Load saved local chat history on room entry
  useEffect(() => {
    if (typeof window !== 'undefined' && playlistId) {
      try {
        const savedHist = localStorage.getItem(`live_chat_history_${playlistId}`);
        if (savedHist) {
          const parsed: ChatMessage[] = JSON.parse(savedHist);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages((prev) => {
              const sysMsg = prev.find((m) => m.isSystem);
              const nonSysMsgs = parsed.filter((m) => !m.isSystem);
              const existingIds = new Set(prev.map((m) => m.id));
              const newOnly = nonSysMsgs.filter((m) => !existingIds.has(m.id));
              return sysMsg ? [sysMsg, ...newOnly] : newOnly;
            });
          }
        }
      } catch {}
    }
  }, [playlistId]);

  // Auto-save recent chat messages to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && playlistId && messages.length > 1) {
      try {
        const toSave = messages.filter((m) => !m.isSystem).slice(-50);
        if (toSave.length > 0) {
          localStorage.setItem(`live_chat_history_${playlistId}`, JSON.stringify(toSave));
        }
      } catch {}
    }
  }, [messages, playlistId]);

  useEffect(() => {
    const getWebSocketUrl = (roomId: string): string => {
      if (process.env.NEXT_PUBLIC_WS_URL) {
        return `${process.env.NEXT_PUBLIC_WS_URL}/ws/${roomId}`;
      }
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const port = window.location.port;
        if (host === 'localhost' || host === '127.0.0.1' || port === '3000' || port === '3001') {
          return `ws://${host}:8000/ws/${roomId}`;
        }
      }
      return `wss://nam-bapsang-backend.onrender.com/ws/${roomId}`;
    };

    const wsUrl = getWebSocketUrl(playlistId);
    let ws: WebSocket;
    let pingInterval: NodeJS.Timeout;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);

        // Keep-Alive Ping every 15s
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PRESENCE_UPDATE' && typeof data.active_watchers === 'number') {
            setActiveWatchers(data.active_watchers);
          } else if (data.type === 'ROOM_DELETED') {
            if (onRoomDeletedRef.current) {
              onRoomDeletedRef.current();
            }
            alert(data.message || '👑 방장에 의해 라이브 밥상방이 삭제되었습니다.');
          } else if (data.type === 'CHAT_HISTORY' && Array.isArray(data.history)) {
            const serverMsgs: ChatMessage[] = data.history.map((item: any) => ({
              id: item.msg_id || `m-server-${Math.random()}`,
              nickname: item.nickname || '익명의 밥상러',
              text: item.text,
              timestamp: item.timestamp || '이전 대화',
              isMe: item.sender_id === clientSessionIdRef.current || item.nickname === nicknameRef.current,
              isHostMsg: item.is_host
            }));
            if (serverMsgs.length > 0) {
              setMessages((prev) => {
                const sysMsg = prev.find((m) => m.isSystem);
                const existingIds = new Set(prev.map((m) => m.id));
                const newOnly = serverMsgs.filter((m) => !existingIds.has(m.id));
                const combined = sysMsg ? [sysMsg, ...prev.filter(m => !m.isSystem), ...newOnly] : [...prev, ...newOnly];
                return combined.slice(-50);
              });
            }
          } else if (data.type === 'CHAT_MESSAGE') {
            // Deduplicate using sender_id (ignore broadcast of own messages)
            const isFromOtherSender = data.sender_id ? (data.sender_id !== clientSessionIdRef.current) : (data.nickname !== nicknameRef.current);
            if (isFromOtherSender) {
              const newMsg: ChatMessage = {
                id: data.msg_id || `m-${Date.now()}-${Math.random()}`,
                nickname: data.nickname || '익명의 밥상러',
                text: data.text,
                timestamp: data.timestamp || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                isMe: false,
                isHostMsg: data.is_host
              };
              setMessages((prev) => [...prev, newMsg]);
            }
          } else if (data.type === 'SYNC_VIDEO_STATE') {
            if (data.video && onHostVideoChangeRef.current) {
              onHostVideoChangeRef.current(data.video, data.elapsed_seconds || 0);
            }
          } else if (data.type === 'HOST_CHANGE_VIDEO') {
            if (data.video && onHostVideoChangeRef.current) {
              onHostVideoChangeRef.current(data.video, data.elapsed_seconds || 0);
            }
            if (data.system_message) {
              const sysMsg: ChatMessage = {
                id: `sys-${Date.now()}`,
                nickname: '시스템',
                text: data.system_message,
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                isSystem: true
              };
              setMessages((prev) => [...prev, sysMsg]);
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingInterval) clearInterval(pingInterval);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [playlistId]);

  const handleSendMessage = (textToSend?: string) => {
    const msgText = (textToSend || inputText).trim();
    if (!msgText) return;

    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const msgId = `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newMsg: ChatMessage = {
      id: msgId,
      nickname: nickname,
      text: msgText,
      timestamp: timeStr,
      isMe: true,
      isHostMsg: isHost
    };

    setMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'CHAT_MESSAGE',
          nickname: nickname,
          text: msgText,
          timestamp: timeStr,
          is_host: isHost,
          sender_id: clientSessionIdRef.current,
          msg_id: msgId
        }));
      } catch {}
    }

    if (!textToSend) setInputText('');
  };

  const handleHostChangeVideo = (newVideo: Video) => {
    if (!isHost) return;

    if (onHostVideoChange) {
      onHostVideoChange(newVideo);
    }

    const sysMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      nickname: '시스템',
      text: `👑 방장이 반찬 영상 [${newVideo.title}] (으)로 교체했습니다!`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    };
    setMessages((prev) => [...prev, sysMsg]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'HOST_CHANGE_VIDEO',
          playlist_id: playlistId,
          video: newVideo,
          host_nickname: nickname
        }));
      } catch {}
    }

    setShowHostControlPanel(false);
    setCustomVideoUrlInput('');
  };

  const handleHostSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = (hostSearchQuery || customVideoUrlInput).trim();
    if (!cleanQuery || !isHost) return;

    setHostSearchLoading(true);

    // Direct YouTube URL parsing
    const match = cleanQuery.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      const vidId = match[1];
      const customVideo: Video = {
        id: `v-host-${Date.now()}`,
        title: `📺 [방장 지정 영상] 유튜브 영상`,
        platform: 'youtube',
        video_id: vidId,
        duration_seconds: 600,
        thumbnail_url: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
        channel_title: `${displayHostName} 라이브`
      };
      handleHostChangeVideo(customVideo);
      setHostSearchLoading(false);
      setHostSearchQuery('');
      setHostSearchResults([]);
      return;
    }

    // Keyword Search via YouTube API
    try {
      const results = await searchYouTubeVideos(cleanQuery);
      if (results && results.length > 0) {
        setHostSearchResults(results.map((item: any) => ({
          id: item.id || `v-${item.video_id}`,
          title: item.title,
          platform: 'youtube',
          video_id: item.video_id,
          duration_seconds: item.duration_seconds || 300,
          thumbnail_url: item.thumbnail_url || `https://img.youtube.com/vi/${item.video_id}/hqdefault.jpg`,
          channel_title: item.channel_title || 'YouTube'
        })));
      } else {
        setHostSearchResults([]);
      }
    } catch {
      setHostSearchResults([]);
    } finally {
      setHostSearchLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full rounded-2xl bg-[#0f1420]/90 border border-white/15 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-3.5 bg-gradient-to-r from-rose-950/70 via-purple-950/60 to-rose-950/70 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h4 className="font-black text-white text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
              isHost 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              {isHost ? '👑 내가 방장' : `👑 방장: ${displayHostName}`}
            </span>
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <>
              <button
                onClick={() => setShowHostControlPanel(!showHostControlPanel)}
                className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-xs font-black border border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer"
                title="방장 전용: 모두의 시청 영상 교체"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>{showHostControlPanel ? '닫기' : '👑 영상 틀기'}</span>
              </button>

              {onDeleteLiveRoom && (
                <button
                  onClick={() => {
                    if (window.confirm('정말 이 라이브 밥상방을 삭제하시겠습니까?')) {
                      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        try {
                          wsRef.current.send(JSON.stringify({
                            type: 'DELETE_ROOM',
                            playlist_id: playlistId
                          }));
                        } catch {}
                      }
                      onDeleteLiveRoom(playlistId);
                    }
                  }}
                  className="px-2.5 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-xs font-bold border border-rose-500/40 transition-all flex items-center gap-1 cursor-pointer"
                  title="내가 개설한 라이브 방 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>방 삭제</span>
                </button>
              )}
            </>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <span className="pulsing-dot" />
            <span>🟢 {activeWatchers}명 함께 합석 중</span>
          </div>
        </div>
      </div>

      {/* Host Control Panel Drawer (Collapsible for Host only) */}
      {isHost && showHostControlPanel && (
        <div className="p-3 bg-gradient-to-r from-amber-950/90 via-orange-950/80 to-amber-950/90 border-b border-amber-500/30 space-y-2.5 shrink-0 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-black text-amber-300">
            <span className="flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>👑 방장 전용: 유튜브 라이브 키워드 검색 & 영상 교체</span>
            </span>
          </div>

          {/* YouTube Search Input Form for Host */}
          <form onSubmit={handleHostSearchSubmit} className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hostSearchQuery}
                onChange={(e) => setHostSearchQuery(e.target.value)}
                placeholder="유튜브 검색어 (성시경, 백종원, 침착맨 등) 또는 URL..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/60 text-xs text-white placeholder-gray-400 border border-amber-500/40 focus:outline-none focus:border-amber-300 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={hostSearchLoading || !hostSearchQuery.trim()}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-xs shrink-0 cursor-pointer shadow-md flex items-center gap-1"
            >
              <span>{hostSearchLoading ? '검색 중...' : '유튜브 검색'}</span>
            </button>
          </form>

          {/* Live YouTube Search Results inside Host Control Panel */}
          {hostSearchResults.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-amber-300 font-bold flex items-center justify-between px-1">
                <span>📺 검색 결과 ({hostSearchResults.length}건) - 클릭 시 방 전체 영상 즉시 변경</span>
                <button
                  type="button"
                  onClick={() => setHostSearchResults([])}
                  className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
                >
                  닫기
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {hostSearchResults.map((vid) => (
                  <div
                    key={vid.video_id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-black/50 border border-amber-500/30 hover:border-amber-400 transition-all group"
                  >
                    <img
                      src={vid.thumbnail_url}
                      alt={vid.title}
                      className="w-14 h-10 object-cover rounded-lg shrink-0 border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <h6 className="text-[11px] font-bold text-white truncate leading-tight" title={vid.title}>
                        {vid.title}
                      </h6>
                      <p className="text-[10px] text-amber-300/80 truncate">
                        ⏱️ {formatSecondsToMMSS(vid.duration_seconds)} | {vid.channel_title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleHostChangeVideo(vid)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black shrink-0 shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span>▶️ 재생</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {HOST_VIDEO_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleHostChangeVideo({
                  id: `v-preset-${Date.now()}-${idx}`,
                  title: preset.title,
                  platform: 'youtube',
                  video_id: preset.video_id,
                  duration_seconds: 600,
                  thumbnail_url: `https://i.ytimg.com/vi/${preset.video_id}/hqdefault.jpg`,
                  channel_title: preset.channel_title
                })}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-amber-500/30 text-[11px] font-bold text-white whitespace-nowrap border border-white/15 transition-all cursor-pointer shrink-0"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Internal Scroll View */}
      <div 
        ref={chatScrollRef}
        className="flex-1 min-h-0 h-0 p-3 space-y-3 overflow-y-auto custom-scrollbar bg-black/30 select-text"
      >
        <div className="text-center py-1.5 px-2 text-[11px] text-amber-300 bg-amber-500/10 rounded-xl border border-amber-500/20 font-semibold">
          {isHost 
            ? '👑 방장 모드: 영상을 바꾸면 합석 중인 참여자들의 화면이 실시간 동기화됩니다!' 
            : `👑 [${displayHostName}] 님이 리드하는 라이브 밥상방입니다. 방장이 영상 변경 시 함께 시청합니다.`}
        </div>

        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex flex-col ${m.isSystem ? 'items-center' : m.isMe ? 'items-end' : 'items-start'} space-y-1`}
          >
            {m.isSystem ? (
              <div className="py-1 px-3 rounded-full bg-orange-500/20 border border-orange-500/30 text-[11px] font-bold text-orange-300 text-center max-w-[90%] shadow-sm">
                {m.text}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold px-1">
                  {m.isHostMsg && <Crown className="w-3 h-3 text-amber-400" />}
                  <span className={m.isHostMsg ? 'text-amber-300 font-bold' : ''}>{m.nickname}</span>
                  <span className="text-[10px] text-gray-500">{m.timestamp}</span>
                </div>

                <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] leading-relaxed break-words ${
                  m.isMe
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium rounded-br-none shadow-md'
                    : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/10'
                }`}>
                  {m.text}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Preset Quick Chips */}
      <div className="px-3 py-2 bg-black/50 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
        {PRESET_MESSAGES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(preset)}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-orange-500/30 hover:text-orange-300 text-[11px] text-gray-300 font-semibold whitespace-nowrap transition-all border border-white/10 cursor-pointer shrink-0"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }} 
        className="p-3 bg-black/60 border-t border-white/10 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
