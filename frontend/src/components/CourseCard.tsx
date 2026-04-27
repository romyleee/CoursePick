import { useState } from 'react';
import type { CourseOption } from '../api';

const TYPE_EMOJI: Record<string, string> = {
  cafe: '☕', walk: '🚶', food: '🍽', activity: '🎯',
  dessert: '🍰', view: '🌃',
  bar: '🍷', culture: '🎭', shopping: '🛍',
  park: '🌳', nature: '🏞', wellness: '🧘',
};

const TYPE_LABEL: Record<string, string> = {
  cafe: 'Cafe', walk: 'Walk', food: 'Food', activity: 'Activity',
  dessert: 'Dessert', view: 'View',
  bar: 'Bar', culture: 'Culture', shopping: 'Shopping',
  park: 'Park', nature: 'Nature', wellness: 'Wellness',
};

interface Props {
  data: CourseOption;
  label?: string;
  onAccept?: () => void;
  onRetry?: () => void;
}

function buildShareText(data: CourseOption): string {
  const lines = ['오늘의 코스 — 갈래말래'];
  if (data.region) lines.push(`📍 ${data.region}`);
  lines.push('');
  data.course.forEach((c, i) => lines.push(`${i + 1}. ${c.name}`));
  return lines.join('\n');
}

export function CourseCard({ data, label, onAccept, onRetry }: Props) {
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const onCopy = async () => {
    const text = buildShareText(data);
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg('복사됨 ✓');
    } catch {
      // fallback for non-secure contexts (drag selection)
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopyMsg('복사됨 ✓');
      } catch {
        setCopyMsg('복사 실패');
      }
    }
    setTimeout(() => setCopyMsg(null), 1500);
  };

  return (
    <div>
      <div className="rounded-3xl border border-line bg-paper p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-2xl font-bold tracking-tight text-ink">{label ?? '오늘의 코스'}</h3>
          <span className="text-[11px] font-bold tracking-tight">
            <span className="text-terracotta">갈래</span><span className="text-ink">말래</span>
          </span>
        </div>
        <p className="mb-5 whitespace-pre-line text-sm leading-relaxed text-ink-3">{data.reason}</p>

        <ol className="space-y-3">
          {data.region && (
            <li className="flex items-center gap-4 rounded-2xl border border-terracotta bg-terracotta-soft p-4">
              <span className="text-2xl">📍</span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-terracotta-2">
                  Region · Today
                </div>
                <div className="truncate font-bold text-ink">오늘은 {data.region} 어때요?</div>
              </div>
            </li>
          )}
          {data.course.map((c) => (
            <li key={c.step} className="flex items-center gap-4 rounded-2xl border border-line bg-cream/50 p-4">
              <span className="text-2xl">{TYPE_EMOJI[c.type] ?? '📍'}</span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-3">
                  {TYPE_LABEL[c.type] ?? c.type} · 0{c.step}
                </div>
                <div className="truncate font-bold text-ink">{c.name}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex gap-2">
        {onAccept && (
          <button
            onClick={onAccept}
            className="flex-1 rounded-2xl bg-ink py-4 font-bold text-paper transition active:scale-[.98]"
          >
            이 코스로 갈게요
          </button>
        )}
        <button
          onClick={onCopy}
          className="rounded-2xl border border-line bg-paper px-5 py-4 font-medium text-ink-2 transition active:scale-[.98]"
        >
          {copyMsg ?? '복사'}
        </button>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-2xl border border-line bg-paper px-5 py-4 font-medium text-ink-2 transition active:scale-[.98]"
          >
            다시
          </button>
        )}
      </div>
    </div>
  );
}
