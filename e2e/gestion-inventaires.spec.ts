/**
 * Tests E2E — Gestion des inventaires (backoffice).
 * Prérequis : seed appliqué (`npx tsx scripts/seed-dev.ts`) et serveur dev actif.
 * Auth bypass : DEV_ASSOCIATION_ID doit être défini dans .env.local.
 */
import { test, expect } from '@playwright/test'

const BASE = '/dashboard/inventaires'

test.describe('Liste des inventaires', () => {
  test('affiche la liste et le bouton de création', async ({ page }) => {
    await page.goto(BASE)

    await expect(page.getByTestId('inventory-list')).toBeVisible()
    await expect(page.getByTestId('btn-create-inventory')).toBeVisible()
  })

  test('affiche le Sac PS issu du seed', async ({ page }) => {
    await page.goto(BASE)

    await expect(page.getByText('Sac PS')).toBeVisible()
  })
})

test.describe("Création d'un inventaire", () => {
  // Règle spec : "Si le nom est vide → message d'erreur inline, pas de création."
  test('bloque la création si le nom est vide', async ({ page }) => {
    await page.goto(BASE)
    await page.getByTestId('btn-create-inventory').click()
    await page.getByTestId('btn-submit-create-inventory').click()

    await expect(page.getByRole('alert')).toBeVisible()
  })

  // Règle spec : "À la validation, l'admin est redirigé vers la page détail."
  test('crée un inventaire et redirige vers la page détail', async ({ page }) => {
    await page.goto(BASE)
    await page.getByTestId('btn-create-inventory').click()
    await page.getByTestId('input-inventory-name').fill('Véhicule de test E2E')
    await page.getByTestId('btn-submit-create-inventory').click()

    await expect(page.getByRole('heading', { name: 'Véhicule de test E2E' })).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard\/inventaires\/[a-zA-Z0-9]+$/)
  })
})

test.describe('Page détail — emplacements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE)
    await page.getByTestId('btn-create-inventory').click()
    await page.getByTestId('input-inventory-name').fill('Inventaire E2E')
    await page.getByTestId('btn-submit-create-inventory').click()
    await expect(page).toHaveURL(/\/dashboard\/inventaires\//)
  })

  // Règle spec : "Si aucun emplacement → message + bouton Ajouter."
  test("affiche l'état vide avec bouton d'ajout", async ({ page }) => {
    await expect(page.getByTestId('btn-add-compartment-empty')).toBeVisible()
  })

  // Règle spec : "Si le nom de l'emplacement est vide → erreur inline, pas de création."
  test("bloque l'ajout si le nom est vide", async ({ page }) => {
    await page.getByTestId('btn-add-compartment-empty').click()
    await page.getByTestId('btn-submit-new-compartment').click()

    // Le formulaire reste affiché (soumission bloquée)
    await expect(page.getByTestId('input-new-compartment-name')).toBeVisible()
  })

  test('ajoute un emplacement et affiche son nom dans la liste', async ({ page }) => {
    await page.getByTestId('btn-add-compartment-empty').click()
    await page.getByTestId('input-new-compartment-name').fill('Poche avant')
    await page.getByTestId('btn-submit-new-compartment').click()

    await expect(page.getByText('Poche avant')).toBeVisible()
  })
})

test.describe('Page détail — matériels', () => {
  // Règle spec : "Si le nom du matériel est vide → erreur inline, pas de création."
  test("bloque l'ajout de matériel si le nom est vide", async ({ page }) => {
    await page.goto(BASE)
    await page.getByTestId('btn-create-inventory').click()
    await page.getByTestId('input-inventory-name').fill('Sac matériel E2E')
    await page.getByTestId('btn-submit-create-inventory').click()

    await page.getByTestId('btn-add-compartment-empty').click()
    await page.getByTestId('input-new-compartment-name').fill('Poche')
    await page.getByTestId('btn-submit-new-compartment').click()

    await page.getByRole('button', { name: /ajouter un matériel/i }).click()
    await page.getByTestId('btn-submit-item-form').click()

    await expect(page.getByRole('alert')).toBeVisible()
  })
})

test.describe('Suppression avec confirmation', () => {
  // Règle spec : "Si la suppression est demandée → confirmation obligatoire."
  test("ouvre une dialog de confirmation avant de supprimer l'inventaire", async ({ page }) => {
    await page.goto(BASE)
    await page.getByTestId('btn-create-inventory').click()
    await page.getByTestId('input-inventory-name').fill('À supprimer E2E')
    await page.getByTestId('btn-submit-create-inventory').click()

    await page.getByTestId('btn-delete-inventory').click()

    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
