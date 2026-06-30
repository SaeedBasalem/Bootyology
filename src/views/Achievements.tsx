import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { getAchievements, achievementSummary, getJudgeLevelInfo } from '../lib/achievements'
import { leaderboard, scoreTier } from '../lib/scoring'
import { Avatar } from '../components/ui'
import { classNames } from '../lib/util'
import type { Achievement } from '../lib/achievements'
import { Crown, Flame, Star } from 'lucide-react'

const CATEGORY_META: Record<Achievement['category'], { label: string; icon: string; color: string; bg: string }> = {
  judging:   { label: 'Judging',   icon: '⚖️', color: '#e3bc63',       bg: 'rgba(227,188,99,0.06)'  },
  roster:    { label: 'Roster',    icon: '🌟', color: '#7aa7d8',       bg: 'rgba(122,167,216,0.06)' },
  scoring:   { label: 'Scoring',   icon: '📊', color: 'var(--good)',   bg: 'rgba(111,194,141,0.06)' },
  ritual:    { label: 'Ritual',    icon: '🔥', color: 'var(--rose)',   bg: 'rgba(217,138,138,0.06)' },
  legend:    { label: 'Legend',    icon: '👑', color: 'var(--gold)',   bg: 'rgba(227,188,99,0.08)'  },
  clips:     { label: 'Clips',     icon: '🎬', color: '#c88ad8',       bg: 'rgba(200,138,216,0.06)' },
  endurance: { label: 'Endurance', icon: '🛡️', color: '#e84030',       bg: 'rgba(232,64,48,0.06)'   },
}

