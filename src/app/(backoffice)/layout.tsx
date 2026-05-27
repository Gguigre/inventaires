import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { leaveAssociationAction } from '@/features/gestion-comptes/domain/actions'

export default async function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser()
  const isSuperadminOnly = user?.role === 'superadmin' && !user?.associationId
  const isActingAsAdmin = user?.role === 'superadmin' && !!user?.associationId

  async function signOut() {
    'use server'
    const cookieStore = await cookies()
    cookieStore.delete('session')
    cookieStore.delete('acting-as')
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {isSuperadminOnly ? (
              <Link
                href="/admin"
                className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
              >
                Administration
              </Link>
            ) : (
              <>
                <Link
                  href="/dashboard/inventaires"
                  className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  Secourisme — Matériel
                </Link>
                <Link
                  href="/dashboard/controles"
                  className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                  Contrôles
                </Link>
                <Link
                  href="/dashboard/parametres"
                  className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                  Paramètres
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isActingAsAdmin && (
              <form action={leaveAssociationAction}>
                <button
                  type="submit"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  ← Admin
                </button>
              </form>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
