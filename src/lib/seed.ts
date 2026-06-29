import type { AppData, Model, Round, Scorecard, Scores } from './types'
import { computeTotal } from './scoring'

/**
 * Seed data drawn from the personal write-up so the app feels alive on first
 * launch. Everything here can be edited, re-scored, or wiped from the Data tab.
 * Moneca is the documented #1, the curvy icons follow, then the originals.
 */
function mk(scores: Partial<Scores>): Scores {
  return {
    bootyShape: 0,
    bootyMovement: 0,
    dancePerformance: 0,
    bodyHarmony: 0,
    sexAppeal: 0,
    presentation: 0,
    faceBeauty: 0,
    nudity: 0,
    sensuality: 0,
    perfectBodyBonus: 0,
    ...scores,
  }
}

const now = new Date().toISOString()

const models: Model[] = [
  {
    id: 'm_moneca',
    name: 'Moneca Doll Paradise',
    emoji: '👑',
    accent: '#e3bc63',
    tags: ['Favourite', 'Number One'],
    discoveredYear: 2018,
    notes: 'The number one. The benchmark every round is measured against.',
    favorite: true,
    archived: false,
    createdAt: now,
  },
  {
    id: 'm_tiffany',
    name: 'Tiffany Days',
    emoji: '💎',
    accent: '#8ab6d9',
    tags: ['Favourite', 'BBW'],
    discoveredYear: 2019,
    notes: 'One of the curvy icons that got me into the BBW space.',
    favorite: true,
    archived: false,
    createdAt: now,
  },
  {
    id: 'm_jazzmine',
    name: 'Jazzmine Jonez',
    emoji: '🎷',
    accent: '#c98ad9',
    tags: ['Favourite', 'BBW'],
    discoveredYear: 2019,
    notes: 'A curvy icon — part of what opened up the BBW appreciation.',
    favorite: true,
    archived: false,
    createdAt: now,
  },
  {
    id: 'm_paula',
    name: 'Paula Curvez',
    emoji: '🌹',
    accent: '#d98aae',
    tags: ['Favourite'],
    discoveredYear: 2019,
    notes: 'Unforgettable — always in the conversation.',
    favorite: true,
    archived: false,
    createdAt: now,
  },
  {
    id: 'm_tammy',
    name: 'Tammy Love',
    emoji: '💗',
    accent: '#d98a8a',
    tags: ['Favourite', 'Original'],
    discoveredYear: 2017,
    notes: 'One of the first two I ever discovered — where it all started.',
    favorite: true,
    archived: false,
    createdAt: now,
  },
  {
    id: 'm_rosee',
    name: 'Rosee Divine',
    emoji: '🌺',
    accent: '#8ad9b0',
    tags: ['Favourite', 'Original'],
    discoveredYear: 2017,
    notes: 'One of the first two discovered — kicked off this whole interest.',
    favorite: true,
    archived: false,
    createdAt: now,
  },
]

const rounds: Round[] = [
  {
    id: 'r_debut',
    name: 'Debut Round',
    date: '2025-09-14',
    notes: 'The opening round — establishing a baseline for the favourites.',
    createdAt: now,
  },
  {
    id: 'r_gold',
    name: 'Golden Hour',
    date: '2026-02-01',
    notes: 'Warm-toned styling theme, second pass on the roster.',
    createdAt: now,
  },
]

interface SeedCard {
  modelId: string
  roundId: string
  date: string
  scores: Scores
  comments?: string
}

