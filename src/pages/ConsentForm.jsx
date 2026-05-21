import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import SignaturePad from '@/components/SignaturePad'
import { Sparkles, CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

const TREATMENT_LABELS = {
  cejas: 'Cejas', labios: 'Labios', eyeliner: 'Eyeliner',
  areola: 'Areola', capilar: 'Capilar', otro: 'Otro',
}

const TREATMENTS = [
  { value: 'cejas', label: 'Cejas' }, { value: 'labios', label: 'Labios' },
  { value: 'eyeliner', label: 'Eyeliner' }, { value: 'areola', label: 'Areola' },
  { value: 'capilar', label: 'Capilar' }, { value: 'otro', label: 'Otro' },
]

function Section({ title, children, number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="bg-rose-50 px-5 py-3 border-b border-rose-100">
        <h2 className="font-semibold text-rose-700 text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{number}</span>
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

const INPUT = 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 bg-white text-gray-900'
const TEXTAREA = `${INPUT} resize-none`

export default function ConsentForm() {
  const { token } = useParams()
  const [consent, setConsent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [legalOpen, setLegalOpen] = useState(false)
  const [signature, setSignature] = useState(null)

  const [form, setForm] = useState({
    client_name: '', client_dni: '', client_birth_date: '', client_phone: '',
    client_email: '', client_address: '', treatment_type: '',
    allergies: '', medical_conditions: '', medications: '',
    pregnant_or_breastfeeding: false, previous_treatments: false,
    previous_treatments_details: '',
  })

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
          client_name: data.client_name || '',
          client_dni: data.client_dni || '',
          client_birth_date: data.client_birth_date || '',
          client_phone: data.client_phone || '',
          client_email: data.client_email || '',
          client_address: data.client_address || '',
          treatment_type: data.treatment_type || '',
          allergies: data.allergies || '',
          medical_conditions: data.medical_conditions || '',
          medications: data.medications || '',
          pregnant_or_breastfeeding: data.pregnant_or_breastfeeding || false,
          previous_treatments: data.previous_treatments || false,
          previous_treatments_details: data.previous_treatments_details || '',
        })
      }
      setLoading(false)
    }
    fetchConsent()
  }, [token])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!signature) {
      setSubmitError('Por favor, firma el documento antes de enviarlo.')
      return
    }
    if (!form.client_name.trim() || !form.client_dni.trim()) {
      setSubmitError('Por favor, completa los campos obligatorios (nombre y DNI).')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    const now = new Date().toISOString()
    const { error: err } = await supabase
      .from('consent_forms')
      .update({
        ...form,
        signature_data: signature,
        signed: true,
        signed_date: now,
      })
      .eq('token', token)

    if (err) {
      setSubmitError('Error al enviar el formulario. Inténtalo de nuevo.')
      setSubmitting(false)
    } else {
      setSubmitted(true)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
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

  // ── Error — invalid token ────────────────────────────────────────────────────
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

  // ── Already signed ───────────────────────────────────────────────────────────
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
              Firmado el {new Date(consent.signed_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────────────────
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
            <p className="text-sm text-rose-500 font-medium mt-2">Hola, {form.client_name.split(' ')[0]} 👋</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 py-6 space-y-4 pb-10">
        {/* Legal text (collapsible) */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => setLegalOpen(!legalOpen)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-sm font-semibold text-gray-700">ℹ️ Información sobre el tratamiento</span>
            {legalOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
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

        {/* 1. Personal data */}
        <Section title="Datos personales" number="1">
          <div className="space-y-4">
            <Field label="Nombre completo" required>
              <input className={INPUT} value={form.client_name} onChange={(e) => set('client_name', e.target.value)} placeholder="Nombre y apellidos" required />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="DNI / NIF" required>
                <input className={INPUT} value={form.client_dni} onChange={(e) => set('client_dni', e.target.value)} placeholder="12345678A" required />
              </Field>
              <Field label="Fecha de nacimiento">
                <input className={INPUT} type="date" value={form.client_birth_date} onChange={(e) => set('client_birth_date', e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono">
                <input className={INPUT} type="tel" value={form.client_phone} onChange={(e) => set('client_phone', e.target.value)} placeholder="600 000 000" />
              </Field>
              <Field label="Email">
                <input className={INPUT} type="email" value={form.client_email} onChange={(e) => set('client_email', e.target.value)} placeholder="tu@email.com" />
              </Field>
            </div>

            <Field label="Dirección">
              <input className={INPUT} value={form.client_address} onChange={(e) => set('client_address', e.target.value)} placeholder="Calle, número, ciudad" />
            </Field>
          </div>
        </Section>

        {/* 2. Treatment */}
        <Section title="Tratamiento" number="2">
          <Field label="Tipo de tratamiento">
            <select
              className={INPUT}
              value={form.treatment_type}
              onChange={(e) => set('treatment_type', e.target.value)}
            >
              <option value="">Selecciona el tratamiento</option>
              {TREATMENTS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
        </Section>

        {/* 3. Medical info */}
        <Section title="Información médica" number="3">
          <div className="space-y-4">
            <Field label="¿Tienes alguna alergia conocida?">
              <textarea
                className={TEXTAREA}
                rows={2}
                value={form.allergies}
                onChange={(e) => set('allergies', e.target.value)}
                placeholder="Escribe 'Ninguna' si no tienes alergias"
              />
            </Field>

            <Field label="¿Padeces alguna enfermedad o condición médica?">
              <textarea
                className={TEXTAREA}
                rows={2}
                value={form.medical_conditions}
                onChange={(e) => set('medical_conditions', e.target.value)}
                placeholder="Ej: diabetes, problemas de coagulación... o 'Ninguna'"
              />
            </Field>

            <Field label="¿Tomas algún medicamento actualmente?">
              <textarea
                className={TEXTAREA}
                rows={2}
                value={form.medications}
                onChange={(e) => set('medications', e.target.value)}
                placeholder="Lista de medicamentos o 'Ninguno'"
              />
            </Field>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  onClick={() => set('pregnant_or_breastfeeding', !form.pregnant_or_breastfeeding)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-colors ${
                    form.pregnant_or_breastfeeding
                      ? 'bg-rose-500 border-rose-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {form.pregnant_or_breastfeeding && (
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700 pt-0.5">Estoy embarazada o en periodo de lactancia</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  onClick={() => set('previous_treatments', !form.previous_treatments)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-colors ${
                    form.previous_treatments
                      ? 'bg-rose-500 border-rose-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {form.previous_treatments && (
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700 pt-0.5">He tenido tratamientos de micropigmentación anteriores</span>
              </label>

              {form.previous_treatments && (
                <div className="pl-9">
                  <textarea
                    className={TEXTAREA}
                    rows={2}
                    value={form.previous_treatments_details}
                    onChange={(e) => set('previous_treatments_details', e.target.value)}
                    placeholder="Describe los tratamientos previos..."
                  />
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* 4. Declaration */}
        <div className="bg-rose-50 rounded-2xl border border-rose-100 p-5 text-xs text-gray-600 leading-relaxed">
          <p>
            <strong className="text-rose-700">Declaración:</strong> Declaro que he sido informada de forma comprensible sobre el procedimiento de micropigmentación, sus posibles riesgos y complicaciones, así como los cuidados necesarios. He tenido la oportunidad de hacer preguntas y todas han sido respondidas a mi satisfacción. <strong>Autorizo voluntariamente la realización del tratamiento descrito.</strong>
          </p>
        </div>

        {/* 5. Signature */}
        <Section title="Tu firma" number="4">
          <SignaturePad onChange={setSignature} />
        </Section>

        {/* Error message */}
        {submitError && (
          <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting || !signature || !form.client_name.trim() || !form.client_dni.trim()}
          className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-sm shadow-rose-200 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            '✓ Firmar y enviar consentimiento'
          )}
        </button>

        <p className="text-xs text-center text-gray-400 pb-4">
          Al firmar aceptas el consentimiento informado. Tus datos están protegidos según la LOPD/RGPD.
        </p>
      </form>
    </div>
  )
}
