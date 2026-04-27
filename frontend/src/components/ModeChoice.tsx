interface Props {
  onChoose: (mode: 'quick' | 'detailed') => void;
  onBack?: () => void;
  title?: string;
}

export function ModeChoice({ onChoose, onBack, title }: Props) {
  return (
    <div>
      <header className="mb-2 flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack} aria-label="이전"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-lg text-ink-2">
            ←
          </button>
        ) : <span className="w-10" />}
        <span className="text-[11px] uppercase tracking-widest text-ink-3">
          {title ?? 'Mode'} · 1 / 2
        </span>
        <span className="w-10" />
      </header>

      <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full bg-terracotta" style={{ width: '50%' }} />
      </div>

      <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-ink">
        어떤 추천을 받을까요?
      </h1>
      <p className="mb-10 text-sm text-ink-3">
        대충 빠르게 받을지, 시간·장소·음식 선호까지 반영해 정확하게 받을지 골라주세요.
      </p>

      <div className="space-y-3">
        <button
          onClick={() => onChoose('quick')}
          className="block w-full rounded-3xl border border-line bg-paper p-6 text-left transition active:scale-[.99]"
        >
          <p className="text-[11px] uppercase tracking-widest text-ink-3">Quick · 4 questions</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-ink">기본 추천</p>
          <p className="mt-1 text-sm text-ink-3">컨디션 · 분위기 · 활동성 · 예산</p>
          <p className="mt-2 text-xs text-ink-3">⏱ 약 30초</p>
        </button>
        <button
          onClick={() => onChoose('detailed')}
          className="block w-full rounded-3xl bg-ink p-6 text-left transition active:scale-[.99]"
        >
          <p className="text-[11px] uppercase tracking-widest text-cream/70">Detailed · 8 questions</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-paper">자세한 추천</p>
          <p className="mt-1 text-sm text-cream/70">기본 4개 + 시간 · 장소 · 음식 · 지역</p>
          <p className="mt-2 text-xs text-cream/70">⏱ 약 1분</p>
        </button>
      </div>
    </div>
  );
}
