export type AdminAccount = {
  uid: string
  email: string
  createdAt: Date | null
}

// Vue publique côté client : jamais d'UID Firebase exposé au navigateur.
export type AdminAccountView = {
  email: string
  createdAt: Date | null
  isCurrentUser: boolean
}

export type AssociationSummary = {
  id: string
  name: string
}
