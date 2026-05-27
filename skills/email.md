# Skill — Email (Resend + react-email)

## Setup

```ts
// shared/lib/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)
```

Variable d'env requise : `RESEND_API_KEY`
Domaine expéditeur à vérifier dans le dashboard Resend.

---

## Templates react-email

Les templates vivent dans `emails/`. Ce sont des composants React
qui génèrent du HTML email-compatible.

```tsx
// emails/InventaireTermine.tsx
import {
  Html, Head, Body, Container, Heading, Text, Section, Hr
} from '@react-email/components'

interface Props {
  sacNom: string
  secouristeNom: string
  dateInventaire: string
  nbAnomalies: number
  anomalies: { materielNom: string; commentaire: string }[]
}

export function InventaireTermineEmail({
  sacNom,
  secouristeNom,
  dateInventaire,
  nbAnomalies,
  anomalies,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading>Inventaire terminé — {sacNom}</Heading>

          <Text>
            <strong>{secouristeNom}</strong> a réalisé un inventaire
            du sac <strong>{sacNom}</strong> le {dateInventaire}.
          </Text>

          {nbAnomalies > 0 ? (
            <Section>
              <Hr />
              <Heading as="h2">
                ⚠ {nbAnomalies} anomalie{nbAnomalies > 1 ? 's' : ''} signalée{nbAnomalies > 1 ? 's' : ''}
              </Heading>
              {anomalies.map((a, i) => (
                <Text key={i}>
                  <strong>{a.materielNom}</strong> — {a.commentaire}
                </Text>
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

## Service d'envoi

Encapsuler l'envoi dans un service dans `shared/lib/` ou dans
le domaine de la feature concernée.

```ts
// features/inventaires/domain/email-service.ts
import { resend } from '@/shared/lib/resend'
import { render } from '@react-email/render'
import { InventaireTermineEmail } from '@/emails/InventaireTermine'
import type { Result } from '@/shared/domain/result'

interface EnvoyerAlertInventaireParams {
  destinataires: string[]
  sacNom: string
  secouristeNom: string
  dateInventaire: string
  anomalies: { materielNom: string; commentaire: string }[]
}

export async function envoyerAlertInventaire(
  params: EnvoyerAlertInventaireParams
): Promise<Result<void>> {
  try {
    const html = render(
      InventaireTermineEmail({
        sacNom: params.sacNom,
        secouristeNom: params.secouristeNom,
        dateInventaire: params.dateInventaire,
        nbAnomalies: params.anomalies.length,
        anomalies: params.anomalies,
      })
    )

    await resend.emails.send({
      from: 'Secourisme <noreply@votredomaine.fr>',
      to: params.destinataires,
      subject: `Inventaire terminé — ${params.sacNom}`,
      html,
    })

    return { ok: true, value: undefined }
  } catch (e) {
    return { ok: false, error: "Échec de l'envoi de l'alerte mail" }
  }
}
```

---

## Où appeler les services mail

**Uniquement dans les Server Actions ou les API routes.**
Jamais côté client.

```ts
// features/inventaires/domain/actions.ts
'use server'

import { terminerInventaireUseCase } from './use-cases'
import { envoyerAlertInventaire } from './email-service'
import { getResponsablesUseCase } from '@/features/responsables/domain/use-cases'

export async function terminerInventaireAction(inventaireId: string) {
  const result = await terminerInventaireUseCase(inventaireId)
  if (!result.ok) return { error: result.error }

  const responsables = await getResponsablesUseCase()
  if (responsables.ok) {
    await envoyerAlertInventaire({
      destinataires: responsables.value.map(r => r.email),
      sacNom: result.value.sacNom,
      secouristeNom: result.value.secouristeNom,
      dateInventaire: new Date().toLocaleDateString('fr-FR'),
      anomalies: result.value.anomalies,
    })
  }

  return { success: true }
}
```

---

## Preview en développement

react-email fournit un serveur de preview :

```bash
npx email dev --dir emails --port 3001
```

Permet de visualiser les templates dans le navigateur sans envoyer de vrai mail.

---

## Alertes péremption

Même pattern. Créer un template `PeremptionImminente.tsx` et un service dédié.
L'envoi se fait via un cron job (Vercel Cron ou GitHub Actions) qui appelle
une API route protégée :

```ts
// app/api/cron/peremptions/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // vérifier les péremptions, envoyer les alertes
  // ...
}
```

---

## Ce qu'il ne faut pas faire

- ❌ Appeler `resend.emails.send` côté client
- ❌ Mettre la clé API Resend dans une variable `NEXT_PUBLIC_*`
- ❌ Envoyer les mails directement dans les use cases (passer par le service)
- ❌ Oublier le `try/catch` — Resend peut échouer, ne pas bloquer le flux principal
