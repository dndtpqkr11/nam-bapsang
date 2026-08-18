export interface Video {
  id: string;
  title: string;
  platform: string;
  video_id: string;
  duration_seconds: number;
  thumbnail_url: string;
  channel_title?: string;
}

export interface Playlist {
  id: string;
  title: string;
  author: string;
  author_id: string;
  category: string;
  total_duration_sec: number;
  fork_count: number;
  videos: Video[];
  active_watchers?: number;
  forked_from?: string;
  is_ott_scraped?: boolean;
  platform?: string;
}

export interface DeepLinkInfo {
  platform: string;
  content_id: string;
  target_url: string;
  web_fallback: string;
  is_mobile: boolean;
}
