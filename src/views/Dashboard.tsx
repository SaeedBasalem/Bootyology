import {
  Plus, Users, Film, ClipboardList, Crown, ArrowRight, Trophy, Sparkles,
  Target, Zap, Calendar, Star, Flame, Clock, AlertCircle, ClipboardPlus,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { useActions } from '../components/ActionsProvider'
import { Stat, Avatar, ProgressBar, EmptyState } from '../components/ui'
import { LeaderRow } from '../components/LeaderRow'
import { ScoreRadar } from '../components/Charts'
import {
  leaderboard, statsForModel, mostImproved, MAX_TOTAL, scoreTier,
  modelOfMonth, dailyWatchSuggestion, modelsNeedingScore,
  todayScoredCount, daysSinceLastScore,
} from '../lib/scoring'
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
  const needsScore = modelsNeedingScore(data, 4)
  const scoredToday = todayScoredCount(data)
  const streak = data.judgeProfile?.currentStreak ?? 0

  // All model photos (ranked first, then their extras) for the scrolling strip.
  // The strip is padded so ONE logical set is always wider than any realistic screen
  // (min ~2800 px) — this prevents both halves of the doubled strip from being
  // visible simultaneously, which would look like repeated photos.
  const heroStripPhotos = data.models
    .filter((m) => !m.archived && m.photoUrl)
    .sort((a, b) => statsForModel(data, b.id).average - statsForModel(data, a.id).average)
    .flatMap((m) => [m.photoUrl!, ...(m.photos ?? [])])

  const PHOTO_SLOT_PX = 163  // 160 px wide + 3 px gap
  const MIN_SET_PX = 2800
  const stripCopies = heroStripPhotos.length > 0
    ? Math.max(1, Math.ceil(MIN_SET_PX / (heroStripPhotos.length * PHOTO_SLOT_PX)))
    : 1
  const paddedStrip = Array.from({ length: stripCopies }).flatMap(() => heroStripPhotos)

  function completeChallenge() {
    if (!challenge || challenge.completed) return
    saveChallenge({ ...challenge, completed: true, completedAt: new Date().toISOString() })
  }

  const tickerItems = board.slice(0, 8).map((e) =>
    `${e.rank === 1 ? '🔥' : '#' + e.rank} ${e.model.name.split(' ')[0].toUpperCase()}  ${e.metric}`
  ).join('   ·   ')

  return (
    <div className="space-y-5">

      {/* ── Hero — editorial cover with photo mosaic ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-black shadow-card">

        {/* Scrolling photo strip — same loop technique as the live ticker */}
        {heroStripPhotos.length > 0 ? (
          <div className="absolute inset-0 overflow-hidden">
            <div className="photo-strip-track flex h-full" style={{ gap: '3px' }}>
              {/* Double the padded set so translateX(-50%) creates a seamless loop */}
              {[...paddedStrip, ...paddedStrip].map((url, i) => (
                <div
                  key={i}
                  className="shrink-0 h-full bg-cover bg-top"
                  style={{ width: '160px', backgroundImage: `url(${url})` }}
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60" />
          </div>
        ) : (
          <>
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-35 blur-3xl" style={{ background: 'radial-gradient(circle, #cc1111, transparent 70%)' }} />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #cc1111, transparent 70%)' }} />
          </>
        )}

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

            {/* Streak + today counter */}
            <div className="mt-4 flex flex-wrap gap-2">
              {streak > 1 && (
                <div className="flex items-center gap-1.5 rounded-full border border-cm-red/40 bg-cm-red/30 px-3 py-1.5 text-sm font-bold text-cm-red-soft">
                  <Flame size={14} /> {streak}-day streak
                </div>
              )}
              {scoredToday > 0 && (
                <div className="flex items-center gap-1.5 rounded-full border border-good/30 bg-good/20 px-3 py-1.5 text-sm font-bold text-good">
                  <Star size={13} /> {scoredToday} scored today
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
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

      {/* ── Scoreboard stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Models" value={data.models.filter((m) => !m.archived).length} icon={<Users size={18} />} />
        <Stat label="Clips" value={data.clips.length} icon={<Film size={18} />} accent="var(--rose)" />
        <Stat label="Scorecards" value={data.scorecards.length} icon={<ClipboardList size={18} />} accent="var(--good)" />
        <Stat label="Avg score" value={avgAll || '—'} sub={`out of ${MAX_TOTAL}`} icon={<Trophy size={18} />} />
      </div>

      {/* ── Needs Your Verdict — models with unscored clips ─────────────────── */}
      {needsScore.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line bg-cm-red/8 px-5 py-3">
            <AlertCircle size={15} className="text-cm-red-soft" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-cm-red-soft">Needs Your Verdict</h2>
            <span className="ml-auto rounded-full bg-cm-red/20 px-2 py-0.5 text-[11px] font-bold text-cm-red-soft">
              {needsScore.length}
            </span>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {needsScore.map(({ model, unscoredClips, daysSince }) => {
              const stats = statsForModel(data, model.id)
              const tier = stats.rounds > 0 ? scoreTier(stats.average) : null
              const firstUnscored = unscoredClips[0]
              return (
                <div
                  key={model.id}
                  className="group relative overflow-hidden rounded-xl border border-cm-red/20 bg-surface2 transition hover:border-cm-red/50"
                >
                  {model.photoUrl && (
                    <div
                      className="absolute inset-0 opacity-12 bg-cover bg-center blur-sm scale-105"
                      style={{ backgroundImage: `url(${model.photoUrl})` }}
                    />
                  )}
                  <div className="relative flex flex-col gap-2 p-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={36} photoUrl={model.photoUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-content">{model.name}</p>
                        <p className="text-[10px] text-muted">
                          {unscoredClips.length > 0
                            ? `${unscoredClips.length} unscored clip${unscoredClips.length !== 1 ? 's' : ''}`
                            : daysSince !== null ? `${daysSince}d since last score` : 'No score yet'}
                        </p>
                      </div>
                    </div>
                    {tier && (
                      <span className="tier-pill self-start" style={{ background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}44` }}>
                        {tier.label}
                      </span>
                    )}
                    <button
                      className="btn-cm py-1.5 text-xs"
                      onClick={() => newScorecard({ modelId: model.id, clipId: firstUnscored?.id })}
                    >
                      <ClipboardPlus size={12} /> Score now
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Daily widgets ────────────────────────────────────────────────────── */}
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
                  className="relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-gold/40"
                >
                  {dailyWatch.photoUrl && (
                    <div className="absolute inset-0 opacity-15 bg-cover bg-center" style={{ backgroundImage: `url(${dailyWatch.photoUrl})` }} />
                  )}
                  <div className="relative flex w-full items-center gap-3">
                    <Avatar name={dailyWatch.name} emoji={dailyWatch.emoji} accent={dailyWatch.accent} size={44} photoUrl={dailyWatch.photoUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-content">{dailyWatch.name}</p>
                      <p className="text-xs text-muted">{dailyWatch.category || 'Rotation pick'}</p>
                    </div>
                    <ArrowRight size={15} className="shrink-0 text-muted" />
                  </div>
                </button>
                {(() => {
                  const days = daysSinceLastScore(data, dailyWatch.id)
                  const modelClips = data.clips.filter((c) => c.modelId === dailyWatch.id)
                  const firstUnscored = modelClips.find((c) => !data.scorecards.some((s) => s.clipId === c.id))
                  return (
                    <div className="mt-2 space-y-1.5">
                      {days !== null && (
                        <p className="flex items-center gap-1 text-xs text-muted">
                          <Clock size={10} /> Last scored {days === 0 ? 'today' : `${days}d ago`}
                        </p>
                      )}
                      <button
                        className="btn-ghost w-full text-xs py-1.5"
                        onClick={() => newScorecard({ modelId: dailyWatch.id, clipId: firstUnscored?.id })}
                      >
                        <Plus size={13} /> Score her now
                      </button>
                    </div>
                  )
                })()}
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
                  className="relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-rose/40"
                >
                  {monthlyChamp.model.photoUrl && (
                    <div className="absolute inset-0 opacity-15 bg-cover bg-center" style={{ backgroundImage: `url(${monthlyChamp.model.photoUrl})` }} />
                  )}
                  <div className="relative flex w-full items-center gap-3">
                    <Avatar name={monthlyChamp.model.name} emoji={monthlyChamp.model.emoji} accent={monthlyChamp.model.accent} size={44} photoUrl={monthlyChamp.model.photoUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-content">{monthlyChamp.model.name}</p>
                      <p className="text-xs text-muted">{monthlyChamp.scorecardCount} sessions · avg {monthlyChamp.avgScore}</p>
                    </div>
                    <span className="urban-num shrink-0 text-2xl text-gold">{monthlyChamp.avgScore}</span>
                  </div>
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
              <div className="relative overflow-hidden">
                {top.model.photoUrl && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-top opacity-20 blur-[3px] scale-105"
                      style={{ backgroundImage: `url(${top.model.photoUrl})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/60 to-surface" />
                  </>
                )}
                <div className="relative p-5">
                  <button onClick={() => go('profile', top.model.id)} className="group flex items-center gap-3 text-left">
                    <Avatar
                      name={top.model.name}
                      emoji={top.model.emoji}
                      accent={top.model.accent}
                      size={60}
                      photoUrl={top.model.photoUrl}
                      ring
                    />
                    <div>
                      <p className="font-display text-xl font-bold text-content transition-colors group-hover:text-gold">{top.model.name}</p>
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
            </div>
          )}

          {/* Top rankings */}
          <div className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-display text-base font-bold text-content">Top Rankings</h2>
              <button onClick={() => go('leaderboard')} className="btn-quiet gap-1 text-xs">
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

      {/* ── Bottom row ───────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {improved && (
          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-good">📈 Most Improved</h2>
            </div>
            <div className="p-5">
              <button
                onClick={() => go('profile', improved.stats.model.id)}
                className="relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-good/50"
              >
                {improved.stats.model.photoUrl && (
                  <div className="absolute inset-0 opacity-15 bg-cover bg-center" style={{ backgroundImage: `url(${improved.stats.model.photoUrl})` }} />
                )}
                <div className="relative flex w-full items-center gap-3">
                  <Avatar name={improved.stats.model.name} emoji={improved.stats.model.emoji} accent={improved.stats.model.accent} size={42} photoUrl={improved.stats.model.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-content">{improved.stats.model.name}</p>
                    <p className="text-xs text-muted">Climbing across clips</p>
                  </div>
                  <span className="urban-num shrink-0 text-2xl text-good">+{improved.delta}</span>
                </div>
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
                      <span className="urban-num shrink-0 text-xl" style={{ color: scoreTier(c.total).color }}>{c.total}</span>
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
