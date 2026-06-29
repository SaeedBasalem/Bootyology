import { useState } from 'react'
import { Plus, Search, Pencil, Heart, ClipboardPlus, Users } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { useActions } from '../components/ActionsProvider'
import { SectionHeader, Avatar, Badge, EmptyState } from '../components/ui'
import { statsForModel, scoreTier } from '../lib/scoring'
import { classNames } from '../lib/util'

type Filter = 'all' | 'favorites' | 'scored' | 'unscored'

export function Models() {
  const { data } = useStore()
  const { go } = useNav()
  const { newModel, editModel, newScorecard } = useActions()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'favorites', label: '♥ Favourites' },
    { key: 'scored', label: 'Scored' },
    { key: 'unscored', label: 'Not scored' },
  ]

  let models = data.models.filter((m) => !m.archived)
  if (query.trim()) {
    const q = query.toLowerCase()
    models = models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.aliases?.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }
  models = models.filter((m) => {
    const stats = statsForModel(data, m.id)
    if (filter === 'favorites') return m.favorite
    if (filter === 'scored') return stats.rounds > 0
    if (filter === 'unscored') return stats.rounds === 0
    return true
  })
  models.sort((a, b) => statsForModel(data, b.id).average - statsForModel(data, a.id).average || a.name.localeCompare(b.name))

  return (
    <div>
      <SectionHeader
        title="Roster"
        subtitle={`${data.models.filter((m) => !m.archived).length} models in your studio.`}
        action={
          <button className="btn-gold" onClick={newModel}>
            <Plus size={16} /> Add model
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[180px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search models…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={classNames(
                'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                filter === f.key ? 'border-gold bg-surface2 text-gold' : 'border-line text-muted hover:text-content',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {models.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No models here"
          message={query || filter !== 'all' ? 'Try clearing the search or filter.' : 'Add the performers you follow to start ranking them.'}
          action={
            <button className="btn-gold" onClick={newModel}>
              <Plus size={16} /> Add your first model
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {models.map((m) => {
            const stats = statsForModel(data, m.id)
            const tier = scoreTier(stats.average)
            return (
              <div key={m.id} className="card group p-4 transition hover:border-gold/40">
                <div className="flex items-start gap-3">
                  <button onClick={() => go('profile', m.id)}>
                    <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={50} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => go('profile', m.id)} className="block text-left">
                      <p className="flex items-center gap-1.5 truncate font-semibold text-content group-hover:text-gold">
                        {m.name} {m.favorite && <Heart size={13} className="fill-rose text-rose" />}
                      </p>
                      {m.aliases && <p className="truncate text-xs text-muted">aka {m.aliases}</p>}
                    </button>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.tags.slice(0, 3).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => editModel(m)} className="btn-quiet h-8 w-8 shrink-0 p-0" aria-label="Edit">
                    <Pencil size={14} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-surface2 py-2">
                    <p className="font-display text-lg font-bold" style={{ color: tier.color }}>
                      {stats.rounds ? stats.average : '—'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted">Avg</p>
                  </div>
                  <div className="rounded-lg bg-surface2 py-2">
                    <p className="font-display text-lg font-bold text-content">{stats.rounds ? stats.best : '—'}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted">Best</p>
                  </div>
                  <div className="rounded-lg bg-surface2 py-2">
                    <p className="font-display text-lg font-bold text-content">{stats.rounds}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted">Rounds</p>
                  </div>
                </div>

                <button onClick={() => newScorecard({ modelId: m.id })} className="btn-ghost mt-3 w-full">
                  <ClipboardPlus size={15} /> Score
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
