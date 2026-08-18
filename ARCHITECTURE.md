# 🍱 남의 밥상 (MealTable) - 서비스 건축 및 API 라우팅 명세서

> **15분 맞춤형 OTT 플레이리스트 공유 및 실시간 소셜 시청 플랫폼**

---

## 1. 최적의 기술 스택 (Tech Stack) 제안

본 서비스는 **15분 식사시간 특화 큐레이션**, **유튜브/TMDB 메타데이터 수집**, **TensorFlow 기반 유저 군집화**, **Redis 기반 실시간 합석 모드**, **트래픽 제로 딥링크 라우팅**을 핵심 요구사항으로 합니다. 이를 완벽하게 지원하기 위한 기술 스택 조합은 다음과 같습니다.

| 레이어 | 기술 스택 | 채택 사유 및 이점 |
| :--- | :--- | :--- |
| **Backend** | **FastAPI (Python 3.11+)** | - Python 생태계의 **Pandas, NumPy, TensorFlow** 추천 모델과의 직접 통합 용이성<br>- 비동기(Async) 처리로 외부 API(YouTube, TMDB) 메타데이터 병렬 수집 속도 극대화<br>- WebSocket / SSE 지원으로 실시간 합석 모드 동시 접속 처리 우수<br>- OpenAPI (Swagger) 문서 자동 생성 |
| **Database** | **PostgreSQL 16** | - 관계형 데이터(유저, 플레이리스트, 비디오 메타데이터, 포크 관계, 시청 히스토리)의 높은 정합성 보장<br>- JSONB 지원으로 외부 API 원본 메타데이터 가변 저장 가능 |
| **In-Memory Cache** | **Redis 7** | - **실시간 합석 모드**: 플레이리스트별 동시 시청자 수(Presence) Pub/Sub 및 TTL 기반 실시간 집계<br>- 외부 API 메타데이터 캐싱 및 API Rate Limit 방어 |
| **Frontend** | **Next.js 14+ (App Router)** | - **딥링크(Deep Link) 호환성**: 모바일 브라우저/웹 앱 환경에서 앱 스킴 라우팅 최적화<br>- **SEO & SSR**: 큐레이션 플레이리스트 페이지 검색엔진 노출 및 SNS 공유 메타 태그 처리<br>- **반응형 소셜 UX**: Tailwind CSS / Vanilla CSS 기반 타이트한 15분 타이머 및 실시간 뱃지 UI |
| **ML Engine** | **TensorFlow + Pandas / NumPy** | - 메타데이터 카테고리/태그 vectorization 및 유저 포크/시청 행동 행렬 분해(Matrix Factorization)<br>- 취향 맞춤 유저 군집(Cluster) 분류 및 15분 러닝타임 맞춤 조합 추천 |

---

## 2. 전체 시스템 아키텍처 (System Architecture)

```mermaid
graph TD
    Client["Next.js 14 Web / PWA Client"]
    FastAPI["FastAPI Backend Server"]
    DB[("PostgreSQL\n(User / Playlist / Video DB)")]
    Redis[("Redis Cache\n(Presence & Real-time Watcher Count)")]
    ML["TensorFlow & Pandas\n(Curation & User Clustering Engine)"]
    YT_API["YouTube Data API v3"]
    TMDB_API["TMDB API"]
    OTT_Apps["External Platforms\n(YouTube / Netflix Apps & Web)"]

    Client -->|HTTP / REST API| FastAPI
    Client -->|WebSocket (Realtime Presence)| FastAPI
    FastAPI -->|Persistence & Queries| DB
    FastAPI -->|Pub/Sub & Presence Tracking| Redis
    FastAPI -->|On-Demand Metadata Fetch| YT_API
    FastAPI -->|On-Demand Metadata Fetch| TMDB_API
    FastAPI -->|Feature Extraction & Recs| ML
    Client -.->|3. Deep Link Click Redirect| OTT_Apps
```

---

## 3. 프로젝트 폴더 구조 (Directory Structure)

```text
nam-bapsang/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py           # 회원가입 및 JWT 인증
│   │   │       │   ├── videos.py         # URL 메타데이터 수집 및 딥링크
│   │   │       │   ├── playlists.py      # 플레이리스트 CRUD 및 포크(Fork)
│   │   │       │   ├── presence.py       # 실시간 합석 모드 WebSocket
│   │   │       │   └── recommendations.py# TF/Pandas 취향 군집 추천
│   │   │       └── router.py
│   │   ├── core/
│   │   │   ├── config.py                 # 환경 변수 (API Keys, DB URLs)
│   │   │   ├── database.py               # SQLAlchemy Async Engine
│   │   │   ├── redis.py                  # Redis Client & Presence Helper
│   │   │   └── security.py               # JWT 및 비밀번호 해싱
│   │   ├── models/                       # SQLAlchemy ORM 모델
│   │   │   ├── user.py
│   │   │   ├── video.py
│   │   │   ├── playlist.py
│   │   │   └── fork_log.py
│   │   ├── schemas/                      # Pydantic 데이터 검증 스키마
│   │   │   ├── video.py
│   │   │   └── playlist.py
│   │   ├── services/                     # 외부 API & 딥링크 서비스
│   │   │   ├── youtube.py                # YouTube v3 메타데이터 파서
│   │   │   ├── tmdb.py                   # TMDB API 메타데이터 파서
│   │   │   └── deeplink.py               # 플랫폼별 App Intent / Universal Link 파싱
│   │   ├── ml/                           # 맞춤형 큐레이션 AI 파이프라인
│   │   │   ├── preprocess.py             # Pandas/NumPy 메타데이터 전처리
│   │   │   └── cluster_model.py          # TensorFlow 유저 군집화 & 추천
│   │   └── main.py                       # FastAPI 앱 엔트리포인트
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                          # Next.js App Router (페이지 라우터)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                  # 메인 피드 (15분 추천 리스트)
│   │   │   ├── playlists/
│   │   │   │   ├── create/page.tsx       # 플레이리스트 생성 & URL 파싱
│   │   │   │   └── [id]/page.tsx         # 플레이리스트 상세 & 실시간 합석
│   │   │   └── my/page.tsx               # 내 보관함 및 포크 목록
│   │   ├── components/                   # UI 컴포넌트
│   │   │   ├── PlaylistCard.tsx          # 리스트 카드 (총 러닝타임 표기)
│   │   │   ├── VideoItem.tsx             # 메타데이터 카드 & 딥링크 버튼
│   │   │   ├── RealtimeBadge.tsx         # 실시간 동시 시청자 수 뱃지
│   │   │   └── DurationFilter.tsx        # 10분/15분/20분 식사시간 필터
│   │   ├── lib/                          # 유틸리티 & API 통신
│   │   │   ├── api.ts
│   │   │   └── deeplink.ts               # 모바일/데스크톱 딥링크 리다이렉트
│   │   └── types/                        # TypeScript 타입 정의
│   ├── package.json
│   └── tailwind.config.js
└── docker-compose.yml
```

