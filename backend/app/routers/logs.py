import json
import uuid
from collections import defaultdict
from datetime import date as date_cls
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlmodel import Session, desc, select

from ..config import ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, PHOTO_DIR
from ..db import get_session
from ..models import DateLog
from ..schemas import CourseStep, DateLogOut, DateLogPatch, TimelineGroup

router = APIRouter(prefix="/api", tags=["logs"])


def _to_out(log: DateLog, request: Request) -> DateLogOut:
    photo_url = str(request.url_for("photos", path=log.photo_path)) if log.photo_path else None
    course = [CourseStep(**s) for s in (log.course or [])]
    return DateLogOut(
        id=log.id,
        couple_id=log.couple_id,
        date=log.date,
        place_name=log.place_name,
        course=course,
        photo_path=log.photo_path,
        photo_url=photo_url,
        a_user_id=log.a_user_id,
        b_user_id=log.b_user_id,
        a_rating=log.a_rating,
        b_rating=log.b_rating,
        completed=log.completed,
        memo=log.memo,
        session_id=log.session_id,
        created_at=log.created_at,
    )


def _query_logs(session: Session, couple_id: Optional[int], limit: Optional[int] = None):
    stmt = select(DateLog).order_by(desc(DateLog.date), desc(DateLog.id))
    if couple_id is not None:
        stmt = stmt.where(DateLog.couple_id == couple_id)
    if limit is not None:
        stmt = stmt.limit(limit)
    return session.exec(stmt).all()


@router.post("/logs", response_model=DateLogOut)
async def create_log(
    request: Request,
    couple_id: int = Form(...),
    date: date_cls = Form(...),
    place_name: str = Form(...),
    a_user_id: int = Form(...),
    b_user_id: Optional[int] = Form(None),
    session_id: Optional[int] = Form(None),
    completed: bool = Form(True),
    memo: Optional[str] = Form(None),
    course_json: Optional[str] = Form(None),  # JSON string of CourseStep list
    photo: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
):
    photo_path: Optional[str] = None
    if photo is not None and photo.filename:
        if photo.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, "unsupported image type")
        contents = await photo.read()
        if len(contents) > MAX_PHOTO_BYTES:
            raise HTTPException(400, "image too large (max 5MB)")
        ext = Path(photo.filename).suffix.lower() or ".jpg"
        photo_path = f"{couple_id}_{uuid.uuid4().hex[:8]}{ext}"
        (PHOTO_DIR / photo_path).write_bytes(contents)

    course: list = []
    if course_json:
        try:
            course = json.loads(course_json)
        except json.JSONDecodeError:
            raise HTTPException(400, "invalid course_json")

    log = DateLog(
        couple_id=couple_id,
        date=date,
        place_name=place_name,
        course=course,
        photo_path=photo_path,
        a_user_id=a_user_id,
        b_user_id=b_user_id,
        completed=completed,
        memo=memo,
        session_id=session_id,
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return _to_out(log, request)


@router.get("/logs", response_model=list[DateLogOut])
def list_logs(
    request: Request,
    couple_id: Optional[int] = None,
    limit: int = 20,
    session: Session = Depends(get_session),
):
    return [_to_out(l, request) for l in _query_logs(session, couple_id, limit)]


@router.get("/logs/{log_id}", response_model=DateLogOut)
def get_log(log_id: int, request: Request, session: Session = Depends(get_session)):
    log = session.get(DateLog, log_id)
    if not log:
        raise HTTPException(404, "log not found")
    return _to_out(log, request)


@router.patch("/logs/{log_id}", response_model=DateLogOut)
def patch_log(
    log_id: int,
    payload: DateLogPatch,
    request: Request,
    session: Session = Depends(get_session),
):
    log = session.get(DateLog, log_id)
    if not log:
        raise HTTPException(404, "log not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(log, k, v)
    session.add(log)
    session.commit()
    session.refresh(log)
    return _to_out(log, request)


@router.delete("/logs/{log_id}")
def delete_log(log_id: int, session: Session = Depends(get_session)):
    log = session.get(DateLog, log_id)
    if not log:
        raise HTTPException(404, "log not found")
    if log.photo_path:
        (PHOTO_DIR / log.photo_path).unlink(missing_ok=True)
    session.delete(log)
    session.commit()
    return {"ok": True}


@router.get("/timeline", response_model=list[TimelineGroup])
def timeline(
    request: Request,
    couple_id: Optional[int] = None,
    session: Session = Depends(get_session),
):
    grouped: dict[tuple[int, int], list[DateLogOut]] = defaultdict(list)
    for log in _query_logs(session, couple_id):
        grouped[(log.date.year, log.date.month)].append(_to_out(log, request))
    return [
        TimelineGroup(year=y, month=m, logs=items)
        for (y, m), items in sorted(grouped.items(), reverse=True)
    ]
