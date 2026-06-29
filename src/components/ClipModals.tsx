import { useEffect, useRef, useState } from 'react'
import { Trash2, Upload, Link2, Film, Heart, ExternalLink, ClipboardPlus, Pencil, ShieldCheck } from 'lucide-react'
import { Modal, Avatar, Badge } from './ui'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import type { Clip, ClipSource } from '../lib/types'
import { putClipBlob, getClipObjectURL, formatBytes } from '../lib/clipStore'
import { scoreTier } from '../lib/scoring'
import { classNames, formatDate } from '../lib/util'

/* ----------------------------- Clip form ----------------------------- */

export function ClipFormModal({
  open,
  onClose,
  editing,
  presetModelId,
}: {
  open: boolean
  onClose: () => void
  editing?: Clip | null
  presetModelId?: string
}) {
  const { data, saveClip, deleteClip, toast } = useStore()
  const activeModels = data.models.filter((m) => !m.archived)

  const [title, setTitle] = useState(editing?.title ?? '')
  const [modelId, setModelId] = useState(editing?.modelId ?? presetModelId ?? activeModels[0]?.id ?? '')
  const [source, setSource] = useState<ClipSource>(editing?.source ?? 'file')
  const [url, setUrl] = useState(editing?.url ?? '')
  const [roundId, setRoundId] = useState(editing?.roundId ?? '')
  const [tags, setTags] = useState((editing?.tags ?? []).join(', '))
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [favorite, setFavorite] = useState(editing?.favorite ?? false)
  const [file, setFile] = useState<File | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    if (!title.trim()) return toast({ title: 'Give the clip a title', icon: '⚠️' })
    if (!modelId) return toast({ title: 'Pick a model', icon: '⚠️' })
    if (source === 'link' && !url.trim()) return toast({ title: 'Paste a link', icon: '⚠️' })
    if (source === 'file' && !file && !editing?.fileName)
      return toast({ title: 'Choose a video file', icon: '⚠️' })

    setBusy(true)
    try {
      const clip = saveClip({
        id: editing?.id,
        modelId,
        title: title.trim(),
        source,
        url: source === 'link' ? url.trim() : undefined,
        fileName: source === 'file' ? (file?.name ?? editing?.fileName) : undefined,
        mimeType: source === 'file' ? (file?.type ?? editing?.mimeType) : undefined,
        size: source === 'file' ? (file?.size ?? editing?.size) : undefined,
        roundId: roundId || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        notes: notes.trim() || undefined,
        favorite,
      })
      if (source === 'file' && file) {
        await putClipBlob(clip.id, file)
      }
      toast({ title: editing ? 'Clip updated' : 'Clip linked', icon: '🎬', message: title.trim() })
      onClose()
    } catch {
      toast({ title: 'Could not save the clip', icon: '⚠️', message: 'The file may be too large for this device.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit clip' : 'Link a clip'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Title</label>
          <input className="input" placeholder="e.g. Golden Hour — main set" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Model</label>
          <select className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>
            {activeModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Round (optional)</label>
          <select className="input" value={roundId} onChange={(e) => setRoundId(e.target.value)}>
            <option value="">— none —</option>
            {data.rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Source toggle */}
      <div className="mt-4">
        <label className="label">Source</label>
        <div className="inline-flex w-full rounded-xl border border-line bg-surface2 p-1">
          <button
            onClick={() => setSource('file')}
            className={classNames('flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition', source === 'file' ? 'bg-gold text-[#241606]' : 'text-muted')}
          >
            <Upload size={15} /> On-device file
          </button>
          <button
            onClick={() => setSource('link')}
            className={classNames('flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition', source === 'link' ? 'bg-gold text-[#241606]' : 'text-muted')}
          >
            <Link2 size={15} /> Link / URL
          </button>
        </div>
      </div>

      {source === 'file' ? (
        <div className="mt-3">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full justify-center py-6">
            <Upload size={18} />
            {file ? `${file.name} · ${formatBytes(file.size)}` : editing?.fileName ? `Replace: ${editing.fileName}` : 'Choose a video file'}
          </button>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck size={13} className="text-good" /> Stored privately on this device only — never uploaded.
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <label className="label">Clip URL</label>
          <input className="input" placeholder="https://…  (direct video link or page)" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Tags</label>
          <input className="input" placeholder="twerk, solo, theme…" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setFavorite((f) => !f)}
            className={classNames('flex h-[46px] w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition', favorite ? 'border-rose/60 bg-rose/10 text-rose' : 'border-line text-muted')}
          >
            <Heart size={15} className={favorite ? 'fill-current' : ''} /> {favorite ? 'Favourite' : 'Mark favourite'}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Notes</label>
        <textarea className="input min-h-[64px] resize-y" placeholder="What happens in this clip…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="mt-5 flex items-center justify-between">
        {editing ? (
          confirm ? (
            <button className="btn-danger" onClick={() => { deleteClip(editing.id); toast({ title: 'Clip deleted' }); onClose() }}>
              <Trash2 size={15} /> Confirm
            </button>
          ) : (
            <button className="btn-quiet text-bad" onClick={() => setConfirm(true)}>
              <Trash2 size={15} /> Delete
            </button>
          )
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-gold" disabled={busy} onClick={handleSave}>
            {busy ? 'Saving…' : editing ? 'Save' : 'Link clip'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ---------------------------- Clip player ---------------------------- */

export function ClipPlayerModal({
  open,
  onClose,
  clip,
  onEdit,
  onScore,
}: {
  open: boolean
  onClose: () => void
  clip: Clip | null
  onEdit: (clip: Clip) => void
  onScore: (clip: Clip) => void
}) {
  const { data } = useStore()
  const { go } = useNav()
  const [src, setSrc] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let revoke: string | null = null
    setMissing(false)
    setSrc(null)
    if (open && clip) {
      if (clip.source === 'link') {
        setSrc(clip.url ?? null)
      } else {
        getClipObjectURL(clip.id)
          .then((u) => {
            if (u) {
              revoke = u
              setSrc(u)
            } else setMissing(true)
          })
          .catch(() => setMissing(true))
      }
    }
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [open, clip])

  if (!clip) return null
  const model = data.models.find((m) => m.id === clip.modelId)
  const round = data.rounds.find((r) => r.id === clip.roundId)
  const verdicts = data.scorecards
    .filter((s) => s.clipId === clip.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const verdict = verdicts[0]

  return (
    <Modal open={open} onClose={onClose} wide title={clip.title}>
      <div className="overflow-hidden rounded-xl border border-line bg-black">
        {src && !missing ? (
          <video src={src} controls className="aspect-video w-full bg-black" />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-surface2 text-center">
            <Film size={32} className="text-muted" />
            <p className="text-sm text-muted">
              {missing ? 'The stored file could not be found on this device.' : clip.source === 'link' ? 'Preview unavailable — open the original below.' : 'Loading…'}
            </p>
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {model && (
          <button onClick={() => { onClose(); go('profile', model.id) }} className="flex items-center gap-2">
            <Avatar name={model.name} emoji={model.emoji} accent={model.accent} size={36} />
            <span className="font-semibold text-content">{model.name}</span>
          </button>
        )}
        {round && <Badge>{round.name}</Badge>}
        {clip.favorite && <Badge color="var(--rose)">♥ Favourite</Badge>}
        {clip.source === 'file' && clip.size && <Badge>{formatBytes(clip.size)}</Badge>}
        {clip.tags.map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>

      {clip.notes && <p className="mt-3 rounded-xl bg-surface2 p-3 text-sm italic text-muted">{clip.notes}</p>}

      {/* Linked verdict */}
      {verdict ? (
        <button
          onClick={() => { onClose(); if (model) go('profile', model.id) }}
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-left"
        >
          <span className="text-sm text-muted">Linked verdict · {formatDate(verdict.date)}</span>
          <span className="ml-auto font-display text-2xl font-bold" style={{ color: scoreTier(verdict.total).color }}>
            {verdict.total}
          </span>
        </button>
      ) : (
        <p className="mt-3 text-xs text-muted">No verdict linked to this clip yet — score it to connect them.</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button className="btn-gold flex-1" onClick={() => onScore(clip)}>
          <ClipboardPlus size={16} /> {verdict ? 'Score again' : 'Score this clip'}
        </button>
        {clip.source === 'link' && clip.url && (
          <a href={clip.url} target="_blank" rel="noreferrer" className="btn-ghost">
            <ExternalLink size={15} /> Open original
          </a>
        )}
        <button className="btn-ghost" onClick={() => onEdit(clip)}>
          <Pencil size={15} /> Edit
        </button>
      </div>
    </Modal>
  )
}
