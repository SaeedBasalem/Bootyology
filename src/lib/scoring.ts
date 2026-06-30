import type { AppData, CriterionKey, Model, Scorecard, Scores } from './types'
import { CRITERIA, CRITERIA_BY_KEY, MAX_TOTAL } from './criteria'

export { MAX_TOTAL }

export function computeTotal(scores: Scores): number {
  return CRITERIA.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0)
}

export function pct(total: number): number {
  return Math.max(0, Math.round((total / MAX_TOTAL) * 100))
}

/** Normalize a single criterion score to 0..100 for comparable radar plotting. */
export function normalizeCriterion(key: CriterionKey, value: number): number {
  const c = CRITERIA_BY_KEY[key]
  if (c.isDeduction) {
    return Math.round((1 - Math.abs(value) / Math.abs(c.min)) * 100)
  }
  return Math.round((value / c.max) * 100)
}

export interface ModelStats {
  model: Model
  cards: Scorecard[]
  rounds: number
  best: number
  average: number
  latest: number
  latestCard?: Scorecard
  bestCard?: Scorecard
  trend: number // latest - previous (0 if <2 rounds)
}

export function statsForModel(data: AppData, modelId: string): ModelStats {
  const model = data.models.find((m) => m.id === modelId)!
  const cards = data.scorecards
    .filter((s) => s.modelId === modelId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
  const totals = cards.map((c) => c.total)
  const best = totals.length ? Math.max(...totals) : 0
  const average = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0
  const latestCard = cards[cards.length - 1]
  const latest = latestCard ? latestCard.total : 0
  const bestCard = cards.find((c) => c.total === best)
  const trend =
    cards.length >= 2 ? cards[cards.length - 1].total - cards[cards.length - 2].total : 0
  return {
    model,
    cards,
    rounds: cards.length,
    best,
    average: Math.round(average * 10) / 10,
    latest,
    latestCard,
    bestCard,
    trend,
  }
}

export type RankBy = 'average' | 'best' | 'latest'

export interface RankedModel extends ModelStats {
  rank: number
  metric: number
}

export function leaderboard(data: AppData, rankBy: RankBy): RankedModel[] {
  const scored = data.models
    .filter((m) => !m.archived)
    .map((m) => statsForModel(data, m.id))
    .filter((s) => s.rounds > 0)

  const withMetric = scored.map((s) => ({
    ...s,
    metric: rankBy === 'average' ? s.average : rankBy === 'best' ? s.best : s.latest,
  }))

  withMetric.sort((a, b) => b.metric - a.metric || b.best - a.best || a.model.name.localeCompare(b.model.name))

  return withMetric.map((s, i) => ({ ...s, rank: i + 1 }))
}

export function criterionAverages(cards: Scorecard[]): Record<CriterionKey, number> {
  const result = {} as Record<CriterionKey, number>
  for (const c of CRITERIA) {
    if (!cards.length) {
      result[c.key] = 0
      continue
    }
    const sum = cards.reduce((acc, card) => acc + (card.scores[c.key] ?? 0), 0)
    result[c.key] = Math.round((sum / cards.length) * 10) / 10
  }
  return result
}

export function mostImproved(data: AppData): { stats: ModelStats; delta: number } | null {
  let best: { stats: ModelStats; delta: number } | null = null
  for (const m of data.models) {
    const stats = statsForModel(data, m.id)
    if (stats.rounds < 2) continue
    const delta = stats.cards[stats.cards.length - 1].total - stats.cards[0].total
    if (!best || delta > best.delta) best = { stats, delta }
  }
  return best
}

export function scoreTier(total: number): { label: string; color: string } {
  const p = pct(total)
  if (p >= 90) return { label: 'Elite', color: 'var(--gold)' }
  if (p >= 78) return { label: 'Excellent', color: 'var(--good)' }
  if (p >= 60) return { label: 'Strong', color: '#7aa7d8' }
  if (p >= 45) return { label: 'Developing', color: 'var(--rose)' }
  return { label: 'Early', color: 'var(--text-muted)' }
}

// ── Similar Models ────────────────────────────────────────────────────────────

function avgNormScores(data: AppData, modelId: string): Record<CriterionKey, number> | null {
  const stats = statsForModel(data, modelId)
  if (!stats.cards.length) return null
  const avgs = criterionAverages(stats.cards)
  const normed = {} as Record<CriterionKey, number>
  for (const c of CRITERIA) {
    normed[c.key] = normalizeCriterion(c.key, avgs[c.key])
  }
  return normed
}

function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0, na = 0, nb = 0
  for (const k of Object.keys(a)) {
    dot += a[k] * b[k]
    na += a[k] * a[k]
    nb += b[k] * b[k]
  }
  if (!na || !nb) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export function similarModels(data: AppData, modelId: string, n = 3): { model: Model; similarity: number }[] {
  const target = avgNormScores(data, modelId)
  if (!target) return []
  const results: { model: Model; similarity: number }[] = []
  for (const m of data.models.filter((m) => m.id !== modelId && !m.archived)) {
    const other = avgNormScores(data, m.id)
    if (!other) continue
    results.push({ model: m, similarity: Math.round(cosineSimilarity(target, other) * 100) })
  }
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, n)
}

