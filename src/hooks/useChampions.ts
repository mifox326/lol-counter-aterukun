import { useEffect, useState } from 'react'
import type { Champion } from '../types'

interface DDragonChampionData {
  id: string
  key: string
  name: string
  title: string
  tags: string[]
  image: { full: string }
  info: { attack: number; magic: number; difficulty: number }
  stats: {
    hp: number
    hpperlevel: number
    armor: number
    armorperlevel: number
    spellblock: number
    spellblockperlevel: number
    attackrange: number
  }
}

interface DDragonChampionResponse {
  data: Record<string, DDragonChampionData>
}

interface UseChampionsResult {
  champions: Champion[]
  loading: boolean
  error: string | null
}

export function useChampions(): UseChampionsResult {
  const [champions, setChampions] = useState<Champion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')
        if (!versionsRes.ok) throw new Error('versions fetch failed')
        const versions: string[] = await versionsRes.json()
        const latest = versions[0]

        const champRes = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${latest}/data/ja_JP/champion.json`,
        )
        if (!champRes.ok) throw new Error('champion fetch failed')
        const json: DDragonChampionResponse = await champRes.json()

        const list: Champion[] = Object.values(json.data)
          .map((c) => ({
            id: c.id,
            key: c.key,
            name: c.name,
            title: c.title,
            tags: c.tags,
            image: `https://ddragon.leagueoflegends.com/cdn/${latest}/img/champion/${c.image.full}`,
            difficulty: c.info.difficulty,
            attack: c.info.attack,
            magic: c.info.magic,
            attackRange: c.stats.attackrange,
            armor: c.stats.armor,
            armorPerLevel: c.stats.armorperlevel,
            spellBlock: c.stats.spellblock,
            spellBlockPerLevel: c.stats.spellblockperlevel,
            hp: c.stats.hp,
            hpPerLevel: c.stats.hpperlevel,
          }))
          .sort((a, b) => a.id.localeCompare(b.id))

        if (!cancelled) {
          setChampions(list)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError('チャンピオンデータの取得に失敗しました。時間をおいて再度お試しください。')
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { champions, loading, error }
}
