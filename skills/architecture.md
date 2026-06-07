---
name: architecture
description: >
  Clean architecture and SOLID principles on the Next.js 15 + Firestore + Zustand stack.
  Use this skill whenever you are adding a feature, creating a use case, repository,
  action, or hook, moving logic between layers, or deciding where a responsibility belongs.
  Also use it when you spot a dependency going the wrong direction, an action doing too much,
  a repository containing business logic, or a cross-feature import.
  When in doubt about "where does this go?" — read this first.
---

# Architecture

## Dependency direction

Dependencies flow in one direction — from outside to inside:

```
UI (hooks, components)
  → Server Action (domain/actions.ts)
    → Use Case (domain/use-cases.ts)
      → Repository (data/repository.ts)
        → Firestore (adminDb)
```

Each layer only knows the layer directly below it. The reason this matters: if a repository calls a use case, or a use case imports `adminDb` directly, neither can be tested or replaced in isolation. The rule is what makes each layer independently changeable.

```ts
// ✗ — repository that reaches up into a use case
export const myRepository = {
  async doSomething() {
    return myUseCase()  // wrong direction
  }
}

// ✓ — repository that only talks to Firestore
export const myRepository = {
  async doSomething() {
    return adminDb.collection('items').get()
  }
}
```

---

## Feature isolation

A feature never imports from another feature. When two features need the same type or logic, move it to `shared/`.

```ts
// ✗ — cross-feature imports create hidden coupling
import type { ExpiryAlertItem } from '@/features/controls/domain/types'
import { getActiveAlertsUseCase } from '@/features/controls/domain/use-cases'

// ✓ — shared/ is the right place for cross-cutting concerns
import type { ExpiryAlertItem } from '@/shared/domain/alerts'
import { getActiveAlerts } from '@/shared/data/alerts-repository'
```

Where things go in `shared/`:
- Shared types → `shared/domain/`
- Shared Firestore queries → `shared/data/`
- Utilities (dates, formatting) → `shared/lib/`

---

## Layer contracts

### Repository — reads and writes only

The repository is the only layer that knows Firestore. It returns raw data and applies no business logic. Business logic that does NOT belong here: date computations, status classification (`expired` / `at-risk` / `ok`), business filtering, calls to external services.

```ts
export const itemRepository = {
  async findByCompartment(compartmentId: string): Promise<Result<Item[]>> {
    try {
      const snap = await adminDb.collection('materiels')
        .where('compartmentId', '==', compartmentId)
        .orderBy('order')
        .get()
      return ok(snap.docs.map(toItem))
    } catch (error) {
      return err(`Impossible de charger les matériels : ${(error as Error).message}`)
    }
  },
}
```

### Use Case — all business logic

The use case contains everything that answers "what does this feature actually do?" Standard execution order:

1. Validate inputs
2. Check authorization (ownership)
3. Read context if needed
4. Main operation
5. Non-blocking side effects (email, notifications)

```ts
export async function createCorrectionUseCase(
  input: CreateCorrectionInput,
  user: AuthenticatedUser,
): Promise<Result<void>> {
  if (!input.newExpiryDate) return err('La date est obligatoire.')
  if (input.associationId !== user.associationId) return err('Non autorisé.')
  const owns = await repository.verifyOwnership(input.inventoryId, input.associationId)
  if (!owns.ok) return owns
  const thresholdDays = await repository.getAlertThreshold(input.associationId)
  if (new Date(input.newExpiryDate) <= todayPlusDays(thresholdDays))
    return err(`Doit être > J+${thresholdDays}.`)
  return repository.createCorrection(input)
}
```

### Server Action — entry point only

The action authenticates, calls one use case, revalidates. If it does anything else, that logic belongs in the use case.

```ts
'use server'
export async function createCorrectionAction(input: CreateCorrectionInput): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  const result = await createCorrectionUseCase(input, user)
  if (result.ok) revalidatePath('/dashboard/controles')
  return result
}
```

---

## Email as non-blocking side effect

Email is infrastructure. A failed send must never fail the user-facing operation. Call the email service from the use case after the main operation succeeds, fire and forget.

```ts
const result = await repository.saveControl(submission, associationId)
if (!result.ok) return result

sendControlCompletedEmail(params).catch((e) =>
  console.error('[submitControlUseCase] email failure', e)
)

return result
```

The email service lives in `domain/email-service.ts` of the feature that owns it. If multiple features share a template, move the service to `shared/lib/`.

---

## Common violations

| Symptom | Cause | Fix |
|---|---|---|
| Action calls `adminDb` or `repository` directly | Logic in the wrong layer | Move to use case |
| Feature A imports from `@/features/B/` | Cross-feature coupling | Move type/query to `shared/` |
| Repository contains `startOfToday()` or status classification | Business logic in data layer | Move to use case |
| Use case imports `adminDb` directly | Skipped the repository | Add a repository method |
| Action orchestrates context fetching + email + save | Action doing too much | Move orchestration to use case |
| Action returns `{ error } \| { success }` | Non-standard result type | Align to `Result<T>` |
