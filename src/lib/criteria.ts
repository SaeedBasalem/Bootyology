import type { CriterionKey, Scores } from './types'

export interface Band {
  min: number
  max: number
  label: string
}

export interface Criterion {
  key: CriterionKey
  num: number
  label: string
  short: string // compact label for charts
  focus: string
  min: number
  max: number
  isDeduction: boolean
  bands: Band[]
  samples: string[]
}

/**
 * The 10-criterion assessment, transcribed from the personal scoring system.
 * Maximum positive total = 110; Nudity is a deduction (range -15..0).
 */
export const CRITERIA: Criterion[] = [
  {
    key: 'bootyShape',
    num: 1,
    label: 'Booty Shape',
    short: 'Shape',
    focus: 'Roundness, proportion to waist/thighs, symmetry, lift',
    min: 0,
    max: 20,
    isDeduction: false,
    bands: [
      { min: 17, max: 20, label: 'Impeccable shape, highly defined, round from all angles' },
      { min: 13, max: 16, label: 'Excellent roundness, slight imbalance or less fullness' },
      { min: 9, max: 12, label: 'Moderate roundness, noticeable lack of lift or consistency' },
      { min: 5, max: 8, label: 'Flat or uneven shape, poor definition' },
      { min: 0, max: 4, label: 'Underdeveloped, little clear shape or proportion' },
    ],
    samples: [
      'Exceptional roundness from profile and rear.',
      'Good symmetry but lacks upper-glute fullness.',
      'Excellent waist-to-hip ratio.',
    ],
  },
  {
    key: 'bootyMovement',
    num: 2,
    label: 'Booty Movement',
    short: 'Movement',
    focus: 'Isolation and control, bounce/fluidity, timing with the beat',
    min: 0,
    max: 20,
    isDeduction: false,
    bands: [
      { min: 17, max: 20, label: 'Perfect control, hypnotic bounce, mesmerizing movement' },
      { min: 13, max: 16, label: 'Strong movement, clear rhythm, minor stiffness' },
      { min: 9, max: 12, label: 'Good motion but uneven bounce or weak isolation' },
      { min: 5, max: 8, label: 'Limited or awkward, lacks flow' },
      { min: 0, max: 4, label: 'Barely moves or moves off-beat' },
    ],
    samples: [
      'Very fluid transitions.',
      'Smooth tempo control, impressive bounce.',
      'Strong hip isolation on side-facing moves.',
    ],
  },
  {
    key: 'dancePerformance',
    num: 3,
    label: 'Dance Performance',
    short: 'Dance',
    focus: 'Creativity, use of space, flow between moves, confidence',
    min: 0,
    max: 15,
    isDeduction: false,
    bands: [
      { min: 13, max: 15, label: 'Confident, immersive, fluid transitions' },
      { min: 10, max: 12, label: 'Strong presence, some pauses or repetition' },
      { min: 7, max: 9, label: 'Good rhythm but basic or unsure execution' },
      { min: 4, max: 6, label: 'Slow or disconnected movements' },
      { min: 0, max: 3, label: 'Hesitant, uncoordinated, or barely dancing' },
    ],
    samples: [
      'High energy sustained throughout.',
      'Strong start, energy dropped mid-way.',
      'Creative use of space, danced with intent.',
    ],
  },
  {
    key: 'bodyHarmony',
    num: 4,
    label: 'Body Harmony',
    short: 'Harmony',
    focus: 'Proportion, smooth transitions, tone, overall alignment',
    min: 0,
    max: 10,
    isDeduction: false,
    bands: [
      { min: 9, max: 10, label: 'Seamless flow, perfectly balanced figure' },
      { min: 7, max: 8, label: 'Strong curves, slight misalignment' },
      { min: 5, max: 6, label: 'Noticeable imbalance' },
      { min: 3, max: 4, label: 'Body feels disjointed' },
      { min: 0, max: 2, label: 'Poor harmony, distracting proportions' },
    ],
    samples: ['Perfectly balanced figure.', 'Strong curves, slight misalignment.'],
  },
  {
    key: 'sexAppeal',
    num: 5,
    label: 'Sex Appeal',
    short: 'Appeal',
    focus: 'Charisma, confidence, eye contact, subtle (not vulgar) sensuality',
    min: 0,
    max: 10,
    isDeduction: false,
    bands: [
      { min: 9, max: 10, label: 'Magnetic presence, unforgettable appeal' },
      { min: 7, max: 8, label: 'Clearly confident and flirty, minor awkwardness' },
      { min: 5, max: 6, label: 'Reserved but presentable' },
      { min: 3, max: 4, label: 'Rigid or non-engaging energy' },
      { min: 0, max: 2, label: 'No real appeal or connection' },
    ],
    samples: ['Magnetic, unforgettable presence.', 'Confident and flirty throughout.'],
  },
  {
    key: 'presentation',
    num: 6,
    label: 'Presentation & Styling',
    short: 'Styling',
    focus: 'Outfit fit, colour palette, hair/makeup, theme relevance',
    min: 0,
    max: 10,
    isDeduction: false,
    bands: [
      { min: 9, max: 10, label: 'Perfectly styled, on-theme, visually strong' },
      { min: 7, max: 8, label: 'Strong styling, minor mismatches' },
      { min: 5, max: 6, label: "Basic styling, doesn't elevate the look" },
      { min: 3, max: 4, label: 'Poor fit or distracting elements' },
      { min: 0, max: 2, label: 'Disorganized or off-theme' },
    ],
    samples: [
      'Outfit hugs perfectly, motion reads well.',
      'Colour flatters skin tone but fabric a little bulky.',
      'Great use of texture.',
    ],
  },
  {
    key: 'faceBeauty',
    num: 7,
    label: 'Face Beauty',
    short: 'Face',
    focus: 'Symmetry/uniqueness, expressions, makeup, overall aesthetic fit',
    min: 0,
    max: 10,
    isDeduction: false,
    bands: [
      { min: 9, max: 10, label: 'Stunning, expressive and photogenic' },
      { min: 7, max: 8, label: 'Beautiful but slightly muted' },
      { min: 5, max: 6, label: 'Cute but not very expressive' },
      { min: 3, max: 4, label: 'Unrefined look or poor angles' },
      { min: 0, max: 2, label: 'Little notable facial appeal' },
    ],
    samples: [
      'Balanced and expressive, makeup enhances naturally.',
      'Heavy makeup hides expression.',
      'Eyes connect well with the viewer.',
    ],
  },
  {
    key: 'nudity',
    num: 8,
    label: 'Nudity',
    short: 'Tasteful',
    focus: 'Level of exposure and whether it is gradual, tasteful, and fits the scene',
    min: -15,
    max: 0,
    isDeduction: true,
    bands: [
      { min: 0, max: 0, label: 'Stays clothed (lingerie, bikini, sheer, etc.)' },
      { min: -5, max: -5, label: 'Partial nudity, remains tasteful' },
      { min: -10, max: -10, label: 'High exposure, minimal covering' },
      { min: -15, max: -15, label: 'Fully nude, little artistic restraint left' },
    ],
    samples: [
      'Stayed tasteful and on-tone.',
      'Reveal felt too sudden, broke the build-up.',
      'Exposure overshadowed the performance.',
    ],
  },
  {
    key: 'sensuality',
    num: 9,
    label: 'Sensuality',
    short: 'Sensual',
    focus: 'Confidence, body language, eye contact, flow, authenticity',
    min: 0,
    max: 10,
    isDeduction: false,
    bands: [
      { min: 10, max: 10, label: 'Maximum sensual power; hypnotic, fluid, expressive' },
      { min: 8, max: 9, label: 'High sensual vibe with strong presence' },
      { min: 6, max: 7, label: 'Clear sensual elements, memorable moments' },
      { min: 4, max: 5, label: 'Moderate sensuality, some consistency' },
      { min: 2, max: 3, label: 'Light or subtle presence' },
      { min: 0, max: 1, label: 'None; stiff or disconnected' },
    ],
    samples: [
      'Smooth movements, strong sensual vibe.',
      'Subtle yet powerful — not forced.',
      'Playful and confident with good control.',
    ],
  },
  {
    key: 'perfectBodyBonus',
    num: 10,
    label: 'Perfect Body Bonus',
    short: 'Bonus',
    focus: 'Unexpected tricks, standout expression, showmanship, bold choices',
    min: 0,
    max: 5,
    isDeduction: false,
    bands: [
      { min: 5, max: 5, label: 'Went above and beyond expectations' },
      { min: 3, max: 4, label: 'Memorable detail or standout flair' },
      { min: 1, max: 2, label: 'Minor extra effort' },
      { min: 0, max: 0, label: 'No extra dimension to reward' },
    ],
    samples: ['Went above and beyond.', 'A memorable standout moment.'],
  },
]

export const CRITERIA_BY_KEY: Record<CriterionKey, Criterion> = CRITERIA.reduce(
  (acc, c) => {
    acc[c.key] = c
    return acc
  },
  {} as Record<CriterionKey, Criterion>,
)

/** Max achievable total (Nudity = 0 deduction). */
export const MAX_TOTAL = CRITERIA.reduce((sum, c) => sum + (c.isDeduction ? 0 : c.max), 0) // 110

export function emptyScores(): Scores {
  return CRITERIA.reduce((acc, c) => {
    acc[c.key] = c.isDeduction ? 0 : 0
    return acc
  }, {} as Scores)
}

/** Find the descriptive band that matches a given value for a criterion. */
export function bandFor(criterion: Criterion, value: number): Band | undefined {
  return criterion.bands.find((b) => value >= b.min && value <= b.max)
}
