interface SparklineProps {
  values: number[]
  width?: number
  height?: number
}

export function Sparkline({ values, width = 60, height = 18 }: SparklineProps) {
  if (values.length < 2) return null

  const n = values.length - 1
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 2

  const pts = values.map((v, i) => ({
    x: (i / n) * (width - pad * 2) + pad,
    y: height - pad - ((v - min) / range) * (height - pad * 2),
  }))

  const pointsStr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const delta = values[n] - values[0]
  const color = delta > 5 ? 'var(--good)' : delta < -5 ? 'var(--bad)' : '#5a5a6c'
  const last = pts[n]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible', display: 'block' }}
      aria-hidden="true"
    >
      <polyline
        points={pointsStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
    </svg>
  )
}
