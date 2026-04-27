from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from .. import recommender
from ..db import get_session
from ..models import Couple, User
from ..schemas import (
    CoupleCreate,
    CoupleJoin,
    CoupleOut,
    UserCreate,
    UserOut,
    UserUpdate,
)

router = APIRouter(prefix="/api", tags=["users"])


@router.post("/users", response_model=UserOut)
def create_user(payload: UserCreate, session: Session = Depends(get_session)):
    user = User(nickname=payload.nickname)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "user not found")
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "user not found")
    user.nickname = payload.nickname
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/couples", response_model=CoupleOut)
def create_couple(payload: CoupleCreate, session: Session = Depends(get_session)):
    if not session.get(User, payload.user_a_id):
        raise HTTPException(404, "user_a not found")
    couple = Couple(
        user_a_id=payload.user_a_id,
        invite_code=recommender.unique_couple_invite_code(session),
    )
    session.add(couple)
    session.commit()
    session.refresh(couple)
    return couple


@router.post("/couples/join", response_model=CoupleOut)
def join_couple(payload: CoupleJoin, session: Session = Depends(get_session)):
    couple = session.exec(
        select(Couple).where(Couple.invite_code == payload.invite_code)
    ).first()
    if not couple:
        raise HTTPException(404, "invalid invite code")
    if not session.get(User, payload.user_id):
        raise HTTPException(404, "user not found")
    if couple.user_b_id is not None and couple.user_b_id != payload.user_id:
        raise HTTPException(409, "couple already has partner")
    if couple.user_a_id == payload.user_id:
        return couple  # creator re-entering
    couple.user_b_id = payload.user_id
    session.add(couple)
    session.commit()
    session.refresh(couple)
    return couple


@router.get("/couples/{couple_id}", response_model=CoupleOut)
def get_couple(couple_id: int, session: Session = Depends(get_session)):
    couple = session.get(Couple, couple_id)
    if not couple:
        raise HTTPException(404, "couple not found")
    return couple
