export type AssociationSummary = {
  id: string
  name: string
  adminEmail: string
}

export type AssociationSettings = {
  name: string
  notificationEmails: string[]
  alertThresholdDays: number
  alertIntervalDays: number
}

export type CreateAssociationInput = {
  name: string
  adminEmail: string
}

export type UpdateAssociationInput = {
  name: string
  notificationEmails: string[]
  alertThresholdDays: number
  alertIntervalDays: number
}

export type AdminAccount = {
  uid: string
  email: string
  createdAt: Date | null
}
