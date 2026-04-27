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
├─ netlify.toml            Netlify 빌드 설정 + SPA redirects
├─ public/_redirects       SPA fallback (Netlify)
├─ .env                    VITE_API_BASE
└─ src/
   ├─ main.tsx             Provider 부트스트랩
   ├─ App.tsx              라우팅
   ├─ api.ts               타입 + fetch 래퍼 + 엔드포인트 (단일 파일)
   ├─ session.ts           localStorage 기반 세션 + 랜덤 닉네임
   ├─ index.css            Tailwind + safe-area 변수 + 전역 uppercase
   ├─ hooks/
   │  └─ useSession.ts
   ├─ utils/
   │  └─ image.ts          canvas 리사이즈 (≤1280px)
   ├─ components/
   │  ├─ Layout.tsx        반응형 컨테이너 + 코스Pick 로고
   │  ├─ TabBar.tsx        하단 탭 (safe-area 대응)
   │  ├─ EmojiButton.tsx
   │  ├─ StarRating.tsx
   │  ├─ CourseCard.tsx
   │  ├─ LogCard.tsx
   │  └─ AnswersWizard.tsx 4 필수 + 3 선택 단계
   └─ pages/
      ├─ HomePage.tsx
      ├─ RecommendSoloPage.tsx
      ├─ RecommendCouplePage.tsx  방 만들기 → 공유 → 양쪽 답 → 결과
      ├─ JoinPage.tsx
      ├─ LogFormPage.tsx
      ├─ LogDetailPage.tsx
      ├─ TimelinePage.tsx
      └─ SettingsPage.tsx
```

## ▶️ 로컬 실행

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

> ⚠️ Vite의 환경변수는 **빌드 타임**에 코드에 박힘. 변경하면 반드시 다시 빌드 필요.

---

## 🚀 배포 가이드

> 프론트는 **Netlify**, 백엔드는 **로컬 PC + localtunnel** 구성.
> Git 자동 배포 또는 드래그 배포 둘 다 가능.

### 백엔드 인터넷 노출 — localtunnel

Netlify에 배포된 프론트가 본인 PC의 백엔드를 호출하려면 터널이 필요합니다.
**localtunnel** (무료 / 무가입 / npm 패키지) 사용.

```bash
# 1) 설치 (한 번만)
npm install -g localtunnel

# 2) 백엔드 띄운 상태에서 새 터미널
lt --port 8000 --subdomain coursepick-romyleee
# → https://coursepick-romyleee.loca.lt
```

> ⚠️ 첫 방문자는 한 번 위 URL에 직접 접속해서 "Click to Continue" 통과 필요 (localtunnel 무료 정책)
>
> ⚠️ subdomain은 선점된 경우 다른 이름이 발급됨. `coursepick-romyleee`은 흔치 않으니 안정적.
>
> ⚠️ 본인 PC + `lt` 프로세스가 켜져 있을 때만 동작.

### 프론트 배포 — Netlify (드래그 방식)

Git 연결 없이 빠르게:

```bash
# 1) 백엔드 URL을 박아서 빌드
cd frontend
VITE_API_BASE=https://coursepick-romyleee.loca.lt npm run build

# 2) frontend/dist 폴더를 통째로 Netlify 대시보드에 드래그
#    (Project overview → Production deploys → Drag & drop area)
```

→ `https://<your-site>.netlify.app` 에서 즉시 작동.

### 프론트 배포 — Netlify (Git 자동 배포)

수정할 때마다 `git push`만으로 자동 배포되게:

1. Netlify 대시보드 → **Project configuration → Build & deploy → Link site to Git**
2. GitHub 저장소 선택 (`romyleee/CoursePick`)
3. [netlify.toml](./netlify.toml)이 자동 인식됨 (base=frontend, build=npm run build, publish=dist)
4. **Environment variables** 추가:
   ```
   VITE_API_BASE = https://coursepick-romyleee.loca.lt
   ```
5. **Deploy** 클릭

이후로는:
```bash
git push   # → Netlify가 자동 빌드 + 배포 (~30초)
```

### 환경변수 변경 후 재배포

`VITE_API_BASE` 같은 환경변수는 빌드 타임에 박히므로 변경 시:

- **Drop 사이트**: 로컬에서 새 env로 다시 빌드 → dist 다시 드래그
- **Git 연결 사이트**: Deploys → Trigger deploy → **Clear cache and deploy site**

### 백엔드 CORS

[backend/app/config.py](../backend/app/config.py)의 `CORS_ORIGINS`에 Netlify URL 추가 필수.
환경변수 `EXTRA_CORS_ORIGINS="https://other.netlify.app,..."`로 동적 추가도 가능.

---

## 📱 반응형 정책

- **모바일 우선** (`max-w-md` = 448px 컨테이너)
- **데스크톱**: 같은 폭을 가운데 카드처럼 띄움 (`md:rounded-3xl`, 회색 배경)
- **iOS Safari**: `100dvh` + `viewport-fit=cover` + `env(safe-area-inset-bottom)`
- **터치 타겟**: 버튼 최소 56px 높이
- **이모지 1차 + 텍스트 보조** UX

## 🎨 컬러 팔레트

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `cream` | `#FAF7F2` | 배경 |
| `paper` | `#FFFFFF` | 카드 |
| `ink` | `#1A2B4A` | 본문 텍스트 (딥 네이비) |
| `ink-3` | `#5C6B85` | 보조 텍스트 |
| `line` | `#E8E2D8` | 1px 보더 |
| `terracotta` | `#E8704F` | 포인트 (CTA·별점·코드) |
| `danger` | `#DC2626` | 에러·삭제 등 destructive |

## 🗺️ 라우트

| 경로 | 페이지 |
| --- | --- |
| `/` | 홈 (혼자/둘이/코드참가 + 최근 기록) |
| `/recommend/solo` | 솔로: 4단계(+선택 3) → 결과 |
| `/recommend/couple` | 커플: 방 만들기 → 코드 공유 → 답변 → 대기 → 결과 |
| `/join` (`?code=`) | 참가: 코드 입력 → 답변 → 결과 |
| `/logs/new` | 기록 작성 (사진 + 장소 + 메모) |
| `/logs/:id` | 상세 (A·B 별점 / 이행 여부 / 삭제) |
| `/timeline` | 월별 그리드 |
| `/settings` | 닉네임 변경 / 커플 모드 해제 |
