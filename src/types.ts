export type Role = 'top' | 'jungle' | 'mid' | 'support' | 'bottom'

export interface Champion {
  id: string
  key: string
  name: string
  title: string
  tags: string[]
  image: string
  difficulty: number
  attack: number
  magic: number
  attackRange: number
  armor: number
  armorPerLevel: number
  spellBlock: number
  spellBlockPerLevel: number
  hp: number
  hpPerLevel: number
}

export interface CounterPick {
  champion: Champion
  winRate: number
  difficulty: number
  reasons: string[]
}
