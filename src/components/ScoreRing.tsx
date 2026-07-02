import { scoreTier, pct } from '../lib/scoring'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function ScoreRing({ score, size = 56, strokeWidth = 4, className = '' }: ScoreRingProps) {
  const tier = scoreTier(score)
  const percentage = pct(score)
  const r = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * r
  const filled = (percentage / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={tier.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled.toFixed(2)} ${(circumference - filled).toFixed(2)}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-bold leading-none"
          style={{
            color: tier.color,
            fontSize: size >= 50 ? 12 : 10,
          }}
        >
          {score > 0 ? score : '—'}
        </span>
      </div>
    </div>
  )
}
