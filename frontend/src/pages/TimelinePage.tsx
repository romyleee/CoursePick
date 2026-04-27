import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { LogCard } from '../components/LogCard';
import { useSession } from '../hooks/useSession';

export function TimelinePage() {
  const { session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ['timeline', session?.coupleId],
    queryFn: () => api.getTimeline(session?.coupleId ?? undefined),
    enabled: !!session,
  });

  return (
    <div>
      <header className="mb-8">
        <p className="mb-1 text-[11px] uppercase tracking-widest text-ink-3">Timeline</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink">우리의 데이트</h1>
      </header>

      {isLoading && <div className="text-center text-sm text-ink-3">로딩...</div>}

      {data && data.length === 0 && (
        <div className="rounded-2xl border border-line bg-paper p-8 text-center text-sm text-ink-3">
          아직 기록이 없어요.
        </div>
      )}

      <div className="space-y-8">
        {data?.map((g) => (
          <section key={`${g.year}-${g.month}`}>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-3">
              {g.year} · {String(g.month).padStart(2, '0')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {g.logs.map((l) => <LogCard key={l.id} log={l} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