---

## 4. 초기 API 라우팅 명세서 초안 (API Specification)

### 4.1 인증 (Auth)
| HTTP Method | Endpoint | 설명 | 요청 예시 / Query | 응답 예시 (200 OK) |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup` | 신규 회원가입 | `{ email, password, nickname }` | `{ id, nickname, created_at }` |
| `POST` | `/api/v1/auth/login` | 로그인 및 JWT 생성 | `{ email, password }` | `{ access_token, token_type: "bearer" }` |
| `GET` | `/api/v1/auth/me` | 내 프로필 정보 조회 | Header: `Authorization` | `{ id, email, nickname, fork_count }` |

### 4.2 메타데이터 온디맨드 수집 & 딥링크 (Videos & Metadata)
| HTTP Method | Endpoint | 설명 | 주요 기능 |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/videos/parse` | 영상 URL 메타데이터 온디맨드 추출 | YouTube v3 / TMDB API 통신하여 런타임(초), 썸네일, 제목 추출 |
| `GET` | `/api/v1/videos/{id}/redirect` | 원본 영상 딥링크 라우팅 및 클릭 로그 기록 | 유저 기기(OS) 감지 후 YouTube App scheme (`youtube://...`) 또는 Web URL 리다이렉트 |

### 4.3 플레이리스트 (Playlists) & 포크 (Forking)
| HTTP Method | Endpoint | 설명 | 요청/응답 주요 내용 |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/playlists` | 15분 맞춤 플레이리스트 생성 | Video ID 목록, 제목, 식사 메뉴 카테고리 (예: 점심 15분 컷, 혼밥 맞춤) |
| `GET` | `/api/v1/playlists` | 플레이리스트 목록 (타겟 런타임 필터링) | Query: `target_runtime=900` (15분 ± 3분 조절) |
| `GET` | `/api/v1/playlists/{id}` | 플레이리스트 상세 정보 조회 | 비디오 메타데이터 리스트, 총 러닝타임 계산 결과, 포크 수 |
| `POST` | `/api/v1/playlists/{id}/fork` | **플레이리스트 포크 (원터치 복제)** | 내 보관함에 복제 생성 + 원작자 `fork_count` 1 증가 |

### 4.4 맞춤형 큐레이션 (Recommendations)
| HTTP Method | Endpoint | 설명 | 내부 로직 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/recommendations/mealtime` | 15분 맞춤 추천 플레이리스트 피드 | Pandas로 영상 런타임 합산 알고리즘 적용 (목표 15분 구성) |
| `GET` | `/api/v1/recommendations/cluster` | **TensorFlow 기반 취향 군집 추천** | 유저 포크 history & 시청 메타데이터 행렬 분석 후 유사 군집 피드 반환 |

### 4.5 실시간 합석 모드 (Real-time Presence)
| 통신 방식 | Endpoint | 설명 | 작동 방식 |
| :--- | :--- | :--- | :--- |
| **WebSocket** | `/api/v1/presence/ws/{playlist_id}` | 실시간 합석 동시 시청자 수 연결 | 연결 시 Redis `SADD presence:{playlist_id} {user_id}` 등록 및 Broadcast |
| `GET` | `/api/v1/presence/{playlist_id}/count` | HTTP 기준 현재 합석 인원 수 집계 | Redis `SCARD presence:{playlist_id}` 조회 |

---

## 5. 핵심 구현 세부 전략

1. **메타데이터 수집 및 런타임 파싱 (YouTube / TMDB API)**:
   - YouTube ISO 8601 런타임 (예: `PT14M30S` -> `870`초) 파싱 logic.
   - TMDB 에피소드/영화 `runtime` 파싱 logic.
2. **트래픽 제로 딥링크 (Zero-Traffic Deep Linking)**:
   - 본 플랫폼은 영상 스트리밍 데이터를 직접 전송하지 않습니다.
   - 유저가 플레이리스트의 비디오 아이템을 클릭하면 모바일 환경(iOS/Android)에 맞춰 원본 플랫폼 앱/웹(`youtube://watch?v=...`, `https://www.netflix.com/title/...`)으로 즉시 이탈 시킵니다.
3. **15분 런타임 조합 알고리즘**:
   - 유저가 선택한 영상들의 총 러닝타임이 식사 목표 시간(예: 15분 = 900초)에 부합하는지 런타임 배열 전처리(NumPy/Pandas)로 빠르게 계산합니다.
