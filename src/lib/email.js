// Envío de email de confirmación al cliente tras firmar el consentimiento.
// Incluye el PDF firmado como adjunto (base64).
// Llama a la Supabase Edge Function send-consent-email (Gmail SMTP).

const EDGE_FN_URL = 'https://qdbjhtohrfiogwwcydca.supabase.co/functions/v1/send-consent-email'

/**
 * @param {object} params
 * @param {string} params.clientEmail
 * @param {string} params.clientName
 * @param {string} params.treatmentType
 * @param {string} params.centerName
 * @param {string} params.signedDate
 * @param {string} [params.pdfBase64]   - PDF firmado en base64 (adjunto)
 * @param {string} [params.pdfFilename] - Nombre del archivo PDF
 */
export async function sendConsentConfirmation({
  clientEmail, clientName, treatmentType, centerName, signedDate,
  pdfBase64 = null, pdfFilename = null,
}) {
  if (!clientEmail) return

  try {
    const res = await fetch(EDGE_FN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        clientEmail, clientName, treatmentType, centerName, signedDate,
        pdfBase64, pdfFilename,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Email error:', err)
    }
  } catch (e) {
    console.error('Email send failed:', e)
  }
}
