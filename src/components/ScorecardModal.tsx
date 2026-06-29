import { useMemo, useState } from 'react'
import { Save, Sparkles, Plus, Heart, Smile, Zap, Star, Film, AlertCircle } from 'lucide-react'
import { Modal } from './ui'
import { useStore } from '../lib/store'
import { useActions } from './ActionsProvider'
import { CRITERIA, bandFor, emptyScores } from '../lib/criteria'
import { computeTotal, pct, scoreTier, statsForModel, MAX_TOTAL } from '../lib/scoring'
import type { CriterionKey, JudgeReaction, Scorecard, Scores, SessionType } from '../lib/types'
import { todayISO, classNames } from '../lib/util'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Scorecard | null
  presetModelId?: string
  presetClipId?: string
}

const SESSION_TYPES: { value: SessionType; label: string; icon: string; desc: string }[] = [
  { value: 'casual', label: 'Casual', icon: '😊', desc: 'Relaxed watch' },
  { value: 'gooning', label: 'Gooning', icon: '🌀', desc: 'Deep in the zone' },
  { value: 'unexpected_orgasm', label: 'Unexpected', icon: '✨', desc: 'Surprised' },
]

const STATUS_BADGE: Record<string, string> = {
  unwatched: '⬜',
  watching: '▶️',
  watched: '✅',
  scored: '⭐',
}

