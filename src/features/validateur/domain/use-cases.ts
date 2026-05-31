import type { Result } from '@/shared/domain/result'
import { err } from '@/shared/domain/result'
import { validatorRepository, type LoadInventoryResult } from '../data/repository'
import type { ControlSubmission, FeedbackSubmission } from './types'

export async function loadInventoryUseCase(
  inventoryId: string,
): Promise<Result<LoadInventoryResult>> {
  if (!inventoryId.trim()) return err('Identifiant d\'inventaire manquant.')
  return validatorRepository.loadInventory(inventoryId)
}

export async function submitFeedbackUseCase(submission: FeedbackSubmission): Promise<Result<void>> {
  if (submission.rating < 1 || submission.rating > 5) return err('Note invalide.')
  if (submission.rating < 5 && !submission.comment.trim()) return err('Un commentaire est requis.')
  return validatorRepository.saveFeedback(submission)
}

export async function submitControlUseCase(
  submission: ControlSubmission,
  associationId: string,
): Promise<Result<{ controlId: string }>> {
  if (!submission.verifierName.trim()) return err('Le nom du vérificateur est obligatoire.')
  if (submission.results.length === 0) return err('Le contrôle ne contient aucun résultat.')
  return validatorRepository.saveControl(submission, associationId)
}
