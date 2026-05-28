import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listControlsUseCase, getControlDetailUseCase, getActiveExpiryAlertsUseCase, createCorrectionUseCase } from './use-cases'
import { controlesRepository } from '../data/repository'
import type { AuthenticatedUser } from '@/shared/lib/auth'
import type { CreateCorrectionInput } from './types'

vi.mock('../data/repository', () => ({
  controlesRepository: {
    listControls: vi.fn(),
    getControlDetail: vi.fn(),
    getActiveExpiryAlerts: vi.fn(),
    createCorrection: vi.fn(),
    getAlertThreshold: vi.fn(),
  },
}))

const mockUser: AuthenticatedUser = { uid: 'user-1', associationId: 'asso-1', role: 'admin' }

const mockInput: CreateCorrectionInput = {
  itemId: 'item-1',
  inventoryId: 'inv-1',
  associationId: 'asso-1',
  newExpiryDate: '2027-06-01',
  correctedBy: 'user-1',
}

function dateInDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

describe('listControlsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'associationId est vide", async () => {
    const result = await listControlsUseCase('')
    expect(result.ok).toBe(false)
    expect(controlesRepository.listControls).not.toHaveBeenCalled()
  })

  it("délègue au repository avec l'associationId", async () => {
    vi.mocked(controlesRepository.listControls).mockResolvedValue({ ok: true, value: [] })
    await listControlsUseCase('asso-1')
    expect(controlesRepository.listControls).toHaveBeenCalledWith('asso-1')
  })

  it("propage l'erreur du repository", async () => {
    vi.mocked(controlesRepository.listControls).mockResolvedValue({ ok: false, error: 'Firestore indisponible' })
    const result = await listControlsUseCase('asso-1')
    expect(result.ok).toBe(false)
  })
})

describe('getControlDetailUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si le controlId est vide", async () => {
    const result = await getControlDetailUseCase('', 'asso-1')
    expect(result.ok).toBe(false)
    expect(controlesRepository.getControlDetail).not.toHaveBeenCalled()
  })

  it("délègue au repository avec controlId et associationId", async () => {
    vi.mocked(controlesRepository.getControlDetail).mockResolvedValue({ ok: false, error: 'introuvable' })
    await getControlDetailUseCase('ctrl-1', 'asso-1')
    expect(controlesRepository.getControlDetail).toHaveBeenCalledWith('ctrl-1', 'asso-1')
  })
})

describe('getActiveExpiryAlertsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'associationId est vide", async () => {
    const result = await getActiveExpiryAlertsUseCase('')
    expect(result.ok).toBe(false)
    expect(controlesRepository.getActiveExpiryAlerts).not.toHaveBeenCalled()
  })
})

describe('createCorrectionUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(controlesRepository.getAlertThreshold).mockResolvedValue(30)
  })

  it("retourne une erreur si la date est vide", async () => {
    const result = await createCorrectionUseCase({ ...mockInput, newExpiryDate: '' }, mockUser)
    expect(result.ok).toBe(false)
    expect(controlesRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("retourne une erreur si la date est dans moins de 30 jours", async () => {
    const result = await createCorrectionUseCase({ ...mockInput, newExpiryDate: dateInDays(15) }, mockUser)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('J+30')
    expect(controlesRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("retourne une erreur si la date est exactement à J+30", async () => {
    const result = await createCorrectionUseCase({ ...mockInput, newExpiryDate: dateInDays(30) }, mockUser)
    expect(result.ok).toBe(false)
    expect(controlesRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("retourne une erreur si l'associationId ne correspond pas à l'utilisateur", async () => {
    const result = await createCorrectionUseCase({ ...mockInput, associationId: 'autre-asso' }, mockUser)
    expect(result.ok).toBe(false)
    expect(controlesRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("enregistre la correction si la date est > J+30 et l'association est correcte", async () => {
    vi.mocked(controlesRepository.createCorrection).mockResolvedValue({ ok: true, value: undefined })
    const result = await createCorrectionUseCase(mockInput, mockUser)
    expect(result.ok).toBe(true)
    expect(controlesRepository.createCorrection).toHaveBeenCalledWith(mockInput)
  })

  it("propage l'erreur du repository si la sauvegarde échoue", async () => {
    vi.mocked(controlesRepository.createCorrection).mockResolvedValue({ ok: false, error: 'Erreur Firestore' })
    const result = await createCorrectionUseCase(mockInput, mockUser)
    expect(result.ok).toBe(false)
  })
})
