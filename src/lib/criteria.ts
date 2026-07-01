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
 * The 12-criterion CM Bootyology assessment v2.
 * Maximum positive total = 165. Nudity is a deduction (range −20..0).
 * New criteria: Skin Quality (#9) and Authenticity (#10).
 */
export const CRITERIA: Criterion[] = [
  {
    key: 'bootyShape',
    num: 1,
    label: 'Booty Shape & Form',
    short: 'Shape',
    focus: 'Roundness, proportion to waist/thighs, symmetry, lift, fullness',
    min: 0,
    max: 25,
    isDeduction: false,
    bands: [
      { min: 22, max: 25, label: 'Impeccable — perfectly round, highly defined, ideal lift from every angle' },
      { min: 17, max: 21, label: 'Excellent roundness and strong symmetry; minor lack of fullness or evenness' },
      { min: 11, max: 16, label: 'Solid shape; noticeable imbalance or lack of consistent lift' },
      { min: 5,  max: 10, label: 'Limited roundness or poor waist-to-hip definition' },
      { min: 0,  max: 4,  label: 'Underdeveloped, little clear shape or proportional appeal' },
    ],
    samples: [
      'Exceptional roundness from profile and rear, textbook waist-hip ratio.',
      'Good symmetry but lacks upper-glute fullness.',
      'Strong in motion; less defined in still frames.',
    ],
  },
  {
    key: 'bootyMovement',
    num: 2,
    label: 'Booty Dynamics',
    short: 'Movement',
    focus: 'Isolation and control, bounce quality, fluidity, timing with the beat',
    min: 0,
    max: 25,
    isDeduction: false,
    bands: [
      { min: 22, max: 25, label: 'Perfect isolation and control — hypnotic, rhythmic bounce that stops time' },
      { min: 17, max: 21, label: 'Strong movement with clear rhythm; minor stiffness or brief loss of isolation' },
      { min: 11, max: 16, label: 'Good motion but uneven bounce or inconsistent timing with the beat' },
      { min: 5,  max: 10, label: 'Limited or awkward movement; lacks flow and natural energy' },
      { min: 0,  max: 4,  label: 'Barely moves or moves off-beat; no real dynamic quality' },
    ],
    samples: [
      'Fluid transitions, mesmerising slow-wave control.',
      'Smooth tempo control, impressive multi-directional bounce.',
      'Strong hip isolation on side-facing moves.',
    ],
  },
  {
    key: 'dancePerformance',
    num: 3,
    label: 'Stage Performance',
    short: 'Dance',
    focus: 'Creativity, use of space, flow between moves, confidence, stage IQ',
    min: 0,
    max: 20,
    isDeduction: false,
    bands: [
      { min: 17, max: 20, label: 'Confident and immersive — fluid transitions, commands the entire space' },
      { min: 13, max: 16, label: 'Strong presence; some pauses or minor repetition but generally compelling' },
      { min: 8,  max: 12, label: 'Good rhythm but basic execution; creative moments are inconsistent' },
      { min: 3,  max: 7,  label: 'Slow or disconnected movements; lacks energy or spatial awareness' },
      { min: 0,  max: 2,  label: 'Hesitant, uncoordinated, or barely engaging as a performance' },
    ],
    samples: [
      'High energy sustained throughout; every move felt intentional.',
      'Strong start, energy dropped mid-clip.',
      'Creative use of space with clear artistic intent.',
    ],
  },
  {
    key: 'bodyHarmony',
    num: 4,
    label: 'Body Proportions',
    short: 'Harmony',
    focus: 'Waist-hip-shoulder balance, smooth transitions, muscle tone, overall alignment',
    min: 0,
    max: 15,
    isDeduction: false,
    bands: [
      { min: 13, max: 15, label: 'Seamless, perfectly balanced figure — form and movement align beautifully' },
      { min: 10, max: 12, label: 'Strong curves with great transitions; very minor misalignment' },
      { min: 7,  max: 9,  label: 'Noticeable proportional imbalance or awkward transitions between body parts' },
      { min: 4,  max: 6,  label: 'Body feels disjointed; parts do not complement each other in motion' },
      { min: 0,  max: 3,  label: 'Poor harmony — form and motion clash or distract from the performance' },
    ],
    samples: ['Perfectly balanced figure, every curve feeds the next.', 'Strong curves, slight upper-body imbalance.'],
  },
  {
    key: 'sexAppeal',
    num: 5,
    label: 'Sexual Magnetism',
    short: 'Magnetism',
    focus: 'Charisma, confidence, eye contact, emotional tension, unforced allure',
    min: 0,
    max: 15,
    isDeduction: false,
    bands: [
      { min: 13, max: 15, label: 'Magnetic and unforgettable — commands attention with ease and unforced allure' },
      { min: 10, max: 12, label: 'Clearly confident and flirty with genuine charisma; minor awkwardness' },
      { min: 7,  max: 9,  label: 'Reserved but presentable; some moments of real charm' },
      { min: 4,  max: 6,  label: 'Rigid or non-engaging energy; minimal connection with the viewer' },
      { min: 0,  max: 3,  label: 'No real appeal or chemistry; performance feels indifferent' },
    ],
    samples: ['Magnetic, unforgettable presence.', 'Confident and flirty throughout with strong eye play.'],
  },
  {
    key: 'sensuality',
    num: 6,
    label: 'Sensual Energy',
    short: 'Sensual',
    focus: 'Confidence, body language, eye contact, flow, emotional depth',
    min: 0,
    max: 15,
    isDeduction: false,
    bands: [
      { min: 14, max: 15, label: 'Maximum sensual power — hypnotic, fluid, deeply expressive' },
      { min: 11, max: 13, label: 'High sensual energy with strong, confident presence' },
      { min: 8,  max: 10, label: 'Clear sensual elements with memorable moments of connection' },
      { min: 5,  max: 7,  label: 'Moderate sensuality; some consistency but also flat patches' },
      { min: 2,  max: 4,  label: 'Light or subtle sensual presence — understated and passive' },
      { min: 0,  max: 1,  label: 'None — stiff or disconnected from the sensual dimension' },
    ],
    samples: [
      'Smooth movements, overpowering sensual vibe.',
      'Subtle yet powerful — not forced or exaggerated.',
      'Playful and confident with excellent body control.',
    ],
  },
  {
    key: 'faceBeauty',
    num: 7,
    label: 'Facial Allure',
    short: 'Face',
    focus: 'Symmetry, expressiveness, makeup quality, camera connection',
    min: 0,
    max: 10,
    isDeduction: false,
    bands: [
      { min: 9, max: 10, label: 'Stunning — expressive, photogenic, and aesthetically magnetic' },
      { min: 7, max: 8,  label: 'Beautiful with strong appeal; slightly muted expressiveness' },
      { min: 5, max: 6,  label: 'Cute and presentable but not particularly captivating' },
      { min: 3, max: 4,  label: 'Unrefined look or poor angle choices in the clip' },
      { min: 0, max: 2,  label: 'Little notable facial appeal or camera connection' },
    ],
    samples: [
      'Perfectly balanced features, expressive eyes connect with the viewer.',
      'Heavy makeup somewhat obscures natural expression.',
      'Confident gaze and strong bone structure.',
    ],
  },
  {
    key: 'presentation',
    num: 8,
    label: 'Aesthetic & Styling',
    short: 'Styling',
    focus: 'Outfit fit, colour palette, hair and makeup coordination, theme relevance',
    min: 0,
    max: 10,
    isDeduction: false,
    bands: [
      { min: 9, max: 10, label: 'Perfectly styled, on-theme, every detail is intentional and visually strong' },
      { min: 7, max: 8,  label: 'Strong styling with minor mismatches; largely elevates the performance' },
      { min: 5, max: 6,  label: "Basic styling that doesn't significantly enhance or harm the look" },
      { min: 3, max: 4,  label: 'Poor fit or distracting elements that detract from the performance' },
      { min: 0, max: 2,  label: 'Disorganized, off-theme, or styling effort clearly lacking' },
    ],
    samples: [
      'Outfit hugs perfectly, motion reads beautifully through fabric.',
      'Colour flatters skin tone; fabric a little bulky in motion.',
      'Great use of texture and layering.',
    ],
  },
  {
    key: 'skinQuality',
    num: 9,
    label: 'Skin Quality',
    short: 'Skin',
    focus: "Radiance, smoothness, evenness, visual appeal in the clip's lighting",
    min: 0,
    max: 10,
    isDeduction: false,
    bands: [
      { min: 9, max: 10, label: 'Flawless and radiant — skin is a genuine highlight of the performance' },
      { min: 7, max: 8,  label: 'Healthy and appealing; very minor blemishes or uneven areas' },
      { min: 5, max: 6,  label: 'Average; neither a positive nor a negative visual factor' },
      { min: 3, max: 4,  label: 'Noticeable imperfections or unflattering lighting draws attention' },
      { min: 0, max: 2,  label: 'Skin quality significantly detracts from the overall visual impression' },
    ],
    samples: [
      "Glowing under the clip's lighting — effortlessly radiant.",
      'Clear and healthy; consistent tone throughout.',
      'Minor uneven patches, not distracting.',
    ],
  },
  {
    key: 'authenticity',
    num: 10,
    label: 'Authenticity',
    short: 'Authentic',
    focus: 'Genuineness, unique personal identity, natural ease vs. performance posturing',
    min: 0,
    max: 10,
    isDeduction: false,
    bands: [
      { min: 9, max: 10, label: 'Completely genuine and natural — performance feels effortless and uniquely personal' },
      { min: 7, max: 8,  label: 'Mostly authentic with strong individual identity; minor forced moments' },
      { min: 5, max: 6,  label: 'Some authentic elements but noticeable performance posturing exists' },
      { min: 3, max: 4,  label: 'Mostly performative; lacks a distinct personal voice or identity' },
      { min: 0, max: 2,  label: 'Feels scripted or forced; indistinguishable from imitating others' },
    ],
    samples: [
      'Feels like her natural element — zero self-consciousness.',
      'Strong personal signature throughout the clip.',
      'Genuine energy with a couple of overly rehearsed moments.',
    ],
  },
  {
    key: 'nudity',
    num: 11,
    label: 'Nudity (Deduction)',
    short: 'Tasteful',
    focus: 'Level of exposure and whether it is gradual, tasteful, and fits the scene',
    min: -20,
    max: 0,
    isDeduction: true,
    bands: [
      { min: 0,   max: 0,   label: 'Stays clothed — lingerie, bikini, sheer, or tasteful coverage' },
      { min: -7,  max: -7,  label: 'Partial nudity; reveal is gradual and tasteful' },
      { min: -13, max: -13, label: 'High exposure; covering is minimal' },
      { min: -20, max: -20, label: 'Fully nude; artistic restraint largely absent' },
    ],
    samples: [
      'Stayed tasteful and on-tone throughout.',
      'Reveal felt too sudden — broke the build-up.',
      'Exposure overshadowed the performance quality.',
    ],
  },
  {
    key: 'perfectBodyBonus',
    num: 12,
    label: 'CM Gold Bonus',
    short: 'Bonus',
    focus: 'Unexpected excellence, iconic moments, showmanship, bold artistic choices that elevate the whole',
    min: 0,
    max: 10,
    isDeduction: false,
    bands: [
      { min: 10, max: 10, label: 'Historic — jaw-dropping, completely above and beyond all expectations' },
      { min: 7,  max: 9,  label: 'Strong standout moment or unexpected excellence that elevates the whole clip' },
      { min: 4,  max: 6,  label: 'Memorable detail, signature flair, or bold artistic choice worth rewarding' },
      { min: 1,  max: 3,  label: 'Minor extra effort; one small thing that deserves acknowledgement' },
      { min: 0,  max: 0,  label: 'No extra dimension to reward — score stands as-is' },
    ],
    samples: [
      'A moment that will be remembered — completely unexpected and perfect.',
      'Signature move that defines the clip.',
      'Bold styling choice that paid off completely.',
    ],
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
export const MAX_TOTAL = CRITERIA.reduce((sum, c) => sum + (c.isDeduction ? 0 : c.max), 0) // 165

export function emptyScores(): Scores {
  return CRITERIA.reduce((acc, c) => {
    acc[c.key] = 0
    return acc
  }, {} as Scores)
}

/** Find the descriptive band that matches a given value for a criterion. */
export function bandFor(criterion: Criterion, value: number): Band | undefined {
  return criterion.bands.find((b) => value >= b.min && value <= b.max)
}
