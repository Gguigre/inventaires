export type ExpiryAlertItem = {
  itemId: string
  itemName: string
  compartmentName: string
  inventoryId: string
  inventoryName: string
  latestExpiryDate: string   // ISO YYYY-MM-DD
  comment: string | null
  source: 'control' | 'correction'
}

export type AnomalyAlertItem = {
  itemId: string
  itemName: string
  compartmentName: string
  inventoryId: string
  inventoryName: string
  comment: string | null
  controlId: string
}

export type ActiveAlertsReport = {
  anomalies: AnomalyAlertItem[]
  expired: ExpiryAlertItem[]
  atRisk: ExpiryAlertItem[]
}
