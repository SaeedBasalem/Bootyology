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
    // Represent as "tastefulness": 0 deduction => 100, -15 => 0
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

/** Build the leaderboard. Only models with at least one scorecard are ranked. */
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

/** Average score for each criterion across all scorecards (for the Insights view). */
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

/** Most improved model: largest positive delta between first and latest scorecard. */
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
