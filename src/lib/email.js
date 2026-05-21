// Envío de email de confirmación al cliente tras firmar el consentimiento.
// Usa Resend (resend.com — gratuito hasta 3.000 emails/mes).
// Si no hay VITE_RESEND_API_KEY configurada, la función se salta silenciosamente.

const RESEND_KEY = import.meta.env.VITE_RESEND_API_KEY

const TREATMENT_LABELS = {
  cejas: 'Cejas', labios: 'Labios', eyeliner: 'Eyeliner',
  areola: 'Areola', capilar: 'Capilar', otro: 'Otro',
}

export async function sendConsentConfirmation({ clientEmail, clientName, treatmentType, centerName, signedDate }) {
  if (!RESEND_KEY || !clientEmail) return // feature opcional

  const treatment = TREATMENT_LABELS[treatmentType] || treatmentType || 'Micropigmentación'
  const dateStr = signedDate
    ? new Date(signedDate).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
    : new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f9f5f5;font-family:Arial,sans-serif">
      <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #fce7f3">
        <div style="background:#e11d48;padding:28px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:20px">✅ Consentimiento firmado</h1>
          <p style="color:#fda4af;margin:6px 0 0;font-size:14px">${centerName || 'DermaFlow CRM'}</p>
        </div>
        <div style="padding:32px">
          <p style="color:#374151;font-size:15px;margin:0 0 16px">Hola <strong>${clientName || 'clienta'}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px">
            Tu consentimiento informado para el tratamiento de <strong>${treatment}</strong>
            ha sido registrado correctamente el <strong>${dateStr}</strong>.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecdd3;border-radius:10px;padding:16px;margin-bottom:24px">
            <p style="margin:0;font-size:13px;color:#9f1239;font-weight:600">Guarda este email como comprobante.</p>
            <p style="margin:6px 0 0;font-size:13px;color:#be123c;line-height:1.5">
              Si tienes alguna duda sobre el tratamiento o quieres ejercer tus derechos RGPD
              (acceso, rectificación, supresión), contacta con tu profesional.
            </p>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:0">
            Este email ha sido generado automáticamente por DermaFlow CRM.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${centerName || 'DermaFlow'} <onboarding@resend.dev>`,
        to: [clientEmail],
        subject: `✅ Consentimiento firmado — ${treatment}`,
        html,
      }),
    })
  } catch {
    // El email es opcional — si falla no interrumpe el flujo
  }
}
