import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { classNames } from '../lib/util'
import { useStore } from '../lib/store'

export function Avatar({
  name,
  emoji,
  accent,
  size = 44,
  photoUrl,
}: {
  name: string
  emoji?: string
  accent: string
  size?: number
  photoUrl?: string
}) {
  if (photoUrl) {
    return (
      <div
        className="shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size, border: `2px solid ${accent}` }}
        title={name}
      >
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    )
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `radial-gradient(circle at 30% 25%, ${accent}33, ${accent}14)`,
        border: `2px solid ${accent}`,
        color: accent,
      }}
      title={name}
    >
      {emoji || name.slice(0, 1).toUpperCase()}
    </div>
  )
}

export function Badge({
  children,
  color,
  className,
}: {
  children: ReactNode
  color?: string
  className?: string
}) {
  return (
    <span
      className={classNames('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}
      style={color ? { background: `${color}22`, color, border: `1px solid ${color}55` } : undefined}
    >
      {children}
    </span>
  )
}

export function ProgressBar({
  value,
  color = 'var(--gold)',
  height = 8,
}: {
  value: number // 0..100
  color?: string
  height?: number
}) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-surface2" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  icon,
  accent = 'var(--gold)',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  accent?: string
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="stat-num mt-1">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: `${accent}1f`, color: accent }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface2 text-gold">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold text-content">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {action}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={classNames(
          'relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-card animate-slide-up sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
            <h2 className="font-display text-lg font-semibold text-content">{title}</h2>
            <button onClick={onClose} className="btn-quiet -mr-2 h-9 w-9 p-0" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-content sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/** Toast viewport — render once near the app root. */
export function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={classNames(
            'pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface p-3.5 shadow-card animate-toast-in',
            t.tone === 'celebrate' ? 'border-gold/60' : 'border-line',
          )}
        >
          <span className="text-xl leading-none">{t.icon ?? (t.tone === 'celebrate' ? '🎉' : '✅')}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-content">{t.title}</p>
            {t.message && <p className="mt-0.5 text-xs text-muted">{t.message}</p>}
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-muted hover:text-content" aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
