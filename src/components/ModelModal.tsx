import { useRef, useState, useCallback } from 'react'
import { Heart, Trash2, Camera, X, Plus, Instagram, Twitter, Globe, Link, Upload, Loader2, Check } from 'lucide-react'
import { Modal, Avatar } from './ui'
import { useStore } from '../lib/store'
import type { Model } from '../lib/types'
import { ACCENTS, classNames, randomAccent, uid } from '../lib/util'
import { uploadModelPhoto } from '../lib/supabase'

const EMOJI_CHOICES = ['👑', '💎', '🌹', '💗', '🌺', '🎷', '✨', '🔥', '🍫', '🌙', '💃', '🦋', '🌸', '⭐', '🎀', '🍑']
const WORKSPACES = ['Chocolate Models Magazine', 'Personal Collection', 'VIP Roster', 'Discovery Board']
const CATEGORIES = ['BBW', 'Latina', 'MILF', 'Petite', 'Ebony', 'Asian', 'Mixed', 'Curvy', 'Slim', 'Thick', 'Alt', 'Other']

type Tab = 'profile' | 'details' | 'photos' | 'social'
type UploadState = 'idle' | 'uploading' | 'done' | 'error'

export function ModelModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Model | null
}) {
  const { saveModel, deleteModel, toast } = useStore()

  // Stable ID for this modal session (so new-model uploads have a consistent path)
  const modelIdRef = useRef(editing?.id ?? uid('m'))

  const [tab, setTab] = useState<Tab>('profile')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')

  // ── Profile ───────────────────────────────────────────────────────────────
  const [name, setName] = useState(editing?.name ?? '')
  const [aliases, setAliases] = useState(editing?.aliases ?? '')
  const [emoji, setEmoji] = useState(editing?.emoji ?? '✨')
  const [accent, setAccent] = useState(editing?.accent ?? randomAccent())
  const [tags, setTags] = useState((editing?.tags ?? []).join(', '))
  const [workspace, setWorkspace] = useState(editing?.workspace ?? 'Chocolate Models Magazine')
  const [favorite, setFavorite] = useState(editing?.favorite ?? false)

  // ── Details ───────────────────────────────────────────────────────────────
  const [bio, setBio] = useState(editing?.bio ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [discoveredYear, setDiscoveredYear] = useState(editing?.discoveredYear?.toString() ?? '')
  const [nationality, setNationality] = useState(editing?.nationality ?? '')
  const [birthday, setBirthday] = useState(editing?.birthday ?? '')
  const [measurements, setMeasurements] = useState(editing?.measurements ?? '')
  const [height, setHeight] = useState(editing?.height ?? '')
  const [category, setCategory] = useState(editing?.category ?? '')

  // ── Photos ────────────────────────────────────────────────────────────────
  const [photoUrl, setPhotoUrl] = useState(editing?.photoUrl ?? '')
  const [photos, setPhotos] = useState<string[]>(editing?.photos ?? [])
  const [photoUrlInput, setPhotoUrlInput] = useState('')

  // ── Social ────────────────────────────────────────────────────────────────
  const [instagram, setInstagram] = useState(editing?.instagram ?? '')
  const [twitter, setTwitter] = useState(editing?.twitter ?? '')
  const [onlyfans, setOnlyfans] = useState(editing?.onlyfans ?? '')
  const [website, setWebsite] = useState(editing?.website ?? '')

  const [confirmDelete, setConfirmDelete] = useState(false)

  // ── Photo upload ──────────────────────────────────────────────────────────
  const handlePhotoFile = useCallback(
    async (file: File, isMain: boolean) => {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Not an image', icon: '⚠️', message: 'Please pick a JPEG, PNG, or WebP file.' })
        return
      }

      // 1. Immediate local preview so the user sees the face right away
      const localUrl = URL.createObjectURL(file)
      if (isMain) setPhotoUrl(localUrl)
      else setPhotos((prev) => [...prev, localUrl])

      setUploadState('uploading')

      // 2. Try uploading to Supabase Storage
      const remoteUrl = await uploadModelPhoto(modelIdRef.current, file)

      if (remoteUrl) {
        // Replace the temporary blob URL with the permanent Supabase URL
        if (isMain) {
          setPhotoUrl(remoteUrl)
        } else {
          setPhotos((prev) => prev.map((p) => (p === localUrl ? remoteUrl : p)))
        }
        URL.revokeObjectURL(localUrl)
        setUploadState('done')
        toast({ title: 'Photo uploaded ✓', icon: '📸' })
      } else {
        // Supabase failed — fall back to a persistent data URL (base64)
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          if (isMain) {
            setPhotoUrl(dataUrl)
          } else {
            setPhotos((prev) => prev.map((p) => (p === localUrl ? dataUrl : p)))
          }
          URL.revokeObjectURL(localUrl)
        }
        reader.readAsDataURL(file)
        setUploadState('error')
        toast({
          title: 'Saved in browser',
          icon: '💾',
          message: 'Cloud upload failed — photo stored locally. It will stay until you clear browser data.',
        })
      }
    },
    [toast],
  )

  function addPhotoUrl() {
    const u = photoUrlInput.trim()
    if (!u) return
    setPhotos((prev) => [...prev, u])
    setPhotoUrlInput('')
  }

  function setAsMain(url: string) {
    const old = photoUrl
    setPhotoUrl(url)
    if (old) setPhotos((prev) => prev.map((p) => (p === url ? old : p)))
    else setPhotos((prev) => prev.filter((p) => p !== url))
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url))
    if (photoUrl === url) setPhotoUrl('')
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function handleSave() {
    if (!name.trim()) {
      toast({ title: 'Name required', icon: '⚠️' })
      return
    }
    saveModel({
      id: modelIdRef.current,
      name: name.trim(),
      aliases: aliases.trim() || undefined,
      emoji,
      accent,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      discoveredYear: discoveredYear ? Number(discoveredYear) : undefined,
      notes: notes.trim() || undefined,
      favorite,
      archived: editing?.archived ?? false,
      photoUrl: photoUrl || undefined,
      photos,
      instagram: instagram.trim() || undefined,
      twitter: twitter.trim() || undefined,
      onlyfans: onlyfans.trim() || undefined,
      website: website.trim() || undefined,
      nationality: nationality.trim() || undefined,
      birthday: birthday.trim() || undefined,
      measurements: measurements.trim() || undefined,
      height: height.trim() || undefined,
      category: category || undefined,
      workspace,
      bio: bio.trim() || undefined,
    })
    toast({ title: editing ? 'Model updated ✨' : 'Added to magazine 🌟', message: name.trim() })
    onClose()
  }

  function handleDelete() {
    if (!editing) return
    deleteModel(editing.id)
    toast({ title: 'Model removed', message: editing.name })
    onClose()
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'details', label: 'Details' },
    { key: 'photos', label: `Photos${photos.length || photoUrl ? ` (${(photoUrl ? 1 : 0) + photos.length})` : ''}` },
    { key: 'social', label: 'Social' },
  ]

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit — ${editing.name}` : 'Add model to magazine'} wide>
      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-xl border border-line bg-surface2 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={classNames(
              'flex-1 rounded-lg py-2 text-xs font-semibold transition',
              tab === t.key ? 'bg-gradient-to-r from-cm-red-soft to-cm-red text-white shadow-sm' : 'text-muted hover:text-content',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE ──────────────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 cursor-pointer" onClick={() => { setTab('photos') }}>
              {photoUrl ? (
                <div className="group relative h-[64px] w-[64px]">
                  <img src={photoUrl} alt={name} className="h-full w-full rounded-full object-cover" style={{ border: `2px solid ${accent}` }} />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <Avatar name={name || '?'} emoji={emoji} accent={accent} size={64} />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-line">
                <Camera size={10} className="text-muted" />
              </div>
            </div>
            <div className="flex-1">
              <label className="label">Stage name *</label>
              <input className="input" placeholder="Performer name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
          </div>
          <p className="text-[11px] text-muted -mt-2">Click the avatar to add a photo. Model photos replace this icon everywhere in the app.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Also known as</label>
              <input className="input" placeholder="Alias (optional)" value={aliases} onChange={(e) => setAliases(e.target.value)} />
            </div>
            <div>
              <label className="label">Workspace / Magazine</label>
              <select className="input" value={workspace} onChange={(e) => setWorkspace(e.target.value)}>
                {WORKSPACES.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Avatar glyph (used when no photo is set)</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={classNames(
                    'flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition',
                    emoji === e ? 'border-cm-red bg-surface2' : 'border-line hover:border-cm-red/50',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Accent colour</label>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAccent(a)}
                  className={classNames('h-8 w-8 rounded-full border-2 transition', accent === a ? 'scale-110' : 'opacity-70 hover:opacity-100')}
                  style={{ background: a, borderColor: accent === a ? 'var(--text)' : 'transparent' }}
                  aria-label={`Accent ${a}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input" placeholder="Favourite, BBW, Original…" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>

          <button
            onClick={() => setFavorite((f) => !f)}
            className={classNames(
              'flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition',
              favorite ? 'border-rose/60 bg-rose/10 text-rose' : 'border-line text-muted hover:text-content',
            )}
          >
            <Heart size={16} className={favorite ? 'fill-current' : ''} />
            {favorite ? 'Marked as favourite' : 'Mark as favourite'}
          </button>
        </div>
      )}

      {/* ── DETAILS ──────────────────────────────────────────────────────────── */}
      {tab === 'details' && (
        <div className="space-y-4">
          <div>
            <label className="label">Bio</label>
            <textarea className="input min-h-[90px] resize-y" placeholder="Background, style, what makes them stand out…" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">— Select —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nationality</label>
              <input className="input" placeholder="e.g. Brazilian" value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </div>
            <div>
              <label className="label">Birthday</label>
              <input className="input" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
            </div>
            <div>
              <label className="label">Discovered (year)</label>
              <input className="input" type="number" placeholder="e.g. 2021" value={discoveredYear} onChange={(e) => setDiscoveredYear(e.target.value)} />
            </div>
            <div>
              <label className="label">Height</label>
              <input className="input" placeholder='e.g. 5&apos;6"' value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
            <div>
              <label className="label">Measurements</label>
              <input className="input" placeholder="e.g. 36-24-42" value={measurements} onChange={(e) => setMeasurements(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Private notes</label>
            <textarea className="input min-h-[70px] resize-y" placeholder="Personal notes — why they stand out…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      )}

      {/* ── PHOTOS ───────────────────────────────────────────────────────────── */}
      {tab === 'photos' && (
        <div className="space-y-5">
          {/* Upload status banner */}
          {uploadState === 'uploading' && (
            <div className="flex items-center gap-2 rounded-xl bg-surface2 px-4 py-3 text-sm text-muted">
              <Loader2 size={15} className="animate-spin text-cm-red" />
              Uploading to cloud…
            </div>
          )}
          {uploadState === 'done' && (
            <div className="flex items-center gap-2 rounded-xl bg-good/10 px-4 py-3 text-sm text-good">
              <Check size={15} /> Uploaded to Supabase Storage ✓
            </div>
          )}
          {uploadState === 'error' && (
            <div className="flex items-center gap-2 rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">
              <Camera size={15} /> Saved in browser (cloud upload failed)
            </div>
          )}

          {/* Main profile photo */}
          <div>
            <label className="label">Main profile photo — replaces the emoji icon everywhere</label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="shrink-0">
                {photoUrl ? (
                  <div className="relative h-24 w-24">
                    <img src={photoUrl} alt="Profile" className="h-full w-full rounded-2xl object-cover border border-line" />
                    <button
                      onClick={() => setPhotoUrl('')}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-line text-muted hover:text-bad"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-surface2 text-muted transition hover:border-cm-red/50 hover:text-cm-red"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Camera size={24} />
                    <span className="text-[10px]">Add photo</span>
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-1 flex-col gap-3">
                <div>
                  <label className="label">Paste a URL</label>
                  <input
                    className="input"
                    placeholder="https://… (Instagram, Twitter, etc.)"
                    value={photoUrl.startsWith('data:') ? '' : photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">or</span>
                  <button
                    className="btn-ghost text-xs"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadState === 'uploading'}
                  >
                    <Upload size={13} /> Upload from device
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void handlePhotoFile(f, true)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div>
            <label className="label">Photo gallery (additional photos)</label>
            {photos.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((p) => (
                  <div key={p} className="group relative aspect-square">
                    <img src={p} alt="" className="h-full w-full rounded-xl object-cover border border-line" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-black/50 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => setAsMain(p)}
                        className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white font-medium hover:bg-white/30"
                      >
                        Set main
                      </button>
                      <button onClick={() => removePhoto(p)} className="text-white/70 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Paste photo URL then press Add…"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPhotoUrl()}
              />
              <button className="btn-ghost shrink-0" onClick={addPhotoUrl}>
                <Plus size={15} /> Add
              </button>
            </div>
            <button
              className="btn-ghost mt-2 text-xs"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploadState === 'uploading'}
            >
              <Upload size={13} /> Upload photos from device
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                Array.from(e.target.files ?? []).forEach((f) => void handlePhotoFile(f, false))
                e.target.value = ''
              }}
            />
          </div>
        </div>
      )}

      {/* ── SOCIAL ───────────────────────────────────────────────────────────── */}
      {tab === 'social' && (
        <div className="space-y-4">
          <div>
            <label className="label flex items-center gap-1.5"><Instagram size={13} /> Instagram</label>
            <input className="input" placeholder="@username or full URL" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Twitter size={13} /> Twitter / X</label>
            <input className="input" placeholder="@username or full URL" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Link size={13} /> OnlyFans</label>
            <input className="input" placeholder="@username or full URL" value={onlyfans} onChange={(e) => setOnlyfans(e.target.value)} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Globe size={13} /> Website</label>
            <input className="input" placeholder="https://…" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <p className="rounded-xl bg-surface2 p-3 text-xs text-muted">Social links are stored privately — only visible to you.</p>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-between gap-2">
        {editing ? (
          confirmDelete ? (
            <button className="btn-danger" onClick={handleDelete}>
              <Trash2 size={15} /> Confirm delete
            </button>
          ) : (
            <button className="btn-quiet text-bad" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={15} /> Delete
            </button>
          )
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-cm" onClick={handleSave}>
            {editing ? 'Save changes' : 'Add to magazine'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
