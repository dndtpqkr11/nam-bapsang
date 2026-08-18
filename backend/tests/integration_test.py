import asyncio
import httpx
import websockets
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
WS_URL = "ws://localhost:8000/api/v1"

async def run_full_integration_test():
    print("==================================================")
    print("🍱 [남의 밥상] E2E 통합 서비스 시나리오 검증 시작")
    print("==================================================")

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. 회원가입 시나리오
        timestamp = int(time.time())
        email = f"e2e_user_{timestamp}@bapsang.com"
        signup_res = await client.post(f"{BASE_URL}/auth/signup", json={
            "email": email,
            "password": "securepassword123",
            "nickname": f"E2E테스터_{timestamp}"
        })
        assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"
        token = signup_res.json().get("access_token")
        print(f"✅ [1/8] 회원가입 성공! (이메일: {email}, JWT Token 획득)")

        # 2. 로그인 시나리오
        login_res = await client.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": "securepassword123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        print(f"✅ [2/8] JWT 인증 로그인 성공!")

        # 3. 유튜브 URL 온디맨드 메타데이터 수집
        video_parse_res = await client.post(f"{BASE_URL}/videos/parse", json={
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        })
        assert video_parse_res.status_code == 200, f"Video parse failed: {video_parse_res.text}"
        parsed_video = video_parse_res.json().get("data")
        print(f"✅ [3/8] 유튜브 URL 메타데이터 파싱 성공! (제목: '{parsed_video['title']}', 러닝타임: {parsed_video['duration_seconds']}초)")

        # 4. 플레이리스트 목록 조회
        playlists_res = await client.get(f"{BASE_URL}/playlists?target_runtime=900")
        assert playlists_res.status_code == 200, f"Playlists fetch failed: {playlists_res.text}"
        playlists = playlists_res.json().get("data", [])
        assert len(playlists) > 0, "No playlists returned from DB"
        first_playlist = playlists[0]
        print(f"✅ [4/8] 15분 맞춤 플레이리스트 목록 {len(playlists)}개 DB 로딩 성공!")

        # 5. 원터치 포크(Fork) 시나리오
        target_id = first_playlist["id"]
        fork_res = await client.post(f"{BASE_URL}/playlists/{target_id}/fork")
        assert fork_res.status_code == 200, f"Fork failed: {fork_res.text}"
        original_forks = fork_res.json().get("original_fork_count")
        print(f"✅ [5/8] 원터치 포크 성공! (원작자 포크 수: {original_forks})")

        # 6. ML Pandas 15분 식사시간 큐레이션 검증
        ml_mealtime_res = await client.get(f"{BASE_URL}/recommendations/mealtime?target_sec=900")
        assert ml_mealtime_res.status_code == 200, f"ML Curation failed: {ml_mealtime_res.text}"
        recommended_list = ml_mealtime_res.json().get("recommended", [])
        print(f"✅ [6/8] Pandas ML 15분 컷 큐레이션 정렬 완료 ({len(recommended_list)}개 항목)")

        # 7. ML TensorFlow 유저 임베딩 군집화 예측
        ml_cluster_res = await client.get(f"{BASE_URL}/recommendations/cluster?user_id=1")
        assert ml_cluster_res.status_code == 200, f"ML Cluster failed: {ml_cluster_res.text}"
        cluster_info = ml_cluster_res.json()
        print(f"✅ [7/8] TensorFlow 유저 군집화 성공! ({cluster_info['assigned_cluster']})")

        # 8. 트래픽 제로 딥링크 라우팅 & 실시간 합석 웹소켓 연결
        deeplink_res = await client.get(f"{BASE_URL}/videos/youtube/dQw4w9WgXcQ/redirect", headers={"User-Agent": "iPhone"})
        assert deeplink_res.status_code == 200, f"Deeplink failed: {deeplink_res.text}"
        routing = deeplink_res.json().get("routing")
        assert routing["target_url"] == "youtube://watch?v=dQw4w9WgXcQ"

        # WebSocket Connection Test
        async with websockets.connect(f"{WS_URL}/presence/ws/{target_id}") as ws:
            ws_msg = await ws.recv()
            msg_data = json.loads(ws_msg)
            assert msg_data["type"] == "PRESENCE_UPDATE"
            print(f"✅ [8/8] 트래픽 0% 딥링크 ({routing['target_url']}) & WebSocket 실시간 합석 (동시시청 {msg_data['active_watchers']}명) 연결 성공!")

    print("==================================================")
    print("🎉 ALL 8 E2E INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_full_integration_test())
