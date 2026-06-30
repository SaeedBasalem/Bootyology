import { useState } from 'react'
import { Plus, Pencil, Trash2, Layers, ClipboardPlus, ChevronDown } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { useActions } from '../components/ActionsProvider'
import { SectionHeader, EmptyState, Modal, Avatar } from '../components/ui'
import { scoreTier } from '../lib/scoring'
import type { Round } from '../lib/types'
import { formatDate, todayISO, classNames } from '../lib/util'

export function Rounds() {
  const { data, saveRound, deleteRound, toast } = useStore()
  const { go } = useNav()
  const { newScorecard } = useActions()
  const [editing, setEditing] = useState<Round | null>(null)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(data.rounds[data.rounds.length - 1]?.id ?? null)

  const rounds = data.rounds.slice().sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <SectionHeader
        title="Rounds"
        subtitle="Themed sessions — each model scored under the same conditions."
        action={
          <button
            className="btn-gold"
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus size={16} /> New round
          </button>
        }
      />

      {rounds.length === 0 ? (
        <EmptyState
          icon={<Layers size={28} />}
          title="No rounds yet"
          message="Create a themed round — like 'Summer Beach' or 'Golden Hour' — then score your models within it."
          action={
            <button
              className="btn-gold"
              onClick={() => {
                setEditing(null)
                setOpen(true)
              }}
            >
              <Plus size={16} /> Create a round
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => {
            const cards = data.scorecards
              .filter((s) => s.roundId === round.id)
              .slice()
              .sort((a, b) => b.total - a.total)
            const isOpen = expanded === round.id
            return (
              <div key={round.id} className="card overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <button
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => setExpanded(isOpen ? null : round.id)}
                  >
                    {/* Stacked model faces — replace generic icon when scorecards exist */}
                    {cards.length > 0 ? (
                      <div className="flex shrink-0 -space-x-2.5">
                        {cards.slice(0, 4).map((card, ci) => {
                          const m = data.models.find((x) => x.id === card.modelId)
                          if (!m) return null
                          return (
                            <div
                              key={card.id}
                              className="rounded-full ring-2 ring-surface"
                              style={{ zIndex: 4 - ci }}
                            >
                              <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={36} photoUrl={m.photoUrl} />
                            </div>
                          )
                        })}
                        {cards.length > 4 && (
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 ring-2 ring-surface text-[10px] font-bold text-muted"
                            style={{ zIndex: 0 }}
                          >
                            +{cards.length - 4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface2 text-gold">
                        <Layers size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold text-content">{round.name}</p>
                      <p className="text-xs text-muted">
                        {formatDate(round.date)} · {cards.length} scorecard{cards.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </button>
                  <button className="btn-ghost hidden sm:inline-flex" onClick={() => newScorecard()}>
                    <ClipboardPlus size={15} /> Score
                  </button>
                  <button onClick={() => { setEditing(round); setOpen(true) }} className="btn-quiet h-9 w-9 p-0" aria-label="Edit">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setExpanded(isOpen ? null : round.id)} className="btn-quiet h-9 w-9 p-0" aria-label="Toggle">
                    <ChevronDown size={16} className={classNames('transition', isOpen && 'rotate-180')} />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-line bg-surface2/50 p-4 animate-fade-in">
                    {round.notes && <p className="mb-3 text-sm italic text-muted">{round.notes}</p>}
                    {cards.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-4 text-center">
                        <p className="text-sm text-muted">No scorecards in this round yet.</p>
                        <button className="btn-ghost" onClick={() => newScorecard()}>
                          <ClipboardPlus size={15} /> Add the first one
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cards.map((card, i) => {
                          const m = data.models.find((x) => x.id === card.modelId)
                          if (!m) return null
                          return (
                            <button
                              key={card.id}
                              onClick={() => go('profile', m.id)}
                              className="flex w-full items-center gap-3 rounded-lg bg-surface p-2.5 text-left transition hover:bg-surface2"
                            >
                              <span className="w-5 text-center font-display font-bold text-muted">{i + 1}</span>
                              <Avatar name={m.name} emoji={m.emoji} accent={m.accent} size={34} photoUrl={m.photoUrl} />
                              <span className="flex-1 truncate text-sm font-medium text-content">{m.name}</span>
                              <span className="font-display text-lg font-bold" style={{ color: scoreTier(card.total).color }}>
                                {card.total}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <RoundModal
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={(name, date, notes) => {
          if (editing) saveRound({ id: editing.id, name, date, notes })
          else {
            const r = saveRound({ name, date, notes })
            setExpanded(r.id)
          }
          toast({ title: editing ? 'Round updated' : 'Round created', icon: '🎬', message: name })
          setOpen(false)
        }}
        onDelete={
          editing
            ? () => {
                deleteRound(editing.id)
                toast({ title: 'Round deleted' })
                setOpen(false)
              }
            : undefined
        }
      />
    </div>
  )
}

function RoundModal({
  open,
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  editing: Round | null
  onClose: () => void
  onSave: (name: string, date: string, notes?: string) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(editing?.name ?? '')
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [confirm, setConfirm] = useState(false)

  // reset fields whenever the modal target changes
  const key = `${open}-${editing?.id ?? 'new'}`
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setName(editing?.name ?? '')
    setDate(editing?.date ?? todayISO())
    setNotes(editing?.notes ?? '')
    setConfirm(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit round' : 'New round'}>
      <label className="label">Theme name</label>
      <input className="input" placeholder="e.g. Summer Beach, Latex Night…" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="mt-4">
        <label className="label">Date</label>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="mt-4">
        <label className="label">Notes (optional)</label>
        <textarea className="input min-h-[70px] resize-y" placeholder="Theme details, styling brief…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="mt-5 flex items-center justify-between">
        {onDelete ? (
          confirm ? (
            <button className="btn-danger" onClick={onDelete}>
              <Trash2 size={15} /> Confirm
            </button>
          ) : (
            <button className="btn-quiet text-bad" onClick={() => setConfirm(true)}>
              <Trash2 size={15} /> Delete round
            </button>
          )
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-gold" onClick={() => name.trim() && onSave(name.trim(), date, notes.trim() || undefined)}>
            {editing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
