export type CriterionKey =
  | 'bootyShape'
  | 'bootyMovement'
  | 'dancePerformance'
  | 'bodyHarmony'
  | 'sexAppeal'
  | 'presentation'
  | 'faceBeauty'
  | 'nudity'
  | 'sensuality'
  | 'perfectBodyBonus'

export type Scores = Record<CriterionKey, number>

export interface Model {
  id: string
  name: string
  aliases?: string
  emoji: string
  accent: string
  tags: string[]
  discoveredYear?: number
  notes?: string
  favorite: boolean
  archived: boolean
  // ── Extended profile (Chocolate Models Magazine) ──────────────────────────
  photoUrl?: string        // main profile photo URL
  photos?: string[]        // additional photo gallery URLs
  instagram?: string
  twitter?: string
  onlyfans?: string
  website?: string
  nationality?: string
  birthday?: string        // YYYY-MM-DD or free text
  measurements?: string    // e.g. "36-24-42"
  height?: string          // e.g. "5'6\""
  category?: string        // e.g. "BBW", "Latina", "MILF"
  workspace?: string       // defaults to "Chocolate Models Magazine"
  bio?: string             // extended biography
  linkedClipIds?: string[] // clips linked to this model from the queue
  createdAt: string
}

export interface Round {
  id: string
  name: string
  date: string
  notes?: string
  scheduledDate?: string   // for calendar events
  theme?: string
  createdAt: string
}

// ── Judge Reaction — filled in after watching a clip ──────────────────────────
export type SessionType = 'casual' | 'gooning' | 'unexpected_orgasm'

export interface JudgeReaction {
  positivity: number        // 0–10
  comfortability: number    // 0–10
  happiness: number         // 0–10
  sessionType: SessionType
  notes?: string
}

export interface Scorecard {
  id: string
  modelId: string
  clipId?: string           // primary scoring unit — the clip being judged
  roundId?: string          // legacy grouping field (optional)
  date: string
  scores: Scores
  total: number
  comments?: string
  reaction?: JudgeReaction
  createdAt: string
}

export type ClipSource = 'file' | 'link'
export type WatchStatus = 'unwatched' | 'watching' | 'watched' | 'scored'

export interface Clip {
  id: string
  modelId: string           // can be '__unlinked__' for queue clips
  title: string
  source: ClipSource
  url?: string
  fileName?: string
  mimeType?: string
  size?: number
  roundId?: string
  tags: string[]
  notes?: string
  favorite: boolean
  watchStatus?: WatchStatus
  queuePriority?: number    // for drag ranking in watch queue
  watchedAt?: string        // ISO date when marked watched
  createdAt: string
}

export interface Settings {
  theme: 'dark' | 'light'
  rankBy: 'average' | 'best' | 'latest'
  judgeName: string
}

// ── Judge Profile — XP and levelling system ───────────────────────────────────
export interface JudgeProfile {
  xp: number
  level: number             // computed from xp
  currentStreak: number     // consecutive days judged
  longestStreak: number
  lastActiveDate: string    // ISO date (YYYY-MM-DD)
  totalSessions: number
  gooning: number           // count of gooning sessions
  unexpectedOrgasms: number // count of unexpected orgasm sessions
}

// ── Daily Challenge ───────────────────────────────────────────────────────────
export type ChallengeType = 'focus_criterion' | 'model_rotation' | 'discovery' | 'marathon'

export interface DailyChallenge {
  id: string
  date: string              // YYYY-MM-DD
  type: ChallengeType
  title: string
  description: string
  targetModelId?: string
  targetCriterion?: CriterionKey
  completed: boolean
  completedAt?: string
}

// ── Calendar Event ────────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string
  date: string              // YYYY-MM-DD
  title: string
  type: 'round' | 'watch' | 'reminder'
  modelId?: string
  roundId?: string
  notes?: string
  completed: boolean
  createdAt: string
}

export interface AppData {
  version: number
  models: Model[]
  rounds: Round[]
  scorecards: Scorecard[]
  clips: Clip[]
  settings: Settings
  judgeProfile: JudgeProfile
  dailyChallenges: DailyChallenge[]
  calendarEvents: CalendarEvent[]
}
