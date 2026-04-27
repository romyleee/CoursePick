import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Answers, type SessionData } from '../api';
import { AnswersWizard } from '../components/AnswersWizard';
import { CourseCard } from '../components/CourseCard';
import { useSession } from '../hooks/useSession';
import { createCoupleRoom } from '../session';

export function RecommendCouplePage() {
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  const [data, setData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!data || data.ready) return;
    const t = setInterval(async () => {
      try {
        const fresh = await api.getSession(data.code);
        if (fresh.ready) setData(fresh);
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(t);
  }, [data]);

  const submit = async (answers: Answers) => {
    if (!session) return;
    setBusy(true); setError(null);
    try {
      let s = session;
      if (!s.coupleId) { s = await createCoupleRoom(); setSession(s); }
      const created = await api.createSession({
        mode: 'couple', user_id: s.userId, couple_id: s.coupleId, answers,
      });
      setData(created);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, kind: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* ignore */ }
  };

  if (busy) return <div className="rounded-3xl border border-line bg-paper p-10 text-center text-sm text-ink-3">방 만드는 중...</div>;
  if (error) return (
    <div className="rounded-3xl border border-danger bg-danger-soft p-6">
      <p className="text-sm font-bold text-danger-2">오류</p>
      <p className="mt-1 text-sm text-danger-2">{error}</p>
    </div>
  );

  if (data?.ready && data.result) {
    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">Couple Result</p>
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">통합 추천</h1>
        <CourseCard
          data={data.result}
          onAccept={() => navigate('/logs/new', { state: { session: data } })}
          onRetry={() => setData(null)}
        />
      </div>
    );
  }

  if (data && !data.ready) {
    const shareUrl = `${window.location.origin}/join?code=${data.code}`;
    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">Waiting</p>
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-ink">파트너 대기 중</h1>

        <div className="rounded-3xl border border-line bg-paper p-8 text-center">
          <p className="mb-4 text-sm text-ink-3">아래 코드를 파트너에게 공유하세요</p>
          <div className="my-4 select-all rounded-2xl border border-line bg-cream py-7 font-mono text-5xl font-bold tracking-[0.3em] text-terracotta">
            {data.code}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button onClick={() => copy(data.code, 'code')}
                    className="rounded-xl border border-line py-3 text-sm font-medium text-ink-2">
              {copied === 'code' ? '복사됨 ✓' : '코드 복사'}
            </button>
            <button onClick={() => copy(shareUrl, 'url')}
                    className="rounded-xl border border-line py-3 text-sm font-medium text-ink-2">
              {copied === 'url' ? '복사됨 ✓' : '링크 복사'}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-ink-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" />
            파트너가 답하면 자동으로 결과가 떠요
          </div>
        </div>
      </div>
    );
  }

  return <AnswersWizard onComplete={submit} title="Couple" />;
}
