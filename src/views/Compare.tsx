import { useState } from 'react'
import { Swords, Crown, Plus, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { SectionHeader, Avatar, EmptyState } from '../components/ui'
import { ScoreRadar } from '../components/Charts'
import { CRITERIA } from '../lib/criteria'
import { statsForModel, similarModels, scoreTier } from '../lib/scoring'
import type { CriterionKey, Scores } from '../lib/types'
import { classNames } from '../lib/util'

const COLORS = ['#e3bc63', '#7aa7d8', '#d98a8a', '#6fc28d']
const COLOR_NAMES = ['Gold', 'Blue', 'Rose', 'Green']

function avgScores(cards: { scores: Scores }[]): Scores {
  const out = {} as Scores
  for (const c of CRITERIA) {
    const v = cards.length ? cards.reduce((s, card) => s + (card.scores[c.key] ?? 0), 0) / cards.length : 0
    out[c.key] = Math.round(v * 10) / 10
  }
  return out
}

export function Compare() {
  const { data } = useStore()
  const { go } = useNav()
  const scored = data.models.filter((m) => !m.archived && statsForModel(data, m.id).rounds > 0)

  const [ids, setIds] = useState<string[]>([scored[0]?.id ?? '', scored[1]?.id ?? scored[0]?.id ?? ''])
  const [showSimilar, setShowSimilar] = useState(false)
  const [similarBase, setSimilarBase] = useState<string>('')

  if (scored.length < 2) {
    return (
      <div>
        <SectionHeader title="Compare" subtitle="Put models side by side and find similar profiles." />
        <EmptyState
          icon={<Swords size={28} />}
          title="Need two scored models"
          message="Score at least two models and you can compare their radars, averages and category-by-category strengths here."
        />
      </div>
    )
  }

  function setId(index: number, id: string) {
    setIds((prev) => { const next = [...prev]; next[index] = id; return next })
  }

  function addModel() {
    if (ids.length >= 4) return
    const unused = scored.find((m) => !ids.includes(m.id))
    setIds((prev) => [...prev, unused?.id ?? scored[0].id])
  }

  function removeModel(index: number) {
    if (ids.length <= 2) return
    setIds((prev) => prev.filter((_, i) => i !== index))
  }

  const models = ids.map((id) => data.models.find((m) => m.id === id)).filter(Boolean) as typeof data.models
  const allStats = ids.map((id) => statsForModel(data, id))
  const allAvgs = allStats.map((s) => avgScores(s.cards))

  const winner = allStats.reduce<typeof allStats[0] | null>((best, s) =>
    !best || s.average > best.average ? s : best, null)

  const similar = similarBase ? similarModels(data, similarBase, 4) : []

  return (
    <div className="space-y-6">

      {/* ── VS header ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
        {/* Diagonal split background using the two main model colors */}
        {models.length >= 2 && (
          <>
            <div className="pointer-events-none absolute inset-0 opacity-20" style={{
              background: `linear-gradient(135deg, ${COLORS[0]}55 0%, transparent 50%, ${COLORS[1]}55 100%)`
            }} />
            {models[0]?.photoUrl && (
              <div className="pointer-events-none absolute left-0 top-0 h-full w-1/2 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url(${models[0].photoUrl})` }} />
            )}
            {models[1]?.photoUrl && (
              <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url(${models[1].photoUrl})` }} />
            )}
          </>
        )}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 100%)' }} />
        <div className="relative px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Head to head</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Compare</h1>
              <p className="mt-1 text-sm text-white/40">Overlay up to 4 models on the same radar.</p>
            </div>
            {ids.length < 4 && (
              <button className="btn-ghost border-white/20 text-white/70 hover:text-white" onClick={addModel}>
                <Plus size={14} /> Add model
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Model selector cards ──────────────────────────────────────────────── */}
      <div className={classNames('grid gap-3', ids.length <= 2 ? 'sm:grid-cols-2' : ids.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4')}>
        {ids.map((id, i) => {
          const model = data.models.find((m) => m.id === id)
          const stats = allStats[i]
          const tier = stats ? scoreTier(stats.average) : null
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border bg-surface shadow-card"
              style={{ borderColor: `${COLORS[i]}50` }}
            >
              {/* Photo background */}
              {model?.photoUrl && (
                <>
                  <div className="absolute inset-0 bg-cover bg-center opacity-18" style={{ backgroundImage: `url(${model.photoUrl})` }} />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/75" />
                </>
              )}
              {/* Color accent bar */}
              <div className="h-1 w-full" style={{ background: COLORS[i] }} />

              {ids.length > 2 && (
                <button onClick={() => removeModel(i)} className="absolute right-2 top-3 z-10 rounded-full bg-black/50 p-1 text-white/50 transition hover:text-bad">
                  <X size={12} />
                </button>
              )}

              <div className="relative p-4 text-center">
                {model && (
                  <Avatar name={model.name} emoji={model.emoji} accent={COLORS[i]} size={56} photoUrl={model.photoUrl} ring />
                )}
                <select
                  className="input mt-3 text-center text-xs"
                  value={id}
                  onChange={(e) => setId(i, e.target.value)}
                  style={{ borderColor: `${COLORS[i]}40` }}
                >
                  {scored.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                {stats && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="urban-num text-3xl" style={{ color: tier?.color ?? COLORS[i] }}>{stats.average || '—'}</span>
                    {tier && (
                      <span className="tier-pill" style={{ background: `${tier.color}18`, color: tier.color, border: `1px solid ${tier.color}35` }}>
                        {tier.label}
                      </span>
                    )}
                  </div>
                )}
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: COLORS[i] }}>
                  {COLOR_NAMES[i]}
                </p>
                <button
                  className="btn-quiet mt-2 w-full text-[10px] py-1"
                  onClick={() => { setSimilarBase(id); setShowSimilar(true) }}
                >
                  Find similar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Winner banner ─────────────────────────────────────────────────────── */}
      {winner && ids.length >= 2 && (
        <div className="relative overflow-hidden rounded-2xl border border-gold/35 p-4" style={{ background: 'linear-gradient(135deg, rgba(227,188,99,0.12), rgba(227,188,99,0.04))' }}>
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-40" style={{ background: 'radial-gradient(circle, #e3bc63, transparent)' }} />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/40 bg-gold/15">
              <Crown size={18} className="text-gold" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-gold">{winner.model.name} leads</p>
              <p className="text-sm text-muted">Average score: <span className="font-bold text-content">{winner.average}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ── Radar + breakdown ─────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-1 font-display text-lg font-semibold">Overlaid profile</h2>
          <p className="mb-3 text-xs text-muted">All averaged scorecards per model.</p>
          <ScoreRadar
            height={300}
            series={models.map((m, i) => ({
              name: m.name,
              color: COLORS[i],
              scores: allAvgs[i] ?? {},
            }))}
          />
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs">
            {models.map((m, i) => (
              <button key={m.id} onClick={() => go('profile', m.id)} className="flex items-center gap-1.5 transition hover:opacity-70">
                <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: COLORS[i] }} />
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Category breakdown</h2>
          <div className="space-y-3">
            {CRITERIA.map((c) => {
              const values = allAvgs.map((avg) => avg[c.key as CriterionKey] ?? 0)
              const max = c.isDeduction ? Math.abs(c.min) : c.max
              const maxVal = Math.max(...values)
              return (
                <div key={c.key}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-content">{c.label}</span>
                    <div className="flex gap-3">
                      {values.map((v, i) => (
                        <span
                          key={i}
                          className={classNames('font-bold tabular-nums', v === maxVal ? '' : 'opacity-40')}
                          style={{ color: COLORS[i] }}
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {values.map((v, i) => (
                      <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(Math.abs(v) / max) * 100}%`, background: COLORS[i] }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Similar models ────────────────────────────────────────────────────── */}
      {showSimilar && similarBase && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Similar to {data.models.find((m) => m.id === similarBase)?.name}
              </h2>
              <p className="text-xs text-muted">Closest scoring profiles by pattern similarity.</p>
            </div>
            <button className="btn-quiet text-xs" onClick={() => setShowSimilar(false)}>Close</button>
          </div>
          <div className="p-4">
            {similar.length === 0 ? (
              <p className="text-sm text-muted">No similar models found — score more models to enable comparison.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {similar.map(({ model, similarity }) => {
                  const stats = statsForModel(data, model.id)
                  const tier = scoreTier(stats.average)
                  return (
                    <button
                      key={model.id}
                      onClick={() => go('profile', model.id)}
                      className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-gold/40"
                    >
                      {model.photoUrl && (
                        <div className="absolute inset-0 opacity-12 bg-cover bg-center transition group-hover:opacity-20" style={{ backgroundImage: `url(${model.photoUrl})` }} />
                      )}
                      <div className="relative flex items-center gap-3 w-full">
                        <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={40} photoUrl={model.photoUrl} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-content">{model.name}</p>
                          <p className="text-xs text-muted">{similarity}% match</p>
                        </div>
                        <span className="urban-num shrink-0 text-xl" style={{ color: tier.color }}>{stats.average || '—'}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
