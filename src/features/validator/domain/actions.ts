'use server'

import type { Result } from '@/shared/domain/result'
import { submitControlUseCase, submitFeedbackUseCase } from './use-cases'
import type { ControlEmailContext, ControlSubmission, FeedbackSubmission } from './types'

export async function submitControlAction(
  submission: ControlSubmission,
  emailContext: ControlEmailContext,
): Promise<Result<{ controlId: string }>> {
  return submitControlUseCase(submission, emailContext)
}

export async function submitFeedbackAction(submission: FeedbackSubmission): Promise<Result<void>> {
  return submitFeedbackUseCase(submission)
}
