import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, type SessionData } from '../api';
import { useSession } from '../hooks/useSession';
import { resizeImage } from '../utils/image';

export function LogFormPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const incomingSession = (location.state as { session?: SessionData } | null)?.session ?? null;
  const recommended = incomingSession?.result?.course ?? [];

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState(recommended[0]?.name ?? '');
  const [completed, setCompleted] = useState(true);
  const [memo, setMemo] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const onPickFile = (f: File | null) => {
    setPhoto(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!session?.coupleId) throw new Error('커플 연결이 필요합니다 (홈에서 추천부터 시작하세요)');
      const fd = new FormData();
      fd.set('couple_id', String(session.coupleId));
      fd.set('date', date);
      fd.set('place_name', placeName);
      fd.set('a_user_id', String(session.userId));
      if (incomingSession?.b_user_id && incomingSession.b_user_id !== session.userId) {
        fd.set('b_user_id', String(incomingSession.b_user_id));
      } else if (incomingSession?.a_user_id && incomingSession.a_user_id !== session.userId) {
        fd.set('b_user_id', String(incomingSession.a_user_id));
      }
      if (incomingSession) fd.set('session_id', String(incomingSession.id));
      fd.set('completed', String(completed));
      if (memo) fd.set('memo', memo);
      if (recommended.length > 0) fd.set('course_json', JSON.stringify(recommended));
      if (photo) {
        const blob = await resizeImage(photo);
        fd.set('photo', blob, 'photo.jpg');
      }
      return api.createLog(fd);
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['logs'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
      navigate(`/logs/${created.id}`, { replace: true });
    },
  });

  const canSave = placeName.trim().length > 0 && !mutation.isPending;

  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="뒤로"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-lg">←</button>
        <h1 className="text-2xl font-bold tracking-tight text-ink">데이트 기록</h1>
      </header>

      {recommended.length > 0 && (
        <div className="mb-4 rounded-2xl border border-line bg-paper p-5">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-ink-3">추천된 코스</p>
          <ol className="space-y-1 text-sm text-ink-2">
            {recommended.map((s) => (
              <li key={s.step}><span className="text-ink-3">{s.step}.</span> {s.name}</li>
            ))}
          </ol>
        </div>
      )}

      <label className="mb-4 block">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-cream">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-ink-3">
              <span className="text-4xl">📷</span>
              <span className="mt-2 text-sm">사진 추가</span>
            </div>
          )}
          <input
            type="file" accept="image/*" capture="environment"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </label>

      <Field label="날짜">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
               className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-ink" />
      </Field>

      <Field label="대표 장소명">
        <input type="text" value={placeName} onChange={(e) => setPlaceName(e.target.value)}
               placeholder="어디 갔어요?"
               className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-ink placeholder:text-ink-3" />
      </Field>

      <div className="mb-4 rounded-xl border border-line bg-paper px-4 py-3">
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-2">실제 이행했나요?</span>
          <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)}
                 className="h-5 w-5 accent-terracotta" />
        </label>
      </div>

      <Field label="한 줄 메모">
        <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)}
               placeholder="(선택)"
               className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-ink placeholder:text-ink-3" />
      </Field>

      {mutation.isError && (
        <div className="mb-3 rounded-xl border border-danger bg-danger-soft p-3 text-sm text-danger-2">
          {(mutation.error as Error).message}
        </div>
      )}

      <button
        disabled={!canSave}
        onClick={() => mutation.mutate()}
        className="mt-2 w-full rounded-2xl bg-ink py-4 font-bold text-paper disabled:opacity-30 active:scale-[.98]"
      >
        {mutation.isPending ? '저장 중...' : '저장하기'}
      </button>
      <p className="mt-2 text-center text-xs text-ink-3">별점은 다음 화면에서 매길 수 있어요</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[11px] uppercase tracking-widest text-ink-3">{label}</label>
      {children}
    </div>
  );
}
