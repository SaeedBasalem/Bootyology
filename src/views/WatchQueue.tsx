import { useState, useRef, useCallback } from 'react'
import { Plus, Play, CheckCircle2, Link, Film, Eye, Search, Upload, X, Loader2, FileVideo } from 'lucide-react'
import { useStore } from '../lib/store'
import { useActions } from '../components/ActionsProvider'
import { SectionHeader, EmptyState, Avatar } from '../components/ui'
import { classNames, uid } from '../lib/util'
import { uploadClipFile } from '../lib/supabase'
import type { Clip, WatchStatus } from '../lib/types'

const STATUS_LABELS: Record<WatchStatus, { label: string; icon: React.ReactNode; color: string }> = {
  unwatched: { label: 'Queued', icon: <Play size={12} />, color: 'var(--text-muted)' },
  watching: { label: 'Watching', icon: <Eye size={12} />, color: 'var(--good)' },
  watched: { label: 'Watched', icon: <CheckCircle2 size={12} />, color: '#7aa7d8' },
  scored: { label: 'Scored', icon: <Film size={12} />, color: 'var(--gold)' },
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function QueueCard({ clip, onMarkWatched, onScore, onLinkModel, onRemove }: {
  clip: Clip
  onMarkWatched: (clip: Clip) => void
  onScore: (clip: Clip) => void
  onLinkModel: (clip: Clip) => void
  onRemove: (id: string) => void
}) {
  const { data } = useStore()
  const model = clip.modelId && clip.modelId !== '__unlinked__' ? data.models.find((m) => m.id === clip.modelId) : null
  const status: WatchStatus = clip.watchStatus ?? 'unwatched'
  const meta = STATUS_LABELS[status]

  return (
    <div className={classNames(
      'card group flex flex-col gap-0 overflow-hidden transition',
      status === 'scored' ? 'opacity-60' : '',
    )}>
      {/* Thumbnail / placeholder */}
      <div className="relative h-32 bg-surface2 flex items-center justify-center">
        {clip.url ? (
          clip.source === 'file' ? (
            <video
              src={clip.url}
              className="h-full w-full object-cover"
              preload="metadata"
            />
          ) : (
            <Film size={36} className="text-muted/30" />
          )
        ) : (
          <FileVideo size={36} className="text-muted/30" />
        )}
        {clip.url && (
          <a href={clip.url} target="_blank" rel="noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition">
            <Play size={28} className="text-white" />
          </a>
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-line/50 bg-black/70 px-2 py-0.5 text-[10px] font-medium" style={{ color: meta.color }}>
          {meta.icon}{meta.label}
        </span>
        {clip.source === 'file' && (
          <span className="absolute right-8 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-muted">
            {clip.size ? formatFileSize(clip.size) : 'File'}
          </span>
        )}
        <button onClick={() => onRemove(clip.id)} className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-muted opacity-0 transition hover:text-bad group-hover:opacity-100">
          <X size={12} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div>
          <p className="font-semibold text-content line-clamp-1">{clip.title}</p>
          {clip.fileName && (
            <p className="text-[10px] text-muted/60 truncate mt-0.5">{clip.fileName}</p>
          )}
          {model ? (
            <div className="mt-1 flex items-center gap-1.5">
              <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={18} photoUrl={model.photoUrl} />
              <span className="text-xs text-muted">{model.name}</span>
            </div>
          ) : (
            <span className="mt-1 flex items-center gap-1 text-xs text-muted/60">
              <Link size={10} /> No model linked
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-1.5">
          {status === 'unwatched' && (
            <button className="btn-ghost w-full text-xs py-1.5" onClick={() => onMarkWatched(clip)}>
              <CheckCircle2 size={13} /> Mark watched
            </button>
          )}
          {status === 'watched' && (
            <button className="btn-cm w-full text-xs py-1.5" onClick={() => onScore(clip)}>
              <Film size={13} /> Score now
            </button>
          )}
          {!model && status !== 'scored' && (
            <button className="btn-ghost w-full text-xs py-1.5" onClick={() => onLinkModel(clip)}>
              <Link size={13} /> Link model
            </button>
          )}
          {status === 'scored' && (
            <div className="flex items-center justify-center gap-1 text-xs text-muted py-1">
              <Film size={11} className="text-gold" /> Already scored
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type AddTab = 'upload' | 'link' | 'text'

function AddToQueueModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, saveClip, toast } = useStore()
  const [tab, setTab] = useState<AddTab>('upload')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [modelId, setModelId] = useState('__unlinked__')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setTitle(''); setUrl(''); setModelId('__unlinked__'); setFile(null); setUploading(false); setDragOver(false)
  }

  function handleClose() { reset(); onClose() }

  function pickFile(f: File) {
    setFile(f)
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('video/')) pickFile(dropped)
  }, [title])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = () => setDragOver(false)

  async function handleSave() {
    if (!title.trim()) { toast({ title: 'Add a title', icon: '⚠️' }); return }
    if (tab === 'link' && !url.trim()) { toast({ title: 'Add a URL', icon: '⚠️' }); return }
    if (tab === 'upload' && !file) { toast({ title: 'Select a video file', icon: '⚠️' }); return }

    const clipId = uid('clip')

    if (tab === 'upload' && file) {
      setUploading(true)
      const uploaded = await uploadClipFile(clipId, file)
      setUploading(false)
      if (!uploaded) {
        toast({ title: 'Upload failed', icon: '❌', message: 'Check your connection or Supabase config.' })
        // Save anyway with local blob URL as fallback
        const blobUrl = URL.createObjectURL(file)
        saveClip({
          id: clipId,
          modelId: modelId || '__unlinked__',
          title: title.trim(),
          source: 'file',
          url: blobUrl,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          tags: [],
          favorite: false,
          watchStatus: 'unwatched',
          queuePriority: Date.now(),
        })
        toast({ title: 'Saved locally only', icon: '⚠️', message: 'Blob URL may expire on refresh.' })
        reset(); onClose(); return
      }
      saveClip({
        id: clipId,
        modelId: modelId || '__unlinked__',
        title: title.trim(),
        source: 'file',
        url: uploaded,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        tags: [],
        favorite: false,
        watchStatus: 'unwatched',
        queuePriority: Date.now(),
      })
    } else {
      saveClip({
        id: clipId,
        modelId: modelId || '__unlinked__',
        title: title.trim(),
        source: tab === 'link' ? 'link' : 'file',
        url: tab === 'link' ? url.trim() : undefined,
        tags: [],
        favorite: false,
        watchStatus: 'unwatched',
        queuePriority: Date.now(),
      })
    }

    toast({ title: 'Added to queue', icon: '✅', message: title.trim() })
    reset(); onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-xl font-bold">Add to Watch Queue</h2>

        {/* Tabs */}
        <div className="mb-4 grid grid-cols-3 gap-1.5">
          {([['upload', <Upload size={12} />, 'Upload file'], ['link', <Link size={12} />, 'URL / Link'], ['text', <Film size={12} />, 'Note only']] as const).map(([t, icon, label]) => (
            <button key={t} onClick={() => setTab(t as AddTab)}
              className={classNames('btn flex-1 py-2 text-xs gap-1', tab === t ? 'btn-cm' : 'btn-ghost')}>
              {icon}{label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {/* Upload tab */}
          {tab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mp4,.mkv,.mov,.avi,.webm"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
              />
              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-cm-red/40 bg-cm-red/5 p-4">
                  <FileVideo size={28} className="shrink-0 text-cm-red" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-content">{file.name}</p>
                    <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
                  </div>
                  <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="shrink-0 rounded-full p-1 text-muted hover:text-bad transition">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                  className={classNames(
                    'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition',
                    dragOver ? 'border-cm-red bg-cm-red/10' : 'border-line hover:border-cm-red/50 hover:bg-surface2',
                  )}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface2">
                    <Upload size={24} className="text-cm-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-content">Drop a video here</p>
                    <p className="mt-0.5 text-xs text-muted">or click to browse your files</p>
                    <p className="mt-1 text-[10px] text-muted/60">MP4, MKV, MOV, AVI, WebM</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title field */}
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder={tab === 'upload' ? 'Auto-filled from filename…' : 'Describe the clip…'} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus={tab !== 'upload'} />
          </div>

          {/* URL field */}
          {tab === 'link' && (
            <div>
              <label className="label">URL</label>
              <input className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          )}

          {/* Model link */}
          <div>
            <label className="label">Link to model <span className="text-muted">(optional)</span></label>
            <select className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>
              <option value="__unlinked__">— link later —</option>
              {data.models.filter((m) => !m.archived).map((m) => (
                <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button className="btn-ghost flex-1" onClick={handleClose} disabled={uploading}>Cancel</button>
          <button className="btn-cm flex-1" onClick={handleSave} disabled={uploading}>
            {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Plus size={15} /> Add to queue</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function LinkModelModal({ clip, open, onClose }: { clip: Clip | null; open: boolean; onClose: () => void }) {
  const { data, saveClip } = useStore()
  const [modelId, setModelId] = useState('')

  if (!open || !clip) return null

  function handleLink() {
    if (!clip || !modelId) return
    saveClip({ ...clip, modelId })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1 font-display text-lg font-bold">Link model</h2>
        <p className="mb-4 text-xs text-muted truncate">"{clip.title}"</p>
        <select className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>
          <option value="">Pick a model…</option>
          {data.models.filter((m) => !m.archived).map((m) => (
            <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
          ))}
        </select>
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-cm flex-1" disabled={!modelId} onClick={handleLink}><Link size={13} /> Link</button>
        </div>
      </div>
    </div>
  )
}

export function WatchQueue() {
  const { data, saveClip, deleteClip } = useStore()
  const { newScorecard } = useActions()
  const [addOpen, setAddOpen] = useState(false)
  const [linkClip, setLinkClip] = useState<Clip | null>(null)
  const [filterStatus, setFilterStatus] = useState<WatchStatus | 'all'>('all')
  const [query, setQuery] = useState('')

  let queueClips = data.clips
    .filter((c) => c.watchStatus !== undefined || c.modelId === '__unlinked__')
    .slice()
    .sort((a, b) => (a.queuePriority ?? 0) - (b.queuePriority ?? 0) || b.createdAt.localeCompare(a.createdAt))

  if (filterStatus !== 'all') queueClips = queueClips.filter((c) => (c.watchStatus ?? 'unwatched') === filterStatus)
  if (query.trim()) {
    const q = query.toLowerCase()
    queueClips = queueClips.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      (c.fileName ?? '').toLowerCase().includes(q) ||
      data.models.find((m) => m.id === c.modelId)?.name.toLowerCase().includes(q),
    )
  }

  const all = data.clips.filter((c) => c.watchStatus !== undefined || c.modelId === '__unlinked__')
  const counts = {
    all: all.length,
    unwatched: all.filter((c) => (c.watchStatus ?? 'unwatched') === 'unwatched').length,
    watching: all.filter((c) => c.watchStatus === 'watching').length,
    watched: all.filter((c) => c.watchStatus === 'watched').length,
    scored: all.filter((c) => c.watchStatus === 'scored').length,
  }

  function markWatched(clip: Clip) {
    saveClip({ ...clip, watchStatus: 'watched', watchedAt: new Date().toISOString().slice(0, 10) })
  }

  function scoreClip(clip: Clip) {
    const modelId = clip.modelId !== '__unlinked__' ? clip.modelId : undefined
    newScorecard({ modelId, clipId: clip.id })
    saveClip({ ...clip, watchStatus: 'scored' })
  }

  return (
    <div>
      <SectionHeader
        title="Watch Queue"
        subtitle="Upload clips first, watch them, then score after — link the model anytime."
        action={
          <button className="btn-cm" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Add to queue
          </button>
        }
      />

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'unwatched', 'watching', 'watched', 'scored'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={classNames(
              'chip cursor-pointer transition',
              filterStatus === s ? 'border-cm-red text-white bg-cm-red/20' : 'hover:border-cm-red/30',
            )}>
            {s === 'all' ? 'All' : STATUS_LABELS[s].label}
            <span className="ml-0.5 text-muted">{counts[s]}</span>
          </button>
        ))}

        <div className="relative ml-auto min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input py-1 pl-8 text-xs" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {queueClips.length === 0 ? (
        <EmptyState
          icon={<Play size={28} />}
          title={counts.all === 0 ? 'Queue is empty' : 'No matches'}
          message={counts.all === 0
            ? 'Upload a clip or add a link. Watch it, then score when you\'re ready.'
            : 'Try a different filter or search.'}
          action={counts.all === 0
            ? <button className="btn-cm" onClick={() => setAddOpen(true)}><Upload size={15} /> Upload first clip</button>
            : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {queueClips.map((clip) => (
            <QueueCard
              key={clip.id}
              clip={clip}
              onMarkWatched={markWatched}
              onScore={scoreClip}
              onLinkModel={(c) => setLinkClip(c)}
              onRemove={deleteClip}
            />
          ))}
        </div>
      )}

      <AddToQueueModal open={addOpen} onClose={() => setAddOpen(false)} />
      <LinkModelModal clip={linkClip} open={!!linkClip} onClose={() => setLinkClip(null)} />
    </div>
  )
}
