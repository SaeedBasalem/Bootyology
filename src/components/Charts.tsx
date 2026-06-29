import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { CRITERIA } from '../lib/criteria'
import { normalizeCriterion } from '../lib/scoring'
import type { CriterionKey, Scores } from '../lib/types'

export interface RadarSeries {
  name: string
  color: string
  scores: Scores
}

export function ScoreRadar({ series, height = 300 }: { series: RadarSeries[]; height?: number }) {
  const data = CRITERIA.map((c) => {
    const row: Record<string, string | number> = { subject: c.short }
    for (const s of series) {
      row[s.name] = normalizeCriterion(c.key, s.scores[c.key] ?? 0)
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        {series.map((s) => (
          <Radar
            key={s.name}
            name={s.name}
            dataKey={s.name}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.28}
            strokeWidth={2}
          />
        ))}
        <Tooltip
          formatter={(v: number) => `${v}%`}
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export interface TrendPoint {
  label: string
  [key: string]: string | number
}

export function TrendChart({
  data,
  lines,
  height = 240,
}: {
  data: TrendPoint[]
  lines: { key: string; color: string }[]
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis domain={[0, 110]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}
          labelStyle={{ color: 'var(--text)' }}
        />
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            stroke={l.color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: l.color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CriteriaBarChart({
  averages,
  height = 280,
}: {
  averages: Record<CriterionKey, number>
  height?: number
}) {
  const data = CRITERIA.map((c) => ({
    name: c.short,
    value: averages[c.key],
    pctOfMax: c.isDeduction
      ? Math.round((1 - Math.abs(averages[c.key]) / Math.abs(c.min)) * 100)
      : Math.round((averages[c.key] / c.max) * 100),
  }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={56} />
        <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Tooltip
          formatter={(v: number, _n, p) => [`${v}% of max (avg ${p.payload.value})`, 'Strength']}
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}
        />
        <Bar dataKey="pctOfMax" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pctOfMax >= 80 ? 'var(--gold)' : d.pctOfMax >= 60 ? 'var(--good)' : 'var(--rose)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