export function Achievements() {
  const { data } = useStore()
  const { go } = useNav()
  const list = getAchievements(data)
  const summary = achievementSummary(data)
  const hallOfFame = leaderboard(data, 'best').slice(0, 5)
  const levelInfo = getJudgeLevelInfo(data)
  const categories = ['judging', 'clips', 'endurance', 'roster', 'scoring', 'ritual', 'legend'] as const
  const unlockedCount = list.filter((a) => a.achieved).length

  return (
    <div className="space-y-6">

      {/* ── Judge Level hero ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-cm-red/30 bg-black">
        {/* Red radial bloom */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(204,17,17,0.45), transparent 65%)' }} />
        <div className="pointer-events-none absolute -bottom-12 left-0 h-48 w-48 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(227,188,99,0.4), transparent 65%)' }} />

        <div className="relative p-6 sm:p-8">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Your Judge Profile</p>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            {/* Level badge */}
            <div className="relative shrink-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-cm-red/50 bg-cm-red/12 shadow-[0_0_30px_rgba(204,17,17,0.35)]">
                <span className="urban-num text-5xl text-white">{levelInfo.level}</span>
              </div>
              {levelInfo.currentStreak > 1 && (
                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cm-red text-[10px]">
                  <Flame size={12} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-display text-2xl font-bold cm-glow sm:text-3xl">{levelInfo.title}</p>
              <p className="mt-0.5 text-sm text-white/45">Judge Level {levelInfo.level}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-cm-red-soft to-cm-red transition-all duration-700" style={{ width: `${levelInfo.progress * 100}%` }} />
                </div>
                <span className="shrink-0 text-xs font-semibold text-white/40">{levelInfo.xp} XP</span>
              </div>
              <p className="mt-1 text-xs text-white/25">Next level at {levelInfo.nextXp} XP</p>
            </div>

            {/* Streak stats */}
            <div className="flex gap-6 shrink-0">
              <div className="text-center">
                <p className="urban-num text-3xl text-white">{levelInfo.currentStreak}</p>
                <p className="text-xs text-white/40">Day streak</p>
                {levelInfo.currentStreak > 0 && <Flame size={12} className="mx-auto mt-0.5 text-cm-red-soft" />}
              </div>
              <div className="text-center">
                <p className="urban-num text-3xl text-gold">{levelInfo.longestStreak}</p>
                <p className="text-xs text-white/40">Best streak</p>
                <Star size={12} className="mx-auto mt-0.5 text-gold opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress ring + unlocked showcase ────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          {/* Ring */}
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(summary.unlocked / summary.total) * 94.2} 94.2`} />
            </svg>
            <span className="absolute font-display text-sm font-bold text-content">{summary.unlocked}/{summary.total}</span>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">
              {summary.unlocked === summary.total
                ? 'All unlocked — legendary! 🏆'
                : `${summary.unlocked} milestone${summary.unlocked !== 1 ? 's' : ''} earned`}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{summary.total - summary.unlocked} remaining to unlock.</p>
          </div>
          {/* Unlocked emoji strip */}
          {unlockedCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {list.filter((a) => a.achieved).slice(0, 8).map((a) => (
                <span key={a.id} title={a.title} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface2 text-lg border border-gold/20">
                  {a.icon}
                </span>
              ))}
              {unlockedCount > 8 && (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface2 text-xs font-bold text-muted border border-line">
                  +{unlockedCount - 8}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Hall of Fame ─────────────────────────────────────────────────────── */}
      {hallOfFame.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-surface">
          {/* Gold gradient header */}
          <div className="relative overflow-hidden border-b border-gold/20 px-5 py-4" style={{ background: 'linear-gradient(135deg, rgba(227,188,99,0.12), rgba(227,188,99,0.04))' }}>
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(227,188,99,0.25), transparent)' }} />
            <div className="relative flex items-center gap-2">
              <Crown size={16} className="text-gold" />
              <h2 className="font-display text-lg font-semibold text-gold">Hall of Fame</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted">Ranked by personal best score.</p>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {hallOfFame.map((e, i) => (
              <button
                key={e.model.id}
                onClick={() => go('profile', e.model.id)}
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface2 p-3 text-left transition hover:border-gold/50"
              >
                {/* Photo bg */}
                {e.model.photoUrl && (
                  <div className="absolute inset-0 opacity-10 bg-cover bg-center transition group-hover:opacity-18" style={{ backgroundImage: `url(${e.model.photoUrl})` }} />
                )}
                <div className="relative flex items-center gap-3 w-full">
                  <span className="w-7 shrink-0 text-center text-xl">{['🥇','🥈','🥉'][i] ?? `#${i+1}`}</span>
                  <Avatar name={e.model.name} emoji={e.model.emoji} accent={e.model.accent} size={40} photoUrl={e.model.photoUrl} />
                  <span className="flex-1 truncate font-semibold text-content">{e.model.name}</span>
                  <span className="urban-num text-2xl shrink-0" style={{ color: scoreTier(e.best).color }}>{e.best}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Achievements by category ─────────────────────────────────────────── */}
      {categories.map((cat) => {
        const catList = list.filter((a) => a.category === cat)
        const catMeta = CATEGORY_META[cat]
        const catUnlocked = catList.filter((a) => a.achieved).length
        return (
          <div key={cat}>
            {/* Category header */}
            <div className="mb-3 flex items-center gap-3">
              <span className="text-xl">{catMeta.icon}</span>
              <h2 className="font-display text-lg font-semibold" style={{ color: catMeta.color }}>
                {catMeta.label}
              </h2>
              <span className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${catMeta.color}18`, color: catMeta.color }}>
                {catUnlocked}/{catList.length}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {catList.map((a) => (
                <div
                  key={a.id}
                  className={classNames(
                    'relative overflow-hidden rounded-2xl border p-4 transition',
                    a.achieved
                      ? 'shadow-[0_4px_16px_rgba(0,0,0,0.25)]'
                      : 'opacity-75',
                  )}
                  style={{
                    borderColor: a.achieved ? `${catMeta.color}50` : 'var(--border)',
                    background: a.achieved ? catMeta.bg : 'var(--surface)',
                  }}
                >
                  {/* Subtle glow for unlocked */}
                  {a.achieved && (
                    <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl opacity-50"
                      style={{ background: `radial-gradient(circle, ${catMeta.color}, transparent)` }} />
                  )}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={classNames('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl')}
                      style={{
                        background: a.achieved ? `${catMeta.color}18` : 'var(--surface-2)',
                        border: `1px solid ${a.achieved ? `${catMeta.color}35` : 'var(--border)'}`,
                        filter: a.achieved ? undefined : 'grayscale(1) opacity(0.4)',
                      }}
                    >
                      {a.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-content">{a.title}</p>
                        {a.achieved && (
                          <span className="shrink-0 text-xs font-bold" style={{ color: catMeta.color }}>✓</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{a.desc}</p>
                    </div>
                  </div>
                  {!a.achieved && (
                    <div className="relative mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                        <div className="h-full rounded-full transition-all" style={{ width: `${a.progress * 100}%`, background: catMeta.color }} />
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
