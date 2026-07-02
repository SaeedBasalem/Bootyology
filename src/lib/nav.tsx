import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type View =
  | 'dashboard'
  | 'leaderboard'
  | 'models'
  | 'profile'
  | 'clips'
  | 'queue'
  | 'rounds'
  | 'compare'
  | 'insights'
  | 'achievements'
  | 'guide'
  | 'data'
  | 'browse'

interface NavValue {
  view: View
  prevView: View
  modelId: string | null
  go: (view: View, modelId?: string | null) => void
}

const NavContext = createContext<NavValue | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('dashboard')
  const [prevView, setPrevView] = useState<View>('models')
  const [modelId, setModelId] = useState<string | null>(null)

  const value = useMemo<NavValue>(
    () => ({
      view,
      prevView,
      modelId,
      go: (v, id = null) => {
        setPrevView(view)
        setView(v)
        if (v === 'profile') setModelId(id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      },
    }),
    [view, prevView, modelId],
  )

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav(): NavValue {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used within NavProvider')
  return ctx
}
