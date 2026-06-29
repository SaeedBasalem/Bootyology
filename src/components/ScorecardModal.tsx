import { useMemo, useState } from 'react'
import { Save, Sparkles, Plus } from 'lucide-react'
import { Modal } from './ui'
import { useStore } from '../lib/store'
import { CRITERIA, bandFor, emptyScores } from '../lib/criteria'
import { computeTotal, pct, scoreTier, statsForModel, MAX_TOTAL } from '../lib/scoring'
import type { CriterionKey, Scorecard, Scores } from '../lib/types'
import { todayISO, classNames } from '../lib/util'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Scorecard | null
  presetModelId?: string
  presetRoundId?: string
  presetClipId?: string
}

export function ScorecardModal({ open, onClose, editing, presetModelId, presetRoundId, presetClipId }: Props) {
  const { data, saveScorecard, saveRound, toast } = useStore()

  const activeModels = data.models.filter((m) => !m.archived)

  const [modelId, setModelId] = useState(editing?.modelId ?? presetModelId ?? activeModels[0]?.id ?? '')
  const [roundChoice, setRoundChoice] = useState(
    editing?.roundId ?? presetRoundId ?? data.rounds[data.rounds.length - 1]?.id ?? '__new__',
  )
  const [newRoundName, setNewRoundName] = useState('')
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [scores, setScores] = useState<Scores>(editing?.scores ?? emptyScores())
  const [comments, setComments] = useState(editing?.comments ?? '')
  const [clipId, setClipId] = useState(editing?.clipId ?? presetClipId ?? '')

  const modelClips = data.clips.filter((c) => c.modelId === modelId)

  const total = computeTotal(scores)
  const tier = scoreTier(total)
  const percentage = pct(total)

  const prevBest = useMemo(() => {
    if (!modelId) return 0
    const s = statsForModel(data, modelId)
    // ignore the card being edited when computing prior best
    const others = s.cards.filter((c) => c.id !== editing?.id)
    return others.length ? Math.max(...others.map((c) => c.total)) : 0
  }, [data, modelId, editing])

  function setScore(key: CriterionKey, value: number) {
    setScores((s) => ({ ...s, [key]: value }))
  }

  function handleSave() {
    if (!modelId) {
      toast({ title: 'Pick a model first', icon: '⚠️', message: 'Add a model in the Roster tab if the list is empty.' })
      return
    }
    let roundId = roundChoice
    if (roundChoice === '__new__') {
      const name = newRoundName.trim() || 'Untitled Round'
      const round = saveRound({ name, date })
      roundId = round.id
    }
    const card = saveScorecard({
      id: editing?.id,
      modelId,
      roundId,
      date,
      scores,
      comments: comments.trim() || undefined,
      clipId: clipId || undefined,
    })
    const model = data.models.find((m) => m.id === modelId)
    const isRecord = total > prevBest && prevBest > 0
    if (percentage >= 90) {
      toast({
        tone: 'celebrate',
        icon: '👑',
        title: `${model?.name}: ${card.total}/${MAX_TOTAL} — Elite!`,
        message: 'A top-tier verdict. One for the Hall of Fame.',
      })
    } else if (isRecord) {
      toast({
        tone: 'celebrate',
        icon: '📈',
        title: `New personal best for ${model?.name}!`,
        message: `${card.total} beats the previous best of ${prevBest}.`,
      })
    } else {
      toast({ title: 'Scorecard saved', message: `${model?.name} — ${card.total}/${MAX_TOTAL}` })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} wide title={editing ? 'Edit scorecard' : 'New scorecard'}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Model</label>
          <select
            className="input"
            value={modelId}
            onChange={(e) => {
              setModelId(e.target.value)
              setClipId('')
            }}
          >
            {activeModels.length === 0 && <option value="">No models yet</option>}
            {activeModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Round / theme</label>
          <select className="input" value={roundChoice} onChange={(e) => setRoundChoice(e.target.value)}>
            {data.rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
            <option value="__new__">＋ New themed round…</option>
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {roundChoice === '__new__' && (
        <div className="mt-3 animate-fade-in">
          <label className="label">New round name</label>
          <input
            className="input"
            placeholder="e.g. Summer Beach, Golden Hour, Latex Night…"
            value={newRoundName}
            onChange={(e) => setNewRoundName(e.target.value)}
          />
        </div>
      )}

      {modelClips.length > 0 && (
        <div className="mt-3">
          <label className="label">Clip judged (optional)</label>
          <select className="input" value={clipId} onChange={(e) => setClipId(e.target.value)}>
            <option value="">— not linked to a clip —</option>
            {modelClips.map((c) => (
              <option key={c.id} value={c.id}>
                🎬 {c.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Live total banner */}
      <div className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-surface2 p-4">
        <div className="text-center">
          <div className="font-display text-4xl font-bold" style={{ color: tier.color }}>
            {total}
          </div>
          <div className="text-xs text-muted">/ {MAX_TOTAL}</div>
        </div>
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-semibold" style={{ color: tier.color }}>
              {tier.label} · {percentage}%
            </span>
            {scores.nudity < 0 && <span className="text-xs text-bad">Nudity deduction {scores.nudity}</span>}
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${percentage}%`, background: tier.color }}
            />
          </div>
        </div>
      </div>

      {/* Criteria sliders */}
      <div className="mt-5 space-y-5">
        {CRITERIA.map((c) => {
          const value = scores[c.key]
          const band = bandFor(c, value)
          return (
            <div key={c.key} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <span className="text-sm font-semibold text-content">
                    {c.num}. {c.label}
                  </span>
                  <span className="ml-2 text-xs text-muted">{c.focus}</span>
                </div>
                <span
                  className={classNames(
                    'shrink-0 rounded-lg px-2.5 py-1 font-display text-lg font-bold',
                    c.isDeduction ? 'text-bad' : 'text-gold',
                  )}
                  style={{ background: 'var(--surface-2)' }}
                >
                  {value > 0 && !c.isDeduction ? '+' : ''}
                  {value}
                  <span className="ml-1 text-xs font-normal text-muted">
                    /{c.isDeduction ? c.min : c.max}
                  </span>
                </span>
              </div>
              <input
                type="range"
                className="mt-3"
                min={c.min}
                max={c.max}
                step={1}
                value={value}
                onChange={(e) => setScore(c.key, Number(e.target.value))}
              />
              {band && (
                <p className="mt-2 text-xs text-muted">
                  <span className="font-semibold text-content">
                    {c.isDeduction ? '' : `${band.min}–${band.max}: `}
                  </span>
                  {band.label}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Comments */}
      <div className="mt-5">
        <label className="label">Judge's comments</label>
        <textarea
          className="input min-h-[88px] resize-y"
          placeholder="Overall impression, standout moments, what to watch next round…"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
          <Sparkles size={13} className="text-gold" /> Bands update live as you slide.
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <button className="btn-ghost flex-1 sm:flex-none" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-gold flex-1 sm:flex-none" onClick={handleSave}>
            {editing ? <Save size={16} /> : <Plus size={16} />}
            {editing ? 'Save changes' : 'Save scorecard'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
