// Dépasse 100 lignes : rendu JSX de la hiérarchie emplacements × matériels × résultats.
import Link from 'next/link'
import type { ControlDetail } from '../domain/types'
import { ExpiryStatusBadge } from './ExpiryStatusBadge'
import { formatDate, formatDateTime } from '@/shared/lib/format'

interface ControlDetailPageProps {
  control: ControlDetail
}

export function ControlDetailPage({ control }: ControlDetailPageProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/controles" className="text-slate-400 hover:text-slate-600 transition-colors text-lg" aria-label="Retour aux contrôles">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{control.inventoryName}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {control.verifierName} · {formatDateTime(control.submittedAt)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {control.compartments.map((compartment) => (
          <div key={compartment.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{compartment.name}</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {compartment.results.map((result) => (
                <li key={result.itemId} className="px-4 py-3 flex items-start gap-3">
                  <span className={`mt-0.5 text-sm font-bold flex-shrink-0 ${result.status === 'anomaly' ? 'text-amber-500' : 'text-emerald-600'}`} aria-hidden="true">
                    {result.status === 'anomaly' ? '⚠' : '✓'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-900">{result.itemName}</p>
                      {result.currentExpiryStatus && (
                        <ExpiryStatusBadge status={result.currentExpiryStatus} />
                      )}
                    </div>
                    {result.comment && (
                      <p className="text-sm text-amber-700 mt-0.5">{result.comment}</p>
                    )}
                    {result.expiryDate && (
                      <p className="text-xs text-slate-400 mt-0.5">Péremption saisie : {formatDate(result.expiryDate)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
