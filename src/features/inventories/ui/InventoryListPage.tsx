'use client'

import type { InventoryWithCompartmentCount } from '../domain/types'
import { useInventoryListPage } from './hooks/useInventoryListPage'
import { InventoryList } from './InventoryList'
import { CreateInventoryForm } from './CreateInventoryForm'

interface InventoryListPageProps {
  inventories: InventoryWithCompartmentCount[]
}

export function InventoryListPage({ inventories }: InventoryListPageProps) {
  const { showCreate, isPending, createError, handleCreate, openCreate, closeCreate, duplicatingId, duplicateErrors, handleDuplicate } = useInventoryListPage()

  return (
    <>
      <InventoryList inventories={inventories} onCreateClick={openCreate} duplicatingId={duplicatingId} duplicateErrors={duplicateErrors} onDuplicate={handleDuplicate} />
      <CreateInventoryForm
        isOpen={showCreate}
        isSubmitting={isPending}
        error={createError ?? undefined}
        onSubmit={handleCreate}
        onCancel={closeCreate}
      />
    </>
  )
}
