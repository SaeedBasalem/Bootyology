import { useState } from 'react'
import { Swords, Crown } from 'lucide-react'
import { useStore } from '../lib/store'
import { SectionHeader, Avatar, EmptyState } from '../components/ui'
import { ScoreRadar } from '../components/Charts'
import { CRITERIA } from '../lib/criteria'
import { statsForModel, scoreTier } from '../lib/scoring'
import type { CriterionKey, Scores } from '../lib/types'

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
  const scored = data.models.filter((m) => !m.archived && statsForModel(data, m.id).rounds > 0)

  const [aId, setAId] = useState(scored[0]?.id ?? '')
  const [bId, setBId] = useState(scored[1]?.id ?? scored[0]?.id ?? '')

  if (scored.length < 2) {
    return (
      <div>
        <SectionHeader title="Head to head" subtitle="Put two models side by side." />
        <EmptyState
          icon={<Swords size={28} />}
          title="Need two scored models"
          message="Score at least two models and you can compare their radars, averages and category-by-category strengths here."
        />
      </div>
    )
  }

  const a = data.models.find((m) => m.id === aId)!
  const b = data.models.find((m) => m.id === bId)!
  const aStats = statsForModel(data, aId)
  const bStats = statsForModel(data, bId)
  const aAvg = avgScores(aStats.cards)
  const bAvg = avgScores(bStats.cards)

  const winner = aStats.average === bStats.average ? null : aStats.average > bStats.average ? a : b

  return (
    <div>
      <SectionHeader title="Head to head" subtitle="Compare two models, criterion by criterion." />

      {/* Selectors + headline */}
      <div className="card mb-6 p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-center">
            <Avatar name={a.name} emoji={a.emoji} accent={a.accent} size={64} />
            <select className="input mt-2 text-center" value={aId} onChange={(e) => setAId(e.target.value)}>
              {scored.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="mt-2 font-display text-2xl font-bold" style={{ color: scoreTier(aStats.average).color }}>
              {aStats.average}
            </p>
            <p className="text-xs text-muted">avg score</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface2 font-display text-lg font-bold text-gold">
            VS
          </div>
          <div className="text-center">
            <Avatar name={b.name} emoji={b.emoji} accent={b.accent} size={64} />
            <select className="input mt-2 text-center" value={bId} onChange={(e) => setBId(e.target.value)}>
              {scored.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="mt-2 font-display text-2xl font-bold" style={{ color: scoreTier(bStats.average).color }}>
              {bStats.average}
            </p>
            <p className="text-xs text-muted">avg score</p>
          </div>
        </div>
        {winner && aId !== bId && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface2 py-2.5 text-sm font-semibold text-gold">
            <Crown size={16} /> {winner.name} leads on average
          </div>
        )}
      </div>

      {aId !== bId ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-2 font-display text-lg font-semibold">Overlaid profile</h2>
            <ScoreRadar
              height={320}
              series={[
                { name: a.name, color: a.accent, scores: aAvg },
                { name: b.name, color: b.accent, scores: bAvg },
              ]}
            />
            <div className="mt-2 flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.accent }} /> {a.name}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.accent }} /> {b.name}
              </span>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Category breakdown</h2>
            <div className="space-y-2.5">
              {CRITERIA.map((c) => {
                const av = aAvg[c.key as CriterionKey]
                const bv = bAvg[c.key as CriterionKey]
                const aWins = c.isDeduction ? av > bv : av > bv
                const bWins = c.isDeduction ? bv > av : bv > av
                const max = c.isDeduction ? Math.abs(c.min) : c.max
                return (
                  <div key={c.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className={aWins ? 'font-bold text-gold' : 'text-muted'}>{av}</span>
                      <span className="text-content">{c.label}</span>
                      <span className={bWins ? 'font-bold text-gold' : 'text-muted'}>{bv}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex h-2 flex-1 justify-end overflow-hidden rounded-full bg-surface2">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(Math.abs(av) / max) * 100}%`, background: a.accent }}
                        />
                      </div>
                      <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-surface2">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(Math.abs(bv) / max) * 100}%`, background: b.accent }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-muted">Pick two different models to compare.</p>
      )}
    </div>
  )
}
