import React, { useState } from 'react'
import {
  ArrowLeft, Pencil, ClipboardPlus, Heart, Trash2, Trophy, Calendar,
  Film, Plus, Instagram, Twitter, Globe, Link, MapPin, Ruler,
  Clock, Zap, TrendingUp, Star, Flame,
} from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import 'yet-another-react-lightbox/styles.css'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { useActions } from '../components/ActionsProvider'
import { Avatar, Badge, Stat, EmptyState, ProgressBar, CyclingPhoto } from '../components/ui'
import { ClipCard } from '../components/ClipCard'
import { ScoreRadar, TrendChart } from '../components/Charts'
import { CRITERIA, CRITERIA_BY_KEY } from '../lib/criteria'
import {
  statsForModel, leaderboard, normalizeCriterion, scoreTier, tierProgress,
  daysSinceLastScore, pct, MAX_TOTAL,
} from '../lib/scoring'
import type { CriterionKey, Model, Clip } from '../lib/types'
import { formatDate } from '../lib/util'

type LightboxSlide =
  | { src: string }
  | { type: 'video'; sources: { src: string; type: string }[]; poster?: string }

export function ModelProfile() {
  const { data, deleteScorecard, toast } = useStore()
  const { modelId, prevView, go } = useNav()
  const { editModel, newScorecard, editScorecard, newClip, playClip } = useActions()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const model = data.models.find((m) => m.id === modelId)
  if (!model) {
    return (
      <EmptyState
        icon={<Trophy size={28} />}
        title="Model not found"
        message="It may have been removed."
        action={<button className="btn-gold" onClick={() => go('models')}>Back to roster</button>}
      />
    )
  }

  const stats = statsForModel(data, model.id)
  const board = leaderboard(data, data.settings.rankBy)
  const rank = board.find((b) => b.model.id === model.id)?.rank
  const modelClips = data.clips.filter((c) => c.modelId === model.id)
  const unscoredClips = modelClips.filter((c) => !data.scorecards.some((s) => s.clipId === c.id))
  const daysSince = daysSinceLastScore(data, model.id)
  const nextClipToScore: Clip | undefined = unscoredClips[0] ?? modelClips[0]

  const ref = stats.latestCard
  const ranked = ref
    ? CRITERIA.map((c) => ({ c, norm: normalizeCriterion(c.key, ref.scores[c.key] ?? 0) })).sort((a, b) => b.norm - a.norm)
    : []
  const strengths = ranked.slice(0, 3)
  const weaknesses = ranked.slice(-3).reverse()

  const trendData = stats.cards.map((card, i) => {
    const clip = data.clips.find((cl) => cl.id === card.clipId)
    return { label: clip?.title.slice(0, 12) ?? `#${i + 1}`, Total: card.total }
  })

  const tierProg = stats.rounds > 0 ? tierProgress(stats.average) : null

  // Build lightbox slides: all photos first, then playable video clips
  const allPhotos = [model.photoUrl, ...(model.photos ?? [])].filter(Boolean) as string[]
  const playableClips = modelClips.filter(
    (c) => c.url && !c.url.includes('youtube.com') && !c.url.includes('youtu.be'),
  )
  const slides: LightboxSlide[] = [
    ...allPhotos.map((src) => ({ src })),
    ...playableClips.map((c) => ({
      type: 'video' as const,
      sources: [{ src: c.url!, type: c.mimeType || 'video/mp4' }],
      poster: model.photoUrl || undefined,
    })),
  ]

  function openLightbox(index: number) {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  function handleDelete(id: string) {
    deleteScorecard(id)
    setConfirmDelete(null)
    toast({ title: 'Scorecard deleted' })
  }

  return (
    <div className="space-y-5">
      {/* YARL lightbox — photos + video clips */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={lightboxIndex}
        plugins={[Video]}
      />

      <button onClick={() => go(prevView)} className="btn-quiet -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      {/* ── 2-column layout (lg+) ───────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[2fr_3fr]">

        {/* ═══ LEFT COLUMN ══════════════════════════════════════════════ */}
        <div className="space-y-5">

          {/* Hero card */}
          <div className="relative overflow-hidden rounded-2xl border border-line bg-black shadow-card">
            {allPhotos.length > 0 ? (
              <div className="absolute inset-0 flex overflow-hidden">
                {Array.from({ length: Math.max(3, Math.min(6, allPhotos.length)) }).map((_, i) => {
                  const stagger = Math.round(4500 / Math.max(3, allPhotos.length))
                  return (
                    <div key={i} className="relative flex-1 overflow-hidden" style={{ minWidth: 0 }}>
                      <CyclingPhoto photos={allPhotos} startDelay={i * stagger} intervalMs={4500} />
                    </div>
                  )
                })}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
              </div>
            ) : (
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: `radial-gradient(circle at 70% 50%, ${model.accent}, transparent 60%)` }}
              />
            )}

            <div className="relative p-5">
              {/* Photo thumbnail + click to lightbox */}
              {allPhotos.length > 0 ? (
                <button
                  onClick={() => openLightbox(0)}
                  className="relative mb-4 h-52 w-full overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-2 transition hover:ring-4"
                  style={{ '--tw-ring-color': model.accent } as React.CSSProperties}
                >
                  <CyclingPhoto photos={allPhotos} alt={model.name} intervalMs={3500} />
                  {allPhotos.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {allPhotos.map((_, di) => (
                        <span key={di} className="inline-block h-1 w-1 rounded-full bg-white/70" />
                      ))}
                    </div>
                  )}
                  {playableClips.length > 0 && (
                    <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/60 backdrop-blur-sm">
                      +{playableClips.length} clip{playableClips.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              ) : (
                <div className="mb-4 flex justify-center">
                  <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={96} ring />
                </div>
              )}

              {/* Name + meta */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-display text-2xl font-bold text-white drop-shadow">{model.name}</h1>
                {model.favorite && <Heart size={16} className="fill-rose text-rose" />}
                {rank === 1 && <Flame size={15} className="text-cm-red-soft" />}
                {rank && (
                  <div
                    className="rank-badge h-8 w-8 rounded-lg text-xl shadow"
                    style={{
                      background: rank === 1 ? 'linear-gradient(135deg,#f3d791,#e3bc63)' : 'rgba(255,255,255,0.12)',
                      color: rank === 1 ? '#241606' : 'white',
                      backdropFilter: 'blur(4px)',
                      fontFamily: "'Bebas Neue', Impact, sans-serif",
                    }}
                  >
                    {rank}
                  </div>
                )}
                {model.workspace && (
                  <Badge className="bg-white/10 text-white/60 border border-white/15">{model.workspace}</Badge>
                )}
              </div>
              {model.aliases && <p className="mb-2 text-sm text-white/60">aka {model.aliases}</p>}

              {/* Detail chips */}
              <div className="flex flex-wrap gap-1 mb-3">
                {model.tags.map((t) => <Badge key={t}>{t}</Badge>)}
                {model.category && <Badge color={model.accent}>{model.category}</Badge>}
                {model.nationality && (
                  <Badge className="border border-white/15 bg-white/10 text-white/70">
                    <MapPin size={11} /> {model.nationality}
                  </Badge>
                )}
                {model.height && (
                  <Badge className="border border-white/15 bg-white/10 text-white/70">
                    <Ruler size={11} /> {model.height}
                  </Badge>
                )}
                {model.measurements && (
                  <Badge className="border border-white/15 bg-white/10 text-white/70">{model.measurements}</Badge>
                )}
                {model.discoveredYear && (
                  <Badge className="border border-white/15 bg-white/10 text-white/70">
                    <Calendar size={11} /> since {model.discoveredYear}
                  </Badge>
                )}
              </div>

              {/* Last scored */}
              {daysSince !== null && (
                <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  daysSince === 0 ? 'bg-good/20 text-good' :
                  daysSince <= 2 ? 'bg-gold/15 text-gold' :
                  daysSince <= 7 ? 'bg-rose/15 text-rose' :
                  'bg-cm-red/20 text-cm-red-soft'
                }`}>
                  <Clock size={11} />
                  {daysSince === 0 ? 'Scored today' : `Last scored ${daysSince}d ago`}
                  {daysSince > 7 && ' — overdue!'}
                </div>
              )}
              {daysSince === null && stats.rounds === 0 && modelClips.length > 0 && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-cm-red/25 px-3 py-1 text-xs font-bold text-cm-red-soft">
                  <Zap size={11} /> Has clips — needs your verdict!
                </div>
              )}

              <SocialLinks model={model} />

              {/* Bio */}
              {model.bio && (
                <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm leading-relaxed text-white/80 backdrop-blur-sm border border-white/10">
                  {model.bio}
                </p>
              )}
              {!model.bio && model.notes && (
                <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-white/60">{model.notes}</p>
              )}

              {/* Action buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-ghost border-white/20 text-white/70 hover:text-white" onClick={() => editModel(model)}>
                  <Pencil size={14} /> Edit
                </button>
                {nextClipToScore ? (
                  <button className="btn-cm" onClick={() => newScorecard({ modelId: model.id, clipId: nextClipToScore.id })}>
                    <ClipboardPlus size={14} />
                    {unscoredClips.length > 0 ? 'Score next clip' : 'Re-score'}
                  </button>
                ) : (
                  <button className="btn-gold" onClick={() => newClip({ modelId: model.id })}>
                    <Plus size={14} /> Add clip first
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tier progress */}
          {tierProg && (
            <div className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">Current tier</p>
                  <p className="mt-0.5 font-display text-xl font-bold" style={{ color: tierProg.current.color }}>
                    {tierProg.current.label}
                  </p>
                </div>
                {tierProg.next ? (
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">Next tier</p>
                    <p className="mt-0.5 font-display text-xl font-bold" style={{ color: tierProg.next.color }}>
                      {tierProg.next.label}
                    </p>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="urban-num text-3xl text-gold">ELITE</p>
                    <p className="text-xs text-muted">Top tier unlocked!</p>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <ProgressBar value={tierProg.pctToNext * 100} color={tierProg.current.color} height={8} />
              </div>
              {tierProg.next && (
                <p className="mt-2 text-xs text-muted">
                  <span className="font-bold text-content">{tierProg.pointsNeeded} points</span> away from{' '}
                  <span style={{ color: tierProg.next.color }}>{tierProg.next.label}</span>
                </p>
              )}
            </div>
          )}

          {/* Photo gallery */}
          {(model.photos ?? []).length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 font-display text-lg font-semibold">Photo gallery</h2>
              <div className="grid grid-cols-3 gap-2">
                {(model.photos ?? []).map((p, i) => (
                  <button
                    key={p}
                    onClick={() => openLightbox(model.photoUrl ? i + 1 : i)}
                    className="aspect-square overflow-hidden rounded-xl border border-line transition hover:border-gold/50 hover:scale-[1.03]"
                  >
                    <img src={p} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
                {/* Show video clip thumbnails if any */}
                {playableClips.map((clip, ci) => (
                  <button
                    key={clip.id}
                    onClick={() => openLightbox(allPhotos.length + ci)}
                    className="aspect-square overflow-hidden rounded-xl border border-line bg-surface2 transition hover:border-gold/50 hover:scale-[1.03] relative flex items-center justify-center"
                  >
                    {model.photoUrl && (
                      <img src={model.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
                    )}
                    <Film size={22} className="relative text-gold" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clips */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Film size={18} className="text-gold" /> Clips
                <span className="text-sm font-normal text-muted">({modelClips.length})</span>
                {unscoredClips.length > 0 && (
                  <span className="rounded-full bg-cm-red px-2 py-0.5 text-[10px] font-bold text-white">
                    {unscoredClips.length} unscored
                  </span>
                )}
              </h2>
              <button className="btn-ghost text-sm" onClick={() => newClip({ modelId: model.id })}>
                <Plus size={14} /> Link clip
              </button>
            </div>
            <div className="p-5">
              {modelClips.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line py-8 text-center">
                  <Film size={24} className="text-muted" />
                  <p className="text-sm text-muted">No clips yet — add one to start scoring.</p>
                  <button className="btn-cm" onClick={() => newClip({ modelId: model.id })}>
                    <Plus size={14} /> Add first clip
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {modelClips.map((clip) => (
                    <ClipCard key={clip.id} clip={clip} showModel={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═════════════════════════════════════════════ */}
        <div className="space-y-5">
          {stats.rounds === 0 ? (
            <EmptyState
              icon={<ClipboardPlus size={28} />}
              title="No scorecards yet"
              message={modelClips.length > 0
                ? `Score one of ${model.name}'s ${modelClips.length} clip${modelClips.length !== 1 ? 's' : ''} to unlock her full analytics.`
                : `Add a clip for ${model.name} and score it to unlock trends, a strengths radar, and ranking.`
              }
              action={
                nextClipToScore ? (
                  <button className="btn-cm" onClick={() => newScorecard({ modelId: model.id, clipId: nextClipToScore.id })}>
                    <ClipboardPlus size={16} /> Score her now
                  </button>
                ) : (
                  <button className="btn-gold" onClick={() => newClip({ modelId: model.id })}>
                    <Plus size={16} /> Add clip to score
                  </button>
                )
              }
            />
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Average" value={stats.average} sub={`${pct(stats.average)}% · ${scoreTier(stats.average).label}`} icon={<Trophy size={18} />} />
                <Stat label="Best" value={stats.best} sub={`of ${MAX_TOTAL}`} accent="var(--good)" icon={<Star size={18} />} />
                <Stat label="Latest" value={stats.latest} accent="var(--rose)" sub={stats.trend !== 0 ? `${stats.trend > 0 ? '+' : ''}${stats.trend} vs prev` : 'steady'} icon={<TrendingUp size={18} />} />
                <Stat label="Scorecards" value={stats.rounds} icon={<Film size={18} />} accent="var(--cm-red)" />
              </div>

              {/* Charts: radar + trend */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {ref && (
                  <div className="card p-5">
                    <h2 className="mb-2 font-display text-lg font-semibold">Criteria radar</h2>
                    <ScoreRadar series={[{ name: model.name, color: model.accent, scores: ref.scores }]} />
                  </div>
                )}
                <div className="card p-5">
                  <h2 className="mb-2 font-display text-lg font-semibold">Score over time</h2>
                  {trendData.length >= 2 ? (
                    <TrendChart data={trendData} lines={[{ key: 'Total', color: model.accent }]} />
                  ) : (
                    <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center text-sm text-muted">
                      <p>Score another clip to see the trend.</p>
                      {nextClipToScore && (
                        <button className="btn-cm text-xs" onClick={() => newScorecard({ modelId: model.id, clipId: nextClipToScore.id })}>
                          <ClipboardPlus size={13} /> Score next clip
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Strengths / weaknesses */}
              {ref && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="card p-5">
                    <h2 className="mb-3 font-display text-lg font-semibold text-good">Strengths</h2>
                    <div className="space-y-2">
                      {strengths.map(({ c, norm }) => (
                        <CriterionBar key={c.key} k={c.key} norm={norm} value={ref.scores[c.key]} />
                      ))}
                    </div>
                  </div>
                  <div className="card p-5">
                    <h2 className="mb-3 font-display text-lg font-semibold text-rose">Room to grow</h2>
                    <div className="space-y-2">
                      {weaknesses.map(({ c, norm }) => (
                        <CriterionBar key={c.key} k={c.key} norm={norm} value={ref.scores[c.key]} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Scorecard history */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h2 className="font-display text-lg font-semibold">Scorecard history</h2>
                  {nextClipToScore && (
                    <button className="btn-cm text-xs" onClick={() => newScorecard({ modelId: model.id, clipId: nextClipToScore.id })}>
                      <ClipboardPlus size={13} /> Score next clip
                    </button>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  {stats.cards.slice().reverse().map((card) => {
                    const clip = data.clips.find((c) => c.id === card.clipId)
                    const tier = scoreTier(card.total)
                    const isBest = card.total === stats.best && stats.rounds > 1
                    return (
                      <div
                        key={card.id}
                        className="rounded-xl border border-line bg-surface2 p-4 transition hover:border-line/80"
                        style={isBest ? { borderColor: 'rgba(227,188,99,0.4)' } : undefined}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {clip ? (
                              <button onClick={() => playClip(clip)} className="flex items-center gap-1.5 text-left group">
                                <Film size={13} className="shrink-0 text-gold" />
                                <p className="truncate font-semibold text-content group-hover:text-gold transition-colors">
                                  {clip.title}
                                </p>
                              </button>
                            ) : (
                              <p className="font-semibold text-content">Scorecard</p>
                            )}
                            <p className="mt-0.5 text-xs text-muted">{formatDate(card.date)}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {isBest && (
                              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                                PB ★
                              </span>
                            )}
                            <div className="text-right">
                              <span className="urban-num text-3xl" style={{ color: tier.color }}>{card.total}</span>
                              <span className="text-xs text-muted">/{MAX_TOTAL}</span>
                            </div>
                            <button onClick={() => editScorecard(card)} className="btn-quiet h-8 w-8 p-0" aria-label="Edit">
                              <Pencil size={14} />
                            </button>
                            {confirmDelete === card.id ? (
                              <button onClick={() => handleDelete(card.id)} className="btn-danger h-8 px-2 text-xs">Sure?</button>
                            ) : (
                              <button onClick={() => setConfirmDelete(card.id)} className="btn-quiet h-8 w-8 p-0 text-bad" aria-label="Delete">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {CRITERIA.map((c) => (
                            <span key={c.key} className="rounded-md bg-surface px-2 py-0.5 text-[11px] text-muted" title={c.label}>
                              {c.short}{' '}
                              <span className={c.isDeduction && card.scores[c.key] < 0 ? 'font-bold text-bad' : 'font-bold text-content'}>
                                {card.scores[c.key]}
                              </span>
                            </span>
                          ))}
                        </div>
                        {card.comments && <p className="mt-3 text-sm italic text-muted">"{card.comments}"</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SocialLinks({ model }: { model: Model }) {
  const links = [
    { icon: <Instagram size={14} />, href: model.instagram, label: 'Instagram' },
    { icon: <Twitter size={14} />, href: model.twitter, label: 'Twitter' },
    { icon: <Link size={14} />, href: model.onlyfans, label: 'OnlyFans' },
    { icon: <Globe size={14} />, href: model.website, label: 'Website' },
  ].filter((l) => l.href)

  if (links.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => {
        const href = l.href!.startsWith('http') ? l.href! : `https://${l.href}`
        return (
          <a
            key={l.label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-2.5 py-1 text-xs font-medium text-white/60 transition hover:border-gold/50 hover:text-white"
          >
            {l.icon} {l.label}
          </a>
        )
      })}
    </div>
  )
}

function CriterionBar({ k, norm, value }: { k: CriterionKey; norm: number; value: number }) {
  const c = CRITERIA_BY_KEY[k]
  const color = norm >= 80 ? 'var(--gold)' : norm >= 60 ? 'var(--good)' : 'var(--rose)'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-content">{c.label}</span>
        <span className="text-muted">{value}/{c.isDeduction ? c.min : c.max}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${norm}%`, background: color }} />
      </div>
    </div>
  )
}
