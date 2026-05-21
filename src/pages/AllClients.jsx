import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Search, CheckCircle2, Clock, ChevronRight, Users, Filter } from 'lucide-react'

const TREATMENT_LABELS = {
  cejas: 'Cejas', labios: 'Labios', eyeliner: 'Eyeliner',
  areola: 'Areola', capilar: 'Capilar', otro: 'Otro',
}

export default function AllClients() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterCenter, setFilterCenter] = useState('')
  const [filterConsent, setFilterConsent] = useState('')
  const [filterTreatment, setFilterTreatment] = useState('')

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['all-clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').order('full_name')
      if (error) throw error
      return data
    },
  })

  const { data: centers = [] } = useQuery({
    queryKey: ['centers'],
    queryFn: async () => {
      const { data } = await supabase.from('centers').select('*').order('name')
      return data || []
    },
  })

  const centerMap = Object.fromEntries(centers.map((c) => [c.id, c.name]))

  const filtered = clients.filter((c) => {
    const matchSearch =
      !search ||
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.dni || '').toLowerCase().includes(search.toLowerCase())

    const matchCenter = !filterCenter || c.center_id === filterCenter
    const matchConsent =
      !filterConsent ||
      (filterConsent === 'signed' && c.consent_signed) ||
      (filterConsent === 'pending' && !c.consent_signed)
    const matchTreatment = !filterTreatment || c.treatment_type === filterTreatment

    return matchSearch && matchCenter && matchConsent && matchTreatment
  })

  const hasFilters = search || filterCenter || filterConsent || filterTreatment
  const clearFilters = () => {
    setSearch('')
    setFilterCenter('')
    setFilterConsent('')
    setFilterTreatment('')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Todas las clientas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {clients.length} clienta{clients.length !== 1 ? 's' : ''} en total
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono, email, DNI..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Filtrar por:</span>
          </div>
          <select
            value={filterCenter}
            onChange={(e) => setFilterCenter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-rose-300"
          >
            <option value="">Todos los centros</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterConsent}
            onChange={(e) => setFilterConsent(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-rose-300"
          >
            <option value="">Cualquier estado</option>
            <option value="signed">Consentimiento firmado</option>
            <option value="pending">Pendiente de firma</option>
          </select>
          <select
            value={filterTreatment}
            onChange={(e) => setFilterTreatment(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-rose-300"
          >
            <option value="">Cualquier tratamiento</option>
            {Object.entries(TREATMENT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1.5"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && clients.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700">Aún no hay clientas</h3>
          <p className="text-sm text-gray-400 mt-1">Ve a un centro y añade la primera clienta</p>
        </div>
      )}

      {/* No results */}
      {!isLoading && clients.length > 0 && filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          No se encontraron clientas con los filtros actuales.{' '}
          <button onClick={clearFilters} className="text-rose-500 hover:underline">Limpiar</button>
        </div>
      )}

      {/* Results */}
      {filtered.length > 0 && (
        <>
          <p className="text-xs text-gray-400 font-medium">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            {hasFilters ? ' · filtrado' : ''}
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {filtered.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer group transition-colors"
                onClick={() => navigate(`/client/${client.id}`)}
              >
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-rose-500">
                    {client.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{client.full_name}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {client.center_id && centerMap[client.center_id] && (
                      <span className="text-xs text-gray-400">{centerMap[client.center_id]}</span>
                    )}
                    {client.treatment_type && (
                      <span className="text-xs text-gray-400">· {TREATMENT_LABELS[client.treatment_type]}</span>
                    )}
                    {client.phone && (
                      <span className="text-xs text-gray-400">· {client.phone}</span>
                    )}
                  </div>
                </div>

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
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-rose-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
