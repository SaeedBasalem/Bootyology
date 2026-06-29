import { Play, Link2, Upload, Heart, Pencil } from 'lucide-react'
import { Avatar, Badge } from './ui'
import { useStore } from '../lib/store'
import { useActions } from './ActionsProvider'
import type { Clip } from '../lib/types'
import { scoreTier } from '../lib/scoring'
import { formatBytes } from '../lib/clipStore'

export function ClipCard({ clip, showModel = true }: { clip: Clip; showModel?: boolean }) {
  const { data } = useStore()
  const { playClip, editClip } = useActions()
  const model = data.models.find((m) => m.id === clip.modelId)
  const verdict = data.scorecards
    .filter((s) => s.clipId === clip.id)
    .sort((a, b) => b.total - a.total)[0]

  return (
    <div className="card group overflow-hidden transition hover:border-gold/40">
      <button onClick={() => playClip(clip)} className="relative block w-full">
        <div
          className="flex aspect-video w-full items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${model?.accent ?? 'var(--gold)'}26, var(--surface-2))` }}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition group-hover:scale-110">
            <Play size={24} className="ml-0.5 fill-current" />
          </span>
        </div>
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge>{clip.source === 'file' ? <Upload size={11} /> : <Link2 size={11} />} {clip.source === 'file' ? 'Local' : 'Link'}</Badge>
          {clip.favorite && <Badge color="var(--rose)"><Heart size={10} className="fill-current" /></Badge>}
        </div>
        {verdict && (
          <div className="absolute bottom-2 right-2">
            <span
              className="rounded-lg bg-black/45 px-2 py-1 font-display text-sm font-bold backdrop-blur"
              style={{ color: scoreTier(verdict.total).color }}
            >
              {verdict.total}
            </span>
          </div>
        )}
      </button>
      <div className="flex items-start gap-2 p-3">
        {showModel && model && <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={34} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-content">{clip.title}</p>
          <p className="truncate text-xs text-muted">
            {showModel && model ? model.name : clip.source === 'file' ? formatBytes(clip.size) : 'External link'}
          </p>
        </div>
        <button onClick={() => editClip(clip)} className="btn-quiet h-7 w-7 shrink-0 p-0" aria-label="Edit clip">
          <Pencil size={13} />
        </button>
      </div>
    </div>
  )
}
