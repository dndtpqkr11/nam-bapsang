# 🍱 남의 밥상 (MealTable)

> **15분 맞춤형 OTT 플레이리스트 공유 및 실시간 소셜 시청 플랫폼**  
> *Eat & Watch in 15 Minutes — Powered by FastAPI, PostgreSQL, Redis, Next.js & TensorFlow AI*

---

## 📌 주요 핵심 특징 (Key Features)

1. **🍱 15분 식사 맞춤 큐레이션 (Mealtime Target Curation)**
   - 10분, 15분, 20분 목표 식사 시간(런타임) 필터링
   - Pandas 전처리 엔진을 통한 식사 목표 시간 부합 플레이리스트 정렬

2. **⚡ 트래픽 제로 딥링크 (Zero-Traffic Deep Linking)**
   - 영상 스트리밍 데이터를 플랫폼 서버에 저장하거나 전송하지 않음 (트래픽 비용 0%)
   - 유저 모바일/데스크톱 기기(iOS `youtube://`, Android Intent, Web Universal Link) 감지 후 원본 OTT 앱으로 직접 이탈 리다이렉트

3. **👥 실시간 합석 모드 (Real-time Presence Tracking)**
   - Redis 캐시 & WebSocket 연동 기반 동시 시청자 수 실시간 집계
   - 접속 시 `N명 함께 합석 중` 라이브 뱃지 표출 및 브로드캐스트

4. **🍴 원터치 포크 (One-Touch Playlist Forking)**
   - 타 유저의 15분 밥상 플레이리스트를 내 보관함으로 복제 생성
   - 원작자 포크 수 집계 및 보관함 레벨 보상 시스템

5. **🤖 TensorFlow 기반 유저 취향 군집화 (User Clustering)**
   - 유저 포크 및 시청 행동 카테고리 벡터화
   - Keras 딥러닝 임베딩 레이어 모델을 통한 취향 군집(Cluster) 예측 및 피드 추천

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 채택 기술 |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | FastAPI (Python 3.11+), SQLAlchemy (Async), Pydantic |
| **Database** | PostgreSQL 16 |
| **Cache & Realtime** | Redis 7 (Presence & Pub/Sub), WebSockets |
| **AI / Data** | TensorFlow 2.x, Pandas, NumPy |
| **DevOps** | Docker, Docker Compose |

---

## 🚀 로컬 개발 및 시작하기 (Getting Started)

### 1. Docker Compose 기반 한 번에 실행하기 (권장)

```bash
docker-compose up --build
```
- Frontend Web: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger API Docs: `http://localhost:8000/docs`

### 2. 매뉴얼 실행 (개발 환경)

#### 백엔드 (FastAPI)
```bash
cd backend
python -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt

# DB 시드 데이터 생성
PYTHONPATH=. python app/seed.py

# 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 프론트엔드 (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 E2E 통합 자동화 테스트 실행

전체 시나리오 (회원가입 -> 로그인 -> 메타데이터 파싱 -> 포크 -> 큐레이션 -> 웹소켓 합석) 자동 테스트:

```bash
PYTHONPATH=backend python backend/tests/integration_test.py
```

---

## 📁 프로젝트 구조 (Directory Structure)

```text
miniproject/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # Auth, Videos, Playlists, Presence, Recommendations
│   │   ├── core/               # Database, Security, Redis, Config
│   │   ├── ml/                 # TensorFlow & Pandas Curation Engine
│   │   ├── models/             # SQLAlchemy ORM Models
│   │   └── main.py             # FastAPI App Entrypoint
│   ├── tests/                  # E2E Integration Tests
│   ├── Dockerfile
│   └── seed.py
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router (Main, My, Playlists, 404)
│   │   ├── components/         # Navbar, PlaylistCard, VideoItem, RealtimeBadge, AuthModal
│   │   ├── lib/                # API client & DeepLink routing
│   │   └── types/              # TypeScript Type Definitions
│   └── Dockerfile
├── docker-compose.yml
├── ARCHITECTURE.md
└── README.md
```

---

## 📄 라이선스 (License)

Copyright © 2026 남의 밥상 (MealTable) Team. All Rights Reserved.
