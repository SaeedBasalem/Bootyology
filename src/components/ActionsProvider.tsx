import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { ScorecardModal } from './ScorecardModal'
import { ModelModal } from './ModelModal'
import { ClipFormModal, ClipPlayerModal } from './ClipModals'
import type { Clip, Model, Scorecard } from '../lib/types'

interface ActionsValue {
  newScorecard: (opts?: { modelId?: string; clipId?: string }) => void
  editScorecard: (card: Scorecard) => void
  newModel: () => void
  editModel: (model: Model) => void
  newClip: (opts?: { modelId?: string }) => void
  editClip: (clip: Clip) => void
  playClip: (clip: Clip) => void
}

const ActionsContext = createContext<ActionsValue | null>(null)

export function ActionsProvider({ children }: { children: ReactNode }) {
  const [scorecardOpen, setScorecardOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Scorecard | null>(null)
  const [presetModelId, setPresetModelId] = useState<string | undefined>()
  const [presetClipId, setPresetClipId] = useState<string | undefined>()

  const [modelOpen, setModelOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<Model | null>(null)

  const [clipFormOpen, setClipFormOpen] = useState(false)
  const [editingClip, setEditingClip] = useState<Clip | null>(null)
  const [clipPresetModelId, setClipPresetModelId] = useState<string | undefined>()

  const [playerOpen, setPlayerOpen] = useState(false)
  const [playingClip, setPlayingClip] = useState<Clip | null>(null)

  const value = useMemo<ActionsValue>(
    () => ({
      newScorecard: (opts) => {
        setEditingCard(null)
        setPresetModelId(opts?.modelId)
        setPresetClipId(opts?.clipId)
        setScorecardOpen(true)
      },
      editScorecard: (card) => {
        setEditingCard(card)
        setPresetModelId(undefined)
        setPresetClipId(undefined)
        setScorecardOpen(true)
      },
      newModel: () => {
        setEditingModel(null)
        setModelOpen(true)
      },
      editModel: (model) => {
        setEditingModel(model)
        setModelOpen(true)
      },
      newClip: (opts) => {
        setEditingClip(null)
        setClipPresetModelId(opts?.modelId)
        setClipFormOpen(true)
      },
      editClip: (clip) => {
        setPlayerOpen(false)
        setEditingClip(clip)
        setClipPresetModelId(undefined)
        setClipFormOpen(true)
      },
      playClip: (clip) => {
        setPlayingClip(clip)
        setPlayerOpen(true)
      },
    }),
    [],
  )

  return (
    <ActionsContext.Provider value={value}>
      {children}
      {scorecardOpen && (
        <ScorecardModal
          open={scorecardOpen}
          onClose={() => setScorecardOpen(false)}
          editing={editingCard}
          presetModelId={presetModelId}
          presetClipId={presetClipId}
        />
      )}
      {modelOpen && <ModelModal open={modelOpen} onClose={() => setModelOpen(false)} editing={editingModel} />}
      {clipFormOpen && (
        <ClipFormModal
          open={clipFormOpen}
          onClose={() => setClipFormOpen(false)}
          editing={editingClip}
          presetModelId={clipPresetModelId}
        />
      )}
      <ClipPlayerModal
        open={playerOpen}
        clip={playingClip}
        onClose={() => setPlayerOpen(false)}
        onEdit={(clip) => value.editClip(clip)}
        onScore={(clip) => {
          setPlayerOpen(false)
          value.newScorecard({ modelId: clip.modelId, clipId: clip.id })
        }}
      />
    </ActionsContext.Provider>
  )
}

export function useActions(): ActionsValue {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useActions must be used within ActionsProvider')
  return ctx
}
