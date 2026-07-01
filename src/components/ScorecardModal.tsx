import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Save, Sparkles, Plus, Heart, Smile, Zap, Star, Film,
  AlertCircle, Layers, Play, ExternalLink, ChevronRight, CheckCircle2, Loader2, Volume2, Maximize2,
} from 'lucide-react'
import { Modal } from './ui'
import { useStore } from '../lib/store'
import { useActions } from './ActionsProvider'
import { CRITERIA, bandFor, emptyScores } from '../lib/criteria'
import { computeTotal, pct, scoreTier, statsForModel, MAX_TOTAL } from '../lib/scoring'
import type { CriterionKey, JudgeReaction, Scorecard, Scores, SessionType } from '../lib/types'
import { todayISO, classNames } from '../lib/util'
import { getClipObjectURL } from '../lib/clipStore'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Scorecard | null
  presetModelId?: string
  presetClipId?: string
  presetRoundId?: string
}

type Step = 'setup' | 'watch' | 'score'

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

function classifyUrl(url?: string): 'direct-video' | 'youtube' | 'external' | 'none' {
  if (!url) return 'none'
  const u = url.toLowerCase()
  if (u.startsWith('blob:')) return 'direct-video'
  if (/\.(mp4|webm|mov|m4v|avi|mkv)(\?|#|$)/.test(u)) return 'direct-video'
  if (u.includes('youtube.com/') || u.includes('youtu.be/')) return 'youtube'
  return 'external'
}

function toYouTubeEmbed(url: string): string {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` : url
}

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function ScorecardModal({ open, onClose, editing, presetModelId, presetClipId, presetRoundId }: Props) {
  const { data, saveScorecard, saveClip, toast } = useStore()
  const actions = useActions()

  const activeModels = data.models.filter((m) => !m.archived)

  // ── shared state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(editing ? 'score' : 'setup')
  const [modelId, setModelId] = useState(
    editing?.modelId ?? presetModelId ?? activeModels[0]?.id ?? '',
  )
  const [clipId, setClipId] = useState(editing?.clipId ?? presetClipId ?? '')
  const [quickTitle, setQuickTitle] = useState('')
  const [quickUrl, setQuickUrl] = useState('')
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [scores, setScores] = useState<Scores>(editing?.scores ?? emptyScores())
  const [comments, setComments] = useState(editing?.comments ?? '')
  const linkedRoundId = editing?.roundId ?? presetRoundId ?? undefined
  const [reaction, setReaction] = useState<JudgeReaction>(
    editing?.reaction ?? { positivity: 7, comfortability: 7, happiness: 7, sessionType: 'casual' },
  )
  const [showReaction, setShowReaction] = useState(!!(editing?.reaction))

  // ── watch step state ──────────────────────────────────────────────────────
  const [videoEnded, setVideoEnded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const watchOverlayRef = useRef<HTMLDivElement>(null)
  const lastValidTimeRef = useRef(0)   // furthest point reached during natural playback
  const isFullscreenRef = useRef(false) // sync mirror of isFullscreen for video callbacks
  const hasEnteredFsRef = useRef(false) // did we ever successfully enter fullscreen this session?
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [blobLoading, setBlobLoading] = useState(false)
  const [blobMissing, setBlobMissing] = useState(false)
  const [volume, setVolume] = useState(1)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── derived ───────────────────────────────────────────────────────────────
  const modelClips = useMemo(
    () => data.clips.filter((c) => c.modelId === modelId),
    [data.clips, modelId],
  )
  const isQuickAdd = clipId === '__new__'
  const selectedClip = data.clips.find((c) => c.id === clipId)

  // Resolve the playable URL: blob for file clips, stored url for link clips, typed for quick-add
  const effectiveClipUrl: string | undefined = isQuickAdd
    ? (quickUrl.trim() || undefined)
    : selectedClip?.source === 'file'
      ? (blobUrl ?? undefined)
      : selectedClip?.url
  const urlType = classifyUrl(effectiveClipUrl)
  const clipLabel = isQuickAdd ? quickTitle : (selectedClip?.title ?? '')

  // Load blob URL when entering the watch step for file-based clips
  useEffect(() => {
    let revoked = false
    let objectUrl: string | null = null
    setBlobUrl(null)
    setBlobMissing(false)
    setBlobLoading(false)
    lastValidTimeRef.current = 0   // reset seek-guard whenever clip changes

    if (step === 'watch' && selectedClip?.source === 'file') {
      setBlobLoading(true)
      getClipObjectURL(selectedClip.id)
        .then((u) => {
          if (revoked) return
          if (u) {
            objectUrl = u
            setBlobUrl(u)
          } else {
            setBlobMissing(true)
          }
        })
        .catch(() => { if (!revoked) setBlobMissing(true) })
        .finally(() => { if (!revoked) setBlobLoading(false) })
    }

    return () => {
      revoked = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [step, selectedClip?.id, selectedClip?.source])

  // Auto-hide controls in fullscreen: hide after 3 s of no mouse movement,
  // show immediately on any mouse move (handler attached to the overlay div).
  function showControlsTemporarily() {
    setControlsVisible(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000)
  }
  useEffect(() => {
    if (isFullscreen && !videoEnded) {
      showControlsTemporarily()
    } else {
      setControlsVisible(true)
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    }
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen, videoEnded])

  // Block ESC from closing the Modal (capture phase fires before Modal's listener).
  // Note: ESC WILL still exit browser fullscreen — that's enforced by the browser and
  // cannot be prevented. The fullscreenchange handler immediately re-requests entry.
  useEffect(() => {
    if (step !== 'watch' || urlType !== 'direct-video' || blobLoading || blobMissing || videoEnded) return
    const stopEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', stopEsc, true)
    return () => document.removeEventListener('keydown', stopEsc, true)
  }, [step, urlType, blobLoading, blobMissing, videoEnded])

  // Track fullscreen state. When the user exits (ESC or X), attempt immediate
  // re-entry — we're still inside the browser's user-gesture window (ESC is a
  // user action, so fullscreenchange fires with transient activation still live).
  // If re-entry is blocked, the lockout screen shows and video pauses.
  useEffect(() => {
    const onFsChange = () => {
      const inFs = !!document.fullscreenElement
      isFullscreenRef.current = inFs
      setIsFullscreen(inFs)
      if (inFs) {
        hasEnteredFsRef.current = true
        videoRef.current?.play().catch(() => {}) // resume after returning from lockout
      } else if (step === 'watch' && !videoEnded) {
        // Synchronous re-request while still in user-gesture window (ESC = user gesture)
        document.documentElement.requestFullscreen?.().catch(() => {
          // Browser blocked re-entry — lockout shows, video pauses via onPause guard
        })
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, videoEnded])

  // Exit fullscreen when the watch step ends or the modal closes
  useEffect(() => {
    if (step !== 'watch' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [step])

  useEffect(() => {
    if (!open && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [open])

  const total = computeTotal(scores)
  const tier = scoreTier(total)
  const percentage = pct(total)
  const model = activeModels.find((m) => m.id === modelId)

  const prevBest = useMemo(() => {
    if (!modelId) return 0
    const s = statsForModel(data, modelId)
    const others = s.cards.filter((c) => c.id !== editing?.id)
    return others.length ? Math.max(...others.map((c) => c.total)) : 0
  }, [data, modelId, editing])

  // ── handlers ──────────────────────────────────────────────────────────────
  function changeModel(id: string) {
    setModelId(id)
    setClipId('')
    setQuickTitle('')
    setQuickUrl('')
  }

  function setScore(key: CriterionKey, value: number) {
    setScores((s) => ({ ...s, [key]: value }))
  }

  function handleStartSession() {
    if (!modelId) {
      toast({ title: 'Pick a model first', icon: '⚠️' })
      return
    }
    if (isQuickAdd && !quickTitle.trim()) {
      toast({ title: 'Enter a clip title', icon: '⚠️' })
      return
    }
    if (!isQuickAdd && !clipId) {
      toast({ title: 'Select a clip to judge', icon: '🎬' })
      return
    }
    setVideoEnded(false)
    hasEnteredFsRef.current = false
    isFullscreenRef.current = false
    setIsFullscreen(false)
    setStep('watch')
    // Call requestFullscreen here, inside the button-click handler, so we are
    // guaranteed to be in the browser's user-gesture window.
    // document.documentElement is already in the DOM; the overlay portal renders
    // shortly after and its fixed inset-0 z-[9999] style covers the fullscreen page.
    document.documentElement.requestFullscreen?.().catch(() => {})
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
        url: quickUrl.trim() || undefined,
        tags: [],
        favorite: false,
        watchStatus: 'scored',
      })
      finalClipId = clip.id
    } else if (!finalClipId) {
      toast({ title: 'Select a clip to judge', icon: '🎬', message: 'Each scorecard must be linked to a clip.' })
      return
    }

    const clip = data.clips.find((c) => c.id === finalClipId)
    if (clip && clip.watchStatus !== 'scored') {
      saveClip({ ...clip, watchStatus: 'scored' })
    }

    const card = saveScorecard({
      id: editing?.id,
      modelId,
      clipId: finalClipId,
      roundId: linkedRoundId,
      date,
      scores,
      comments: comments.trim() || undefined,
      reaction: showReaction ? reaction : undefined,
    })

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

  // ── step titles ───────────────────────────────────────────────────────────
  const modalTitle =
    step === 'setup' ? 'New scorecard'
    : step === 'watch' ? `Now playing`
    : editing ? 'Edit scorecard' : 'Judge the clip'

  return (
    <Modal open={open} onClose={onClose} wide title={modalTitle}>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 1 — SETUP
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'setup' && (
        <>
          {/* Step indicator */}
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cm-red text-[10px] text-white">1</span>
            <span className="text-content">Setup</span>
            <ChevronRight size={12} className="opacity-40" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface2 text-[10px]">2</span>
            <span>Watch</span>
            <ChevronRight size={12} className="opacity-40" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface2 text-[10px]">3</span>
            <span>Judge</span>
          </div>

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

          {linkedRoundId && (() => {
            const round = data.rounds.find((r) => r.id === linkedRoundId)
            return round ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-gold/25 bg-gold/8 px-3 py-2 text-xs font-semibold text-gold">
                <Layers size={13} /> Round: {round.name}
              </div>
            ) : null
          })()}

          {/* Clip picker */}
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
                  <p className="text-xs text-muted">Add a clip first, then score it — or quick-add below.</p>
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
              <select
                className="input"
                value={clipId}
                onChange={(e) => { setClipId(e.target.value); setQuickTitle(''); setQuickUrl('') }}
              >
                <option value="">— select a clip —</option>
                {modelClips.map((c) => (
                  <option key={c.id} value={c.id}>
                    {STATUS_BADGE[c.watchStatus ?? 'unwatched']} {c.title}
                  </option>
                ))}
                <option value="__new__">＋ Quick-add new clip…</option>
              </select>
            )}

            {isQuickAdd && (
              <div className="mt-2 space-y-2 animate-fade-in">
                <input
                  className="input"
                  placeholder="Clip title (e.g. IG Reel Jul 2025, TikTok Dance…)"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  autoFocus
                />
                <input
                  className="input"
                  placeholder="URL — direct video, YouTube, Google Drive… (optional)"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                />
              </div>
            )}

            {selectedClip && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                <span>{selectedClip.source === 'file' ? '📁 File' : '🔗 Link'}</span>
                {selectedClip.url && (
                  <a href={selectedClip.url} target="_blank" rel="noopener noreferrer" className="hover:text-content underline truncate max-w-[220px]">
                    {selectedClip.url}
                  </a>
                )}
                {selectedClip.tags.length > 0 && <span>· {selectedClip.tags.join(', ')}</span>}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn-cm flex items-center gap-2"
              onClick={handleStartSession}
            >
              <Play size={15} /> Start session
              <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 2 — WATCH
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'watch' && (
        <>
          {/* Step indicator */}
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface2 text-[10px]">1</span>
            <span>Setup</span>
            <ChevronRight size={12} className="opacity-40" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cm-red text-[10px] text-white">2</span>
            <span className="text-content">Watch</span>
            <ChevronRight size={12} className="opacity-40" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface2 text-[10px]">3</span>
            <span>Judge</span>
          </div>

          {/* Now playing header */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-line bg-surface2 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cm-red/15 text-lg">
              {model?.emoji ?? '🎬'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-content">{model?.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Film size={10} /> {clipLabel || 'Clip'}
              </p>
            </div>
            {videoEnded && (
              <div className="ml-auto flex items-center gap-1 text-xs font-semibold text-good">
                <CheckCircle2 size={14} /> Watched
              </div>
            )}
          </div>

          {/* Player area — only for non-direct-video types (direct-video uses the fullscreen overlay below) */}
          {(blobLoading || blobMissing || urlType !== 'direct-video') && (
            <div className={classNames(
              'relative w-full overflow-hidden rounded-2xl bg-black',
              urlType === 'none' || urlType === 'external' || blobLoading || blobMissing ? 'aspect-[16/7]' : 'aspect-video',
            )}>
              {blobLoading && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
                  <Loader2 size={32} className="animate-spin" />
                  <p className="text-sm">Loading clip…</p>
                </div>
              )}

              {blobMissing && (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface2/80">
                    <Film size={32} className="text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-content">File not found on this device</p>
                    <p className="mt-1 text-xs text-muted">The stored video could not be loaded. Watch it elsewhere and come back.</p>
                  </div>
                </div>
              )}

              {!blobLoading && urlType === 'youtube' && effectiveClipUrl && (
                <iframe
                  src={toYouTubeEmbed(effectiveClipUrl)}
                  className="h-full w-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              )}

              {!blobLoading && !blobMissing && (urlType === 'external' || urlType === 'none') && (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface2/80">
                    <Film size={32} className="text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-content">
                      {effectiveClipUrl ? 'External clip' : 'No URL linked'}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {effectiveClipUrl
                        ? 'Open it in your browser, watch it fully, then come back to judge.'
                        : 'No URL was provided for this clip. Watch it elsewhere and come back.'}
                    </p>
                  </div>
                  {effectiveClipUrl && (
                    <a href={effectiveClipUrl} target="_blank" rel="noopener noreferrer" className="btn-gold flex items-center gap-2">
                      <ExternalLink size={14} /> Open clip
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status + navigation */}
          <div className="mt-5 space-y-3">
            {videoEnded && (
              <div className="flex items-center gap-2 rounded-lg border border-good/25 bg-good/8 px-3 py-2.5 text-xs font-semibold text-good animate-fade-in">
                <CheckCircle2 size={13} className="shrink-0" />
                Clip finished — scoring is ready.
              </div>
            )}

            {urlType === 'direct-video' && !blobLoading && !blobMissing && !videoEnded && (
              <div className="flex items-center gap-2 rounded-lg border border-cm-red/30 bg-cm-red/8 px-3 py-2.5 text-xs font-medium text-cm-red">
                <Play size={12} className="shrink-0" />
                Clip is playing — watching is mandatory before scoring.
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button className="btn-ghost" onClick={() => setStep('setup')}>
                ← Back
              </button>
              {!blobLoading && (urlType !== 'direct-video' || videoEnded || blobMissing) && (
                <button className="btn-cm flex items-center gap-2" onClick={() => setStep('score')}>
                  <CheckCircle2 size={14} />
                  {urlType === 'direct-video' && videoEnded ? 'Start judging' : 'Done watching'}
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 3 — SCORE
      ══════════════════════════════════════════════════════════════════════ */}
      {step === 'score' && (
        <>
          {/* Step indicator — only for new scorecards */}
          {!editing && (
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-muted">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface2 text-[10px]">1</span>
              <span>Setup</span>
              <ChevronRight size={12} className="opacity-40" />
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface2 text-[10px]">2</span>
              <span>Watch</span>
              <ChevronRight size={12} className="opacity-40" />
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cm-red text-[10px] text-white">3</span>
              <span className="text-content">Judge</span>
            </div>
          )}

          {/* Clip context badge */}
          {(clipLabel || selectedClip || linkedRoundId) && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
              {model && (
                <span className="flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 font-semibold text-content">
                  {model.emoji} {model.name}
                </span>
              )}
              {clipLabel && (
                <span className="flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1">
                  <Film size={10} /> {clipLabel}
                </span>
              )}
              {linkedRoundId && (() => {
                const round = data.rounds.find((r) => r.id === linkedRoundId)
                return round ? (
                  <span className="flex items-center gap-1 rounded-full border border-gold/25 bg-gold/8 px-2.5 py-1 font-semibold text-gold">
                    <Layers size={10} /> {round.name}
                  </span>
                ) : null
              })()}
            </div>
          )}

          {/* Live total banner */}
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface2 p-4">
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

          {/* Criteria sliders */}
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

          {/* Comments */}
          <div className="mt-5">
            <label className="label">Judge's comments</label>
            <textarea
              className="input min-h-[88px] resize-y"
              placeholder="Overall impression, standout moments…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          {/* Judge Reaction */}
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
            <div className="flex items-center gap-3">
              {!editing && (
                <button className="btn-ghost" onClick={() => setStep('watch')}>
                  ← Watch again
                </button>
              )}
              <p className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
                <Sparkles size={13} className="text-gold" /> Bands update live as you slide.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn-cm" onClick={handleSave}>
                {editing ? <Save size={16} /> : <Plus size={16} />}
                {editing ? 'Save changes' : 'Save scorecard'}
              </button>
            </div>
          </div>
        </>
      )}
      {/* ── MANDATORY FULLSCREEN WATCH OVERLAY (direct-video only) ────────────
          Portalled to document.body so position:fixed is relative to the real
          viewport, not the Modal dialog's transform/animation context.
          requestFullscreen() targets this element directly — only the overlay
          fills the screen, not the whole page.
      ─────────────────────────────────────────────────────────────────────── */}
      {step === 'watch' && urlType === 'direct-video' && !blobLoading && !blobMissing && effectiveClipUrl && createPortal(
        <div
          ref={watchOverlayRef}
          className="fixed inset-0 z-[9999] flex flex-col bg-black select-none"
          onMouseMove={showControlsTemporarily}
        >
          {/* Cursor hidden while controls are hidden; shown when mouse moves */}
          <div className="relative flex-1 overflow-hidden" style={{ cursor: controlsVisible ? 'default' : 'none' }}>
            <video
              ref={videoRef}
              src={effectiveClipUrl}
              autoPlay
              className="absolute inset-0 h-full w-full object-contain"
              onTimeUpdate={() => {
                const v = videoRef.current
                if (!v || v.seeking) return
                lastValidTimeRef.current = Math.max(lastValidTimeRef.current, v.currentTime)
                if (v.duration) setVideoProgress(v.currentTime / v.duration)
              }}
              onSeeking={() => {
                const v = videoRef.current
                if (!v) return
                if (v.currentTime > lastValidTimeRef.current + 0.5) {
                  v.currentTime = lastValidTimeRef.current
                }
              }}
              onPause={() => {
                // Auto-resume only while in fullscreen; stay paused during lockout
                if (isFullscreenRef.current) videoRef.current?.play().catch(() => {})
              }}
              onLoadedMetadata={() => {
                const v = videoRef.current
                if (!v) return
                v.volume = volume
                setVideoDuration(v.duration)
              }}
              onEnded={() => {
                setVideoEnded(true)
                setTimeout(() => setStep('score'), 900)
              }}
            />

            {/* Subtle model watermark — bottom-left of video, no interaction */}
            {!videoEnded && (
              <div className="pointer-events-none absolute bottom-16 left-5 z-10">
                <p className="text-xs font-semibold text-white/30">{model?.emoji} {model?.name}</p>
              </div>
            )}

            {/* Ended success flash */}
            {videoEnded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-black/80 animate-fade-in" style={{ cursor: 'default' }}>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-good bg-good/15">
                  <CheckCircle2 size={40} className="text-good" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">Clip complete</p>
                  <p className="mt-1 text-sm text-white/45">Opening judge panel…</p>
                </div>
              </div>
            )}

            {/* Fullscreen lockout — appears if the judge exits fullscreen before the clip ends.
                Video is paused while this is visible (onPause guard). z-20 sits above the video. */}
            {hasEnteredFsRef.current && !isFullscreen && !videoEnded && (
              <div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black animate-fade-in"
                style={{ cursor: 'default' }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cm-red/50 bg-cm-red/10">
                  <Maximize2 size={28} className="text-cm-red" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">Fullscreen required</p>
                  <p className="mt-1 text-sm text-white/45">Clip paused. Return to fullscreen to continue.</p>
                </div>
                <button
                  className="btn-cm flex items-center gap-2"
                  onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
                >
                  <Maximize2 size={14} /> Return to fullscreen
                </button>
              </div>
            )}

          </div>

          {/* Bottom gradient — fades with the controls */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 transition-opacity duration-700"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', opacity: controlsVisible ? 1 : 0 }}
          />

          {/* Bottom controls — fade out when idle, fade in on mouse move */}
          <div
            className="relative z-20 shrink-0 px-6 pb-5 pt-2 transition-opacity duration-700"
            style={{ cursor: 'default', opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}
          >
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${videoProgress * 100}%`, background: '#cc1111' }}
              />
            </div>
            <div className="flex items-center gap-4">
              <Volume2 size={15} className="shrink-0 text-white/55" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setVolume(v)
                  if (videoRef.current) {
                    videoRef.current.volume = v
                    videoRef.current.muted = v === 0
                  }
                }}
                className="w-28 accent-white"
              />
              <span className="ml-2 text-xs text-white/40">
                {formatTime(videoProgress * videoDuration)} / {formatTime(videoDuration)}
              </span>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(204,17,17,0.65)' }}>
                Watch to unlock scoring
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}

    </Modal>
  )
}
