import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function downloadConsentPDF(consent, centerName = '') {
  const element = document.getElementById('consent-pdf-template')
  if (!element) return

  // Make the hidden element briefly visible for capture
  element.style.position = 'absolute'
  element.style.left = '-9999px'
  element.style.top = '0'
  element.style.display = 'block'

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')

    const pdfWidth = 210  // A4 mm
    const pdfHeight = 297 // A4 mm
    const canvasRatio = canvas.height / canvas.width
    const imgHeightMM = pdfWidth * canvasRatio

    if (imgHeightMM <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM)
    } else {
      // Multi-page
      let yOffset = 0
      while (yOffset < imgHeightMM) {
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfWidth, imgHeightMM)
        yOffset += pdfHeight
      }
    }

    const safeName = (consent.client_name || 'cliente').replace(/\s+/g, '_').toLowerCase()
    const date = new Date().toISOString().split('T')[0]
    pdf.save(`consentimiento_${safeName}_${date}.pdf`)
  } finally {
    element.style.display = 'none'
  }
}
