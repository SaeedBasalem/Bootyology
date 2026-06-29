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
  createdAt: string
}

export interface Round {
  id: string
  name: string
  date: string
  notes?: string
  createdAt: string
}

export interface Scorecard {
  id: string
  modelId: string
  roundId: string
  date: string
  scores: Scores
  total: number
  comments?: string
  clipId?: string
  createdAt: string
}

export type ClipSource = 'file' | 'link'

export interface Clip {
  id: string
  modelId: string
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
  createdAt: string
}

export interface Settings {
  theme: 'dark' | 'light'
  rankBy: 'average' | 'best' | 'latest'
  judgeName: string
}

export interface AppData {
  version: number
  models: Model[]
  rounds: Round[]
  scorecards: Scorecard[]
  clips: Clip[]
  settings: Settings
}
