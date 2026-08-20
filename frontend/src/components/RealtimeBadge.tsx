'use client';

import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface RealtimeBadgeProps {
  playlistId: string;
  initialWatchers?: number;
  isJoined?: boolean;
}

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const port = window.location.port;
    if (host === 'localhost' || host === '127.0.0.1' || port === '3000' || port === '3001') {
      return `http://${host}:8000/api/v1`;
    }
  }
  return 'https://nam-bapsang-backend.onrender.com/api/v1';
}

export const RealtimeBadge: React.FC<RealtimeBadgeProps> = ({ 
  playlistId, 
  initialWatchers = 0,
  isJoined = false
}) => {
  const [watchers, setWatchers] = useState<number>(initialWatchers ?? 0);

  useEffect(() => {
    setWatchers(initialWatchers ?? 0);

    let isMounted = true;
    const fetchWatcherCount = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/presence/${playlistId}/count`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && typeof json.active_watchers === 'number') {
            setWatchers(json.active_watchers);
          }
        }
      } catch (e) {
        // ignore fetch failure
      }
    };

    fetchWatcherCount();
    const interval = setInterval(fetchWatcherCount, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [playlistId, initialWatchers]);

  const isActive = watchers > 0 || isJoined;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
        isActive
          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
          : 'bg-gray-500/10 border border-gray-500/20 text-gray-400'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isActive ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#22C55E]' : 'bg-gray-500'
        }`}
      />
      <Users className="w-3.5 h-3.5" />
      <span>{watchers}명 함께 합석 중</span>
    </div>
  );
};
