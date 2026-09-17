import type { Champion, Role } from '../types'

// Riot公式データにはチャンピオンの「レーン」情報が存在しないため、
// 公式タグ(tags)から一般的なレーンを推定するベースルールと、
// タグだけでは判定を誤りやすい代表的なチャンピオンの補正リストを組み合わせて判定する。
const TAG_ROLES: Record<string, Role[]> = {
  Marksman: ['bottom'],
  Support: ['support'],
  Mage: ['mid', 'support'],
  Assassin: ['mid', 'jungle'],
  Fighter: ['top', 'jungle'],
  Tank: ['top', 'jungle', 'support'],
}

// タグだけでは実際の主戦場と乖離するチャンピオンの補正(Data Dragonのidに合わせて記載)。
const ROLE_OVERRIDES: Partial<Record<string, Role[]>> = {
  Yasuo: ['mid', 'top'],
  Yone: ['mid', 'top'],
  Pyke: ['support'],
  Senna: ['support', 'bottom'],
  Seraphine: ['support', 'bottom', 'mid'],
  Kindred: ['jungle'],
  Kalista: ['bottom'],
  Karma: ['support', 'mid'],
  Swain: ['support', 'mid'],
  Zyra: ['support', 'jungle'],
  Brand: ['support', 'mid'],
  Nautilus: ['support', 'jungle', 'top'],
  Sett: ['top', 'jungle', 'support'],
  Gragas: ['top', 'jungle', 'support'],
  Amumu: ['jungle', 'support'],
  Maokai: ['jungle', 'top', 'support'],
  Shaco: ['jungle', 'support'],
  Teemo: ['top', 'support'],
  Heimerdinger: ['top', 'mid', 'support'],
  Ziggs: ['mid', 'bottom'],
  Xerath: ['mid', 'support'],
  Velkoz: ['mid', 'support'],
  Lux: ['support', 'mid'],
  Twitch: ['bottom', 'jungle'],
  Poppy: ['top', 'jungle', 'support'],
  TahmKench: ['support', 'top'],
  Morgana: ['support', 'mid'],
  Neeko: ['mid', 'support'],
  Fiddlesticks: ['jungle', 'support'],
  Renekton: ['top', 'jungle'],
  Volibear: ['top', 'jungle'],
  Ornn: ['top'],
  Smolder: ['bottom', 'top'],
  Akshan: ['mid', 'top'],
  Vex: ['mid'],
  Yuumi: ['support'],
  Rakan: ['support'],
  Bard: ['support'],
  Taric: ['support'],
  Soraka: ['support'],
  Nami: ['support'],
  Milio: ['support'],
  Renata: ['support'],
  Janna: ['support'],
  Lulu: ['support'],
}

export function getEligibleRoles(champion: Champion): Role[] {
  const override = ROLE_OVERRIDES[champion.id]
  if (override) return override

  const roles = new Set<Role>()
  for (const tag of champion.tags) {
    for (const role of TAG_ROLES[tag] ?? []) roles.add(role)
  }

  return roles.size > 0 ? [...roles] : ['top', 'jungle', 'mid', 'support', 'bottom']
}
