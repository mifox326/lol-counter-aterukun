import { useEffect, useState } from 'react'

export type SkillKey = 'Q' | 'W' | 'E' | 'R'
export type SpellIconMap = Partial<Record<SkillKey, string>>

const SKILL_KEYS: SkillKey[] = ['Q', 'W', 'E', 'R']

interface DDragonSpell {
  image: { full: string }
}

interface DDragonChampionDetailResponse {
  data: Record<string, { spells: DDragonSpell[] }>
}

let versionPromise: Promise<string> | null = null
function getLatestVersion(): Promise<string> {
  versionPromise ??= fetch('https://ddragon.leagueoflegends.com/api/versions.json')
    .then((res) => res.json())
    .then((versions: string[]) => versions[0])
  return versionPromise
}

const spellIconCache = new Map<string, SpellIconMap>()
const spellIconPromises = new Map<string, Promise<SpellIconMap>>()

function fetchSpellIcons(championId: string): Promise<SpellIconMap> {
  const cached = spellIconCache.get(championId)
  if (cached) return Promise.resolve(cached)

  const pending = spellIconPromises.get(championId)
  if (pending) return pending

  const promise = getLatestVersion()
    .then((version) =>
      fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ja_JP/champion/${championId}.json`)
        .then((res) => res.json())
        .then((json: DDragonChampionDetailResponse) => {
          const spells = json.data[championId]?.spells ?? []
          const icons: SpellIconMap = {}
          SKILL_KEYS.forEach((key, index) => {
            const spell = spells[index]
            if (spell) icons[key] = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}`
          })
          return icons
        }),
    )
    .then((icons) => {
      spellIconCache.set(championId, icons)
      return icons
    })
    .catch(() => ({}) as SpellIconMap)

  spellIconPromises.set(championId, promise)
  return promise
}

export function useChampionSpellIcons(championIds: string[]): Record<string, SpellIconMap> {
  const key = championIds.join(',')
  const [icons, setIcons] = useState<Record<string, SpellIconMap>>({})

  useEffect(() => {
    let cancelled = false

    Promise.all(championIds.map((id) => fetchSpellIcons(id).then((map) => [id, map] as const))).then((entries) => {
      if (cancelled) return
      setIcons(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return icons
}
