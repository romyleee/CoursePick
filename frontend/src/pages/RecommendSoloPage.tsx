import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Answers, type SessionData } from '../api';
import { AnswersWizard } from '../components/AnswersWizard';
import { CourseCard } from '../components/CourseCard';
import { LoadingProgress } from '../components/LoadingProgress';
import { ModeChoice } from '../components/ModeChoice';
import { useSession } from '../hooks/useSession';

type Stage = 'choice' | 'wizard' | 'busy' | 'result' | 'error';

export function RecommendSoloPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('choice');
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [data, setData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitDone, setSubmitDone] = useState(false);

  const submit = async (answers: Answers) => {
    if (!session) return;
    setSubmitDone(false);
    setStage('busy');
    try {
      const s = await api.createSession({
        mode: 'solo', user_id: session.userId,
        couple_id: session.coupleId ?? undefined,
        answers,
      });
      setData(s);
      setSubmitDone(true);
      setTimeout(() => setStage('result'), 350);
    } catch (e) {
      setError((e as Error).message);
      setStage('error');
    }
  };

  if (stage === 'busy') {
    return (
      <LoadingProgress
        title="코스 만드는 중"
        stages={[
          { label: '취향 분석', done: submitDone },
          { label: '코스 매칭', done: submitDone },
        ]}
        hint="잠시만 기다려주세요"
        slowHint="네트워크가 느려요. 백엔드/터널 상태를 확인해주세요."
      />
    );
  }

  if (stage === 'error') {
    return (
      <div className="rounded-3xl border border-danger bg-danger-soft p-6">
        <p className="text-sm font-bold text-danger-2">오류</p>
        <p className="mt-1 text-sm text-danger-2">{error}</p>
        <p className="mt-3 text-xs text-danger-2/70">백엔드 서버가 켜져 있는지 확인해주세요.</p>
      </div>
    );
  }

  if (stage === 'result' && data?.result) {
    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">Solo Result</p>
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">추천 결과</h1>
        <CourseCard
          data={data.result}
          onAccept={() => navigate('/logs/new', { state: { session: data } })}
          onRetry={() => setStage('choice')}
        />
      </div>
    );
  }

  if (stage === 'wizard') {
    return (
      <AnswersWizard
        mode={mode}
        title="Solo"
        onComplete={submit}
        onBack={() => setStage('choice')}
      />
    );
  }

  return (
    <ModeChoice
      title="Solo"
      onChoose={(m) => { setMode(m); setStage('wizard'); }}
      onBack={() => navigate(-1)}
    />
  );
}
