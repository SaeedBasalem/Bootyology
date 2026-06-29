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
  emoji: string // avatar glyph / initials fallback handled in UI
  accent: string // hex accent for the avatar ring
  tags: string[]
  discoveredYear?: number
  notes?: string
  favorite: boolean
  archived: boolean
  createdAt: string
}

export interface Round {
  id: string
  name: string // theme name, e.g. "Summer Beach"
  date: string // ISO date
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
  clipId?: string // the clip that was judged for this verdict (optional)
  createdAt: string
}

export type ClipSource = 'file' | 'link'

export interface Clip {
  id: string
  modelId: string
  title: string
  source: ClipSource
  url?: string // for source 'link'
  fileName?: string // for source 'file' (blob lives in IndexedDB under the clip id)
  mimeType?: string
  size?: number // bytes, for 'file'
  roundId?: string // optional themed round this clip belongs to
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
