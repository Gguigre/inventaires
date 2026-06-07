import { controlsRepository } from '../data/repository'
import { getActiveAlerts } from '@/shared/data/alerts-repository'
import type { Result } from '@/shared/domain/result'
import { err } from '@/shared/domain/result'
import type { ControlSummary, ControlDetail, ActiveAlertsReport, CreateCorrectionInput, CreateAnomalyCorrectionInput } from './types'
import type { AuthenticatedUser } from '@/shared/lib/auth'

export async function listControlsUseCase(associationId: string): Promise<Result<ControlSummary[]>> {
  if (!associationId) return err('Association non identifiée.')
  return controlsRepository.listControls(associationId)
}

export async function getControlDetailUseCase(controlId: string, associationId: string): Promise<Result<ControlDetail>> {
  if (!controlId) return err('Identifiant de contrôle manquant.')
  return controlsRepository.getControlDetail(controlId, associationId)
}

export async function getActiveAlertsUseCase(associationId: string, thresholdDays?: number): Promise<Result<ActiveAlertsReport>> {
  if (!associationId) return err('Association non identifiée.')
  return getActiveAlerts(associationId, thresholdDays)
}

export async function getAlertThresholdUseCase(associationId: string): Promise<number> {
  return controlsRepository.getAlertThreshold(associationId)
}

export async function createAnomalyCorrectionUseCase(
  input: CreateAnomalyCorrectionInput,
  user: AuthenticatedUser,
): Promise<Result<void>> {
  if (input.associationId !== user.associationId) return err('Non autorisé.')
  const owns = await controlsRepository.verifyInventoryOwnership(input.inventoryId, input.associationId)
  if (!owns) return err('Non autorisé.')
  return controlsRepository.createAnomalyCorrection(input)
}

export async function createCorrectionUseCase(
  input: CreateCorrectionInput,
  user: AuthenticatedUser,
): Promise<Result<void>> {
  if (!input.newExpiryDate) return err('La date est obligatoire.')
  if (input.associationId !== user.associationId) return err('Non autorisé.')
  const thresholdDays = await controlsRepository.getAlertThreshold(input.associationId)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + thresholdDays)
  if (new Date(input.newExpiryDate) <= cutoff) return err(`Cette date ne résout pas l'alerte (doit être > J+${thresholdDays}).`)
  return controlsRepository.createCorrection(input)
}