// ── Trend Commentary ──────────────────────────────────────────────────────────

export function trendCommentary(data: AppData, modelId: string): string {
  const stats = statsForModel(data, modelId)
  if (stats.rounds === 0) return `${stats.model.name} hasn't been scored yet. Add a clip for her and score it to start tracking.`
  if (stats.rounds === 1) return `${stats.model.name} made her debut with ${stats.best}/${MAX_TOTAL} — a strong opening statement. Score another clip to track her trajectory.`

  const trend = stats.trend
  const pctScore = pct(stats.average)
  const tier = scoreTier(stats.average)

  const direction = trend > 3 ? 'surging' : trend > 0 ? 'climbing' : trend < -3 ? 'slipping' : trend < 0 ? 'dipping slightly' : 'holding steady'
  const tierWord = tier.label.toLowerCase()

  const openers = [
    `${stats.model.name} is ${direction} in the rankings.`,
    `Across ${stats.rounds} scored clips, ${stats.model.name} has been a ${tierWord} performer.`,
    `The judge's latest read on ${stats.model.name}: ${direction}.`,
  ]
  const opener = openers[stats.rounds % openers.length]

  let detail = ''
  if (trend > 0) detail = ` Her most recent clip score (+${trend}) shows clear upward momentum — one to keep watching.`
  else if (trend < 0) detail = ` The latest clip showed a dip of ${Math.abs(trend)} — a minor correction or a new challenger closing the gap?`
  else detail = ` Consistent across clips — a reliable presence at ${pctScore}%.`

  const best = stats.best
  const latestCard = stats.latestCard
  if (latestCard && latestCard.total === best && stats.rounds > 1) {
    detail += ' This is also her personal best — she peaked at exactly the right time.'
  }

  return opener + detail
}

// ── Model of the Month ────────────────────────────────────────────────────────

export interface ModelOfMonth {
  model: Model
  avgScore: number
  scorecardCount: number
  month: string // 'YYYY-MM'
  title: string
}

export function modelOfMonth(data: AppData, month?: string): ModelOfMonth | null {
  const target = month ?? new Date().toISOString().slice(0, 7)
  const cards = data.scorecards.filter((c) => c.date.startsWith(target))
  if (!cards.length) return null

  const byModel: Record<string, Scorecard[]> = {}
  for (const c of cards) {
    if (!byModel[c.modelId]) byModel[c.modelId] = []
    byModel[c.modelId].push(c)
  }

  let best: ModelOfMonth | null = null
  for (const [modelId, mCards] of Object.entries(byModel)) {
    const model = data.models.find((m) => m.id === modelId)
    if (!model) continue
    const avg = mCards.reduce((s, c) => s + c.total, 0) / mCards.length
    if (!best || avg > best.avgScore || (avg === best.avgScore && mCards.length > best.scorecardCount)) {
      const [year, mon] = target.split('-')
      const monthName = new Date(`${year}-${mon}-15`).toLocaleString('default', { month: 'long', year: 'numeric' })
      best = { model, avgScore: Math.round(avg * 10) / 10, scorecardCount: mCards.length, month: target, title: `Model of ${monthName}` }
    }
  }
  return best
}

// ── Seasonal Report ───────────────────────────────────────────────────────────

export interface SeasonalReport {
  label: string        // "Q2 2026"
  startMonth: string   // 'YYYY-MM'
  endMonth: string
  totalCards: number
  avgScore: number
  topModel: Model | null
  mostActive: { model: Model; count: number } | null
  improvement: number  // roster avg vs previous quarter
}

