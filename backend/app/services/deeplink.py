from typing import Dict, Any

class DeepLinkRouter:
    """
    플랫폼별 App Intent / Universal Link 및 Web Fallback 라우터
    서버 트래픽 제로화를 위한 원본 앱 직접 이탈 URL 생성기
    """
    @staticmethod
    def generate_routing_info(platform: str, content_id: str, user_agent: str = "") -> Dict[str, str]:
        platform = platform.lower()
        is_mobile = any(mobile in user_agent.lower() for mobile in ["iphone", "ipad", "android"])

        if platform == "youtube":
            app_url = f"youtube://watch?v={content_id}"
            web_url = f"https://www.youtube.com/watch?v={content_id}"
            intent_url = f"intent://www.youtube.com/watch?v={content_id}#Intent;package=com.google.android.youtube;scheme=https;end;"
        elif platform == "netflix":
            app_url = f"nflx://www.netflix.com/title/{content_id}"
            web_url = f"https://www.netflix.com/title/{content_id}"
            intent_url = f"intent://www.netflix.com/title/{content_id}#Intent;package=com.netflix.mediaclient;scheme=https;end;"
        elif platform == "tving":
            app_url = f"tving://vod/detail/{content_id}"
            web_url = f"https://www.tving.com/contents/{content_id}"
            intent_url = f"intent://www.tving.com/contents/{content_id}#Intent;package=net.cj.cjmall.tving;scheme=https;end;"
        else:
            app_url = f"https://{platform}.com/{content_id}"
            web_url = app_url
            intent_url = app_url

        return {
            "platform": platform,
            "content_id": content_id,
            "target_url": intent_url if ("android" in user_agent.lower()) else (app_url if is_mobile else web_url),
            "web_fallback": web_url,
            "is_mobile": is_mobile
        }
