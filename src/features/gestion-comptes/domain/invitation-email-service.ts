// DIVERGENCE SPEC : la spec prévoit un email Firebase natif (generatePasswordResetLink uniquement).
// On utilise Resend pour contrôler le contenu et le sujet de l'invitation.
import { resend } from '@/shared/lib/resend'

export async function sendInvitationEmail(adminEmail: string, associationName: string, resetLink: string) {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: adminEmail,
      subject: `Invitation — ${associationName}`,
      text: `Bonjour,\n\nVous avez été invité à gérer l'association "${associationName}".\n\nDéfinissez votre mot de passe :\n${resetLink}\n\nCe lien expire dans 24 heures.`,
    })
  } catch (e) {
    console.error('[sendInvitationEmail] Envoi échoué:', e)
  }
}
