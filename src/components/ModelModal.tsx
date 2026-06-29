import { useState } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import { Modal, Avatar } from './ui'
import { useStore } from '../lib/store'
import type { Model } from '../lib/types'
import { ACCENTS, classNames, randomAccent } from '../lib/util'

const EMOJI_CHOICES = ['👑', '💎', '🌹', '💗', '🌺', '🎷', '✨', '🔥', '🍫', '🌙', '💃', '🦋', '🌸', '⭐']

export function ModelModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Model | null
}) {
  const { saveModel, deleteModel, toast } = useStore()
  const [name, setName] = useState(editing?.name ?? '')
  const [aliases, setAliases] = useState(editing?.aliases ?? '')
  const [emoji, setEmoji] = useState(editing?.emoji ?? '✨')
  const [accent, setAccent] = useState(editing?.accent ?? randomAccent())
  const [tags, setTags] = useState((editing?.tags ?? []).join(', '))
  const [discoveredYear, setDiscoveredYear] = useState(editing?.discoveredYear?.toString() ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [favorite, setFavorite] = useState(editing?.favorite ?? false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSave() {
    if (!name.trim()) {
      toast({ title: 'Name required', icon: '⚠️' })
      return
    }
    saveModel({
      id: editing?.id,
      name: name.trim(),
      aliases: aliases.trim() || undefined,
      emoji,
      accent,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      discoveredYear: discoveredYear ? Number(discoveredYear) : undefined,
      notes: notes.trim() || undefined,
      favorite,
      archived: editing?.archived ?? false,
    })
    toast({ title: editing ? 'Model updated' : 'Model added', icon: '🌟', message: name.trim() })
    onClose()
  }

  function handleDelete() {
    if (!editing) return
    deleteModel(editing.id)
    toast({ title: 'Model removed', message: editing.name })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit model' : 'Add a model'}>
      <div className="flex items-center gap-4">
        <Avatar name={name || '?'} emoji={emoji} accent={accent} size={60} />
        <div className="flex-1">
          <label className="label">Name</label>
          <input
            className="input"
            placeholder="Performer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Also known as</label>
          <input className="input" placeholder="Alias (optional)" value={aliases} onChange={(e) => setAliases(e.target.value)} />
        </div>
        <div>
          <label className="label">Discovered (year)</label>
          <input
            className="input"
            type="number"
            placeholder="e.g. 2018"
            value={discoveredYear}
            onChange={(e) => setDiscoveredYear(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Avatar glyph</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={classNames(
                'flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition',
                emoji === e ? 'border-gold bg-surface2' : 'border-line hover:border-gold/50',
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Accent colour</label>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a}
              onClick={() => setAccent(a)}
              className={classNames('h-8 w-8 rounded-full border-2 transition', accent === a ? 'scale-110' : 'opacity-70 hover:opacity-100')}
              style={{ background: a, borderColor: accent === a ? 'var(--text)' : 'transparent' }}
              aria-label={`Accent ${a}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Tags (comma separated)</label>
        <input className="input" placeholder="Favourite, BBW, Original…" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>

      <div className="mt-4">
        <label className="label">Notes</label>
        <textarea
          className="input min-h-[70px] resize-y"
          placeholder="Why they stand out, what to look for…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button
        onClick={() => setFavorite((f) => !f)}
        className={classNames(
          'mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition',
          favorite ? 'border-rose/60 bg-rose/10 text-rose' : 'border-line text-muted hover:text-content',
        )}
      >
        <Heart size={16} className={favorite ? 'fill-current' : ''} />
        {favorite ? 'Marked as favourite' : 'Mark as favourite'}
      </button>

      <div className="mt-5 flex items-center justify-between gap-2">
        {editing ? (
          confirmDelete ? (
            <button className="btn-danger" onClick={handleDelete}>
              <Trash2 size={15} /> Confirm delete
            </button>
          ) : (
            <button className="btn-quiet text-bad" onClick={() => setConfirmDelete(true)}>
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
          <button className="btn-gold" onClick={handleSave}>
            {editing ? 'Save' : 'Add model'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
