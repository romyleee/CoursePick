import datetime as dt
from typing import Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nickname: str = Field(index=True)
    created_at: dt.datetime = Field(default_factory=dt.datetime.utcnow)


class Couple(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invite_code: str = Field(unique=True, index=True)
    user_a_id: int = Field(foreign_key="user.id")
    user_b_id: Optional[int] = Field(default=None, foreign_key="user.id")
    started_at: Optional[dt.date] = None
    created_at: dt.datetime = Field(default_factory=dt.datetime.utcnow)


class RecommendSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)
    mode: str  # "solo" | "couple"
    couple_id: Optional[int] = Field(default=None, foreign_key="couple.id")
    a_user_id: int = Field(foreign_key="user.id")
    b_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    a_answers: dict = Field(sa_column=Column(JSON))
    b_answers: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    result: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: dt.datetime = Field(default_factory=dt.datetime.utcnow)


class DateLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    couple_id: int = Field(foreign_key="couple.id", index=True)
    date: dt.date = Field(index=True)
    course: list = Field(default_factory=list, sa_column=Column(JSON))  # [{step,type,name},...]
    place_name: str  # 대표 이름 (수정 가능)
    photo_path: Optional[str] = None

    a_user_id: int = Field(foreign_key="user.id")
    b_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    a_rating: Optional[int] = Field(default=None, ge=1, le=5)
    b_rating: Optional[int] = Field(default=None, ge=1, le=5)
    completed: bool = True

    memo: Optional[str] = None
    session_id: Optional[int] = Field(default=None, foreign_key="recommendsession.id")
    created_at: dt.datetime = Field(default_factory=dt.datetime.utcnow)
