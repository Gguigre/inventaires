---
name: testing
description: >
  Testing philosophy and patterns for Vitest, Testing Library, and Playwright in this project.
  Use whenever writing or modifying tests — unit tests for use cases, component tests, or E2E specs.
  Consult before deciding what to test, how to structure mocks, or whether a behaviour deserves
  a test at all. Also reference when choosing between userEvent and fireEvent, or when
  mocking Next.js or Firebase modules.
---

# Testing

## Why we test

Two objectives, no others:

1. **Catch regressions.** When code changes, tests surface broken behaviour before it reaches production.
2. **Verify the spec.** Every explicit business rule in `specs/[feature].md` must have a test. If a rule isn't tested, an AI implementation can quietly ignore it.

There is no coverage target. A test is worth writing if and only if it can fail.

---

## What to test

### Use cases — always

Every explicit business rule in the spec deserves a test:

```
"Le commentaire est obligatoire en cas d'Anomalie"
"La date de péremption est obligatoire pour les matériels critiques"
"Le nom du vérificateur est obligatoire à la soumission"
"Un échec d'envoi mail ne bloque pas la confirmation"
```

Not worth testing: the basic happy path with no business rules, behaviours TypeScript already guarantees.

### Components — only non-trivial behaviour

Test a component if it has a rule that TypeScript can't enforce:

```
"La popup bloque la fermeture si le commentaire est vide"
"Le bouton est désactivé tant que le formulaire n'est pas valide"
```

Not worth testing: static text, CSS, one-liner conditionals.

### E2E — critical journeys only

- Full validator flow (frontoffice)
- Anomaly reporting with comment
- Expiry date on critical item
- Backoffice login + critical mutation

---

## Use case tests

Mock repositories, test business rules — not code.

```ts
// features/validator/domain/use-cases.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitControlUseCase } from './use-cases'
import { validatorRepository } from '../data/repository'

vi.mock('../data/repository', () => ({
  validatorRepository: {
    saveControl: vi.fn(),
    getInventoryAssociationId: vi.fn(),
    getAssociationEmails: vi.fn(),
  },
}))

vi.mock('./email-service', () => ({ sendControlCompletedEmail: vi.fn() }))

// ✓ Rule: "Le nom du vérificateur est obligatoire"
it('rejects empty verifier name', async () => {
  const result = await submitControlUseCase({ ...mockSubmission, verifierName: '   ' }, emailCtx)
  expect(result.ok).toBe(false)
  expect(validatorRepository.saveControl).not.toHaveBeenCalled()
})

// ✓ Rule: "Un échec mail ne bloque pas la confirmation"
it('succeeds even when email fails', async () => {
  vi.mocked(sendControlCompletedEmail).mockRejectedValue(new Error('timeout'))
  vi.mocked(validatorRepository.saveControl).mockResolvedValue({ ok: true, value: { controlId: 'c-1' } })
  vi.mocked(validatorRepository.getInventoryAssociationId).mockResolvedValue({ ok: true, value: 'asso-1' })
  vi.mocked(validatorRepository.getAssociationEmails).mockResolvedValue({
    ok: true, value: { emails: ['a@b.com'], name: 'A', alertThresholdDays: 30 }
  })
  const result = await submitControlUseCase(mockSubmission, emailCtx)
  expect(result.ok).toBe(true)
})
```

If the use case imports from `@/shared/data/`, mock that module too:

```ts
vi.mock('@/shared/data/alerts-repository', () => ({ getActiveAlerts: vi.fn() }))
```

---

## Component tests

Test behaviour, not implementation. Use `userEvent`, not `fireEvent`.

```tsx
// ✓ Rule: "La popup bloque la fermeture si le commentaire est vide"
it('does not close modal when comment is empty', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn()
  render(<AnomalyModal isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />)

  await user.click(screen.getByTestId('btn-confirm-anomaly'))

  expect(onConfirm).not.toHaveBeenCalled()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
```

Always mock `next/image`:

```ts
vi.mock('next/image', () => ({ default: ({ alt }: { alt: string }) => <img alt={alt} /> }))
```

---

## File structure

```
features/validator/
  domain/
    use-cases.ts
    use-cases.test.ts       ← use case rules
  ui/
    AnomalyModal.tsx
    AnomalyModal.test.tsx   ← non-trivial UI behaviour only

e2e/
  validator.spec.ts         ← critical user journeys
```

E2E tests use seed data (`npx tsx scripts/seed-dev.ts`). Annotate each test with the spec rule it covers.

---

## What not to do

- ❌ Chase a coverage percentage
- ❌ Test every component by principle
- ❌ Test what TypeScript already guarantees
- ❌ Write tests that can never fail
- ❌ Test implementation details — test observable behaviour
- ❌ Use `fireEvent` — use `userEvent` which simulates real interactions
