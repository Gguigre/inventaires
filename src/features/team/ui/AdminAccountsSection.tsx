'use client'

import type { AdminAccountView } from '../domain/types'
import { useAdminAccounts } from './hooks/useAdminAccounts'
import { InviteAdminForm } from './InviteAdminForm'

interface AdminAccountsSectionProps {
  initialAccounts: AdminAccountView[]
}

export function AdminAccountsSection({ initialAccounts }: AdminAccountsSectionProps) {
  const {
    accounts, showInvite, inviteEmail, setInviteEmail, isInviting, inviteError, inviteSuccess,
    removingEmail, removeError,
    handleInvite, handleRemove, openInvite, cancelInvite,
  } = useAdminAccounts(initialAccounts)

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Comptes administrateurs</h2>

      <ul className="space-y-2 mb-4">
        {accounts.map((account) => (
          <li key={account.email} className="flex items-center justify-between gap-3 py-1.5">
            <div className="min-w-0">
              <p className="text-sm text-slate-800 truncate">{account.email}</p>
              {account.createdAt && (
                <p className="text-xs text-slate-400">
                  Créé le {account.createdAt.toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
            {!account.isCurrentUser && (
              <button
                type="button"
                data-testid={`btn-remove-admin-${account.email}`}
                onClick={() => handleRemove(account.email)}
                disabled={removingEmail === account.email}
                className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 flex-shrink-0"
                aria-label={`Supprimer le compte ${account.email}`}
              >
                {removingEmail === account.email ? 'Suppression…' : 'Supprimer'}
              </button>
            )}
          </li>
        ))}
      </ul>

      {removeError && <p role="alert" className="text-xs text-red-600 mb-3">{removeError}</p>}

      {showInvite ? (
        <InviteAdminForm
          email={inviteEmail}
          isSubmitting={isInviting}
          error={inviteError}
          onEmailChange={setInviteEmail}
          onSubmit={handleInvite}
          onCancel={cancelInvite}
        />
      ) : (
        <button
          type="button"
          data-testid="btn-open-invite"
          onClick={openInvite}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          + Inviter un administrateur
        </button>
      )}

      {inviteSuccess && (
        <p className="mt-2 text-xs text-green-600">Invitation envoyée.</p>
      )}
    </section>
  )
}
