export function DifficultyStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`難易度 ${value} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          width="14"
          height="14"
          fill={i < value ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.2}
          className={i < value ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}
        >
          <path d="M10 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.7l-5.2 2.8 1-5.8-4.2-4.1 5.8-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}
