import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listAssociationsUseCase,
  createAssociationUseCase,
  getAssociationSettingsUseCase,
  updateAssociationSettingsUseCase,
} from './use-cases'
import { gestionComptesRepository } from '../data/repository'
import * as emailService from './invitation-email-service'
import type { AuthenticatedUser } from '@/shared/lib/auth'

vi.mock('../data/repository', () => ({
  gestionComptesRepository: {
    listAssociations: vi.fn(),
    createAssociation: vi.fn(),
    getAssociationSettings: vi.fn(),
    updateAssociationSettings: vi.fn(),
  },
}))

vi.mock('./invitation-email-service', () => ({
  sendInvitationEmail: vi.fn(),
}))

const superadmin: AuthenticatedUser = { uid: 'sa-1', associationId: '', role: 'superadmin' }
const admin: AuthenticatedUser = { uid: 'u-1', associationId: 'asso-1', role: 'admin' }

describe('listAssociationsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'utilisateur n'est pas superadmin", async () => {
    const result = await listAssociationsUseCase(admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.listAssociations).not.toHaveBeenCalled()
  })

  it('délègue au repository pour un superadmin', async () => {
    vi.mocked(gestionComptesRepository.listAssociations).mockResolvedValue({ ok: true, value: [] })
    const result = await listAssociationsUseCase(superadmin)
    expect(result.ok).toBe(true)
    expect(gestionComptesRepository.listAssociations).toHaveBeenCalled()
  })

  it("propage l'erreur du repository", async () => {
    vi.mocked(gestionComptesRepository.listAssociations).mockResolvedValue({ ok: false, error: 'Firestore indisponible' })
    const result = await listAssociationsUseCase(superadmin)
    expect(result.ok).toBe(false)
  })
})

describe('createAssociationUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'utilisateur n'est pas superadmin", async () => {
    const result = await createAssociationUseCase({ name: 'Asso', adminEmail: 'a@b.com' }, admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.createAssociation).not.toHaveBeenCalled()
  })

  it("retourne une erreur si le nom est vide", async () => {
    const result = await createAssociationUseCase({ name: '   ', adminEmail: 'a@b.com' }, superadmin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.createAssociation).not.toHaveBeenCalled()
  })

  it("retourne une erreur si l'email est invalide", async () => {
    const result = await createAssociationUseCase({ name: 'Asso', adminEmail: 'pas-un-email' }, superadmin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.createAssociation).not.toHaveBeenCalled()
  })

  it("retourne ok et envoie l'email d'invitation pour des données valides", async () => {
    vi.mocked(gestionComptesRepository.createAssociation).mockResolvedValue({ ok: true, value: { resetLink: 'https://reset' } })
    vi.mocked(emailService.sendInvitationEmail).mockResolvedValue()
    const result = await createAssociationUseCase({ name: 'Asso', adminEmail: 'a@b.com' }, superadmin)
    expect(result.ok).toBe(true)
    expect(emailService.sendInvitationEmail).toHaveBeenCalledWith('a@b.com', 'Asso', 'https://reset')
  })

  it("retourne ok même si l'envoi d'email échoue (best-effort)", async () => {
    vi.mocked(gestionComptesRepository.createAssociation).mockResolvedValue({ ok: true, value: { resetLink: 'https://reset' } })
    vi.mocked(emailService.sendInvitationEmail).mockRejectedValue(new Error('timeout'))
    const result = await createAssociationUseCase({ name: 'Asso', adminEmail: 'a@b.com' }, superadmin)
    expect(result.ok).toBe(true)
  })

  it("propage l'erreur du repository", async () => {
    vi.mocked(gestionComptesRepository.createAssociation).mockResolvedValue({ ok: false, error: 'Impossible de créer.' })
    const result = await createAssociationUseCase({ name: 'Asso', adminEmail: 'a@b.com' }, superadmin)
    expect(result.ok).toBe(false)
    expect(emailService.sendInvitationEmail).not.toHaveBeenCalled()
  })
})

describe('getAssociationSettingsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'associationId est vide", async () => {
    const result = await getAssociationSettingsUseCase('', admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.getAssociationSettings).not.toHaveBeenCalled()
  })

  it("retourne une erreur si l'admin tente d'accéder à une autre association", async () => {
    const result = await getAssociationSettingsUseCase('autre-asso', admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.getAssociationSettings).not.toHaveBeenCalled()
  })

  it("autorise un superadmin à accéder à n'importe quelle association", async () => {
    vi.mocked(gestionComptesRepository.getAssociationSettings).mockResolvedValue({
      ok: true, value: { name: 'Asso', notificationEmails: [] },
    })
    const result = await getAssociationSettingsUseCase('autre-asso', superadmin)
    expect(result.ok).toBe(true)
    expect(gestionComptesRepository.getAssociationSettings).toHaveBeenCalledWith('autre-asso')
  })

  it('délègue au repository pour un admin accédant à sa propre association', async () => {
    vi.mocked(gestionComptesRepository.getAssociationSettings).mockResolvedValue({
      ok: true, value: { name: 'Asso', notificationEmails: [] },
    })
    await getAssociationSettingsUseCase('asso-1', admin)
    expect(gestionComptesRepository.getAssociationSettings).toHaveBeenCalledWith('asso-1')
  })
})

describe('updateAssociationSettingsUseCase', () => {
  const data = { name: 'Nouvelle asso', notificationEmails: ['a@b.com'] }

  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'associationId est vide", async () => {
    const result = await updateAssociationSettingsUseCase('', data, admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.updateAssociationSettings).not.toHaveBeenCalled()
  })

  it("retourne une erreur si l'admin tente de modifier une autre association", async () => {
    const result = await updateAssociationSettingsUseCase('autre-asso', data, admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.updateAssociationSettings).not.toHaveBeenCalled()
  })

  it("retourne une erreur si le nom est vide", async () => {
    const result = await updateAssociationSettingsUseCase('asso-1', { ...data, name: '' }, admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.updateAssociationSettings).not.toHaveBeenCalled()
  })

  it("autorise une liste d'emails vide (notifications désactivées)", async () => {
    vi.mocked(gestionComptesRepository.updateAssociationSettings).mockResolvedValue({ ok: true, value: undefined })
    const result = await updateAssociationSettingsUseCase('asso-1', { name: 'Asso', notificationEmails: [] }, admin)
    expect(result.ok).toBe(true)
    expect(gestionComptesRepository.updateAssociationSettings).toHaveBeenCalled()
  })

  it('délègue au repository pour des données valides', async () => {
    vi.mocked(gestionComptesRepository.updateAssociationSettings).mockResolvedValue({ ok: true, value: undefined })
    await updateAssociationSettingsUseCase('asso-1', data, admin)
    expect(gestionComptesRepository.updateAssociationSettings).toHaveBeenCalledWith('asso-1', data)
  })

  it("propage l'erreur du repository", async () => {
    vi.mocked(gestionComptesRepository.updateAssociationSettings).mockResolvedValue({ ok: false, error: 'Firestore indisponible' })
    const result = await updateAssociationSettingsUseCase('asso-1', data, admin)
    expect(result.ok).toBe(false)
  })
})
