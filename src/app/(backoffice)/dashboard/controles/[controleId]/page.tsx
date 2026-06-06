import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { getControlDetailUseCase } from '@/features/controls/domain/use-cases'
import { ControlDetailPage } from '@/features/controls/ui/ControlDetailPage'

interface Props {
  params: Promise<{ controleId: string }>
}

export default async function ControlDetailRoute({ params }: Props) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const { controleId } = await params
  const result = await getControlDetailUseCase(controleId, user.associationId)

  if (!result.ok) notFound()

  return <ControlDetailPage control={result.value} />
}
