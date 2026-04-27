interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function StarRating({ value, onChange }: Props) {
  return (
    <div className="flex justify-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}점`}
          onClick={() => {
            onChange(n);
            navigator.vibrate?.(10);
          }}
          className={`text-3xl transition active:scale-110 ${
            n <= value ? 'text-terracotta' : 'text-line-2'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
