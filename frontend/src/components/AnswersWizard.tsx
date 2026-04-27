import { useReducer } from 'react';
import type {
  Activity, Answers, Budget, Cuisine, Mood, PlacePref, Region, State, TimeOfDay,
} from '../api';
import { EmojiButton } from './EmojiButton';

type Key = 'state' | 'mood' | 'activity' | 'budget' | 'time' | 'place' | 'cuisine' | 'region';

interface StepDef {
  key: Key;
  question: string;
  multi: boolean;
  options: Array<{ value: string; emoji: string; label: string }>;
}

const REQUIRED: StepDef[] = [
  { key: 'state', multi: false, question: '오늘 컨디션은?', options: [
    { value: 'good',   emoji: '😊', label: '좋아요' },
    { value: 'normal', emoji: '😐', label: '보통' },
    { value: 'tired',  emoji: '😵', label: '피곤' },
  ]},
  { key: 'mood', multi: false, question: '어떤 분위기?', options: [
    { value: 'calm',    emoji: '🧘', label: '차분' },
    { value: 'excited', emoji: '🎉', label: '신나게' },
    { value: 'focused', emoji: '🎯', label: '몰입' },
  ]},
  { key: 'activity', multi: false, question: '활동성은?', options: [
    { value: 'low',  emoji: '🚶', label: '여유' },
    { value: 'high', emoji: '🎡', label: '활발' },
  ]},
  { key: 'budget', multi: false, question: '예산은?', options: [
    { value: 'low',  emoji: '💸', label: '아끼게' },
    { value: 'mid',  emoji: '💳', label: '적당히' },
    { value: 'high', emoji: '💰', label: '크게' },
  ]},
];

const OPTIONAL: StepDef[] = [
  { key: 'time', multi: true, question: '시간대는? (여러 개 선택 가능)', options: [
    { value: 'brunch',    emoji: '🌅', label: '점심' },
    { value: 'afternoon', emoji: '☀️', label: '오후' },
    { value: 'evening',   emoji: '🌆', label: '저녁' },
    { value: 'night',     emoji: '🌙', label: '밤' },
  ]},
  { key: 'place', multi: false, question: '장소는?', options: [
    { value: 'indoor',  emoji: '🏠', label: '실내' },
    { value: 'outdoor', emoji: '🌳', label: '야외' },
    { value: 'any',     emoji: '🤷', label: '무관' },
  ]},
  { key: 'cuisine', multi: true, question: '음식 선호는? (여러 개 선택 가능)', options: [
    { value: 'korean',   emoji: '🍚', label: '한식' },
    { value: 'western',  emoji: '🍝', label: '양식' },
    { value: 'japanese', emoji: '🍣', label: '일식' },
    { value: 'asian',    emoji: '🍜', label: '아시안' },
  ]},
  { key: 'region', multi: true, question: '지역은? (여러 개 선택 가능)', options: [
    { value: 'gangnam',  emoji: '🏙', label: '강남' },
    { value: 'hongdae',  emoji: '🎨', label: '홍대' },
    { value: 'seongsu',  emoji: '🏭', label: '성수' },
    { value: 'itaewon',  emoji: '🌆', label: '이태원' },
    { value: 'jamsil',   emoji: '🎢', label: '잠실' },
    { value: 'jongno',   emoji: '🏯', label: '종로' },
    { value: 'hangang',  emoji: '🌊', label: '한강' },
  ]},
];

type Vals = {
  state?: State; mood?: Mood; activity?: Activity; budget?: Budget;
  time?: TimeOfDay[]; place?: PlacePref; cuisine?: Cuisine[]; region?: Region[];
};

type W = { step: number; ans: Vals };
type A =
  | { type: 'SET_SINGLE'; key: Key; value: string }
  | { type: 'TOGGLE_MULTI'; key: Key; value: string }
  | { type: 'NEXT' }
  | { type: 'PREV' };

function reducer(s: W, a: A): W {
  switch (a.type) {
    case 'SET_SINGLE':
      return { step: s.step + 1, ans: { ...s.ans, [a.key]: a.value } };
    case 'TOGGLE_MULTI': {
      const cur = ((s.ans as Record<string, string[] | undefined>)[a.key]) ?? [];
      const next = cur.includes(a.value)
        ? cur.filter(v => v !== a.value)
        : [...cur, a.value];
      return { ...s, ans: { ...s.ans, [a.key]: next } as Vals };
    }
    case 'NEXT': return { ...s, step: s.step + 1 };
    case 'PREV': return { ...s, step: Math.max(1, s.step - 1) };
  }
}

interface PartnerStatus {
  done: boolean;
  myDone: boolean;
}

interface Props {
  mode: 'quick' | 'detailed';
  onComplete: (answers: Answers) => void;
  onBack?: () => void;
  title?: string;
  partner?: PartnerStatus;
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

  const multiValues = cur.multi
    ? ((state.ans as Record<string, string[] | undefined>)[cur.key] ?? [])
    : [];

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
        cur.options.length >= 7 ? 'grid-cols-3' :
        cur.options.length >= 5 ? 'grid-cols-3' : 'grid-cols-3'
      }`}>
        {cur.options.map((opt) => {
          const selected = cur.multi
            ? multiValues.includes(opt.value)
            : (state.ans as Record<string, string>)[cur.key] === opt.value;
          return (
            <EmojiButton
              key={opt.value}
              emoji={opt.emoji}
              label={opt.label}
              selected={selected}
              onClick={() => {
                if (cur.multi) {
                  dispatch({ type: 'TOGGLE_MULTI', key: cur.key, value: opt.value });
                } else {
                  dispatch({ type: 'SET_SINGLE', key: cur.key, value: opt.value });
                }
              }}
            />
          );
        })}
      </div>

      {cur.multi && (
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => dispatch({ type: 'NEXT' })}
            className="rounded-2xl border border-line bg-paper px-5 py-3 text-sm font-medium text-ink-3"
          >
            건너뛰기
          </button>
          <button
            onClick={() => dispatch({ type: 'NEXT' })}
            disabled={multiValues.length === 0}
            className="flex-1 rounded-2xl bg-ink py-3 font-bold text-paper disabled:opacity-30"
          >
            {multiValues.length > 0 ? `다음 (${multiValues.length}개 선택)` : '하나 이상 선택'}
          </button>
        </div>
      )}
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
