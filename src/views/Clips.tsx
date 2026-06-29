import { useState } from 'react'
import { Plus, Film, Search, ShieldCheck } from 'lucide-react'
import { useStore } from '../lib/store'
import { useActions } from '../components/ActionsProvider'
import { SectionHeader, EmptyState } from '../components/ui'
import { ClipCard } from '../components/ClipCard'

export function Clips() {
  const { data } = useStore()
  const { newClip } = useActions()
  const [query, setQuery] = useState('')
  const [modelFilter, setModelFilter] = useState('all')

  let clips = data.clips.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (modelFilter !== 'all') clips = clips.filter((c) => c.modelId === modelFilter)
  if (query.trim()) {
    const q = query.toLowerCase()
    clips = clips.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        data.models.find((m) => m.id === c.modelId)?.name.toLowerCase().includes(q),
    )
  }

  const modelsWithClips = data.models.filter((m) => data.clips.some((c) => c.modelId === m.id))

  return (
    <div>
      <SectionHeader
        title="Clip library"
        subtitle="Connect each model to her clips — then score them in one tap."
        action={
          <button className="btn-gold" onClick={() => newClip()}>
            <Plus size={16} /> Link a clip
          </button>
        }
      />

      {data.clips.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Search clips…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="input max-w-[200px]" value={modelFilter} onChange={(e) => setModelFilter(e.target.value)}>
            <option value="all">All models</option>
            {modelsWithClips.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {data.clips.length === 0 ? (
        <EmptyState
          icon={<Film size={28} />}
          title="No clips linked yet"
          message="Attach a clip you have for a model — a private on-device file (it never leaves your machine) or a link. Each clip can then be scored and tied to a verdict."
          action={
            <button className="btn-gold" onClick={() => newClip()}>
              <Plus size={16} /> Link your first clip
            </button>
          }
        />
      ) : clips.length === 0 ? (
        <EmptyState icon={<Search size={28} />} title="No matches" message="Try a different search or filter." />
      ) : (
        <>
          <p className="mb-4 flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck size={13} className="text-good" /> On-device files are stored privately in your browser and never uploaded.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {clips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
