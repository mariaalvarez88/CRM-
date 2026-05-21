import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import CenterModal from '@/components/CenterModal'
import ClientModal from '@/components/ClientModal'
import {
  ArrowLeft, Plus, Search, Pencil, Trash2, CheckCircle2, Clock,
  Phone, Mail, MapPin, ChevronRight, Users
} from 'lucide-react'
import { toast } from 'sonner'

const TREATMENT_LABELS = {
  cejas: 'Cejas', labios: 'Labios', eyeliner: 'Eyeliner',
  areola: 'Areola', capilar: 'Capilar', otro: 'Otro',
}

export default function CenterDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editCenter, setEditCenter] = useState(false)
  const [clientModal, setClientModal] = useState(null) // null | 'new' | client object

  const { data: center, isLoading: loadingCenter } = useQuery({
    queryKey: ['center', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('centers').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
  })

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('center_id', id).order('full_name')
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

  const updateCenter = useMutation({
    mutationFn: async (form) => {
      const { error } = await supabase.from('centers').update(form).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['center', id] })
      qc.invalidateQueries({ queryKey: ['centers'] })
      toast.success('Centro actualizado')
    },
  })

  const createClient = useMutation({
    mutationFn: async (form) => {
      const { error } = await supabase.from('clients').insert({ ...form, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', id] })
      qc.invalidateQueries({ queryKey: ['clients-summary'] })
      toast.success('Clienta añadida')
    },
  })

  const updateClient = useMutation({
    mutationFn: async ({ clientId, ...form }) => {
      const { error } = await supabase.from('clients').update(form).eq('id', clientId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', id] })
      toast.success('Clienta actualizada')
    },
  })

  const deleteClient = useMutation({
    mutationFn: async (clientId) => {
      const { error } = await supabase.from('clients').delete().eq('id', clientId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', id] })
      qc.invalidateQueries({ queryKey: ['clients-summary'] })
      toast.success('Clienta eliminada')
    },
  })

  const filtered = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loadingCenter) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!center) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Centro no encontrado</p>
        <button onClick={() => navigate('/')} className="mt-3 text-rose-500 text-sm font-medium hover:underline">
          Volver al inicio
        </button>
      </div>
    )
  }

  const signed = clients.filter((c) => c.consent_signed).length
  const pending = clients.length - signed

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a centros
      </button>

      {/* Center header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{center.name}</h1>
            <div className="mt-2 space-y-1">
              {center.address && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />{center.address}
                </div>
              )}
              {center.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />{center.phone}
                </div>
              )}
              {center.email && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />{center.email}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditCenter(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
        </div>

        {/* Mini stats */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{clients.length}</span> clientas
          </div>
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">{signed}</span> firmadas
          </div>
          {pending > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-amber-600">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{pending}</span> pendientes
            </div>
          )}
        </div>
      </div>

      {/* Clients section */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="font-semibold text-gray-900">Clientas</h2>
          <button
            onClick={() => setClientModal('new')}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva clienta
          </button>
        </div>

        {/* Search */}
        {clients.length > 0 && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
            />
          </div>
        )}

        {/* Empty state */}
        {clients.length === 0 && !loadingClients && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-600 mb-1">Sin clientas aún</p>
            <p className="text-sm text-gray-400 mb-4">Añade la primera clienta de este centro</p>
            <button
              onClick={() => setClientModal('new')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500 text-white text-sm font-medium rounded-xl hover:bg-rose-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nueva clienta
            </button>
          </div>
        )}

        {/* Client list */}
        {filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {filtered.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer group transition-colors"
                onClick={() => navigate(`/client/${client.id}`)}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-rose-500">
                    {client.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{client.full_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {client.phone && (
                      <span className="text-xs text-gray-400">{client.phone}</span>
                    )}
                    {client.treatment_type && (
                      <span className="text-xs text-gray-400">· {TREATMENT_LABELS[client.treatment_type]}</span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {client.consent_signed ? (
                    <span className="text-xs bg-green-50 text-green-600 font-medium px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Firmado
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-50 text-amber-600 font-medium px-2 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pendiente
                    </span>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setClientModal(client) }}
                      className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`¿Eliminar a ${client.full_name}?`)) {
                          deleteClient.mutate(client.id)
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-rose-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && clients.length > 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No se encontraron clientas con "{search}"
          </div>
        )}
      </div>

      {/* Modals */}
      <CenterModal
        open={editCenter}
        onClose={() => setEditCenter(false)}
        initial={center}
        onSave={(form) => updateCenter.mutateAsync(form)}
      />

      <ClientModal
        open={clientModal !== null}
        onClose={() => setClientModal(null)}
        initial={clientModal !== 'new' ? clientModal : null}
        centers={centers}
        defaultCenterId={id}
        onSave={async (form) => {
          if (clientModal === 'new') {
            await createClient.mutateAsync(form)
          } else {
            await updateClient.mutateAsync({ clientId: clientModal.id, ...form })
          }
        }}
      />
    </div>
  )
}
