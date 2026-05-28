'use client'
import { useState } from 'react'
import { updateAssociationSettingsAction } from '../../domain/actions'
import type { AssociationSettings } from '../../domain/types'

export function useParametresPage(initial: AssociationSettings) {
  const [name, setName] = useState(initial.name)
  const [emails, setEmails] = useState(initial.notificationEmails)
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [alertThresholdDays, setAlertThresholdDays] = useState(initial.alertThresholdDays)
  const [alertIntervalDays, setAlertIntervalDays] = useState(initial.alertIntervalDays)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState(false)

  function addEmail() {
    if (!newEmail.includes('@')) { setEmailError('Email invalide.'); return }
    if (emails.includes(newEmail)) { setEmailError('Cet email est déjà dans la liste.'); return }
    setEmails([...emails, newEmail])
    setNewEmail('')
    setEmailError(undefined)
    setSuccess(false)
  }

  function removeEmail(email: string) {
    setEmails(emails.filter(e => e !== email))
    setSuccess(false)
  }

  async function handleSave() {
    setIsSaving(true)
    setError(undefined)
    setSuccess(false)
    const result = await updateAssociationSettingsAction({ name, notificationEmails: emails, alertThresholdDays, alertIntervalDays })
    setIsSaving(false)
    if (result.error) { setError(result.error); return }
    setSuccess(true)
  }

  return {
    name, setName,
    emails, newEmail, setNewEmail, emailError, addEmail, removeEmail,
    alertThresholdDays, setAlertThresholdDays,
    alertIntervalDays, setAlertIntervalDays,
    isSaving, error, success, handleSave,
  }
}
