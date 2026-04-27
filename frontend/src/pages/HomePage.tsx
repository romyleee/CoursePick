import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { LogCard } from '../components/LogCard';
import { useSession } from '../hooks/useSession';

export function HomePage() {
  const { session } = useSession();
  const { data: logs } = useQuery({
    queryKey: ['logs', 'recent', session?.coupleId],
    queryFn: () => api.listLogs({ couple_id: session?.coupleId ?? undefined, limit: 4 }),
    enabled: !!session,
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div>
      <header className="mb-10 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-widest text-ink-3">{dateStr}</p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink">
            안녕, {session?.nickname ?? '게스트'}
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
