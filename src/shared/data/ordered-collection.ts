import { adminDb } from './firebase-admin'

// Calcule et écrit order = count(query) + 1 dans une transaction, pour éviter la race
// entre deux créations concurrentes qui liraient le même count.
export async function createWithNextOrder<T extends FirebaseFirestore.DocumentData>(
  countQuery: FirebaseFirestore.Query,
  ref: FirebaseFirestore.DocumentReference,
  buildData: (order: number) => T,
): Promise<number> {
  return adminDb.runTransaction(async (t) => {
    const existing = await t.get(countQuery.count())
    const order = existing.data().count + 1
    t.set(ref, buildData(order))
    return order
  })
}
