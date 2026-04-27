import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { StarRating } from '../components/StarRating';
import { useSession } from '../hooks/useSession';

const TYPE_EMOJI: Record<string, string> = {
  cafe: '☕', walk: '🚶', food: '🍽', activity: '🎯', dessert: '🍰', view: '🌃',
};

export function LogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session } = useSession();
  const logId = Number(id);

  const { data, isLoading } = useQuery({
    queryKey: ['log', logId],
    queryFn: () => api.getLog(logId),
    enabled: !!logId,
  });

  const [aRating, setARating] = useState(0);
  const [bRating, setBRating] = useState(0);
  const [completed, setCompleted] = useState(true);

  useEffect(() => {
    if (data) {
      setARating(data.a_rating ?? 0);
      setBRating(data.b_rating ?? 0);
      setCompleted(data.completed);
    }
  }, [data]);

  const patch = useMutation({
    mutationFn: () => api.patchLog(logId, {
      a_rating: aRating || null,
      b_rating: data?.b_user_id ? (bRating || null) : null,
      completed,
    } as never),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['log', logId] });
      qc.invalidateQueries({ queryKey: ['logs'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });

  const del = useMutation({
    mutationFn: () => api.deleteLog(logId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logs'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      navigate('/timeline');
    },
  });

  if (isLoading || !data) return <div className="text-center text-sm text-ink-3">로딩...</div>;

  const isA = session?.userId === data.a_user_id;
  const isB = session?.userId === data.b_user_id;
  const isCouple = data.b_user_id != null;
  const bothFive = aRating === 5 && (!isCouple || bRating === 5) && completed;

  return (
    <div>
      <header className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="뒤로"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-lg">←</button>
        <h1 className="truncate text-xl font-bold tracking-tight text-ink">{data.place_name}</h1>
      </header>

      {data.photo_url && (
        <img src={data.photo_url} alt={data.place_name}
             className="mb-4 w-full rounded-2xl border border-line object-cover" />
      )}

      <div className="mb-4 rounded-2xl border border-line bg-paper p-5">
        <p className="text-[11px] uppercase tracking-widest text-ink-3">{data.date}</p>
        <p className="mt-2 text-sm text-ink-2">
          {isCouple ? '커플 데이트' : '솔로 데이트'} · {data.completed ? '이행 완료' : '미이행'}
        </p>
        {data.memo && <p className="mt-3 leading-relaxed text-ink">{data.memo}</p>}
      </div>

      {data.course.length > 0 && (
        <div className="mb-4 rounded-2xl border border-line bg-paper p-5">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-ink-3">코스</p>
          <ol className="space-y-2">
            {data.course.map((s) => (
              <li key={s.step} className="flex items-center gap-3 rounded-xl border border-line bg-cream/50 p-3">
                <span className="text-2xl">{TYPE_EMOJI[s.type] ?? '📍'}</span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-ink-3">Step 0{s.step}</div>
                  <div className="truncate font-bold text-ink">{s.name}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-line bg-paper p-5">
        <p className="mb-4 text-[11px] uppercase tracking-widest text-ink-3">별점 & 이행 여부</p>

        <div className={`mb-3 rounded-xl border p-4 ${isA ? 'border-terracotta bg-terracotta-soft' : 'border-line bg-cream/50'}`}>
          <div className="mb-2 text-center text-xs text-ink-3">
            A {isA && '· 나'} {!isA && '· 파트너'}
          </div>
          <StarRating value={aRating} onChange={setARating} />
        </div>

        {isCouple && (
          <div className={`mb-3 rounded-xl border p-4 ${isB ? 'border-terracotta bg-terracotta-soft' : 'border-line bg-cream/50'}`}>
            <div className="mb-2 text-center text-xs text-ink-3">
              B {isB && '· 나'} {!isB && '· 파트너'}
            </div>
            <StarRating value={bRating} onChange={setBRating} />
          </div>
        )}

        <label className="mb-3 flex items-center justify-between rounded-xl border border-line px-3 py-3">
          <span className="text-sm text-ink-2">실제 이행 여부</span>
          <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)}
                 className="h-5 w-5 accent-terracotta" />
        </label>

        <button
          onClick={() => patch.mutate()}
          disabled={patch.isPending}
          className="w-full rounded-xl bg-ink py-3 font-bold text-paper disabled:opacity-30"
        >
          {patch.isPending ? '저장 중...' : '저장'}
        </button>
        {bothFive && (
          <p className="mt-3 text-center text-xs text-terracotta-2">
            ★ 만점 + 이행 → 다음 추천 가중치 ↑
          </p>
        )}
      </div>

      <button
        onClick={() => { if (confirm('정말 삭제할까요?')) del.mutate(); }}
        className="mt-2 w-full rounded-2xl border border-line bg-paper py-3 text-sm font-medium text-terracotta active:scale-[.98]"
      >
        삭제
      </button>
    </div>
  );
}
