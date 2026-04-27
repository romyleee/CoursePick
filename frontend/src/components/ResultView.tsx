import type { CourseOption, SessionData } from '../api';
import { CourseCard } from './CourseCard';

interface Props {
  options: CourseOption[];
  session: SessionData;
  title?: string;   // "Solo Result" / "Couple Result"
  heading?: string; // "추천 결과" / "통합 추천"
  onAccept: (option: CourseOption) => void;
  onRetry: () => void;
}

/**
 * 추천 결과 화면. options 배열을 받아 N개 카드 stack 형태로 렌더.
 */
export function ResultView({ options, title, heading, onAccept, onRetry }: Props) {
  return (
    <div>
      {title && (
        <p className="mb-2 text-[11px] uppercase tracking-widest text-ink-3">{title}</p>
      )}
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">{heading ?? '추천 결과'}</h1>

      {options.length > 1 && (
        <p className="mb-4 text-sm text-ink-3">
          마음에 드는 코스를 고르거나, 둘을 조합해도 OK 👇
        </p>
      )}

      <div className="space-y-4">
        {options.map((opt, i) => (
          <CourseCard
            key={i}
            data={opt}
            label={options.length > 1 ? `코스 ${i + 1}` : '오늘의 코스'}
            onAccept={() => onAccept(opt)}
            onRetry={i === options.length - 1 ? onRetry : undefined}
          />
        ))}
      </div>
    </div>
  );
}
