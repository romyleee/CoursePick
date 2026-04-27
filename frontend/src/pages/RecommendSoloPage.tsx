import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Answers, type SessionData } from '../api';
import { AnswersWizard } from '../components/AnswersWizard';
import { CourseCard } from '../components/CourseCard';
import { useSession } from '../hooks/useSession';

export function RecommendSoloPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [data, setData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (answers: Answers) => {
    if (!session) return;
    setBusy(true); setError(null);
    try {
      const s = await api.createSession({
        mode: 'solo', user_id: session.userId,
        couple_id: session.coupleId ?? undefined,
        answers,
      });
      setData(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <div className="rounded-3xl border border-line bg-paper p-10 text-center">
        <div className="mx-auto mb-3 h-2 w-2 animate-pulse rounded-full bg-terracotta" />
        <p className="text-sm text-ink-3">코스 만드는 중...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-3xl border border-line bg-paper p-6">
        <p className="text-sm font-bold text-terracotta">오류</p>
        <p className="mt-1 text-sm text-ink-2">{error}</p>
        <p className="mt-3 text-xs text-ink-3">백엔드 서버가 켜져 있는지 확인해주세요. (port 8000)</p>
      </div>
    );
  }
  if (data?.result) {
    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">Solo Result</p>
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">추천 결과</h1>
        <CourseCard
          data={data.result}
          onAccept={() => navigate('/logs/new', { state: { session: data } })}
          onRetry={() => setData(null)}
        />
      </div>
    );
  }
  return <AnswersWizard onComplete={submit} title="Solo" />;
}
