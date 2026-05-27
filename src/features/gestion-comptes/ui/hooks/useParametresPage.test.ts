import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useParametresPage } from './useParametresPage'
import { updateAssociationSettingsAction } from '../../domain/actions'

vi.mock('../../domain/actions', () => ({
  updateAssociationSettingsAction: vi.fn(),
}))

const initial = { name: 'Mon asso', notificationEmails: ['resp@asso.fr'] }

describe('useParametresPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it("affiche une erreur si l'email ajouté est invalide", () => {
    const { result } = renderHook(() => useParametresPage(initial))
    act(() => result.current.setNewEmail('pas-un-email'))
    act(() => result.current.addEmail())
    expect(result.current.emailError).toBeDefined()
    expect(result.current.emails).toEqual(initial.notificationEmails)
  })

  it("affiche une erreur si l'email est déjà dans la liste", () => {
    const { result } = renderHook(() => useParametresPage(initial))
    act(() => result.current.setNewEmail('resp@asso.fr'))
    act(() => result.current.addEmail())
    expect(result.current.emailError).toBeDefined()
    expect(result.current.emails).toHaveLength(1)
  })

  it("ajoute un email valide et réinitialise le flag de succès", () => {
    const { result } = renderHook(() => useParametresPage(initial))
    act(() => result.current.setNewEmail('nouveau@asso.fr'))
    act(() => result.current.addEmail())
    expect(result.current.emails).toContain('nouveau@asso.fr')
    expect(result.current.newEmail).toBe('')
    expect(result.current.emailError).toBeUndefined()
    expect(result.current.success).toBe(false)
  })

  it("retire un email et réinitialise le flag de succès", () => {
    const { result } = renderHook(() => useParametresPage(initial))
    act(() => result.current.removeEmail('resp@asso.fr'))
    expect(result.current.emails).toEqual([])
    expect(result.current.success).toBe(false)
  })

  it("autorise une liste d'emails vide après suppression", () => {
    const { result } = renderHook(() => useParametresPage(initial))
    act(() => result.current.removeEmail('resp@asso.fr'))
    expect(result.current.emails).toHaveLength(0)
  })

  it("appelle l'action avec le nom et les emails courants lors de la sauvegarde", async () => {
    vi.mocked(updateAssociationSettingsAction).mockResolvedValue({ ok: true })
    const { result } = renderHook(() => useParametresPage(initial))
    await act(async () => result.current.handleSave())
    expect(updateAssociationSettingsAction).toHaveBeenCalledWith({
      name: 'Mon asso',
      notificationEmails: ['resp@asso.fr'],
    })
  })

  it("définit success à true après une sauvegarde réussie", async () => {
    vi.mocked(updateAssociationSettingsAction).mockResolvedValue({ ok: true })
    const { result } = renderHook(() => useParametresPage(initial))
    await act(async () => result.current.handleSave())
    expect(result.current.success).toBe(true)
    expect(result.current.error).toBeUndefined()
  })

  it("affiche un message d'erreur si la sauvegarde échoue et conserve les modifications", async () => {
    vi.mocked(updateAssociationSettingsAction).mockResolvedValue({ error: 'Erreur réseau' })
    const { result } = renderHook(() => useParametresPage(initial))
    act(() => result.current.setNewEmail('extra@asso.fr'))
    act(() => result.current.addEmail())
    await act(async () => result.current.handleSave())
    expect(result.current.error).toBe('Erreur réseau')
    expect(result.current.success).toBe(false)
    expect(result.current.emails).toContain('extra@asso.fr')
  })
})
