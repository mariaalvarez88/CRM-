import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import ClientModal from '@/components/ClientModal'
import { downloadConsentPDF } from '@/lib/pdf'
import {
  ArrowLeft, Send, Copy, Check, CheckCircle2, Clock, FileText,
  Phone, Mail, MapPin, CreditCard, Calendar, MessageCircle,
  Download, Pencil, Trash2, Plus, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

const TREATMENT_LABELS = {
  cejas: 'Cejas', labios: 'Labios', eyeliner: 'Eyeliner',
  areola: 'Areola', capilar: 'Capilar', otro: 'Otro',
}

// PDF template: hidden div captured with html2canvas
function ConsentPDFTemplate({ consent, centerName }) {
  if (!consent) return null
  const signedDate = consent.signed_date
    ? new Date(consent.signed_date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
    : ''

  return (
    <div
      id="consent-pdf-template"
      style={{ display: 'none', width: '794px', background: '#fff', padding: '48px', fontFamily: 'Arial, sans-serif', color: '#111', fontSize: '13px', lineHeight: '1.5' }}
    >
      {/* Header */}
      <div style={{ borderBottom: '2px solid #e11d48', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#be123c' }}>
          CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DE MICROPIGMENTACIÓN
        </h1>
        {centerName && <p style={{ margin: '4px 0 0', color: '#666' }}>{centerName}</p>}
        <p style={{ margin: '4px 0 0', color: '#666' }}>Fecha: {signedDate}</p>
      </div>

      {/* Personal data */}
      <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#be123c', margin: '0 0 10px' }}>
        1. Datos de la paciente
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600', width: '30%' }}>Nombre completo</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_name || '—'}</td>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600', width: '20%' }}>DNI / NIF</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_dni || '—'}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Fecha de nacimiento</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_birth_date || '—'}</td>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Teléfono</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_phone || '—'}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Email</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_email || '—'}</td>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Dirección</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.client_address || '—'}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Tratamiento</td>
            <td colSpan={3} style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>
              {TREATMENT_LABELS[consent.treatment_type] || consent.treatment_type || '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Medical info */}
      <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#be123c', margin: '0 0 10px' }}>
        2. Información médica
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600', width: '35%' }}>Alergias conocidas</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.allergies || 'Ninguna'}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Condiciones médicas</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.medical_conditions || 'Ninguna'}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Medicamentos actuales</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.medications || 'Ninguno'}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Embarazada / lactando</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>{consent.pregnant_or_breastfeeding ? 'SÍ' : 'No'}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', background: '#fef2f2', fontWeight: '600' }}>Tratamientos previos de micropigmentación</td>
            <td style={{ padding: '5px 8px', borderBottom: '1px solid #eee' }}>
              {consent.previous_treatments ? `Sí — ${consent.previous_treatments_details || 'sin detalles'}` : 'No'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Legal text */}
      <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#be123c', margin: '0 0 10px' }}>
        3. Consentimiento informado
      </h2>
      <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '6px', padding: '12px', marginBottom: '20px', fontSize: '12px', lineHeight: '1.6' }}>
        <p style={{ margin: '0 0 8px' }}>
          La micropigmentación es una técnica de implantación de pigmentos en la capa superficial de la piel (epidermis) mediante un dispositivo con agujas, con fines estéticos o reconstructivos.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Riesgos posibles:</strong> Reacciones alérgicas al pigmento, infecciones si no se siguen los cuidados post-tratamiento, cambios en el color del pigmento con el tiempo, inflamación temporal de la zona tratada y, en casos excepcionales, cicatrización queloidea.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Contraindicaciones:</strong> Embarazo, lactancia, diabetes no controlada, enfermedades autoinmunes, tratamientos con anticoagulantes, enfermedades de la piel en la zona a tratar, quimioterapia o radioterapia activa.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Cuidados posteriores:</strong> Es fundamental seguir las instrucciones de cuidado post-tratamiento proporcionadas para asegurar la correcta cicatrización y fijación del pigmento.
        </p>
      </div>

      {/* Declaration */}
      <div style={{ marginBottom: '24px', fontSize: '12px', fontStyle: 'italic' }}>
        <p>
          Declaro que he sido informada de forma comprensible sobre el procedimiento de micropigmentación, sus posibles riesgos y complicaciones, así como los cuidados necesarios antes y después del tratamiento. He tenido la oportunidad de hacer preguntas y todas han sido respondidas a mi satisfacción. Autorizo voluntariamente la realización del tratamiento descrito.
        </p>
      </div>

      {/* Signature */}
      <h2 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#be123c', margin: '0 0 12px' }}>
        4. Firma de la paciente
      </h2>
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          {consent.signature_data && (
            <img src={consent.signature_data} alt="Firma" style={{ width: '100%', maxWidth: '300px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff' }} />
          )}
          <div style={{ borderTop: '1px solid #333', paddingTop: '6px', marginTop: '8px' }}>
            <p style={{ margin: 0, fontSize: '12px' }}>{consent.client_name}</p>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>Fecha y hora de firma:</p>
          <p style={{ margin: '0 0 4px', fontWeight: '600' }}>{signedDate}</p>
          <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>✓ Consentimiento firmado digitalmente</p>
        </div>
      </div>

      <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #eee', fontSize: '10px', color: '#999', textAlign: 'center' }}>
        Documento generado con DermaFlow CRM · Los datos están protegidos según la LOPD/RGPD
      </div>
    </div>
  )
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [editClient, setEditClient] = useState(false)
  const [copied, setCopied] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [viewConsent, setViewConsent] = useState(null)

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
  })

  const { data: consents = [] } = useQuery({
    queryKey: ['consents', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('consent_forms').select('*').eq('client_id', id).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: centers = [] } = useQuery({
    queryKey: ['centers'],
    queryFn: async () => {
      const { data } = await supabase.from('centers').select('*')
      return data || []
    },
  })

  const { data: center } = useQuery({
    queryKey: ['center', client?.center_id],
    enabled: !!client?.center_id,
    queryFn: async () => {
      const { data } = await supabase.from('centers').select('*').eq('id', client.center_id).single()
      return data
    },
  })

  const updateClient = useMutation({
    mutationFn: async (form) => {
      const { error } = await supabase.from('clients').update(form).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] })
      toast.success('Clienta actualizada')
    },
  })

  const deleteClient = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      navigate(client?.center_id ? `/center/${client.center_id}` : '/')
      toast.success('Clienta eliminada')
    },
  })

  const generateConsentLink = async () => {
    setGenerating(true)
    try {
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
      const { error } = await supabase.from('consent_forms').insert({
        user_id: user.id,
        client_id: id,
        center_id: client.center_id || null,
        token,
        client_name: client.full_name,
        client_email: client.email || '',
        client_phone: client.phone || '',
        client_dni: client.dni || '',
        client_birth_date: client.birth_date || null,
        treatment_type: client.treatment_type || '',
        signed: false,
      })
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['consents', id] })
      const link = `${window.location.origin}/consent/${token}`
      await navigator.clipboard.writeText(link)
      toast.success('Enlace creado y copiado al portapapeles')
    } catch {
      toast.error('Error al generar el enlace')
    } finally {
      setGenerating(false)
    }
  }

  const copyLink = async (token) => {
    const link = `${window.location.origin}/consent/${token}`
    await navigator.clipboard.writeText(link)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Enlace copiado')
  }

  const openWhatsApp = (consent) => {
    const link = `${window.location.origin}/consent/${consent.token}`
    const msg = encodeURIComponent(
      `Hola ${consent.client_name || 'clienta'}, te enviamos el formulario de consentimiento informado para tu tratamiento de micropigmentación. Por favor, ábrelo desde tu móvil y complétalo con tu firma:\n\n${link}\n\nGracias 💕`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const handleDownloadPDF = async (consent) => {
    setDownloading(consent.id)
    setViewConsent(consent)
    // Small delay to let React render the hidden template
    setTimeout(async () => {
      await downloadConsentPDF(consent, center?.name || '')
      setDownloading(null)
    }, 300)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!client) return <p className="text-gray-500 text-center py-16">Clienta no encontrada</p>

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(client.center_id ? `/center/${client.center_id}` : '/clients')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      {/* Client header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-rose-500">
                {client.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{client.full_name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {center && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                    {center.name}
                  </span>
                )}
                {client.treatment_type && (
                  <span className="text-xs bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full font-medium">
                    {TREATMENT_LABELS[client.treatment_type]}
                  </span>
                )}
                {client.consent_signed ? (
                  <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Consentimiento firmado
                  </span>
                ) : (
                  <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pendiente de firma
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setEditClient(true)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`¿Eliminar a ${client.full_name}?`)) deleteClient.mutate()
              }}
              className="p-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 pt-4 border-t border-gray-50">
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />{client.phone}
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />{client.email}
            </a>
          )}
          {client.dni && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600 p-2">
              <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />{client.dni}
            </div>
          )}
          {client.birth_date && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600 p-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {new Date(client.birth_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
          {client.notes && (
            <div className="sm:col-span-2 p-2">
              <p className="text-sm text-gray-500 italic">{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Consent section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" />
            Consentimientos informados
          </h2>
          <button
            onClick={generateConsentLink}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
          >
            {generating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Crear enlace
              </>
            )}
          </button>
        </div>

        {consents.length === 0 ? (
          <div className="text-center py-8">
            <Send className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500 mb-1">Sin consentimientos todavía</p>
            <p className="text-xs text-gray-400">Crea un enlace y envíalo por WhatsApp a la clienta</p>
          </div>
        ) : (
          <div className="space-y-2">
            {consents.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {c.signed ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {c.signed ? 'Firmado' : 'Pendiente de firma'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {c.signed
                      ? `Firmado el ${new Date(c.signed_date).toLocaleDateString('es-ES')}`
                      : `Creado el ${new Date(c.created_at).toLocaleDateString('es-ES')}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!c.signed && (
                    <button
                      onClick={() => openWhatsApp(c)}
                      title="Enviar por WhatsApp"
                      className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => copyLink(c.token)}
                    title="Copiar enlace"
                    className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {copied === c.token ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {c.signed && (
                    <button
                      onClick={() => handleDownloadPDF(c)}
                      disabled={downloading === c.id}
                      title="Descargar PDF"
                      className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      {downloading === c.id ? (
                        <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <a
                    href={`/consent/${c.token}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Ver formulario"
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden PDF template */}
      <ConsentPDFTemplate consent={viewConsent} centerName={center?.name || ''} />

      {/* Edit modal */}
      <ClientModal
        open={editClient}
        onClose={() => setEditClient(false)}
        initial={client}
        centers={centers}
        onSave={(form) => updateClient.mutateAsync(form)}
      />
    </div>
  )
}
