import type { RecommendResponse } from '../api';

const TYPE_EMOJI: Record<string, string> = {
  cafe: '☕', walk: '🚶', food: '🍽', activity: '🎯', dessert: '🍰', view: '🌃',
};

const TYPE_LABEL: Record<string, string> = {
  cafe: 'Cafe', walk: 'Walk', food: 'Food', activity: 'Activity', dessert: 'Dessert', view: 'View',
};

interface Props {
  data: RecommendResponse;
  onAccept?: () => void;
  onRetry?: () => void;
}

export function CourseCard({ data, onAccept, onRetry }: Props) {
  return (
    <div className="rounded-3xl border border-line bg-paper p-6">
      <h3 className="mb-1 text-2xl font-bold tracking-tight text-ink">오늘의 코스</h3>
      <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-ink-3">{data.reason}</p>

      <ol className="mb-7 space-y-3">
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

      <div className="flex gap-2">
        {onAccept && (
          <button
            onClick={onAccept}
            className="flex-1 rounded-2xl bg-ink py-4 font-bold text-paper transition active:scale-[.98]"
          >
            이 코스로 갈게요
          </button>
        )}
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
