/**
 * Seed script — creates test inventories in Firestore for local development.
 * Usage: npx tsx scripts/seed-dev.ts
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (!match) continue
  const key = match[1].trim()
  const raw = match[2].trim()
  const value = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
  process.env[key] = value
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

type ItemData = { name: string; hasExpiry: boolean; isCritical: boolean }
type CompartmentData = { name: string; items: ItemData[] }

const SAC_PS: CompartmentData[] = [
  {
    name: 'Poche supérieure',
    items: [
      { name: 'Lampe torche', hasExpiry: false, isCritical: false },
    ],
  },
  {
    name: 'Poches latérales',
    items: [
      { name: '2 Bouteilles d\'eau de 0,5 L', hasExpiry: false, isCritical: false },
      { name: '5 Verres en plastique', hasExpiry: false, isCritical: false },
      { name: '20 Sachets de sucre', hasExpiry: false, isCritical: false },
    ],
  },
  {
    name: 'Poche avant supérieure',
    items: [
      { name: '4 Boites de gants (S, M, L)', hasExpiry: false, isCritical: false },
      { name: '1 S.H.A 100ml', hasExpiry: true, isCritical: true },
    ],
  },
  {
    name: 'Poche avant inférieure',
    items: [
      { name: '2 Paires de gant de manutention', hasExpiry: false, isCritical: false },
      { name: '1 Rouleau de rubalise', hasExpiry: false, isCritical: false },
      { name: '1 Rouleau de sac à risque infectieux (DASRI – jaune)', hasExpiry: false, isCritical: false },
      { name: '1 Rouleau de sac DAOM', hasExpiry: false, isCritical: false },
      { name: '1 Conteneur OPTC', hasExpiry: false, isCritical: false },
      { name: '1 Surfa\'Safe', hasExpiry: true, isCritical: true }, // péremption
      { name: '1 Paquet de lingettes/Essuie-tout', hasExpiry: false, isCritical: false },
    ],
  },
  {
    name: 'Poche principale — Bilan',
    items: [
      { name: '1 Thermomètre', hasExpiry: false, isCritical: false },
      { name: '10 Protections pour thermomètre', hasExpiry: false, isCritical: false },
      { name: '1 Tensiomètre manuelle', hasExpiry: false, isCritical: false },
      { name: '1 Stéthoscope', hasExpiry: false, isCritical: false },
      { name: '1 Stylo lampe', hasExpiry: false, isCritical: false },
      { name: '1 Oxymètre de pouls', hasExpiry: false, isCritical: false },
    ],
  },
  {
    name: 'Poche principale — Biologique',
    items: [
      { name: '2 Paires de lunettes de protection', hasExpiry: false, isCritical: false },
      { name: '4 Masques chirurgicaux', hasExpiry: false, isCritical: false },
      { name: '4 Masques FFP2', hasExpiry: false, isCritical: false },
    ],
  },
  {
    name: 'Poche principale — Hémorragies',
    items: [
      { name: 'Ciseaux Gesco', hasExpiry: false, isCritical: false },
      { name: '2 Pansements Israéliens', hasExpiry: false, isCritical: false },
      { name: '2 Garrots tourniquet', hasExpiry: false, isCritical: false },
    ],
  },
  {
    name: 'Poche principale — Bandages',
    items: [
      { name: '1 Rouleau de ruban adhésif', hasExpiry: false, isCritical: false },
      { name: '2 Bandes extensibles 5cm', hasExpiry: false, isCritical: false },
      { name: '2 Bandes extensibles 7cm', hasExpiry: false, isCritical: false },
      { name: '2 Bandes extensibles 10cm', hasExpiry: false, isCritical: false },
    ],
  },
  {
    name: 'Poche principale — Glycémie',
    items: [
      { name: '1 Glucomètre', hasExpiry: false, isCritical: false },
      { name: '10 Bandelettes adaptées', hasExpiry: true, isCritical: true },
      { name: '10 Auto-piqueurs', hasExpiry: false, isCritical: false },
      { name: '10 Unidoses de sérum physiologique', hasExpiry: true, isCritical: true },
      { name: '10 Compresses', hasExpiry: false, isCritical: false },
    ],
  },
  {
    name: 'Poche principale — Trauma',
    items: [
      { name: '2 Écharpes', hasExpiry: false, isCritical: false },
      { name: '2 Couvertures de survie', hasExpiry: false, isCritical: false },
      { name: '2 Poches de froid', hasExpiry: false, isCritical: false },
      { name: '1 Bande extensible 15cm', hasExpiry: false, isCritical: false },
    ],
  },
  {
    name: 'Poche principale — Pansements',
    items: [
      { name: '1 Pince à échardes', hasExpiry: false, isCritical: false },
      { name: '10 Paquets de 5 compresses stériles', hasExpiry: true, isCritical: true },
      { name: '1 Ciseaux à pansement', hasExpiry: false, isCritical: false },
      { name: '2 Champs stériles', hasExpiry: true, isCritical: true },
      { name: '10 Pansements stériles de tailles différentes', hasExpiry: false, isCritical: false },
      { name: '10 Unidoses de sérum physiologique', hasExpiry: true, isCritical: true },
      { name: '10 Unidoses d\'antiseptique', hasExpiry: false, isCritical: false },
      { name: '1 Rouleau de pansement à découper', hasExpiry: false, isCritical: false },
      { name: '1 Rouleau de sparadrap', hasExpiry: false, isCritical: false },
    ],
  },
]

async function seed() {
  await db.collection('associations').doc('asso-test').set({
    name: 'Association Test',
    notificationEmails: ['admin@test.fr'],
  })

  // --- Sac PS ---
  const invRef = await db.collection('inventaires').add({ name: 'Sac PS', associationId: 'asso-test' })
  console.log(`  Inventaire "Sac PS" créé : ${invRef.id}`)

  for (let ci = 0; ci < SAC_PS.length; ci++) {
    const comp = SAC_PS[ci]
    const compRef = await db.collection('emplacements').add({ inventoryId: invRef.id, name: comp.name, order: ci + 1 })
    for (let ii = 0; ii < comp.items.length; ii++) {
      const item = comp.items[ii]
      await db.collection('materiels').add({ compartmentId: compRef.id, name: item.name, photoUrl: '', hasExpiry: item.hasExpiry, isCritical: item.isCritical, order: ii + 1 })
    }
    console.log(`  ✓ ${comp.name} (${comp.items.length} matériels)`)
  }

  // --- Inventaire E2E validateur (IDs fixes pour Playwright) ---
  await db.collection('inventaires').doc('inv-e2e').set({ name: 'Sac E2E', associationId: 'asso-test' })
  await db.collection('emplacements').doc('emp-e2e-1').set({ inventoryId: 'inv-e2e', name: 'Poche avant', order: 1 })
  await db.collection('emplacements').doc('emp-e2e-2').set({ inventoryId: 'inv-e2e', name: 'Poche arrière', order: 2 })
  await db.collection('materiels').doc('mat-e2e-1').set({ compartmentId: 'emp-e2e-1', name: 'SHA 100ml', photoUrl: '', hasExpiry: true, isCritical: true, order: 1 })
  await db.collection('materiels').doc('mat-e2e-2').set({ compartmentId: 'emp-e2e-1', name: 'Gants', photoUrl: '', hasExpiry: false, isCritical: false, order: 2 })
  await db.collection('materiels').doc('mat-e2e-3').set({ compartmentId: 'emp-e2e-2', name: 'Brancard', photoUrl: '', hasExpiry: false, isCritical: false, order: 1 })
  console.log('  Sac E2E : http://localhost:3000/inventaire/inv-e2e')

  console.log('\n✓ Seed terminé.')
  console.log(`  Sac PS  : http://localhost:3000/dashboard/inventaires/${invRef.id}`)
}

seed().catch(console.error)
