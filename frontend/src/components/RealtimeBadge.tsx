'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Users } from 'lucide-react';
import { getClientSessionId } from '@/lib/api';

interface RealtimeBadgeProps {
  playlistId: string;
  initialWatchers?: number;
  isJoined?: boolean;
}

export const RealtimeBadge: React.FC<RealtimeBadgeProps> = ({ 
  playlistId, 
  initialWatchers = 1,
  isJoined = false
}) => {
  const [watchers, setWatchers] = useState<number>(initialWatchers || 1);
  const [connected, setConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setWatchers(initialWatchers || 1);
    if (isJoined) {
      setConnected(true);
      return;
    }

    const getWebSocketUrl = (roomId: string): string => {
      let base = '';
      if (process.env.NEXT_PUBLIC_WS_URL) {
        base = `${process.env.NEXT_PUBLIC_WS_URL}/ws/${roomId}`;
      } else if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const port = window.location.port;
        if (host === 'localhost' || host === '127.0.0.1' || port === '3000' || port === '3001') {
          base = `ws://${host}:8000/ws/${roomId}`;
        } else {
          base = `wss://nam-bapsang-backend.onrender.com/ws/${roomId}`;
        }
      } else {
        base = `wss://nam-bapsang-backend.onrender.com/ws/${roomId}`;
      }
      return `${base}?client_id=${encodeURIComponent(getClientSessionId())}`;
    };

    const wsUrl = getWebSocketUrl(playlistId);
    let timer: NodeJS.Timeout | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isMounted = true;

    function connectWebSocket() {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setConnected(true);
          timer = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PRESENCE_UPDATE' && typeof data.active_watchers === 'number') {
              // 실제 동시 접속자 수 100% 실시간 표기
              setWatchers(data.active_watchers);
            }
          } catch (e) {
            // ignore non-json messages
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setConnected(false);
          if (timer) clearInterval(timer);
          reconnectTimer = setTimeout(() => {
            if (isMounted) connectWebSocket();
          }, 3000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setConnected(false);
          ws.close();
        };
      } catch (e) {
        if (!isMounted) return;
        setConnected(false);
      }
    }

    connectWebSocket();

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [playlistId]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
        connected || isJoined
          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
          : 'bg-gray-500/10 border border-gray-500/20 text-gray-400'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          connected || isJoined ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#22C55E]' : 'bg-gray-500'
        }`}
      />
      <Users className="w-3.5 h-3.5" />
      <span>{watchers}명 함께 합석 중</span>
    </div>
  );
};
