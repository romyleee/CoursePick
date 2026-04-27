import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, type Answers, type SessionData } from '../api';
import { AnswersWizard } from '../components/AnswersWizard';
import { CourseCard } from '../components/CourseCard';
import { ModeChoice } from '../components/ModeChoice';
import { useSession } from '../hooks/useSession';
import { commitCouple, transientJoinCouple } from '../session';

type Stage = 'enter' | 'choice' | 'wizard' | 'waiting' | 'done';

interface TransientCouple { id: number; code: string; }

export function JoinPage() {
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [stage, setStage] = useState<Stage>('enter');
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [data, setData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tcouple, setTcouple] = useState<TransientCouple | null>(null);

  useEffect(() => {
    if (params.get('code')) setCode(params.get('code')!.toUpperCase());
  }, [params]);

  // 폴링
  useEffect(() => {
    if (!data || (stage !== 'wizard' && stage !== 'waiting')) return;
    const interval = stage === 'waiting' ? 2000 : 4000;
    const t = setInterval(async () => {
      try {
        const fresh = await api.getSession(data.code);
        setData(fresh);
        if (fresh.ready && stage === 'waiting') setStage('done');
      } catch { /* ignore */ }
    }, interval);
    return () => clearInterval(t);
  }, [stage, data]);

  // 결과 시점에 commit (커플 모드 확정)
  useEffect(() => {
    if (stage !== 'done' || !tcouple || !session) return;
    if (session.coupleId === tcouple.id) return;
    const next = commitCouple(tcouple.id, tcouple.code);
    if (next) setSession(next);
  }, [stage, tcouple, session, setSession]);

  const onConfirmCode = async () => {
    if (!session || !code.trim()) return;
    setBusy(true); setError(null);
    try {
      const upper = code.trim().toUpperCase();
      const s = await api.getSession(upper);
      if (s.mode !== 'couple') { setError('커플 세션이 아닙니다'); return; }
      setData(s);

      // 백엔드에는 join 시키되 (B 자리 잡기 위해) localStorage 는 건드리지 않음
      if (s.couple_id) {
        try {
          const c = await api.getCouple(s.couple_id);
          await transientJoinCouple(c.invite_code, session.userId);
          setTcouple({ id: c.id, code: c.invite_code });
        } catch { /* ignore: 이미 join 됐거나 충돌 */ }
      }

      if (s.ready) { setStage('done'); return; }
      const isCreator = s.a_user_id === session.userId;
      if ((isCreator && s.a_done) || (!isCreator && s.b_done)) {
        setStage('waiting');
      } else {
        setStage('choice');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (answers: Answers) => {
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
    const isCreator = data.a_user_id === session?.userId;
    const myDone = isCreator ? data.a_done : data.b_done;
    const partnerDone = isCreator ? data.b_done : data.a_done;
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
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <Status label="나" done={myDone} />
            <span className="text-ink-3">·</span>
            <Status label="파트너" done={partnerDone} />
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'choice' && data) {
    return (
      <ModeChoice
        title={`Code ${code}`}
        onChoose={(m) => { setMode(m); setStage('wizard'); }}
        onBack={() => setStage('enter')}
      />
    );
  }

  if (stage === 'wizard' && data) {
    const isCreator = data.a_user_id === session?.userId;
    const partnerDone = isCreator ? data.b_done : data.a_done;
    return (
      <AnswersWizard
        mode={mode}
        title={`Code ${code}`}
        onComplete={submit}
        onBack={() => setStage('choice')}
        partner={{ done: partnerDone, myDone: false }}
      />
    );
  }

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

function Status({ label, done }: { label: string; done: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${done ? 'text-terracotta font-semibold' : 'text-ink-3'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-terracotta' : 'bg-ink-3 animate-pulse'}`} />
      {label} {done ? '✓' : '...'}
    </span>
  );
}
