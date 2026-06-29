import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, Clip, CalendarEvent, DailyChallenge, JudgeProfile, Model, Round, Scorecard, Settings } from './types'
import { seedData } from './seed'
import { computeTotal, xpForScorecard, levelFromXp } from './scoring'
import { uid, todayISO } from './util'
import { deleteClipBlob } from './clipStore'
import {
  fetchAllData,
  upsertModel,
  deleteModelRemote,
  upsertRound,
  deleteRoundRemote,
  upsertScorecard,
  deleteScorecardRemote,
  upsertClip,
  deleteClipRemote,
  upsertSettings,
} from './supabase'

const STORAGE_KEY = 'bootyology.v1'

type Action =
  | { type: 'ADD_MODEL'; model: Model }
  | { type: 'UPDATE_MODEL'; model: Model }
  | { type: 'DELETE_MODEL'; id: string }
  | { type: 'ADD_ROUND'; round: Round }
  | { type: 'UPDATE_ROUND'; round: Round }
  | { type: 'DELETE_ROUND'; id: string }
  | { type: 'SAVE_SCORECARD'; card: Scorecard }
  | { type: 'DELETE_SCORECARD'; id: string }
  | { type: 'SAVE_CLIP'; clip: Clip }
  | { type: 'DELETE_CLIP'; id: string }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings> }
  | { type: 'UPDATE_JUDGE_PROFILE'; profile: Partial<JudgeProfile> }
  | { type: 'SAVE_CHALLENGE'; challenge: DailyChallenge }
  | { type: 'SAVE_CALENDAR_EVENT'; event: CalendarEvent }
  | { type: 'DELETE_CALENDAR_EVENT'; id: string }
  | { type: 'IMPORT'; data: AppData }
  | { type: 'RESET' }

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'ADD_MODEL':
      return { ...state, models: [...state.models, action.model] }
    case 'UPDATE_MODEL':
      return { ...state, models: state.models.map((m) => (m.id === action.model.id ? action.model : m)) }
    case 'DELETE_MODEL':
      return {
        ...state,
        models: state.models.filter((m) => m.id !== action.id),
        scorecards: state.scorecards.filter((s) => s.modelId !== action.id),
        clips: state.clips.filter((c) => c.modelId !== action.id),
      }
    case 'ADD_ROUND':
      return { ...state, rounds: [...state.rounds, action.round] }
    case 'UPDATE_ROUND':
      return { ...state, rounds: state.rounds.map((r) => (r.id === action.round.id ? action.round : r)) }
    case 'DELETE_ROUND':
      return {
        ...state,
        rounds: state.rounds.filter((r) => r.id !== action.id),
        scorecards: state.scorecards.filter((s) => s.roundId !== action.id),
      }
    case 'SAVE_SCORECARD': {
      const exists = state.scorecards.some((s) => s.id === action.card.id)
      return {
        ...state,
        scorecards: exists
          ? state.scorecards.map((s) => (s.id === action.card.id ? action.card : s))
          : [...state.scorecards, action.card],
      }
    }
    case 'DELETE_SCORECARD':
      return { ...state, scorecards: state.scorecards.filter((s) => s.id !== action.id) }
    case 'SAVE_CLIP': {
      const exists = state.clips.some((c) => c.id === action.clip.id)
      return {
        ...state,
        clips: exists
          ? state.clips.map((c) => (c.id === action.clip.id ? action.clip : c))
          : [...state.clips, action.clip],
      }
    }
    case 'DELETE_CLIP':
      return {
        ...state,
        clips: state.clips.filter((c) => c.id !== action.id),
        scorecards: state.scorecards.map((s) => (s.clipId === action.id ? { ...s, clipId: undefined } : s)),
      }
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'UPDATE_JUDGE_PROFILE': {
      const cur = state.judgeProfile ?? defaultJudgeProfile()
      return { ...state, judgeProfile: { ...cur, ...action.profile } }
    }
    case 'SAVE_CHALLENGE': {
      const challenges = state.dailyChallenges ?? []
      const exists = challenges.some((c) => c.id === action.challenge.id)
      return {
        ...state,
        dailyChallenges: exists
          ? challenges.map((c) => (c.id === action.challenge.id ? action.challenge : c))
          : [...challenges, action.challenge],
      }
    }
    case 'SAVE_CALENDAR_EVENT': {
      const events = state.calendarEvents ?? []
      const exists = events.some((e) => e.id === action.event.id)
      return {
        ...state,
        calendarEvents: exists
          ? events.map((e) => (e.id === action.event.id ? action.event : e))
          : [...events, action.event],
      }
    }
    case 'DELETE_CALENDAR_EVENT':
      return { ...state, calendarEvents: (state.calendarEvents ?? []).filter((e) => e.id !== action.id) }
    case 'IMPORT':
      return action.data
    case 'RESET':
      return seedData()
    default:
      return state
  }
}

