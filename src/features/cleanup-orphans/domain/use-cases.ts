import { cleanupOrphans } from '../data/repository'
import type { Result } from '@/shared/domain/result'
import type { CleanupReport } from './types'

export async function cleanupOrphansUseCase(): Promise<Result<CleanupReport>> {
  return cleanupOrphans()
}
