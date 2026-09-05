export type { ExpiryAlertItem, AnomalyAlertItem, ActiveAlertsReport } from '@/shared/domain/alerts'

export type CreateAnomalyCorrectionInput = {
  itemId: string
  inventoryId: string
  associationId: string
  correctedBy: string
}

export type ControlEmailStatus = 'sent' | 'failed' | 'skipped'

export type ControlSummary = {
  id: string
  inventoryId: string
  inventoryName: string
  verifierName: string
  submittedAt: Date
  anomalyCount: number  // snapshot historique : anomalies de statut + items périmés lors du contrôle
  atRiskCount: number
  emailStatus: ControlEmailStatus | null
  emailError: string | null
}

export type ItemResult = {
  itemId: string
  itemName: string
  status: 'present' | 'anomaly'
  comment: string | null
  expiryDate: string | null
  currentExpiryStatus: 'expired' | 'at-risk' | 'ok' | 'fixed' | null
}

export type ControlCompartment = {
  id: string
  name: string
  results: ItemResult[]
}

export type ControlDetail = {
  id: string
  inventoryName: string
  verifierName: string
  submittedAt: Date
  compartments: ControlCompartment[]
  emailStatus: ControlEmailStatus | null
  emailError: string | null
}

export type CreateCorrectionInput = {
  itemId: string
  inventoryId: string
  associationId: string
  newExpiryDate: string
  correctedBy: string
}
