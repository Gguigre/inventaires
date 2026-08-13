import { loadInventoryUseCase } from '@/features/validator/domain/use-cases'
import { ValidatorOrchestrator } from '@/features/validator/ui/ValidatorOrchestrator'
import { ErrorScreen } from '@/features/validator/ui/ErrorScreen'
import { isVehicleUseCase } from '@/features/logbook/domain/use-cases'
import { VehicleLogbookPage } from '@/features/logbook/ui/VehicleLogbookPage'

interface Props {
  params: Promise<{ inventaireId: string }>
}

export default async function InventairePage({ params }: Props) {
  const { inventaireId } = await params
  const [result, isVehicleResult] = await Promise.all([
    loadInventoryUseCase(inventaireId),
    isVehicleUseCase(inventaireId),
  ])

  if (!result.ok) {
    return <ErrorScreen message={result.error} />
  }

  const isVehicle = isVehicleResult.ok && isVehicleResult.value

  const inventory = { id: result.value.inventory.id, name: result.value.inventory.name }

  if (isVehicle) {
    return (
      <VehicleLogbookPage
        inventory={inventory}
        compartments={result.value.compartments}
        lastExpiryDates={result.value.lastExpiryDates}
      />
    )
  }

  return (
    <ValidatorOrchestrator
      inventory={inventory}
      compartments={result.value.compartments}
      lastExpiryDates={result.value.lastExpiryDates}
    />
  )
}
