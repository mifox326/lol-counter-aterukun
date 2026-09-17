import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  dark: boolean
  onToggleDark: () => void
  onHelp: () => void
}

export function Header({ dark, onToggleDark, onHelp }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700">
      <div className="w-9" />
      <Logo />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onHelp}
          aria-label="このサイトについて"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7" />
            <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <ThemeToggle dark={dark} onToggle={onToggleDark} />
      </div>
    </header>
  )
}
