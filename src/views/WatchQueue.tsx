import { useState, useRef, useCallback } from 'react'
import { Plus, Play, CheckCircle2, Link, Film, Eye, Search, Upload, X, Loader2, FileVideo, Clock, Zap, Star } from 'lucide-react'
import HoverVideoPlayer from 'react-hover-video-player'
import { useStore } from '../lib/store'
import { useActions } from '../components/ActionsProvider'
import { Avatar } from '../components/ui'
import { classNames, uid } from '../lib/util'
import { uploadClipFile } from '../lib/supabase'
import type { Clip, WatchStatus } from '../lib/types'

const STATUS_META: Record<WatchStatus, { label: string; icon: React.ReactNode; color: string; bg: string; borderColor: string }> = {
  unwatched: { label: 'Queued',   icon: <Clock size={11} />,        color: '#b39b8b',      bg: 'rgba(179,155,139,0.12)', borderColor: 'rgba(179,155,139,0.25)' },
  watching:  { label: 'Watching', icon: <Eye size={11} />,          color: '#7aa7d8',      bg: 'rgba(122,167,216,0.15)', borderColor: 'rgba(122,167,216,0.4)' },
  watched:   { label: 'Watched',  icon: <CheckCircle2 size={11} />, color: '#e3bc63',      bg: 'rgba(227,188,99,0.12)',  borderColor: 'rgba(227,188,99,0.35)' },
  scored:    { label: 'Scored',   icon: <Star size={11} />,         color: 'var(--good)',  bg: 'rgba(111,194,141,0.12)', borderColor: 'rgba(111,194,141,0.35)' },
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
  const meta = STATUS_META[status]

  return (
    <div
      className={classNames(
        'group relative overflow-hidden rounded-2xl border bg-surface shadow-card transition-all duration-200',
        status === 'scored' ? 'opacity-55' : '',
      )}
      style={{ borderColor: meta.borderColor }}
    >
      {/* Coloured top accent bar */}
      <div className="h-0.5 w-full" style={{ background: meta.color }} />

      {/* Thumbnail / hover-play area */}
      {(() => {
        const hasPlayableUrl =
          clip.url &&
          !clip.url.includes('youtube.com') &&
          !clip.url.includes('youtu.be')

        return (
          <div className="relative h-36 overflow-hidden" style={{ background: model?.photoUrl ? undefined : meta.bg }}>
            {hasPlayableUrl ? (
              /* Hover-play: shows model photo when idle, plays clip on hover */
              <HoverVideoPlayer
                videoSrc={clip.url!}
                pausedOverlay={
                  model?.photoUrl ? (
                    <>
                      <img
                        src={model.photoUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover blur-sm scale-105 opacity-35"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film size={36} className="opacity-20" style={{ color: meta.color }} />
                    </div>
                  )
                }
                loadingOverlay={<div className="absolute inset-0 bg-black/40" />}
                className="absolute inset-0 h-full w-full"
                videoClassName="absolute inset-0 h-full w-full object-cover"
                muted
                loop
                disableRemotePlayback
              />
            ) : (
              /* No playable URL: static background */
              <>
                {model?.photoUrl ? (
                  <>
                    <img
                      src={model.photoUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover blur-sm scale-105 opacity-35 transition duration-500 group-hover:opacity-50 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Film size={36} className="opacity-20" style={{ color: meta.color }} />
                  </div>
                )}
                {/* External link play button for YouTube / other links */}
                {clip.url && (
                  <a
                    href={clip.url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full text-white backdrop-blur-sm transition group-hover:scale-110"
                      style={{ background: `${meta.color}cc` }}
                    >
                      <Play size={22} className="ml-0.5 fill-current" />
                    </span>
                  </a>
                )}
              </>
            )}

            {/* Status badge */}
            <span
              className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm"
              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.borderColor}` }}
            >
              {meta.icon} {meta.label}
            </span>

            {/* File size */}
            {clip.source === 'file' && clip.size && (
              <span className="absolute right-8 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/50 backdrop-blur">
                {formatFileSize(clip.size)}
              </span>
            )}

            {/* Remove button */}
            <button
              onClick={() => onRemove(clip.id)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1 text-white/40 opacity-0 transition hover:text-bad group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        )
      })()}

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div>
          <p className="line-clamp-1 font-semibold text-content">{clip.title}</p>
          {clip.fileName && (
            <p className="mt-0.5 truncate text-[10px] text-muted/55">{clip.fileName}</p>
          )}
          {model ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={18} photoUrl={model.photoUrl} />
              <span className="text-xs font-medium text-muted">{model.name}</span>
            </div>
          ) : (
            <span className="mt-1 flex items-center gap-1 text-xs text-muted/55">
              <Link size={9} /> No model linked
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-1.5">
          {status === 'unwatched' && (
            <button className="btn-ghost w-full py-1.5 text-xs" onClick={() => onMarkWatched(clip)}>
              <CheckCircle2 size={13} /> Mark watched
            </button>
          )}
          {status === 'watching' && (
            <button className="w-full rounded-xl py-1.5 text-xs font-semibold text-white transition" style={{ background: 'rgba(122,167,216,0.25)', border: '1px solid rgba(122,167,216,0.4)' }} onClick={() => onMarkWatched(clip)}>
              <CheckCircle2 size={13} className="inline mr-1" /> Done watching
            </button>
          )}
          {status === 'watched' && (
            <button className="btn-cm w-full py-1.5 text-xs" onClick={() => onScore(clip)}>
              <Zap size={13} /> Score now
            </button>
          )}
          {!model && status !== 'scored' && (
            <button className="btn-ghost w-full py-1.5 text-xs" onClick={() => onLinkModel(clip)}>
              <Link size={13} /> Link model
            </button>
          )}
          {status === 'scored' && (
            <div className="flex items-center justify-center gap-1 py-1 text-xs" style={{ color: 'var(--good)' }}>
              <Star size={11} className="fill-current" /> Scored
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
        const blobUrl = URL.createObjectURL(file)
        saveClip({ id: clipId, modelId: modelId || '__unlinked__', title: title.trim(), source: 'file', url: blobUrl, fileName: file.name, mimeType: file.type, size: file.size, tags: [], favorite: false, watchStatus: 'unwatched', queuePriority: Date.now() })
        toast({ title: 'Saved locally only', icon: '⚠️', message: 'Blob URL may expire on refresh.' })
        reset(); onClose(); return
      }
      saveClip({ id: clipId, modelId: modelId || '__unlinked__', title: title.trim(), source: 'file', url: uploaded, fileName: file.name, mimeType: file.type, size: file.size, tags: [], favorite: false, watchStatus: 'unwatched', queuePriority: Date.now() })
    } else {
      saveClip({ id: clipId, modelId: modelId || '__unlinked__', title: title.trim(), source: tab === 'link' ? 'link' : 'file', url: tab === 'link' ? url.trim() : undefined, tags: [], favorite: false, watchStatus: 'unwatched', queuePriority: Date.now() })
    }

    toast({ title: 'Added to queue', icon: '✅', message: title.trim() })
    reset(); onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center bg-black/70 backdrop-blur-sm" onClick={handleClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-line bg-surface2 px-6 py-4">
          <h2 className="font-display text-xl font-bold">Add to Watch Queue</h2>
          <p className="mt-0.5 text-xs text-muted">Upload a file, paste a link, or just note the title.</p>
        </div>
        <div className="p-6 space-y-4">
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1.5">
            {([['upload', <Upload size={12} />, 'Upload'], ['link', <Link size={12} />, 'URL / Link'], ['text', <Film size={12} />, 'Note only']] as const).map(([t, icon, label]) => (
              <button key={t} onClick={() => setTab(t as AddTab)}
                className={classNames('btn flex-1 py-2 text-xs gap-1', tab === t ? 'btn-cm' : 'btn-ghost')}>
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Upload drop zone */}
          {tab === 'upload' && (
            <div>
              <input ref={fileInputRef} type="file" accept="video/*,.mp4,.mkv,.mov,.avi,.webm" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f) }} />
              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-cm-red/40 bg-cm-red/8 p-4">
                  <FileVideo size={28} className="shrink-0 text-cm-red" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-content">{file.name}</p>
                    <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
                  </div>
                  <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="shrink-0 rounded-full p-1 text-muted transition hover:text-bad">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                  className={classNames(
                    'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition',
                    dragOver ? 'border-cm-red bg-cm-red/12 scale-[1.01]' : 'border-line hover:border-cm-red/40 hover:bg-surface2',
                  )}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(204,17,17,0.1)' }}>
                    <Upload size={24} className="text-cm-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-content">Drop a video here</p>
                    <p className="mt-0.5 text-xs text-muted">or click to browse</p>
                    <p className="mt-1 text-[10px] text-muted/55">MP4, MKV, MOV, AVI, WebM</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label">Title</label>
            <input className="input" placeholder={tab === 'upload' ? 'Auto-filled from filename…' : 'Describe the clip…'} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus={tab !== 'upload'} />
          </div>

          {tab === 'link' && (
            <div>
              <label className="label">URL</label>
              <input className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          )}

          <div>
            <label className="label">Link to model <span className="text-muted/60">(optional)</span></label>
            <select className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>
              <option value="__unlinked__">— link later —</option>
              {data.models.filter((m) => !m.archived).map((m) => (
                <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={handleClose} disabled={uploading}>Cancel</button>
            <button className="btn-cm flex-1" onClick={handleSave} disabled={uploading}>
              {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Plus size={15} /> Add to queue</>}
            </button>
          </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-line bg-surface2 px-6 py-4">
          <h2 className="font-display text-lg font-bold">Link model</h2>
          <p className="mt-0.5 truncate text-xs text-muted">"{clip.title}"</p>
        </div>
        <div className="p-6 space-y-4">
          <select className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>
            <option value="">Pick a model…</option>
            {data.models.filter((m) => !m.archived).map((m) => (
              <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-cm flex-1" disabled={!modelId} onClick={handleLink}><Link size={13} /> Link</button>
          </div>
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
    <div className="space-y-5">
      {/* Page header with cinema-screen backdrop */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
        <div className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(122,167,216,0.35), transparent 65%)' }} />
        <div className="pointer-events-none absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 0% 100%, rgba(111,194,141,0.2), transparent 60%)' }} />
        <div className="relative px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Screening room</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Watch Queue</h1>
              <p className="mt-1 text-sm text-white/45">Upload clips, watch them, then score when you're ready.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* Status summary chips */}
              <div className="flex gap-1.5">
                {counts.unwatched > 0 && (
                  <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'rgba(179,155,139,0.18)', color: '#b39b8b' }}>
                    {counts.unwatched} queued
                  </span>
                )}
                {counts.watching > 0 && (
                  <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'rgba(122,167,216,0.18)', color: '#7aa7d8' }}>
                    {counts.watching} watching
                  </span>
                )}
                {counts.watched > 0 && (
                  <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'rgba(227,188,99,0.18)', color: '#e3bc63' }}>
                    {counts.watched} to score
                  </span>
                )}
              </div>
              <button className="btn-cm" onClick={() => setAddOpen(true)}>
                <Plus size={16} /> Add to queue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'unwatched', 'watching', 'watched', 'scored'] as const).map((s) => {
          const meta = s === 'all' ? null : STATUS_META[s]
          const active = filterStatus === s
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="chip cursor-pointer transition"
              style={active ? { borderColor: meta?.color ?? 'var(--gold)', color: meta?.color ?? 'var(--gold)', background: meta?.bg ?? 'rgba(227,188,99,0.1)' } : undefined}
            >
              {meta?.icon}
              {s === 'all' ? 'All' : meta!.label}
              <span className="ml-0.5 opacity-60">{counts[s]}</span>
            </button>
          )
        })}
        <div className="relative ml-auto min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input py-1 pl-8 text-xs" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {queueClips.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-line py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(122,167,216,0.1)', border: '1px solid rgba(122,167,216,0.2)' }}>
            <Play size={28} style={{ color: '#7aa7d8' }} />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-content">
              {counts.all === 0 ? 'Queue is empty' : 'No matches'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {counts.all === 0
                ? 'Upload a clip or add a link. Watch it, then score when you\'re ready.'
                : 'Try a different filter or clear the search.'}
            </p>
          </div>
          {counts.all === 0 && (
            <button className="btn-cm" onClick={() => setAddOpen(true)}>
              <Upload size={15} /> Upload first clip
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {queueClips.map((clip) => (
            <QueueCard key={clip.id} clip={clip} onMarkWatched={markWatched} onScore={scoreClip} onLinkModel={(c) => setLinkClip(c)} onRemove={deleteClip} />
          ))}
        </div>
      )}

      <AddToQueueModal open={addOpen} onClose={() => setAddOpen(false)} />
      <LinkModelModal clip={linkClip} open={!!linkClip} onClose={() => setLinkClip(null)} />
    </div>
  )
}
