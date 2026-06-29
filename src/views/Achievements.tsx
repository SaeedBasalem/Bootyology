import { useStore } from '../lib/store'
import { SectionHeader } from '../components/ui'
import { getAchievements, achievementSummary } from '../lib/achievements'
import { leaderboard, scoreTier } from '../lib/scoring'
import { useNav } from '../lib/nav'
import { Avatar } from '../components/ui'
import { classNames } from '../lib/util'

export function Achievements() {
  const { data } = useStore()
  const { go } = useNav()
  const list = getAchievements(data)
  const summary = achievementSummary(data)
  const hallOfFame = leaderboard(data, 'best').slice(0, 5)

  return (
    <div className="space-y-6">
      <SectionHeader title="Achievements & Hall of Fame" subtitle="Milestones for keeping a consistent, fun ritual." />

      {/* Progress banner */}
      <div className="card flex items-center gap-4 p-5">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(summary.unlocked / summary.total) * 97.4} 97.4`}
            />
          </svg>
          <span className="absolute font-display text-sm font-bold text-content">
            {summary.unlocked}/{summary.total}
          </span>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">
            {summary.unlocked === summary.total ? 'All unlocked — legendary! 🏆' : 'Keep the streak going'}
          </h2>
          <p className="text-sm text-muted">{summary.unlocked} of {summary.total} milestones earned.</p>
        </div>
      </div>

      {/* Hall of Fame */}
      {hallOfFame.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold text-gold">🏛️ Hall of Fame</h2>
          <p className="mb-3 text-xs text-muted">Ranked by personal best score.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {hallOfFame.map((e, i) => (
              <button
                key={e.model.id}
                onClick={() => go('profile', e.model.id)}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-gold/50"
              >
                <span className="w-6 text-center text-xl">{['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`}</span>
                <Avatar name={e.model.name} emoji={e.model.emoji} accent={e.model.accent} size={40} />
                <span className="flex-1 truncate font-semibold text-content">{e.model.name}</span>
                <span className="font-display text-xl font-bold" style={{ color: scoreTier(e.best).color }}>
                  {e.best}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badges grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <div
            key={a.id}
            className={classNames(
              'card p-4 transition',
              a.achieved ? 'border-gold/50' : 'opacity-90',
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={classNames(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl',
                  a.achieved ? 'bg-surface2' : 'bg-surface2 opacity-40 grayscale',
                )}
              >
                {a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-content">{a.title}</p>
                  {a.achieved && <span className="text-good">✓</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted">{a.desc}</p>
              </div>
            </div>
            {!a.achieved && (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${a.progress * 100}%` }} />
                </div>
                <p className="mt-1 text-right text-[11px] text-muted">{a.hint}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
