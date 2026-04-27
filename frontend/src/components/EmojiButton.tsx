interface Props {
  emoji: string;
  label: string;
  selected?: boolean;
  onClick: () => void;
}

export function EmojiButton({ emoji, label, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex min-h-32 flex-1 flex-col items-center justify-center rounded-2xl border bg-paper p-4 transition active:scale-[.98] ${
        selected
          ? 'border-terracotta bg-terracotta-soft'
          : 'border-line hover:border-line-2'
      }`}
    >
      <span className="text-4xl">{emoji}</span>
      <span className={`mt-3 text-sm ${selected ? 'font-bold text-terracotta-2' : 'font-medium text-ink-2'}`}>
        {label}
      </span>
    </button>
  );
}
