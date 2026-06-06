'use server'

import type { Result } from '@/shared/domain/result'
import { submitControlUseCase, submitFeedbackUseCase } from './use-cases'
import { sendControlCompletedEmail } from './email-service'
import { validatorRepository } from '../data/repository'
import type { ControlEmailContext, ControlSubmission, FeedbackSubmission } from './types'

export async function submitControlAction(
  submission: ControlSubmission,
  emailContext: ControlEmailContext,
): Promise<Result<{ controlId: string }>> {
  // Fetch associationId first so it can be stored in the control document
  const assocResult = await validatorRepository.getInventoryAssociationId(submission.inventoryId)
  const associationId = assocResult.ok ? assocResult.value : ''

  const result = await submitControlUseCase(submission, associationId)
  if (!result.ok) return result

  // Non-blocking: email failure does not fail the control
  if (associationId) {
    const assocEmailResult = await validatorRepository.getAssociationEmails(associationId)
    if (assocEmailResult.ok) {
      await sendControlCompletedEmail(
        emailContext,
        submission.verifierName,
        submission.results.length,
        assocEmailResult.value.emails,
        assocEmailResult.value.name,
        new Date().toLocaleDateString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
        assocEmailResult.value.alertThresholdDays,
      )
    }
  }

  return result
}

export async function submitFeedbackAction(submission: FeedbackSubmission): Promise<Result<void>> {
  return submitFeedbackUseCase(submission)
}
