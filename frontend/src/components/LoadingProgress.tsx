import { useEffect, useState } from 'react';

export interface LoadingStage {
  label: string;
  done: boolean;
}

interface Props {
  title: string;
  stages: LoadingStage[];
  hint?: string;
  /** 5초 넘게 걸리면 추가로 표시할 힌트 */
  slowHint?: string;
}

/**
 * 단계별 체크 + 부드럽게 진행되는 가짜 % 바.
 * 실제 진행률은 측정 불가하지만 UX 적으로 진행감을 줌.
 *
 * 동작:
 *  - 각 stage가 done 표시될 때마다 목표 % 가 올라감
 *  - 마지막 stage 완료 전까지 95% 까지만 점진적으로 증가
 *  - 모든 stage 완료 시 100% 로 점프
 */
export function LoadingProgress({ title, stages, hint, slowHint }: Props) {
  const [pct, setPct] = useState(8);
  const [slow, setSlow] = useState(false);

  // 5초 넘으면 slow hint 표시
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // 진행도 계산
  useEffect(() => {
    const total = stages.length;
    const doneCount = stages.filter(s => s.done).length;
    const allDone = doneCount === total;

    if (allDone) {
      setPct(100);
      return;
    }

    // 단계당 목표 % (마지막은 항상 95% 이하)
    const target = Math.min(95, 15 + (doneCount / total) * 75);

    const t = setInterval(() => {
      setPct(p => {
        if (Math.abs(target - p) < 0.3) return target;
        // 부드럽게 수렴 (가까울수록 천천히)
        const delta = (target - p) * 0.08;
        return p + delta;
      });
    }, 60);
    return () => clearInterval(t);
  }, [stages]);

  return (
    <div className="rounded-3xl border border-line bg-paper p-7">
      <h2 className="mb-5 text-lg font-bold tracking-tight text-ink">{title}</h2>

      <ul className="mb-6 space-y-2.5">
        {stages.map((s, i) => {
          const prevDone = stages.slice(0, i).every(x => x.done);
          const active = !s.done && prevDone;
          return (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  s.done
                    ? 'bg-terracotta text-paper'
                    : active
                    ? 'border-2 border-terracotta text-terracotta'
                    : 'border border-line text-ink-3'
                }`}
              >
                {s.done ? '✓' : active ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" /> : ''}
              </span>
              <span
                className={`${
                  s.done ? 'text-ink' : active ? 'font-medium text-ink' : 'text-ink-3'
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-terracotta transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs tabular-nums text-ink-3">{Math.round(pct)}%</p>

      {hint && <p className="mt-4 text-center text-xs text-ink-3">{hint}</p>}
      {slow && slowHint && <p className="mt-2 text-center text-xs text-danger-2/70">{slowHint}</p>}
    </div>
  );
}