const rawCards: SeedCard[] = [
  // Debut round
  {
    modelId: 'm_moneca',
    roundId: 'r_debut',
    date: '2025-09-14',
    scores: mk({
      bootyShape: 19,
      bootyMovement: 19,
      dancePerformance: 14,
      bodyHarmony: 10,
      sexAppeal: 10,
      presentation: 9,
      faceBeauty: 10,
      nudity: 0,
      sensuality: 10,
      perfectBodyBonus: 5,
    }),
    comments: 'Impeccable from every angle, hypnotic control, stayed tasteful. The standard.',
  },
  {
    modelId: 'm_tiffany',
    roundId: 'r_debut',
    date: '2025-09-14',
    scores: mk({
      bootyShape: 18,
      bootyMovement: 16,
      dancePerformance: 12,
      bodyHarmony: 9,
      sexAppeal: 9,
      presentation: 8,
      faceBeauty: 9,
      nudity: 0,
      sensuality: 9,
      perfectBodyBonus: 4,
    }),
    comments: 'Exceptional roundness, smooth tempo control, great presence.',
  },
  {
    modelId: 'm_jazzmine',
    roundId: 'r_debut',
    date: '2025-09-14',
    scores: mk({
      bootyShape: 17,
      bootyMovement: 16,
      dancePerformance: 12,
      bodyHarmony: 8,
      sexAppeal: 9,
      presentation: 8,
      faceBeauty: 8,
      nudity: 0,
      sensuality: 9,
      perfectBodyBonus: 3,
    }),
    comments: 'Strong bounce and rhythm, confident energy throughout.',
  },
  {
    modelId: 'm_paula',
    roundId: 'r_debut',
    date: '2025-09-14',
    scores: mk({
      bootyShape: 17,
      bootyMovement: 15,
      dancePerformance: 11,
      bodyHarmony: 8,
      sexAppeal: 8,
      presentation: 8,
      faceBeauty: 9,
      nudity: 0,
      sensuality: 8,
      perfectBodyBonus: 3,
    }),
    comments: 'Great waist-to-hip ratio, flatters every outfit.',
  },
  {
    modelId: 'm_tammy',
    roundId: 'r_debut',
    date: '2025-09-14',
    scores: mk({
      bootyShape: 16,
      bootyMovement: 14,
      dancePerformance: 11,
      bodyHarmony: 8,
      sexAppeal: 8,
      presentation: 7,
      faceBeauty: 8,
      nudity: 0,
      sensuality: 8,
      perfectBodyBonus: 2,
    }),
    comments: 'Where it started — warm, confident, consistent.',
  },
  {
    modelId: 'm_rosee',
    roundId: 'r_debut',
    date: '2025-09-14',
    scores: mk({
      bootyShape: 17,
      bootyMovement: 15,
      dancePerformance: 12,
      bodyHarmony: 8,
      sexAppeal: 9,
      presentation: 8,
      faceBeauty: 9,
      nudity: 0,
      sensuality: 8,
      perfectBodyBonus: 3,
    }),
    comments: 'Divine indeed — strong all-rounder, eyes connect well.',
  },
  // Golden Hour round — small movements
  {
    modelId: 'm_moneca',
    roundId: 'r_gold',
    date: '2026-02-01',
    scores: mk({
      bootyShape: 20,
      bootyMovement: 19,
      dancePerformance: 15,
      bodyHarmony: 10,
      sexAppeal: 10,
      presentation: 10,
      faceBeauty: 10,
      nudity: 0,
      sensuality: 10,
      perfectBodyBonus: 5,
    }),
    comments: 'Even better. Perfectly on-theme styling, went above and beyond.',
  },
  {
    modelId: 'm_tiffany',
    roundId: 'r_gold',
    date: '2026-02-01',
    scores: mk({
      bootyShape: 18,
      bootyMovement: 17,
      dancePerformance: 13,
      bodyHarmony: 9,
      sexAppeal: 9,
      presentation: 9,
      faceBeauty: 9,
      nudity: 0,
      sensuality: 9,
      perfectBodyBonus: 4,
    }),
    comments: 'Stepped up the dance and styling noticeably.',
  },
  {
    modelId: 'm_rosee',
    roundId: 'r_gold',
    date: '2026-02-01',
    scores: mk({
      bootyShape: 18,
      bootyMovement: 16,
      dancePerformance: 13,
      bodyHarmony: 9,
      sexAppeal: 9,
      presentation: 9,
      faceBeauty: 9,
      nudity: 0,
      sensuality: 9,
      perfectBodyBonus: 4,
    }),
    comments: 'Real improvement in flow and confidence.',
  },
  {
    modelId: 'm_jazzmine',
    roundId: 'r_gold',
    date: '2026-02-01',
    scores: mk({
      bootyShape: 17,
      bootyMovement: 16,
      dancePerformance: 13,
      bodyHarmony: 9,
      sexAppeal: 9,
      presentation: 8,
      faceBeauty: 8,
      nudity: 0,
      sensuality: 9,
      perfectBodyBonus: 4,
    }),
    comments: 'Consistent and a touch sharper than the debut.',
  },
]

const scorecards: Scorecard[] = rawCards.map((c, i) => ({
  id: `sc_seed_${i}`,
  modelId: c.modelId,
  roundId: c.roundId,
  date: c.date,
  scores: c.scores,
  total: computeTotal(c.scores),
  comments: c.comments,
  createdAt: now,
}))

const defaultJudgeProfile = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  totalSessions: 0,
  gooning: 0,
  unexpectedOrgasms: 0,
}

export function seedData(): AppData {
  return {
    version: 1,
    models,
    rounds,
    scorecards,
    clips: [],
    settings: { theme: 'dark', rankBy: 'average', judgeName: 'Loyalty' },
    judgeProfile: defaultJudgeProfile,
    dailyChallenges: [],
    calendarEvents: [],
  }
}
