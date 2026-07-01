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
 * The 17-criterion CM Bootyology assessment v3.
 * Maximum positive total = 700. Nudity is a deduction (range −40..0).
 */
export const CRITERIA: Criterion[] = [
  // ── BOOTY BLOCK (260 pts) ──────────────────────────────────────────────────
  {
    key: 'bootyShape',
    num: 1,
    label: 'Booty Shape & Form',
    short: 'Shape',
    focus: 'Roundness, proportion to waist and thighs, symmetry, lift, fullness from every angle',
    min: 0,
    max: 80,
    isDeduction: false,
    bands: [
      { min: 70, max: 80, label: 'Iconic — perfectly round, highly defined, textbook lift and symmetry from every angle' },
      { min: 55, max: 69, label: 'Excellent roundness and strong symmetry; very minor lack of fullness or evenness' },
      { min: 35, max: 54, label: 'Solid shape; noticeable imbalance or inconsistent lift in certain angles' },
      { min: 15, max: 34, label: 'Limited roundness or poor waist-to-hip definition' },
      { min: 0,  max: 14, label: 'Underdeveloped, little clear shape or proportional appeal' },
    ],
    samples: [
      'Exceptional roundness from profile and rear, textbook waist-hip ratio.',
      'Good symmetry but lacks upper-glute fullness in still frames.',
      'Strong in motion; less defined at rest.',
    ],
  },
  {
    key: 'bootyMovement',
    num: 2,
    label: 'Booty Dynamics & Movement',
    short: 'Dynamics',
    focus: 'Natural fluidity of movement, rhythmic timing with the beat, multi-directional range',
    min: 0,
    max: 70,
    isDeduction: false,
    bands: [
      { min: 62, max: 70, label: 'Hypnotic, fully rhythmic movement — stops time, flows in every direction' },
      { min: 48, max: 61, label: 'Strong movement with clear rhythm; minor stiffness or brief loss of flow' },
      { min: 30, max: 47, label: 'Good motion but uneven or inconsistent timing with the beat' },
      { min: 12, max: 29, label: 'Limited or awkward movement; lacks natural flow and energy' },
      { min: 0,  max: 11, label: 'Barely moves or moves off-beat; no real dynamic quality' },
    ],
    samples: [
      'Fluid transitions, mesmerising slow-wave control.',
      'Smooth tempo control, impressive multi-directional bounce.',
      'Strong hip isolation on side-facing moves.',
    ],
  },
  {
    key: 'bootyIsolation',
    num: 3,
    label: 'Booty Isolation & Control',
    short: 'Isolation',
    focus: 'Independent glute control, precision of isolation from the rest of the body, deliberate muscle engagement',
    min: 0,
    max: 60,
    isDeduction: false,
    bands: [
      { min: 53, max: 60, label: 'Elite isolation — each cheek moves independently with surgical precision' },
      { min: 41, max: 52, label: 'Strong isolation with clear deliberate control; minor spillover to upper body' },
      { min: 25, max: 40, label: 'Visible isolation attempts; inconsistent or limited independent control' },
      { min: 10, max: 24, label: 'Little evidence of intentional isolation; body moves as one unit' },
      { min: 0,  max: 9,  label: 'No isolation visible — movement is completely uncontrolled or absent' },
    ],
    samples: [
      'Each cheek moves independently — precision that takes years to develop.',
      'Strong left-right alternation, slight lack of upper-body separation.',
      'Good twerk isolation but loses control on faster beats.',
    ],
  },
  {
    key: 'bounceQuality',
    num: 4,
    label: 'Bounce & Jiggle Quality',
    short: 'Bounce',
    focus: 'Natural elasticity, jiggle physics, sustained bounce without stiffening, visual impact of each rep',
    min: 0,
    max: 50,
    isDeduction: false,
    bands: [
      { min: 44, max: 50, label: 'Extraordinary — natural, elastic, sustained bounce with hypnotic visual impact' },
      { min: 34, max: 43, label: 'Excellent jiggle quality; consistent elasticity throughout the clip' },
      { min: 20, max: 33, label: 'Good natural movement; bounce fades or stiffens under sustained repetition' },
      { min: 8,  max: 19, label: 'Limited bounce; jiggle is minimal or unconvincing' },
      { min: 0,  max: 7,  label: 'No notable bounce — static or artificially stiff' },
    ],
    samples: [
      'Sustained elastic bounce from first rep to last — physics doing the work.',
      'Great initial jiggle, loses momentum mid-clip.',
      'Natural but modest — more about wave than raw bounce.',
    ],
  },
  // ── MOVEMENT BLOCK (150 pts) ──────────────────────────────────────────────
  {
    key: 'stagePerformance',
    num: 5,
    label: 'Full Body Stage Performance',
    short: 'Stage',
    focus: 'Overall choreography, use of space, creativity, energy consistency, stage IQ and command',
    min: 0,
    max: 60,
    isDeduction: false,
    bands: [
      { min: 53, max: 60, label: 'Commanding — immersive full-body performance, every transition is intentional' },
      { min: 41, max: 52, label: 'Strong presence and energy; some minor hesitation or repetition' },
      { min: 25, max: 40, label: 'Good rhythm but basic execution; creative moments are inconsistent' },
      { min: 10, max: 24, label: 'Slow or disconnected movements; lacks spatial awareness or sustained energy' },
      { min: 0,  max: 9,  label: 'Hesitant, uncoordinated, or barely engaging as a full performance' },
    ],
    samples: [
      'High energy sustained throughout; every move felt intentional.',
      'Strong start, energy dropped mid-clip.',
      'Creative use of space with clear artistic intent.',
    ],
  },
  {
    key: 'hipWaistMovement',
    num: 6,
    label: 'Hip & Waist Movement',
    short: 'Hips',
    focus: 'Fluid hip circles, waist rolls, figure-8 patterns, undulation quality and timing',
    min: 0,
    max: 50,
    isDeduction: false,
    bands: [
      { min: 44, max: 50, label: 'Mesmerising — fluid hip circles and waist rolls that command full attention' },
      { min: 34, max: 43, label: 'Strong hip control with good rhythm; minor stiffness in transitions' },
      { min: 20, max: 33, label: 'Clear hip movement; limited range or repetitive patterns only' },
      { min: 8,  max: 19, label: 'Minimal hip engagement; movement is stiff or barely present' },
      { min: 0,  max: 7,  label: 'No meaningful hip or waist movement visible' },
    ],
    samples: [
      'Waist rolls into hip circles seamlessly — total fluid mastery.',
      'Great figure-8 patterns, waist undulation slightly rigid.',
      'Consistent hip sways but no deeper isolation work.',
    ],
  },
  {
    key: 'bodyWave',
    num: 7,
    label: 'Body Wave & Fluidity',
    short: 'Wave',
    focus: 'Full-body undulation, spine fluidity, sequential joint movement from head to hips',
    min: 0,
    max: 40,
    isDeduction: false,
    bands: [
      { min: 35, max: 40, label: 'Full-body wave mastery — spine, chest, hips and arms all connected in one fluid motion' },
      { min: 27, max: 34, label: 'Strong wave quality; minor breaks in the sequential flow' },
      { min: 16, max: 26, label: 'Some fluidity present; wave is incomplete or starts and stops' },
      { min: 6,  max: 15, label: 'Little continuity; upper and lower body move independently without connection' },
      { min: 0,  max: 5,  label: 'No body wave or fluid connection evident' },
    ],
    samples: [
      'Spine undulation travels from neck to tailbone without a single break.',
      'Strong chest wave, connection to the hips is slightly delayed.',
      'Arms incorporated beautifully into the full-body flow.',
    ],
  },
  // ── BODY REVEAL BLOCK (120 pts) ────────────────────────────────────────────
  {
    key: 'bodyRevealStyle',
    num: 8,
    label: 'Body Reveal & Teasing Style',
    short: 'Reveal',
    focus: 'How the body is shown and teased — angle choices, outfit use, pacing of reveal, deliberate framing',
    min: 0,
    max: 60,
    isDeduction: false,
    bands: [
      { min: 53, max: 60, label: 'Artful and deliberate — every reveal is timed perfectly, angles are masterfully chosen' },
      { min: 41, max: 52, label: 'Strong teasing instinct; most angles and reveals land with real impact' },
      { min: 25, max: 40, label: 'Some intentional revealing moments; pacing could be tighter' },
      { min: 10, max: 24, label: 'Minimal deliberate teasing; reveals feel accidental rather than strategic' },
      { min: 0,  max: 9,  label: 'No clear body-reveal awareness or artful framing' },
    ],
    samples: [
      'Turns at exactly the right moment — every angle feels engineered.',
      'Great outfit use; the back-to-camera walk is perfectly timed.',
      'Instinctive teasing style, no formal training but high natural awareness.',
    ],
  },
  {
    key: 'bodyHarmony',
    num: 9,
    label: 'Body Proportions & Curvature',
    short: 'Curves',
    focus: 'Waist-hip-shoulder balance, muscle tone distribution, symmetry of curves, overall silhouette',
    min: 0,
    max: 40,
    isDeduction: false,
    bands: [
      { min: 35, max: 40, label: 'Seamlessly balanced figure — ideal curvature and proportion from every angle' },
      { min: 27, max: 34, label: 'Strong curves with great silhouette; very minor imbalance' },
      { min: 16, max: 26, label: 'Noticeable proportional imbalance or inconsistent tone distribution' },
      { min: 6,  max: 15, label: 'Body feels disjointed; curves do not complement each other harmoniously' },
      { min: 0,  max: 5,  label: 'Poor proportions — form distracts rather than enhances' },
    ],
    samples: [
      'Perfectly balanced figure, every curve feeds the next.',
      'Strong hourglass, slight inconsistency in upper-body tone.',
    ],
  },
  {
    key: 'skinQuality',
    num: 10,
    label: 'Skin Quality',
    short: 'Skin',
    focus: "Radiance, smoothness, evenness, visual appeal in the clip's lighting",
    min: 0,
    max: 20,
    isDeduction: false,
    bands: [
      { min: 18, max: 20, label: 'Flawless and radiant — skin is a genuine standout of the performance' },
      { min: 14, max: 17, label: 'Healthy and appealing; very minor blemishes or uneven areas' },
      { min: 9,  max: 13, label: 'Average; neither a positive nor a negative visual factor' },
      { min: 4,  max: 8,  label: 'Noticeable imperfections or unflattering lighting draws attention' },
      { min: 0,  max: 3,  label: 'Skin quality significantly detracts from the visual impression' },
    ],
    samples: [
      "Glowing under the clip's lighting — effortlessly radiant.",
      'Clear and healthy; consistent tone throughout.',
      'Minor uneven patches, not distracting.',
    ],
  },
  // ── APPEAL BLOCK (100 pts) ────────────────────────────────────────────────
  {
    key: 'sexAppeal',
    num: 11,
    label: 'Sexual Magnetism',
    short: 'Magnetism',
    focus: 'Charisma, confidence, eye contact, emotional tension, unforced allure, viewer pull',
    min: 0,
    max: 40,
    isDeduction: false,
    bands: [
      { min: 35, max: 40, label: 'Magnetic and unforgettable — commands attention with ease and unforced allure' },
      { min: 27, max: 34, label: 'Clearly confident and charismatic with genuine appeal; minor awkwardness' },
      { min: 16, max: 26, label: 'Reserved but presentable; some genuine charm in key moments' },
      { min: 6,  max: 15, label: 'Rigid or non-engaging energy; minimal viewer connection' },
      { min: 0,  max: 5,  label: 'No real appeal or chemistry; performance feels indifferent' },
    ],
    samples: [
      'Magnetic, unforgettable presence — impossible to look away.',
      'Confident and flirty throughout with strong eye play.',
    ],
  },
  {
    key: 'sensuality',
    num: 12,
    label: 'Sensual Energy',
    short: 'Sensual',
    focus: 'Emotional depth, body language confidence, slow deliberate control, intimate connection with the viewer',
    min: 0,
    max: 40,
    isDeduction: false,
    bands: [
      { min: 35, max: 40, label: 'Maximum sensual power — hypnotic, fluid, deeply expressive throughout' },
      { min: 27, max: 34, label: 'High sensual energy with strong, confident presence and real depth' },
      { min: 16, max: 26, label: 'Clear sensual elements with memorable moments of connection' },
      { min: 6,  max: 15, label: 'Moderate sensuality; some consistency but also flat patches' },
      { min: 0,  max: 5,  label: 'None — stiff or disconnected from the sensual dimension' },
    ],
    samples: [
      'Smooth movements, overpowering sensual vibe.',
      'Subtle yet powerful — not forced or exaggerated.',
      'Playful and confident with excellent body awareness.',
    ],
  },
  {
    key: 'authenticity',
    num: 13,
    label: 'Authenticity',
    short: 'Authentic',
    focus: 'Genuineness, unique personal identity, natural ease vs. performance posturing',
    min: 0,
    max: 20,
    isDeduction: false,
    bands: [
      { min: 18, max: 20, label: 'Completely genuine — performance feels effortless and uniquely personal' },
      { min: 14, max: 17, label: 'Mostly authentic with strong individual identity; minor forced moments' },
      { min: 9,  max: 13, label: 'Some authentic elements but noticeable performance posturing exists' },
      { min: 4,  max: 8,  label: 'Mostly performative; lacks a distinct personal voice' },
      { min: 0,  max: 3,  label: 'Feels scripted or forced; indistinguishable from imitating others' },
    ],
    samples: [
      'Feels like her natural element — zero self-consciousness.',
      'Strong personal signature throughout the clip.',
      'Genuine energy with a couple of overly rehearsed moments.',
    ],
  },
  // ── DETAILS BLOCK (50 pts) ────────────────────────────────────────────────
  {
    key: 'faceBeauty',
    num: 14,
    label: 'Facial Allure',
    short: 'Face',
    focus: 'Symmetry, expressiveness, makeup quality, camera connection and eye presence',
    min: 0,
    max: 30,
    isDeduction: false,
    bands: [
      { min: 27, max: 30, label: 'Stunning — expressive, photogenic, and aesthetically magnetic on camera' },
      { min: 21, max: 26, label: 'Beautiful with strong appeal; slightly muted expressiveness' },
      { min: 13, max: 20, label: 'Cute and presentable but not particularly captivating' },
      { min: 5,  max: 12, label: 'Unrefined look or poor angle choices showing the face' },
      { min: 0,  max: 4,  label: 'Little notable facial appeal or camera connection' },
    ],
    samples: [
      'Perfectly balanced features, expressive eyes connect with the viewer.',
      'Heavy makeup somewhat obscures natural expression.',
      'Confident gaze and strong bone structure.',
    ],
  },
  {
    key: 'presentation',
    num: 15,
    label: 'Outfit & Styling',
    short: 'Styling',
    focus: 'Outfit fit, colour palette, hair and makeup coordination, theme relevance, visual enhancement',
    min: 0,
    max: 20,
    isDeduction: false,
    bands: [
      { min: 18, max: 20, label: 'Perfectly styled, on-theme, every detail intentional and visually strong' },
      { min: 14, max: 17, label: 'Strong styling with minor mismatches; largely elevates the performance' },
      { min: 9,  max: 13, label: "Basic styling that doesn't significantly enhance or harm the look" },
      { min: 4,  max: 8,  label: 'Poor fit or distracting elements that detract from the performance' },
      { min: 0,  max: 3,  label: 'Disorganized, off-theme, or styling effort clearly lacking' },
    ],
    samples: [
      'Outfit hugs perfectly, motion reads beautifully through fabric.',
      'Colour flatters skin tone; fabric a little bulky in motion.',
      'Great use of texture and layering.',
    ],
  },
  // ── DEDUCTION ────────────────────────────────────────────────────────────
  {
    key: 'nudity',
    num: 16,
    label: 'Nudity (Deduction)',
    short: 'Tasteful',
    focus: 'Level of exposure and whether it is gradual, tasteful, and fits the scene — tasteful scores 0',
    min: -40,
    max: 0,
    isDeduction: true,
    bands: [
      { min: 0,   max: 0,   label: 'Stays clothed — lingerie, bikini, sheer, or tasteful coverage: no deduction' },
      { min: -13, max: -13, label: 'Partial nudity; reveal is gradual but notable' },
      { min: -27, max: -27, label: 'High exposure; covering is minimal' },
      { min: -40, max: -40, label: 'Fully nude; artistic restraint largely absent' },
    ],
    samples: [
      'Stayed tasteful and on-tone throughout.',
      'Reveal felt too sudden — broke the build-up.',
      'Exposure overshadowed the performance quality.',
    ],
  },
  // ── BONUS ────────────────────────────────────────────────────────────────
  {
    key: 'perfectBodyBonus',
    num: 17,
    label: 'CM Gold Bonus',
    short: 'Bonus',
    focus: 'Unexpected excellence, iconic moments, showmanship, bold artistic choices that elevate the whole',
    min: 0,
    max: 20,
    isDeduction: false,
    bands: [
      { min: 20, max: 20, label: 'Historic — jaw-dropping, completely above and beyond all expectations' },
      { min: 14, max: 19, label: 'Strong standout moment or unexpected excellence that elevates the entire clip' },
      { min: 8,  max: 13, label: 'Memorable detail, signature flair, or bold artistic choice worth rewarding' },
      { min: 1,  max: 7,  label: 'Minor extra effort; one small thing that deserves acknowledgement' },
      { min: 0,  max: 0,  label: 'No extra dimension to reward — score stands as-is' },
    ],
    samples: [
      'A moment that will be remembered — completely unexpected and perfect.',
      'Signature move that defines the entire clip.',
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
export const MAX_TOTAL = CRITERIA.reduce((sum, c) => sum + (c.isDeduction ? 0 : c.max), 0) // 700

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
