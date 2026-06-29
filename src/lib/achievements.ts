import type { AppData } from './types'
import { statsForModel, pct, levelFromXp, levelTitle, xpProgress, xpForNextLevel } from './scoring'
import { todayISO } from './util'

export interface Achievement {
  id: string
  title: string
  desc: string
  icon: string
  achieved: boolean
  progress: number  // 0..1
  hint: string
  category: 'judging' | 'roster' | 'scoring' | 'ritual' | 'legend'
}

export function getAchievements(data: AppData): Achievement[] {
  const modelCount = data.models.filter((m) => !m.archived).length
  const cardCount = data.scorecards.length
  const roundCount = data.rounds.length
  const hasElite = data.scorecards.some((c) => pct(c.total) >= 90)
  const hasPerfectCategory = data.scorecards.some(
    (c) => c.scores.bootyShape === 20 || c.scores.bootyMovement === 20,
  )
  const bestAvg = Math.max(0, ...data.models.map((m) => statsForModel(data, m.id).average))
  const improved = data.models.some((m) => {
    const s = statsForModel(data, m.id)
    return s.rounds >= 2 && s.cards[s.cards.length - 1].total > s.cards[0].total
  })
  const detailedNotes = data.scorecards.filter((c) => (c.comments?.length ?? 0) > 40).length
  const hasPerfectScore = data.scorecards.some((c) => c.total >= 110)
  const { currentStreak: _cur, longestStreak } = data.judgeProfile ?? { currentStreak: 0, longestStreak: 0 }

  const loyalFanCount = (() => {
    const rounds = data.rounds.slice().sort((a, b) => a.date.localeCompare(b.date))
    let maxConsec = 0; let consec = 0; let lastWinner = ''
    for (const r of rounds) {
      const cards = data.scorecards.filter((c) => c.roundId === r.id)
      if (!cards.length) continue
      const winner = cards.slice().sort((a, b) => b.total - a.total)[0]?.modelId
      if (winner && winner === lastWinner) consec++
      else { consec = 1; lastWinner = winner ?? '' }
      if (consec > maxConsec) maxConsec = consec
    }
    return maxConsec
  })()

  const challengesDone = (data.dailyChallenges ?? []).filter((c) => c.completed).length
  const goonCount = data.judgeProfile?.gooning ?? 0
  const unexpectedCount = data.judgeProfile?.unexpectedOrgasms ?? 0
  const completeProfiles = data.models.filter(
    (m) => m.name && m.photoUrl && m.nationality && m.category && !m.archived,
  ).length

  const ratio = (n: number, target: number) => Math.min(1, n / target)

  return [
    { id: 'first_card', title: 'First Verdict', desc: 'Log your very first scorecard.', icon: '📝', achieved: cardCount >= 1, progress: ratio(cardCount, 1), hint: `${Math.min(cardCount, 1)} / 1`, category: 'judging' },
    { id: 'cards_15', title: 'Dedicated Judge', desc: 'Complete 15 scorecards in total.', icon: '⚖️', achieved: cardCount >= 15, progress: ratio(cardCount, 15), hint: `${Math.min(cardCount, 15)} / 15`, category: 'judging' },
    { id: 'cards_50', title: 'High Volume Judge', desc: 'Complete 50 scorecards.', icon: '📊', achieved: cardCount >= 50, progress: ratio(cardCount, 50), hint: `${Math.min(cardCount, 50)} / 50`, category: 'judging' },
    { id: 'notes', title: 'Thoughtful Critic', desc: 'Write 5 detailed judge comments (40+ chars).', icon: '✍️', achieved: detailedNotes >= 5, progress: ratio(detailedNotes, 5), hint: `${Math.min(detailedNotes, 5)} / 5`, category: 'judging' },
    { id: 'roster_5', title: 'Building the Roster', desc: 'Add 5 models to your roster.', icon: '🌟', achieved: modelCount >= 5, progress: ratio(modelCount, 5), hint: `${Math.min(modelCount, 5)} / 5`, category: 'roster' },
    { id: 'roster_12', title: 'Full House', desc: 'Grow your roster to 12 models.', icon: '🏛️', achieved: modelCount >= 12, progress: ratio(modelCount, 12), hint: `${Math.min(modelCount, 12)} / 12`, category: 'roster' },
    { id: 'complete_profiles', title: 'Magazine Ready', desc: 'Complete full profiles for 5 models (photo + nationality + category).', icon: '📸', achieved: completeProfiles >= 5, progress: ratio(completeProfiles, 5), hint: `${Math.min(completeProfiles, 5)} / 5`, category: 'roster' },
    { id: 'rounds_3', title: 'Themed Trilogy', desc: 'Run 3 themed rounds.', icon: '🎬', achieved: roundCount >= 3, progress: ratio(roundCount, 3), hint: `${Math.min(roundCount, 3)} / 3`, category: 'judging' },
    { id: 'elite', title: "Bootyologist's Eye", desc: 'Award a score in the Elite band (90%+).', icon: '👑', achieved: hasElite, progress: hasElite ? 1 : Math.min(0.99, bestAvg ? pct(bestAvg) / 90 : 0), hint: hasElite ? 'Unlocked' : 'Locked', category: 'scoring' },
    { id: 'perfect_cat', title: 'Perfect Twenty', desc: 'Give a full 20/20 in Shape or Movement.', icon: '💯', achieved: hasPerfectCategory, progress: hasPerfectCategory ? 1 : 0, hint: hasPerfectCategory ? 'Unlocked' : 'Locked', category: 'scoring' },
    { id: 'perfectionist', title: 'The Perfectionist', desc: 'Score a perfect 110/110 — absolute maximum.', icon: '🌠', achieved: hasPerfectScore, progress: hasPerfectScore ? 1 : 0, hint: hasPerfectScore ? 'Unlocked' : 'Locked', category: 'legend' },
    { id: 'improved', title: 'On the Rise', desc: 'Watch a model improve between two rounds.', icon: '📈', achieved: improved, progress: improved ? 1 : 0, hint: improved ? 'Unlocked' : 'Locked', category: 'scoring' },
    { id: 'streak_3', title: 'Three-Day Ritual', desc: 'Judge on 3 consecutive days.', icon: '🔥', achieved: longestStreak >= 3, progress: ratio(longestStreak, 3), hint: `${Math.min(longestStreak, 3)} / 3 days`, category: 'ritual' },
    { id: 'streak_7', title: 'The Streak', desc: 'Maintain a 7-day judging streak.', icon: '⚡', achieved: longestStreak >= 7, progress: ratio(longestStreak, 7), hint: `${Math.min(longestStreak, 7)} / 7 days`, category: 'ritual' },
    { id: 'challenges_5', title: 'Daily Challenge Ace', desc: 'Complete 5 daily challenges.', icon: '🎯', achieved: challengesDone >= 5, progress: ratio(challengesDone, 5), hint: `${Math.min(challengesDone, 5)} / 5`, category: 'ritual' },
    { id: 'gooning_5', title: 'Deep in the Zone', desc: 'Log 5 gooning sessions.', icon: '🌀', achieved: goonCount >= 5, progress: ratio(goonCount, 5), hint: `${Math.min(goonCount, 5)} / 5`, category: 'ritual' },
    { id: 'loyal_fan', title: 'The Loyal Fan', desc: 'Same model holds #1 across 5 consecutive rounds.', icon: '👸', achieved: loyalFanCount >= 5, progress: ratio(loyalFanCount, 5), hint: `${Math.min(loyalFanCount, 5)} / 5 rounds`, category: 'legend' },
    { id: 'unexpected', title: 'Unexpected Glory', desc: 'Log 3 unexpected orgasm sessions.', icon: '✨', achieved: unexpectedCount >= 3, progress: ratio(unexpectedCount, 3), hint: `${Math.min(unexpectedCount, 3)} / 3`, category: 'legend' },
  ] as Achievement[]
}

