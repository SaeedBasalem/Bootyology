import { Plus, Users, Layers, ClipboardList, Crown, ArrowRight, Trophy, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { useActions } from '../components/ActionsProvider'
import { Stat, Avatar, ProgressBar, EmptyState } from '../components/ui'
import { LeaderRow } from '../components/LeaderRow'
import { ScoreRadar } from '../components/Charts'
import { leaderboard, statsForModel, mostImproved, MAX_TOTAL, scoreTier } from '../lib/scoring'
import { achievementSummary, encouragement, getAchievements } from '../lib/achievements'
import { formatDate } from '../lib/util'

export function Dashboard() {
  const { data } = useStore()
  const { go } = useNav()
  const { newScorecard } = useActions()

  const board = leaderboard(data, data.settings.rankBy)
  const top = board[0]
  const topStats = top ? statsForModel(data, top.model.id) : null
  const improved = mostImproved(data)
  const ach = achievementSummary(data)
  const recent = data.scorecards
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
  const avgAll =
    data.scorecards.length > 0
      ? Math.round(data.scorecards.reduce((s, c) => s + c.total, 0) / data.scorecards.length)
      : 0

  const metricLabel = data.settings.rankBy === 'best' ? 'best' : data.settings.rankBy === 'latest' ? 'latest' : 'avg'

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="card relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-2xl"
          style={{ background: 'radial-gradient(circle, var(--gold), transparent 70%)' }}
        />
        <div className="relative">
          <p className="flex items-center gap-2 text-sm font-medium text-gold">
            <Sparkles size={15} /> Welcome back, {data.settings.judgeName || 'Judge'}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Your <span className="gold-text">Bootyology</span> studio
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">{encouragement(data)}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-gold" onClick={() => newScorecard()}>
              <Plus size={16} /> New scorecard
            </button>
            <button className="btn-ghost" onClick={() => go('leaderboard')}>
              <Trophy size={16} /> View leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Models" value={data.models.filter((m) => !m.archived).length} icon={<Users size={18} />} />
        <Stat label="Rounds" value={data.rounds.length} icon={<Layers size={18} />} accent="var(--rose)" />
        <Stat label="Scorecards" value={data.scorecards.length} icon={<ClipboardList size={18} />} accent="var(--good)" />
        <Stat label="Avg score" value={avgAll || '—'} sub={`out of ${MAX_TOTAL}`} icon={<Trophy size={18} />} />
      </div>

      {board.length === 0 ? (
        <EmptyState
          icon={<Trophy size={28} />}
          title="No rankings yet"
          message="Score a model in a round and your leaderboard will spring to life — complete with trends, medals and charts."
          action={
            <button className="btn-gold" onClick={() => newScorecard()}>
              <Plus size={16} /> Score your first round
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top performer spotlight */}
          {top && topStats && (
            <div className="card overflow-hidden lg:col-span-1">
              <div className="border-b border-line bg-surface2 px-5 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-gold">
                  <Crown size={16} /> Reigning #1
                </p>
              </div>
              <div className="p-5">
                <button onClick={() => go('profile', top.model.id)} className="flex items-center gap-3 text-left">
                  <Avatar name={top.model.name} emoji={top.model.emoji} accent={top.model.accent} size={56} />
                  <div>
                    <p className="font-display text-xl font-bold text-content">{top.model.name}</p>
                    <p className="text-sm" style={{ color: scoreTier(top.metric).color }}>
                      {top.metric} {metricLabel} · {scoreTier(top.metric).label}
                    </p>
                  </div>
                </button>
                {topStats.latestCard && (
                  <div className="mt-3">
                    <ScoreRadar
                      height={230}
                      series={[{ name: top.model.name, color: top.model.accent, scores: topStats.latestCard.scores }]}
                    />
                  </div>
                )}
                <button onClick={() => go('profile', top.model.id)} className="btn-ghost mt-2 w-full">
                  View profile <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Mini leaderboard */}
          <div className="card p-5 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Top rankings</h2>
              <button onClick={() => go('leaderboard')} className="btn-quiet text-xs">
                See all <ArrowRight size={13} />
              </button>
            </div>
            <div className="space-y-2">
              {board.slice(0, 5).map((entry) => (
                <LeaderRow key={entry.model.id} entry={entry} metricLabel={metricLabel} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom row: most improved + recent + achievements */}
      <div className="grid gap-6 lg:grid-cols-3">
        {improved && (
          <div className="card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">📈 Most improved</h2>
            <button
              onClick={() => go('profile', improved.stats.model.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-good/50"
            >
              <Avatar
                name={improved.stats.model.name}
                emoji={improved.stats.model.emoji}
                accent={improved.stats.model.accent}
                size={42}
              />
              <div className="flex-1">
                <p className="font-semibold text-content">{improved.stats.model.name}</p>
                <p className="text-xs text-muted">Climbed across rounds</p>
              </div>
              <span className="font-display text-xl font-bold text-good">+{improved.delta}</span>
            </button>
          </div>
        )}

        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Recent verdicts</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">No scorecards yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((c) => {
                const m = data.models.find((x) => x.id === c.modelId)
                if (!m) return null
                return (
                  <button
                    key={c.id}
                    onClick={() => go('profile', m.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-surface2"
                  >
                    <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content">{m.name}</p>
                      <p className="text-xs text-muted">{formatDate(c.date)}</p>
                    </div>
                    <span className="font-display font-bold" style={{ color: scoreTier(c.total).color }}>
                      {c.total}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Achievements</h2>
            <span className="chip">
              {ach.unlocked}/{ach.total}
            </span>
          </div>
          <ProgressBar value={(ach.unlocked / ach.total) * 100} />
          <div className="mt-3 space-y-2">
            {getAchievements(data)
              .slice()
              .sort((a, b) => Number(b.achieved) - Number(a.achieved) || b.progress - a.progress)
              .slice(0, 3)
              .map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg bg-surface2 p-2">
                  <span className={a.achieved ? 'text-xl' : 'text-xl opacity-40 grayscale'}>{a.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">{a.title}</p>
                    <p className="truncate text-xs text-muted">{a.desc}</p>
                  </div>
                  {a.achieved ? <span className="text-good">✓</span> : <span className="text-xs text-muted">{a.hint}</span>}
                </div>
              ))}
          </div>
          <button onClick={() => go('achievements')} className="btn-quiet mt-2 w-full text-xs">
            View all <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <p className="pb-2 text-center text-xs text-muted">
        A personal, subjective fan system — scores are for your reference, kept in proportion and kept fun.
      </p>
    </div>
  )
}
