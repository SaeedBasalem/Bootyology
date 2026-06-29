import { BarChart3, TrendingUp, Award, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { SectionHeader, EmptyState, Stat, Avatar } from '../components/ui'
import { CriteriaBarChart } from '../components/Charts'
import { CRITERIA, CRITERIA_BY_KEY } from '../lib/criteria'
import { criterionAverages, mostImproved, scoreTier } from '../lib/scoring'

export function Insights() {
  const { data } = useStore()
  const { go } = useNav()
  const cards = data.scorecards

  if (cards.length === 0) {
    return (
      <div>
        <SectionHeader title="Insights" subtitle="Patterns across your whole roster." />
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

  // highest single scorecard
  const topCard = cards.slice().sort((a, b) => b.total - a.total)[0]
  const topModel = data.models.find((m) => m.id === topCard.modelId)

  const avgAll = Math.round(cards.reduce((s, c) => s + c.total, 0) / cards.length)

  return (
    <div className="space-y-6">
      <SectionHeader title="Insights" subtitle="Patterns across your whole roster." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Overall avg" value={avgAll} icon={<BarChart3 size={18} />} />
        <Stat
          label="Strongest area"
          value={strongest.c.short}
          sub={`${strongest.norm}% of max`}
          accent="var(--good)"
          icon={<Award size={18} />}
        />
        <Stat
          label="Weakest area"
          value={weakest.c.short}
          sub={`${weakest.norm}% of max`}
          accent="var(--rose)"
          icon={<TrendingUp size={18} />}
        />
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
                  <span className="w-14 shrink-0 text-right text-sm font-semibold text-muted">
                    {v}/{max}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          {improved && (
            <div className="card p-5">
              <h2 className="mb-3 font-display text-lg font-semibold text-good">📈 Most improved</h2>
              <button
                onClick={() => go('profile', improved.stats.model.id)}
                className="flex w-full items-center gap-3 rounded-xl bg-surface2 p-3 text-left transition hover:opacity-90"
              >
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
              <button
                onClick={() => go('profile', topModel.id)}
                className="flex w-full items-center gap-3 rounded-xl bg-surface2 p-3 text-left transition hover:opacity-90"
              >
                <Avatar name={topModel.name} emoji={topModel.emoji} accent={topModel.accent} size={44} />
                <div className="flex-1">
                  <p className="font-semibold text-content">{topModel.name}</p>
                  <p className="text-xs text-muted">{scoreTier(topCard.total).label} verdict</p>
                </div>
                <span className="font-display text-2xl font-bold" style={{ color: scoreTier(topCard.total).color }}>
                  {topCard.total}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
