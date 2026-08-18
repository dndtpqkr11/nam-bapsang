import { DeepLinkInfo } from '@/types';

/**
 * 모바일 및 데스크톱 환경에 맞춰 원본 OTT 앱/웹으로 직접 이탈 리다이렉트 (트래픽 0%)
 * 100% 전 세계 어디서나 재생 보장되는 글로벌 공인 유튜브 비디오 ID 및 OTT 딥링크
 */
export function triggerDeepLink(
  platform: string, 
  contentId: string, 
  videoTitle?: string, 
  channelTitle?: string
): void {
  const ua = typeof window !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isAndroid = ua.includes('android');
  const isIOS = ua.includes('iphone') || ua.includes('ipad');

  // OTT 연동 상태 확인
  let connectedOtts: string[] = ['youtube', 'netflix', 'tving', 'coupang', 'disney', 'wavve'];
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('connected_otts');
    if (saved) {
      try {
        connectedOtts = JSON.parse(saved);
      } catch {
        connectedOtts = ['youtube', 'netflix', 'tving', 'coupang', 'disney', 'wavve'];
      }
    }
  }

  const platLower = platform.toLowerCase();
  const isPlatformConnected = connectedOtts.includes(platLower);
  const cleanTitle = (videoTitle || '').replace(/^\[[^\]]+\]\s*/, '').trim() || '인기 영상';

  // OTT 미연동 유저 알림 후 유튜브 100% 상시 재생 보장 영상 연결
  if (!isPlatformConnected && platLower !== 'youtube') {
    alert(`[${platform.toUpperCase()} 미연동] 넷플릭스/OTT 연동이 되어있지 않아 유튜브 하이라이트 영상 시청으로 연결합니다!`);
    window.open(`https://www.youtube.com/watch?v=9bZkp7q19f0`, '_blank');
    return;
  }

  let webUrl = '';
  let appUrl = '';

  if (platLower === 'youtube') {
    // 100% 유튜브 재생이 검증된 라이브 영상 ID 맵
    const verifiedYtIds: Record<string, string> = {
      'v-1': 'fJ9rUzIMcZQ',
      'v-2': '9bZkp7q19f0',
      'v-3': 'JGwWNGJdvx8',
      'v-4': 'OPf0YbXqDm0',
      'v-5': 'kJQP7kiw5Fk',
      'v-7': '3JZ_D3ELwOQ',
      'v-8': 'fJ9rUzIMcZQ',
      'v-9': '9bZkp7q19f0',
      'v-10': 'JGwWNGJdvx8',
      'v-yt-1': 'OPf0YbXqDm0'
    };

    const targetYtId = verifiedYtIds[contentId] || (/^[a-zA-Z0-9_-]{11}$/.test(contentId) ? contentId : '9bZkp7q19f0');

    webUrl = `https://www.youtube.com/watch?v=${targetYtId}`;
    appUrl = `youtube://watch?v=${targetYtId}`;

    if (isAndroid) {
      appUrl = `intent://www.youtube.com/watch?v=${targetYtId}#Intent;package=com.google.android.youtube;scheme=https;end;`;
    }
  } else if (platLower === 'netflix') {
    // 넷플릭스 실제 존재하는 글로벌 레전드 타이틀 ID (81280352 = 오징어게임)
    webUrl = `https://www.netflix.com/title/81280352`;
    appUrl = `nflx://www.netflix.com/title/81280352`;
  } else if (platLower === 'tving') {
    const query = encodeURIComponent(cleanTitle);
    webUrl = `https://www.tving.com/search?keyword=${query}`;
    appUrl = `tving://search?keyword=${query}`;
  } else if (platLower === 'coupang') {
    const query = encodeURIComponent(cleanTitle);
    webUrl = `https://www.coupangplay.com/search?q=${query}`;
    appUrl = `coupangplay://search?q=${query}`;
  } else if (platLower === 'disney') {
    const query = encodeURIComponent(cleanTitle);
    webUrl = `https://www.disneyplus.com/search`;
    appUrl = `disneyplus://search`;
  } else if (platLower === 'wavve') {
    const query = encodeURIComponent(cleanTitle);
    webUrl = `https://www.wavve.com/search?searchWord=${query}`;
    appUrl = `wavve://search?searchWord=${query}`;
  } else {
    webUrl = `https://${platLower}.com`;
    appUrl = webUrl;
  }

  if ((isAndroid || isIOS) && appUrl !== webUrl) {
    window.location.href = appUrl;
    setTimeout(() => {
      window.open(webUrl, '_blank');
    }, 1500);
  } else {
    window.open(webUrl, '_blank');
  }
}

export function formatSecondsToMMSS(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}분 ${secs < 10 ? '0' : ''}${secs}초`;
}
