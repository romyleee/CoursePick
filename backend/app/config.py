from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
PHOTO_DIR = STORAGE_DIR / "photos"
DATA_DIR = Path(__file__).resolve().parent / "data"

DB_PATH = BASE_DIR / "app.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

PHOTO_DIR.mkdir(parents=True, exist_ok=True)