export function achievementSummary(data: AppData): { unlocked: number; total: number } {
  const all = getAchievements(data)
  return { unlocked: all.filter((a) => a.achieved).length, total: all.length }
}

export function encouragement(data: AppData): string {
  const cardCount = data.scorecards.length
  const streak = data.judgeProfile?.currentStreak ?? 0
  if (streak >= 3) return `Day ${streak} of your judging streak — the ritual is real. 🔥`
  const lines = [
    'A small, consistent hobby — kept in proportion, kept fun. 🌙',
    'Every round is just paying closer attention to what you enjoy.',
    'Your rankings, your lens. Beautifully documented.',
    'Consistency is what makes the notes worth keeping.',
    'A relaxing ritual at the end of the day — well earned.',
  ]
  if (cardCount === 0) return 'Welcome. Score your first round to bring the leaderboard to life. ✨'
  return lines[cardCount % lines.length]
}

export { levelFromXp, levelTitle, xpProgress, xpForNextLevel }

export interface JudgeLevelInfo {
  level: number
  title: string
  xp: number
  progress: number
  nextXp: number
  currentStreak: number
  longestStreak: number
}

export function getJudgeLevelInfo(data: AppData): JudgeLevelInfo {
  const jp = data.judgeProfile ?? { xp: 0, level: 1, currentStreak: 0, longestStreak: 0, lastActiveDate: '', totalSessions: 0, gooning: 0, unexpectedOrgasms: 0 }
  const level = levelFromXp(jp.xp)
  return {
    level,
    title: levelTitle(level),
    xp: jp.xp,
    progress: xpProgress(jp.xp, level),
    nextXp: xpForNextLevel(level),
    currentStreak: jp.currentStreak,
    longestStreak: jp.longestStreak,
  }
}

