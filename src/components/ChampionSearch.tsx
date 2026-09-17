import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Champion, Role } from '../types'
import { ROLES } from '../data/roles'
import { hiraganaToKatakana } from '../utils/kana'

interface ChampionSearchProps {
  champions: Champion[]
  loading: boolean
  error: string | null
  selectedChampion: Champion | null
  selectedRole: Role | null
  onSelect: (champion: Champion) => void
  onChangeRole: () => void
}

export function ChampionSearch({
  champions,
  loading,
  error,
  selectedChampion,
  selectedRole,
  onSelect,
  onChangeRole,
}: ChampionSearchProps) {
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [open, setOpen] = useState(false)

  const suggestions = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return []
    const normalized = hiraganaToKatakana(trimmed).toLowerCase()
    return champions
      .filter((c) => {
        const name = c.name.toLowerCase()
        return (
          name.includes(trimmed.toLowerCase()) ||
          name.includes(normalized) ||
          c.id.toLowerCase().includes(trimmed.toLowerCase())
        )
      })
      .slice(0, 8)
  }, [champions, query])

  function handleSelect(champion: Champion) {
    onSelect(champion)
    setQuery('')
    setOpen(false)
    setHighlight(0)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(suggestions[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const roleLabel = ROLES.find((r) => r.id === selectedRole)?.label

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder="対戦相手のチャンピオン名"
          disabled={loading}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-sky-800"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
            {suggestions.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(c)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                    i === highlight
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <img src={c.image} alt="" className="h-8 w-8 rounded" />
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
        {selectedChampion ? (
          <>
            <img
              src={selectedChampion.image}
              alt={selectedChampion.name}
              className="h-32 w-32 rounded-lg object-cover shadow"
            />
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
              {selectedChampion.name}
            </p>
            <div className="flex items-center gap-2">
              {roleLabel && (
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                  {roleLabel}
                </span>
              )}
              <button
                type="button"
                onClick={onChangeRole}
                className="text-xs font-medium text-slate-400 underline hover:text-slate-600 dark:hover:text-slate-200"
              >
                ロールを変更
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {loading ? 'チャンピオン情報を読み込み中...' : 'チャンピオンサムネイル'}
          </p>
        )}
      </div>
    </div>
  )
}
