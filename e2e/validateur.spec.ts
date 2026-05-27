/**
 * Tests E2E du parcours validateur.
 * Prérequis : seed appliqué (`npx tsx scripts/seed-dev.ts`) et serveur dev actif.
 * Inventaire de test : inv-e2e (Sac E2E)
 *   emp-e2e-1 "Poche avant" : mat-e2e-1 "SHA 100ml" (isCritical), mat-e2e-2 "Gants"
 *   emp-e2e-2 "Poche arrière" : mat-e2e-3 "Brancard"
 */
import { test, expect } from '@playwright/test'

const URL = '/inventaire/inv-e2e'

test.describe("Écran d'accueil", () => {
  test("affiche le nom de l'inventaire et le bouton de démarrage", async ({ page }) => {
    await page.goto(URL)

    await expect(page.getByText('Sac E2E')).toBeVisible()
    await expect(page.getByRole('button', { name: /commencer/i })).toBeVisible()
  })

  test("affiche le nombre d'emplacements et de matériels", async ({ page }) => {
    await page.goto(URL)

    await expect(page.getByText(/2\s*emplacements/i)).toBeVisible()
    await expect(page.getByText(/3\s*matériels/i)).toBeVisible()
  })
})

test.describe('Parcours complet sans anomalie', () => {
  test("valide tous les matériels et atteint l'écran de récapitulatif", async ({ page }) => {
    await page.goto(URL)
    await page.getByRole('button', { name: /commencer/i }).click()

    // mat-e2e-1 : SHA 100ml (isCritical) — date obligatoire
    await page.getByTestId('input-expiry-date').fill('2026-12-31')
    await page.getByTestId('btn-present').click()

    // mat-e2e-2 : Gants
    await page.getByTestId('btn-present').click()

    // mat-e2e-3 : Brancard
    await page.getByTestId('btn-present').click()

    await expect(page.getByText(/récapitulatif/i)).toBeVisible()
  })

  test("soumet le contrôle et affiche la confirmation", async ({ page }) => {
    await page.goto(URL)
    await page.getByRole('button', { name: /commencer/i }).click()

    await page.getByTestId('input-expiry-date').fill('2026-12-31')
    await page.getByTestId('btn-present').click()
    await page.getByTestId('btn-present').click()
    await page.getByTestId('btn-present').click()

    await page.getByTestId('input-verifier-name').fill('Jean Dupont')
    await page.getByTestId('btn-submit').click()

    await expect(page.getByText(/contrôle enregistré/i)).toBeVisible()
  })
})

test.describe("Signalement d'anomalie", () => {
  test("ouvre la modale au clic sur Anomalie", async ({ page }) => {
    await page.goto(URL)
    await page.getByRole('button', { name: /commencer/i }).click()

    // mat-e2e-1 est critique — renseigner la date d'abord
    await page.getByTestId('input-expiry-date').fill('2026-12-31')
    await page.getByTestId('btn-anomaly').click()

    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test("bloque la confirmation si le commentaire est vide", async ({ page }) => {
    await page.goto(URL)
    await page.getByRole('button', { name: /commencer/i }).click()

    await page.getByTestId('input-expiry-date').fill('2026-12-31')
    await page.getByTestId('btn-anomaly').click()
    await page.getByTestId('btn-confirm-anomaly').click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test("confirme l'anomalie avec commentaire et passe au matériel suivant", async ({ page }) => {
    await page.goto(URL)
    await page.getByRole('button', { name: /commencer/i }).click()

    await page.getByTestId('input-expiry-date').fill('2026-12-31')
    await page.getByTestId('btn-anomaly').click()
    await page.getByTestId('textarea-anomaly').fill('Batterie déchargée')
    await page.getByTestId('btn-confirm-anomaly').click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText('Gants')).toBeVisible()
  })
})

test.describe('Règles métier — matériel critique', () => {
  test("bloque la décision si la date de péremption est absente", async ({ page }) => {
    await page.goto(URL)
    await page.getByRole('button', { name: /commencer/i }).click()

    await page.getByTestId('btn-present').click()

    await expect(page.getByRole('alert')).toBeVisible()
  })

  test("débloque la décision après saisie de la date", async ({ page }) => {
    await page.goto(URL)
    await page.getByRole('button', { name: /commencer/i }).click()

    await page.getByTestId('btn-present').click()
    await expect(page.getByRole('alert')).toBeVisible()

    await page.getByTestId('input-expiry-date').fill('2026-12-31')
    await page.getByTestId('btn-present').click()

    await expect(page.getByRole('alert')).not.toBeVisible()
    await expect(page.getByText('Gants')).toBeVisible()
  })
})

test.describe('Règles métier — soumission', () => {
  test("bloque la soumission si le nom du vérificateur est vide", async ({ page }) => {
    await page.goto(URL)
    await page.getByRole('button', { name: /commencer/i }).click()

    await page.getByTestId('input-expiry-date').fill('2026-12-31')
    await page.getByTestId('btn-present').click()
    await page.getByTestId('btn-present').click()
    await page.getByTestId('btn-present').click()

    await page.getByTestId('btn-submit').click()

    await expect(page.getByRole('alert')).toBeVisible()
  })
})

test.describe('Edge cases', () => {
  test("affiche une page d'erreur si l'inventaire est inconnu", async ({ page }) => {
    await page.goto('/inventaire/inv-inexistant')

    await expect(page.getByText(/n'existe pas/i)).toBeVisible()
  })
})
