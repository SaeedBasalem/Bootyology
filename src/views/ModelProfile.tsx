import React, { useState } from 'react'
import {
  ArrowLeft, Pencil, ClipboardPlus, Heart, Trash2, Trophy, Calendar,
  Film, Plus, Instagram, Twitter, Globe, Link, MapPin, Ruler, ChevronLeft,
  ChevronRight, Clock, Zap, TrendingUp, Star, Flame,
} from 'lucide-react'
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

export function ModelProfile() {
  const { data, deleteScorecard, toast } = useStore()
  const { modelId, go } = useNav()
  const { editModel, newScorecard, editScorecard, newClip, playClip } = useActions()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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

  // Pick the best clip to score next (unscored first)
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

  // All photos for lightbox
  const allPhotos = [model.photoUrl, ...(model.photos ?? [])].filter(Boolean) as string[]

  function handleDelete(id: string) {
    deleteScorecard(id)
    setConfirmDelete(null)
    toast({ title: 'Scorecard deleted' })
  }

  return (
    <div className="space-y-6">
      {/* Lightbox */}
      {lightboxIndex !== null && allPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => ((i ?? 0) - 1 + allPhotos.length) % allPhotos.length) }}
          >
            <ChevronLeft size={22} />
          </button>
          <img
            src={allPhotos[lightboxIndex]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => ((i ?? 0) + 1) % allPhotos.length) }}
          >
            <ChevronRight size={22} />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/50">
            {lightboxIndex + 1} / {allPhotos.length}
          </p>
        </div>
      )}

      <button onClick={() => go('leaderboard')} className="btn-quiet -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      {/* ── Hero card — photo mosaic background ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-black shadow-card">

        {/* Photo mosaic background — each strip cycles through all photos with a
            staggered delay, creating a cascading shutter effect */}
        {allPhotos.length > 0 ? (
          <div className="absolute inset-0 flex overflow-hidden">
            {Array.from({ length: Math.max(3, Math.min(6, allPhotos.length)) }).map((_, i) => {
              const stagger = Math.round(4500 / Math.max(3, allPhotos.length))
              return (
                <div key={i} className="relative flex-1 overflow-hidden" style={{ minWidth: 0 }}>
                  <CyclingPhoto
                    photos={allPhotos}
                    startDelay={i * stagger}
                    intervalMs={4500}
                  />
                </div>
              )
            })}
            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
          </div>
        ) : (
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(circle at 70% 50%, ${model.accent}, transparent 60%)` }}
          />
        )}

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Main photo — cycles through gallery automatically */}
            {allPhotos.length > 0 ? (
              <button
                onClick={() => setLightboxIndex(0)}
                className="relative shrink-0 h-36 w-36 sm:h-44 sm:w-44 overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-2 transition hover:ring-4"
                style={{ '--tw-ring-color': model.accent } as React.CSSProperties}
              >
                <CyclingPhoto photos={allPhotos} alt={model.name} intervalMs={3500} />
                {/* Dot indicator along the bottom */}
                {allPhotos.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {allPhotos.map((_, di) => (
                      <span key={di} className="inline-block h-1 w-1 rounded-full bg-white/70" />
                    ))}
                  </div>
                )}
              </button>
            ) : (
              <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={112} ring />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold text-white sm:text-4xl drop-shadow">{model.name}</h1>
                {model.favorite && <Heart size={20} className="fill-rose text-rose" />}
                {rank === 1 && <Flame size={18} className="text-cm-red-soft" />}
                {rank && (
                  <div
                    className="rank-badge h-9 w-9 rounded-lg text-2xl shadow"
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

              {model.aliases && <p className="mt-1 text-sm text-white/60">aka {model.aliases}</p>}

              {/* Detail chips */}
              <div className="mt-3 flex flex-wrap gap-1.5">
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

              {/* Last scored indicator */}
              {daysSince !== null && (
                <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
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
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cm-red/25 px-3 py-1 text-xs font-bold text-cm-red-soft">
                  <Zap size={11} /> Has clips — needs your verdict!
                </div>
              )}

              <SocialLinks model={model} />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <button className="btn-ghost border-white/20 text-white/70 hover:text-white" onClick={() => editModel(model)}>
                <Pencil size={15} /> Edit
              </button>
              {nextClipToScore ? (
                <button
                  className="btn-cm"
                  onClick={() => newScorecard({ modelId: model.id, clipId: nextClipToScore.id })}
                >
                  <ClipboardPlus size={15} />
                  {unscoredClips.length > 0 ? 'Score next clip' : 'Re-score'}
                </button>
              ) : (
                <button className="btn-gold" onClick={() => newClip({ modelId: model.id })}>
                  <Plus size={15} /> Add clip first
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          {model.bio && (
            <p className="relative mt-5 rounded-xl bg-white/5 p-4 text-sm leading-relaxed text-white/80 backdrop-blur-sm border border-white/10">
              {model.bio}
            </p>
          )}
          {!model.bio && model.notes && (
            <p className="relative mt-4 rounded-xl bg-white/5 p-3 text-sm text-white/60">{model.notes}</p>
          )}
        </div>
      </div>

      {/* ── Tier progress bar ─────────────────────────────────────────────────── */}
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
              <span style={{ color: tierProg.next.color }}>{tierProg.next.label}</span> — score more clips!
            </p>
          )}
        </div>
      )}

      {/* ── Photo gallery ─────────────────────────────────────────────────────── */}
      {(model.photos ?? []).length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Photo gallery</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {(model.photos ?? []).map((p, i) => (
              <button
                key={p}
                onClick={() => setLightboxIndex(model.photoUrl ? i + 1 : i)}
                className="aspect-square overflow-hidden rounded-xl border border-line transition hover:border-gold/50 hover:scale-[1.03]"
              >
                <img src={p} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Clips ────────────────────────────────────────────────────────────── */}
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
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line py-10 text-center">
              <Film size={28} className="text-muted" />
              <div>
                <p className="font-semibold text-content">No clips yet</p>
                <p className="mt-0.5 text-sm text-muted">Add a clip for {model.name} to start scoring her</p>
              </div>
              <button className="btn-cm" onClick={() => newClip({ modelId: model.id })}>
                <Plus size={15} /> Add first clip
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modelClips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} showModel={false} />
              ))}
            </div>
          )}
        </div>
      </div>

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
          {/* ── Stats ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Average" value={stats.average} sub={`${pct(stats.average)}% · ${scoreTier(stats.average).label}`} icon={<Trophy size={18} />} />
            <Stat label="Best" value={stats.best} sub={`of ${MAX_TOTAL}`} accent="var(--good)" icon={<Star size={18} />} />
            <Stat label="Latest" value={stats.latest} accent="var(--rose)" sub={stats.trend !== 0 ? `${stats.trend > 0 ? '+' : ''}${stats.trend} vs prev` : 'steady'} icon={<TrendingUp size={18} />} />
            <Stat label="Scorecards" value={stats.rounds} icon={<Film size={18} />} accent="var(--cm-red)" />
          </div>

          {/* ── Charts ─────────────────────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {ref && (
              <div className="card p-5">
                <h2 className="mb-2 font-display text-lg font-semibold">Latest profile</h2>
                <ScoreRadar series={[{ name: model.name, color: model.accent, scores: ref.scores }]} />
              </div>
            )}
            <div className="card p-5">
              <h2 className="mb-2 font-display text-lg font-semibold">Score over time</h2>
              {trendData.length >= 2 ? (
                <TrendChart data={trendData} lines={[{ key: 'Total', color: model.accent }]} />
              ) : (
                <div className="flex h-[240px] flex-col items-center justify-center gap-3 text-center text-sm text-muted">
                  <p>Score another clip to see the trend line.</p>
                  {nextClipToScore && (
                    <button className="btn-cm text-xs" onClick={() => newScorecard({ modelId: model.id, clipId: nextClipToScore.id })}>
                      <ClipboardPlus size={13} /> Score next clip
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Strengths / weaknesses ─────────────────────────────────────── */}
          {ref && (
            <div className="grid gap-6 lg:grid-cols-2">
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

          {/* ── Scorecard history ──────────────────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold">Scorecard history</h2>
              {nextClipToScore && (
                <button
                  className="btn-cm text-xs"
                  onClick={() => newScorecard({ modelId: model.id, clipId: nextClipToScore.id })}
                >
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
                          <button
                            onClick={() => playClip(clip)}
                            className="flex items-center gap-1.5 text-left group"
                          >
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
                        <span
                          key={c.key}
                          className="rounded-md bg-surface px-2 py-0.5 text-[11px] text-muted"
                          title={c.label}
                        >
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
    <div className="mt-2.5 flex flex-wrap gap-2">
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
