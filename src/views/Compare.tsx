import { useState } from 'react'
import { Swords, Crown, Plus, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { SectionHeader, Avatar, EmptyState } from '../components/ui'
import { ScoreRadar } from '../components/Charts'
import { CRITERIA } from '../lib/criteria'
import { statsForModel, similarModels } from '../lib/scoring'
import type { CriterionKey, Scores } from '../lib/types'
import { classNames } from '../lib/util'

const COLORS = ['var(--gold)', '#7aa7d8', 'var(--rose)', 'var(--good)']

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

  // Similar models feature
  const similar = similarBase ? similarModels(data, similarBase, 4) : []

  return (
    <div className="space-y-6">
      <SectionHeader title="Compare" subtitle="Overlay up to 4 models on the same radar — find who's similar." />

      {/* Model selectors */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Selected models</h2>
          {ids.length < 4 && (
            <button className="btn-ghost text-xs" onClick={addModel}>
              <Plus size={13} /> Add model
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ids.map((id, i) => {
            const model = data.models.find((m) => m.id === id)
            const stats = allStats[i]
            return (
              <div key={i} className="relative rounded-xl border border-line bg-surface2 p-4 text-center">
                {ids.length > 2 && (
                  <button onClick={() => removeModel(i)} className="absolute right-2 top-2 rounded-full bg-surface p-0.5 text-muted hover:text-bad transition">
                    <X size={12} />
                  </button>
                )}
                {model && <Avatar name={model.name} emoji={model.emoji} accent={COLORS[i]} size={52} photoUrl={model.photoUrl} />}
                <select className="input mt-2 text-center text-xs" value={id} onChange={(e) => setId(i, e.target.value)}>
                  {scored.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
                <p className="mt-2 font-display text-xl font-bold" style={{ color: COLORS[i] }}>{stats?.average ?? '—'}</p>
                <p className="text-[10px] text-muted">avg score</p>
                <button className="btn-quiet mt-1 text-[10px] py-0.5 px-2 w-full" onClick={() => { setSimilarBase(id); setShowSimilar(true) }}>
                  Find similar
                </button>
              </div>
            )
          })}
        </div>

        {winner && ids.length >= 2 && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface2 py-2.5 text-sm font-semibold text-gold">
            <Crown size={16} /> {winner.model.name} leads on average ({winner.average})
          </div>
        )}
      </div>

      {/* Radar overlay */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-2 font-display text-lg font-semibold">Overlaid profile</h2>
          <ScoreRadar
            height={320}
            series={models.map((m, i) => ({
              name: m.name,
              color: COLORS[i],
              scores: allAvgs[i] ?? {},
            }))}
          />
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
            {models.map((m, i) => (
              <button key={m.id} onClick={() => go('profile', m.id)} className="flex items-center gap-1.5 hover:opacity-80">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} /> {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Category breakdown</h2>
          <div className="space-y-2">
            {CRITERIA.map((c) => {
              const values = allAvgs.map((avg) => avg[c.key as CriterionKey] ?? 0)
              const max = c.isDeduction ? Math.abs(c.min) : c.max
              const maxVal = Math.max(...values)
              return (
                <div key={c.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-content">{c.label}</span>
                    <div className="flex gap-2">
                      {values.map((v, i) => (
                        <span key={i} className={classNames('font-semibold', v === maxVal ? '' : 'opacity-50')} style={{ color: COLORS[i] }}>{v}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {values.map((v, i) => (
                      <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
                        <div className="h-full rounded-full" style={{ width: `${(Math.abs(v) / max) * 100}%`, background: COLORS[i] }} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Similar models panel */}
      {showSimilar && similarBase && (
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              Models similar to {data.models.find((m) => m.id === similarBase)?.name}
            </h2>
            <button className="btn-quiet text-xs" onClick={() => setShowSimilar(false)}>Close</button>
          </div>
          {similar.length === 0 ? (
            <p className="text-sm text-muted">No similar models found — score more models to enable comparison.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map(({ model, similarity }) => (
                <button
                  key={model.id}
                  onClick={() => go('profile', model.id)}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-gold/40"
                >
                  <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={40} photoUrl={model.photoUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-content">{model.name}</p>
                    <p className="text-xs text-muted">{similarity}% match</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
