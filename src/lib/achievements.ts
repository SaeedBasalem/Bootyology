import type { AppData } from './types'
import { statsForModel, pct } from './scoring'

export interface Achievement {
  id: string
  title: string
  desc: string
  icon: string // emoji
  achieved: boolean
  progress: number // 0..1
  hint: string // progress text e.g. "3 / 10"
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

  const ratio = (n: number, target: number) => Math.min(1, n / target)

  const list: Achievement[] = [
    {
      id: 'first_card',
      title: 'First Verdict',
      desc: 'Log your very first scorecard.',
      icon: '📝',
      achieved: cardCount >= 1,
      progress: ratio(cardCount, 1),
      hint: `${Math.min(cardCount, 1)} / 1`,
    },
    {
      id: 'roster_5',
      title: 'Building the Roster',
      desc: 'Add 5 models to your roster.',
      icon: '🌟',
      achieved: modelCount >= 5,
      progress: ratio(modelCount, 5),
      hint: `${Math.min(modelCount, 5)} / 5`,
    },
    {
      id: 'roster_12',
      title: 'Full House',
      desc: 'Grow your roster to 12 models.',
      icon: '🏛️',
      achieved: modelCount >= 12,
      progress: ratio(modelCount, 12),
      hint: `${Math.min(modelCount, 12)} / 12`,
    },
    {
      id: 'rounds_3',
      title: 'Themed Trilogy',
      desc: 'Run 3 themed rounds.',
      icon: '🎬',
      achieved: roundCount >= 3,
      progress: ratio(roundCount, 3),
      hint: `${Math.min(roundCount, 3)} / 3`,
    },
    {
      id: 'cards_15',
      title: 'Dedicated Judge',
      desc: 'Complete 15 scorecards in total.',
      icon: '⚖️',
      achieved: cardCount >= 15,
      progress: ratio(cardCount, 15),
      hint: `${Math.min(cardCount, 15)} / 15`,
    },
    {
      id: 'elite',
      title: "Bootyologist's Eye",
      desc: 'Award a score in the Elite band (90%+).',
      icon: '👑',
      achieved: hasElite,
      progress: hasElite ? 1 : Math.min(0.99, bestAvg ? pct(bestAvg) / 90 : 0),
      hint: hasElite ? 'Unlocked' : 'Locked',
    },
    {
      id: 'perfect_cat',
      title: 'Perfect Twenty',
      desc: 'Give a full 20 in Shape or Movement.',
      icon: '💯',
      achieved: hasPerfectCategory,
      progress: hasPerfectCategory ? 1 : 0,
      hint: hasPerfectCategory ? 'Unlocked' : 'Locked',
    },
    {
      id: 'improved',
      title: 'On the Rise',
      desc: 'Watch a model improve between two rounds.',
      icon: '📈',
      achieved: improved,
      progress: improved ? 1 : 0,
      hint: improved ? 'Unlocked' : 'Locked',
    },
    {
      id: 'notes',
      title: 'Thoughtful Critic',
      desc: 'Write 5 detailed judge comments.',
      icon: '✍️',
      achieved: detailedNotes >= 5,
      progress: ratio(detailedNotes, 5),
      hint: `${Math.min(detailedNotes, 5)} / 5`,
    },
  ]

  return list
}

export function achievementSummary(data: AppData): { unlocked: number; total: number } {
  const all = getAchievements(data)
  return { unlocked: all.filter((a) => a.achieved).length, total: all.length }
}

/** Encouraging, rotating line for the dashboard header. */
export function encouragement(data: AppData): string {
  const cardCount = data.scorecards.length
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
