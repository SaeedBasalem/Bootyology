import { useState } from 'react'
import {
  LayoutDashboard,
  Trophy,
  Users,
  Film,
  PlayCircle,
  Layers,
  Swords,
  BarChart3,
  Award,
  BookOpen,
  Settings,
  Plus,
  Moon,
  Sun,
  Menu,
  X,
  Cloud,
  CloudOff,
  Loader2,
} from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import { NavProvider, useNav, type View } from './lib/nav'
import { ActionsProvider, useActions } from './components/ActionsProvider'
import { Toasts } from './components/ui'
import { classNames } from './lib/util'

import { Dashboard } from './views/Dashboard'
import { Leaderboard } from './views/Leaderboard'
import { Models } from './views/Models'
import { ModelProfile } from './views/ModelProfile'
import { Clips } from './views/Clips'
import { WatchQueue } from './views/WatchQueue'
import { Rounds } from './views/Rounds'
import { Compare } from './views/Compare'
import { Insights } from './views/Insights'
import { Achievements } from './views/Achievements'
import { Guide } from './views/Guide'
import { DataManagement } from './views/DataManagement'

interface NavItem {
  view: View
  label: string
  icon: typeof Trophy
}

const NAV: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { view: 'models', label: 'Roster', icon: Users },
  { view: 'queue', label: 'Watch Queue', icon: PlayCircle },
  { view: 'clips', label: 'Clip Library', icon: Film },
  { view: 'rounds', label: 'Rounds', icon: Layers },
  { view: 'compare', label: 'Compare', icon: Swords },
  { view: 'insights', label: 'Insights', icon: BarChart3 },
  { view: 'achievements', label: 'Achievements', icon: Award },
  { view: 'guide', label: 'Scoring guide', icon: BookOpen },
  { view: 'data', label: 'Data & settings', icon: Settings },
]

const BOTTOM = ['dashboard', 'leaderboard', 'models', 'queue'] as const

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* CM logo — place cm-logo.png in /public to activate */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black">
        <img
          src="/cm-logo.png"
          alt="CM"
          className="h-full w-full object-contain p-0.5"
          onError={(e) => {
            const el = e.currentTarget
            el.style.display = 'none'
            const fb = el.nextElementSibling as HTMLElement | null
            if (fb) fb.style.display = 'flex'
          }}
        />
        {/* Fallback: styled CM initials */}
        <span
          className="hidden h-full w-full items-center justify-center font-black text-sm tracking-tight"
          style={{ display: 'none', color: '#cc1111', fontFamily: 'serif' }}
        >
          CM
        </span>
      </div>
      <div className="leading-tight">
        <p className="font-display text-lg font-bold cm-text">Bootyology</p>
        <p className="-mt-0.5 text-[10px] uppercase tracking-widest text-muted">Ranking Studio</p>
      </div>
    </div>
  )
}

function SyncStatus() {
  const { synced, syncing } = useStore()
  if (syncing) return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <Loader2 size={12} className="animate-spin" /> Syncing…
    </span>
  )
  if (synced) return (
    <span className="flex items-center gap-1.5 text-xs text-good">
      <Cloud size={12} /> Synced
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <CloudOff size={12} /> Offline
    </span>
  )
}

function ThemeToggle() {
  const { data, setSettings } = useStore()
  const dark = data.settings.theme === 'dark'
  return (
    <button
      onClick={() => setSettings({ theme: dark ? 'light' : 'dark' })}
      className="btn-quiet h-9 w-9 p-0"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

function Sidebar() {
  const { view, go } = useNav()
  const { newScorecard } = useActions()
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/60 p-4 backdrop-blur lg:flex">
      <div className="px-2 py-2">
        <Logo />
      </div>
      <button className="btn-cm mt-4 w-full" onClick={() => newScorecard()}>
        <Plus size={16} /> New scorecard
      </button>
      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = view === item.view || (item.view === 'models' && view === 'profile')
          return (
            <button
              key={item.view}
              onClick={() => go(item.view)}
              className={classNames('nav-item w-full', active && 'nav-item-active')}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="flex items-center justify-between border-t border-line pt-3">
        <SyncStatus />
        <ThemeToggle />
      </div>
    </aside>
  )
}

function MobileHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/85 px-4 py-3 backdrop-blur lg:hidden">
      <Logo />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button onClick={onMenu} className="btn-quiet h-9 w-9 p-0" aria-label="Menu">
          <Menu size={20} />
        </button>
      </div>
    </header>
  )
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { view, go } = useNav()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto border-l border-line bg-surface p-4 animate-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <Logo />
          <button onClick={onClose} className="btn-quiet h-9 w-9 p-0" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = view === item.view || (item.view === 'models' && view === 'profile')
            return (
              <button
                key={item.view}
                onClick={() => {
                  go(item.view)
                  onClose()
                }}
                className={classNames('nav-item w-full', active && 'nav-item-active')}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

function BottomNav({ onMenu }: { onMenu: () => void }) {
  const { view, go } = useNav()
  const { newScorecard } = useActions()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-line bg-surface/90 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur lg:hidden">
      {BOTTOM.map((v) => {
        const item = NAV.find((n) => n.view === v)!
        const Icon = item.icon
        const active = view === v || (v === 'models' && view === 'profile')
        return (
          <button
            key={v}
            onClick={() => go(v)}
            className={classNames(
              'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition',
              active ? 'text-gold' : 'text-muted',
            )}
          >
            <Icon size={20} />
            {item.label}
          </button>
        )
      })}
      <button
        onClick={() => newScorecard()}
        className="flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-gold"
        aria-label="New scorecard"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-gold text-[#241606]">
          <Plus size={20} />
        </span>
      </button>
      <button onClick={onMenu} className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium text-muted">
        <Menu size={20} />
        More
      </button>
    </nav>
  )
}

function MainContent() {
  const { view } = useNav()
  switch (view) {
    case 'dashboard':
      return <Dashboard />
    case 'leaderboard':
      return <Leaderboard />
    case 'models':
      return <Models />
    case 'profile':
      return <ModelProfile />
    case 'clips':
      return <Clips />
    case 'queue':
      return <WatchQueue />
    case 'rounds':
      return <Rounds />
    case 'compare':
      return <Compare />
    case 'insights':
      return <Insights />
    case 'achievements':
      return <Achievements />
    case 'guide':
      return <Guide />
    case 'data':
      return <DataManagement />
    default:
      return <Dashboard />
  }
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="relative z-10 flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-10">
          <div className="animate-fade-in">
            <MainContent />
          </div>
        </main>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <BottomNav onMenu={() => setMenuOpen(true)} />
      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <NavProvider>
        <ActionsProvider>
          <Shell />
        </ActionsProvider>
      </NavProvider>
    </StoreProvider>
  )
}
