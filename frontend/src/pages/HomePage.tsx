import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { LogCard } from '../components/LogCard';
import { useSession } from '../hooks/useSession';

const TYPE_CHIPS = [
  { emoji: '☕', label: '카페' },
  { emoji: '🍽', label: '식사' },
  { emoji: '🚶', label: '산책' },
  { emoji: '🎯', label: '액티비티' },
  { emoji: '🍰', label: '디저트' },
  { emoji: '🌃', label: '뷰' },
  { emoji: '🍷', label: '바' },
  { emoji: '🎭', label: '공연' },
  { emoji: '🛍', label: '쇼핑' },
  { emoji: '🌳', label: '공원' },
  { emoji: '🏞', label: '자연' },
  { emoji: '🧘', label: '웰니스' },
];

const GUIDE_KEY = 'coursepick.guide.dismissed';

export function HomePage() {
  const { session } = useSession();
  const { data: logs } = useQuery({
    queryKey: ['logs', 'recent', session?.coupleId],
    queryFn: () => api.listLogs({ couple_id: session?.coupleId ?? undefined, limit: 4 }),
    enabled: !!session,
  });

  const [showGuide, setShowGuide] = useState(
    () => localStorage.getItem(GUIDE_KEY) !== 'true',
  );
  const dismissGuide = () => {
    localStorage.setItem(GUIDE_KEY, 'true');
    setShowGuide(false);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div>
      <header className="mb-10 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-widest text-ink-3">{dateStr}</p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink">
            {session
              ? <>안녕, 게스트 {session.userId}</>
              : <span className="text-ink-3">안녕, 게스트 ...</span>}
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            {session?.coupleId ? '커플 모드' : '솔로 모드'}
          </p>
        </div>
        <Link
          to="/settings"
          aria-label="설정"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-lg"
        >
          ⚙
        </Link>
      </header>

      {/* 사용 안내 (첫 방문자용 — 닫기 가능) */}
      {showGuide && (
        <section className="relative mb-6 rounded-3xl border border-line bg-paper p-5">
          <button
            onClick={dismissGuide}
            aria-label="안내 닫기"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-3 hover:bg-cream"
          >
            ✕
          </button>
          <p className="mb-2 text-[11px] uppercase tracking-widest text-terracotta">처음이신가요?</p>
          <h2 className="mb-2 text-base font-bold tracking-tight text-ink">
            질문 4-7개 → 오늘 코스 2가지
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-ink-3">
            컨디션·분위기·예산 등을 답하면, <b className="text-ink">12가지 카테고리</b>에서
            조합해서 오늘 딱 맞는 코스 두 개를 보여드려요. 마음에 드는 거 골라요.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_CHIPS.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-cream/50 px-2.5 py-1 text-xs text-ink-2"
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Primary CTA */}
      <section className="mb-3">
        <Link
          to="/recommend/solo"
          className="group block rounded-3xl border border-line bg-paper p-6 transition active:scale-[.99]"
        >
          <p className="text-[11px] uppercase tracking-widest text-ink-3">Solo</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-ink">혼자 코스 추천받기</p>
          <p className="mt-1 text-sm text-ink-3">4단계 질문 → 즉시 결과</p>
        </Link>
      </section>

      <section className="mb-3">
        <Link
          to="/recommend/couple"
          className="block rounded-3xl bg-ink p-6 transition active:scale-[.99]"
        >
          <p className="text-[11px] uppercase tracking-widest text-cream/70">Couple</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-paper">둘이 같이 추천받기</p>
          <p className="mt-1 text-sm text-cream/70">방 만들고 코드 공유 → 통합 결과</p>
        </Link>
      </section>

      <section className="mb-12">
        <Link
          to="/join"
          className="block rounded-2xl border border-line bg-cream/50 p-4 text-center text-sm font-medium text-ink-2"
        >
          코드로 참가하기 →
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold tracking-tight text-ink">최근 데이트</h2>
          <Link to="/timeline" className="text-xs font-medium text-ink-3">전체 보기</Link>
        </div>
        {logs && logs.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {logs.map((l) => <LogCard key={l.id} log={l} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-paper p-8 text-center text-sm text-ink-3">
            아직 기록이 없어요.<br/>첫 데이트를 추천받아볼까요?
          </div>
        )}
      </section>
    </div>
  );
}
