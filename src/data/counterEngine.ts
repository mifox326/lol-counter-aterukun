import type { Champion, CounterPick, Role } from '../types'
import { getEligibleRoles } from './roleEligibility'
import counterStatsRaw from './counterStats.generated.json'
import { getActionTip } from './championActions'

// scripts/collect-match-data.mjs がRiot公式APIの実戦ランクマッチから集計した
// ロール別チャンピオン対面成績。同名スクリプトを再実行すると更新される。
interface MatchupStat {
  games: number
  wins: number
}
interface CounterStatsFile {
  generatedAt: string | null
  sampleMatches: number
  matchIds?: string[]
  stats: Partial<Record<Role, Record<string, Record<string, MatchupStat>>>>
}
const counterStats = counterStatsRaw as CounterStatsFile

// この試合数に達した対面は実戦データをそのまま信頼し、満たない場合は
// ヒューリスティック推定と試合数に応じて加重平均することで、
// 1〜2戦だけの極端な勝率(100%/0%)が結果を支配しないようにする。
const TRUSTED_SAMPLE_SIZE = 8

function getRealMatchup(role: Role, candidateId: string, opponentId: string): MatchupStat | null {
  return counterStats.stats[role]?.[candidateId]?.[opponentId] ?? null
}

// Riot公式APIには「対面同士の勝率」という集計統計そのものは存在しないため、
// 実戦データが少ない対面についてはData Dragonの実ステータス(射程・防御力・
// タグ・難易度など)から決定的にレーン相性を推定して補う。
// 同じ組み合わせなら常に同じ結果になり、乱数は一切使用しない。

interface TagMatch {
  value: number
  text: (opponentName: string) => string
}

const TAG_MATCHUPS: Record<string, Partial<Record<string, TagMatch>>> = {
  Tank: {
    Assassin: {
      value: 18,
      text: (n) => `高い耐久力で${n}の一瞬のバーストを耐え切り、返り討ちにしやすい。`,
    },
    Fighter: {
      value: 8,
      text: (n) => `持久力を活かして${n}との長期戦を優位に進めやすい。`,
    },
  },
  Fighter: {
    Mage: {
      value: 12,
      text: (n) => `接近戦に持ち込めば${n}のポークを無効化しやすい。`,
    },
    Support: {
      value: 6,
      text: (n) => `単体の戦闘力で${n}を一方的に押せる。`,
    },
  },
  Marksman: {
    Fighter: {
      value: 10,
      text: (n) => `射程を活かして${n}が近づく前にダメージを蓄積できる。`,
    },
  },
  Mage: {
    Marksman: {
      value: 8,
      text: (n) => `硬直や範囲スキルで${n}の一方的な攻撃を防ぎやすい。`,
    },
  },
  Assassin: {
    Mage: {
      value: 16,
      text: (n) => `隙を突いて${n}を先に沈めやすい。`,
    },
    Marksman: {
      value: 14,
      text: (n) => `射程外から一気に距離を詰めて${n}を仕留めやすい。`,
    },
  },
}

function bestTagMatch(opponent: Champion, candidate: Champion): TagMatch | null {
  let best: TagMatch | null = null
  for (const candidateTag of candidate.tags) {
    for (const opponentTag of opponent.tags) {
      const match = TAG_MATCHUPS[candidateTag]?.[opponentTag]
      if (match && (!best || match.value > best.value)) best = match
    }
  }
  return best
}

const ROLE_WEIGHTS: Record<Role, { range: number; defense: number; tag: number }> = {
  top: { range: 0.05, defense: 1.1, tag: 1.1 },
  jungle: { range: 0.03, defense: 1.0, tag: 1.3 },
  mid: { range: 0.09, defense: 0.8, tag: 1.0 },
  support: { range: 0.04, defense: 0.9, tag: 1.2 },
  bottom: { range: 0.1, defense: 0.7, tag: 0.9 },
}

