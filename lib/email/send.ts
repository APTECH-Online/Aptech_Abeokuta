import 'server-only'

export interface EmailPayload {
  to: string
  subject: string
  text: string
  html: string
}

/**
 * Email sending abstraction. No email provider is currently configured for
 * this project, so this logs the email server-side (visible in Vercel
 * function logs) instead of failing the request — form submissions must
 * never fail just because email delivery isn't wired up yet.
 *
 * To go live with a provider, set RESEND_API_KEY (or your provider's
 * equivalent) as an environment variable and replace the body of this
 * function with an API call — nothing else in the codebase needs to change,
 * since every call site just awaits sendEmail(...).
 *
 * Example with Resend (https://resend.com):
 *
 *   import { Resend } from 'resend'
 *   const resend = new Resend(process.env.RESEND_API_KEY)
 *   export async function sendEmail(payload: EmailPayload) {
 *     await resend.emails.send({
 *       from: 'APTECH Abeokuta Admissions <admissions@aptechabeokuta.com>',
 *       to: payload.to,
 *       subject: payload.subject,
 *       html: payload.html,
 *       text: payload.text
 *     })
 *   }
 */
export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.info('[email] No email provider configured — logging instead of sending.', {
      to: payload.to,
      subject: payload.subject
    })
    return { ok: true }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM_ADDRESS || 'APTECH Abeokuta <onboarding@resend.dev>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[email] provider error', response.status, errorText)
      return { ok: false, error: 'Email provider returned an error' }
    }

    return { ok: true }
  } catch (err) {
    console.error('[email] failed to send', err)
    return { ok: false, error: 'Failed to reach email provider' }
  }
}
