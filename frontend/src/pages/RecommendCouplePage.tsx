import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Answers, type SessionData } from '../api';
import { AnswersWizard } from '../components/AnswersWizard';
import { CourseCard } from '../components/CourseCard';
import { useSession } from '../hooks/useSession';
import { createCoupleRoom } from '../session';

type Stage = 'creating' | 'lobby' | 'wizard' | 'waiting' | 'done';

export function RecommendCouplePage() {
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('creating');
  const [data, setData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // 1) On mount: ensure couple room → create empty couple session (lobby)
  useEffect(() => {
    if (!session || stage !== 'creating') return;
    let cancelled = false;
    (async () => {
      try {
        let s = session;
        if (!s.coupleId) { s = await createCoupleRoom(); setSession(s); }
        const created = await api.createSession({
          mode: 'couple', user_id: s.userId, couple_id: s.coupleId,
        });
        if (!cancelled) {
          setData(created);
          setStage('lobby');
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [session, stage, setSession]);

  // 2) Polling: in waiting state, check if both done → result
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

  const submit = async (answers: Answers) => {
    if (!session || !data) return;
    try {
      const fresh = await api.submitAnswer(data.code, {
        user_id: session.userId, answers,
      });
      setData(fresh);
      setStage(fresh.ready ? 'done' : 'waiting');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const copy = async (text: string, kind: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* ignore */ }
  };

  if (error) return (
    <div className="rounded-3xl border border-danger bg-danger-soft p-6">
      <p className="text-sm font-bold text-danger-2">오류</p>
      <p className="mt-1 text-sm text-danger-2">{error}</p>
    </div>
  );

  if (stage === 'creating' || !data) {
    return (
      <div className="rounded-3xl border border-line bg-paper p-10 text-center">
        <div className="mx-auto mb-3 h-2 w-2 animate-pulse rounded-full bg-terracotta" />
        <p className="text-sm text-ink-3">방 만드는 중...</p>
      </div>
    );
  }

  if (stage === 'done' && data.result) {
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

  if (stage === 'waiting') {
    const shareUrl = `${window.location.origin}/join?code=${data.code}`;
    const partnerStatus = data.b_done ? 'A 답변 대기' : '파트너 답변 대기';
    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">Waiting</p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-ink">{partnerStatus}</h1>
        <p className="mb-8 text-sm text-ink-3">
          내 답변은 완료됐어요. 파트너가 답하면 결과가 자동으로 떠요.
        </p>

        <div className="rounded-3xl border border-line bg-paper p-6 text-center">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-ink-3">방 코드</p>
          <div className="my-2 select-all rounded-2xl border border-line bg-cream py-5 font-mono text-4xl font-bold tracking-[0.3em] text-terracotta">
            {data.code}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => copy(data.code, 'code')}
                    className="rounded-xl border border-line py-3 text-sm font-medium text-ink-2">
              {copied === 'code' ? '복사됨 ✓' : '코드 복사'}
            </button>
            <button onClick={() => copy(shareUrl, 'url')}
                    className="rounded-xl border border-line py-3 text-sm font-medium text-ink-2">
              {copied === 'url' ? '복사됨 ✓' : '링크 복사'}
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" />
            <span>나 ✓ &nbsp;·&nbsp; 파트너 {data.b_done ? '✓' : '...'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'lobby') {
    const shareUrl = `${window.location.origin}/join?code=${data.code}`;
    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">Couple Room</p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-ink">방이 만들어졌어요</h1>
        <p className="mb-8 text-sm text-ink-3">
          파트너에게 코드 또는 링크를 공유한 뒤 내 답변을 시작하세요.<br/>
          (둘 다 답을 마치면 통합 결과가 떠요)
        </p>

        <div className="mb-4 rounded-3xl border border-line bg-paper p-6 text-center">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-ink-3">방 코드</p>
          <div className="my-2 select-all rounded-2xl border border-line bg-cream py-5 font-mono text-4xl font-bold tracking-[0.3em] text-terracotta">
            {data.code}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => copy(data.code, 'code')}
                    className="rounded-xl border border-line py-3 text-sm font-medium text-ink-2">
              {copied === 'code' ? '복사됨 ✓' : '코드 복사'}
            </button>
            <button onClick={() => copy(shareUrl, 'url')}
                    className="rounded-xl border border-line py-3 text-sm font-medium text-ink-2">
              {copied === 'url' ? '복사됨 ✓' : '링크 복사'}
            </button>
          </div>
        </div>

        <button
          onClick={() => setStage('wizard')}
          className="w-full rounded-2xl bg-ink py-4 font-bold text-paper transition active:scale-[.98]"
        >
          내 답변 시작하기 →
        </button>
      </div>
    );
  }

  // wizard
  return <AnswersWizard onComplete={submit} title="Couple" />;
}
