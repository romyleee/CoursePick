from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from .. import recommender
from ..db import get_session
from ..models import RecommendSession
from ..schemas import (
    Answers,
    SessionAnswerSubmit,
    SessionCreate,
    SessionOut,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _to_out(s: RecommendSession) -> SessionOut:
    return SessionOut(
        id=s.id,
        code=s.code,
        mode=s.mode,
        couple_id=s.couple_id,
        a_user_id=s.a_user_id,
        b_user_id=s.b_user_id,
        a_answers=Answers(**s.a_answers) if s.a_answers else None,
        b_answers=Answers(**s.b_answers) if s.b_answers else None,
        a_done=s.a_answers is not None,
        b_done=s.b_answers is not None,
        result=s.result,
        ready=s.result is not None,
        created_at=s.created_at,
    )


def _maybe_compute_result(s: RecommendSession, db: Session) -> None:
    """양쪽 답변이 모두 있고 결과가 아직 없으면 계산해서 채움."""
    if s.mode != "couple":
        return
    if s.result is not None:
        return
    if not (s.a_answers and s.b_answers):
        return
    a = Answers(**s.a_answers)
    b = Answers(**s.b_answers)
    merged, note = recommender.merge_answers(a, b)
    result = recommender.build_course(merged, db, s.couple_id, extra_reason=note)
    s.result = result.model_dump()


@router.post("", response_model=SessionOut)
def create_session(payload: SessionCreate, session: Session = Depends(get_session)):
    s = RecommendSession(
        code=recommender.unique_session_code(session),
        mode=payload.mode,
        couple_id=payload.couple_id,
        a_user_id=payload.user_id,
    )

    if payload.mode == "solo":
        if payload.answers is None:
            raise HTTPException(400, "solo mode requires answers")
        s.a_answers = payload.answers.model_dump()
        result = recommender.build_course(payload.answers, session, payload.couple_id)
        s.result = result.model_dump()
    else:  # couple
        # 빈 방(lobby) 생성. answers가 함께 오면 즉시 본인 답변으로 저장.
        if payload.answers is not None:
            s.a_answers = payload.answers.model_dump()

    session.add(s)
    session.commit()
    session.refresh(s)
    return _to_out(s)


@router.post("/{code}/answer", response_model=SessionOut)
def submit_answer(code: str, payload: SessionAnswerSubmit, session: Session = Depends(get_session)):
    """
    Both A (creator) and B (partner) submit answers via this endpoint.
    - creator (a_user_id == user_id) → fills a_answers
    - other user → becomes b, fills b_answers
    Result is computed once both answers are present.
    """
    s = session.exec(select(RecommendSession).where(RecommendSession.code == code)).first()
    if not s:
        raise HTTPException(404, "session not found")
    if s.mode != "couple":
        raise HTTPException(400, "not a couple session")

    if s.a_user_id == payload.user_id:
        # creator submitting (or resubmitting) own answers
        s.a_answers = payload.answers.model_dump()
    else:
        # partner
        if s.b_user_id is None:
            s.b_user_id = payload.user_id
        elif s.b_user_id != payload.user_id:
            raise HTTPException(409, "session already has a different partner")
        s.b_answers = payload.answers.model_dump()

    _maybe_compute_result(s, session)
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