function defaultJudgeProfile(): JudgeProfile {
  return { xp: 0, level: 1, currentStreak: 0, longestStreak: 0, lastActiveDate: '', totalSessions: 0, gooning: 0, unexpectedOrgasms: 0 }
}

function loadLocal(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppData
      if (parsed && Array.isArray(parsed.models)) {
        if (!Array.isArray(parsed.clips)) parsed.clips = []
        if (!parsed.judgeProfile) parsed.judgeProfile = defaultJudgeProfile()
        if (!Array.isArray(parsed.dailyChallenges)) parsed.dailyChallenges = []
        if (!Array.isArray(parsed.calendarEvents)) parsed.calendarEvents = []
        return parsed
      }
    }
  } catch { /* ignore */ }
  return seedData()
}

// ── Toast system ──────────────────────────────────────────────────────────────
export interface Toast {
  id: string
  title: string
  message?: string
  icon?: string
  tone?: 'default' | 'celebrate'
}

interface StoreContextValue {
  data: AppData
  synced: boolean
  syncing: boolean
  saveModel: (m: Omit<Model, 'id' | 'createdAt'> & { id?: string }) => Model
  deleteModel: (id: string) => void
  saveRound: (r: Omit<Round, 'id' | 'createdAt'> & { id?: string }) => Round
  deleteRound: (id: string) => void
  saveScorecard: (c: Omit<Scorecard, 'id' | 'createdAt' | 'total'> & { id?: string }) => Scorecard
  deleteScorecard: (id: string) => void
  saveClip: (c: Omit<Clip, 'id' | 'createdAt'> & { id?: string }) => Clip
  deleteClip: (id: string) => void
  setSettings: (s: Partial<Settings>) => void
  updateJudgeProfile: (p: Partial<JudgeProfile>) => void
  updateStreak: () => void
  saveChallenge: (c: DailyChallenge) => void
  saveCalendarEvent: (e: Omit<CalendarEvent, 'id' | 'createdAt'> & { id?: string }) => CalendarEvent
  deleteCalendarEvent: (id: string) => void
  importData: (d: AppData) => void
  resetData: () => void
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadLocal)
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])

  const [toasts, setToasts] = useState<Toast[]>([])
  const [synced, setSynced] = useState(false)
  const [syncing, setSyncing] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchAllData()
      .then((remote) => {
        if (cancelled) return
        if (remote.models && remote.models.length > 0) {
          const local = loadLocal()
          const merged: AppData = {
            version: 1,
            models: remote.models,
            rounds: remote.rounds ?? [],
            scorecards: remote.scorecards ?? [],
            clips: remote.clips ?? [],
            settings: remote.settings ?? local.settings,
            judgeProfile: local.judgeProfile ?? defaultJudgeProfile(),
            dailyChallenges: local.dailyChallenges ?? [],
            calendarEvents: local.calendarEvents ?? [],
          }
          dispatch({ type: 'IMPORT', data: merged })
        } else if (remote.settings) {
          dispatch({ type: 'SET_SETTINGS', settings: remote.settings })
        }
        setSynced(true)
        setSyncing(false)
      })
      .catch(() => {
        if (!cancelled) setSyncing(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* full */ }
  }, [data])

  useEffect(() => {
    const root = document.documentElement
    if (data.settings.theme === 'light') root.classList.add('light')
    else root.classList.remove('light')
  }, [data.settings.theme])

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = uid('toast')
      setToasts((prev) => [...prev, { ...t, id }])
      window.setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast],
  )

  const saveModel: StoreContextValue['saveModel'] = useCallback((m) => {
    const model: Model = {
      ...m,
      id: m.id ?? uid('m'),
      photos: m.photos ?? [],
      workspace: m.workspace ?? 'Chocolate Models Magazine',
      createdAt: (m as Model).createdAt ?? new Date().toISOString(),
    }
    dispatch({ type: m.id ? 'UPDATE_MODEL' : 'ADD_MODEL', model })
    void upsertModel(model)
    return model
  }, [])

  const deleteModel = useCallback((id: string) => {
    dispatch({ type: 'DELETE_MODEL', id })
    void deleteModelRemote(id)
  }, [])

  const saveRound: StoreContextValue['saveRound'] = useCallback((r) => {
    const round: Round = { ...r, id: r.id ?? uid('r'), createdAt: (r as Round).createdAt ?? new Date().toISOString() }
    dispatch({ type: r.id ? 'UPDATE_ROUND' : 'ADD_ROUND', round })
    void upsertRound(round)
    return round
  }, [])

  const deleteRound = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ROUND', id })
    void deleteRoundRemote(id)
  }, [])

  const saveScorecard: StoreContextValue['saveScorecard'] = useCallback((c) => {
    const card: Scorecard = {
      ...c,
      id: c.id ?? uid('sc'),
      total: computeTotal(c.scores),
      createdAt: (c as Scorecard).createdAt ?? new Date().toISOString(),
    }
    dispatch({ type: 'SAVE_SCORECARD', card })
    void upsertScorecard(card)

    // Award XP and update streak (only for new scorecards, not edits)
    if (!c.id) {
      const jp = dataRef.current.judgeProfile ?? defaultJudgeProfile()
      const earned = xpForScorecard(card.total)
      const newXp = jp.xp + earned
      const today = todayISO()
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const continued = jp.lastActiveDate === yesterday || jp.lastActiveDate === today
      const newStreak = jp.lastActiveDate === today ? jp.currentStreak : (continued ? jp.currentStreak + 1 : 1)
      dispatch({
        type: 'UPDATE_JUDGE_PROFILE',
        profile: {
          xp: newXp,
          level: levelFromXp(newXp),
          totalSessions: jp.totalSessions + 1,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, jp.longestStreak),
          lastActiveDate: today,
          gooning: card.reaction?.sessionType === 'gooning' ? jp.gooning + 1 : jp.gooning,
          unexpectedOrgasms: card.reaction?.sessionType === 'unexpected_orgasm' ? jp.unexpectedOrgasms + 1 : jp.unexpectedOrgasms,
        },
      })
    }

    return card
  }, [])

  const deleteScorecard = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SCORECARD', id })
    void deleteScorecardRemote(id)
  }, [])

  const saveClip: StoreContextValue['saveClip'] = useCallback((c) => {
    const clip: Clip = { ...c, id: c.id ?? uid('clip'), createdAt: (c as Clip).createdAt ?? new Date().toISOString() }
    dispatch({ type: 'SAVE_CLIP', clip })
    void upsertClip(clip)
    return clip
  }, [])

  const deleteClip = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CLIP', id })
    void deleteClipRemote(id)
    void deleteClipBlob(id).catch(() => {})
  }, [])

  const setSettings = useCallback((s: Partial<Settings>) => {
    dispatch({ type: 'SET_SETTINGS', settings: s })
  }, [])

  const updateJudgeProfile = useCallback((p: Partial<JudgeProfile>) => {
    dispatch({ type: 'UPDATE_JUDGE_PROFILE', profile: p })
  }, [])

  const updateStreak = useCallback(() => {
    const jp = dataRef.current.judgeProfile ?? defaultJudgeProfile()
    const today = todayISO()
    if (jp.lastActiveDate === today) return
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const newStreak = jp.lastActiveDate === yesterday ? jp.currentStreak + 1 : 1
    dispatch({
      type: 'UPDATE_JUDGE_PROFILE',
      profile: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, jp.longestStreak),
        lastActiveDate: today,
      },
    })
  }, [])

  const saveChallenge = useCallback((c: DailyChallenge) => {
    dispatch({ type: 'SAVE_CHALLENGE', challenge: c })
  }, [])

  const saveCalendarEvent: StoreContextValue['saveCalendarEvent'] = useCallback((e) => {
    const event: CalendarEvent = { ...e, id: e.id ?? uid('ce'), createdAt: (e as CalendarEvent).createdAt ?? new Date().toISOString() }
    dispatch({ type: 'SAVE_CALENDAR_EVENT', event })
    return event
  }, [])

  const deleteCalendarEvent = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CALENDAR_EVENT', id })
  }, [])

  useEffect(() => {
    if (!synced) return
    void upsertSettings(data.settings)
  }, [data.settings, synced])

  const importData = useCallback((d: AppData) => dispatch({ type: 'IMPORT', data: d }), [])
  const resetData = useCallback(() => dispatch({ type: 'RESET' }), [])

  const value = useMemo<StoreContextValue>(
    () => ({
      data, synced, syncing,
      saveModel, deleteModel,
      saveRound, deleteRound,
      saveScorecard, deleteScorecard,
      saveClip, deleteClip,
      setSettings,
      updateJudgeProfile, updateStreak,
      saveChallenge, saveCalendarEvent, deleteCalendarEvent,
      importData, resetData,
      toasts, toast, dismissToast,
    }),
    [data, synced, syncing, saveModel, deleteModel, saveRound, deleteRound, saveScorecard, deleteScorecard, saveClip, deleteClip, setSettings, updateJudgeProfile, updateStreak, saveChallenge, saveCalendarEvent, deleteCalendarEvent, importData, resetData, toasts, toast, dismissToast],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
