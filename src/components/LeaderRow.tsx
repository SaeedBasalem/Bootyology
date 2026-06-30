import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react'
import { Avatar, Badge } from './ui'
import type { RankedModel } from '../lib/scoring'
import { pct, scoreTier } from '../lib/scoring'
import { useNav } from '../lib/nav'
import { classNames } from '../lib/util'

const RANK_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: 'linear-gradient(135deg,#f3d791,#e3bc63)', text: '#241606' },
  2: { bg: 'linear-gradient(135deg,#d4d8e0,#a8b0bc)', text: '#1a1a22' },
  3: { bg: 'linear-gradient(135deg,#e8a87c,#c97040)', text: '#1a0a00' },
}

export function LeaderRow({ entry, metricLabel }: { entry: RankedModel; metricLabel: string }) {
  const { go } = useNav()
  const tier = scoreTier(entry.metric)
  const percentage = pct(entry.metric)
  const isTop3 = entry.rank <= 3
  const rankMeta = RANK_COLORS[entry.rank]

  return (
    <button
      onClick={() => go('profile', entry.model.id)}
      className={classNames(
        'group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface p-3 text-left transition-all duration-200',
        'hover:border-gold/50 hover:bg-surface2 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(227,188,99,0.10)]',
        entry.rank === 1 && 'shadow-[0_0_0_1px_rgba(227,188,99,0.25),0_4px_20px_rgba(227,188,99,0.12)]',
      )}
    >
      {/* Model photo as subtle background */}
      {entry.model.photoUrl && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] bg-cover bg-right transition duration-300 group-hover:opacity-[0.1]"
          style={{ backgroundImage: `url(${entry.model.photoUrl})` }}
        />
      )}
      {/* Left accent stripe */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-0.5 rounded-r" style={{ background: entry.model.accent }} />
      {/* Rank badge — jersey number style */}
      <div className="relative flex w-10 shrink-0 items-center justify-center">
        {isTop3 && rankMeta ? (
          <div
            className="rank-badge h-9 w-9 rounded-lg text-lg"
            style={{ background: rankMeta.bg, color: rankMeta.text, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}
          >
            {entry.rank}
          </div>
        ) : (
          <span className="rank-badge text-xl text-muted" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>
            {entry.rank}
          </span>
        )}
      </div>

      <Avatar
        name={entry.model.name}
        emoji={entry.model.emoji}
        accent={entry.model.accent}
        size={42}
        photoUrl={entry.model.photoUrl}
        ring={entry.rank === 1}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-content group-hover:text-gold transition-colors">{entry.model.name}</p>
          {entry.model.favorite && <span className="text-rose">♥</span>}
          {entry.rank === 1 && <Flame size={13} className="text-cm-red-soft" />}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface2 sm:w-32">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: tier.color }} />
          </div>
          <span className="text-[11px] text-muted">
            {entry.rounds} {entry.rounds === 1 ? 'clip' : 'clips'}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-baseline gap-0.5">
          <span
            className="urban-num text-2xl"
            style={{ color: tier.color, fontFamily: "'Bebas Neue', Impact, sans-serif" }}
          >
            {entry.metric}
          </span>
          <span className="ml-1 text-[9px] uppercase tracking-wider text-muted">{metricLabel}</span>
        </div>
        {entry.trend !== 0 ? (
          <Badge color={entry.trend > 0 ? 'var(--good)' : 'var(--bad)'}>
            {entry.trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {entry.trend > 0 ? '+' : ''}{entry.trend}
          </Badge>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <Minus size={10} /> steady
          </span>
        )}
      </div>
    </button>
  )
}
