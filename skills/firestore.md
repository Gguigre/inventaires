# Skill — Firestore

## Initialisation Firebase

```ts
// shared/data/firebase.ts
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const db = getFirestore(app)
export const auth = getAuth(app)
```

**Firebase Admin** (Server Actions, API routes) :
```ts
// shared/data/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app'
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

export const adminDb = getFirestore()
```

---

## Structure des collections

```
sacs/
  {sacId}/
    nom: string
    description: string
    createdAt: Timestamp
    updatedAt: Timestamp

materiels/
  {materielId}/
    sacId: string
    nom: string
    photo: string          # URL
    emplacement: string
    critique: boolean      # péremption obligatoire si true
    peremeAt: Timestamp | null
    ordre: number          # ordre d'affichage dans le sac

inventaires/
  {inventaireId}/
    sacId: string
    secouristeNom: string
    startedAt: Timestamp
    completedAt: Timestamp | null
    statut: 'en_cours' | 'termine'

    verifications/         # sous-collection
      {verificationId}/
        materielId: string
        statut: 'present' | 'anomalie'
        commentaire: string | null
        peremeAt: Timestamp | null
        verifiedAt: Timestamp
```

---

## Pattern Repository

Chaque feature a son propre repository. Le repository est la **seule**
couche qui connaît Firestore.

```ts
// features/sacs/data/repository.ts
import { db } from '@/shared/data/firebase'
import {
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp
} from 'firebase/firestore'
import type { Sac, CreateSacDto } from '../domain/types'
import type { Result } from '@/shared/domain/result'

const COLLECTION = 'sacs'

export const sacsRepository = {
  async getAll(): Promise<Result<Sac[]>> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION))
      const sacs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Sac[]
      return { ok: true, value: sacs }
    } catch (e) {
      return { ok: false, error: 'Impossible de récupérer les sacs' }
    }
  },

  async getById(id: string): Promise<Result<Sac>> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, id))
      if (!snap.exists()) return { ok: false, error: 'Sac introuvable' }
      return { ok: true, value: { id: snap.id, ...snap.data() } as Sac }
    } catch (e) {
      return { ok: false, error: 'Erreur lors de la récupération du sac' }
    }
  },

  async create(data: CreateSacDto): Promise<Result<Sac>> {
    try {
      const now = Timestamp.now()
      const ref = await addDoc(collection(db, COLLECTION), {
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      return { ok: true, value: { id: ref.id, ...data, createdAt: now, updatedAt: now } }
    } catch (e) {
      return { ok: false, error: 'Impossible de créer le sac' }
    }
  },

  async update(id: string, data: Partial<CreateSacDto>): Promise<Result<void>> {
    try {
      await updateDoc(doc(db, COLLECTION, id), {
        ...data,
        updatedAt: Timestamp.now(),
      })
      return { ok: true, value: undefined }
    } catch (e) {
      return { ok: false, error: 'Impossible de mettre à jour le sac' }
    }
  },

  async delete(id: string): Promise<Result<void>> {
    try {
      await deleteDoc(doc(db, COLLECTION, id))
      return { ok: true, value: undefined }
    } catch (e) {
      return { ok: false, error: 'Impossible de supprimer le sac' }
    }
  },
}
```

---

## Listeners temps réel

Uniquement dans les cas où le temps réel est justifié (ex : backoffice
qui suit les inventaires en cours). Utiliser `onSnapshot` dans un hook client :

```ts
// features/inventaires/ui/use-inventaires-live.ts
'use client'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/shared/data/firebase'

export function useInventairesLive(sacId: string) {
  const [inventaires, setInventaires] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'inventaires'),
      where('sacId', '==', sacId)
    )
    const unsub = onSnapshot(q, snap => {
      setInventaires(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [sacId])

  return inventaires
}
```

Ne pas utiliser `onSnapshot` dans les Server Components.

---

## Règles de sécurité Firestore

Toujours définir des règles explicites dans `firestore.rules` :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Backoffice — authentifié uniquement
    match /sacs/{sacId} {
      allow read, write: if request.auth != null;
    }
    match /materiels/{materielId} {
      allow read, write: if request.auth != null;
    }

    // Inventaires — lecture publique (frontoffice), écriture publique (submission)
    match /inventaires/{inventaireId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;  // affiner selon les besoins
      match /verifications/{vId} {
        allow read, write: if true;
      }
    }
  }
}
```

---

## Ce qu'il ne faut pas faire

- ❌ Importer `db` directement dans un use case ou un composant UI
- ❌ Faire des requêtes Firestore côté client sans listener (préférer Server Components)
- ❌ Stocker des données sensibles (clés, mots de passe) dans Firestore
- ❌ Oublier le `try/catch` dans les repositories — toujours retourner Result<T>
- ❌ Utiliser `adminDb` côté client (firebase-admin est Node.js uniquement)
