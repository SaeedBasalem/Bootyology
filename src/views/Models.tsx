import { useState } from 'react'
import { Plus, Search, Pencil, Heart, ClipboardPlus, Users, LayoutGrid, List, MapPin, Star } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { useActions } from '../components/ActionsProvider'
import { SectionHeader, Avatar, Badge, EmptyState } from '../components/ui'
import { statsForModel, scoreTier } from '../lib/scoring'
import { classNames } from '../lib/util'

type Filter = 'all' | 'favorites' | 'scored' | 'unscored'
type ViewMode = 'magazine' | 'grid' | 'list'

export function Models() {
  const { data } = useStore()
  const { go } = useNav()
  const { newModel, editModel, newScorecard } = useActions()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('magazine')
  const [activeWorkspace, setActiveWorkspace] = useState<string>('all')

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'favorites', label: '♥ Favourites' },
    { key: 'scored', label: 'Scored' },
    { key: 'unscored', label: 'Not scored' },
  ]

  // Collect unique workspaces
  const workspaces = ['all', ...Array.from(new Set(data.models.filter((m) => !m.archived && m.workspace).map((m) => m.workspace!)))]

  let models = data.models.filter((m) => !m.archived)
  if (activeWorkspace !== 'all') models = models.filter((m) => m.workspace === activeWorkspace)
  if (query.trim()) {
    const q = query.toLowerCase()
    models = models.filter(
      (m) => m.name.toLowerCase().includes(q) || m.aliases?.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q)),
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

  const total = data.models.filter((m) => !m.archived).length

  return (
    <div>
      <SectionHeader
        title="Roster"
        subtitle={`${total} model${total !== 1 ? 's' : ''} in your studio.`}
        action={
          <button className="btn-gold" onClick={newModel}>
            <Plus size={16} /> Add model
          </button>
        }
      />

      {/* Workspace tabs */}
      {workspaces.length > 2 && (
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {workspaces.map((ws) => (
            <button
              key={ws}
              onClick={() => setActiveWorkspace(ws)}
              className={classNames(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                activeWorkspace === ws
                  ? 'border-gold bg-surface2 text-gold'
                  : 'border-line text-muted hover:text-content',
              )}
            >
              {ws === 'all' ? 'All workspaces' : ws}
            </button>
          ))}
        </div>
      )}

      {/* Search + filters + view toggle */}
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
        {/* View mode toggle */}
        <div className="ml-auto flex rounded-xl border border-line bg-surface2 p-1">
          {([['magazine', <Star size={14} />], ['grid', <LayoutGrid size={14} />], ['list', <List size={14} />]] as const).map(([mode, icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as ViewMode)}
              className={classNames(
                'flex h-7 w-8 items-center justify-center rounded-lg transition',
                viewMode === mode ? 'bg-gold text-[#241606]' : 'text-muted hover:text-content',
              )}
              title={mode}
            >
              {icon}
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
      ) : viewMode === 'magazine' ? (
        <MagazineView models={models} go={go} editModel={editModel} newScorecard={newScorecard} />
      ) : viewMode === 'grid' ? (
        <GridView models={models} go={go} editModel={editModel} newScorecard={newScorecard} />
      ) : (
        <ListView models={models} go={go} editModel={editModel} newScorecard={newScorecard} />
      )}
    </div>
  )
}

// ── Magazine view (photo-forward editorial cards) ─────────────────────────────

