# CoursePick — Frontend

> 모바일 우선 / 데스크톱 호환 SPA. 백엔드(`localhost:8000`)와 분리 실행.

## 🧩 기술 스택

| 영역 | 선택 |
| --- | --- |
| 프레임워크 | React 19 |
| 언어 | TypeScript |
| 빌드 | Vite |
| 스타일 | Tailwind CSS v3 |
| 라우팅 | React Router v6 |
| 서버 상태 | TanStack Query v5 |
| 폰트 | Pretendard (CDN, SIL OFL) |

전부 OSS / 무료. 외부 서비스 의존 없음.

## 📁 구조

```text
frontend/
├─ index.html              viewport-fit=cover, Pretendard CDN
├─ tailwind.config.js
├─ postcss.config.js
├─ .env                    VITE_API_BASE
└─ src/
   ├─ main.tsx             Provider 부트스트랩
   ├─ App.tsx              라우팅
   ├─ api.ts               타입 + fetch 래퍼 + 엔드포인트 (단일 파일)
   ├─ session.ts           localStorage 기반 세션
   ├─ index.css            Tailwind + safe-area 변수
   ├─ hooks/
   │  └─ useSession.ts
   ├─ utils/
   │  └─ image.ts          canvas 리사이즈 (≤1280px)
   ├─ components/
   │  ├─ Layout.tsx        반응형 컨테이너
   │  ├─ TabBar.tsx        하단 탭 (safe-area 대응)
   │  ├─ EmojiButton.tsx
   │  ├─ StarRating.tsx
   │  ├─ CourseCard.tsx
   │  └─ LogCard.tsx
   └─ pages/
      ├─ HomePage.tsx
      ├─ RecommendPage.tsx
      ├─ LogFormPage.tsx
      ├─ LogDetailPage.tsx
      └─ TimelinePage.tsx
```

## ▶️ 실행

> 사전 조건: 백엔드(`localhost:8000`)가 실행 중이어야 함.
> 백엔드는 별도 터미널에서 conda 환경으로 실행:
> ```bash
> conda activate coursepick
> cd backend
> uvicorn app.main:app --reload --port 8000
> ```

```bash
# 1) 의존성 설치 (최초 1회)
npm install

# 2) 개발 서버
npm run dev
# → http://localhost:5173

# 3) 프로덕션 빌드
npm run build
# → dist/

# 4) 빌드 산출물 미리보기
npm run preview
```

## ⚙️ 환경 변수

`.env`

```text
VITE_API_BASE=http://localhost:8000
```

## 📱 반응형 정책

- **모바일 우선** (`max-w-md` = 448px 컨테이너)
- **데스크톱**: 같은 폭을 가운데 카드처럼 띄움 (`md:rounded-3xl`, 회색 배경)
- **iOS Safari**: `100dvh` + `viewport-fit=cover` + `env(safe-area-inset-bottom)`
- **터치 타겟**: 버튼 최소 56px 높이
- **이모지 1차 + 텍스트 보조** UX

## 🗺️ 라우트

| 경로 | 페이지 |
| --- | --- |
| `/` | 홈 (CTA + 최근 기록 3개) |
| `/recommend` | 4단계 질문 → 코스 결과 |
| `/logs/new` | 사진 + 장소 + ⭐ + 메모 |
| `/logs/:id` | 상세 + 삭제 |
| `/timeline` | 월별 그리드 |
