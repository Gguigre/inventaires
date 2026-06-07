---
name: email
description: >
  Resend + react-email patterns for sending transactional emails in this project.
  Use whenever creating or modifying email templates, adding email sending to a use case,
  or setting up a new cron-triggered alert. Also reference when debugging email delivery,
  previewing templates in dev, or checking where email calls belong in the architecture.
---

# Email (Resend + react-email)

## Setup

```ts
// shared/lib/resend.ts
import { Resend } from 'resend'
export const resend = new Resend(process.env.RESEND_API_KEY)
```

Required: `RESEND_API_KEY` env var, verified sender domain in the Resend dashboard.

---

## Templates

Templates live in `emails/` — React components that produce email-compatible HTML.

```tsx
// emails/ControlCompleted.tsx
import { Html, Head, Body, Container, Heading, Text, Section, Hr } from '@react-email/components'

interface Props {
  inventoryName: string
  verifierName: string
  controlDate: string
  anomalyCount: number
  anomalies: { itemName: string; comment: string }[]
}

export function ControlCompletedEmail({ inventoryName, verifierName, controlDate, anomalyCount, anomalies }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading>Contrôle terminé — {inventoryName}</Heading>
          <Text>
            <strong>{verifierName}</strong> a réalisé un contrôle de{' '}
            <strong>{inventoryName}</strong> le {controlDate}.
          </Text>
          {anomalyCount > 0 ? (
            <Section>
              <Hr />
              <Heading as="h2">⚠ {anomalyCount} anomalie{anomalyCount > 1 ? 's' : ''}</Heading>
              {anomalies.map((a, i) => (
                <Text key={i}><strong>{a.itemName}</strong> — {a.comment}</Text>
              ))}
            </Section>
          ) : (
            <Text>✓ Aucune anomalie signalée.</Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}
```

---

## Email service

Encapsulate sending in a service in `domain/email-service.ts` of the feature that owns it. The service returns `void` and swallows errors — email is a non-blocking side effect, not a `Result<T>`.

```ts
// features/validator/domain/email-service.ts
import { resend } from '@/shared/lib/resend'
import { render } from '@react-email/render'
import { ControlCompletedEmail } from '@/emails/ControlCompleted'
import { fromAddress } from '@/shared/lib/email-slug'

export async function sendControlCompletedEmail(params: {
  recipients: string[]
  inventoryName: string
  verifierName: string
  controlDate: string
  anomalies: { itemName: string; comment: string }[]
}): Promise<void> {
  if (params.recipients.length === 0) return
  try {
    const html = await render(ControlCompletedEmail({ ...params, anomalyCount: params.anomalies.length }))
    await resend.emails.send({
      from: fromAddress(params.inventoryName),
      to: params.recipients,
      subject: `Contrôle terminé — ${params.inventoryName}`,
      html,
    })
  } catch (e) {
    console.error('[email] sendControlCompletedEmail failed:', e)
  }
}
```

---

## Where email belongs

Email is called from the **use case**, after the main operation succeeds — never from an action, never from a repository. The use case fires and forgets:

```ts
const result = await repository.saveControl(submission, associationId)
if (!result.ok) return result

// Non-blocking: if this throws, the control is still saved
sendControlCompletedEmail(params).catch((e) =>
  console.error('[submitControlUseCase] email failure', e)
)

return result
```

See the architecture skill for the full rationale on side effects.

---

## Cron alerts

Scheduled alerts (expiry warnings) follow the same pattern: a cron job hits a protected API route, the route calls a use case, the use case calls the email service.

```ts
// app/api/cron/expiry-alerts/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  const result = await runExpiryAlertsCronUseCase()
  return Response.json(result)
}
```

---

## Dev preview

```bash
npx email dev --dir emails --port 3001
```

Renders templates in the browser without sending real emails.

---

## What not to do

- ❌ Call `resend.emails.send` directly from a use case — use the email service
- ❌ Trigger email from a Server Action — it belongs in the use case
- ❌ Put `RESEND_API_KEY` in a `NEXT_PUBLIC_*` variable
- ❌ Block the main operation on email — email must be fire-and-forget
- ❌ Make the email service return `Result<T>` — it returns `void` and logs failures
