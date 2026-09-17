// Riot公式APIから実際のランクマッチデータを収集し、ロール別チャンピオン対面の
// 実勝率(src/data/counterStats.generated.json)を生成するバッチスクリプト。
//
// 実行方法:
//   1. .env に RIOT_API_KEY=RGAPI-xxxx を設定
//   2. node scripts/collect-match-data.mjs
//
// Development API Keyはレート制限が非常に厳しい(20req/秒, 100req/2分)ため、
// このスクリプトは意図的に低速に動作する(MAX_MATCHES=1000だと概ね20〜25分)。
// チャレンジャー/グランドマスター/マスターの3ティアからサモナーを集め、
// 1人あたり最大100試合分のマッチIDを取得することでリクエスト数を節約しつつ
// 目標試合数に達し次第それ以上のサモナー探索を打ち切る。

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

loadDotEnv(join(PROJECT_ROOT, '.env'))

const API_KEY = process.env.RIOT_API_KEY
if (!API_KEY) {
  console.error('RIOT_API_KEY が設定されていません。.env を確認してください。')
  process.exit(1)
}

const PLATFORM = process.env.RIOT_PLATFORM ?? 'jp1'
const REGION = process.env.RIOT_REGION ?? 'asia'
const QUEUE = 'RANKED_SOLO_5x5'
const MATCH_QUEUE_ID = 420

const MAX_MATCHES = Number(process.env.MAX_MATCHES ?? 1000)
const MATCHES_PER_SUMMONER = Number(process.env.MATCHES_PER_SUMMONER ?? 100)
// マッチID収集は重複を見込んで目標より多めに集めてから打ち切る。
const MATCH_ID_TARGET = Math.ceil(MAX_MATCHES * 1.2)

const REQUEST_INTERVAL_MS = 1300
const OUTPUT_PATH = join(PROJECT_ROOT, 'src', 'data', 'counterStats.generated.json')
const CHECKPOINT_EVERY = 50

const TEAM_POSITION_TO_ROLE = {
  TOP: 'top',
  JUNGLE: 'jungle',
  MIDDLE: 'mid',
  BOTTOM: 'bottom',
  UTILITY: 'support',
}

function loadDotEnv(path) {
  try {
    const content = readFileSync(path, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim()
    }
  } catch {
    // .env が無ければ環境変数に既に設定されているものとして進める
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatDuration(ms) {
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}分${sec}秒`
}

let lastRequestAt = 0
async function riotFetch(url) {
  const wait = REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt)
  if (wait > 0) await sleep(wait)
  lastRequestAt = Date.now()

  const res = await fetch(url, { headers: { 'X-Riot-Token': API_KEY } })

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after') ?? '5')
    console.warn(`  rate limited, retrying in ${retryAfter}s...`)
    await sleep((retryAfter + 1) * 1000)
    return riotFetch(url)
  }

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} :: ${url}`)
  }

  return res.json()
}

async function fetchSummonerPool() {
  const tiers = ['challengerleagues', 'grandmasterleagues', 'masterleagues']
  const puuids = []
  const seen = new Set()

  for (const tier of tiers) {
    console.log(`  ${tier} を取得中...`)
    const league = await riotFetch(
      `https://${PLATFORM}.api.riotgames.com/lol/league/v4/${tier}/by-queue/${QUEUE}`,
    )
    for (const entry of league.entries) {
      if (seen.has(entry.puuid)) continue
      seen.add(entry.puuid)
      puuids.push(entry.puuid)
    }
    console.log(`  累計サモナープール: ${puuids.length} 人`)
  }

  return puuids
}

async function main() {
  const startedAt = Date.now()
  console.log(`目標試合数: ${MAX_MATCHES} 件`)

  console.log(`[1/3] ${QUEUE} のチャレンジャー/グランドマスター/マスターからサモナーを収集 (${PLATFORM})...`)
  const puuids = await fetchSummonerPool()

  console.log('[2/3] 各サモナーの直近ランクマッチIDを取得(目標到達次第打ち切り)...')
  const matchIdSet = new Set()
  for (const [i, puuid] of puuids.entries()) {
    if (matchIdSet.size >= MATCH_ID_TARGET) {
      console.log(`  マッチID目標(${MATCH_ID_TARGET})に到達したため探索を打ち切り`)
      break
    }
    try {
      const ids = await riotFetch(
        `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=${MATCH_QUEUE_ID}&count=${MATCHES_PER_SUMMONER}`,
      )
      ids.forEach((id) => matchIdSet.add(id))
      console.log(
        `  (${i + 1}/${puuids.length}) +${ids.length} matches (total unique: ${matchIdSet.size}/${MATCH_ID_TARGET})`,
      )
    } catch (e) {
      console.warn(`  (${i + 1}/${puuids.length}) skip: ${e.message}`)
    }
  }

  const matchIds = [...matchIdSet].slice(0, MAX_MATCHES)
  console.log(`[3/3] ${matchIds.length} 試合の詳細を取得して集計...`)

  // stats[role][candidateChampionId][opponentChampionId] = { games, wins }
  const stats = {}
  function record(role, candidate, opponent, didWin) {
    stats[role] ??= {}
    stats[role][candidate] ??= {}
    stats[role][candidate][opponent] ??= { games: 0, wins: 0 }
    stats[role][candidate][opponent].games += 1
    if (didWin) stats[role][candidate][opponent].wins += 1
  }

  function writeOutput(processed) {
    const output = {
      generatedAt: new Date().toISOString(),
      sampleMatches: processed,
      stats,
    }
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))
  }

  let processed = 0
  for (const matchId of matchIds) {
    try {
      const match = await riotFetch(`https://${REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}`)
      const participants = match.info.participants

      for (const [teamPosition, role] of Object.entries(TEAM_POSITION_TO_ROLE)) {
        const laners = participants.filter((p) => p.teamPosition === teamPosition)
        if (laners.length !== 2) continue
        const [a, b] = laners
        if (a.teamId === b.teamId) continue

        record(role, a.championName, b.championName, a.win)
        record(role, b.championName, a.championName, b.win)
      }

      processed += 1
      if (processed % 10 === 0) {
        const elapsed = Date.now() - startedAt
        const perMatch = elapsed / processed
        const remaining = perMatch * (matchIds.length - processed)
        console.log(
          `  ${processed}/${matchIds.length} 試合処理済み (経過 ${formatDuration(elapsed)} / 残り目安 ${formatDuration(remaining)})`,
        )
      }
      if (processed % CHECKPOINT_EVERY === 0) {
        writeOutput(processed)
        console.log(`  チェックポイント保存 (${processed}件)`)
      }
    } catch (e) {
      console.warn(`  match skip: ${e.message}`)
    }
  }

  writeOutput(processed)
  console.log(`完了: ${processed} 試合分のデータを ${OUTPUT_PATH} に書き出しました。`)
  console.log(`所要時間: ${formatDuration(Date.now() - startedAt)}`)
}

main().catch((e) => {
  console.error('失敗:', e)
  process.exit(1)
})
