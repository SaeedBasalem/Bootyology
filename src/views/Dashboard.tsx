import { Plus, Users, Film, ClipboardList, Crown, ArrowRight, Trophy, Sparkles, Target, Zap, Calendar, Star, Flame } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { useActions } from '../components/ActionsProvider'
import { Stat, Avatar, ProgressBar, EmptyState } from '../components/ui'
import { LeaderRow } from '../components/LeaderRow'
import { ScoreRadar } from '../components/Charts'
import { leaderboard, statsForModel, mostImproved, MAX_TOTAL, scoreTier, modelOfMonth, dailyWatchSuggestion } from '../lib/scoring'
import { achievementSummary, encouragement, getAchievements, todayChallenge, getJudgeLevelInfo } from '../lib/achievements'
import { formatDate } from '../lib/util'

export function Dashboard() {
  const { data, saveChallenge } = useStore()
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

  const monthlyChamp = modelOfMonth(data)
  const dailyWatch = dailyWatchSuggestion(data)
  const challenge = todayChallenge(data)
  const levelInfo = getJudgeLevelInfo(data)

  function completeChallenge() {
    if (!challenge || challenge.completed) return
    saveChallenge({ ...challenge, completed: true, completedAt: new Date().toISOString() })
  }

  // Ticker content
  const tickerItems = board.slice(0, 8).map((e) =>
    `${e.rank === 1 ? '🔥' : '#' + e.rank} ${e.model.name.split(' ')[0].toUpperCase()}  ${e.metric}`
  ).join('   ·   ')

  return (
    <div className="space-y-5">

      {/* ── Hero — full-black CM magazine cover ──────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-black shadow-card">

        {/* Background radial glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-35 blur-3xl" style={{ background: 'radial-gradient(circle, #cc1111, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #cc1111, transparent 70%)' }} />

        {/* Live ticker */}
        {board.length > 0 && (
          <div className="relative border-b border-white/10 bg-cm-red/90 py-1.5 overflow-hidden">
            <div className="flex items-center gap-2 px-4 text-white">
              <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em]">LIVE</span>
              <span className="shrink-0 text-white/40">|</span>
              <div className="overflow-hidden flex-1">
                <div className="ticker-track flex gap-8 whitespace-nowrap text-[11px] font-semibold tracking-wide">
                  {tickerItems && <span>{tickerItems}   ·   {tickerItems}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cm-red-soft">
              <Sparkles size={12} /> ChocolateModels.com — Ranking Studio
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
              Welcome back,{' '}
              <span className="cm-glow">{data.settings.judgeName || 'Judge'}</span>
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">{encouragement(data)}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-cm" onClick={() => newScorecard()}>
                <Plus size={16} /> New scorecard
              </button>
              <button
                className="btn border border-white/15 text-white/70 hover:border-cm-red/50 hover:text-white"
                onClick={() => go('leaderboard')}
              >
                <Trophy size={16} /> Leaderboard
              </button>
            </div>
          </div>

          {/* Judge level card */}
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Judge Level</p>
            <p className="urban-num mt-0.5 text-5xl text-white">{levelInfo.level}</p>
            <p className="text-xs font-bold text-cm-red-soft">{levelInfo.title}</p>
            <div className="mt-2.5 h-1.5 w-36 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cm-red transition-all duration-700"
                style={{ width: `${levelInfo.progress * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] font-semibold text-white/35">{levelInfo.xp} XP</p>
          </div>
        </div>
      </div>

      {/* ── Scoreboard stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Models" value={data.models.filter((m) => !m.archived).length} icon={<Users size={18} />} />
        <Stat label="Clips" value={data.clips.length} icon={<Film size={18} />} accent="var(--rose)" />
        <Stat label="Scorecards" value={data.scorecards.length} icon={<ClipboardList size={18} />} accent="var(--good)" />
        <Stat label="Avg score" value={avgAll || '—'} sub={`out of ${MAX_TOTAL}`} icon={<Trophy size={18} />} />
      </div>

      {/* ── Daily widgets ────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Daily challenge */}
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-cm-red/8 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-cm-red">
              <Target size={14} /> Daily Challenge
            </h2>
          </div>
          <div className="p-5">
            {challenge ? (
              <div>
                <p className="font-display text-base font-semibold text-content">{challenge.title}</p>
                <p className="mt-1 text-xs text-muted">{challenge.description}</p>
                {challenge.targetModelId && (() => {
                  const model = data.models.find((m) => m.id === challenge.targetModelId)
                  return model ? (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface2 p-2.5">
                      <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={30} photoUrl={model.photoUrl} />
                      <span className="text-sm font-semibold text-content">{model.name}</span>
                    </div>
                  ) : null
                })()}
                {challenge.completed ? (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-good">
                    <Sparkles size={12} /> Completed today!
                  </div>
                ) : (
                  <button className="btn-cm mt-3 w-full text-xs py-1.5" onClick={completeChallenge}>
                    <Zap size={13} /> Mark complete
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Add models to unlock daily challenges.</p>
            )}
          </div>
        </div>

        {/* Today's watch */}
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-gold/5 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gold">
              <Calendar size={14} /> Today's Watch
            </h2>
          </div>
          <div className="p-5">
            {dailyWatch ? (
              <div>
                <p className="mb-2 text-xs text-muted">Rotation — least recently scored:</p>
                <button
                  onClick={() => go('profile', dailyWatch.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-gold/40"
                >
                  <Avatar name={dailyWatch.name} emoji={dailyWatch.emoji} accent={dailyWatch.accent} size={44} photoUrl={dailyWatch.photoUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-content">{dailyWatch.name}</p>
                    <p className="text-xs text-muted">{dailyWatch.category || 'Rotation pick'}</p>
                  </div>
                  <ArrowRight size={15} className="text-muted" />
                </button>
                <button className="btn-ghost mt-2 w-full text-xs py-1.5" onClick={() => newScorecard({ modelId: dailyWatch.id })}>
                  <Plus size={13} /> Score her now
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted">Add models to get daily suggestions.</p>
            )}
          </div>
        </div>

        {/* Model of the Month */}
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-rose/5 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-rose">
              <Star size={14} /> Model of the Month
            </h2>
          </div>
          <div className="p-5">
            {monthlyChamp ? (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">{monthlyChamp.title}</p>
                <button
                  onClick={() => go('profile', monthlyChamp.model.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-rose/40"
                >
                  <Avatar name={monthlyChamp.model.name} emoji={monthlyChamp.model.emoji} accent={monthlyChamp.model.accent} size={44} photoUrl={monthlyChamp.model.photoUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-content">{monthlyChamp.model.name}</p>
                    <p className="text-xs text-muted">{monthlyChamp.scorecardCount} sessions · avg {monthlyChamp.avgScore}</p>
                  </div>
                  <span className="urban-num text-2xl text-gold">{monthlyChamp.avgScore}</span>
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted">Score models this month to crown a winner.</p>
            )}
          </div>
        </div>
      </div>

      {board.length === 0 ? (
        <EmptyState
          icon={<Trophy size={28} />}
          title="No rankings yet"
          message="Score a model on a clip and your leaderboard will spring to life."
          action={
            <button className="btn-cm" onClick={() => newScorecard()}>
              <Plus size={16} /> Score your first clip
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">

          {/* Reigning #1 */}
          {top && topStats && (
            <div className="card overflow-hidden lg:col-span-1">
              <div className="flex items-center gap-2 border-b border-line bg-gold/8 px-5 py-3">
                <Crown size={14} className="text-gold" />
                <p className="text-sm font-bold uppercase tracking-widest text-gold">Reigning #1</p>
              </div>
              <div className="p-5">
                <button onClick={() => go('profile', top.model.id)} className="flex items-center gap-3 text-left group">
                  <Avatar
                    name={top.model.name}
                    emoji={top.model.emoji}
                    accent={top.model.accent}
                    size={60}
                    photoUrl={top.model.photoUrl}
                    ring
                  />
                  <div>
                    <p className="font-display text-xl font-bold text-content group-hover:text-gold transition-colors">{top.model.name}</p>
                    <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: scoreTier(top.metric).color }}>
                      <Flame size={13} />
                      {top.metric} {metricLabel} · {scoreTier(top.metric).label}
                    </p>
                  </div>
                </button>
                {topStats.latestCard && (
                  <div className="mt-3">
                    <ScoreRadar height={220} series={[{ name: top.model.name, color: top.model.accent, scores: topStats.latestCard.scores }]} />
                  </div>
                )}
                <button onClick={() => go('profile', top.model.id)} className="btn-ghost mt-2 w-full">
                  View profile <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Top rankings */}
          <div className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-display text-base font-bold text-content">Top Rankings</h2>
              <button onClick={() => go('leaderboard')} className="btn-quiet text-xs gap-1">
                Full board <ArrowRight size={13} />
              </button>
            </div>
            <div className="space-y-1.5 p-4">
              {board.slice(0, 5).map((entry) => (
                <LeaderRow key={entry.model.id} entry={entry} metricLabel={metricLabel} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom row ───────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {improved && (
          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-good">📈 Most Improved</h2>
            </div>
            <div className="p-5">
              <button
                onClick={() => go('profile', improved.stats.model.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-good/50"
              >
                <Avatar name={improved.stats.model.name} emoji={improved.stats.model.emoji} accent={improved.stats.model.accent} size={42} photoUrl={improved.stats.model.photoUrl} />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-content">{improved.stats.model.name}</p>
                  <p className="text-xs text-muted">Climbing across clips</p>
                </div>
                <span className="urban-num text-2xl text-good">+{improved.delta}</span>
              </button>
            </div>
          </div>
        )}

        {/* Recent verdicts */}
        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-content">Recent Verdicts</h2>
          </div>
          <div className="p-4">
            {recent.length === 0 ? (
              <p className="text-sm text-muted">No scorecards yet.</p>
            ) : (
              <div className="space-y-1">
                {recent.map((c) => {
                  const m = data.models.find((x) => x.id === c.modelId)
                  if (!m) return null
                  const clip = data.clips.find((cl) => cl.id === c.clipId)
                  return (
                    <button key={c.id} onClick={() => go('profile', m.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-surface2">
                      <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={34} photoUrl={m.photoUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-content">{m.name}</p>
                        <p className="truncate text-xs text-muted">{clip ? clip.title : formatDate(c.date)}</p>
                      </div>
                      <span className="urban-num text-xl shrink-0" style={{ color: scoreTier(c.total).color }}>{c.total}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-content">Achievements</h2>
            <span className="chip">{ach.unlocked}/{ach.total}</span>
          </div>
          <div className="p-5">
            <ProgressBar value={(ach.unlocked / ach.total) * 100} color="var(--gold)" />
            <div className="mt-3 space-y-2">
              {getAchievements(data)
                .slice()
                .sort((a, b) => Number(b.achieved) - Number(a.achieved) || b.progress - a.progress)
                .slice(0, 3)
                .map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2.5">
                    <span className={a.achieved ? 'text-xl' : 'text-xl opacity-35 grayscale'}>{a.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-content">{a.title}</p>
                      <p className="truncate text-xs text-muted">{a.desc}</p>
                    </div>
                    {a.achieved ? <span className="shrink-0 text-good">✓</span> : <span className="shrink-0 text-xs text-muted">{a.hint}</span>}
                  </div>
                ))}
            </div>
            <button onClick={() => go('achievements')} className="btn-quiet mt-3 w-full text-xs">
              View all <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <p className="pb-2 text-center text-xs text-muted/60">
        A personal, subjective fan system — scores are for your enjoyment.
      </p>
    </div>
  )
}
