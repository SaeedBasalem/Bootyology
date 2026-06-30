import { Play, Link2, Upload, Heart, Pencil, ClipboardPlus, Star, RotateCcw, Clock } from 'lucide-react'
import { Avatar, Badge } from './ui'
import { useStore } from '../lib/store'
import { useActions } from './ActionsProvider'
import type { Clip } from '../lib/types'
import { scoreTier, daysSinceLastScore } from '../lib/scoring'
import { formatBytes } from '../lib/clipStore'
import { classNames } from '../lib/util'

export function ClipCard({ clip, showModel = true }: { clip: Clip; showModel?: boolean }) {
  const { data } = useStore()
  const { playClip, editClip, newScorecard } = useActions()
  const model = data.models.find((m) => m.id === clip.modelId)

  const verdicts = data.scorecards
    .filter((s) => s.clipId === clip.id)
    .sort((a, b) => b.total - a.total)
  const best = verdicts[0]
  const isScored = verdicts.length > 0
  const tier = best ? scoreTier(best.total) : null
  const daysSince = model ? daysSinceLastScore(data, model.id) : null

  return (
    <div
      className={classNames(
        'group relative overflow-hidden rounded-2xl border bg-surface shadow-card transition-all duration-200',
        isScored
          ? 'border-line hover:border-gold/40'
          : 'border-cm-red/30 hover:border-cm-red/70 hover:shadow-[0_6px_24px_rgba(204,17,17,0.18)]',
      )}
    >
      {/* Thumbnail / play area */}
      <button onClick={() => playClip(clip)} className="relative block w-full">
        <div
          className="relative flex aspect-video w-full items-center justify-center overflow-hidden"
          style={{
            background: model?.photoUrl
              ? undefined
              : `linear-gradient(135deg, ${model?.accent ?? 'var(--gold)'}28, var(--surface-2))`,
          }}
        >
          {/* Model photo blurred as background */}
          {model?.photoUrl && (
            <>
              <img
                src={model.photoUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40 blur-sm scale-105 transition duration-500 group-hover:opacity-55 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
            </>
          )}

          {/* Play button */}
          <span
            className={classNames(
              'relative flex h-14 w-14 items-center justify-center rounded-full text-white backdrop-blur-sm transition-all duration-200',
              'group-hover:scale-115',
              isScored
                ? 'bg-black/50 group-hover:bg-gold/80'
                : 'bg-cm-red/75 group-hover:bg-cm-red shadow-[0_0_16px_rgba(204,17,17,0.5)]',
            )}
          >
            <Play size={22} className="ml-0.5 fill-current" />
          </span>
        </div>

        {/* Top-left badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {!isScored && (
            <span className="flex items-center gap-0.5 rounded-full bg-cm-red px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow">
              Needs score
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full border border-white/20 bg-black/55 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur">
            {clip.source === 'file' ? <Upload size={9} /> : <Link2 size={9} />}
            {clip.source === 'file' ? 'Local' : 'Link'}
          </span>
          {clip.favorite && <Badge color="var(--rose)"><Heart size={9} className="fill-current" /></Badge>}
        </div>

        {/* Score badge bottom-right */}
        {best && tier && (
          <div className="absolute bottom-2 right-2">
            <span
              className="urban-num rounded-lg bg-black/60 px-2.5 py-0.5 text-xl backdrop-blur"
              style={{ color: tier.color }}
            >
              {best.total}
            </span>
          </div>
        )}
      </button>

      {/* Card body */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          {showModel && model && (
            <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={34} photoUrl={model.photoUrl} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-content">{clip.title}</p>
            <p className="truncate text-xs text-muted">
              {showModel && model
                ? model.name
                : clip.source === 'file'
                  ? formatBytes(clip.size)
                  : 'External link'}
            </p>
          </div>
          <button onClick={() => editClip(clip)} className="btn-quiet h-7 w-7 shrink-0 p-0" aria-label="Edit clip">
            <Pencil size={13} />
          </button>
        </div>

        {/* CTA row */}
        {!isScored ? (
          <button
            onClick={() => newScorecard({ modelId: model?.id, clipId: clip.id })}
            className="btn-cm mt-2.5 w-full py-1.5 text-xs"
          >
            <ClipboardPlus size={13} /> Score this clip
          </button>
        ) : (
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Star size={10} className="text-gold shrink-0" />
              {verdicts.length} {verdicts.length === 1 ? 'verdict' : 'verdicts'}
              {tier && <span style={{ color: tier.color }}> · {tier.label}</span>}
            </div>
            {daysSince !== null && daysSince > 3 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted">
                <Clock size={9} /> {daysSince}d ago
              </span>
            )}
            <button
              onClick={() => newScorecard({ modelId: model?.id, clipId: clip.id })}
              className="btn-quiet h-6 shrink-0 px-2 text-[10px]"
            >
              <RotateCcw size={9} /> Re-score
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