function quarterOf(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number)
  const q = Math.ceil(month / 3)
  return `Q${q} ${year}`
}

export function seasonalReports(data: AppData): SeasonalReport[] {
  const byQuarter: Record<string, Scorecard[]> = {}
  for (const c of data.scorecards) {
    const q = quarterOf(c.date)
    if (!byQuarter[q]) byQuarter[q] = []
    byQuarter[q].push(c)
  }

  return Object.entries(byQuarter)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, cards]) => {
      const avg = cards.length ? Math.round((cards.reduce((s, c) => s + c.total, 0) / cards.length) * 10) / 10 : 0

      const byModel: Record<string, Scorecard[]> = {}
      for (const c of cards) {
        if (!byModel[c.modelId]) byModel[c.modelId] = []
        byModel[c.modelId].push(c)
      }

      let topModel: Model | null = null
      let topAvg = 0
      let mostActive: { model: Model; count: number } | null = null
      let maxCount = 0

      for (const [mid, mc] of Object.entries(byModel)) {
        const model = data.models.find((m) => m.id === mid)
        if (!model) continue
        const mAvg = mc.reduce((s, c) => s + c.total, 0) / mc.length
        if (mAvg > topAvg) { topAvg = mAvg; topModel = model }
        if (mc.length > maxCount) { maxCount = mc.length; mostActive = { model, count: mc.length } }
      }

      return {
        label,
        startMonth: cards[0]?.date?.slice(0, 7) ?? '',
        endMonth: cards[cards.length - 1]?.date?.slice(0, 7) ?? '',
        totalCards: cards.length,
        avgScore: avg,
        topModel,
        mostActive,
        improvement: 0, // filled in below
      }
    })
    .map((report, i, arr) => ({
      ...report,
      improvement: i > 0 ? Math.round((report.avgScore - arr[i - 1].avgScore) * 10) / 10 : 0,
    }))
}

// ── Score Heatmap ─────────────────────────────────────────────────────────────

export interface HeatmapDay {
  date: string  // 'YYYY-MM-DD'
  count: number
  avgScore: number
}

export function scoreHeatmap(data: AppData): HeatmapDay[] {
  const byDate: Record<string, Scorecard[]> = {}
  for (const c of data.scorecards) {
    if (!byDate[c.date]) byDate[c.date] = []
    byDate[c.date].push(c)
  }
  return Object.entries(byDate).map(([date, cards]) => ({
    date,
    count: cards.length,
    avgScore: Math.round((cards.reduce((s, c) => s + c.total, 0) / cards.length) * 10) / 10,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

// ── Rankings History ──────────────────────────────────────────────────────────

export interface RankSnapshot {
  roundId: string
  roundName: string
  date: string
  ranks: Record<string, number>  // modelId → rank
  scores: Record<string, number> // modelId → score
}

export function rankingsHistory(data: AppData): RankSnapshot[] {
  const rounds = data.rounds.slice().sort((a, b) => a.date.localeCompare(b.date))
  return rounds
    .map((round) => {
      const cards = data.scorecards.filter((c) => c.roundId === round.id)
      if (!cards.length) return null
      const sorted = cards.slice().sort((a, b) => b.total - a.total)
      const ranks: Record<string, number> = {}
      const scores: Record<string, number> = {}
      sorted.forEach((c, i) => {
        ranks[c.modelId] = i + 1
        scores[c.modelId] = c.total
      })
      return { roundId: round.id, roundName: round.name, date: round.date, ranks, scores }
    })
    .filter(Boolean) as RankSnapshot[]
}

// ── Daily Rotation ────────────────────────────────────────────────────────────

export function dailyWatchSuggestion(data: AppData): Model | null {
  const active = data.models.filter((m) => !m.archived)
  if (!active.length) return null

  // Sort by least-recently scored
  const withLastDate = active.map((m) => {
    const cards = data.scorecards.filter((c) => c.modelId === m.id)
    const last = cards.length ? cards.slice().sort((a, b) => b.date.localeCompare(a.date))[0].date : '1970-01-01'
    return { model: m, lastScored: last }
  })

  withLastDate.sort((a, b) => a.lastScored.localeCompare(b.lastScored))
  return withLastDate[0]?.model ?? null
}

// ── Judge XP & Levels ─────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [0, 50, 130, 250, 420, 650, 950, 1320, 1770, 2310, 2950, 3700, 4570, 5570, 6710, 10000]
const LEVEL_TITLES = [
  'Rookie Critic', 'Casual Observer', 'Aspiring Judge', 'Scene Regular',
  'Booty Connoisseur', 'Seasoned Analyst', 'Expert Reviewer', 'Senior Judge',
  'Master Critic', 'Grand Juror', 'Distinguished Judge', 'Supreme Analyst',
  'Hall of Fame Judge', 'Legendary Bootyologist', 'Grand Bootyologist',
]

export function levelFromXp(xp: number): number {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else break
  }
  return Math.min(level, LEVEL_TITLES.length)
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
}

export function xpForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)]
}

