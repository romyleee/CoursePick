from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

State = Literal["good", "normal", "tired"]
Mood = Literal["calm", "excited", "focused"]
Activity = Literal["low", "high"]
Budget = Literal["low", "mid", "high"]
TimeOfDay = Literal["brunch", "afternoon", "evening", "night"]
PlacePref = Literal["indoor", "outdoor", "any"]
Cuisine = Literal["korean", "western", "japanese", "asian"]
Region = Literal[
    # 서울
    "gangnam", "hongdae", "seongsu", "itaewon", "jamsil", "jongno", "hangang",
    "yeouido", "mangwon", "yeonnam", "apgujeong",
    # 인천
    "songdo", "bupyeong", "yeongjong",
    # 경기
    "bundang", "pangyo", "ilsan", "suwon",
]


class Answers(BaseModel):
    state: State
    mood: Mood
    activity: Activity
    budget: Budget
    # Optional refinements (multi-select 가능: 빈 배열 또는 None = 무관)
    time: Optional[list[TimeOfDay]] = None
    place: Optional[PlacePref] = None
    cuisine: Optional[list[Cuisine]] = None
    # region 은 사용자 입력이 아니라 시스템이 추천 — 출력 전용


class CourseStep(BaseModel):
    step: int
    type: str
    name: str


class CourseOption(BaseModel):
    course: list[CourseStep]
    reason: str
    region: Optional[str] = None


class RecommendResponse(BaseModel):
    options: list[CourseOption]  # 보통 2개, 사용자가 선택 또는 조합


# Users
class UserCreate(BaseModel):
    nickname: str = Field(min_length=1, max_length=30)


class UserUpdate(BaseModel):
    nickname: str = Field(min_length=1, max_length=30)


class UserOut(BaseModel):
    id: int
    nickname: str
    created_at: datetime


# Couples
class CoupleCreate(BaseModel):
    user_a_id: int


class CoupleJoin(BaseModel):
    invite_code: str
    user_id: int


class CoupleOut(BaseModel):
    id: int
    invite_code: str
    user_a_id: int
    user_b_id: Optional[int]
    started_at: Optional[date]


# Recommend Sessions
class SessionCreate(BaseModel):
    mode: Literal["solo", "couple"]
    user_id: int
    couple_id: Optional[int] = None
    answers: Optional[Answers] = None  # required for solo, optional for couple (lobby)


class SessionAnswerSubmit(BaseModel):
    user_id: int
    answers: Answers


class SessionOut(BaseModel):
    id: int
    code: str
    mode: str
    couple_id: Optional[int]
    a_user_id: int
    b_user_id: Optional[int]
    a_answers: Optional[Answers]
    b_answers: Optional[Answers]
    a_done: bool
    b_done: bool
    result: Optional[RecommendResponse]
    ready: bool
    created_at: datetime


# Date Logs
class DateLogCreate(BaseModel):
    couple_id: int
    date: date
    place_name: str
    course: list[CourseStep] = []
    a_user_id: int
    b_user_id: Optional[int] = None
    session_id: Optional[int] = None
    completed: bool = True
    memo: Optional[str] = None


class DateLogPatch(BaseModel):
    place_name: Optional[str] = None
    a_rating: Optional[int] = Field(default=None, ge=1, le=5)
    b_rating: Optional[int] = Field(default=None, ge=1, le=5)
    completed: Optional[bool] = None
    memo: Optional[str] = None


class DateLogOut(BaseModel):
    id: int
    couple_id: int
    date: date
    place_name: str
    course: list[CourseStep]
    photo_path: Optional[str]
    photo_url: Optional[str]
    a_user_id: int
    b_user_id: Optional[int]
    a_rating: Optional[int]
    b_rating: Optional[int]
    completed: bool
    memo: Optional[str]
    session_id: Optional[int]
    created_at: datetime


class TimelineGroup(BaseModel):
    year: int
    month: int
    logs: list[DateLogOut]
