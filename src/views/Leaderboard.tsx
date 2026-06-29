import { useState } from 'react'
import { Plus, Trophy, Search } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { useActions } from '../components/ActionsProvider'
import { SectionHeader, EmptyState, Avatar } from '../components/ui'
import { LeaderRow } from '../components/LeaderRow'
import { leaderboard, pct, scoreTier, type RankBy } from '../lib/scoring'
import { classNames } from '../lib/util'

const RANK_OPTIONS: { key: RankBy; label: string }[] = [
  { key: 'average', label: 'Average' },
  { key: 'best', label: 'Best' },
  { key: 'latest', label: 'Latest' },
]

export function Leaderboard() {
  const { data, setSettings } = useStore()
  const { go } = useNav()
  const { newScorecard } = useActions()
  const [query, setQuery] = useState('')

  const rankBy = data.settings.rankBy
  const metricLabel = rankBy === 'best' ? 'best' : rankBy === 'latest' ? 'latest' : 'avg'
  let board = leaderboard(data, rankBy)
  if (query.trim()) {
    const q = query.toLowerCase()
    board = board.filter(
      (e) => e.model.name.toLowerCase().includes(q) || e.model.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }

  const podium = board.slice(0, 3)
  const rest = board.slice(3)

  return (
    <div>
      <SectionHeader
        title="Leaderboard"
        subtitle="Live rankings of every model you've scored."
        action={
          <button className="btn-gold" onClick={() => newScorecard()}>
            <Plus size={16} /> New scorecard
          </button>
        }
      />

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-line bg-surface p-1">
          {RANK_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setSettings({ rankBy: o.key })}
              className={classNames(
                'rounded-lg px-3.5 py-1.5 text-sm font-semibold transition',
                rankBy === o.key ? 'bg-gold text-[#241606]' : 'text-muted hover:text-content',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[180px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            placeholder="Search name or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {board.length === 0 ? (
        <EmptyState
          icon={<Trophy size={28} />}
          title={query ? 'No matches' : 'Nothing ranked yet'}
          message={query ? 'Try a different search term.' : 'Score a model to put them on the board.'}
          action={
            !query && (
              <button className="btn-gold" onClick={() => newScorecard()}>
                <Plus size={16} /> Score a round
              </button>
            )
          }
        />
      ) : (
        <>
          {/* Podium */}
          {podium.length >= 2 && !query && (
            <div className="mb-6 grid grid-cols-3 items-end gap-2 sm:gap-4">
              {[1, 0, 2].map((idx) => {
                const e = podium[idx]
                if (!e) return <div key={idx} />
                const heights = ['h-28', 'h-36', 'h-24']
                const order = idx === 0 ? 1 : idx === 1 ? 0 : 2 // visual order
                const tier = scoreTier(e.metric)
                return (
                  <button
                    key={e.model.id}
                    onClick={() => go('profile', e.model.id)}
                    className="flex flex-col items-center"
                    style={{ order }}
                  >
                    <Avatar name={e.model.name} emoji={e.model.emoji} accent={e.model.accent} size={idx === 1 ? 64 : 52} />
                    <p className="mt-2 max-w-full truncate px-1 text-center text-sm font-semibold text-content">
                      {e.model.name}
                    </p>
                    <p className="font-display text-lg font-bold" style={{ color: tier.color }}>
                      {e.metric}
                    </p>
                    <div
                      className={classNames(
                        'mt-1 flex w-full items-start justify-center rounded-t-xl border border-line pt-2 text-2xl',
                        heights[idx],
                      )}
                      style={{ background: `linear-gradient(180deg, ${e.model.accent}22, transparent)` }}
                    >
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className="space-y-2">
            {(query || podium.length < 2 ? board : rest).map((entry) => (
              <LeaderRow key={entry.model.id} entry={entry} metricLabel={metricLabel} />
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            Ranked by <span className="font-semibold text-content">{metricLabel}</span> score ·{' '}
            {pct(board[0].metric)}% leader · {board.length} ranked
          </p>
        </>
      )}
    </div>
  )
}
