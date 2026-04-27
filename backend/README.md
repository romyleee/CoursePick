# CoursePick — Backend

> 커플 데이트 추천 / 기록 / 타임라인 REST API. 로컬 전용 MVP.

## 🧩 기술 스택

| 영역 | 선택 |
| --- | --- |
| 언어 | Python 3.12+ |
| 프레임워크 | FastAPI |
| ASGI 서버 | Uvicorn |
| ORM | SQLModel (SQLAlchemy + Pydantic) |
| DB | SQLite (파일 1개, 설치 불필요) |
| 파일 저장 | 로컬 디스크 (`./storage/photos`) |
| 이미지 처리 | Pillow |
| 검증/직렬화 | Pydantic v2 |

전부 OSS / 무료. 외부 서비스 의존 없음.

## 📁 구조

```text
backend/
├─ app/
│  ├─ main.py          FastAPI 엔트리 (CORS / static / lifespan)
│  ├─ config.py        경로 / CORS origins / 업로드 정책
│  ├─ db.py            SQLModel 엔진 + 세션
│  ├─ models.py        User / Couple / DateLog
│  ├─ schemas.py       요청/응답 Pydantic
│  ├─ recommender.py   룰 매칭 + 최근 기록 제외
│  ├─ data/courses.json  코스 풀 + 룰 시드
│  └─ routers/
│     ├─ users.py      /api/users, /api/couples
│     ├─ recommend.py  /api/recommend
│     └─ logs.py       /api/logs CRUD + /api/timeline
├─ storage/photos/     업로드 사진
├─ requirements.txt
└─ run.sh
```

## ▶️ 실행 (Miniconda)

```bash
# 1) 최초 1회: 가상환경 생성 (Python 3.12)
conda create -n coursepick python=3.12 -y

# 2) 활성화
conda activate coursepick

# 3) 의존성 설치 (최초 1회 / 변경 시)
pip install -r requirements.txt

# 4) 개발 서버 실행
uvicorn app.main:app --reload --port 8000

# 종료할 때
conda deactivate
```

- API 루트: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- 업로드 사진: http://localhost:8000/photos/{filename}

> Windows에서 `conda activate`가 안 되면 Anaconda Prompt를 사용하거나
> `conda init bash` (또는 `powershell`) 한 번 실행 후 셸을 재시작하세요.

## 🌐 주요 엔드포인트

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| POST | `/api/users` | 닉네임으로 사용자 생성 |
| POST | `/api/couples` | 커플 생성 |
| POST | `/api/recommend` | 코스 추천 (state/mood/activity/budget) |
| POST | `/api/logs` | 데이트 기록 + 사진 업로드 (multipart) |
| GET  | `/api/logs` | 기록 목록 (`?couple_id&limit`) |
| GET  | `/api/logs/{id}` | 단건 조회 |
| PATCH | `/api/logs/{id}` | 만족도/메모/장소 수정 |
| DELETE | `/api/logs/{id}` | 삭제 |
| GET  | `/api/timeline` | 월별 그룹 타임라인 |

## ⚙️ 설정

- `app/config.py` — DB 경로, 업로드 디렉토리, CORS 허용 origin
- 기본 CORS: `http://localhost:5173` (Vite dev)
- DB 파일: `backend/app.db` (자동 생성)
- 사진 저장: `backend/storage/photos/`

## 🧪 빠른 점검

```bash
conda activate coursepick
python -c "from app.main import app; print('routes:', len(app.routes))"
```