const FOCUS_CHALLENGES = [
  { criterion: 'bootyShape' as const, title: 'Shape Focus Day', desc: 'Pay extra attention to Booty Shape — rate it harder than usual.' },
  { criterion: 'bootyMovement' as const, title: 'Movement Focus Day', desc: 'Isolate Booty Movement above all other criteria today.' },
  { criterion: 'sensuality' as const, title: 'Sensuality Study', desc: "Today's lens: Sensuality. How fluid and authentic is the energy?" },
  { criterion: 'sexAppeal' as const, title: 'Charisma Test', desc: 'Rate Sex Appeal with extra precision — who commands the most presence?' },
  { criterion: 'dancePerformance' as const, title: 'Choreography Review', desc: 'Focus on Dance Performance — creativity, use of space, and confidence.' },
]

export function generateDailyChallenge(data: AppData, date: string): import('./types').DailyChallenge | null {
  const existing = (data.dailyChallenges ?? []).find((c) => c.date === date)
  if (existing) return existing
  const active = data.models.filter((m) => !m.archived)
  if (!active.length) return null
  const day = new Date(date).getDay()
  const modelIndex = new Date(date).getDate() % active.length
  const focusIndex = new Date(date).getDate() % FOCUS_CHALLENGES.length
  if (day === 1 || day === 4) {
    const model = active[modelIndex]
    const lastScored = data.scorecards.filter((c) => c.modelId === model.id).slice(-1)[0]?.date ?? 'never'
    return {
      id: `dc_${date}`,
      date,
      type: 'model_rotation',
      title: `Judge ${model.name} Today`,
      description: `Your daily rotation: score ${model.name}. Last judged: ${lastScored === 'never' ? 'never' : lastScored}.`,
      targetModelId: model.id,
      completed: false,
    }
  }
  const focus = FOCUS_CHALLENGES[focusIndex]
  return {
    id: `dc_${date}`,
    date,
    type: 'focus_criterion',
    title: focus.title,
    description: focus.desc,
    targetCriterion: focus.criterion,
    completed: false,
  }
}

export function todayChallenge(data: AppData): import('./types').DailyChallenge | null {
  return generateDailyChallenge(data, todayISO())
}
