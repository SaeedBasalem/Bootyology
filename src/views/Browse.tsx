import { useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import HoverVideoPlayer from 'react-hover-video-player'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { SectionHeader, Avatar, EmptyState } from '../components/ui'
import { ScoreRing } from '../components/ScoreRing'
import { statsForModel, scoreTier } from '../lib/scoring'
import { classNames } from '../lib/util'
import type { Clip } from '../lib/types'

function getVideoUrl(clips: Clip[], modelId: string): string | null {
  const modelClips = clips.filter((c) => c.modelId === modelId && c.url)
  for (const clip of modelClips) {
    if (!clip.url) continue
    if (clip.url.includes('youtube.com') || clip.url.includes('youtu.be')) continue
    return clip.url
  }
  return null
}

export function Browse() {
  const { data } = useStore()
  const { go } = useNav()
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')

  const rawCategories = Array.from(
    new Set(data.models.filter((m) => !m.archived && m.category).map((m) => m.category!)),
  ).sort()
  const categories = ['All', ...rawCategories]

  let models = data.models.filter((m) => !m.archived)
  if (category !== 'All') models = models.filter((m) => m.category === category)
  if (query.trim()) {
    const q = query.toLowerCase()
    models = models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)) ||
        (m.category ?? '').toLowerCase().includes(q),
    )
  }
  models = [...models].sort(
    (a, b) => statsForModel(data, b.id).average - statsForModel(data, a.id).average || a.name.localeCompare(b.name),
  )

  const totalShown = models.length
  const totalAll = data.models.filter((m) => !m.archived).length

  return (
    <div>
      <SectionHeader
        title="Browse"
        subtitle="Discover models by category — hover a card to preview her clip."
      />

      {/* Category tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
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
                'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition',
                category === cat
                  ? 'border-gold bg-surface2 text-gold'
                  : 'border-line text-muted hover:text-content',
              )}
            >
              {cat}
              <span className="ml-1.5 text-xs opacity-55">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Search + count */}
      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            placeholder="Search name, tag, category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {(query || category !== 'All') && (
          <span className="shrink-0 text-xs text-muted">
            Showing <span className="font-semibold text-content">{totalShown}</span> of {totalAll}
          </span>
        )}
      </div>

      {models.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="Nothing here"
          message="Try a different category or clear the search."
          action={
            <button className="btn-ghost" onClick={() => { setCategory('All'); setQuery('') }}>
              Clear filters
            </button>
          }
        />
      ) : (
        /* CSS columns masonry — photos are different heights so this creates a natural waterfall */
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-4">
          {models.map((m) => {
            const stats = statsForModel(data, m.id)
            const tier = scoreTier(stats.average)
            const videoUrl = getVideoUrl(data.clips, m.id)

            return (
              <button
                key={m.id}
                onClick={() => go('profile', m.id)}
                className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-card transition hover:border-gold/40 hover:shadow-[0_8px_30px_rgba(227,188,99,0.12)]"
              >
                {/* Photo / hover-play area */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  {m.photoUrl ? (
                    videoUrl ? (
                      <HoverVideoPlayer
                        videoSrc={videoUrl}
                        pausedOverlay={
                          <img
                            src={m.photoUrl}
                            alt={m.name}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        }
                        loadingOverlay={
                          <div className="absolute inset-0 bg-black/40" />
                        }
                        className="absolute inset-0 h-full w-full"
                        videoClassName="absolute inset-0 h-full w-full object-cover"
                        muted
                        loop
                        disableRemotePlayback
                      />
                    ) : (
                      <img src={m.photoUrl} alt={m.name} className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div
                      className="flex h-full items-center justify-center"
                      style={{ background: `radial-gradient(circle at 40% 35%, ${m.accent}33, ${m.accent}08)` }}
                    >
                      <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={72} />
                    </div>
                  )}

                  {/* Dark gradient overlay at bottom */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                  {/* Score ring — top right */}
                  {stats.rounds > 0 && (
                    <div className="absolute right-2 top-2 rounded-full bg-black/50 p-0.5 backdrop-blur-sm">
                      <ScoreRing score={stats.average} size={44} strokeWidth={3} />
                    </div>
                  )}

                  {/* Hover-play indicator */}
                  {videoUrl && (
                    <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/60 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                      ▶ preview
                    </div>
                  )}

                  {/* Name + category at bottom */}
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-display text-sm font-bold leading-tight text-white drop-shadow truncate">
                      {m.name}
                    </p>
                    {m.category && (
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                        {m.category}
                      </p>
                    )}
                    {stats.rounds > 0 && (
                      <p className="text-[10px] font-semibold" style={{ color: tier.color }}>
                        {tier.label}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
