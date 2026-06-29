import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type View =
  | 'dashboard'
  | 'leaderboard'
  | 'models'
  | 'profile'
  | 'clips'
  | 'rounds'
  | 'compare'
  | 'insights'
  | 'achievements'
  | 'guide'
  | 'data'

interface NavValue {
  view: View
  modelId: string | null
  go: (view: View, modelId?: string | null) => void
}

const NavContext = createContext<NavValue | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('dashboard')
  const [modelId, setModelId] = useState<string | null>(null)

  const value = useMemo<NavValue>(
    () => ({
      view,
      modelId,
      go: (v, id = null) => {
        setView(v)
        if (v === 'profile') setModelId(id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      },
    }),
    [view, modelId],
  )

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav(): NavValue {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used within NavProvider')
  return ctx
}
