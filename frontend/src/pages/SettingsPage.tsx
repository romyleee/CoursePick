import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { clearCouple } from '../session';

export function SettingsPage() {
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<string | null>(null);

  const leaveCouple = () => {
    const next = clearCouple();
    if (next) setSession(next);
    setMsg('커플 모드 해제됨');
  };

  return (
    <div>
      <header className="mb-8 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="뒤로"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-lg">←</button>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-ink-3">Settings</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">설정</h1>
        </div>
      </header>

      <Section title="내 정보">
        <div className="flex items-center justify-between rounded-xl border border-line bg-cream/50 px-4 py-3">
          <span className="text-xs uppercase tracking-widest text-ink-3">표시 이름</span>
          <span className="text-base font-bold text-ink">
            게스트 {session?.userId ?? '-'}
          </span>
        </div>
        <p className="mt-2 text-xs text-ink-3">
          닉네임 수정은 곧 지원될 예정이에요.
        </p>
      </Section>

      <Section title="커플 모드">
        {session?.coupleId ? (
          <>
            <div className="mb-3 flex items-center justify-between rounded-xl border border-line bg-cream/50 px-4 py-3">
              <span className="text-xs uppercase tracking-widest text-ink-3">초대코드</span>
              <span className="font-mono text-base font-bold tracking-widest text-ink">
                {session.inviteCode ?? '-'}
              </span>
            </div>
            <button
              onClick={leaveCouple}
              className="w-full rounded-xl border border-danger py-3 text-sm font-medium text-danger"
            >
              커플 모드 해제
            </button>
          </>
        ) : (
          <p className="text-sm text-ink-3">
            현재 솔로 모드입니다. 둘이 추천 받기 또는 코드 참가 시 커플 연결됩니다.
          </p>
        )}
        {msg && <p className="mt-2 text-center text-xs text-ink-3">{msg}</p>}
      </Section>

      <Section title="정보">
        <p className="text-xs text-ink-3">user_id : {session?.userId}</p>
        <p className="mt-1 text-xs text-ink-3">couple_id : {session?.coupleId ?? '-'}</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border border-line bg-paper p-5">
      <h2 className="mb-3 text-[11px] uppercase tracking-widest text-ink-3">{title}</h2>
      {children}
    </section>
  );
}
