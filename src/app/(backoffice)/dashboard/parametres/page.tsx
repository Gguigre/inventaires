import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { getAssociationSettingsUseCase } from '@/features/gestion-comptes/domain/use-cases'
import { ParametresPage } from '@/features/gestion-comptes/ui/ParametresPage'

export default async function ParametresRoute() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  if (user.role === 'superadmin' && !user.associationId) redirect('/admin')

  const result = await getAssociationSettingsUseCase(user.associationId, user)
  if (!result.ok) return <p className="text-red-600 p-8">{result.error}</p>

  return <ParametresPage settings={result.value} />
}
