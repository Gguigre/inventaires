import { adminDb, adminAuth } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { AssociationSummary, AssociationSettings, CreateAssociationInput, UpdateAssociationInput } from '../domain/types'

export const gestionComptesRepository = {
  async listAssociations(): Promise<Result<AssociationSummary[]>> {
    try {
      const [assocSnap, usersSnap] = await Promise.all([
        adminDb.collection('associations').get(),
        adminDb.collection('users').where('role', '==', 'admin').get(),
      ])
      const adminUidByAssoc = new Map<string, string>()
      for (const doc of usersSnap.docs) {
        const assocId = doc.data().associationId as string
        // Seul le premier admin trouvé par association est conservé
        if (assocId && !adminUidByAssoc.has(assocId)) adminUidByAssoc.set(assocId, doc.id)
      }
      const uids = [...adminUidByAssoc.values()]
      const emailByUid = new Map<string, string>()
      if (uids.length > 0) {
        const { users } = await adminAuth.getUsers(uids.map(uid => ({ uid })))
        for (const u of users) emailByUid.set(u.uid, u.email ?? '')
      }
      return ok(assocSnap.docs.map(doc => ({
        id: doc.id,
        name: (doc.data().name as string) ?? doc.id,
        adminEmail: emailByUid.get(adminUidByAssoc.get(doc.id) ?? '') ?? '',
      })))
    } catch (error) {
      console.error('[listAssociations]', error)
      return err('Impossible de lister les associations.')
    }
  },

  async createAssociation(input: CreateAssociationInput): Promise<Result<{ resetLink: string }>> {
    let uid: string | undefined
    try {
      const authUser = await adminAuth.createUser({ email: input.adminEmail })
      uid = authUser.uid
      const assocRef = await adminDb.collection('associations').add({ name: input.name, notificationEmails: [] })
      await adminDb.collection('users').doc(uid).set({ associationId: assocRef.id, role: 'admin' })
      const resetLink = await adminAuth.generatePasswordResetLink(input.adminEmail)
      return ok({ resetLink })
    } catch (error) {
      if (uid) console.error(`[createAssociation] Compte Auth créé (${uid}) mais échec Firestore — nettoyage manuel requis.`)
      else console.error('[createAssociation]', error)
      return err('Impossible de créer l\'association.')
    }
  },

  async getAssociationSettings(associationId: string): Promise<Result<AssociationSettings>> {
    try {
      const doc = await adminDb.collection('associations').doc(associationId).get()
      if (!doc.exists) return err('Association introuvable.')
      const data = doc.data()!
      return ok({ name: (data.name as string) ?? '', notificationEmails: (data.notificationEmails as string[]) ?? [] })
    } catch (error) {
      console.error('[getAssociationSettings]', error)
      return err('Impossible de charger les paramètres.')
    }
  },

  async updateAssociationSettings(associationId: string, data: UpdateAssociationInput): Promise<Result<void>> {
    try {
      await adminDb.collection('associations').doc(associationId).update({ name: data.name, notificationEmails: data.notificationEmails })
      return ok(undefined)
    } catch (error) {
      console.error('[updateAssociationSettings]', error)
      return err('Impossible de mettre à jour les paramètres.')
    }
  },
}
