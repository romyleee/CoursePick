import json
import random
import secrets
import string
from datetime import date, timedelta
from functools import lru_cache
from typing import Optional

from sqlmodel import Session, select

from .config import DATA_DIR
from .models import Couple, DateLog, RecommendSession
from .schemas import Answers, CourseStep, RecommendResponse

STATE_PRIO = {"tired": 2, "normal": 1, "good": 0}
ACTIVITY_PRIO = {"low": 1, "high": 0}
BUDGET_PRIO = {"low": 0, "mid": 1, "high": 2}

FAVORITE_WEIGHT = 3


# ──────────────── code generation ────────────────

def generate_code(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    alphabet = alphabet.translate(str.maketrans("", "", "0O1IL"))
    return "".join(secrets.choice(alphabet) for _ in range(length))


def unique_couple_invite_code(session: Session) -> str:
    for _ in range(50):
        code = generate_code()
        if not session.exec(select(Couple).where(Couple.invite_code == code)).first():
            return code
    raise RuntimeError("failed to allocate unique invite code")


def unique_session_code(session: Session) -> str:
    for _ in range(50):
        code = generate_code()
        if not session.exec(select(RecommendSession).where(RecommendSession.code == code)).first():
            return code
    raise RuntimeError("failed to allocate unique session code")


# ──────────────── data ────────────────

@lru_cache(maxsize=1)
def _data() -> dict:
    with (DATA_DIR / "courses.json").open(encoding="utf-8") as f:
        return json.load(f)


# ──────────────── merge ────────────────

def merge_answers(a: Answers, b: Answers) -> tuple[Answers, str]:
    state = a.state if STATE_PRIO[a.state] >= STATE_PRIO[b.state] else b.state
    activity = "low" if "low" in (a.activity, b.activity) else "high"
    budget = a.budget if BUDGET_PRIO[a.budget] <= BUDGET_PRIO[b.budget] else b.budget
    mood = a.mood if a.mood == b.mood else "calm"

    # Optional dimensions: take A's value if both agree, else "any"
    time = a.time if a.time and a.time == b.time else None
    place = a.place if a.place and a.place == b.place else None
    cuisine = a.cuisine if a.cuisine and a.cuisine == b.cuisine else None

    note = (
        f"둘의 답을 합쳤어요 — 컨디션 {state}, 분위기 {mood}, "
        f"활동 {activity}, 예산 {budget}"
    )
    if time or place or cuisine:
        extras = []
        if time: extras.append(f"시간 {time}")
        if place: extras.append(f"장소 {place}")
        if cuisine: extras.append(f"음식 {cuisine}")
        note += " · " + ", ".join(extras)

    return (
        Answers(
            state=state, mood=mood, activity=activity, budget=budget,  # type: ignore[arg-type]
            time=time, place=place, cuisine=cuisine,
        ),
        note,
    )


# ──────────────── recommendation ────────────────

def _match_rule(ans: Answers) -> dict:
    for rule in _data()["rules"]:
        m = rule["match"]
        if m["state"] == ans.state and m["mood"] == ans.mood and m["activity"] == ans.activity:
            return rule
    return {"course_types": ["cafe", "food", "dessert"], "reason": "기본 추천 코스"}


def _recent_names(session: Session, couple_id: Optional[int], days: int = 14) -> set[str]:
    if couple_id is None:
        return set()
    since = date.today() - timedelta(days=days)
    rows = session.exec(
        select(DateLog.course)
        .where(DateLog.couple_id == couple_id)
        .where(DateLog.date >= since)
    ).all()
    names: set[str] = set()
    for course in rows:
        for step in course or []:
            names.add(step["name"])
    return names


def _favorite_names(session: Session, couple_id: Optional[int]) -> set[str]:
    if couple_id is None:
        return set()
    rows = session.exec(
        select(DateLog).where(DateLog.couple_id == couple_id).where(DateLog.completed == True)  # noqa: E712
    ).all()
    names: set[str] = set()
    for log in rows:
        a_ok = log.a_rating == 5
        b_ok = log.b_rating == 5 if log.b_user_id is not None else True
        if a_ok and b_ok:
            for step in log.course or []:
                names.add(step["name"])
    return names


def _matches_filters(c: dict, ans: Answers, course_type: str) -> bool:
    """Check optional time/place/cuisine filters."""
    if c["type"] != course_type:
        return False
    if ans.budget not in (c.get("budget") or []):
        return False
    if ans.time:
        if ans.time not in (c.get("time") or []):
            return False
    if ans.place and ans.place != "any":
        cp = c.get("place")
        if cp != ans.place and cp != "both":
            return False
    if ans.cuisine and ans.cuisine != "any" and course_type == "food":
        if c.get("cuisine") != ans.cuisine:
            return False
    return True


def _pick(course_type: str, ans: Answers, exclude: set[str], favorites: set[str]) -> Optional[dict]:
    courses = _data()["courses"]

    # 1. strict: match all filters
    pool = [c for c in courses if _matches_filters(c, ans, course_type)]

    # Relaxation order: place → time → cuisine (cuisine is strongest preference)
    # 2. drop place
    if not pool and ans.place and ans.place != "any":
        relaxed = ans.model_copy(update={"place": None})
        pool = [c for c in courses if _matches_filters(c, relaxed, course_type)]

    # 3. drop time
    if not pool and ans.time:
        relaxed = ans.model_copy(update={"place": None, "time": None})
        pool = [c for c in courses if _matches_filters(c, relaxed, course_type)]

    # 4. drop cuisine (last)
    if not pool and ans.cuisine and ans.cuisine != "any" and course_type == "food":
        relaxed = ans.model_copy(update={"place": None, "time": None, "cuisine": None})
        pool = [c for c in courses if _matches_filters(c, relaxed, course_type)]

    # 5. last resort: type + budget
    if not pool:
        pool = [c for c in courses if c["type"] == course_type and ans.budget in (c.get("budget") or [])]
    if not pool:
        pool = [c for c in courses if c["type"] == course_type]
    if not pool:
        return None

    fresh = [c for c in pool if c["name"] not in exclude] or pool
    weighted: list[dict] = []
    for c in fresh:
        weighted.extend([c] * (FAVORITE_WEIGHT if c["name"] in favorites else 1))
    return random.choice(weighted)


def build_course(
    answers: Answers,
    session: Session,
    couple_id: Optional[int] = None,
    extra_reason: str = "",
) -> RecommendResponse:
    rule = _match_rule(answers)
    exclude = _recent_names(session, couple_id)
    favorites = _favorite_names(session, couple_id)
    course: list[CourseStep] = []
    used: set[str] = set()
    for idx, ctype in enumerate(rule["course_types"], start=1):
        picked = _pick(ctype, answers, exclude | used, favorites)
        if picked is None:
            continue
        used.add(picked["name"])
        course.append(CourseStep(step=idx, type=picked["type"], name=picked["name"]))
    reason = f"{extra_reason}\n{rule['reason']}".strip() if extra_reason else rule["reason"]
    if favorites & {s.name for s in course}:
        reason += "\n💖 최애 코스 포함"
    return RecommendResponse(course=course, reason=reason)
