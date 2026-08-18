'use client';

import React from 'react';
import { ExternalLink, Play, Clock, Sparkles, Trash2 } from 'lucide-react';
import { Video } from '@/types';
import { triggerDeepLink, formatSecondsToMMSS } from '@/lib/deeplink';

interface VideoItemProps {
  video: Video;
  index: number;
  onPlayInApp?: (video: Video) => void;
  onDeleteVideo?: () => void;
}

export const VideoItem: React.FC<VideoItemProps> = ({ video, index, onPlayInApp, onDeleteVideo }) => {
  const handleLaunchApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPlayInApp) {
      onPlayInApp(video);
    } else {
      triggerDeepLink(video.platform, video.video_id, video.title, video.channel_title);
    }
  };

  const handleExternalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerDeepLink(video.platform, video.video_id, video.title, video.channel_title);
  };

  return (
    <div 
      onClick={handleLaunchApp}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/15 transition-all duration-200 border border-white/10 hover:border-orange-500/40 group cursor-pointer active:scale-[0.99]"
    >
      {/* Index Badge */}
      <span className="w-5 text-center text-xs font-bold text-gray-500 group-hover:text-orange-400">
        {index + 1}
      </span>

      {/* Thumbnail */}
      <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 shadow-md">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-orange-600/40 transition-colors">
          <Play className="w-5 h-5 text-white fill-white group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Video Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-gray-200 truncate group-hover:text-orange-300 transition-colors">
          {video.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
          <span className="capitalize px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-bold border border-white/10">
            {video.platform}
          </span>
          <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
            <Clock className="w-3 h-3" />
            {formatSecondsToMMSS(video.duration_seconds)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleLaunchApp}
          title="웹 앱 내부에서 즉시 시청"
          className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1 transition-all duration-200 shadow-md shadow-orange-600/30"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>재생</span>
        </button>

        <button
          onClick={handleExternalClick}
          title="원본 앱에서 열기"
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {onDeleteVideo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDeleteVideo();
            }}
            title="컨텐츠 삭제"
            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
