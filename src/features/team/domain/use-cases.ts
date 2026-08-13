import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { AuthenticatedUser } from '@/shared/lib/auth'
import { teamRepository } from '../data/repository'
import { sendInvitationEmail } from '@/shared/lib/admin-email-service'
import type { AdminAccountView, AssociationSummary } from './types'

export async function listAdminAccountsUseCase(associationId: string, user: AuthenticatedUser): Promise<Result<AdminAccountView[]>> {
  if (user.associationId !== associationId && user.role !== 'superadmin') return err('Accès non autorisé.')
  const result = await teamRepository.listAdminAccounts(associationId)
  if (!result.ok) return result
  return ok(result.value.map((a) => ({ email: a.email, createdAt: a.createdAt, isCurrentUser: a.uid === user.uid })))
}

export async function inviteAdminUseCase(email: string, user: AuthenticatedUser, loginUrl?: string): Promise<Result<void>> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Email invalide.')
  const accountsResult = await teamRepository.listAdminAccounts(user.associationId)
  if (accountsResult.ok && accountsResult.value.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    return err('Ce compte est déjà admin de cette association.')
  }
  const result = await teamRepository.createAdminAccount(email, user.associationId)
  if (!result.ok) return result
  const assocName = await teamRepository.getAssociationName(user.associationId)
  if (result.value.resetLink) {
    try { await sendInvitationEmail(email, assocName, result.value.resetLink, loginUrl) } catch { /* best-effort */ }
  }
  return ok(undefined)
}

export async function removeAdminUseCase(targetEmail: string, user: AuthenticatedUser): Promise<Result<void>> {
  const accountsResult = await teamRepository.listAdminAccounts(user.associationId)
  if (!accountsResult.ok) return accountsResult
  const target = accountsResult.value.find((a) => a.email.toLowerCase() === targetEmail.toLowerCase())
  if (!target) return err('Compte introuvable dans cette association.')
  if (target.uid === user.uid) return err('Vous ne pouvez pas supprimer votre propre compte.')
  if (accountsResult.value.length <= 1) return err('Impossible de supprimer le seul compte admin.')
  return teamRepository.removeAdminAccount(target.uid, user.associationId)
}

export async function listUserAssociationsUseCase(user: AuthenticatedUser): Promise<Result<AssociationSummary[]>> {
  if (user.role !== 'admin' || user.associationIds.length === 0) return err('Accès non autorisé.')
  const associations = await teamRepository.getAssociationNames(user.associationIds)
  return ok(associations)
}
