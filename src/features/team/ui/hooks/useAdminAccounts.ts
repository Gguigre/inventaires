'use client'

import { useState } from 'react'
import { inviteAdminAction, removeAdminAction } from '../../domain/actions'
import type { AdminAccountView } from '../../domain/types'

export function useAdminAccounts(initialAccounts: AdminAccountView[]) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | undefined>()
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | undefined>()

  async function handleInvite() {
    setIsInviting(true)
    setInviteError(undefined)
    const result = await inviteAdminAction(inviteEmail)
    setIsInviting(false)
    if (!result.ok) { setInviteError(result.error); return }
    setInviteSuccess(true)
    setShowInvite(false)
    setInviteEmail('')
    setAccounts((prev) => [...prev, { email: inviteEmail, createdAt: new Date(), isCurrentUser: false }])
  }

  async function handleRemove(email: string) {
    setRemovingEmail(email)
    setRemoveError(undefined)
    const result = await removeAdminAction(email)
    setRemovingEmail(null)
    if (!result.ok) { setRemoveError(result.error); return }
    setAccounts((prev) => prev.filter((a) => a.email !== email))
  }

  function openInvite() { setShowInvite(true); setInviteError(undefined); setInviteSuccess(false) }
  function cancelInvite() { setShowInvite(false); setInviteEmail(''); setInviteError(undefined) }

  return {
    accounts, showInvite, inviteEmail, setInviteEmail, isInviting, inviteError, inviteSuccess,
    removingEmail, removeError,
    handleInvite, handleRemove, openInvite, cancelInvite,
  }
}
