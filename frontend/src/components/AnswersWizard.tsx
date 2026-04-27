import { useReducer } from 'react';
import type {
  Activity, Answers, Budget, Cuisine, Mood, PlacePref, State, TimeOfDay,
} from '../api';
import { EmojiButton } from './EmojiButton';

type Key = 'state' | 'mood' | 'activity' | 'budget' | 'time' | 'place' | 'cuisine';

const REQUIRED: Array<{
  key: Key;
  question: string;
  options: Array<{ value: string; emoji: string; label: string }>;
}> = [
  { key: 'state', question: '오늘 컨디션은?', options: [
    { value: 'good',   emoji: '😊', label: '좋아요' },
    { value: 'normal', emoji: '😐', label: '보통' },
    { value: 'tired',  emoji: '😵', label: '피곤' },
  ]},
  { key: 'mood', question: '어떤 분위기?', options: [
    { value: 'calm',    emoji: '🧘', label: '차분' },
    { value: 'excited', emoji: '🎉', label: '신나게' },
    { value: 'focused', emoji: '🎯', label: '몰입' },
  ]},
  { key: 'activity', question: '활동성은?', options: [
    { value: 'low',  emoji: '🚶', label: '여유' },
    { value: 'high', emoji: '🎡', label: '활발' },
  ]},
  { key: 'budget', question: '예산은?', options: [
    { value: 'low',  emoji: '💸', label: '아끼게' },
    { value: 'mid',  emoji: '💳', label: '적당히' },
    { value: 'high', emoji: '💰', label: '크게' },
  ]},
];

const OPTIONAL: typeof REQUIRED = [
  { key: 'time', question: '시간대는?', options: [
    { value: 'brunch',    emoji: '🌅', label: '점심' },
    { value: 'afternoon', emoji: '☀️', label: '오후' },
    { value: 'evening',   emoji: '🌆', label: '저녁' },
    { value: 'night',     emoji: '🌙', label: '밤' },
  ]},
  { key: 'place', question: '장소는?', options: [
    { value: 'indoor',  emoji: '🏠', label: '실내' },
    { value: 'outdoor', emoji: '🌳', label: '야외' },
    { value: 'any',     emoji: '🤷', label: '무관' },
  ]},
  { key: 'cuisine', question: '음식 선호는?', options: [
    { value: 'korean',   emoji: '🍚', label: '한식' },
    { value: 'western',  emoji: '🍝', label: '양식' },
    { value: 'japanese', emoji: '🍣', label: '일식' },
    { value: 'asian',    emoji: '🍜', label: '아시안' },
    { value: 'any',      emoji: '🤷', label: '무관' },
  ]},
];

type Vals = {
  state?: State; mood?: Mood; activity?: Activity; budget?: Budget;
  time?: TimeOfDay; place?: PlacePref; cuisine?: Cuisine;
};

type W = { step: number; ans: Vals };
type A =
  | { type: 'SET'; key: Key; value: string }
  | { type: 'PREV' };

function reducer(s: W, a: A): W {
  switch (a.type) {
    case 'SET': return { step: s.step + 1, ans: { ...s.ans, [a.key]: a.value } };
    case 'PREV': return { step: Math.max(1, s.step - 1), ans: s.ans };
  }
}

interface PartnerStatus {
  done: boolean;
  myDone: boolean;
}

interface Props {
  mode: 'quick' | 'detailed';
  onComplete: (answers: Answers) => void;
  onBack?: () => void;       // 모드 선택으로 되돌아가기
  title?: string;
  partner?: PartnerStatus;   // 커플 모드일 때 파트너 진행 상태
}

export function AnswersWizard({ mode, onComplete, onBack, title, partner }: Props) {
  const [state, dispatch] = useReducer(reducer, { step: 1, ans: {} });

  const all = mode === 'detailed' ? [...REQUIRED, ...OPTIONAL] : REQUIRED;
  const total = all.length;

  if (state.step > total) {
    onComplete(state.ans as Answers);
    return null;
  }

  const cur = all[state.step - 1];
  const progress = ((state.step - 1) / total) * 100;
  const handlePrev = state.step === 1 ? onBack : () => dispatch({ type: 'PREV' });

  return (
    <div>
      <header className="mb-2 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={!handlePrev}
          aria-label="이전"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-lg text-ink-2 disabled:opacity-30"
        >
          ←
        </button>
        <span className="text-[11px] uppercase tracking-widest text-ink-3">
          {title ?? 'Step'} · {state.step} / {total}
        </span>
        <span className="w-10" />
      </header>

      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full bg-terracotta transition-all" style={{ width: `${progress}%` }} />
      </div>

      {partner && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-3 text-xs">
          <span className="text-ink-3">함께 답변 중</span>
          <span className="flex items-center gap-2 font-medium">
            <Indicator label="나" done={partner.myDone} active />
            <span className="text-ink-3">·</span>
            <Indicator label="파트너" done={partner.done} active={false} />
          </span>
        </div>
      )}

      <h1 className="mb-8 text-3xl font-bold leading-tight tracking-tight text-ink">
        {cur.question}
      </h1>

      <div className={`grid gap-3 ${
        cur.options.length === 2 ? 'grid-cols-2' :
        cur.options.length >= 5 ? 'grid-cols-3' : 'grid-cols-3'
      }`}>
        {cur.options.map((opt) => (
          <EmojiButton
            key={opt.value}
            emoji={opt.emoji}
            label={opt.label}
            selected={(state.ans as Record<string, string>)[cur.key] === opt.value}
            onClick={() => dispatch({ type: 'SET', key: cur.key, value: opt.value })}
          />
        ))}
      </div>
    </div>
  );
}

function Indicator({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 ${done ? 'text-terracotta' : active ? 'text-ink' : 'text-ink-3'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-terracotta' : 'bg-ink-3 animate-pulse'}`} />
      {label} {done ? '✓' : ''}
    </span>
  );
}
