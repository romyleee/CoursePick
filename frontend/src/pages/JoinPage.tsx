import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, type Answers, type SessionData } from '../api';
import { AnswersWizard } from '../components/AnswersWizard';
import { CourseCard } from '../components/CourseCard';
import { useSession } from '../hooks/useSession';
import { joinCoupleRoom } from '../session';

type Stage = 'enter' | 'wizard' | 'waiting' | 'done';

export function JoinPage() {
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [stage, setStage] = useState<Stage>('enter');
  const [data, setData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.get('code')) setCode(params.get('code')!.toUpperCase());
  }, [params]);

  // Polling while waiting for partner
  useEffect(() => {
    if (stage !== 'waiting' || !data) return;
    const t = setInterval(async () => {
      try {
        const fresh = await api.getSession(data.code);
        if (fresh.ready) {
          setData(fresh);
          setStage('done');
        } else {
          setData(fresh);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(t);
  }, [stage, data]);

  const onConfirmCode = async () => {
    if (!session || !code.trim()) return;
    setBusy(true); setError(null);
    try {
      const s = await api.getSession(code.trim().toUpperCase());
      if (s.mode !== 'couple') {
        setError('커플 세션이 아닙니다');
        return;
      }
      setData(s);

      // Sync couple membership locally so saved logs go to the right couple
      if (s.couple_id && session.coupleId !== s.couple_id) {
        try {
          const c = await api.getCouple(s.couple_id);
          const next = await joinCoupleRoom(c.invite_code);
          setSession(next);
        } catch { /* ignore */ }
      }

      // If I already submitted (e.g. came back to same code), or both done → result
      if (s.ready) { setStage('done'); return; }
      const isCreator = s.a_user_id === session.userId;
      if ((isCreator && s.a_done) || (!isCreator && s.b_done)) {
        setStage('waiting');
      } else {
        setStage('wizard');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitAnswers = async (answers: Answers) => {
    if (!session || !data) return;
    setBusy(true); setError(null);
    try {
      const fresh = await api.submitAnswer(data.code, {
        user_id: session.userId, answers,
      });
      setData(fresh);
      setStage(fresh.ready ? 'done' : 'waiting');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (busy) return <div className="rounded-3xl border border-line bg-paper p-10 text-center text-sm text-ink-3">처리 중...</div>;

  if (stage === 'done' && data?.result) {
    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">Couple Result</p>
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">통합 추천</h1>
        <CourseCard
          data={data.result}
          onAccept={() => navigate('/logs/new', { state: { session: data } })}
          onRetry={() => navigate('/')}
        />
      </div>
    );
  }

  if (stage === 'waiting' && data) {
    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">Waiting</p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-ink">파트너 답변 대기</h1>
        <p className="mb-8 text-sm text-ink-3">
          내 답변은 완료됐어요. 파트너가 답하면 결과가 자동으로 떠요.
        </p>
        <div className="rounded-3xl border border-line bg-paper p-6 text-center">
          <p className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">방 코드</p>
          <div className="font-mono text-2xl font-bold tracking-[0.25em] text-terracotta">{data.code}</div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" />
            <span>A {data.a_done ? '✓' : '...'} &nbsp;·&nbsp; B {data.b_done ? '✓' : '...'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'wizard') return <AnswersWizard onComplete={submitAnswers} title={`Code ${code}`} />;

  // enter (default)
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
      {error && <div className="mt-3 rounded-xl border border-danger bg-danger-soft p-3 text-sm text-danger-2">{error}</div>}
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
