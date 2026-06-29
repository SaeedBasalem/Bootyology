import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Avatar, Badge } from './ui'
import type { RankedModel } from '../lib/scoring'
import { pct, scoreTier } from '../lib/scoring'
import { useNav } from '../lib/nav'
import { classNames } from '../lib/util'

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function LeaderRow({ entry, metricLabel }: { entry: RankedModel; metricLabel: string }) {
  const { go } = useNav()
  const tier = scoreTier(entry.metric)
  const percentage = pct(entry.metric)

  return (
    <button
      onClick={() => go('profile', entry.model.id)}
      className={classNames(
        'group flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition hover:border-gold/50 hover:bg-surface2',
        entry.rank === 1 && 'shadow-glow',
      )}
    >
      <div className="flex w-9 shrink-0 items-center justify-center">
        {MEDALS[entry.rank] ? (
          <span className="text-2xl">{MEDALS[entry.rank]}</span>
        ) : (
          <span className="font-display text-lg font-bold text-muted">{entry.rank}</span>
        )}
      </div>
      <Avatar name={entry.model.name} emoji={entry.model.emoji} accent={entry.model.accent} size={42} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-content group-hover:text-gold">{entry.model.name}</p>
          {entry.model.favorite && <span className="text-rose">♥</span>}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface2 sm:w-36">
            <div className="h-full rounded-full" style={{ width: `${percentage}%`, background: tier.color }} />
          </div>
          <span className="text-xs text-muted">
            {entry.rounds} round{entry.rounds === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-xl font-bold" style={{ color: tier.color }}>
            {entry.metric}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted">{metricLabel}</span>
        </div>
        {entry.trend !== 0 ? (
          <Badge color={entry.trend > 0 ? 'var(--good)' : 'var(--bad)'}>
            {entry.trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {entry.trend > 0 ? '+' : ''}
            {entry.trend}
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
