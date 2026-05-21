// Envío de email de confirmación al cliente tras firmar el consentimiento.
// Llama a una Supabase Edge Function que ejecuta el envío server-side con Resend.

const EDGE_FN_URL = 'https://qdbjhtohrfiogwwcydca.supabase.co/functions/v1/send-consent-email'

export async function sendConsentConfirmation({ clientEmail, clientName, treatmentType, centerName, signedDate }) {
  if (!clientEmail) return

  try {
    const res = await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientEmail, clientName, treatmentType, centerName, signedDate }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Email error:', err)
    }
  } catch (e) {
    console.error('Email send failed:', e)
  }
}
