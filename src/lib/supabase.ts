import { createClient } from '@supabase/supabase-js'
import type { AppData, Clip, Model, Round, Scorecard, Settings } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Row mappers ───────────────────────────────────────────────────────────────

function modelToRow(m: Model) {
  return {
    id: m.id,
    name: m.name,
    aliases: m.aliases ?? null,
    emoji: m.emoji,
    accent: m.accent,
    tags: m.tags,
    discovered_year: m.discoveredYear ?? null,
    notes: m.notes ?? null,
    favorite: m.favorite,
    archived: m.archived,
    photo_url: m.photoUrl ?? null,
    photos: m.photos ?? [],
    instagram: m.instagram ?? null,
    twitter: m.twitter ?? null,
    onlyfans: m.onlyfans ?? null,
    website: m.website ?? null,
    nationality: m.nationality ?? null,
    birthday: m.birthday ?? null,
    measurements: m.measurements ?? null,
    height: m.height ?? null,
    category: m.category ?? null,
    workspace: m.workspace ?? 'Chocolate Models Magazine',
    bio: m.bio ?? null,
    created_at: m.createdAt,
  }
}

function rowToModel(row: Record<string, unknown>): Model {
  return {
    id: row.id as string,
    name: row.name as string,
    aliases: (row.aliases as string) || undefined,
    emoji: row.emoji as string,
    accent: row.accent as string,
    tags: (row.tags as string[]) ?? [],
    discoveredYear: (row.discovered_year as number) || undefined,
    notes: (row.notes as string) || undefined,
    favorite: row.favorite as boolean,
    archived: row.archived as boolean,
    photoUrl: (row.photo_url as string) || undefined,
    photos: (row.photos as string[]) ?? [],
    instagram: (row.instagram as string) || undefined,
    twitter: (row.twitter as string) || undefined,
    onlyfans: (row.onlyfans as string) || undefined,
    website: (row.website as string) || undefined,
    nationality: (row.nationality as string) || undefined,
    birthday: (row.birthday as string) || undefined,
    measurements: (row.measurements as string) || undefined,
    height: row.height as string | undefined,
    category: (row.category as string) || undefined,
    workspace: (row.workspace as string) || 'Chocolate Models Magazine',
    bio: (row.bio as string) || undefined,
    createdAt: row.created_at as string,
  }
}

function roundToRow(r: Round) {
  return {
    id: r.id,
    name: r.name,
    date: r.date,
    notes: r.notes ?? null,
    created_at: r.createdAt,
  }
}

function rowToRound(row: Record<string, unknown>): Round {
  return {
    id: row.id as string,
    name: row.name as string,
    date: row.date as string,
    notes: (row.notes as string) || undefined,
    createdAt: row.created_at as string,
  }
}

function scorecardToRow(s: Scorecard) {
  return {
    id: s.id,
    model_id: s.modelId,
    round_id: s.roundId ?? null,
    date: s.date,
    scores: s.scores,
    total: s.total,
    comments: s.comments ?? null,
    clip_id: s.clipId ?? null,
    created_at: s.createdAt,
  }
}

function rowToScorecard(row: Record<string, unknown>): Scorecard {
  return {
    id: row.id as string,
    modelId: row.model_id as string,
    clipId: (row.clip_id as string) || undefined,
    roundId: (row.round_id as string) || undefined,
    date: row.date as string,
    scores: row.scores as Scorecard['scores'],
    total: row.total as number,
    comments: (row.comments as string) || undefined,
    createdAt: row.created_at as string,
  }
}

function clipToRow(c: Clip) {
  return {
    id: c.id,
    model_id: c.modelId,
    title: c.title,
    source: c.source,
    url: c.url ?? null,
    file_name: c.fileName ?? null,
    mime_type: c.mimeType ?? null,
    size: c.size ?? null,
    round_id: c.roundId ?? null,
    tags: c.tags,
    notes: c.notes ?? null,
    favorite: c.favorite,
    created_at: c.createdAt,
  }
}