function MagazineView({ models, go, editModel, newScorecard }: ViewProps) {
  const { data } = useStore()
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {models.map((m, i) => {
        const stats = statsForModel(data, m.id)
        const tier = scoreTier(stats.average)
        const rank = i + 1
        return (
          <div key={m.id} className="group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:border-gold/40 hover:shadow-[0_8px_30px_rgba(227,188,99,0.12)]">
            {/* Photo area */}
            <button onClick={() => go('profile', m.id)} className="block w-full">
              {m.photoUrl ? (
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={m.photoUrl}
                    alt={m.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Rank badge */}
                  <div className="absolute left-3 top-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow"
                      style={{ background: rank <= 3 ? 'var(--gold)' : 'rgba(0,0,0,0.6)', color: rank <= 3 ? '#241606' : 'white' }}
                    >
                      #{rank}
                    </span>
                  </div>
                  {m.favorite && (
                    <div className="absolute right-3 top-3">
                      <Heart size={16} className="fill-rose text-rose drop-shadow" />
                    </div>
                  )}
                  {/* Name over photo */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-display text-xl font-bold text-white drop-shadow">{m.name}</p>
                    {m.aliases && <p className="text-xs text-white/70">aka {m.aliases}</p>}
                  </div>
                </div>
              ) : (
                <div
                  className="relative flex h-40 items-center justify-center"
                  style={{ background: `radial-gradient(circle at 30% 25%, ${m.accent}33, ${m.accent}08)` }}
                >
                  <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={72} />
                  <div className="absolute left-3 top-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow"
                      style={{ background: rank <= 3 ? 'var(--gold)' : 'rgba(0,0,0,0.4)', color: rank <= 3 ? '#241606' : 'var(--text)' }}
                    >
                      #{rank}
                    </span>
                  </div>
                  {m.favorite && <Heart size={16} className="absolute right-3 top-3 fill-rose text-rose" />}
                </div>
              )}
            </button>

            {/* Card body */}
            <div className="p-4">
              {!m.photoUrl && (
                <div className="mb-2">
                  <p className="font-display text-lg font-bold text-content">{m.name}</p>
                  {m.aliases && <p className="text-xs text-muted">aka {m.aliases}</p>}
                </div>
              )}

              {/* Tags + details */}
              <div className="flex flex-wrap gap-1 mb-3">
                {m.category && <Badge color={m.accent}>{m.category}</Badge>}
                {m.nationality && <Badge className="border border-line bg-surface2 text-muted"><MapPin size={10} />{m.nationality}</Badge>}
                {m.tags.slice(0, 2).map((t) => <Badge key={t}>{t}</Badge>)}
              </div>

              {/* Score strip */}
              <div className="grid grid-cols-3 gap-2 text-center">
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

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                <button onClick={() => newScorecard({ modelId: m.id })} className="btn-ghost flex-1 text-xs">
                  <ClipboardPlus size={13} /> Score
                </button>
                <button onClick={() => editModel(m)} className="btn-quiet h-8 w-8 shrink-0 p-0" aria-label="Edit">
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Grid view (compact photo cards) ──────────────────────────────────────────

function GridView({ models, go, editModel, newScorecard }: ViewProps) {
  const { data } = useStore()
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {models.map((m) => {
        const stats = statsForModel(data, m.id)
        const tier = scoreTier(stats.average)
        return (
          <div key={m.id} className="card group p-4 transition hover:border-gold/40">
            <div className="flex items-start gap-3">
              <button onClick={() => go('profile', m.id)}>
                <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={50} photoUrl={m.photoUrl} />
              </button>
              <div className="min-w-0 flex-1">
                <button onClick={() => go('profile', m.id)} className="block text-left">
                  <p className="flex items-center gap-1.5 truncate font-semibold text-content group-hover:text-gold">
                    {m.name} {m.favorite && <Heart size={13} className="fill-rose text-rose" />}
                  </p>
                  {m.aliases && <p className="truncate text-xs text-muted">aka {m.aliases}</p>}
                </button>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.category && <Badge color={m.accent}>{m.category}</Badge>}
                  {m.tags.slice(0, 2).map((t) => <Badge key={t}>{t}</Badge>)}
                </div>
              </div>
              <button onClick={() => editModel(m)} className="btn-quiet h-8 w-8 shrink-0 p-0" aria-label="Edit">
                <Pencil size={14} />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-surface2 py-2">
                <p className="font-display text-lg font-bold" style={{ color: tier.color }}>{stats.rounds ? stats.average : '—'}</p>
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
  )
}

// ── List view (compact rows) ──────────────────────────────────────────────────

function ListView({ models, go, editModel, newScorecard }: ViewProps) {
  const { data } = useStore()
  return (
    <div className="card divide-y divide-line overflow-hidden p-0">
      {models.map((m, i) => {
        const stats = statsForModel(data, m.id)
        const tier = scoreTier(stats.average)
        return (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface2">
            <span className="w-6 shrink-0 text-center text-xs font-bold text-muted">#{i + 1}</span>
            <button onClick={() => go('profile', m.id)}>
              <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={38} photoUrl={m.photoUrl} />
            </button>
            <button onClick={() => go('profile', m.id)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-content">
                {m.name} {m.favorite && <Heart size={11} className="inline fill-rose text-rose" />}
              </p>
              {(m.category || m.nationality) && (
                <p className="truncate text-xs text-muted">{[m.category, m.nationality].filter(Boolean).join(' · ')}</p>
              )}
            </button>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-sm font-bold" style={{ color: tier.color }}>{stats.rounds ? stats.average : '—'}</p>
                <p className="text-[10px] text-muted">avg</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-content">{stats.rounds}</p>
                <p className="text-[10px] text-muted">rds</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => newScorecard({ modelId: m.id })} className="btn-quiet h-8 w-8 p-0" aria-label="Score"><ClipboardPlus size={14} /></button>
              <button onClick={() => editModel(m)} className="btn-quiet h-8 w-8 p-0" aria-label="Edit"><Pencil size={14} /></button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ViewProps {
  models: ReturnType<typeof useStore>['data']['models']
  go: (view: 'profile', id: string) => void
  editModel: (m: ReturnType<typeof useStore>['data']['models'][number]) => void
  newScorecard: (opts?: { modelId: string }) => void
}