export function ScorecardModal({ open, onClose, editing, presetModelId, presetClipId }: Props) {
  const { data, saveScorecard, saveClip, toast } = useStore()
  const actions = useActions()

  const activeModels = data.models.filter((m) => !m.archived)

  const [modelId, setModelId] = useState(
    editing?.modelId ?? presetModelId ?? activeModels[0]?.id ?? '',
  )
  const [clipId, setClipId] = useState(
    editing?.clipId ?? presetClipId ?? '',
  )
  const [quickTitle, setQuickTitle] = useState('')
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [scores, setScores] = useState<Scores>(editing?.scores ?? emptyScores())
  const [comments, setComments] = useState(editing?.comments ?? '')

  const [reaction, setReaction] = useState<JudgeReaction>(
    editing?.reaction ?? { positivity: 7, comfortability: 7, happiness: 7, sessionType: 'casual' },
  )
  const [showReaction, setShowReaction] = useState(!!(editing?.reaction))

  const modelClips = useMemo(
    () => data.clips.filter((c) => c.modelId === modelId),
    [data.clips, modelId],
  )

  const isQuickAdd = clipId === '__new__'
  const selectedClip = data.clips.find((c) => c.id === clipId)
  const total = computeTotal(scores)
  const tier = scoreTier(total)
  const percentage = pct(total)

  const prevBest = useMemo(() => {
    if (!modelId) return 0
    const s = statsForModel(data, modelId)
    const others = s.cards.filter((c) => c.id !== editing?.id)
    return others.length ? Math.max(...others.map((c) => c.total)) : 0
  }, [data, modelId, editing])

  function changeModel(id: string) {
    setModelId(id)
    setClipId('') // reset clip selection when model changes
    setQuickTitle('')
  }

  function setScore(key: CriterionKey, value: number) {
    setScores((s) => ({ ...s, [key]: value }))
  }

  function handleSave() {
    if (!modelId) {
      toast({ title: 'Pick a model first', icon: '⚠️' })
      return
    }

    let finalClipId = clipId

    if (isQuickAdd) {
      const title = quickTitle.trim()
      if (!title) {
        toast({ title: 'Enter a clip title', icon: '⚠️' })
        return
      }
      const clip = saveClip({
        modelId,
        title,
        source: 'link',
        tags: [],
        favorite: false,
        watchStatus: 'scored',
      })
      finalClipId = clip.id
    } else if (!finalClipId) {
      toast({ title: 'Select a clip to judge', icon: '🎬', message: 'Each scorecard must be linked to a clip.' })
      return
    }

    // Mark the clip as scored if it's not already
    const clip = data.clips.find((c) => c.id === finalClipId)
    if (clip && clip.watchStatus !== 'scored') {
      saveClip({ ...clip, watchStatus: 'scored' })
    }

    const card = saveScorecard({
      id: editing?.id,
      modelId,
      clipId: finalClipId,
      date,
      scores,
      comments: comments.trim() || undefined,
      reaction: showReaction ? reaction : undefined,
    })

    const model = data.models.find((m) => m.id === modelId)
    const isRecord = total > prevBest && prevBest > 0
    if (percentage >= 90) {
      toast({ tone: 'celebrate', icon: '👑', title: `${model?.name}: ${card.total}/${MAX_TOTAL} — Elite!`, message: 'A top-tier verdict. One for the Hall of Fame.' })
    } else if (isRecord) {
      toast({ tone: 'celebrate', icon: '📈', title: `New personal best for ${model?.name}!`, message: `${card.total} beats the previous best of ${prevBest}.` })
    } else {
      toast({ title: 'Scorecard saved', message: `${model?.name} — ${card.total}/${MAX_TOTAL}` })
    }
    onClose()
  }

  const model = activeModels.find((m) => m.id === modelId)

  return (
    <Modal open={open} onClose={onClose} wide title={editing ? 'Edit scorecard' : 'New scorecard'}>

      {/* ── Model + Date row ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Model</label>
          <select className="input" value={modelId} onChange={(e) => changeModel(e.target.value)}>
            {activeModels.length === 0 && <option value="">No models yet</option>}
            {activeModels.map((m) => (
              <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {/* ── Clip picker ──────────────────────────────────────────────────────── */}
      <div className="mt-4">
        <label className="label flex items-center gap-1.5">
          <Film size={13} className="text-gold" /> Clip being judged
          <span className="ml-0.5 text-[10px] font-normal text-bad">required</span>
        </label>

        {modelClips.length === 0 && !editing?.clipId ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-surface2 p-4">
            <AlertCircle size={18} className="shrink-0 text-muted" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content">
                {model ? `${model.emoji} ${model.name}` : 'This model'} has no clips yet
              </p>
              <p className="text-xs text-muted">Add a clip first, then score it.</p>
            </div>
            <button
              className="btn-ghost ml-auto shrink-0 text-xs"
              onClick={() => {
                onClose()
                actions.newClip({ modelId })
              }}
            >
              <Plus size={13} /> Add clip
            </button>
          </div>
        ) : (
          <>
            <select
              className="input"
              value={clipId}
              onChange={(e) => { setClipId(e.target.value); setQuickTitle('') }}
            >
              <option value="">— select a clip —</option>
              {modelClips.map((c) => (
                <option key={c.id} value={c.id}>
                  {STATUS_BADGE[c.watchStatus ?? 'unwatched']} {c.title}
                </option>
              ))}
              <option value="__new__">＋ Quick-add new clip…</option>
            </select>

            {isQuickAdd && (
              <input
                className="input mt-2 animate-fade-in"
                placeholder="Clip title (e.g. IG Reel Jul 2025, TikTok Dance, OnlyFans Drop…)"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                autoFocus
              />
            )}

            {selectedClip && (
              <p className="mt-1.5 text-xs text-muted">
                {selectedClip.source === 'file' ? '📁 File' : '🔗 Link'}
                {selectedClip.tags.length > 0 && ` · ${selectedClip.tags.join(', ')}`}
                {selectedClip.notes && ` · ${selectedClip.notes}`}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Live total banner ─────────────────────────────────────────────────── */}
      <div className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-surface2 p-4">
        <div className="text-center">
          <div className="font-display text-4xl font-bold" style={{ color: tier.color }}>{total}</div>
          <div className="text-xs text-muted">/ {MAX_TOTAL}</div>
        </div>
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-semibold" style={{ color: tier.color }}>{tier.label} · {percentage}%</span>
            {scores.nudity < 0 && <span className="text-xs text-bad">Nudity deduction {scores.nudity}</span>}
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%`, background: tier.color }} />
          </div>
          {prevBest > 0 && (
            <p className="mt-1 text-xs text-muted">
              Personal best: <span className="text-content font-semibold">{prevBest}</span>
              {total > prevBest && <span className="ml-1 text-good"> ▲ new record!</span>}
            </p>
          )}
        </div>
      </div>

      {/* ── Criteria sliders ─────────────────────────────────────────────────── */}
      <div className="mt-5 space-y-5">
        {CRITERIA.map((c) => {
          const value = scores[c.key]
          const band = bandFor(c, value)
          return (
            <div key={c.key} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <span className="text-sm font-semibold text-content">{c.num}. {c.label}</span>
                  <span className="ml-2 text-xs text-muted">{c.focus}</span>
                </div>
                <span
                  className={classNames(
                    'shrink-0 rounded-lg px-2.5 py-1 font-display text-lg font-bold',
                    c.isDeduction ? 'text-bad' : 'text-gold',
                  )}
                  style={{ background: 'var(--surface-2)' }}
                >
                  {value > 0 && !c.isDeduction ? '+' : ''}{value}
                  <span className="ml-1 text-xs font-normal text-muted">/{c.isDeduction ? c.min : c.max}</span>
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

      {/* ── Comments ─────────────────────────────────────────────────────────── */}
      <div className="mt-5">
        <label className="label">Judge's comments</label>
        <textarea
          className="input min-h-[88px] resize-y"
          placeholder="Overall impression, standout moments…"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>

      {/* ── Judge Reaction ───────────────────────────────────────────────────── */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
        <button
          className="flex w-full items-center justify-between p-4 text-left transition hover:bg-surface2"
          onClick={() => setShowReaction((v) => !v)}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-content">
            <Heart size={15} className="text-rose" /> Judge Reaction
          </span>
          <span className="text-xs text-muted">{showReaction ? 'Hide ↑' : 'Add how it felt ↓'}</span>
        </button>

        {showReaction && (
          <div className="animate-fade-in space-y-4 border-t border-line p-4">
            <p className="text-xs text-muted">Private metrics — kept locally, never shared.</p>

            <div>
              <label className="label">Session type</label>
              <div className="grid grid-cols-3 gap-2">
                {SESSION_TYPES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setReaction((r) => ({ ...r, sessionType: s.value }))}
                    className={classNames(
                      'flex flex-col items-center gap-1 rounded-xl border p-3 text-center text-xs font-semibold transition',
                      reaction.sessionType === s.value
                        ? 'border-cm-red bg-cm-red/10 text-white'
                        : 'border-line bg-surface2 text-muted hover:border-cm-red/30',
                    )}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <span>{s.label}</span>
                    <span className="text-[10px] font-normal opacity-60">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {[
              { key: 'positivity' as const, label: 'Positivity', icon: <Smile size={13} />, color: 'var(--good)' },
              { key: 'comfortability' as const, label: 'Comfortability', icon: <Star size={13} />, color: '#7aa7d8' },
              { key: 'happiness' as const, label: 'Happiness', icon: <Zap size={13} />, color: 'var(--gold)' },
            ].map(({ key, label, icon, color }) => (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">{icon} {label}</span>
                  <span className="font-display text-lg font-bold" style={{ color }}>{reaction[key]}/10</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={reaction[key]}
                  onChange={(e) => setReaction((r) => ({ ...r, [key]: Number(e.target.value) }))}
                />
              </div>
            ))}

            <div>
              <label className="label">Reaction notes (optional)</label>
              <input
                className="input"
                placeholder="Anything that stood out about this session…"
                value={reaction.notes ?? ''}
                onChange={(e) => setReaction((r) => ({ ...r, notes: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
          <Sparkles size={13} className="text-gold" /> Bands update live as you slide.
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <button className="btn-ghost flex-1 sm:flex-none" onClick={onClose}>Cancel</button>
          <button className="btn-cm flex-1 sm:flex-none" onClick={handleSave}>
            {editing ? <Save size={16} /> : <Plus size={16} />}
            {editing ? 'Save changes' : 'Save scorecard'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