function rowToClip(row: Record<string, unknown>): Clip {
  return {
    id: row.id as string,
    modelId: row.model_id as string,
    title: row.title as string,
    source: row.source as Clip['source'],
    url: (row.url as string) || undefined,
    fileName: (row.file_name as string) || undefined,
    mimeType: (row.mime_type as string) || undefined,
    size: (row.size as number) || undefined,
    roundId: (row.round_id as string) || undefined,
    tags: (row.tags as string[]) ?? [],
    notes: (row.notes as string) || undefined,
    favorite: row.favorite as boolean,
    createdAt: row.created_at as string,
  }
}

// ── Fetch all data ────────────────────────────────────────────────────────────

export async function fetchAllData(): Promise<Partial<AppData>> {
  const [modelsRes, roundsRes, scorecardsRes, clipsRes, settingsRes] = await Promise.all([
    supabase.from('boo_models').select('*').order('created_at'),
    supabase.from('boo_rounds').select('*').order('created_at'),
    supabase.from('boo_scorecards').select('*').order('created_at'),
    supabase.from('boo_clips').select('*').order('created_at'),
    supabase.from('boo_settings').select('*').limit(1).single(),
  ])

  const models = (modelsRes.data ?? []).map((r) => rowToModel(r as Record<string, unknown>))
  const rounds = (roundsRes.data ?? []).map((r) => rowToRound(r as Record<string, unknown>))
  const scorecards = (scorecardsRes.data ?? []).map((r) => rowToScorecard(r as Record<string, unknown>))
  const clips = (clipsRes.data ?? []).map((r) => rowToClip(r as Record<string, unknown>))

  const settingsRow = settingsRes.data as Record<string, unknown> | null
  const settings: Settings | undefined = settingsRow
    ? {
        theme: (settingsRow.theme as Settings['theme']) ?? 'dark',
        rankBy: (settingsRow.rank_by as Settings['rankBy']) ?? 'average',
        judgeName: (settingsRow.judge_name as string) ?? '',
      }
    : undefined

  return { models, rounds, scorecards, clips, settings }
}

// ── Model CRUD ────────────────────────────────────────────────────────────────

export async function upsertModel(m: Model) {
  await supabase.from('boo_models').upsert(modelToRow(m))
}

export async function deleteModelRemote(id: string) {
  await supabase.from('boo_models').delete().eq('id', id)
}

// ── Round CRUD ────────────────────────────────────────────────────────────────

export async function upsertRound(r: Round) {
  await supabase.from('boo_rounds').upsert(roundToRow(r))
}

export async function deleteRoundRemote(id: string) {
  await supabase.from('boo_rounds').delete().eq('id', id)
}

// ── Scorecard CRUD ────────────────────────────────────────────────────────────

export async function upsertScorecard(s: Scorecard) {
  await supabase.from('boo_scorecards').upsert(scorecardToRow(s))
}

export async function deleteScorecardRemote(id: string) {
  await supabase.from('boo_scorecards').delete().eq('id', id)
}

// ── Clip CRUD ─────────────────────────────────────────────────────────────────

export async function upsertClip(c: Clip) {
  await supabase.from('boo_clips').upsert(clipToRow(c))
}

export async function deleteClipRemote(id: string) {
  await supabase.from('boo_clips').delete().eq('id', id)
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function upsertSettings(s: Settings) {
  await supabase.from('boo_settings').upsert({ id: 1, theme: s.theme, rank_by: s.rankBy, judge_name: s.judgeName })
}

// ── Photo upload to Supabase Storage ─────────────────────────────────────────

export async function uploadModelPhoto(modelId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `models/${modelId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('bootyology').upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('bootyology').getPublicUrl(path)
  return data.publicUrl
}

// ── Clip file upload to Supabase Storage ─────────────────────────────────────

export async function uploadClipFile(clipId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'mp4'
  const path = `clips/${clipId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('bootyology').upload(path, file, { upsert: true })
  if (error) { console.error('Clip upload error:', error.message); return null }
  const { data } = supabase.storage.from('bootyology').getPublicUrl(path)
  return data.publicUrl
}
