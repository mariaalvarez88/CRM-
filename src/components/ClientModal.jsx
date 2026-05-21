import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const TREATMENTS = [
  { value: 'cejas', label: 'Cejas' },
  { value: 'labios', label: 'Labios' },
  { value: 'eyeliner', label: 'Eyeliner' },
  { value: 'areola', label: 'Areola' },
  { value: 'capilar', label: 'Capilar' },
  { value: 'otro', label: 'Otro' },
]

const EMPTY = {
  full_name: '', center_id: '', phone: '', email: '',
  dni: '', birth_date: '', treatment_type: '', notes: '',
}

export default function ClientModal({ open, onClose, onSave, initial = null, centers = [], defaultCenterId = '' }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              full_name: initial.full_name || '',
              center_id: initial.center_id || '',
              phone: initial.phone || '',
              email: initial.email || '',
              dni: initial.dni || '',
              birth_date: initial.birth_date || '',
              treatment_type: initial.treatment_type || '',
              notes: initial.notes || '',
            }
          : { ...EMPTY, center_id: defaultCenterId }
      )
    }
  }, [open, initial, defaultCenterId])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.center_id) return
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-semibold text-gray-900">{initial ? 'Editar clienta' : 'Nueva clienta'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              placeholder="Nombre y apellidos"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Centro <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.center_id}
              onChange={(e) => set('center_id', e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm bg-white"
            >
              <option value="">Selecciona un centro</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="600 000 000"
                type="tel"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="email@ejemplo.com"
                type="email"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">DNI / NIF</label>
              <input
                value={form.dni}
                onChange={(e) => set('dni', e.target.value)}
                placeholder="12345678A"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de nacimiento</label>
              <input
                value={form.birth_date}
                onChange={(e) => set('birth_date', e.target.value)}
                type="date"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de tratamiento</label>
            <select
              value={form.treatment_type}
              onChange={(e) => set('treatment_type', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm bg-white"
            >
              <option value="">Sin especificar</option>
              {TREATMENTS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas internas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Notas sobre la clienta..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !form.full_name.trim() || !form.center_id}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-500 rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
