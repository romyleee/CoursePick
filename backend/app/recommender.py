import json
import random
import secrets
import string
from collections import Counter
from datetime import date, timedelta
from functools import lru_cache
from typing import Optional

from sqlmodel import Session, select

from .config import DATA_DIR
from .models import Couple, DateLog, RecommendSession
from .schemas import Answers, CourseOption, CourseStep, RecommendResponse

STATE_PRIO = {"tired": 2, "normal": 1, "good": 0}
ACTIVITY_PRIO = {"low": 1, "high": 0}
BUDGET_PRIO = {"low": 0, "mid": 1, "high": 2}

FAVORITE_WEIGHT = 3

REGION_LABELS = {
    # 서울
    "gangnam": "강남", "hongdae": "홍대", "seongsu": "성수",
    "itaewon": "이태원", "jamsil": "잠실", "jongno": "종로",
    "hangang": "한강", "yeouido": "여의도", "mangwon": "망원",
    "yeonnam": "연남", "apgujeong": "압구정",
    # 인천
    "songdo": "송도", "bupyeong": "부평", "yeongjong": "영종",
    # 경기
    "bundang": "분당", "pangyo": "판교", "ilsan": "일산", "suwon": "수원",
}


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

def _intersect(a: Optional[list], b: Optional[list]) -> Optional[list]:
    """두 리스트의 교집합. 한쪽이 비어 있으면 다른 쪽 사용."""
    if not a and not b:
        return None
    if not a:
        return b
    if not b:
        return a
    common = [x for x in a if x in b]
    return common or None  # 교집합 없으면 None (필터 해제)


def merge_answers(a: Answers, b: Answers) -> tuple[Answers, str]:
    state = a.state if STATE_PRIO[a.state] >= STATE_PRIO[b.state] else b.state
    activity = "low" if "low" in (a.activity, b.activity) else "high"
    budget = a.budget if BUDGET_PRIO[a.budget] <= BUDGET_PRIO[b.budget] else b.budget
    mood = a.mood if a.mood == b.mood else "calm"

    # 다중 선택 필드: 교집합
    time = _intersect(a.time, b.time)
    cuisine = _intersect(a.cuisine, b.cuisine)

    # 단일 필드
    place = a.place if a.place and a.place == b.place else None

    note = (
        f"둘의 답을 합쳤어요 — 컨디션 {state}, 분위기 {mood}, "
        f"활동 {activity}, 예산 {budget}"
    )
    extras = []
    if time: extras.append(f"시간 {','.join(time)}")
    if place: extras.append(f"장소 {place}")
    if cuisine: extras.append(f"음식 {','.join(cuisine)}")
    if extras:
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
    """Check optional filters. Lists = match if any element overlaps."""
    if c["type"] != course_type:
        return False
    if ans.budget not in (c.get("budget") or []):
        return False
    # time: 코스의 time 중 하나라도 사용자 선택에 들어 있으면 OK
    if ans.time:
        c_time = c.get("time") or []
        if not any(t in c_time for t in ans.time):
            return False
    # place
    if ans.place and ans.place != "any":
        cp = c.get("place")
        if cp != ans.place and cp != "both":
            return False
    # cuisine: food 타입에서만 적용. 코스 cuisine이 사용자 선택 중 하나면 OK
    if ans.cuisine and course_type == "food":
        if c.get("cuisine") not in ans.cuisine:
            return False
    return True


def _suggest_region(picked: list[dict]) -> Optional[str]:
    """선택된 코스들에서 공통 지역을 찾아 추천. 교집합 → 가장 빈번한 순."""
    if not picked:
        return None
    region_sets = [set(c.get("region") or []) for c in picked]
    common = set.intersection(*region_sets) if region_sets else set()
    if common:
        slug = random.choice(sorted(common))
    else:
        flat = [r for s in region_sets for r in s]
        if not flat:
            return None
        slug = Counter(flat).most_common(1)[0][0]
    return REGION_LABELS.get(slug, slug)


def _pick(course_type: str, ans: Answers, exclude: set[str], favorites: set[str]) -> Optional[dict]:
    courses = _data()["courses"]

    # 1. strict: match all filters
    pool = [c for c in courses if _matches_filters(c, ans, course_type)]

    # Relaxation order: place → time → cuisine
    if not pool and ans.place and ans.place != "any":
        relaxed = ans.model_copy(update={"place": None})
        pool = [c for c in courses if _matches_filters(c, relaxed, course_type)]

    if not pool and ans.time:
        relaxed = ans.model_copy(update={"place": None, "time": None})
        pool = [c for c in courses if _matches_filters(c, relaxed, course_type)]

    if not pool and ans.cuisine and course_type == "food":
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


def _build_one_option(
    answers: Answers,
    rule: dict,
    exclude_recent: set[str],
    cross_exclude: set[str],
    favorites: set[str],
    extra_reason: str,
) -> Optional[CourseOption]:
    """단일 옵션 1개 생성. cross_exclude로 다른 옵션과 중복 방지."""
    course: list[CourseStep] = []
    picked_full: list[dict] = []
    used: set[str] = set()
    for idx, ctype in enumerate(rule["course_types"], start=1):
        picked = _pick(ctype, answers, exclude_recent | used | cross_exclude, favorites)
        if picked is None:
            continue
        used.add(picked["name"])
        course.append(CourseStep(step=idx, type=picked["type"], name=picked["name"]))
        picked_full.append(picked)
    if not course:
        return None
    reason = f"{extra_reason}\n{rule['reason']}".strip() if extra_reason else rule["reason"]
    if favorites & {s.name for s in course}:
        reason += "\n💖 최애 코스 포함"
    region = _suggest_region(picked_full)
    return CourseOption(course=course, reason=reason, region=region)


def build_course(
    answers: Answers,
    session: Session,
    couple_id: Optional[int] = None,
    extra_reason: str = "",
    n: int = 2,
) -> RecommendResponse:
    """N개의 서로 다른 코스 옵션 생성."""
    rule = _match_rule(answers)
    exclude_recent = _recent_names(session, couple_id)
    favorites = _favorite_names(session, couple_id)
    options: list[CourseOption] = []
    cross_exclude: set[str] = set()
    for _ in range(n):
        opt = _build_one_option(answers, rule, exclude_recent, cross_exclude, favorites, extra_reason)
        if opt is None:
            break
        options.append(opt)
        for s in opt.course:
            cross_exclude.add(s.name)
    return RecommendResponse(options=options)
