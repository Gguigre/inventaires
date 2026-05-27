export type ExpiryAlertItem = {
  itemId: string
  itemName: string
  compartmentName: string
  inventoryId: string
  inventoryName: string
  latestExpiryDate: string   // ISO YYYY-MM-DD
  source: 'control' | 'correction'
}

export type ExpiryAlertReport = {
  expired: ExpiryAlertItem[]
  atRisk: ExpiryAlertItem[]
}

export type ControlSummary = {
  id: string
  inventoryId: string
  inventoryName: string
  verifierName: string
  submittedAt: Date
  anomalyCount: number
  atRiskCount: number
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
}

export type CreateCorrectionInput = {
  itemId: string
  inventoryId: string
  associationId: string
  newExpiryDate: string
  correctedBy: string
}
