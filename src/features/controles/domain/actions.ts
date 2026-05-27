'use server'

import { getAuthenticatedUser } from '@/shared/lib/auth'
import { createCorrectionUseCase } from './use-cases'

export async function createCorrectionAction(
  input: { itemId: string; inventoryId: string; newExpiryDate: string },
): Promise<{ error: string } | { ok: true }> {
  const user = await getAuthenticatedUser()
  if (!user) return { error: 'Non authentifié.' }

  const result = await createCorrectionUseCase(
    { itemId: input.itemId, inventoryId: input.inventoryId, associationId: user.associationId, newExpiryDate: input.newExpiryDate, correctedBy: user.uid },
    user,
  )
  if (!result.ok) return { error: result.error }
  return { ok: true }
}
