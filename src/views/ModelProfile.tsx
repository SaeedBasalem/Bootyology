import { useState } from 'react'
import {
  ArrowLeft, Pencil, ClipboardPlus, Heart, Trash2, Trophy, Calendar,
  Film, Plus, Instagram, Twitter, Globe, Link, MapPin, Ruler, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { useActions } from '../components/ActionsProvider'
import { Avatar, Badge, Stat, EmptyState } from '../components/ui'
import { ClipCard } from '../components/ClipCard'
import { ScoreRadar, TrendChart } from '../components/Charts'
import { CRITERIA, CRITERIA_BY_KEY } from '../lib/criteria'
import { statsForModel, leaderboard, normalizeCriterion, scoreTier, pct, MAX_TOTAL } from '../lib/scoring'
import type { CriterionKey, Model } from '../lib/types'
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

  const ref = stats.latestCard
  const ranked = ref
    ? CRITERIA.map((c) => ({ c, norm: normalizeCriterion(c.key, ref.scores[c.key] ?? 0) })).sort((a, b) => b.norm - a.norm)
    : []
  const strengths = ranked.slice(0, 3)
  const weaknesses = ranked.slice(-3).reverse()

  const trendData = stats.cards.map((card, i) => {
    const round = data.rounds.find((r) => r.id === card.roundId)
    return { label: round?.name ?? `R${i + 1}`, Total: card.total }
  })

  function handleDelete(id: string) {
    deleteScorecard(id)
    setConfirmDelete(null)
    toast({ title: 'Scorecard deleted' })
  }

  // All photos for lightbox
  const allPhotos = [model.photoUrl, ...(model.photos ?? [])].filter(Boolean) as string[]

  return (
    <div className="space-y-6">
      {/* Lightbox */}
      {lightboxIndex !== null && allPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
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
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
            {lightboxIndex + 1} / {allPhotos.length}
          </p>
        </div>
      )}

      <button onClick={() => go('leaderboard')} className="btn-quiet -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      {/* ── Hero card ────────────────────────────────────────────────────────── */}
      <div className="card relative overflow-hidden">
        {/* Background photo blur */}
        {model.photoUrl && (
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: `url(${model.photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px)', transform: 'scale(1.1)' }}
          />
        )}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-25 blur-2xl"
          style={{ background: `radial-gradient(circle, ${model.accent}, transparent 70%)` }}
        />

        <div className="relative p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Main photo / avatar */}
            {model.photoUrl ? (
              <button onClick={() => setLightboxIndex(0)} className="shrink-0 overflow-hidden rounded-2xl shadow-lg">
                <img src={model.photoUrl} alt={model.name} className="h-32 w-32 object-cover sm:h-36 sm:w-36" />
              </button>
            ) : (
              <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={96} />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold sm:text-3xl">{model.name}</h1>
                {model.favorite && <Heart size={18} className="fill-rose text-rose" />}
                {rank && (
                  <Badge color={rank <= 3 ? 'var(--gold)' : undefined}>
                    {rank === 1 ? '🥇 #1' : `Rank #${rank}`}
                  </Badge>
                )}
                {model.workspace && (
                  <Badge className="bg-surface2 text-muted border border-line">{model.workspace}</Badge>
                )}
              </div>

              {model.aliases && <p className="mt-0.5 text-sm text-muted">aka {model.aliases}</p>}

              {/* Detail chips */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {model.tags.map((t) => <Badge key={t}>{t}</Badge>)}
                {model.category && <Badge color={model.accent}>{model.category}</Badge>}
                {model.nationality && (
                  <Badge className="border border-line bg-surface2 text-muted">
                    <MapPin size={11} /> {model.nationality}
                  </Badge>
                )}
                {model.height && (
                  <Badge className="border border-line bg-surface2 text-muted">
                    <Ruler size={11} /> {model.height}
                  </Badge>
                )}
                {model.measurements && (
                  <Badge className="border border-line bg-surface2 text-muted">{model.measurements}</Badge>
                )}
                {model.discoveredYear && (
                  <Badge><Calendar size={11} /> since {model.discoveredYear}</Badge>
                )}
              </div>

              {/* Social links */}
              <SocialLinks model={model} />
            </div>

            <div className="flex gap-2 shrink-0">
              <button className="btn-ghost" onClick={() => editModel(model)}>
                <Pencil size={15} /> Edit
              </button>
              <button className="btn-gold" onClick={() => newScorecard({ modelId: model.id })}>
                <ClipboardPlus size={15} /> Score
              </button>
            </div>
          </div>

          {/* Bio */}
          {model.bio && (
            <p className="relative mt-5 rounded-xl bg-black/20 p-4 text-sm leading-relaxed text-content/90 backdrop-blur-sm border border-white/10">
              {model.bio}
            </p>
          )}
          {!model.bio && model.notes && (
            <p className="relative mt-4 rounded-xl bg-surface2 p-3 text-sm text-muted">{model.notes}</p>
          )}
        </div>
      </div>

      {/* ── Photo gallery ─────────────────────────────────────────────────────── */}
      {(model.photos ?? []).length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Photo gallery</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {(model.photos ?? []).map((p, i) => (
              <button
                key={p}
                onClick={() => setLightboxIndex(model.photoUrl ? i + 1 : i)}
                className="aspect-square overflow-hidden rounded-xl border border-line transition hover:border-gold/50 hover:scale-[1.02]"
              >
                <img src={p} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Clips ────────────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Film size={18} className="text-gold" /> Clips
            <span className="text-sm font-normal text-muted">({modelClips.length})</span>
          </h2>
          <button className="btn-ghost" onClick={() => newClip({ modelId: model.id })}>
            <Plus size={15} /> Link clip
          </button>
        </div>
        {modelClips.length === 0 ? (
          <p className="rounded-xl bg-surface2 p-4 text-center text-sm text-muted">
            No clips yet. Attach a clip for {model.name} — then score it directly from the player.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modelClips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} showModel={false} />
            ))}
          </div>
        )}
      </div>

      {stats.rounds === 0 ? (
        <EmptyState
          icon={<ClipboardPlus size={28} />}
          title="Not scored yet"
          message={`Run ${model.name} through a round to unlock trends, a strengths radar and ranking.`}
          action={
            <button className="btn-gold" onClick={() => newScorecard({ modelId: model.id })}>
              <ClipboardPlus size={16} /> Score now
            </button>
          }
        />
      ) : (
        <>
          {/* ── Stats ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Average" value={stats.average} sub={`${pct(stats.average)}% · ${scoreTier(stats.average).label}`} icon={<Trophy size={18} />} />
            <Stat label="Best" value={stats.best} sub={`of ${MAX_TOTAL}`} accent="var(--good)" icon={<Trophy size={18} />} />
            <Stat label="Latest" value={stats.latest} accent="var(--rose)" sub={stats.trend !== 0 ? `${stats.trend > 0 ? '+' : ''}${stats.trend} vs prev` : 'steady'} />
            <Stat label="Rounds" value={stats.rounds} />
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
                <div className="flex h-[240px] items-center justify-center text-center text-sm text-muted">
                  Score another round to see the trend line.
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
          <div className="card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Scorecard history</h2>
            <div className="space-y-3">
              {stats.cards.slice().reverse().map((card) => {
                const round = data.rounds.find((r) => r.id === card.roundId)
                const tier = scoreTier(card.total)
                return (
                  <div key={card.id} className="rounded-xl border border-line bg-surface2 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-content">{round?.name ?? 'Round'}</p>
                        <p className="text-xs text-muted">{formatDate(card.date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-display text-2xl font-bold" style={{ color: tier.color }}>{card.total}</span>
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
                    {card.clipId && (() => {
                      const clip = data.clips.find((c) => c.id === card.clipId)
                      if (!clip) return null
                      return (
                        <button onClick={() => playClip(clip)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-gold transition hover:bg-surface2">
                          <Film size={13} /> {clip.title}
                        </button>
                      )
                    })()}
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface2 px-2.5 py-1 text-xs font-medium text-muted transition hover:border-gold/50 hover:text-content"
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
