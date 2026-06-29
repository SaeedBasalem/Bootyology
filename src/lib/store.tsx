import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, Clip, Model, Round, Scorecard, Settings } from './types'
import { seedData } from './seed'
import { computeTotal } from './scoring'
import { uid } from './util'
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
    case 'IMPORT':
      return action.data
    case 'RESET':
      return seedData()
    default:
      return state
  }
}

function loadLocal(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppData
      if (parsed && Array.isArray(parsed.models)) {
        if (!Array.isArray(parsed.clips)) parsed.clips = []
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
  importData: (d: AppData) => void
  resetData: () => void
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadLocal)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [synced, setSynced] = useState(false)
  const [syncing, setSyncing] = useState(true)

  // ── Initial load from Supabase ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    fetchAllData()
      .then((remote) => {
        if (cancelled) return
        // Only hydrate if Supabase has actual model data
        if (remote.models && remote.models.length > 0) {
          const merged: AppData = {
            version: 1,
            models: remote.models,
            rounds: remote.rounds ?? [],
            scorecards: remote.scorecards ?? [],
            clips: remote.clips ?? [],
            settings: remote.settings ?? loadLocal().settings,
          }
          dispatch({ type: 'IMPORT', data: merged })
        } else if (remote.settings) {
          // At least sync settings
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

  // ── Persist to localStorage ────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* full */ }
  }, [data])

  // ── Apply theme ────────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement
    if (data.settings.theme === 'light') root.classList.add('light')
    else root.classList.remove('light')
  }, [data.settings.theme])

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = uid('toast')
      setToasts((prev) => [...prev, { ...t, id }])
      window.setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast],
  )

  // ── Model helpers ──────────────────────────────────────────────────────────
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

  // ── Round helpers ──────────────────────────────────────────────────────────
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

  // ── Scorecard helpers ──────────────────────────────────────────────────────
  const saveScorecard: StoreContextValue['saveScorecard'] = useCallback((c) => {
    const card: Scorecard = {
      ...c,
      id: c.id ?? uid('sc'),
      total: computeTotal(c.scores),
      createdAt: (c as Scorecard).createdAt ?? new Date().toISOString(),
    }
    dispatch({ type: 'SAVE_SCORECARD', card })
    void upsertScorecard(card)
    return card
  }, [])

  const deleteScorecard = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SCORECARD', id })
    void deleteScorecardRemote(id)
  }, [])

  // ── Clip helpers ───────────────────────────────────────────────────────────
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

  // ── Settings ───────────────────────────────────────────────────────────────
  const setSettings = useCallback((s: Partial<Settings>) => {
    dispatch({ type: 'SET_SETTINGS', settings: s })
  }, [])

  // Sync settings to Supabase whenever they change (debounced via useEffect)
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
      setSettings, importData, resetData,
      toasts, toast, dismissToast,
    }),
    [data, synced, syncing, saveModel, deleteModel, saveRound, deleteRound, saveScorecard, deleteScorecard, saveClip, deleteClip, setSettings, importData, resetData, toasts, toast, dismissToast],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
