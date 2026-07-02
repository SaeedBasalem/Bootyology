import { useState } from 'react'
import { Plus, Search, Pencil, Heart, ClipboardPlus, Users, LayoutGrid, List, MapPin, Star, Flame, Clock, Zap, X } from 'lucide-react'
import HoverVideoPlayer from 'react-hover-video-player'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { useActions } from '../components/ActionsProvider'
import { SectionHeader, Avatar, Badge, EmptyState, CyclingPhoto } from '../components/ui'
import { ScoreRing } from '../components/ScoreRing'
import { statsForModel, scoreTier, daysSinceLastScore } from '../lib/scoring'
import { classNames } from '../lib/util'
import type { Clip } from '../lib/types'

type Filter = 'all' | 'favorites' | 'scored' | 'unscored'
type ViewMode = 'magazine' | 'grid' | 'list'

function getVideoUrl(clips: Clip[], modelId: string): string | null {
  for (const clip of clips) {
    if (clip.modelId !== modelId || !clip.url) continue
    if (clip.url.includes('youtube.com') || clip.url.includes('youtu.be')) continue
    return clip.url
  }
  return null
}

export function Models() {
  const { data } = useStore()
  const { go } = useNav()
  const { newModel, editModel, newScorecard } = useActions()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [category, setCategory] = useState('All')
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

  // Collect unique categories
  const rawCategories = Array.from(new Set(data.models.filter((m) => !m.archived && m.category).map((m) => m.category!))).sort()
  const categories = ['All', ...rawCategories]

  let models = data.models.filter((m) => !m.archived)
  if (activeWorkspace !== 'all') models = models.filter((m) => m.workspace === activeWorkspace)
  if (category !== 'All') models = models.filter((m) => m.category === category)
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

  const totalAll = data.models.filter((m) => !m.archived).length
  const hasActiveFilters = filter !== 'all' || category !== 'All' || query.trim().length > 0

  function clearFilters() {
    setFilter('all')
    setCategory('All')
    setQuery('')
  }

  return (
    <div>
      <SectionHeader
        title="Roster"
        subtitle={`${totalAll} model${totalAll !== 1 ? 's' : ''} in your studio.`}
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

      {/* Category filter chips */}
      {rawCategories.length > 0 && (
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
          {categories.map((cat) => {
            const count =
              cat === 'All'
                ? data.models.filter((m) => !m.archived).length
                : data.models.filter((m) => !m.archived && m.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={classNames(
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition',
                  category === cat
                    ? 'border-gold bg-surface2 text-gold'
                    : 'border-line text-muted hover:text-content',
                )}
              >
                {cat}
                <span className="ml-1 opacity-50">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Search + status filters + view toggle */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
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

      {/* Active filter pill bar */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">
            Showing <span className="font-semibold text-content">{models.length}</span> of {totalAll}
          </span>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="flex items-center gap-1 rounded-full border border-gold/40 bg-surface2 px-2.5 py-0.5 text-xs font-semibold text-gold transition hover:bg-surface"
            >
              {filters.find((f) => f.key === filter)?.label} <X size={10} />
            </button>
          )}
          {category !== 'All' && (
            <button
              onClick={() => setCategory('All')}
              className="flex items-center gap-1 rounded-full border border-gold/40 bg-surface2 px-2.5 py-0.5 text-xs font-semibold text-gold transition hover:bg-surface"
            >
              {category} <X size={10} />
            </button>
          )}
          {query.trim() && (
            <button
              onClick={() => setQuery('')}
              className="flex items-center gap-1 rounded-full border border-gold/40 bg-surface2 px-2.5 py-0.5 text-xs font-semibold text-gold transition hover:bg-surface"
            >
              "{query.trim()}" <X size={10} />
            </button>
          )}
          <button onClick={clearFilters} className="ml-1 text-xs text-muted underline hover:text-content">
            Clear all
          </button>
        </div>
      )}

      {models.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No models here"
          message={hasActiveFilters ? 'Try clearing the search or filter.' : 'Add the performers you follow to start ranking them.'}
          action={
            hasActiveFilters ? (
              <button className="btn-ghost" onClick={clearFilters}>Clear filters</button>
            ) : (
              <button className="btn-gold" onClick={newModel}>
                <Plus size={16} /> Add your first model
              </button>
            )
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

// ── Magazine view (photo-forward editorial cards with hover-play) ──────────────

function MagazineView({ models, go, editModel, newScorecard }: ViewProps) {
  const { data } = useStore()
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {models.map((m, i) => {
        const stats = statsForModel(data, m.id)
        const tier = scoreTier(stats.average)
        const rank = i + 1
        const daysSince = daysSinceLastScore(data, m.id)
        const modelClips = data.clips.filter((c) => c.modelId === m.id)
        const hasUnscoredClips = modelClips.some((c) => !data.scorecards.some((s) => s.clipId === c.id))
        const videoUrl = getVideoUrl(data.clips, m.id)

        return (
          <div key={m.id} className={classNames(
            'group relative overflow-hidden rounded-2xl border bg-surface shadow-card transition',
            hasUnscoredClips
              ? 'border-cm-red/30 hover:border-cm-red/60 hover:shadow-[0_8px_28px_rgba(204,17,17,0.18)]'
              : 'border-line hover:border-gold/40 hover:shadow-[0_8px_30px_rgba(227,188,99,0.12)]',
          )}>
            {/* Photo / hover-play area */}
            <button onClick={() => go('profile', m.id)} className="block w-full">
              {m.photoUrl ? (
                <div className="relative h-60 w-full overflow-hidden">
                  {videoUrl ? (
                    <HoverVideoPlayer
                      videoSrc={videoUrl}
                      pausedOverlay={
                        <CyclingPhoto
                          photos={[m.photoUrl, ...(m.photos ?? [])]}
                          alt={m.name}
                          intervalMs={4500}
                          startDelay={i * 800}
                        />
                      }
                      loadingOverlay={<div className="absolute inset-0 bg-black/30" />}
                      className="absolute inset-0 h-full w-full"
                      videoClassName="absolute inset-0 h-full w-full object-cover"
                      muted
                      loop
                      disableRemotePlayback
                    />
                  ) : (
                    <CyclingPhoto
                      photos={[m.photoUrl, ...(m.photos ?? [])]}
                      alt={m.name}
                      intervalMs={4500}
                      startDelay={i * 800}
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />

                  {/* Photo count / hover-play pip */}
                  {(m.photos ?? []).length > 0 && !videoUrl && (
                    <div className="absolute bottom-[72px] left-3 pointer-events-none">
                      <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/70 backdrop-blur-sm">
                        {Array.from({ length: Math.min((m.photos ?? []).length + 1, 5) }).map((_, di) => (
                          <span key={di} className="inline-block h-1 w-1 rounded-full bg-white/60" />
                        ))}
                      </span>
                    </div>
                  )}
                  {videoUrl && (
                    <div className="pointer-events-none absolute bottom-[72px] left-3 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/55 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                      ▶ preview
                    </div>
                  )}

                  {/* Rank badge */}
                  <div className="pointer-events-none absolute left-3 top-3">
                    <span
                      className="rank-badge flex h-8 w-8 rounded-lg text-base shadow-lg"
                      style={{
                        background: rank === 1 ? 'linear-gradient(135deg,#f3d791,#e3bc63)' : rank <= 3 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.55)',
                        color: rank === 1 ? '#241606' : 'white',
                        backdropFilter: 'blur(4px)',
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                      }}
                    >
                      {rank}
                    </span>
                  </div>

                  {/* Score ring (replaces tier pill) */}
                  {stats.rounds > 0 && (
                    <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 p-0.5 backdrop-blur-sm">
                      <ScoreRing score={stats.average} size={46} strokeWidth={3} />
                    </div>
                  )}
                  {stats.rounds === 0 && m.category && (
                    <div className="pointer-events-none absolute right-3 top-3">
                      <span className="tier-pill" style={{ background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}55` }}>
                        {m.category}
                      </span>
                    </div>
                  )}

                  {m.favorite && (
                    <div className="pointer-events-none absolute right-3 bottom-[72px]">
                      <Heart size={15} className="fill-rose text-rose drop-shadow" />
                    </div>
                  )}
                  {rank === 1 && (
                    <div className="pointer-events-none absolute left-3 bottom-[72px]">
                      <Flame size={15} className="text-cm-red-soft drop-shadow" />
                    </div>
                  )}

                  {/* Name over photo */}
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-display text-xl font-bold leading-tight text-white drop-shadow">{m.name}</p>
                    {m.aliases && <p className="text-[11px] text-white/60">aka {m.aliases}</p>}
                  </div>
                </div>
              ) : (
                <div
                  className="relative flex h-44 items-center justify-center"
                  style={{ background: `radial-gradient(circle at 30% 25%, ${m.accent}33, ${m.accent}08)` }}
                >
                  <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={76} />
                  <div className="pointer-events-none absolute left-3 top-3">
                    <span
                      className="rank-badge flex h-8 w-8 rounded-lg text-base shadow"
                      style={{
                        background: rank === 1 ? 'linear-gradient(135deg,#f3d791,#e3bc63)' : 'rgba(0,0,0,0.4)',
                        color: rank === 1 ? '#241606' : 'var(--text)',
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                      }}
                    >
                      {rank}
                    </span>
                  </div>
                  {stats.rounds > 0 && (
                    <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/40 p-0.5">
                      <ScoreRing score={stats.average} size={44} strokeWidth={3} />
                    </div>
                  )}
                  {m.favorite && <Heart size={15} className="absolute right-3 bottom-3 fill-rose text-rose pointer-events-none" />}
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
                {hasUnscoredClips && (
                  <span className="tier-pill" style={{ background: 'rgba(204,17,17,0.18)', color: 'var(--cm-red-soft)', border: '1px solid rgba(204,17,17,0.3)' }}>
                    <Zap size={9} /> unscored
                  </span>
                )}
                {!hasUnscoredClips && daysSince !== null && (
                  <span className={classNames('tier-pill', daysSince <= 3 ? '' : 'opacity-70')} style={{ background: 'rgba(179,155,139,0.12)', color: 'var(--text-muted)', border: '1px solid rgba(179,155,139,0.2)' }}>
                    <Clock size={9} /> {daysSince === 0 ? 'today' : `${daysSince}d`}
                  </span>
                )}
              </div>

              {/* Score strip */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-surface2 py-2">
                  <p className="urban-num text-2xl" style={{ color: tier.color }}>
                    {stats.rounds ? stats.average : '—'}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Avg</p>
                </div>
                <div className="rounded-lg bg-surface2 py-2">
                  <p className="urban-num text-2xl text-content">{stats.rounds ? stats.best : '—'}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Best</p>
                </div>
                <div className="rounded-lg bg-surface2 py-2">
                  <p className="urban-num text-2xl text-content">{stats.rounds}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Scores</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    const firstUnscored = modelClips.find((c) => !data.scorecards.some((s) => s.clipId === c.id))
                    newScorecard({ modelId: m.id, clipId: firstUnscored?.id })
                  }}
                  className={hasUnscoredClips ? 'btn-cm flex-1 text-xs' : 'btn-ghost flex-1 text-xs'}
                >
                  <ClipboardPlus size={13} /> {hasUnscoredClips ? 'Score now' : 'Score'}
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
        const modelClips = data.clips.filter((c) => c.modelId === m.id)
        const hasUnscoredClips = modelClips.some((c) => !data.scorecards.some((s) => s.clipId === c.id))
        const videoUrl = getVideoUrl(data.clips, m.id)

        return (
          <div key={m.id} className={classNames(
            'card group p-0 overflow-hidden transition',
            hasUnscoredClips ? 'border-cm-red/25 hover:border-cm-red/55' : 'hover:border-gold/40',
          )}>
            {/* Photo + hover-play area */}
            <button onClick={() => go('profile', m.id)} className="relative block h-40 w-full overflow-hidden">
              {m.photoUrl ? (
                videoUrl ? (
                  <HoverVideoPlayer
                    videoSrc={videoUrl}
                    pausedOverlay={
                      <img src={m.photoUrl} alt={m.name} className="absolute inset-0 h-full w-full object-cover" />
                    }
                    className="absolute inset-0 h-full w-full"
                    videoClassName="absolute inset-0 h-full w-full object-cover"
                    muted
                    loop
                    disableRemotePlayback
                  />
                ) : (
                  <img src={m.photoUrl} alt={m.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                )
              ) : (
                <div className="flex h-full items-center justify-center" style={{ background: `radial-gradient(circle, ${m.accent}33, ${m.accent}08)` }}>
                  <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={52} />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {/* Score ring overlay */}
              {stats.rounds > 0 && (
                <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/50 p-0.5 backdrop-blur-sm">
                  <ScoreRing score={stats.average} size={42} strokeWidth={3} />
                </div>
              )}
              {m.favorite && <Heart size={13} className="pointer-events-none absolute right-2 bottom-10 fill-rose text-rose drop-shadow" />}
              {/* Name overlay */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-2.5">
                <p className="truncate font-display text-sm font-bold text-white drop-shadow">{m.name}</p>
              </div>
            </button>

            {/* Card body */}
            <div className="p-3">
              <div className="mb-2 flex flex-wrap gap-1">
                {m.category && <Badge color={m.accent}>{m.category}</Badge>}
                {m.tags.slice(0, 1).map((t) => <Badge key={t}>{t}</Badge>)}
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-lg bg-surface2 py-1.5">
                  <p className="font-display text-base font-bold" style={{ color: tier.color }}>{stats.rounds ? stats.average : '—'}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Avg</p>
                </div>
                <div className="rounded-lg bg-surface2 py-1.5">
                  <p className="font-display text-base font-bold text-content">{stats.rounds ? stats.best : '—'}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Best</p>
                </div>
                <div className="rounded-lg bg-surface2 py-1.5">
                  <p className="font-display text-base font-bold text-content">{stats.rounds}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Clips</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const firstUnscored = modelClips.find((c) => !data.scorecards.some((s) => s.clipId === c.id))
                  newScorecard({ modelId: m.id, clipId: firstUnscored?.id })
                }}
                className={hasUnscoredClips ? 'btn-cm mt-2.5 w-full text-xs' : 'btn-ghost mt-2.5 w-full text-xs'}
              >
                <ClipboardPlus size={13} /> {hasUnscoredClips ? 'Score now' : 'Score'}
              </button>
              <button onClick={() => editModel(m)} className="btn-quiet mt-1 w-full h-7 text-xs p-0" aria-label="Edit">
                <Pencil size={12} /> Edit
              </button>
            </div>
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
            <div className="flex items-center gap-3">
              {stats.rounds > 0 ? (
                <ScoreRing score={stats.average} size={38} strokeWidth={3} />
              ) : (
                <div className="flex flex-col items-end text-right">
                  <p className="text-sm font-bold text-muted">—</p>
                  <p className="text-[10px] text-muted">avg</p>
                </div>
              )}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-content">{stats.rounds}</p>
                <p className="text-[10px] text-muted">scored</p>
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
  newScorecard: (opts?: { modelId?: string; clipId?: string }) => void
}
