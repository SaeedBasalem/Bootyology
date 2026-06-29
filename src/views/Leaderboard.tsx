import { useState } from 'react'
import { Plus, Trophy, Search, Flame, Crown } from 'lucide-react'
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

const PODIUM_STYLE = [
  { height: 'h-32', order: 1, medal: '🥇', label: '#1', metaColor: 'rgba(227,188,99,0.9)', size: 68 },
  { height: 'h-24', order: 0, medal: '🥈', label: '#2', metaColor: 'rgba(168,176,188,0.9)', size: 56 },
  { height: 'h-20', order: 2, medal: '🥉', label: '#3', metaColor: 'rgba(201,112,64,0.9)', size: 52 },
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
          <button className="btn-cm" onClick={() => newScorecard()}>
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
                rankBy === o.key
                  ? 'bg-gradient-to-br from-gold-soft to-gold text-[#241606]'
                  : 'text-muted hover:text-content',
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
          message={query ? 'Try a different search term.' : 'Score a model on a clip to put them on the board.'}
          action={
            !query && (
              <button className="btn-cm" onClick={() => newScorecard()}>
                <Plus size={16} /> Score your first clip
              </button>
            )
          }
        />
      ) : (
        <>
          {/* Podium — photo-forward editorial blocks */}
          {podium.length >= 2 && !query && (
            <div className="mb-6 grid grid-cols-3 items-end gap-2 sm:gap-3">
              {PODIUM_STYLE.map((p, visualIdx) => {
                // visual order: 2nd | 1st | 3rd  → indices [1, 0, 2]
                const dataIdx = visualIdx === 0 ? 1 : visualIdx === 1 ? 0 : 2
                const e = podium[dataIdx]
                if (!e) return <div key={visualIdx} />
                const tier = scoreTier(e.metric)
                return (
                  <button
                    key={e.model.id}
                    onClick={() => go('profile', e.model.id)}
                    className="group flex flex-col items-center gap-0"
                    style={{ order: p.order }}
                  >
                    {/* Photo or avatar */}
                    <div className="relative">
                      {dataIdx === 0 && (
                        <Crown size={18} className="absolute -top-6 left-1/2 -translate-x-1/2 text-gold drop-shadow" />
                      )}
                      <Avatar
                        name={e.model.name}
                        emoji={e.model.emoji}
                        accent={e.model.accent}
                        size={p.size}
                        photoUrl={e.model.photoUrl}
                        ring={dataIdx === 0}
                      />
                      {dataIdx === 0 && (
                        <Flame size={14} className="absolute -bottom-1 -right-1 text-cm-red-soft drop-shadow" />
                      )}
                    </div>

                    {/* Name + score */}
                    <p className="mt-2 max-w-full truncate px-1 text-center text-xs font-bold text-content sm:text-sm">
                      {e.model.name.split(' ')[0]}
                    </p>
                    <p className="urban-num text-lg sm:text-2xl" style={{ color: tier.color }}>
                      {e.metric}
                    </p>

                    {/* Podium block */}
                    <div
                      className={classNames(
                        'mt-1 flex w-full items-start justify-center rounded-t-xl border border-line/60 pt-2 transition group-hover:opacity-90',
                        p.height,
                      )}
                      style={{
                        background: `linear-gradient(180deg, ${e.model.accent}28 0%, transparent 80%)`,
                        borderTop: `2px solid ${p.metaColor}`,
                      }}
                    >
                      <span className="text-xl">{p.medal}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Rankings list */}
          <div className="space-y-2">
            {(query || podium.length < 2 ? board : rest).map((entry) => (
              <LeaderRow key={entry.model.id} entry={entry} metricLabel={metricLabel} />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="neon-line flex-1" />
            <p className="text-xs text-muted">
              Ranked by <span className="font-semibold text-content">{metricLabel}</span>
              {' · '}{pct(board[0].metric)}% peak{' · '}{board.length} models ranked
            </p>
            <div className="neon-line flex-1" />
          </div>
        </>
      )}
    </div>
  )
}
