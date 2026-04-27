import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, type Answers, type SessionData } from '../api';
import { AnswersWizard } from '../components/AnswersWizard';
import { CourseCard } from '../components/CourseCard';
import { useSession } from '../hooks/useSession';
import { joinCoupleRoom } from '../session';

export function JoinPage() {
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [stage, setStage] = useState<'enter' | 'wizard' | 'result'>('enter');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.get('code')) setCode(params.get('code')!.toUpperCase());
  }, [params]);

  const onConfirmCode = async () => {
    if (!session || !code.trim()) return;
    setBusy(true); setError(null);
    try {
      const s = await api.getSession(code.trim().toUpperCase());
      if (s.mode !== 'couple') { setError('커플 세션이 아닙니다'); return; }
      if (s.ready) { setSessionData(s); setStage('result'); }
      else setStage('wizard');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const submitAnswers = async (answers: Answers) => {
    if (!session) return;
    setBusy(true); setError(null);
    try {
      const s = await api.joinSession(code.trim().toUpperCase(), {
        user_id: session.userId, answers,
      });
      if (s.couple_id && session.coupleId !== s.couple_id) {
        try {
          const c = await api.getCouple(s.couple_id);
          const next = await joinCoupleRoom(c.invite_code);
          setSession(next);
        } catch { /* ignore */ }
      }
      setSessionData(s);
      setStage('result');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  if (busy) return <div className="rounded-3xl border border-line bg-paper p-10 text-center text-sm text-ink-3">처리 중...</div>;

  if (stage === 'result' && sessionData?.result) {
    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">Couple Result</p>
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">통합 추천</h1>
        <CourseCard
          data={sessionData.result}
          onAccept={() => navigate('/logs/new', { state: { session: sessionData } })}
          onRetry={() => navigate('/')}
        />
      </div>
    );
  }

  if (stage === 'wizard') return <AnswersWizard onComplete={submitAnswers} title={`Code ${code}`} />;

  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">Join</p>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink">코드로 참가</h1>
      <p className="mb-8 text-sm text-ink-3">파트너에게 받은 6자리 코드를 입력하세요.</p>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={6}
        placeholder="ABC123"
        className="w-full rounded-2xl border border-line bg-paper px-4 py-5 text-center font-mono text-3xl font-bold tracking-[0.25em] text-ink outline-none focus:border-terracotta"
      />
      {error && <div className="mt-3 rounded-xl bg-terracotta-soft p-3 text-sm text-terracotta-2">{error}</div>}
      <button
        onClick={onConfirmCode}
        disabled={code.length < 4}
        className="mt-4 w-full rounded-2xl bg-ink py-4 font-bold text-paper disabled:opacity-30 active:scale-[.98]"
      >
        다음
      </button>
    </div>
  );
}
