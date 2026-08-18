'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Users } from 'lucide-react';

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
  const baseCount = initialWatchers;
  const [watchers, setWatchers] = useState<number>(isJoined ? baseCount + 1 : baseCount);
  const [connected, setConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isJoined || connected) {
      setWatchers(baseCount + 1);
    } else {
      setWatchers(baseCount);
    }
  }, [isJoined, connected, baseCount]);

  useEffect(() => {
    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1';
    const wsUrl = `${wsBaseUrl}/presence/ws/${playlistId}`;
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
          setWatchers(baseCount + 1);
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
              const liveOffset = Math.max(1, data.active_watchers);
              setWatchers(baseCount + liveOffset);
            }
          } catch (e) {
            // ignore non-json messages
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setConnected(false);
          setWatchers(isJoined ? baseCount + 1 : baseCount);
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
  }, [playlistId, baseCount, isJoined]);

  const displayCount = isJoined || connected ? Math.max(watchers, baseCount + 1) : watchers;

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
      <span>{displayCount}명 함께 합석 중</span>
    </div>
  );
};
