import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const auth = getAuth()
const db = getFirestore()

const SUPERADMIN_EMAIL = 'gui.gremi@gmail.com'

async function main() {
  let uid: string

  try {
    const existing = await auth.getUserByEmail(SUPERADMIN_EMAIL)
    uid = existing.uid
    console.log(`Utilisateur existant : ${uid}`)
  } catch {
    const created = await auth.createUser({ email: SUPERADMIN_EMAIL })
    uid = created.uid
    console.log(`Utilisateur créé : ${uid}`)
  }

  await db.collection('users').doc(uid).set(
    { role: 'superadmin', associationId: '' },
    { merge: true }
  )
  console.log(`Firestore users/${uid} mis à jour (role: superadmin)`)

  const resetLink = await auth.generatePasswordResetLink(SUPERADMIN_EMAIL)
  console.log(`\nLien pour définir le mot de passe :\n${resetLink}`)
}

main().catch(console.error)
