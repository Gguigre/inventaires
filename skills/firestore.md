---
name: firestore
description: >
  Firestore Admin SDK patterns, collection schema, and query conventions for this project.
  Use whenever touching any data layer: creating or modifying a repository, writing Firestore
  queries, doing batch operations, or verifying collection structure. Always consult before
  adding a new collection or field, or before running queries with 'in' / batch writes.
---

# Firestore

## SDK: Admin only, server-side only

```ts
// shared/data/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({ credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }) })
}
export const adminDb = getFirestore()
```

Never import `adminDb` or `firebase-admin` in a `'use client'` component. There is no client Firestore SDK in this project — all reads and writes go through Server Actions, Server Components, or API routes.

---

## Collection schema

```
associations/
  {assocId}/
    name: string
    notificationEmails: string[]
    alertThresholdDays?: number     # jours avant péremption → alerte (défaut: constante partagée)
    alertIntervalDays?: number      # délai minimal entre deux alertes pour le même matériel

inventaires/
  {inventaireId}/
    associationId: string
    name: string

emplacements/
  {emplacementId}/
    inventoryId: string
    name: string
    order: number

materiels/
  {materielId}/
    compartmentId: string
    name: string
    photoUrl: string
    hasExpiry: boolean
    isCritical: boolean
    order: number

controles/
  {controleId}/
    associationId: string
    inventoryId: string
    verifierName: string
    submittedAt: Timestamp
    results: Array<{
      itemId: string
      compartmentId: string
      status: 'present' | 'anomaly'
      comment: string | null
      expiryDate: string | null    # ISO 'YYYY-MM-DD'
    }>

corrections/
  {correctionId}/
    associationId: string
    inventoryId: string
    itemId: string
    newExpiryDate: string          # ISO 'YYYY-MM-DD'
    correctedBy: string
    correctedAt: Timestamp

anomaly_corrections/
  {correctionId}/
    associationId: string
    inventoryId: string
    itemId: string
    correctedBy: string
    correctedAt: Timestamp
```

---

## Repository pattern

```ts
// features/[feature]/data/repository.ts
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'

export const myRepository = {
  async getAll(associationId: string): Promise<Result<Item[]>> {
    try {
      const snap = await adminDb.collection('items')
        .where('associationId', '==', associationId)
        .orderBy('order')
        .get()
      return ok(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item)))
    } catch (error) {
      return err(`Impossible de charger les éléments : ${(error as Error).message}`)
    }
  },

  async create(data: CreateItemDto): Promise<Result<void>> {
    try {
      await adminDb.collection('items').add({ ...data, createdAt: FieldValue.serverTimestamp() })
      return ok(undefined)
    } catch (error) {
      return err(`Impossible de créer l'élément : ${(error as Error).message}`)
    }
  },
}
```

---

## Batching — Firestore limits

| Operation | Limit | Helper |
|-----------|-------|--------|
| `in` / `not-in` query | 30 values max | `chunkArray(ids, FIRESTORE_IN_LIMIT)` |
| Batch write | 500 ops max | `chunkArray(refs, 490)` |

```ts
import { chunkArray, FIRESTORE_IN_LIMIT } from '@/shared/lib/array'

// in queries
const allDocs: FirebaseFirestore.QueryDocumentSnapshot[] = []
for (const chunk of chunkArray(ids, FIRESTORE_IN_LIMIT)) {
  const snap = await adminDb.collection('items').where('compartmentId', 'in', chunk).get()
  allDocs.push(...snap.docs)
}

// batch deletes
for (const chunk of chunkArray(refs, 490)) {
  const batch = adminDb.batch()
  chunk.forEach((ref) => batch.delete(ref))
  await batch.commit()
}
```

---

## Ownership check

Before any mutation, verify the resource belongs to the user's association. This check is authorization — it belongs in the **use case** (not the action):

```ts
// In the use case
const owns = await myRepository.verifyOwnership(inventoryId, user.associationId)
if (!owns.ok) return owns

// In the repository
async verifyOwnership(inventoryId: string, associationId: string): Promise<Result<void>> {
  try {
    const doc = await adminDb.collection('inventaires').doc(inventoryId).get()
    if (!doc.exists) return err('Introuvable.')
    if (doc.data()!.associationId !== associationId) return err('Accès non autorisé.')
    return ok(undefined)
  } catch (error) {
    return err(`Erreur vérification : ${(error as Error).message}`)
  }
},
```

---

## What not to do

- ❌ Import `firebase-admin` or `adminDb` in a `'use client'` component
- ❌ Use the client Firebase SDK — Admin only
- ❌ Skip try/catch in repositories — always return `Result<T>`
- ❌ Run `in` queries with more than 30 values without chunking
- ❌ Mutate a resource without verifying ownership
- ❌ Put business logic (date computations, status classification) in a repository
