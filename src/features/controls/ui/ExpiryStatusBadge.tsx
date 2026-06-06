type ExpiryStatus = 'expired' | 'at-risk' | 'ok' | 'fixed'

interface ExpiryStatusBadgeProps {
  status: ExpiryStatus
}

const CONFIG: Record<ExpiryStatus, { label: string; className: string }> = {
  expired: { label: 'Périmé',        className: 'bg-red-100 text-red-700 border-red-200' },
  'at-risk': { label: 'Bientôt périmé', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  ok:      { label: 'OK',           className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  fixed:   { label: 'Corrigé',      className: 'bg-blue-100 text-blue-700 border-blue-200' },
}

export function ExpiryStatusBadge({ status }: ExpiryStatusBadgeProps) {
  const { label, className } = CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
      {label}
    </span>
  )
}
