// ConsentForm.jsx
// Formulario de consentimiento informado para micropigmentación.
// Flujo de firma: rellenar formulario → verificar OTP SMS → firmar y guardar.
// Implementa Firma Electrónica Avanzada según eIDAS (UE 910/2014).

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, IS_MOCK } from '@/lib/supabase'
import { sendConsentConfirmation } from '@/lib/email'
import { generateAndHashPDF } from '@/lib/pdf'
import SignaturePad from '@/components/SignaturePad'
import OTPVerification from '@/components/OTPVerification'
import {
  Sparkles, CheckCircle2, Loader2, AlertCircle,
  ChevronDown, ChevronUp, ShieldCheck, MessageSquare,
} from 'lucide-react'

// URLs de las Edge Functions de Supabase
const SEND_OTP_URL   = 'https://qdbjhtohrfiogwwcydca.supabase.co/functions/v1/send-otp'
const VERIFY_OTP_URL = 'https://qdbjhtohrfiogwwcydca.supabase.co/functions/v1/verify-otp'

const TREATMENT_LABELS = {
  cejas: 'Cejas', labios: 'Labios', eyeliner: 'Eyeliner',
  areola: 'Areola', capilar: 'Capilar', otro: 'Otro',
}

const TREATMENTS = [
  { value: 'cejas',    label: 'Cejas'    },
  { value: 'labios',   label: 'Labios'   },
  { value: 'eyeliner', label: 'Eyeliner' },
  { value: 'areola',   label: 'Areola'   },
  { value: 'capilar',  label: 'Capilar'  },
  { value: 'otro',     label: 'Otro'     },
]

// --- Componentes de UI reutilizables ---

