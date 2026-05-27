import { adminDb } from '@/shared/data/firebase-admin'
import { getActiveExpiryAlertsUseCase } from '@/features/controles/domain/use-cases'
import { sendExpiryAlertEmail } from '@/features/controles/domain/email-service'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const errors: string[] = []
  let processed = 0
  let emailsSent = 0

  try {
    const associationsSnap = await adminDb.collection('associations').get()
    for (const assocDoc of associationsSnap.docs) {
      processed++
      try {
        const alertsResult = await getActiveExpiryAlertsUseCase(assocDoc.id)
        if (!alertsResult.ok) { errors.push(`${assocDoc.id}: ${alertsResult.error}`); continue }
        const { expired, atRisk } = alertsResult.value
        if (expired.length === 0 && atRisk.length === 0) continue
        const recipients: string[] = assocDoc.data().notificationEmails ?? []
        const associationName: string = assocDoc.data().name ?? assocDoc.id
        await sendExpiryAlertEmail({ expired, atRisk, recipients, associationName })
        emailsSent++
      } catch (e) {
        errors.push(`${assocDoc.id}: ${(e as Error).message}`)
      }
    }
  } catch (e) {
    errors.push(`Fatal: ${(e as Error).message}`)
  }

  return Response.json({ processed, emailsSent, errors }, { status: 200 })
}
