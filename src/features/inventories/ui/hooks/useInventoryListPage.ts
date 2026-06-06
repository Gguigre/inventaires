'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createInventoryAction, duplicateInventoryAction } from '../../domain/actions'

export function useInventoryListPage() {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [createError, setCreateError] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [duplicateErrors, setDuplicateErrors] = useState<Record<string, string>>({})

  function handleCreate(name: string) {
    setCreateError(null)
    startTransition(async () => {
      const result = await createInventoryAction(name)
      if (!result.ok) { setCreateError(result.error); return }
      setShowCreate(false)
      router.push(`/dashboard/inventaires/${result.value.id}`)
    })
  }

  function handleDuplicate(inventoryId: string) {
    setDuplicatingId(inventoryId)
    setDuplicateErrors((prev) => { const next = { ...prev }; delete next[inventoryId]; return next })
    duplicateInventoryAction(inventoryId).then((result) => {
      setDuplicatingId(null)
      if (!result.ok) {
        setDuplicateErrors((prev) => ({ ...prev, [inventoryId]: result.error }))
        return
      }
      router.refresh()
    })
  }

  function openCreate() { setCreateError(null); setShowCreate(true) }

  function closeCreate() { setShowCreate(false); setCreateError(null) }

  return { showCreate, isPending, createError, handleCreate, openCreate, closeCreate, duplicatingId, duplicateErrors, handleDuplicate }
}