function Section({ title, children, number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="bg-rose-50 px-5 py-3 border-b border-rose-100">
        <h2 className="font-semibold text-rose-700 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
            {number}
          </span>
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function Checkbox({ checked, onChange, children }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer" onClick={onChange}>
      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
        checked ? 'bg-rose-500 border-rose-500' : 'border-gray-300 bg-white'
      }`}>
        {checked && (
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-gray-700 pt-0.5">{children}</span>
    </label>
  )
}

const INPUT    = 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 bg-white text-gray-900'
const TEXTAREA = `${INPUT} resize-none`

// --- Componente principal ---

export default function ConsentForm() {
  const { token } = useParams()

  // Estado del formulario
  const [consent,       setConsent]       = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(false)
  const [submitted,     setSubmitted]     = useState(false)
  const [submitError,   setSubmitError]   = useState(null)
  const [legalOpen,     setLegalOpen]     = useState(false)
  const [signature,     setSignature]     = useState(null)
  const [clientIP,      setClientIP]      = useState('')
  const [rgpdAccepted,  setRgpdAccepted]  = useState(false)

  // Estado del flujo OTP
  // Pasos: 'form' → 'sending_otp' → 'otp' → 'signing' → (submitted)
  const [step,          setStep]          = useState('form')
  const [otpPhone,      setOtpPhone]      = useState('')  // teléfono enmascarado
  const [otpMeta,       setOtpMeta]       = useState(null) // metadatos OTP para el PDF
  const [viewConsent,   setViewConsent]   = useState(null) // datos para la plantilla PDF oculta

  const [form, setForm] = useState({
    client_name:                 '',
    client_dni:                  '',
    client_birth_date:           '',
    client_phone:                '',
    client_email:                '',
    client_address:              '',
    treatment_type:              '',
    allergies:                   '',
    medical_conditions:          '',
    medications:                 '',
    pregnant_or_breastfeeding:   false,
    previous_treatments:         false,
    previous_treatments_details: '',
  })

  // Capturar IP del cliente para auditoría
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setClientIP(d.ip || ''))
      .catch(() => {})
  }, [])

  // Cargar datos pre-rellenados del consentimiento
  useEffect(() => {
    async function fetchConsent() {
      const { data, error: err } = await supabase
        .from('consent_forms')
        .select('*')
        .eq('token', token)
        .single()

      if (err || !data) {
        setError(true)
      } else {
        setConsent(data)
        setForm({
          client_name:                 data.client_name                 || '',
          client_dni:                  data.client_dni                  || '',
          client_birth_date:           data.client_birth_date           || '',
          client_phone:                data.client_phone                || '',
          client_email:                data.client_email                || '',
          client_address:              data.client_address              || '',
          treatment_type:              data.treatment_type              || '',
          allergies:                   data.allergies                   || '',
          medical_conditions:          data.medical_conditions          || '',
          medications:                 data.medications                 || '',
          pregnant_or_breastfeeding:   data.pregnant_or_breastfeeding   || false,
          previous_treatments:         data.previous_treatments         || false,
          previous_treatments_details: data.previous_treatments_details || '',
        })
      }
      setLoading(false)
    }
    fetchConsent()
  }, [token])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── PASO 1: Validar formulario y enviar OTP ─────────────────────────────────

  const handleRequestOTP = async (e) => {
    e.preventDefault()

    // Validaciones mínimas
    if (!rgpdAccepted) {
      setSubmitError('Debes aceptar el tratamiento de datos personales y de salud para continuar.')
      return
    }
    if (!signature) {
      setSubmitError('Por favor, firma el documento antes de continuar.')
      return
    }
    if (!form.client_name.trim() || !form.client_dni.trim()) {
      setSubmitError('Por favor, completa los campos obligatorios (nombre y DNI).')
      return
    }
    if (!form.client_phone.trim()) {
      setSubmitError('El número de teléfono es obligatorio para verificar tu identidad por SMS.')
      return
    }

    setSubmitError(null)
    setStep('sending_otp')

    try {
      if (IS_MOCK) {
        // Modo demo: simular envío OTP sin llamar a Edge Function
        await new Promise(r => setTimeout(r, 800)) // simular latencia
        setOtpPhone('+34 6** *** **34')
        setStep('otp')
        return
      }

      // Llamada real a Edge Function send-otp
      const res = await fetch(SEND_OTP_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          consent_token: token,
          phone:         form.client_phone,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.sent) {
        setStep('form')
        setSubmitError(data.error || 'No se pudo enviar el SMS. Verifica el número de teléfono.')
        return
      }

      setOtpPhone(data.phone_masked || form.client_phone)
      setStep('otp')

    } catch (err) {
      console.error('Error enviando OTP:', err)
      setStep('form')
      setSubmitError('Error de conexión al enviar el SMS. Inténtalo de nuevo.')
    }
  }

  // ── PASO 2: Verificar OTP y firmar ─────────────────────────────────────────

  const handleVerifyOTP = async (code) => {
    if (IS_MOCK) {
      // Modo demo: solo acepta 123456
      if (code !== '123456') {
        throw new Error('Código incorrecto (modo demo: usa 123456)')
      }
      const mockMeta = {
        verified_at: new Date().toISOString(),
        phone:       form.client_phone || '+34 600 000 000',
        message_id:  'demo-mode',
      }
      setOtpMeta(mockMeta)
      await handleSign(mockMeta)
      return
    }

    // Llamada real a Edge Function verify-otp
    const res = await fetch(VERIFY_OTP_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        consent_token: token,
        otp_code:      code,
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.verified) {
      throw new Error(data.error || 'Código incorrecto. Inténtalo de nuevo.')
    }

    // Guardar metadatos OTP para incluirlos en el PDF
    setOtpMeta({
      verified_at: data.verified_at,
      phone:       data.phone,
      message_id:  data.message_id,
    })

    // OTP correcto → proceder a firmar
    await handleSign(data)
  }

  // ── PASO 3: Guardar firma en Supabase + generar PDF + enviar email ─────────

  const handleSign = async (otpData = null) => {
    setStep('signing')
    const now = new Date().toISOString()

    try {
      const { error: err } = await supabase
        .from('consent_forms')
        .update({
          ...form,
          signature_data: signature,
          signed:         true,
          signed_date:    now,
          ip_address:     clientIP || null,
          user_agent:     navigator.userAgent || null,
          rgpd_accepted:  true,
        })
        .eq('token', token)

      if (err) {
        console.error('Error al guardar la firma:', err)
        setStep('otp')
        throw new Error('Error al guardar el consentimiento. Inténtalo de nuevo.')
      }

      // Construir objeto consent para la plantilla PDF con todos los datos disponibles
      const meta    = otpData || otpMeta
      const consentForPDF = {
        ...form,
        token,
        signature_data:   signature,
        signed:           true,
        signed_date:      now,
        ip_address:       clientIP || null,
        user_agent:       navigator.userAgent || null,
        rgpd_accepted:    true,
        otp_verified:     !!meta,
        otp_verified_at:  meta?.verified_at  || null,
        otp_phone:        meta?.phone        || null,
        otp_provider_id:  meta?.message_id   || null,
        otp_sent_at:      null,
        pdf_hash:         null, // se calculará durante la generación
      }

      // Mostrar plantilla oculta para que html2canvas pueda renderizarla
      setViewConsent(consentForPDF)

      // Enviar email con PDF adjunto si hay dirección de email
      if (form.client_email) {
        // Esperar a que React renderice la plantilla en el DOM
        await new Promise(r => setTimeout(r, 450))

        try {
          const { pdfBytes } = await generateAndHashPDF(consentForPDF, '')

          // Convertir Uint8Array → base64
          let binary = ''
          for (let i = 0; i < pdfBytes.length; i++) {
            binary += String.fromCharCode(pdfBytes[i])
          }
          const pdfBase64   = btoa(binary)
          const safeName    = form.client_name.replace(/\s+/g, '_').toLowerCase()
          const pdfFilename = `consentimiento_${safeName}_${now.slice(0, 10)}.pdf`

          await sendConsentConfirmation({
            clientEmail:   form.client_email,
            clientName:    form.client_name,
            treatmentType: form.treatment_type,
            centerName:    '',
            signedDate:    now,
            pdfBase64,
            pdfFilename,
          })
        } catch (pdfErr) {
          // El PDF falla silenciosamente — la firma ya está guardada
          console.warn('No se pudo generar/enviar el PDF adjunto:', pdfErr)
          // Intentar enviar email sin adjunto como fallback
          sendConsentConfirmation({
            clientEmail:   form.client_email,
            clientName:    form.client_name,
            treatmentType: form.treatment_type,
            centerName:    '',
            signedDate:    now,
          }).catch(() => {})
        }
      }

      setSubmitted(true)

    } catch (err) {
      setStep('otp')
      throw err
    }
  }

  // ── Reenviar OTP ────────────────────────────────────────────────────────────

  const handleResendOTP = async () => {
    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      return
    }

    const res = await fetch(SEND_OTP_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        consent_token: token,
        phone:         form.client_phone,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.sent) {
      throw new Error(data.error || 'No se pudo reenviar el SMS.')
    }
  }

  // ── VISTAS DE ESTADO ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  if (error || !consent) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-gray-100">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="font-bold text-gray-900 text-lg mb-2">Enlace no válido</h2>
          <p className="text-sm text-gray-500">
            Este enlace de consentimiento no existe o ha caducado. Contacta con tu profesional.
          </p>
        </div>
      </div>
    )
  }

  // Ya firmado anteriormente
  if (consent.signed || submitted) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="font-bold text-gray-900 text-xl mb-2">¡Consentimiento firmado!</h2>
          <p className="text-sm text-gray-500">
            Tu consentimiento informado ha sido registrado correctamente. Gracias por tu confianza 💕
          </p>
          {consent.signed_date && (
            <p className="text-xs text-gray-400 mt-3">
              Firmado el{' '}
              {new Date(consent.signed_date).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          )}
          {consent.otp_verified && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-blue-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              Identidad verificada por SMS ✓
            </div>
          )}
          {form.client_email && (
            <p className="text-xs text-gray-400 mt-2">
              Se ha enviado confirmación a {form.client_email}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Pantalla de envío OTP (loading)
  if (step === 'sending_otp') {
    return (
      <div className="min-h-screen bg-[#f9f5f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-gray-100">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin mx-auto mb-4" />
          <h2 className="font-bold text-gray-900 text-lg mb-2">Enviando código SMS...</h2>
          <p className="text-sm text-gray-500">
            Estamos enviando un código de verificación al número{' '}
            <span className="font-semibold">{form.client_phone}</span>
          </p>
        </div>
      </div>
    )
  }

  // Pantalla de verificación OTP
  if (step === 'otp') {
    return (
      <OTPVerification
        phoneMasked={otpPhone}
        onVerified={handleVerifyOTP}
        onResend={handleResendOTP}
        isMock={IS_MOCK}
      />
    )
  }

  // Pantalla de guardado (signing)
  if (step === 'signing') {
    return (
      <div className="min-h-screen bg-[#f9f5f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-gray-100">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin mx-auto mb-4" />
          <h2 className="font-bold text-gray-900 text-lg mb-2">Registrando firma...</h2>
          <p className="text-sm text-gray-500">Guardando tu consentimiento de forma segura.</p>
        </div>
      </div>
    )
  }

  // ── Formulario principal ────────────────────────────────────────────────────

  const canContinue = (
    !submitError && !!signature &&
    form.client_name.trim() &&
    form.client_dni.trim() &&
    form.client_phone.trim() &&
    rgpdAccepted
  )

  return (
    <div className="min-h-screen bg-[#f9f5f5]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-5 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Consentimiento Informado</h1>
          <p className="text-sm text-gray-500 mt-0.5">Micropigmentación</p>
          {form.client_name && (
            <p className="text-sm text-rose-500 font-medium mt-2">
              Hola, {form.client_name.split(' ')[0]} 👋
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleRequestOTP} className="max-w-xl mx-auto px-4 py-6 space-y-4 pb-10">

        {/* Info del tratamiento (colapsable) */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => setLegalOpen(!legalOpen)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-sm font-semibold text-gray-700">ℹ️ Información sobre el tratamiento</span>
            {legalOpen
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
            }
          </button>
          {legalOpen && (
            <div className="px-5 pb-5 space-y-3 text-xs text-gray-600 leading-relaxed border-t border-gray-50">
              <p className="pt-3">
                La micropigmentación es una técnica de implantación de pigmentos en la capa superficial de la piel (epidermis) mediante un dispositivo con agujas, con fines estéticos o reconstructivos.
              </p>
              <p>
                <strong>Riesgos posibles:</strong> reacciones alérgicas al pigmento, infecciones si no se siguen los cuidados post-tratamiento, cambios en el color del pigmento con el tiempo, inflamación temporal y, en casos excepcionales, cicatrización queloidea.
              </p>
              <p>
                <strong>Contraindicaciones:</strong> embarazo, lactancia, diabetes no controlada, enfermedades autoinmunes, anticoagulantes, enfermedades de piel en la zona, quimioterapia o radioterapia activa.
              </p>
              <p>
                <strong>Cuidados posteriores:</strong> es fundamental seguir las instrucciones post-tratamiento para asegurar la correcta cicatrización y fijación del pigmento.
              </p>
            </div>
          )}
        </div>

        {/* 1. Datos personales */}
        <Section title="Datos personales" number="1">
          <div className="space-y-4">
            <Field label="Nombre completo" required>
              <input
                className={INPUT}
                value={form.client_name}
                onChange={e => set('client_name', e.target.value)}
                placeholder="Nombre y apellidos"
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="DNI / NIF" required>
                <input
                  className={INPUT}
                  value={form.client_dni}
                  onChange={e => set('client_dni', e.target.value)}
                  placeholder="12345678A"
                  required
                />
              </Field>
              <Field label="Fecha de nacimiento">
                <input
                  className={INPUT}
                  type="date"
                  value={form.client_birth_date}
                  onChange={e => set('client_birth_date', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono" required>
                <input
                  className={INPUT}
                  type="tel"
                  value={form.client_phone}
                  onChange={e => set('client_phone', e.target.value)}
                  placeholder="600 000 000"
                  required
                />
              </Field>
              <Field label="Email">
                <input
                  className={INPUT}
                  type="email"
                  value={form.client_email}
                  onChange={e => set('client_email', e.target.value)}
                  placeholder="tu@email.com"
                />
              </Field>
            </div>

            <Field label="Dirección">
              <input
                className={INPUT}
                value={form.client_address}
                onChange={e => set('client_address', e.target.value)}
                placeholder="Calle, número, ciudad"
              />
            </Field>
          </div>
        </Section>

        {/* 2. Tratamiento */}
        <Section title="Tratamiento" number="2">
          <Field label="Tipo de tratamiento">
            <select
              className={INPUT}
              value={form.treatment_type}
              onChange={e => set('treatment_type', e.target.value)}
            >
              <option value="">Selecciona el tratamiento</option>
              {TREATMENTS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
        </Section>

        {/* 3. Información médica */}
        <Section title="Información médica" number="3">
          <div className="space-y-4">
            <Field label="¿Tienes alguna alergia conocida?">
              <textarea
                className={TEXTAREA}
                rows={2}
                value={form.allergies}
                onChange={e => set('allergies', e.target.value)}
                placeholder="Escribe 'Ninguna' si no tienes alergias"
              />
            </Field>

            <Field label="¿Padeces alguna enfermedad o condición médica?">
              <textarea
                className={TEXTAREA}
                rows={2}
                value={form.medical_conditions}
                onChange={e => set('medical_conditions', e.target.value)}
                placeholder="Ej: diabetes, problemas de coagulación... o 'Ninguna'"
              />
            </Field>

            <Field label="¿Tomas algún medicamento actualmente?">
              <textarea
                className={TEXTAREA}
                rows={2}
                value={form.medications}
                onChange={e => set('medications', e.target.value)}
                placeholder="Lista de medicamentos o 'Ninguno'"
              />
            </Field>

            <div className="space-y-3">
              <Checkbox
                checked={form.pregnant_or_breastfeeding}
                onChange={() => set('pregnant_or_breastfeeding', !form.pregnant_or_breastfeeding)}
              >
                Estoy embarazada o en periodo de lactancia
              </Checkbox>

              <Checkbox
                checked={form.previous_treatments}
                onChange={() => set('previous_treatments', !form.previous_treatments)}
              >
                He tenido tratamientos de micropigmentación anteriores
              </Checkbox>

              {form.previous_treatments && (
                <div className="pl-9">
                  <textarea
                    className={TEXTAREA}
                    rows={2}
                    value={form.previous_treatments_details}
                    onChange={e => set('previous_treatments_details', e.target.value)}
                    placeholder="Describe los tratamientos previos..."
                  />
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* 4. Declaración */}
        <div className="bg-rose-50 rounded-2xl border border-rose-100 p-5 text-xs text-gray-600 leading-relaxed">
          <p>
            <strong className="text-rose-700">Declaración:</strong> Declaro que he sido informada de forma
            comprensible sobre el procedimiento de micropigmentación, sus posibles riesgos y complicaciones,
            así como los cuidados necesarios antes y después del tratamiento. He tenido la oportunidad de hacer
            preguntas y todas han sido respondidas a mi satisfacción.{' '}
            <strong>Autorizo voluntariamente la realización del tratamiento descrito.</strong>{' '}
            Soy consciente de que puedo revocar este consentimiento en cualquier momento antes del inicio del tratamiento.
          </p>
        </div>

        {/* 5. Consentimiento RGPD */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-blue-800">
              Protección de datos (RGPD) <span className="text-rose-500">*</span>
            </span>
          </div>
          <Checkbox checked={rgpdAccepted} onChange={() => setRgpdAccepted(!rgpdAccepted)}>
            <span>
              Autorizo el tratamiento de mis <strong>datos personales y de salud</strong> (categoría
              especial según RGPD Art. 9) por el responsable del centro, con la finalidad exclusiva de
              la prestación del servicio de micropigmentación. Conozco mis derechos de acceso,
              rectificación, supresión, portabilidad y oposición, ejercitables contactando con el
              profesional. Los datos se conservarán durante el tiempo legalmente necesario (mínimo 5 años).
            </span>
          </Checkbox>
        </div>

        {/* 6. Firma */}
        <Section title="Tu firma" number="4">
          <SignaturePad onChange={setSignature} />
        </Section>

        {/* Banner OTP informativo */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-700">
          <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
          <span>
            <strong>Verificación por SMS:</strong> al continuar recibirás un código de 6 dígitos en el
            teléfono indicado para confirmar tu identidad. Este paso convierte tu firma en una{' '}
            <strong>Firma Electrónica Avanzada</strong> según el Reglamento eIDAS (UE 910/2014).
          </span>
        </div>

        {/* Error */}
        {submitError && (
          <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* Botón principal */}
        <button
          type="submit"
          disabled={!canContinue}
          className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-sm shadow-rose-200 flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          Continuar — verificar por SMS
        </button>

        <p className="text-xs text-center text-gray-400 pb-4">
          Recibirás un SMS con el código de verificación en el teléfono indicado.
          Firma electrónica avanzada · eIDAS UE 910/2014
        </p>
      </form>

      {/* Plantilla PDF oculta — se renderiza brevemente para generar el PDF adjunto */}
      <ConsentPDFTemplate consent={viewConsent} />
    </div>
  )
}

// ── Plantilla PDF (renderizada fuera de pantalla para html2canvas) ────────────

const TREATMENT_LABELS_PDF = {
  cejas: 'Cejas', labios: 'Labios', eyeliner: 'Eyeliner',
  areola: 'Areola', capilar: 'Capilar', otro: 'Otro',
}

function ConsentPDFTemplate({ consent }) {
  if (!consent) return null
  const signedDate = consent.signed_date
    ? new Date(consent.signed_date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
    : ''

  return (
    <div
      id="consent-pdf-template"
      style={{ display: 'none', width: '794px', background: '#fff', padding: '48px', fontFamily: 'Arial, sans-serif', color: '#111', fontSize: '13px', lineHeight: '1.5' }}
    >
      <div style={{ borderBottom: '2px solid #e11d48', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#be123c' }}>
          CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DE MICROPIGMENTACIÓN
        </h1>
        <p style={{ margin: '4px 0 0', color: '#666' }}>Fecha: {signedDate}</p>
      </div>

      <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#be123c', margin: '0 0 10px' }}>1. Datos de la paciente</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600', width: '30%' }}>Nombre completo</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_name || '—'}</td>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600', width: '20%' }}>DNI / NIF</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_dni || '—'}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Fecha nacimiento</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_birth_date || '—'}</td>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Teléfono</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_phone || '—'}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Email</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_email || '—'}</td>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Tratamiento</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{TREATMENT_LABELS_PDF[consent.treatment_type] || consent.treatment_type || '—'}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#be123c', margin: '0 0 10px' }}>2. Información médica</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr><td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600', width: '35%' }}>Alergias</td><td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.allergies || 'Ninguna'}</td></tr>
          <tr><td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Condiciones médicas</td><td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.medical_conditions || 'Ninguna'}</td></tr>
          <tr><td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Medicamentos</td><td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.medications || 'Ninguno'}</td></tr>
          <tr><td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Embarazo/lactancia</td><td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.pregnant_or_breastfeeding ? 'SÍ' : 'No'}</td></tr>
          <tr><td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Tratamientos previos</td><td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.previous_treatments ? `Sí — ${consent.previous_treatments_details || ''}` : 'No'}</td></tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#be123c', margin: '0 0 10px' }}>3. Declaración y firma</h2>
      <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '6px', padding: '12px', marginBottom: '16px', fontSize: '11px', fontStyle: 'italic' }}>
        Declaro haber sido informada del procedimiento, riesgos y cuidados del tratamiento de micropigmentación. Autorizo voluntariamente su realización.
      </div>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          {consent.signature_data && (
            <img src={consent.signature_data} alt="Firma" style={{ width: '100%', maxWidth: '280px', border: '1px solid #ddd', borderRadius: '4px' }} />
          )}
          <div style={{ borderTop: '1px solid #333', paddingTop: '6px', marginTop: '8px' }}>
            <p style={{ margin: 0, fontSize: '12px' }}>{consent.client_name}</p>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>Fecha y hora de firma:</p>
          <p style={{ margin: '0 0 4px', fontWeight: '600' }}>{signedDate}</p>
          <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#166534' }}>✓ RGPD Art. 9 aceptado</p>
          {consent.otp_verified && <p style={{ margin: 0, fontSize: '11px', color: '#1e40af' }}>✓ Identidad verificada por SMS</p>}
        </div>
      </div>

      <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#be123c', margin: '0 0 10px' }}>4. Auditoría digital</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
        <tbody>
          <tr><td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600', width: '35%', fontSize: '12px' }}>ID documento</td><td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', fontSize: '10px', fontFamily: 'monospace' }}>{consent.token}</td></tr>
          <tr><td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600', fontSize: '12px' }}>IP de firma</td><td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', fontSize: '11px' }}>{consent.ip_address || '—'}</td></tr>
          <tr><td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600', fontSize: '12px' }}>Dispositivo</td><td style={{ padding: '5px 8px', borderBottom: '1px solid #eee', fontSize: '10px', wordBreak: 'break-word' }}>{consent.user_agent || '—'}</td></tr>
          <tr><td style={{ padding: '5px 8px', background: '#eff6ff', fontWeight: '600', fontSize: '12px', color: '#1e40af' }}>Verificación OTP SMS</td><td style={{ padding: '5px 8px', borderBottom: '1px solid #dbeafe', fontSize: '11px', color: consent.otp_verified ? '#166534' : '#6b7280' }}>{consent.otp_verified ? `✓ Verificado — ${consent.otp_phone || ''} — ${consent.otp_verified_at ? new Date(consent.otp_verified_at).toLocaleString('es-ES') : ''}` : 'No aplicado'}</td></tr>
          {consent.otp_provider_id && <tr><td style={{ padding: '5px 8px', background: '#eff6ff', fontWeight: '600', fontSize: '12px', color: '#1e40af' }}>ID mensaje SMS</td><td style={{ padding: '5px 8px', borderBottom: '1px solid #dbeafe', fontSize: '10px', fontFamily: 'monospace' }}>{consent.otp_provider_id}</td></tr>}
        </tbody>
      </table>

      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #eee', fontSize: '10px', color: '#999', textAlign: 'center' }}>
        DermaFlow CRM · Firma Electrónica Avanzada · eIDAS (UE 910/2014) · LOPD/RGPD
      </div>
    </div>
  )
}
