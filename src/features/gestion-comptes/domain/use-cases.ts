import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { AuthenticatedUser } from '@/shared/lib/auth'
import { gestionComptesRepository } from '../data/repository'
import { sendInvitationEmail } from './invitation-email-service'
import type { AssociationSummary, AssociationSettings, CreateAssociationInput, UpdateAssociationInput } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function listAssociationsUseCase(user: AuthenticatedUser): Promise<Result<AssociationSummary[]>> {
  if (user.role !== 'superadmin') return err('Accès non autorisé.')
  return gestionComptesRepository.listAssociations()
}

export async function createAssociationUseCase(input: CreateAssociationInput, user: AuthenticatedUser): Promise<Result<void>> {
  if (user.role !== 'superadmin') return err('Accès non autorisé.')
  if (!input.name.trim()) return err('Le nom de l\'association est obligatoire.')
  if (!EMAIL_RE.test(input.adminEmail)) return err('Email invalide.')
  const result = await gestionComptesRepository.createAssociation(input)
  if (!result.ok) return result
  // Best-effort — une erreur d'envoi ne bloque pas la création du compte
  try { await sendInvitationEmail(input.adminEmail, input.name, result.value.resetLink) } catch { /* ignored */ }
  return ok(undefined)
}

export async function getAssociationSettingsUseCase(associationId: string, user: AuthenticatedUser): Promise<Result<AssociationSettings>> {
  if (!associationId) return err('Association non identifiée.')
  if (user.role !== 'superadmin' && user.associationId !== associationId) return err('Accès non autorisé.')
  return gestionComptesRepository.getAssociationSettings(associationId)
}

export async function updateAssociationSettingsUseCase(associationId: string, data: UpdateAssociationInput, user: AuthenticatedUser): Promise<Result<void>> {
  if (!associationId) return err('Association non identifiée.')
  if (user.role !== 'superadmin' && user.associationId !== associationId) return err('Accès non autorisé.')
  if (!data.name.trim()) return err('Le nom de l\'association est obligatoire.')
  return gestionComptesRepository.updateAssociationSettings(associationId, data)
}
