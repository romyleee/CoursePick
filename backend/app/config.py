import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
PHOTO_DIR = STORAGE_DIR / "photos"
DATA_DIR = Path(__file__).resolve().parent / "data"

DB_PATH = BASE_DIR / "app.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024

# 기본 허용 origin
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://golden-fox-30a478.netlify.app",  # 배포된 Netlify 사이트
]

# 환경변수로 추가 origin 지정 가능 (쉼표 구분)
# e.g. EXTRA_CORS_ORIGINS="https://my-site.netlify.app,https://example.com"
_extra = os.environ.get("EXTRA_CORS_ORIGINS", "").strip()
if _extra:
    CORS_ORIGINS += [o.strip() for o in _extra.split(",") if o.strip()]

PHOTO_DIR.mkdir(parents=True, exist_ok=True)
