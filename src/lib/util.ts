export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const ACCENTS = [
  '#e3bc63',
  '#d98a8a',
  '#c98ad9',
  '#8ab6d9',
  '#8ad9b0',
  '#d9b08a',
  '#b08ad9',
  '#d98aae',
]
export function randomAccent(): string {
  return ACCENTS[Math.floor(Math.random() * ACCENTS.length)]
}
export { ACCENTS }
