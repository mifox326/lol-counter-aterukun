import { useState } from 'react'
import type { CounterPick } from '../types'
import { useChampionSpellIcons, type SkillKey, type SpellIconMap } from '../hooks/useChampionSpellIcons'

interface CounterListProps {
  counters: CounterPick[]
  hasSelection: boolean
}

const SKILL_KEY_PATTERN = /([QWER])/

function renderReasonLine(text: string, icons: SpellIconMap | undefined) {
  if (!icons) return text

  return text.split(SKILL_KEY_PATTERN).map((part, index) => {
    const icon = icons[part as SkillKey]
    if (!icon) return part

    return (
      <span key={index} className="inline-flex items-center gap-0.5 align-middle">
        <img src={icon} alt={`${part}スキル`} className="h-[1em] w-[1em] rounded-sm" />
        {part}
      </span>
    )
  })
}

export function CounterList({ counters, hasSelection }: CounterListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const spellIcons = useChampionSpellIcons(counters.map((counter) => counter.champion.id))

  if (!hasSelection) {
    return (
      <div className="flex min-h-64 flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-600 dark:text-slate-500">
        チャンピオンとロールを選択すると
        <br />
        カウンターピック候補が表示されます
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {counters.map((counter, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={counter.champion.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <img
                src={counter.champion.image}
                alt={counter.champion.name}
                className="h-14 w-14 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {counter.champion.name}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  勝率 {counter.winRate}%
                </p>
              </div>
              <span className="text-xs whitespace-nowrap text-slate-400 dark:text-slate-500">
                {counter.matches}試合
              </span>
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className={`ml-1 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isOpen && (
              <ul className="space-y-1.5 border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {counter.reasons.map((line, lineIndex) => (
                  <li key={lineIndex} className="flex gap-2">
                    <span className="text-sky-500 dark:text-sky-400">・</span>
                    <span>{renderReasonLine(line, spellIcons[counter.champion.id])}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
