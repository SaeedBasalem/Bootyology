# Bootyology · Ranking Studio

> _Curate. Score. Celebrate._ — a private, on-device studio for ranking and tracking your favourite models across themed rounds.

**Bootyology** turns a personal, subjective fan scoring system into a powerful, interactive web app. It keeps the ranking of your favourite performers accurately updated, round after round, with trends, charts, head-to-head comparisons, achievements, and a built-in clip library — all stored privately on your own device.

It is a **React + TypeScript + Vite** single-page app styled with **Tailwind CSS**, with charts by **Recharts** and icons by **lucide-react**. There is **no backend and no account** — everything lives in your browser (`localStorage` for data as JSON, `IndexedDB` for clip video files). Nothing is ever uploaded.

---

## What it does

### The scoring system
Every model is scored across the **10 criteria** from the personal assessment system, for a maximum of **110 points**:

| # | Criterion | Points |
|---|-----------|:------:|
| 1 | Booty Shape | 20 |
| 2 | Booty Movement | 20 |
| 3 | Dance Performance | 15 |
| 4 | Body Harmony | 10 |
| 5 | Sex Appeal | 10 |
| 6 | Presentation & Styling | 10 |
| 7 | Face Beauty | 10 |
| 8 | Nudity | −15 (deduction) |
| 9 | Sensuality | 10 |
| 10 | Perfect Body Bonus | 5 |

The scoring form uses **live sliders** that show the matching descriptive band as you slide, a running total with a tier label (Early → Developing → Strong → Excellent → Elite), and the Nudity deduction handled automatically.

### Features
- **Dashboard** — reigning #1 spotlight (with radar), top rankings, most improved, recent verdicts, achievement progress, and an encouraging line.
- **Leaderboard** — live rankings by **average / best / latest**, a top-3 podium, medals, movement (▲▼) since the previous round, and search.
- **Roster** — add/edit models with avatar glyph, accent colour, tags, "discovered" year, notes, and a favourite ♥. Per-card average / best / rounds and a one-tap **Score** button.
- **Model profile** — rank badge, stat cards, a **strengths radar**, a **score-over-time trend line**, strengths vs. room-to-grow, full scorecard history (editable/deletable), and the model's clips.
- **Clips library** 🎬 — connect a model to **her clips**: attach an **on-device video file** (kept privately in IndexedDB, never uploaded) or a **link/URL**. Play clips in-app, then **score a clip directly from the player** — the verdict links back to the clip.
- **Rounds** — themed sessions (e.g. "Golden Hour"); expand any round to see its internal ranking.
- **Head-to-head** — compare two models with an overlaid radar and a category-by-category breakdown.
- **Insights** — roster-wide patterns: strongest/weakest criteria, average strength per criterion, most improved, highest single verdict.
- **Achievements & Hall of Fame** — milestones that reward keeping a consistent, fun ritual.
- **Scoring guide** — the full criteria, point bands, and sample feedback notes, always on hand.
- **Data & settings** — JSON **export / import** backups, judge name, default ranking, **dark "studio" / light** themes, and reset.

Everything is connected: **clips → models → scorecards → rounds → leaderboard → insights & achievements**.

---

## Privacy
This is a personal, private hobby tool. There is no server, no login, and no telemetry. Your data is stored only in this browser (JSON in `localStorage`; clip files in `IndexedDB`). Use **Export backup** to keep a copy or move to another device.

---

## Development

```bash
npm install      # install dependencies
npm run dev      # start the dev server (Vite)
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
```

## Deployment

This repo **auto-deploys to GitHub Pages** via GitHub Actions
(`.github/workflows/deploy.yml`). Every push to `main` builds the app and
publishes `dist/` to Pages.

- **Live site:** https://saeedbasalem.github.io/Bootyology/
- **Repository:** https://github.com/SaeedBasalem/Bootyology

Because the site is served from the `/Bootyology/` sub-path, `vite.config.ts`
sets `base: '/Bootyology/'`. If you rename the repo, or move to a custom domain
or Netlify (served at the root), change `base` back to `'/'`.

> **One-time setup:** in the repo, open **Settings -> Pages -> Build and
> deployment -> Source** and select **GitHub Actions**.

A `netlify.toml` is also included as an alternative host (`npm run build` ->
publish `dist/`); if you use Netlify, set `base: '/'`.

---

*This whole system is just a personal lens — a consistent way to keep notes, kept in proportion and kept fun. Scores are for personal reference, not a verdict on anyone.*
