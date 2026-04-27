from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import CORS_ORIGINS, PHOTO_DIR
from .db import init_db
from .routers import logs, sessions, users


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="CoursePick API", version="0.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    # 어떤 Netlify 사이트든 허용 (배포 URL 바뀌어도 OK)
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/photos", StaticFiles(directory=str(PHOTO_DIR)), name="photos")

for r in (users.router, sessions.router, logs.router):
    app.include_router(r)


@app.get("/")
def root():
    return {"name": "CoursePick API", "docs": "/docs"}
