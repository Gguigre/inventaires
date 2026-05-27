import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CorrectionModal } from './CorrectionModal'

const defaultProps = {
  isOpen: true,
  itemName: 'SHA 100ml',
  currentExpiryDate: '01/05/2026',
  dateValue: '',
  isSubmitting: false,
  onDateChange: vi.fn(),
  onConfirm: vi.fn(),
  onClose: vi.fn(),
}

describe('CorrectionModal', () => {
  it("ne rend rien si isOpen est false", () => {
    const { container } = render(<CorrectionModal {...defaultProps} isOpen={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("affiche 'Réessayer' au lieu de 'Confirmer' quand une erreur serveur est présente", () => {
    render(<CorrectionModal {...defaultProps} error="Erreur réseau" />)
    expect(screen.getByTestId('btn-confirm-correction')).toHaveTextContent('Réessayer')
  })

  it("affiche 'Confirmer' quand il n'y a pas d'erreur", () => {
    render(<CorrectionModal {...defaultProps} />)
    expect(screen.getByTestId('btn-confirm-correction')).toHaveTextContent('Confirmer')
  })

  it("désactive le bouton Confirmer pendant la soumission", () => {
    render(<CorrectionModal {...defaultProps} isSubmitting={true} />)
    expect(screen.getByTestId('btn-confirm-correction')).toBeDisabled()
  })

  it("désactive le bouton Annuler pendant la soumission", () => {
    render(<CorrectionModal {...defaultProps} isSubmitting={true} />)
    expect(screen.getByText('Annuler')).toBeDisabled()
  })

  it("affiche le message d'erreur de validation de date", () => {
    render(<CorrectionModal {...defaultProps} dateError="Cette date ne résout pas l'alerte (doit être > J+30)." />)
    expect(screen.getByRole('alert')).toHaveTextContent('J+30')
  })

  it("appelle onConfirm au clic sur Confirmer", async () => {
    const onConfirm = vi.fn()
    render(<CorrectionModal {...defaultProps} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByTestId('btn-confirm-correction'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it("appelle onClose au clic sur le bouton Fermer", async () => {
    const onClose = vi.fn()
    render(<CorrectionModal {...defaultProps} onClose={onClose} />)
    await userEvent.click(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalled()
  })
})
