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

type W = { step: number; ans: Vals; detailed: boolean };
type A =
  | { type: 'SET'; key: Key; value: string }
  | { type: 'PREV' }
  | { type: 'GO_DETAILED' };

function reducer(s: W, a: A): W {
  switch (a.type) {
    case 'SET': return { ...s, step: s.step + 1, ans: { ...s.ans, [a.key]: a.value } };
    case 'PREV': return { ...s, step: Math.max(1, s.step - 1) };
    case 'GO_DETAILED': return { ...s, detailed: true, step: REQUIRED.length + 1 };
  }
}

interface Props {
  onComplete: (answers: Answers) => void;
  title?: string;
}

export function AnswersWizard({ onComplete, title }: Props) {
  const [state, dispatch] = useReducer(reducer, { step: 1, ans: {}, detailed: false });

  const required = REQUIRED.length;
  const totalIfDetailed = REQUIRED.length + OPTIONAL.length;
  const total = state.detailed ? totalIfDetailed : required;

  // After required, show transition gate (unless user already chose detailed)
  if (state.step === required + 1 && !state.detailed) {
    return (
      <Gate
        onSimple={() => onComplete(state.ans as Answers)}
        onDetail={() => dispatch({ type: 'GO_DETAILED' })}
        onPrev={() => dispatch({ type: 'PREV' })}
      />
    );
  }

  if (state.step > total) {
    onComplete(state.ans as Answers);
    return null;
  }

  const all = [...REQUIRED, ...OPTIONAL];
  const cur = all[state.step - 1];
  const progress = ((state.step - 1) / total) * 100;
  const isOptional = state.step > required;

  return (
    <div>
      <header className="mb-2 flex items-center justify-between">
        <button
          onClick={() => dispatch({ type: 'PREV' })}
          disabled={state.step === 1}
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

      <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full bg-terracotta transition-all" style={{ width: `${progress}%` }} />
      </div>

      <h1 className="mb-2 text-3xl font-bold leading-tight tracking-tight text-ink">
        {cur.question}
      </h1>
      {isOptional && (
        <p className="mb-8 text-sm text-ink-3">선택 사항 — 무관/건너뛰어도 OK</p>
      )}
      {!isOptional && <div className="mb-8" />}

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

function Gate({
  onSimple, onDetail, onPrev,
}: { onSimple: () => void; onDetail: () => void; onPrev: () => void }) {
  return (
    <div>
      <header className="mb-2 flex items-center justify-between">
        <button onClick={onPrev} aria-label="이전"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-lg text-ink-2">
          ←
        </button>
        <span className="text-[11px] uppercase tracking-widest text-ink-3">기본 정보 완료</span>
        <span className="w-10" />
      </header>

      <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full bg-terracotta" style={{ width: '57%' }} />
      </div>

      <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-ink">
        더 자세히 추천받을까요?
      </h1>
      <p className="mb-10 text-sm leading-relaxed text-ink-3">
        시간대·장소·음식 선호를 알려주시면 더 정확하게 추천해드려요.<br/>
        (3단계, 모두 무관/건너뛰기 가능)
      </p>

      <div className="space-y-3">
        <button
          onClick={onDetail}
          className="block w-full rounded-3xl border border-line bg-paper p-6 text-left transition active:scale-[.99]"
        >
          <p className="text-[11px] uppercase tracking-widest text-ink-3">Detailed</p>
          <p className="mt-1 text-lg font-bold tracking-tight text-ink">3개 더 답하기</p>
          <p className="mt-1 text-sm text-ink-3">시간대 · 장소 · 음식 선호</p>
        </button>
        <button
          onClick={onSimple}
          className="block w-full rounded-3xl bg-ink p-6 text-left transition active:scale-[.99]"
        >
          <p className="text-[11px] uppercase tracking-widest text-cream/70">Quick</p>
          <p className="mt-1 text-lg font-bold tracking-tight text-paper">바로 추천받기</p>
          <p className="mt-1 text-sm text-cream/70">현재 답변으로 즉시 결과</p>
        </button>
      </div>
    </div>
  );
}