// 実ステータスから明確な理由が導けない枠を埋めるための、ロール別の一般的な立ち回りTips。
// 乱数は使わず、チャンピオンIDから決定的に選ぶため同じ相手には常に同じ結果になる。
const ROLE_TIPS: Record<Role, ((opponentName: string) => string)[]> = {
  top: [
    (n) => `序盤の細かい交易を積み重ねて${n}にプレッシャーを与えやすい。`,
    (n) => `${n}のスキルモーションを見てから安全に立ち回りやすい。`,
    (n) => `テレポートやサイド管理を活かして${n}のいないレーンでも存在感を出しやすい。`,
  ],
  jungle: [
    (n) => `${n}のジャングル動線を読んでカウンタージャンプを狙いやすい。`,
    (n) => `ガンクの成功率が高く、${n}のレーン戦を崩しやすい。`,
    (n) => `視界コントロールで${n}のオブジェクト管理を妨害しやすい。`,
  ],
  mid: [
    (n) => `ウェーブクリアが速く、${n}に対してロームで圧をかけやすい。`,
    (n) => `${n}のオールインを機動力で回避しやすい。`,
    (n) => `中盤の集団戦では${n}より先に火力を発揮しやすい。`,
  ],
  support: [
    (n) => `先手のCCで${n}に対してレーン主導権を握りやすい。`,
    (n) => `ADCへのピールが強く、${n}のダイブを防ぎやすい。`,
    (n) => `視界コントロールで${n}のロームを察知しやすい。`,
  ],
  bottom: [
    (n) => `安定したDPSで${n}との長期戦のレーン戦に強い。`,
    (n) => `${n}に対して有利なポジショニングを取りやすい。`,
    (n) => `集団戦での持続火力を活かして${n}を上回りやすい。`,
  ],
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function effectiveArmor(c: Champion): number {
  return c.armor + c.armorPerLevel * 9
}

function effectiveSpellBlock(c: Champion): number {
  return c.spellBlock + c.spellBlockPerLevel * 9
}

function effectiveHp(c: Champion): number {
  return c.hp + c.hpPerLevel * 9
}

function computeScore(opponent: Champion, candidate: Champion, role: Role): number {
  const weight = ROLE_WEIGHTS[role]
  let score = 0

  const rangeDiff = candidate.attackRange - opponent.attackRange
  score += rangeDiff * weight.range

  if (opponent.magic >= 6) {
    score += effectiveSpellBlock(candidate) * 0.15 * weight.defense
  }
  if (opponent.attack >= 6) {
    score += effectiveArmor(candidate) * 0.15 * weight.defense
  }
  score += effectiveHp(candidate) * 0.006 * weight.defense

  const tagMatch = bestTagMatch(opponent, candidate)
  if (tagMatch) score += tagMatch.value * weight.tag

  return score
}

function buildReasonLines(opponent: Champion, candidate: Champion, role: Role): string[] {
  const lines: string[] = []

  const tagMatch = bestTagMatch(opponent, candidate)
  if (tagMatch) lines.push(tagMatch.text(opponent.name))

  const tips = ROLE_TIPS[role]
  const tipOffset = hashString(candidate.id)
  let tipIndex = 0
  while (lines.length < 3 && tipIndex < tips.length) {
    const tip = tips[(tipOffset + tipIndex) % tips.length](opponent.name)
    if (!lines.includes(tip)) lines.push(tip)
    tipIndex += 1
  }

  // 対面理由に加えて、実際のスキルを使ったカウンターアクションの一例を必ず添える。
  const actionTip = getActionTip(candidate.id, candidate.tags, opponent.name)
  if (!lines.includes(actionTip)) lines.push(actionTip)

  return lines
}

export function getCounterPicks(opponent: Champion, role: Role, pool: Champion[]): CounterPick[] {
  const others = pool.filter((c) => c.id !== opponent.id)
  const sameLane = others.filter((c) => getEligibleRoles(c).includes(role))
  // 対象ロールの候補が極端に少ない場合のみ、全チャンピオンから補完する。
  const candidates = sameLane.length >= 3 ? sameLane : others

  const ranked = candidates
    .map((candidate) => {
      const score = computeScore(opponent, candidate, role)
      const heuristicWinRate = Math.min(63, Math.max(45, 50 + score * 0.15))
      const real = getRealMatchup(role, candidate.id, opponent.id)

      let winRate = heuristicWinRate
      if (real && real.games > 0) {
        const realWinRate = (real.wins / real.games) * 100
        const trust = Math.min(1, real.games / TRUSTED_SAMPLE_SIZE)
        winRate = realWinRate * trust + heuristicWinRate * (1 - trust)
      }

      return { candidate, winRate, real }
    })
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3)

  return ranked.map(({ candidate, winRate, real }) => ({
    champion: candidate,
    winRate: Math.round(winRate * 10) / 10,
    matches: real?.games ?? 0,
    reasons: buildReasonLines(opponent, candidate, role),
  }))
}