export function xpProgress(xp: number, level: number): number {
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0
  const next = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  if (next === current) return 1
  return Math.min(1, (xp - current) / (next - current))
}

export function xpForScorecard(total: number): number {
  const p = pct(total)
  if (p >= 90) return 30
  if (p >= 78) return 20
  if (p >= 60) return 12
  return 8
}

// ── Tier progress (points to next tier) ──────────────────────────────────────

export interface TierProgressResult {
  current: { label: string; color: string }
  next: { label: string; color: string; minTotal: number } | null
  pointsNeeded: number
  pctToNext: number  // 0..1 progress within current tier band
}

export function tierProgress(total: number): TierProgressResult {
  const TIERS = [
    { label: 'Early',      color: 'var(--text-muted)', minTotal: 0 },
    { label: 'Developing', color: 'var(--rose)',        minTotal: Math.ceil(0.45 * MAX_TOTAL) },
    { label: 'Strong',     color: '#7aa7d8',            minTotal: Math.ceil(0.60 * MAX_TOTAL) },
    { label: 'Excellent',  color: 'var(--good)',        minTotal: Math.ceil(0.78 * MAX_TOTAL) },
    { label: 'Elite',      color: 'var(--gold)',        minTotal: Math.ceil(0.90 * MAX_TOTAL) },
  ]
  let idx = 0
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (total >= TIERS[i].minTotal) { idx = i; break }
  }
  const current = TIERS[idx]
  const next = TIERS[idx + 1] ?? null
  if (!next) return { current, next: null, pointsNeeded: 0, pctToNext: 1 }
  const pointsNeeded = Math.max(0, next.minTotal - total)
  const range = next.minTotal - current.minTotal
  const pctToNext = range > 0 ? Math.min(1, (total - current.minTotal) / range) : 1
  return { current, next, pointsNeeded, pctToNext }
}

// ── Days since last scorecard ─────────────────────────────────────────────────

export function daysSinceLastScore(data: AppData, modelId: string): number | null {
  const cards = data.scorecards.filter((c) => c.modelId === modelId)
  if (!cards.length) return null
  const latest = cards.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
  const today = new Date()
  const last = new Date(latest.date + 'T12:00:00')
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Models most needing a score ───────────────────────────────────────────────

export interface ModelScorePriority {
  model: Model
  unscoredClips: import('./types').Clip[]
  daysSince: number | null
  totalClips: number
}

export function modelsNeedingScore(data: AppData, n = 6): ModelScorePriority[] {
  return data.models
    .filter((m) => !m.archived)
    .map((m) => {
      const clips = data.clips.filter((c) => c.modelId === m.id)
      const unscored = clips.filter((c) => !data.scorecards.some((s) => s.clipId === c.id))
      return {
        model: m,
        unscoredClips: unscored,
        daysSince: daysSinceLastScore(data, m.id),
        totalClips: clips.length,
      }
    })
    .filter((e) => e.unscoredClips.length > 0 || (e.totalClips > 0 && e.daysSince !== null && e.daysSince > 2))
    .sort((a, b) => {
      const aScore = a.unscoredClips.length * 1000 + (a.daysSince ?? 9999)
      const bScore = b.unscoredClips.length * 1000 + (b.daysSince ?? 9999)
      return bScore - aScore
    })
    .slice(0, n)
}

// ── Today's scoring count ─────────────────────────────────────────────────────

export function todayScoredCount(data: AppData): number {
  const today = new Date().toISOString().slice(0, 10)
  return data.scorecards.filter((c) => c.date === today).length
}
