import type { AppData } from './types'
import { statsForModel, pct, levelFromXp, levelTitle, xpProgress, xpForNextLevel } from './scoring'
import { MAX_TOTAL } from './criteria'
import { todayISO } from './util'

export interface Achievement {
  id: string
  title: string
  desc: string
  icon: string
  achieved: boolean
  progress: number  // 0..1
  hint: string
  category: 'judging' | 'roster' | 'scoring' | 'ritual' | 'legend' | 'clips' | 'endurance'
}

export function getAchievements(data: AppData): Achievement[] {
  const activeModels = data.models.filter((m) => !m.archived)
  const modelCount = activeModels.length
  const cardCount = data.scorecards.length
  const roundCount = data.rounds.length
  const hasElite = data.scorecards.some((c) => pct(c.total) >= 90)
  const hasPerfectCategory = data.scorecards.some(
    (c) => c.scores.bootyShape === 25 || c.scores.bootyMovement === 25,
  )
  const bestAvg = Math.max(0, ...data.models.map((m) => statsForModel(data, m.id).average))
  const improved = data.models.some((m) => {
    const s = statsForModel(data, m.id)
    return s.rounds >= 2 && s.cards[s.cards.length - 1].total > s.cards[0].total
  })
  const detailedNotes = data.scorecards.filter((c) => (c.comments?.length ?? 0) > 40).length
  const hasPerfectScore = data.scorecards.some((c) => c.total >= MAX_TOTAL)
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

  // ── Clip stats ──────────────────────────────────────────────────────────
  const clipCount = data.clips.length
  const watchedClipCount = data.clips.filter(
    (c) => c.watchStatus === 'watched' || c.watchStatus === 'scored',
  ).length
  const scoredClipCount = data.clips.filter((c) => c.watchStatus === 'scored').length
  const favClipCount = data.clips.filter((c) => c.favorite).length
  const allModelsHaveClip =
    modelCount > 0 &&
    activeModels.every((m) => data.clips.some((c) => c.modelId === m.id))

  // ── Session / endurance stats (from scorecard reactions) ────────────────
  const cardsWithReaction = data.scorecards.filter((c) => c.reaction)
  const goonCardsCount = cardsWithReaction.filter((c) => c.reaction?.sessionType === 'gooning').length
  const unexpectedCardsCount = cardsWithReaction.filter((c) => c.reaction?.sessionType === 'unexpected_orgasm').length

  // Longest streak of scored sessions with no unexpected orgasm
  const consecutiveClean = (() => {
    const ordered = cardsWithReaction.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    let streak = 0; let max = 0
    for (const c of ordered) {
      if (c.reaction?.sessionType !== 'unexpected_orgasm') { streak++; max = Math.max(max, streak) }
      else streak = 0
    }
    return max
  })()

  const heldMajority =
    goonCardsCount > 0 && unexpectedCardsCount >= 0 && goonCardsCount > unexpectedCardsCount

  const ratio = (n: number, target: number) => Math.min(1, n / target)

  return [
    // ── Judging ──────────────────────────────────────────────────────────
    { id: 'first_card', title: 'First Verdict', desc: 'Log your very first scorecard.', icon: '📝', achieved: cardCount >= 1, progress: ratio(cardCount, 1), hint: `${Math.min(cardCount, 1)} / 1`, category: 'judging' },
    { id: 'cards_15', title: 'Dedicated Judge', desc: 'Complete 15 scorecards in total.', icon: '⚖️', achieved: cardCount >= 15, progress: ratio(cardCount, 15), hint: `${Math.min(cardCount, 15)} / 15`, category: 'judging' },
    { id: 'cards_50', title: 'High Volume Judge', desc: 'Complete 50 scorecards.', icon: '📊', achieved: cardCount >= 50, progress: ratio(cardCount, 50), hint: `${Math.min(cardCount, 50)} / 50`, category: 'judging' },
    { id: 'notes', title: 'Thoughtful Critic', desc: 'Write 5 detailed judge comments (40+ chars).', icon: '✍️', achieved: detailedNotes >= 5, progress: ratio(detailedNotes, 5), hint: `${Math.min(detailedNotes, 5)} / 5`, category: 'judging' },
    { id: 'rounds_3', title: 'Themed Trilogy', desc: 'Run 3 themed rounds.', icon: '🎬', achieved: roundCount >= 3, progress: ratio(roundCount, 3), hint: `${Math.min(roundCount, 3)} / 3`, category: 'judging' },

    // ── Roster ──────────────────────────────────────────────────────────
    { id: 'roster_5', title: 'Building the Roster', desc: 'Add 5 models to your roster.', icon: '🌟', achieved: modelCount >= 5, progress: ratio(modelCount, 5), hint: `${Math.min(modelCount, 5)} / 5`, category: 'roster' },
    { id: 'roster_12', title: 'Full House', desc: 'Grow your roster to 12 models.', icon: '🏛️', achieved: modelCount >= 12, progress: ratio(modelCount, 12), hint: `${Math.min(modelCount, 12)} / 12`, category: 'roster' },
    { id: 'roster_23', title: 'The Complete Roster', desc: 'Assemble all 23 models.', icon: '👑', achieved: modelCount >= 23, progress: ratio(modelCount, 23), hint: `${Math.min(modelCount, 23)} / 23`, category: 'roster' },
    { id: 'complete_profiles', title: 'Magazine Ready', desc: 'Complete full profiles for 5 models (photo + nationality + category).', icon: '📸', achieved: completeProfiles >= 5, progress: ratio(completeProfiles, 5), hint: `${Math.min(completeProfiles, 5)} / 5`, category: 'roster' },
    { id: 'all_clipped', title: "Everyone's On Film", desc: 'Link at least one clip to every active model.', icon: '🎥', achieved: allModelsHaveClip, progress: allModelsHaveClip ? 1 : ratio(activeModels.filter((m) => data.clips.some((c) => c.modelId === m.id)).length, Math.max(1, modelCount)), hint: allModelsHaveClip ? 'Unlocked' : `${activeModels.filter((m) => data.clips.some((c) => c.modelId === m.id)).length} / ${modelCount}`, category: 'roster' },

    // ── Scoring ──────────────────────────────────────────────────────────
    { id: 'elite', title: "Bootyologist's Eye", desc: 'Award a score in the Elite band (90%+).', icon: '👑', achieved: hasElite, progress: hasElite ? 1 : Math.min(0.99, bestAvg ? pct(bestAvg) / 90 : 0), hint: hasElite ? 'Unlocked' : 'Locked', category: 'scoring' },
    { id: 'perfect_cat', title: 'Perfect Twenty', desc: 'Give a full 20/20 in Shape or Movement.', icon: '💯', achieved: hasPerfectCategory, progress: hasPerfectCategory ? 1 : 0, hint: hasPerfectCategory ? 'Unlocked' : 'Locked', category: 'scoring' },
    { id: 'perfectionist', title: 'The Perfectionist', desc: `Score a perfect ${MAX_TOTAL}/${MAX_TOTAL} — absolute maximum across all 12 criteria.`, icon: '🌠', achieved: hasPerfectScore, progress: hasPerfectScore ? 1 : 0, hint: hasPerfectScore ? 'Unlocked' : 'Locked', category: 'legend' },
    { id: 'improved', title: 'On the Rise', desc: 'Watch a model improve between two rounds.', icon: '📈', achieved: improved, progress: improved ? 1 : 0, hint: improved ? 'Unlocked' : 'Locked', category: 'scoring' },

    // ── Ritual ───────────────────────────────────────────────────────────
    { id: 'streak_3', title: 'Three-Day Ritual', desc: 'Judge on 3 consecutive days.', icon: '🔥', achieved: longestStreak >= 3, progress: ratio(longestStreak, 3), hint: `${Math.min(longestStreak, 3)} / 3 days`, category: 'ritual' },
    { id: 'streak_7', title: 'The Streak', desc: 'Maintain a 7-day judging streak.', icon: '⚡', achieved: longestStreak >= 7, progress: ratio(longestStreak, 7), hint: `${Math.min(longestStreak, 7)} / 7 days`, category: 'ritual' },
    { id: 'streak_30', title: 'The Obsession', desc: 'Keep a 30-day judging streak alive.', icon: '🌋', achieved: longestStreak >= 30, progress: ratio(longestStreak, 30), hint: `${Math.min(longestStreak, 30)} / 30 days`, category: 'legend' },
    { id: 'challenges_5', title: 'Daily Challenge Ace', desc: 'Complete 5 daily challenges.', icon: '🎯', achieved: challengesDone >= 5, progress: ratio(challengesDone, 5), hint: `${Math.min(challengesDone, 5)} / 5`, category: 'ritual' },
    { id: 'challenges_20', title: 'Challenge Champion', desc: 'Complete 20 daily challenges.', icon: '🏆', achieved: challengesDone >= 20, progress: ratio(challengesDone, 20), hint: `${Math.min(challengesDone, 20)} / 20`, category: 'ritual' },

    // ── Legend ───────────────────────────────────────────────────────────
    { id: 'loyal_fan', title: 'The Loyal Fan', desc: 'Same model holds #1 across 5 consecutive rounds.', icon: '👸', achieved: loyalFanCount >= 5, progress: ratio(loyalFanCount, 5), hint: `${Math.min(loyalFanCount, 5)} / 5 rounds`, category: 'legend' },

    // ── Clips ────────────────────────────────────────────────────────────
    { id: 'first_clip', title: 'First Clip Linked', desc: 'Add your first clip to the library.', icon: '🎞️', achieved: clipCount >= 1, progress: ratio(clipCount, 1), hint: `${Math.min(clipCount, 1)} / 1`, category: 'clips' },
    { id: 'clips_10', title: 'Clip Curator', desc: 'Build a library of 10 clips.', icon: '📂', achieved: clipCount >= 10, progress: ratio(clipCount, 10), hint: `${Math.min(clipCount, 10)} / 10`, category: 'clips' },
    { id: 'clips_50', title: 'The Archive', desc: 'Stockpile 50 clips across your models.', icon: '🗄️', achieved: clipCount >= 50, progress: ratio(clipCount, 50), hint: `${Math.min(clipCount, 50)} / 50`, category: 'clips' },
    { id: 'clips_100', title: 'The Vault', desc: 'A 100-clip personal vault. The work of a true collector.', icon: '🏦', achieved: clipCount >= 100, progress: ratio(clipCount, 100), hint: `${Math.min(clipCount, 100)} / 100`, category: 'legend' },
    { id: 'watched_5', title: 'Eyes Wide Open', desc: 'Watch 5 clips all the way through.', icon: '👁️', achieved: watchedClipCount >= 5, progress: ratio(watchedClipCount, 5), hint: `${Math.min(watchedClipCount, 5)} / 5`, category: 'clips' },
    { id: 'watched_25', title: 'Dedicated Viewer', desc: 'Watch 25 clips in full.', icon: '📺', achieved: watchedClipCount >= 25, progress: ratio(watchedClipCount, 25), hint: `${Math.min(watchedClipCount, 25)} / 25`, category: 'clips' },
    { id: 'watched_100', title: 'Screen Addict', desc: 'Watch 100 clips from start to finish.', icon: '🖥️', achieved: watchedClipCount >= 100, progress: ratio(watchedClipCount, 100), hint: `${Math.min(watchedClipCount, 100)} / 100`, category: 'legend' },
    { id: 'scored_clips_5', title: 'Clip Critic', desc: 'Score 5 clips with a full verdict.', icon: '🎬', achieved: scoredClipCount >= 5, progress: ratio(scoredClipCount, 5), hint: `${Math.min(scoredClipCount, 5)} / 5`, category: 'clips' },
    { id: 'scored_clips_20', title: 'The Evaluator', desc: 'Score 20 different clips.', icon: '📋', achieved: scoredClipCount >= 20, progress: ratio(scoredClipCount, 20), hint: `${Math.min(scoredClipCount, 20)} / 20`, category: 'clips' },
    { id: 'scored_clips_50', title: 'Professional Critic', desc: 'Score 50 clips. Your word carries weight.', icon: '🎖️', achieved: scoredClipCount >= 50, progress: ratio(scoredClipCount, 50), hint: `${Math.min(scoredClipCount, 50)} / 50`, category: 'legend' },
    { id: 'clip_fav_5', title: 'Curated Taste', desc: 'Mark 5 clips as favourite.', icon: '♥️', achieved: favClipCount >= 5, progress: ratio(favClipCount, 5), hint: `${Math.min(favClipCount, 5)} / 5`, category: 'clips' },

    // ── Endurance (gooning / control) ────────────────────────────────────
    { id: 'gooning_5', title: 'Deep in the Zone', desc: 'Log 5 gooning sessions.', icon: '🌀', achieved: goonCount >= 5, progress: ratio(goonCount, 5), hint: `${Math.min(goonCount, 5)} / 5`, category: 'endurance' },
    { id: 'gooning_10', title: 'Zone Master', desc: 'Log 10 gooning sessions.', icon: '🕳️', achieved: goonCount >= 10, progress: ratio(goonCount, 10), hint: `${Math.min(goonCount, 10)} / 10`, category: 'endurance' },
    { id: 'gooning_25', title: 'Into the Deep', desc: 'Log 25 gooning sessions. You know the feeling.', icon: '🌊', achieved: goonCount >= 25, progress: ratio(goonCount, 25), hint: `${Math.min(goonCount, 25)} / 25`, category: 'endurance' },
    { id: 'gooning_50', title: 'Gooner Hall of Fame', desc: 'Fifty gooning sessions. A legendary commitment.', icon: '🏅', achieved: goonCount >= 50, progress: ratio(goonCount, 50), hint: `${Math.min(goonCount, 50)} / 50`, category: 'legend' },
    { id: 'no_cum_3', title: 'Iron Will', desc: 'Go deep in 3 gooning sessions and hold back every time.', icon: '🛡️', achieved: goonCardsCount >= 3, progress: ratio(goonCardsCount, 3), hint: `${Math.min(goonCardsCount, 3)} / 3`, category: 'endurance' },
    { id: 'no_cum_10', title: 'Discipline Unlocked', desc: 'Hold back through 10 full goon sessions without losing control.', icon: '⚔️', achieved: goonCardsCount >= 10, progress: ratio(goonCardsCount, 10), hint: `${Math.min(goonCardsCount, 10)} / 10`, category: 'endurance' },
    { id: 'no_cum_25', title: 'Transcendent Control', desc: '25 successful goon sessions — always the judge, never the victim.', icon: '🧘', achieved: goonCardsCount >= 25, progress: ratio(goonCardsCount, 25), hint: `${Math.min(goonCardsCount, 25)} / 25`, category: 'legend' },
    { id: 'clean_streak_5', title: 'Streak of Control', desc: 'Five consecutive scored sessions with no unexpected orgasm.', icon: '💪', achieved: consecutiveClean >= 5, progress: ratio(consecutiveClean, 5), hint: `${Math.min(consecutiveClean, 5)} / 5 in a row`, category: 'endurance' },
    { id: 'clean_streak_10', title: 'Unbreakable', desc: 'Ten consecutive sessions — not one unexpected orgasm.', icon: '🔐', achieved: consecutiveClean >= 10, progress: ratio(consecutiveClean, 10), hint: `${Math.min(consecutiveClean, 10)} / 10 in a row`, category: 'legend' },
    { id: 'held_majority', title: 'The Discipline', desc: 'More successful goon sessions than unexpected orgasms — you are in control.', icon: '⚖️', achieved: heldMajority, progress: unexpectedCardsCount === 0 && goonCardsCount > 0 ? 1 : ratio(goonCardsCount, Math.max(1, unexpectedCardsCount + 1)), hint: `${goonCardsCount} goon vs ${unexpectedCardsCount} unexpected`, category: 'endurance' },
    { id: 'unexpected_3', title: 'Unexpected Glory', desc: 'Log 3 unexpected orgasm sessions.', icon: '✨', achieved: unexpectedCount >= 3, progress: ratio(unexpectedCount, 3), hint: `${Math.min(unexpectedCount, 3)} / 3`, category: 'endurance' },
    { id: 'unexpected_10', title: 'Surrendered', desc: 'Ten unexpected orgasm sessions — the clips have power over you.', icon: '💥', achieved: unexpectedCount >= 10, progress: ratio(unexpectedCount, 10), hint: `${Math.min(unexpectedCount, 10)} / 10`, category: 'legend' },
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
  { criterion: 'bodyHarmony' as const, title: 'Harmony Day', desc: 'How well does the full package come together? Judge Body Harmony above all else.' },
  { criterion: 'faceBeauty' as const, title: 'Face Card Day', desc: 'Face Beauty is the lens — eye contact, expression, and confidence in close shots.' },
]

export function generateDailyChallenge(data: AppData, date: string): import('./types').DailyChallenge | null {
  const existing = (data.dailyChallenges ?? []).find((c) => c.date === date)
  if (existing) return existing
  const active = data.models.filter((m) => !m.archived)
  if (!active.length) return null

  const day = new Date(date).getDay()   // 0=Sun, 1=Mon … 6=Sat
  const modelIndex = new Date(date).getDate() % active.length
  const focusIndex = new Date(date).getDate() % FOCUS_CHALLENGES.length
  const model = active[modelIndex]

  // Wednesday → Clip Watch challenge
  if (day === 3) {
    const clipsForModel = data.clips.filter((c) => c.modelId === model.id)
    const unwatchedClip = clipsForModel.find((c) => !c.watchStatus || c.watchStatus === 'unwatched')
    const targetClip = unwatchedClip ?? clipsForModel[0]
    if (targetClip) {
      return {
        id: `dc_${date}`,
        date,
        type: 'clip_watch',
        title: `Watch & Judge ${model.name}`,
        description: `Today's assignment: open ${model.name}'s clip "${targetClip.title}", watch it fully, and score her. No skipping.`,
        targetModelId: model.id,
        completed: false,
      }
    }
  }

  // Saturday → Goon challenge
  if (day === 6) {
    const lastGoon = data.scorecards
      .filter((c) => c.reaction?.sessionType === 'gooning')
      .slice(-1)[0]?.date ?? 'never'
    return {
      id: `dc_${date}`,
      date,
      type: 'goon_challenge',
      title: 'Goon Session — Hold the Line',
      description: `Go deep. Watch a clip in full, enter the zone — and hold back. Last goon session: ${lastGoon === 'never' ? 'never recorded' : lastGoon}. Log the session type as Gooning when you score.`,
      completed: false,
    }
  }

  // Monday / Thursday → Model rotation
  if (day === 1 || day === 4) {
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

  // All other days → Focus criterion
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
