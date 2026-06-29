/**
 * Seed realistic scorecards for all 23 models across 5 rounds.
 * Moneca Doll Paradise stays #1 throughout.
 * Run: node scripts/seed-scores.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vfyzedlyveukjaukcekq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmeXplZGx5dmV1a2phdWtjZWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDU5MjksImV4cCI6MjA4ODAyMTkyOX0.ojqZrTULclfbd_PrU0VCP7E0ylJGLskdi53BUEwiC-w'
)

// ── Rounds ────────────────────────────────────────────────────────────────────
const ROUNDS = [
  { id: 'r_r1', name: 'Valentine Edition',    date: '2025-02-14', notes: 'First major round of 2025 — love is in the air.' },
  { id: 'r_r2', name: 'Spring Spectacular',   date: '2025-05-10', notes: 'Spring energy and fresh looks.' },
  { id: 'r_r3', name: 'Summer Heat',          date: '2025-08-20', notes: 'Peak summer — maximum fire.' },
  { id: 'r_r4', name: 'Fall Finale',          date: '2025-11-15', notes: 'End-of-year countdown begins.' },
  { id: 'r_r5', name: 'Spring Showcase 2026', date: '2026-03-22', notes: 'Opening round of the 2026 season.' },
]

// ── Score profiles per model ──────────────────────────────────────────────────
// Each entry: [r1, r2, r3, r4, r5] per criterion
// Criteria order: bootyShape, bootyMovement, dancePerformance, bodyHarmony,
//                 sexAppeal, presentation, faceBeauty, nudity, sensuality, perfectBodyBonus
// nudity values must be 0, -5, -10, or -15

const PROFILES = {
  // ── S Tier ──
  m_moneca: {
    scores: [
      [20,19,15,10,9,9,9,0,9,5],   // R1 → 105
      [19,19,14,9,9,9,9,0,9,4],    // R2 → 101
      [20,20,15,10,10,9,9,0,10,5], // R3 → 108
      [18,18,13,9,9,9,9,0,9,4],    // R4 → 98
      [19,19,14,9,10,9,9,0,9,5],   // R5 → 103
    ],
    comments: [
      'Unmatched presence and control. Pure goddess energy.',
      'Flawless fluidity as always. The standard all others are measured against.',
      'Possibly her best round ever — every criterion near perfect.',
      'Even on an off day she dominates the leaderboard effortlessly.',
      'Returned stronger than ever. The queen reclaims her throne.',
    ],
  },

  // ── A+ Tier ──
  m_tiffany: {
    scores: [
      [17,17,13,8,8,8,8,0,8,3],    // R1 → 90
      [16,17,12,8,8,8,8,0,8,3],    // R2 → 88
      [17,17,13,8,8,8,8,-5,8,4],   // R3 → 86
      [18,17,13,8,8,8,9,0,8,3],    // R4 → 92
      [17,16,13,8,8,8,8,0,8,3],    // R5 → 89
    ],
    comments: [
      'Effortlessly captivating. One of the most consistent performers.',
      'Strong showing — slightly reserved on stage presence.',
      'Outfit reveal distracted from an otherwise stunning performance.',
      'Best round yet — matched her movement perfectly with the music.',
      'Back to her best. Confident, rhythmic, magnetic.',
    ],
  },
  m_jazzmin: {
    scores: [
      [17,16,13,8,8,8,7,0,8,3],    // R1 → 88
      [16,16,12,8,8,8,8,0,8,3],    // R2 → 87
      [17,17,13,8,8,8,8,0,8,3],    // R3 → 90
      [16,16,12,8,8,8,7,0,8,3],    // R4 → 86
      [17,16,13,8,8,8,8,-5,8,4],   // R5 → 85
    ],
    comments: [
      'Incredible technique — bounce control is elite level.',
      'Consistent and powerful. Few can match her twerk variety.',
      'Peak performance — energy never dropped for a second.',
      'Solid round, slight repetition in the choreography.',
      'Still elite despite a brief wardrobe distraction.',
    ],
  },
  m_paola: {
    scores: [
      [16,16,12,8,8,8,9,0,8,3],    // R1 → 88
      [15,15,11,7,8,8,8,0,8,3],    // R2 → 83
      [16,16,12,8,8,8,9,0,8,3],    // R3 → 88
      [15,16,11,8,8,8,8,0,8,3],    // R4 → 85
      [16,15,12,8,8,8,9,0,8,3],    // R5 → 87
    ],
    comments: [
      'That face + that body is a rare combination of perfection.',
      'Slightly below peak but still an elite performer.',
      'Adorable and powerful — her facial expressions are unmatched.',
      'Strong mid-round performance. Face beauty stands out in every frame.',
      'Paola brings cuteness and fire in equal measure every time.',
    ],
  },

  // ── A Tier ──
  m_rosee: {
    scores: [
      [16,15,12,8,7,7,8,0,8,3],    // R1 → 84
      [15,14,11,7,7,7,7,0,7,3],    // R2 → 78
      [15,15,11,8,7,8,8,0,8,3],    // R3 → 83
      [14,15,11,7,7,7,7,0,7,3],    // R4 → 78
      [15,14,11,7,7,7,8,0,7,3],    // R5 → 79
    ],
    comments: [
      'One of the originals — her legacy speaks for itself.',
      'Slightly off pace this round but always watchable.',
      'Classic Rosee energy. Effortless and iconic.',
      'Good movement but needed more facial engagement.',
      'A founding goddess who still delivers the goods.',
    ],
  },
  m_scarlett: {
    scores: [
      [15,15,12,7,8,7,7,0,7,3],    // R1 → 81
      [14,14,11,7,7,7,7,-5,7,3],   // R2 → 72
      [15,15,11,7,8,7,7,0,7,3],    // R3 → 80
      [14,14,11,7,7,7,7,0,7,3],    // R4 → 77
      [15,14,11,7,7,7,7,0,7,3],    // R5 → 78
    ],
    comments: [
      'Scarlett brings exclusivity and polish to every scene.',
      'Reveal reduced artistic score — potential wasted.',
      'Great booty shape and styling — a strong showing.',
      'Reliable but needs more daring choreography.',
      'Consistent mid-to-high performer with standout styling.',
    ],
  },
  m_jada: {
    scores: [
      [15,14,11,7,7,7,7,0,7,3],    // R1 → 78
      [14,14,11,7,7,7,7,0,7,3],    // R2 → 77
      [15,14,11,7,7,7,7,0,7,3],    // R3 → 78
      [14,13,10,7,7,7,7,0,7,3],    // R4 → 75
      [15,14,11,7,7,7,7,0,7,3],    // R5 → 78
    ],
    comments: [
      'Jada Gemz brings real gems every performance.',
      'Solid mid-round consistency — reliable scorer.',
      'Bounced back from a slow start with great energy.',
      'Movement slightly off beat in spots — still impressive.',
      'A gem of a performer who never disappoints.',
    ],
  },

  // ── B+ Tier ──
  m_sugar: {
    scores: [
      [14,14,11,7,7,7,7,0,7,2],    // R1 → 76
      [13,13,10,6,6,7,6,0,6,3],    // R2 → 70
      [14,13,10,7,6,7,7,0,7,2],    // R3 → 73
      [14,14,10,6,7,6,6,0,7,2],    // R4 → 72
      [14,13,11,7,6,7,6,0,7,2],    // R5 → 73
    ],
    comments: [
      'Sugar Jones is sweet but packs a punch.',
      'Average round — movement lacked her usual snap.',
      'Good energy today, confident camera connection.',
      'Styling was on point even if choreography was basic.',
      'Steadily improving — more creative use of space needed.',
    ],
  },
  m_spicyj: {
    scores: [
      [13,13,10,6,7,6,6,0,6,2],    // R1 → 69
      [14,13,10,6,7,7,6,0,7,2],    // R2 → 72
      [13,13,10,6,6,6,6,-5,6,2],   // R3 → 63
      [14,14,10,6,7,7,6,0,7,2],    // R4 → 73
      [13,13,10,6,7,7,6,0,6,2],    // R5 → 70
    ],
    comments: [
      'Spicy J lives up to the name — unpredictable and fun.',
      'Best performance so far — dialled in on every criterion.',
      'Exposure affected the artistic score significantly.',
      'Excellent bounce control and camera chemistry.',
      'Spice level is high — consistency is the next step.',
    ],
  },
  m_asialov: {
    scores: [
      [13,13,10,6,6,6,6,0,6,2],    // R1 → 68
      [12,12,9,6,6,6,6,-5,6,2],    // R2 → 60
      [13,12,10,6,6,6,6,0,6,2],    // R3 → 67
      [13,13,9,6,6,6,6,0,6,2],     // R4 → 67
      [13,12,10,6,6,6,6,0,6,2],    // R5 → 67
    ],
    comments: [
      'Asia Lovey is exactly that — loving to watch.',
      'Wardrobe choice hurt this round — debut nudity deduction.',
      'Smooth and comfortable performer. Needs more boldness.',
      'Good isolation work — hip control stood out.',
      'Reliable B+ performer who could push higher with more flair.',
    ],
  },

  // ── B Tier ──
  m_strella: {
    scores: [
      [13,12,10,6,6,6,6,0,6,2],    // R1 → 67
      [12,12,9,5,6,6,5,0,6,2],     // R2 → 63
      [13,12,9,6,6,6,6,0,6,2],     // R3 → 66
      [12,12,9,6,6,6,6,0,6,2],     // R4 → 65
      [13,12,9,6,6,6,6,0,6,2],     // R5 → 66
    ],
    comments: [
      'Strella Kat moves with grace and rhythm.',
      'Slightly off form today — lacks her usual sparkle.',
      'Consistent mid-tier performance. Styling always on point.',
      'Good control but choreography needs more variety.',
      'A reliable performer who brings steady energy.',
    ],
  },
  m_kittylov: {
    scores: [
      [13,12,9,6,6,6,6,0,6,2],     // R1 → 66
      [12,11,9,5,5,6,5,-5,5,2],    // R2 → 55
      [12,12,9,6,6,6,6,0,6,2],     // R3 → 65
      [13,12,9,6,6,6,6,0,6,2],     // R4 → 66
      [12,12,9,6,6,6,6,0,6,2],     // R5 → 65
    ],
    comments: [
      'Kitty Lov is playful and expressive throughout.',
      'Exposure deduction hurt an otherwise decent round.',
      'Strong recovery — much more controlled this time.',
      'Fun energy and good booty shape. Face needs more expression.',
      'Middle-of-the-pack but always entertaining.',
    ],
  },
  m_jaymoney: {
    scores: [
      [12,12,9,6,5,6,6,0,5,2],     // R1 → 63
      [11,11,8,5,5,5,5,0,5,2],     // R2 → 57
      [12,11,9,5,5,6,5,0,5,2],     // R3 → 60
      [12,11,8,5,5,5,5,0,5,2],     // R4 → 58
      [12,11,9,5,5,5,5,0,5,2],     // R5 → 59
    ],
    comments: [
      'Jay Money brings steady value every round.',
      'Below average round — lacked the usual confidence.',
      'Improved movement from last time. Facial expression still missing.',
      'Serviceable performance but needs standout moments.',
      'Consistent but unspectacular — potential for more.',
    ],
  },
  m_herrr: {
    scores: [
      [11,11,8,5,5,5,5,0,5,2],     // R1 → 57
      [12,11,9,5,5,6,5,0,5,2],     // R2 → 60
      [11,11,8,5,5,5,5,-5,5,2],    // R3 → 52
      [12,11,9,5,5,5,5,0,5,2],     // R4 → 59
      [11,11,8,5,5,5,5,0,5,2],     // R5 → 57
    ],
    comments: [
      'Herrr brings understated confidence to the stage.',
      'Best round yet — small improvements across the board.',
      'Nudity deduction set her back from an otherwise OK showing.',
      'Solid mid-tier performance with good hip movement.',
      'Reliable but needs a signature move to stand out.',
    ],
  },
  m_sabella: {
    scores: [
      [11,10,8,5,5,5,5,0,5,2],     // R1 → 56
      [10,10,7,5,5,5,5,-5,5,2],    // R2 → 49
      [11,10,8,5,5,5,5,0,5,2],     // R3 → 56
      [10,10,8,5,5,5,5,0,5,2],     // R4 → 55
      [11,10,8,5,5,5,5,0,5,2],     // R5 → 56
    ],
    comments: [
      'The Real Sabella — authentic and grounded in her style.',
      'Wardrobe reveal hurt the score this time.',
      'Consistent comeback — back to solid form.',
      'Good harmony, could use more dynamic energy.',
      'Steady performer who knows her strengths.',
    ],
  },
  m_yrbrabi: {
    scores: [
      [11,11,8,5,5,5,5,0,5,2],     // R1 → 57
      [11,10,8,5,5,5,5,-5,5,2],    // R2 → 51
      [12,11,8,5,5,5,5,0,5,2],     // R3 → 58
      [11,11,8,5,5,5,5,0,5,2],     // R4 → 57
      [12,11,8,5,5,5,5,0,5,2],     // R5 → 58
    ],
    comments: [
      'YRB Rabi brings youth and raw energy every time.',
      'Deduction hurt but attitude was still strong.',
      'Improved form — movements sharper and more controlled.',
      'Reliable lower-tier performer. Growth trajectory is positive.',
      'YRB continues to improve round by round.',
    ],
  },

  // ── C Tier ──
  m_aqua: {
    scores: [
      [11,10,8,5,5,5,5,0,5,2],     // R1 → 56
      [10,10,7,5,5,5,5,0,5,2],     // R2 → 54
      [11,10,8,5,5,5,5,0,5,2],     // R3 → 56
      [10,10,8,5,5,5,5,-5,5,2],    // R4 → 50
      [11,10,8,5,5,5,5,0,5,2],     // R5 → 56
    ],
    comments: [
      'Aqua With a Choppa — raw energy and attitude.',
      'Basic round — needs more rehearsal and camera presence.',
      'Good booty shape for the tier. Performance needs polish.',
      'Reveal in R4 cost valuable points.',
      'Choppa energy is there — technique just needs work.',
    ],
  },
  m_ellie: {
    scores: [
      [10,10,8,5,5,5,5,0,5,2],     // R1 → 55
      [10,9,7,4,5,5,5,0,5,2],      // R2 → 52
      [10,10,7,5,5,5,5,0,5,2],     // R3 → 54
      [11,10,7,5,5,5,5,0,5,2],     // R4 → 55
      [10,10,7,5,5,5,5,0,5,2],     // R5 → 54
    ],
    comments: [
      'Elegance Ellie brings poise and class to the stage.',
      'Slightly off her game — lacked usual elegance.',
      'Graceful as always. Face and styling are her strong suits.',
      'Small improvement in booty movement this round.',
      'Refined and consistent — elegance is her brand.',
    ],
  },
  m_blackeur: {
    scores: [
      [10,10,7,5,5,5,5,0,5,2],     // R1 → 54
      [9,9,7,4,5,5,4,0,5,2],       // R2 → 50
      [10,10,7,5,5,5,5,-5,5,2],    // R3 → 49
      [10,9,7,5,5,5,5,0,5,2],      // R4 → 53
      [10,10,7,5,5,5,5,0,5,2],     // R5 → 54
    ],
    comments: [
      'Black Euro brings a unique European flair to the competition.',
      'Struggled to connect with the camera this round.',
      'Nudity reduced the score — otherwise decent booty work.',
      'Steady recovery round. Movement timing improving.',
      'Unique style, needs more confidence in delivery.',
    ],
  },
  m_asiaper: {
    scores: [
      [10,10,7,5,5,5,5,0,4,2],     // R1 → 53
      [9,9,7,4,4,5,4,0,4,2],       // R2 → 48
      [10,9,7,5,4,5,5,0,4,2],      // R3 → 51
      [10,9,7,5,4,5,5,0,4,2],      // R4 → 51
      [9,9,7,5,4,5,4,0,4,2],       // R5 → 49
    ],
    comments: [
      'Asia Perez has good instincts — technique is the next step.',
      'Below average round. Confidence needs building.',
      'Slight improvement in shape presentation.',
      'Consistent mid-low performer with moments of flair.',
      'Needs more energy in the performance to climb the rankings.',
    ],
  },
  m_juicy: {
    scores: [
      [10,9,7,5,5,5,4,0,4,2],      // R1 → 51
      [9,9,6,4,4,4,4,0,4,2],       // R2 → 46
      [10,9,7,5,5,5,4,0,4,2],      // R3 → 51
      [9,9,7,4,4,4,4,0,4,2],       // R4 → 47
      [10,9,7,4,5,5,4,0,4,2],      // R5 → 50
    ],
    comments: [
      'Dat Bitch Named Juicy brings attitude to the stage.',
      'Low energy round — performance felt rushed.',
      'Better focus and movement this time around.',
      'Needs more control in the twerk technique.',
      'Juicy by name, but performances need more juice.',
    ],
  },
  m_suglips: {
    scores: [
      [9,9,7,4,4,4,4,0,4,2],       // R1 → 47
      [10,9,7,4,4,5,4,0,4,2],      // R2 → 49
      [9,9,6,4,4,4,4,0,4,2],       // R3 → 46
      [9,9,7,4,4,5,4,0,4,2],       // R4 → 48
      [10,9,7,4,4,5,4,0,4,2],      // R5 → 49
    ],
    comments: [
      'Sug Lips — sweet presence but performance needs more depth.',
      'Best round yet — small but real improvement across categories.',
      'Energy dipped this round. Styling was the highlight.',
      'Solid effort. Consistency is building slowly.',
      'Progress is visible. Keep pushing for that big breakout.',
    ],
  },
  m_zarago: {
    scores: [
      [9,9,6,4,4,4,4,0,4,2],       // R1 → 46
      [8,8,6,4,4,4,4,0,4,2],       // R2 → 44
      [9,9,6,4,4,5,4,0,4,2],       // R3 → 47
      [9,8,6,4,4,4,4,0,4,2],       // R4 → 45
      [9,9,6,4,4,4,4,0,4,1],       // R5 → 45
    ],
    comments: [
      'Zara Go has natural charm but needs more stage control.',
      'Weakest performance so far — lacks energy and presence.',
      'Improvement noted in styling and booty shape display.',
      'Needs to work on isolation and timing.',
      'Foundations are there — needs to unlock her potential.',
    ],
  },
}

const KEYS = ['bootyShape','bootyMovement','dancePerformance','bodyHarmony','sexAppeal','presentation','faceBeauty','nudity','sensuality','perfectBodyBonus']

function buildScores(arr) {
  const s = {}
  KEYS.forEach((k, i) => { s[k] = arr[i] })
  return s
}

function computeTotal(arr) {
  return arr.reduce((a, b) => a + b, 0)
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

async function main() {
  // ── 1. Upsert rounds ──────────────────────────────────────────────────────
  console.log('\n🏆 Inserting rounds…')
  const { error: rErr } = await supabase.from('boo_rounds').upsert(
    ROUNDS.map(r => ({ ...r, created_at: `${r.date}T20:00:00Z` }))
  )
  if (rErr) { console.error('Round error:', rErr.message); return }
  console.log(`  ✅ ${ROUNDS.length} rounds saved`)

  // ── 2. Upsert scorecards ──────────────────────────────────────────────────
  console.log('\n📋 Inserting scorecards…')
  const cards = []
  for (const [modelId, profile] of Object.entries(PROFILES)) {
    for (let ri = 0; ri < ROUNDS.length; ri++) {
      const round = ROUNDS[ri]
      const arr = profile.scores[ri]
      const scores = buildScores(arr)
      const total = computeTotal(arr)
      cards.push({
        id: uid('sc'),
        model_id: modelId,
        round_id: round.id,
        date: round.date,
        scores,
        total,
        comments: profile.comments[ri] ?? '',
        created_at: `${round.date}T21:00:00Z`,
      })
    }
  }

  // Insert in batches of 50
  for (let i = 0; i < cards.length; i += 50) {
    const batch = cards.slice(i, i + 50)
    const { error } = await supabase.from('boo_scorecards').upsert(batch)
    if (error) { console.error('Scorecard batch error:', error.message); return }
    console.log(`  ✅ Batch ${Math.floor(i/50)+1}: ${batch.length} cards`)
  }

  // ── 3. Summary ────────────────────────────────────────────────────────────
  console.log(`\n✅ Done! ${cards.length} scorecards across ${ROUNDS.length} rounds.\n`)

  // Print leaderboard preview (best score per model)
  const byModel = {}
  for (const c of cards) {
    if (!byModel[c.model_id] || c.total > byModel[c.model_id]) byModel[c.model_id] = c.total
  }
  const sorted = Object.entries(byModel).sort((a,b) => b[1] - a[1])
  console.log('📊 Best-score leaderboard preview:')
  const names = { m_moneca:'Moneca Doll Paradise', m_tiffany:'Tiffany Days', m_jazzmin:'Jazzmin Jonez', m_paola:'Paola Curvz', m_rosee:'Rosee Divine', m_scarlett:'Scarlett Exclusive', m_jada:'Jada Gemz', m_sugar:'Sugar Jones', m_spicyj:'Spicy J', m_asialov:'Asia Lovey', m_strella:'Strella Kat', m_kittylov:'Kitty Lov', m_jaymoney:'Jay Money', m_herrr:'Herrr', m_sabella:'The Real Sabella', m_yrbrabi:'YRB Rabi', m_aqua:'Aqua With a Choppa', m_ellie:'Elegance Ellie Yabish', m_blackeur:'Black Euro', m_asiaper:'Asia Perez', m_juicy:'Dat Bitch Named Juicy', m_suglips:'Sug Lips', m_zarago:'Zara Go' }
  sorted.forEach(([id, best], i) => console.log(`  ${i+1}. ${names[id] ?? id} — ${best}`))
}

main().catch(console.error)
