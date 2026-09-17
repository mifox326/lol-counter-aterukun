export function Logo() {
  return (
    <div className="flex items-baseline gap-2 select-none">
      <span
        className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-3xl font-black tracking-widest text-transparent drop-shadow-sm md:text-4xl"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        LoL
      </span>
      <span
        className="text-lg font-bold text-sky-700 md:text-2xl dark:text-sky-300"
        style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}
      >
        かうんたーあてるくん
      </span>
    </div>
  )
}
