import { Playlist, Video } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nam-bapsang-backend.onrender.com/api/v1';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function loginUser(email: string, password: string): Promise<{ access_token: string; user: any }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || '로그인 실패');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') throw err;
    return {
      access_token: 'demo-jwt-token',
      user: { id: 'u-1', nickname: '혼밥마스터', email }
    };
  }
}

export async function signupUser(email: string, password: string, nickname: string, masterKey?: string): Promise<{ access_token: string; user: any }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password, nickname, master_key: masterKey })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || '회원가입 실패');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') throw err;
    return {
      access_token: 'demo-jwt-token',
      user: { id: 'u-new', nickname, email, role: masterKey === 'MASTER2026' ? 'master' : 'user' }
    };
  }
}

export async function fetchPlaylists(targetRuntimeSec: number = 900): Promise<Playlist[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${API_BASE_URL}/playlists?target_runtime=${targetRuntimeSec}`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('API response failed');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Backend fetch fallback triggered:', err);
    return [];
  }
}

export async function createPlaylist(payload: {
  title: string;
  category: string;
  videos: Video[];
  author_name?: string;
  is_live?: boolean;
}): Promise<Playlist> {
  const res = await fetch(`${API_BASE_URL}/playlists`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title: payload.title,
      category: payload.category,
      author_name: payload.author_name || '독고다이',
      is_live: payload.is_live || false,
      videos: payload.videos.map((v) => ({
        title: v.title,
        platform: v.platform,
        video_id: v.video_id,
        duration_seconds: v.duration_seconds,
        thumbnail_url: v.thumbnail_url,
        channel_title: v.channel_title || '추천 채널'
      }))
    })
  });

  if (!res.ok) {
    const errJson = await res.json();
    throw new Error(errJson.detail || '밥상 차리기에 실패했습니다.');
  }

  const json = await res.json();
  return json.data;
}

export async function deletePlaylist(playlistId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      if (errJson.detail) {
        alert(errJson.detail);
      }
      return false;
    }
    return res.ok;
  } catch (err) {
    console.warn('Delete playlist API failed:', err);
    return false;
  }
}

export async function fetchOttRecommendations(
  platforms: string[] = ['youtube', 'netflix'],
  targetRuntimeSec: number = 900
): Promise<Playlist[]> {
  try {
    const platformQuery = platforms.join(',');
    const res = await fetch(`${API_BASE_URL}/ott/recommendations?platforms=${platformQuery}&target_runtime=${targetRuntimeSec}`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Fetch OTT recommendations failed:', err);
    return [];
  }
}

export async function fetchPlaylistDetail(playlistId: string): Promise<Playlist | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('Fetch playlist detail failed:', err);
    return null;
  }
}

export async function parseVideoUrl(url: string): Promise<Video> {
  const res = await fetch(`${API_BASE_URL}/videos/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!res.ok) {
    const errorJson = await res.json();
    throw new Error(errorJson.detail || '메타데이터 수집 실패');
  }
  const json = await res.json();
  return json.data;
}

export async function forkPlaylist(playlistId: string): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/playlists/${playlistId}/fork`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('포크 요청 실패');
  const json = await res.json();
  return json.original_fork_count;
}

export async function fetchYouTubeTrendingVideos(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/videos/trending`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Fetch YouTube trending failed:', err);
    return [];
  }
}

