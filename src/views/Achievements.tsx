import { useStore } from '../lib/store'
import { SectionHeader } from '../components/ui'
import { getAchievements, achievementSummary, getJudgeLevelInfo } from '../lib/achievements'
import { leaderboard, scoreTier } from '../lib/scoring'
import { useNav } from '../lib/nav'
import { Avatar } from '../components/ui'
import { classNames } from '../lib/util'
import type { Achievement } from '../lib/achievements'

const CATEGORY_LABELS: Record<Achievement['category'], { label: string; icon: string; color: string }> = {
  judging: { label: 'Judging', icon: '⚖️', color: 'var(--gold)' },
  roster: { label: 'Roster', icon: '🌟', color: '#7aa7d8' },
  scoring: { label: 'Scoring', icon: '📊', color: 'var(--good)' },
  ritual: { label: 'Ritual', icon: '🔥', color: 'var(--rose)' },
  legend: { label: 'Legend', icon: '👑', color: 'var(--gold)' },
}

export function Achievements() {
  const { data } = useStore()
  const { go } = useNav()
  const list = getAchievements(data)
  const summary = achievementSummary(data)
  const hallOfFame = leaderboard(data, 'best').slice(0, 5)
  const levelInfo = getJudgeLevelInfo(data)

  const categories = ['judging', 'roster', 'scoring', 'ritual', 'legend'] as const

  return (
    <div className="space-y-6">
      <SectionHeader title="Achievements & Hall of Fame" subtitle="Milestones for keeping a consistent, fun ritual." />

      {/* Judge Level card */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-black p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #cc1111, transparent)' }} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          {/* Level badge */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-cm-red/40 bg-cm-red/10">
            <span className="font-display text-4xl font-black text-white">{levelInfo.level}</span>
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-white/40">Judge Level</p>
            <p className="mt-0.5 font-display text-2xl font-bold cm-glow">{levelInfo.title}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cm-red transition-all" style={{ width: `${levelInfo.progress * 100}%` }} />
              </div>
              <span className="shrink-0 text-xs text-white/40">{levelInfo.xp} XP</span>
            </div>
            <p className="mt-1 text-xs text-white/30">Next level at {levelInfo.nextXp} XP</p>
          </div>
          <div className="flex gap-6 text-center sm:text-left">
            <div>
              <p className="font-display text-2xl font-bold text-white">{levelInfo.currentStreak}</p>
              <p className="text-xs text-white/40">Day streak</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-white">{levelInfo.longestStreak}</p>
              <p className="text-xs text-white/40">Best streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress banner */}
      <div className="card flex items-center gap-4 p-5">
        <div className="relative flex h-16 w-16 items-center justify-center shrink-0">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${(summary.unlocked / summary.total) * 97.4} 97.4`} />
          </svg>
          <span className="absolute font-display text-sm font-bold text-content">{summary.unlocked}/{summary.total}</span>
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
              <button key={e.model.id} onClick={() => go('profile', e.model.id)}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-gold/50">
                <span className="w-6 text-center text-xl">{['🥇','🥈','🥉'][i] ?? `#${i+1}`}</span>
                <Avatar name={e.model.name} emoji={e.model.emoji} accent={e.model.accent} size={40} photoUrl={e.model.photoUrl} />
                <span className="flex-1 truncate font-semibold text-content">{e.model.name}</span>
                <span className="font-display text-xl font-bold" style={{ color: scoreTier(e.best).color }}>{e.best}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Achievements by category */}
      {categories.map((cat) => {
        const catList = list.filter((a) => a.category === cat)
        const catMeta = CATEGORY_LABELS[cat]
        return (
          <div key={cat}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <span>{catMeta.icon}</span>
              <span style={{ color: catMeta.color }}>{catMeta.label}</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {catList.map((a) => (
                <div key={a.id} className={classNames('card p-4 transition', a.achieved ? 'border-gold/40' : 'opacity-80')}>
                  <div className="flex items-start gap-3">
                    <div className={classNames('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl', a.achieved ? 'bg-surface2' : 'bg-surface2 opacity-40 grayscale')}>
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
      })}
    </div>
  )
}
