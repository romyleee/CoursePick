import { useRef, useState } from 'react';
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
  const captureRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const onShare = async () => {
    if (!captureRef.current || sharing) return;
    setSharing(true);
    setShareMsg(null);
    try {
      // html-to-image 는 무거우니 사용 시점에만 동적 로드
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(captureRef.current, {
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
        cacheBust: true,
      });
      if (!blob) throw new Error('이미지 생성 실패');

      const file = new File([blob], 'course.png', { type: 'image/png' });

      // Mobile: Web Share API (카톡 / 인스타 등 네이티브 공유 시트)
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: '갈래말래 추천 코스',
            text: data.course.map(s => `${s.step}. ${s.name}`).join('\n'),
          });
          return;
        } catch (e) {
          // 사용자 취소는 조용히 무시
          if ((e as Error).name === 'AbortError') return;
          // 그 외엔 다운로드 폴백
        }
      }

      // Desktop / fallback: 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `갈래말래_${today}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setShareMsg('이미지 저장됨');
      setTimeout(() => setShareMsg(null), 2000);
    } catch (e) {
      setShareMsg((e as Error).message);
      setTimeout(() => setShareMsg(null), 3000);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div>
      <div ref={captureRef} className="rounded-3xl border border-line bg-paper p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-2xl font-bold tracking-tight text-ink">오늘의 코스</h3>
          <span className="text-[11px] font-bold tracking-tight">
            <span className="text-terracotta">갈래</span><span className="text-ink">말래</span>
          </span>
        </div>
        <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-ink-3">{data.reason}</p>

        <ol className="space-y-3">
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
          onClick={onShare}
          disabled={sharing}
          className="rounded-2xl border border-line bg-paper px-5 py-4 font-medium text-ink-2 transition active:scale-[.98] disabled:opacity-50"
        >
          {sharing ? '...' : '공유'}
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
      {shareMsg && (
        <p className="mt-2 text-center text-xs text-ink-3">{shareMsg}</p>
      )}
    </div>
  );
}
