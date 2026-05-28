import { runExpiryAlertsCronUseCase } from '@/features/expiry-alerts/domain/use-cases'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await runExpiryAlertsCronUseCase()

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 500 })
  }

  return Response.json(result.value, { status: 200 })
}
