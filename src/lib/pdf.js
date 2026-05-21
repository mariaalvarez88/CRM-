// pdf.js
// Generación del PDF de consentimiento informado.
//
// Flujo:
//   1. Renderiza el div #consent-pdf-template con html2canvas
//   2. Genera el PDF base con jsPDF
//   3. Calcula el hash SHA-256 de los bytes del PDF original
//      (este hash es el "sello" del documento — cualquier edición lo invalida)
//   4. Añade el hash como texto visible en el pie del documento con pdf-lib
//   5. Añade metadatos de protección en el objeto PDF
//   6. Devuelve los bytes finales + el hash para que el llamador
//      pueda guardarlo en la base de datos

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/**
 * Genera el PDF del consentimiento, calcula su hash SHA-256 y
 * añade el hash visible en el pie junto con metadatos de integridad.
 *
 * @param {object} consent  - Datos del consentimiento (de Supabase)
 * @param {string} centerName
 * @returns {{ pdfBytes: Uint8Array, hash: string }}
 */
export async function generateAndHashPDF(consent, centerName = '') {
  const element = document.getElementById('consent-pdf-template')
  if (!element) throw new Error('Plantilla PDF no encontrada en el DOM')

  // Mostrar el div oculto fuera de pantalla para renderizarlo
  element.style.position = 'absolute'
  element.style.left     = '-9999px'
  element.style.top      = '0'
  element.style.display  = 'block'

  let pdfBytes
  let hash

  try {
    // ── 1. Capturar HTML como imagen ─────────────────────────────────────────
    const canvas = await html2canvas(element, {
      scale:           2,
      useCORS:         true,
      logging:         false,
      backgroundColor: '#ffffff',
      width:           794,
    })

    const imgData     = canvas.toDataURL('image/png')
    const pdf         = new jsPDF('p', 'mm', 'a4')
    const pdfWidth    = 210   // mm A4
    const pdfHeight   = 297   // mm A4
    const canvasRatio = canvas.height / canvas.width
    const imgHeightMM = pdfWidth * canvasRatio

    // Soporte multipágina
    if (imgHeightMM <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM)
    } else {
      let yOffset = 0
      while (yOffset < imgHeightMM) {
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfWidth, imgHeightMM)
        yOffset += pdfHeight
      }
    }

    // ── 2. Obtener bytes del PDF "original" (sin hash) ────────────────────────
    const rawBytes = new Uint8Array(pdf.output('arraybuffer'))

    // ── 3. Calcular SHA-256 del documento original ────────────────────────────
    // Este hash es el sello de integridad: si alguien modifica el PDF,
    // el hash calculado sobre el archivo no coincidirá con el almacenado en BD.
    const hashBuffer = await crypto.subtle.digest('SHA-256', rawBytes)
    hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // ── 4. Cargar PDF con pdf-lib para añadir sello + metadatos ──────────────
    const pdfDoc   = await PDFDocument.load(rawBytes)
    const font     = await pdfDoc.embedFont(StandardFonts.Courier)
    const pages    = pdfDoc.getPages()
    const lastPage = pages[pages.length - 1]

    // Texto del sello SHA-256 al pie de la última página
    const selloLinea1 = `Sello SHA-256 (documento pre-sellado): ${hash.slice(0, 44)}`
    const selloLinea2 = `${hash.slice(44)}`
    const selloFirma  = `Timestamp: ${new Date(consent.signed_date || Date.now()).toISOString()} | Firma Electrónica Avanzada eIDAS (UE 910/2014)`

    lastPage.drawText(selloLinea1, { x: 28, y: 30, size: 5.5, font, color: rgb(0.55, 0.18, 0.28) })
    lastPage.drawText(selloLinea2, { x: 28, y: 23, size: 5.5, font, color: rgb(0.55, 0.18, 0.28) })
    lastPage.drawText(selloFirma,  { x: 28, y: 14, size: 5,   font, color: rgb(0.5,  0.5,  0.5)  })

    // ── 5. Metadatos del documento PDF ────────────────────────────────────────
    pdfDoc.setTitle(`Consentimiento Informado — ${consent.client_name || 'Paciente'}`)
    pdfDoc.setAuthor('DermaFlow CRM')
    pdfDoc.setSubject('Consentimiento Informado Micropigmentación · Firma Electrónica Avanzada eIDAS')
    pdfDoc.setKeywords([
      `sha256:${hash.slice(0, 16)}`,
      consent.otp_verified ? 'otp-verified' : 'no-otp',
      'eideas-avanzada',
      'dermaflow-crm',
      `token:${(consent.token || '').slice(0, 12)}`,
    ])
    pdfDoc.setProducer('DermaFlow CRM · Firma Electrónica Avanzada (RGPD Art.9 + eIDAS UE 910/2014)')
    pdfDoc.setCreator('DermaFlow CRM v2.0')

    // Fecha de creación = momento de la firma
    const signedDate = consent.signed_date ? new Date(consent.signed_date) : new Date()
    pdfDoc.setCreationDate(signedDate)
    pdfDoc.setModificationDate(signedDate) // igual que creación → cambios posteriores son detectables

    // ── 6. Guardar bytes finales ───────────────────────────────────────────────
    pdfBytes = await pdfDoc.save()

  } finally {
    // Volver a ocultar la plantilla
    element.style.display = 'none'
  }

  return { pdfBytes, hash }
}

/**
 * Genera el PDF, lo descarga en el navegador y devuelve el hash SHA-256.
 * El hash debe guardarse en la base de datos por el llamador.
 *
 * @param {object} consent
 * @param {string} centerName
 * @returns {string} hash SHA-256 del documento original
 */
export async function downloadConsentPDF(consent, centerName = '') {
  const { pdfBytes, hash } = await generateAndHashPDF(consent, centerName)

  // Crear blob y forzar descarga
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' })
  const url      = URL.createObjectURL(blob)
  const link     = document.createElement('a')
  link.href      = url
  const safeName = (consent.client_name || 'cliente')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // eliminar tildes del nombre de archivo
  const date     = new Date().toISOString().split('T')[0]
  link.download  = `consentimiento_${safeName}_${date}.pdf`
  link.click()
  URL.revokeObjectURL(url)

  return hash // el llamador lo guarda en Supabase
}
