import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import CenterModal from '@/components/CenterModal'
import { Plus, MapPin, Phone, Users, Pencil, Trash2, Building2, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function Centers() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'new' | center object

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['centers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centers').select('*').order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('id, center_id, consent_signed')
      if (error) throw error
      return data
    },
  })

  const createCenter = useMutation({
    mutationFn: async (form) => {
      const { error } = await supabase.from('centers').insert({ ...form, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centers'] })
      toast.success('Centro creado correctamente')
    },
    onError: () => toast.error('Error al crear el centro'),
  })

  const updateCenter = useMutation({
    mutationFn: async ({ id, ...form }) => {
      const { error } = await supabase.from('centers').update(form).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centers'] })
      toast.success('Centro actualizado')
    },
    onError: () => toast.error('Error al actualizar'),
  })

  const deleteCenter = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('centers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centers'] })
      qc.invalidateQueries({ queryKey: ['clients-summary'] })
      toast.success('Centro eliminado')
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const handleDelete = (center) => {
    if (!window.confirm(`¿Eliminar el centro "${center.name}"? Se desvinculará de sus clientas.`)) return
    deleteCenter.mutate(center.id)
  }

  const totalClients = clients.length
  const totalSigned = clients.filter((c) => c.consent_signed).length
  const totalPending = totalClients - totalSigned

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis centros</h1>
          <p className="text-sm text-gray-500 mt-0.5">{centers.length} centro{centers.length !== 1 ? 's' : ''} registrado{centers.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-rose-200"
        >
          <Plus className="w-4 h-4" />
          Añadir centro
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Centros', value: centers.length, color: 'bg-rose-50 text-rose-600', icon: Building2 },
          { label: 'Con consentimiento', value: totalSigned, color: 'bg-green-50 text-green-600', icon: CheckCircle2 },
          { label: 'Pendientes', value: totalPending, color: 'bg-amber-50 text-amber-600', icon: Clock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`${color} rounded-2xl p-4 text-center`}>
            <Icon className="w-5 h-5 mx-auto mb-1 opacity-70" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium opacity-80 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {centers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">Aún no tienes centros</h3>
          <p className="text-sm text-gray-400 mb-4">Añade tu primer centro de micropigmentación</p>
          <button
            onClick={() => setModal('new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-xl hover:bg-rose-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Añadir centro
          </button>
        </div>
      )}

      {/* Centers grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {centers.map((center) => {
          const centerClients = clients.filter((c) => c.center_id === center.id)
          const signed = centerClients.filter((c) => c.consent_signed).length
          return (
            <div
              key={center.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-rose-100 transition-all cursor-pointer group"
              onClick={() => navigate(`/center/${center.id}`)}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-rose-500" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setModal(center) }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(center) }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 pr-2">{center.name}</h3>

              {center.address && (
                <div className="flex items-start gap-1.5 text-xs text-gray-400 mb-1">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{center.address}</span>
                </div>
              )}
              {center.phone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{center.phone}</span>
                </div>
              )}

              {/* Footer stats */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{centerClients.length} clienta{centerClients.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {centerClients.length > 0 && (
                    <span className="text-xs text-green-600 font-medium">{signed} firmado{signed !== 1 ? 's' : ''}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-rose-400 transition-colors" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      <CenterModal
        open={modal !== null}
        onClose={() => setModal(null)}
        initial={modal !== 'new' ? modal : null}
        onSave={async (form) => {
          if (modal === 'new') {
            await createCenter.mutateAsync(form)
          } else {
            await updateCenter.mutateAsync({ id: modal.id, ...form })
          }
        }}
      />
    </div>
  )
}
