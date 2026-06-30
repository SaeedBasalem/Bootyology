import React, { useState } from 'react'
import { BarChart3, TrendingUp, Award, Sparkles, Calendar, TrendingDown } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { EmptyState, Stat, Avatar } from '../components/ui'
import { CriteriaBarChart } from '../components/Charts'
import { CRITERIA, CRITERIA_BY_KEY } from '../lib/criteria'
import { criterionAverages, mostImproved, scoreTier, scoreHeatmap, seasonalReports, rankingsHistory } from '../lib/scoring'
import { classNames } from '../lib/util'

function HeatmapGrid({ days }: { days: { date: string; count: number; avgScore: number }[] }) {
  const byDate: Record<string, { count: number; avgScore: number }> = {}
  for (const d of days) byDate[d.date] = d

  const today = new Date()
  const weeks: string[][] = []
  const startDay = new Date(today)
  startDay.setDate(startDay.getDate() - startDay.getDay() - 51 * 7)

  for (let w = 0; w < 52; w++) {
    const week: string[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDay)
      date.setDate(startDay.getDate() + w * 7 + d)
      week.push(date.toISOString().slice(0, 10))
    }
    weeks.push(week)
  }

  function colorFor(date: string) {
    const entry = byDate[date]
    if (!entry) return 'var(--surface-2)'
    const c = entry.count
    if (c >= 5) return '#cc1111'
    if (c >= 3) return 'rgba(204,17,17,0.7)'
    if (c >= 2) return 'rgba(204,17,17,0.45)'
    return 'rgba(204,17,17,0.25)'
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const d = new Date(week[0])
    if (d.getMonth() !== lastMonth) { monthLabels.push({ label: months[d.getMonth()], col: wi }); lastMonth = d.getMonth() }
  })

  return (
    <div className="overflow-x-auto">
      <div className="mb-1 flex" style={{ paddingLeft: 28 }}>
        {weeks.map((_, wi) => {
          const ml = monthLabels.find((m) => m.col === wi)
          return <div key={wi} className="flex-1 text-[10px] text-muted" style={{ minWidth: 12 }}>{ml?.label ?? ''}</div>
        })}
      </div>
      <div className="flex gap-px">
        <div className="mr-1 flex flex-col gap-px">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="flex items-center justify-center text-[9px] text-muted" style={{ height: 12, opacity: i % 2 === 0 ? 0 : 1 }}>{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-px">
            {week.map((date) => {
              const entry = byDate[date]
              return (
                <div key={date} title={entry ? `${date}: ${entry.count} sessions, avg ${entry.avgScore}` : date} className="rounded-[2px] transition" style={{ width: 12, height: 12, background: colorFor(date) }} />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
        <span>Less</span>
        {['var(--surface-2)','rgba(204,17,17,0.25)','rgba(204,17,17,0.45)','rgba(204,17,17,0.7)','#cc1111'].map((c) => (
          <div key={c} className="h-3 w-3 rounded-[2px]" style={{ background: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

function RankingsTimeline() {
  const { data } = useStore()
  const { go } = useNav()
  const history = rankingsHistory(data)
  const allModels = data.models.filter((m) => !m.archived)

  if (history.length < 2) return <p className="text-sm text-muted">Need at least 2 rounds with scorecards to show ranking changes.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-line">
            <th className="pb-2 text-left font-semibold text-muted">Model</th>
            {history.map((h) => (
              <th key={h.roundId} className="max-w-[80px] px-2 pb-2 text-center font-semibold text-muted">
                <div className="truncate">{h.roundName}</div>
                <div className="text-[10px] font-normal opacity-60">{h.date}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allModels.map((model) => {
            const ranks = history.map((h) => ({ rank: h.ranks[model.id], score: h.scores[model.id] }))
            if (ranks.every((r) => r.rank === undefined)) return null
            return (
              <tr key={model.id} className="border-b border-line/50 transition hover:bg-surface2">
                <td className="py-2">
                  <button onClick={() => go('profile', model.id)} className="flex items-center gap-2">
                    <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={24} photoUrl={model.photoUrl} />
                    <span className="font-medium text-content">{model.name}</span>
                  </button>
                </td>
                {ranks.map((r, i) => {
                  const prev = i > 0 ? ranks[i - 1].rank : undefined
                  const moved = prev !== undefined && r.rank !== undefined ? prev - r.rank : 0
                  return (
                    <td key={i} className="px-2 py-2 text-center">
                      {r.rank !== undefined ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold text-content">#{r.rank}</span>
                          <span className="text-[10px] text-muted">{r.score}</span>
                          {moved > 0 && <span className="text-[10px] text-good">▲{moved}</span>}
                          {moved < 0 && <span className="text-[10px] text-bad">▼{Math.abs(moved)}</span>}
                        </div>
                      ) : <span className="opacity-30 text-muted">—</span>}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function Insights() {
  const { data } = useStore()
  const { go } = useNav()
  const cards = data.scorecards
  const [tab, setTab] = useState<'overview' | 'heatmap' | 'seasonal' | 'timeline'>('overview')

  if (cards.length === 0) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-line bg-black p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Analytics Studio</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">Insights</h1>
          <p className="mt-1 text-sm text-white/40">Patterns across your whole roster.</p>
        </div>
        <EmptyState icon={<BarChart3 size={28} />} title="No data yet" message="Score a few rounds and trends will appear here." />
      </div>
    )
  }

  const averages = criterionAverages(cards)
  const ranked = CRITERIA.map((c) => ({
    c,
    norm: c.isDeduction
      ? Math.round((1 - Math.abs(averages[c.key]) / Math.abs(c.min)) * 100)
      : Math.round((averages[c.key] / c.max) * 100),
  })).sort((a, b) => b.norm - a.norm)
  const strongest = ranked[0]
  const weakest = ranked[ranked.length - 1]
  const improved = mostImproved(data)
  const topCard = cards.slice().sort((a, b) => b.total - a.total)[0]
  const topModel = data.models.find((m) => m.id === topCard.modelId)
  const avgAll = Math.round(cards.reduce((s, c) => s + c.total, 0) / cards.length)
  const heatmapDays = scoreHeatmap(data)
  const seasonal = seasonalReports(data)

  const TABS: { key: typeof tab; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { key: 'overview',  label: 'Overview',  icon: <BarChart3 size={13} />, color: '#7aa7d8',      desc: 'Averages & standouts' },
    { key: 'heatmap',   label: 'Heatmap',   icon: <Calendar size={13} />,  color: 'var(--cm-red-soft)', desc: 'Judging activity' },
    { key: 'seasonal',  label: 'Seasonal',  icon: <TrendingUp size={13} />,color: 'var(--good)',   desc: 'Quarterly stats' },
    { key: 'timeline',  label: 'Timeline',  icon: <Sparkles size={13} />,  color: 'var(--gold)',   desc: 'Rankings history' },
  ]

  const activeTab = TABS.find((t) => t.key === tab)!

  return (
    <div className="space-y-5">
      {/* Header with active-tab colour accent */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
        <div className="pointer-events-none absolute inset-0 opacity-25 transition-all duration-500"
          style={{ background: `radial-gradient(ellipse 70% 80% at 5% 50%, ${activeTab.color}55, transparent 65%)` }} />
        <div className="relative px-6 py-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Analytics Studio</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Insights</h1>
          <p className="mt-1 text-sm text-white/40">Patterns, trends, and history across your whole roster.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={classNames('flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition')}
                style={tab === t.key
                  ? { borderColor: `${t.color}60`, background: `${t.color}18`, color: t.color }
                  : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }
                }
              >
                {t.icon} {t.label}
                {tab === t.key && <span className="ml-1 text-[10px] opacity-60">— {t.desc}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Overall avg" value={avgAll} icon={<BarChart3 size={18} />} />
            <Stat label="Strongest area" value={strongest.c.short} sub={`${strongest.norm}% of max`} accent="var(--good)" icon={<Award size={18} />} />
            <Stat label="Weakest area" value={weakest.c.short} sub={`${weakest.norm}% of max`} accent="var(--rose)" icon={<TrendingUp size={18} />} />
            <Stat label="Total verdicts" value={cards.length} accent="var(--gold)" icon={<Sparkles size={18} />} />
          </div>
          <div className="card p-5">
            <h2 className="mb-1 font-display text-lg font-semibold">Average strength by criterion</h2>
            <p className="mb-3 text-xs text-muted">How your roster scores on each criterion, as a % of that criterion's max.</p>
            <CriteriaBarChart averages={averages} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-3 font-display text-lg font-semibold">Criterion averages</h2>
              <div className="space-y-2">
                {CRITERIA.map((c) => {
                  const v = averages[c.key]
                  const max = c.isDeduction ? c.min : c.max
                  const norm = ranked.find((r) => r.c.key === c.key)!.norm
                  const color = norm >= 80 ? 'var(--gold)' : norm >= 60 ? 'var(--good)' : 'var(--rose)'
                  return (
                    <div key={c.key} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-sm text-content">{CRITERIA_BY_KEY[c.key].label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface2">
                        <div className="h-full rounded-full" style={{ width: `${norm}%`, background: color }} />
                      </div>
                      <span className="w-14 shrink-0 text-right text-sm font-semibold text-muted">{v}/{max}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="space-y-6">
              {improved && (
                <div className="card p-5">
                  <h2 className="mb-3 font-display text-lg font-semibold text-good">📈 Most improved</h2>
                  <button onClick={() => go('profile', improved.stats.model.id)} className="flex w-full items-center gap-3 rounded-xl bg-surface2 p-3 text-left transition hover:opacity-90">
                    <Avatar name={improved.stats.model.name} emoji={improved.stats.model.emoji} accent={improved.stats.model.accent} size={44} />
                    <div className="flex-1">
                      <p className="font-semibold text-content">{improved.stats.model.name}</p>
                      <p className="text-xs text-muted">First → latest round</p>
                    </div>
                    <span className="font-display text-2xl font-bold text-good">+{improved.delta}</span>
                  </button>
                </div>
              )}
              {topModel && (
                <div className="card p-5">
                  <h2 className="mb-3 font-display text-lg font-semibold text-gold">👑 Highest single score</h2>
                  <button onClick={() => go('profile', topModel.id)} className="flex w-full items-center gap-3 rounded-xl bg-surface2 p-3 text-left transition hover:opacity-90">
                    <Avatar name={topModel.name} emoji={topModel.emoji} accent={topModel.accent} size={44} />
                    <div className="flex-1">
                      <p className="font-semibold text-content">{topModel.name}</p>
                      <p className="text-xs text-muted">{scoreTier(topCard.total).label} verdict</p>
                    </div>
                    <span className="font-display text-2xl font-bold" style={{ color: scoreTier(topCard.total).color }}>{topCard.total}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'heatmap' && (
        <div className="card p-5">
          <h2 className="mb-1 font-display text-lg font-semibold">Judging Activity</h2>
          <p className="mb-4 text-xs text-muted">Each cell = one day. Darker red = more sessions that day.</p>
          <HeatmapGrid days={heatmapDays} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-surface2 p-3 text-center">
              <p className="font-display text-2xl font-bold text-content">{heatmapDays.length}</p>
              <p className="text-xs text-muted">Active days</p>
            </div>
            <div className="rounded-xl bg-surface2 p-3 text-center">
              <p className="font-display text-2xl font-bold text-content">{Math.max(...heatmapDays.map((d) => d.count), 0)}</p>
              <p className="text-xs text-muted">Most in one day</p>
            </div>
            <div className="rounded-xl bg-surface2 p-3 text-center">
              <p className="font-display text-2xl font-bold text-content">{data.judgeProfile?.currentStreak ?? 0}</p>
              <p className="text-xs text-muted">Current streak</p>
            </div>
            <div className="rounded-xl bg-surface2 p-3 text-center">
              <p className="font-display text-2xl font-bold text-content">{data.judgeProfile?.longestStreak ?? 0}</p>
              <p className="text-xs text-muted">Longest streak</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'seasonal' && (
        <div className="card p-5">
          <h2 className="mb-1 font-display text-lg font-semibold">Seasonal Reports</h2>
          <p className="mb-4 text-xs text-muted">Quarterly breakdown of judging activity and average performance.</p>
          {seasonal.length === 0 ? (
            <p className="text-sm text-muted">No quarterly data yet.</p>
          ) : (
            <div className="space-y-3">
              {seasonal.slice().reverse().map((q) => (
                <div key={q.label} className="rounded-xl border border-line bg-surface2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-content">{q.label}</p>
                      <p className="text-xs text-muted">{q.totalCards} scorecards · avg {q.avgScore}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold" style={{ color: scoreTier(q.avgScore).color }}>{q.avgScore}</p>
                      {q.improvement !== 0 && (
                        <p className={classNames('flex items-center justify-end gap-1 text-xs font-semibold', q.improvement > 0 ? 'text-good' : 'text-bad')}>
                          {q.improvement > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {q.improvement > 0 ? '+' : ''}{q.improvement} vs prev
                        </p>
                      )}
                    </div>
                  </div>
                  {q.topModel && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface p-2">
                      <Avatar name={q.topModel.name} emoji={q.topModel.emoji} accent={q.topModel.accent} size={28} photoUrl={q.topModel.photoUrl} />
                      <div>
                        <p className="text-xs font-semibold text-content">{q.topModel.name}</p>
                        <p className="text-[10px] text-muted">Quarter's top performer</p>
                      </div>
                      {q.mostActive && q.mostActive.model.id !== q.topModel.id && (
                        <div className="ml-auto text-right">
                          <p className="text-xs font-semibold text-content">{q.mostActive.model.name}</p>
                          <p className="text-[10px] text-muted">Most active ({q.mostActive.count}×)</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'timeline' && (
        <div className="card p-5">
          <h2 className="mb-1 font-display text-lg font-semibold">Rankings History</h2>
          <p className="mb-4 text-xs text-muted">How each model's rank shifted across every round.</p>
          <RankingsTimeline />
        </div>
      )}
    </div>
  )
}
