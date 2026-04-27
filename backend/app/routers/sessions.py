from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from .. import recommender
from ..db import get_session
from ..models import RecommendSession
from ..schemas import Answers, SessionCreate, SessionJoin, SessionOut

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _to_out(s: RecommendSession) -> SessionOut:
    return SessionOut(
        id=s.id,
        code=s.code,
        mode=s.mode,
        couple_id=s.couple_id,
        a_user_id=s.a_user_id,
        b_user_id=s.b_user_id,
        a_answers=Answers(**s.a_answers),
        b_answers=Answers(**s.b_answers) if s.b_answers else None,
        result=s.result,
        ready=s.result is not None,
        created_at=s.created_at,
    )


@router.post("", response_model=SessionOut)
def create_session(payload: SessionCreate, session: Session = Depends(get_session)):
    s = RecommendSession(
        code=recommender.unique_session_code(session),
        mode=payload.mode,
        couple_id=payload.couple_id,
        a_user_id=payload.user_id,
        a_answers=payload.answers.model_dump(),
    )
    if payload.mode == "solo":
        result = recommender.build_course(payload.answers, session, payload.couple_id)
        s.result = result.model_dump()
    session.add(s)
    session.commit()
    session.refresh(s)
    return _to_out(s)


@router.post("/{code}/join", response_model=SessionOut)
def join_session(code: str, payload: SessionJoin, session: Session = Depends(get_session)):
    s = session.exec(select(RecommendSession).where(RecommendSession.code == code)).first()
    if not s:
        raise HTTPException(404, "session not found")
    if s.mode != "couple":
        raise HTTPException(400, "not a couple session")
    if s.b_user_id is not None and s.b_user_id != payload.user_id:
        raise HTTPException(409, "session already has partner")
    if s.a_user_id == payload.user_id:
        raise HTTPException(400, "cannot join your own session")

    s.b_user_id = payload.user_id
    s.b_answers = payload.answers.model_dump()
    a = Answers(**s.a_answers)
    merged, note = recommender.merge_answers(a, payload.answers)
    result = recommender.build_course(merged, session, s.couple_id, extra_reason=note)
    s.result = result.model_dump()
    session.add(s)
    session.commit()
    session.refresh(s)
    return _to_out(s)


@router.get("/{code}", response_model=SessionOut)
def get_session_by_code(code: str, session: Session = Depends(get_session)):
    s = session.exec(select(RecommendSession).where(RecommendSession.code == code)).first()
    if not s:
        raise HTTPException(404, "session not found")
    return _to_out(s)
