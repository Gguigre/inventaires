import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listAssociationsUseCase,
  createAssociationUseCase,
  getAssociationSettingsUseCase,
  updateAssociationSettingsUseCase,
  listAdminAccountsUseCase,
  inviteAdminUseCase,
  removeAdminUseCase,
  sendPasswordResetUseCase,
} from './use-cases'
import { gestionComptesRepository } from '../data/repository'
import * as emailService from './invitation-email-service'
import type { AuthenticatedUser } from '@/shared/lib/auth'
import type { AdminAccount } from './types'

vi.mock('../data/repository', () => ({
  gestionComptesRepository: {
    listAssociations: vi.fn(),
    createAssociation: vi.fn(),
    getAssociationSettings: vi.fn(),
    updateAssociationSettings: vi.fn(),
    listAdminAccounts: vi.fn(),
    createAdminAccount: vi.fn(),
    removeAdminAccount: vi.fn(),
    generatePasswordReset: vi.fn(),
  },
}))

vi.mock('./invitation-email-service', () => ({
  sendInvitationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
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

const twoAccounts: AdminAccount[] = [
  { uid: 'u-1', email: 'admin1@b.com', createdAt: null },
  { uid: 'u-2', email: 'admin2@b.com', createdAt: null },
]

describe('listAdminAccountsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si un admin tente d'accéder à une autre association", async () => {
    const result = await listAdminAccountsUseCase('autre-asso', admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.listAdminAccounts).not.toHaveBeenCalled()
  })

  it("autorise un superadmin à accéder à n'importe quelle association", async () => {
    vi.mocked(gestionComptesRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: [] })
    const result = await listAdminAccountsUseCase('autre-asso', superadmin)
    expect(result.ok).toBe(true)
    expect(gestionComptesRepository.listAdminAccounts).toHaveBeenCalledWith('autre-asso')
  })

  it('délègue au repository pour un admin accédant à sa propre association', async () => {
    vi.mocked(gestionComptesRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: twoAccounts })
    const result = await listAdminAccountsUseCase('asso-1', admin)
    expect(result.ok).toBe(true)
    expect(gestionComptesRepository.listAdminAccounts).toHaveBeenCalledWith('asso-1')
  })
})

describe('inviteAdminUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'email est invalide", async () => {
    const result = await inviteAdminUseCase('pas-un-email', admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.createAdminAccount).not.toHaveBeenCalled()
  })

  it('retourne une erreur si le compte est déjà admin de cette association', async () => {
    vi.mocked(gestionComptesRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: twoAccounts })
    const result = await inviteAdminUseCase('admin1@b.com', admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.createAdminAccount).not.toHaveBeenCalled()
  })

  it("propage l'erreur du repository si la création échoue", async () => {
    vi.mocked(gestionComptesRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: [] })
    vi.mocked(gestionComptesRepository.createAdminAccount).mockResolvedValue({ ok: false, error: 'Un compte existe déjà avec cet email.' })
    const result = await inviteAdminUseCase('nouveau@b.com', admin)
    expect(result.ok).toBe(false)
    expect(emailService.sendInvitationEmail).not.toHaveBeenCalled()
  })

  it("envoie l'email d'invitation pour des données valides", async () => {
    vi.mocked(gestionComptesRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: [] })
    vi.mocked(gestionComptesRepository.createAdminAccount).mockResolvedValue({ ok: true, value: { resetLink: 'https://reset' } })
    vi.mocked(gestionComptesRepository.getAssociationSettings).mockResolvedValue({ ok: true, value: { name: 'Mon Asso', notificationEmails: [] } })
    vi.mocked(emailService.sendInvitationEmail).mockResolvedValue()
    const result = await inviteAdminUseCase('nouveau@b.com', admin)
    expect(result.ok).toBe(true)
    expect(emailService.sendInvitationEmail).toHaveBeenCalledWith('nouveau@b.com', 'Mon Asso', 'https://reset')
  })

  it("retourne ok même si l'envoi d'email échoue (best-effort)", async () => {
    vi.mocked(gestionComptesRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: [] })
    vi.mocked(gestionComptesRepository.createAdminAccount).mockResolvedValue({ ok: true, value: { resetLink: 'https://reset' } })
    vi.mocked(gestionComptesRepository.getAssociationSettings).mockResolvedValue({ ok: true, value: { name: 'Mon Asso', notificationEmails: [] } })
    vi.mocked(emailService.sendInvitationEmail).mockRejectedValue(new Error('timeout'))
    const result = await inviteAdminUseCase('nouveau@b.com', admin)
    expect(result.ok).toBe(true)
  })
})

describe('removeAdminUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retourne une erreur si on tente de supprimer son propre compte', async () => {
    const result = await removeAdminUseCase('u-1', admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.listAdminAccounts).not.toHaveBeenCalled()
  })

  it("retourne une erreur si c'est le seul compte admin", async () => {
    vi.mocked(gestionComptesRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: [twoAccounts[0]] })
    const result = await removeAdminUseCase('u-2', admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.removeAdminAccount).not.toHaveBeenCalled()
  })

  it("retourne une erreur si le compte n'appartient pas à cette association", async () => {
    vi.mocked(gestionComptesRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: twoAccounts })
    const result = await removeAdminUseCase('u-inconnu', admin)
    expect(result.ok).toBe(false)
    expect(gestionComptesRepository.removeAdminAccount).not.toHaveBeenCalled()
  })

  it('supprime le compte si toutes les conditions sont réunies', async () => {
    vi.mocked(gestionComptesRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: twoAccounts })
    vi.mocked(gestionComptesRepository.removeAdminAccount).mockResolvedValue({ ok: true, value: undefined })
    const result = await removeAdminUseCase('u-2', admin)
    expect(result.ok).toBe(true)
    expect(gestionComptesRepository.removeAdminAccount).toHaveBeenCalledWith('u-2')
  })
})

describe('sendPasswordResetUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si la génération du lien échoue", async () => {
    vi.mocked(gestionComptesRepository.generatePasswordReset).mockResolvedValue({ ok: false, error: 'Compte introuvable.' })
    vi.mocked(gestionComptesRepository.getAssociationSettings).mockResolvedValue({ ok: true, value: { name: 'Mon Asso', notificationEmails: [] } })
    const result = await sendPasswordResetUseCase(admin)
    expect(result.ok).toBe(false)
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it("envoie l'email de reset pour un utilisateur valide", async () => {
    vi.mocked(gestionComptesRepository.generatePasswordReset).mockResolvedValue({ ok: true, value: { email: 'u@b.com', resetLink: 'https://reset' } })
    vi.mocked(gestionComptesRepository.getAssociationSettings).mockResolvedValue({ ok: true, value: { name: 'Mon Asso', notificationEmails: [] } })
    vi.mocked(emailService.sendPasswordResetEmail).mockResolvedValue()
    const result = await sendPasswordResetUseCase(admin)
    expect(result.ok).toBe(true)
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith('u@b.com', 'Mon Asso', 'https://reset')
  })

  it("retourne ok même si l'envoi d'email échoue (best-effort)", async () => {
    vi.mocked(gestionComptesRepository.generatePasswordReset).mockResolvedValue({ ok: true, value: { email: 'u@b.com', resetLink: 'https://reset' } })
    vi.mocked(gestionComptesRepository.getAssociationSettings).mockResolvedValue({ ok: true, value: { name: 'Mon Asso', notificationEmails: [] } })
    vi.mocked(emailService.sendPasswordResetEmail).mockRejectedValue(new Error('timeout'))
    const result = await sendPasswordResetUseCase(admin)
    expect(result.ok).toBe(true)
  })
})
