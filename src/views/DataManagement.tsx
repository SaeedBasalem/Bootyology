import { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Moon, Sun, ShieldCheck, Database } from 'lucide-react'
import { useStore } from '../lib/store'
import { SectionHeader } from '../components/ui'
import type { AppData } from '../lib/types'
import { todayISO } from '../lib/util'

export function DataManagement() {
  const { data, setSettings, importData, resetData, toast } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bootyology-backup-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Backup downloaded', icon: '💾', message: 'Keep it somewhere safe.' })
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData
        if (!Array.isArray(parsed.models)) throw new Error('bad file')
        if (!Array.isArray(parsed.clips)) parsed.clips = []
        if (!Array.isArray(parsed.rounds)) parsed.rounds = []
        if (!Array.isArray(parsed.scorecards)) parsed.scorecards = []
        importData(parsed)
        toast({ title: 'Backup restored', icon: '✅' })
      } catch {
        toast({ title: 'Could not read that file', icon: '⚠️', message: 'Make sure it is a Bootyology backup.' })
      }
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Data & settings" subtitle="Your studio, your data — kept on this device." />

      {/* Settings */}
      <div className="card p-5">
        <h2 className="mb-4 font-display text-lg font-semibold">Preferences</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Judge name</label>
            <input
              className="input"
              value={data.settings.judgeName}
              placeholder="Your name"
              onChange={(e) => setSettings({ judgeName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Default ranking</label>
            <select
              className="input"
              value={data.settings.rankBy}
              onChange={(e) => setSettings({ rankBy: e.target.value as AppData['settings']['rankBy'] })}
            >
              <option value="average">Average score</option>
              <option value="best">Best score</option>
              <option value="latest">Latest score</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Theme</label>
          <div className="inline-flex rounded-xl border border-line bg-surface2 p-1">
            <button
              onClick={() => setSettings({ theme: 'dark' })}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${data.settings.theme === 'dark' ? 'bg-gold text-[#241606]' : 'text-muted'}`}
            >
              <Moon size={15} /> Studio (dark)
            </button>
            <button
              onClick={() => setSettings({ theme: 'light' })}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${data.settings.theme === 'light' ? 'bg-gold text-[#241606]' : 'text-muted'}`}
            >
              <Sun size={15} /> Light
            </button>
          </div>
        </div>
      </div>

      {/* Storage overview */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
          <Database size={18} className="text-gold" /> What's stored
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Models', data.models.length],
            ['Rounds', data.rounds.length],
            ['Scorecards', data.scorecards.length],
            ['Clips', data.clips.length],
          ].map(([label, n]) => (
            <div key={label} className="rounded-xl bg-surface2 p-3 text-center">
              <p className="font-display text-2xl font-bold text-content">{n}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck size={13} className="text-good" /> Everything lives in this browser. Nothing is sent to any server.
        </p>
      </div>

      {/* Backup */}
      <div className="card p-5">
        <h2 className="mb-1 font-display text-lg font-semibold">Backup & restore</h2>
        <p className="mb-4 text-sm text-muted">
          Export a JSON backup of your roster, rounds, scorecards and clip details. (Clip <em>video files</em> stay on this
          device and aren't included in the JSON — re-link them after restoring on a new device.)
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-gold" onClick={handleExport}>
            <Download size={16} /> Export backup
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Import backup
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-bad/40 p-5">
        <h2 className="mb-1 font-display text-lg font-semibold text-bad">Reset</h2>
        <p className="mb-4 text-sm text-muted">
          Restore the starter roster and sample rounds. This replaces your current data — export a backup first.
        </p>
        {confirmReset ? (
          <div className="flex gap-2">
            <button
              className="btn-danger"
              onClick={() => {
                resetData()
                setConfirmReset(false)
                toast({ title: 'Reset to starter data' })
              }}
            >
              <RotateCcw size={15} /> Yes, reset everything
            </button>
            <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={15} /> Reset to starter data
          </button>
        )}
      </div>
    </div>
  )
}
