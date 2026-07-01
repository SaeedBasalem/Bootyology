import { SectionHeader, Badge } from '../components/ui'
import { CRITERIA, MAX_TOTAL } from '../lib/criteria'

export function Guide() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Scoring guide"
        subtitle={`The ${CRITERIA.length}-criterion CM v3 system — ${MAX_TOTAL} points possible. Same criteria, every round.`}
      />

      {/* Overview table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface2 text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Criterion</th>
                <th className="px-4 py-3 text-center">Points</th>
                <th className="px-4 py-3">Main focus</th>
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((c) => (
                <tr key={c.key} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-display font-bold text-muted">{c.num}</td>
                  <td className="px-4 py-3 font-semibold text-content">{c.label}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge color={c.isDeduction ? 'var(--bad)' : 'var(--gold)'}>
                      {c.isDeduction ? `${c.min}` : c.max}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.focus}</td>
                </tr>
              ))}
              <tr className="bg-surface2 font-bold">
                <td className="px-4 py-3" colSpan={2}>
                  Total possible
                </td>
                <td className="px-4 py-3 text-center text-gold">{MAX_TOTAL}</td>
                <td className="px-4 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed bands */}
      <div className="grid gap-4 lg:grid-cols-2">
        {CRITERIA.map((c) => (
          <div key={c.key} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-content">
                {c.num}. {c.label}
              </h3>
              <Badge color={c.isDeduction ? 'var(--bad)' : 'var(--gold)'}>
                {c.isDeduction ? `${c.min} deduction` : `max ${c.max}`}
              </Badge>
            </div>
            <p className="mb-3 text-xs italic text-muted">{c.focus}</p>
            <div className="space-y-1.5">
              {c.bands.map((b, i) => (
                <div key={i} className="flex gap-3 rounded-lg bg-surface2 px-3 py-2 text-sm">
                  <span className="w-16 shrink-0 font-display font-bold text-gold">
                    {b.min === b.max ? b.min : `${b.min}–${b.max}`}
                  </span>
                  <span className="text-muted">{b.label}</span>
                </div>
              ))}
            </div>
            {c.samples.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Sample notes</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.samples.map((s, i) => (
                    <span key={i} className="rounded-md bg-surface2 px-2 py-1 text-xs italic text-muted">
                      "{s}"
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="pb-2 text-center text-xs text-muted">
        A personal, subjective fan system — a consistent way to keep notes, not a verdict on anyone.
      </p>
    </div>
  )
}
