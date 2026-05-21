// Mock Supabase — usa localStorage para funcionar sin backend.
// Se activa automáticamente cuando no hay credenciales reales en .env

const DB_KEY   = 'dermaflow_db'
const AUTH_KEY = 'dermaflow_auth'

// ── localStorage helpers ──────────────────────────────────────────────────────

function getDB()              { try { return JSON.parse(localStorage.getItem(DB_KEY) || '{}') } catch { return {} } }
function getTable(t)          { return getDB()[t] || [] }
function setTable(t, rows)    { const db = getDB(); db[t] = rows; localStorage.setItem(DB_KEY, JSON.stringify(db)) }
function genId()              { return crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now().toString(36)) }

// ── Seed de datos de demo (solo la primera vez) ───────────────────────────────

function seed() {
  if (localStorage.getItem('dermaflow_seeded')) return

  setTable('centers', [
    { id: 'ctr-1', user_id: 'mock-uid', name: 'Centro Estética Marta',  address: 'Calle Mayor 15, Barcelona',         phone: '693 123 456', email: 'marta@centro.com',        notes: '',               created_at: '2026-01-15T10:00:00Z' },
    { id: 'ctr-2', user_id: 'mock-uid', name: 'Studio Beauty BCN',       address: 'Passeig de Gràcia 88, Barcelona',  phone: '611 987 654', email: 'info@studiobeauty.com',   notes: 'Centro premium',  created_at: '2026-02-10T10:00:00Z' },
  ])

  setTable('clients', [
    { id: 'cli-1', user_id: 'mock-uid', center_id: 'ctr-1', full_name: 'Ana García López',       phone: '654 321 987', email: 'ana.garcia@gmail.com',   dni: '12345678A', birth_date: '1990-05-20', treatment_type: 'cejas',    notes: 'Primera visita', consent_signed: true,  consent_date: '2026-03-10T11:30:00Z', created_at: '2026-03-01T09:00:00Z' },
    { id: 'cli-2', user_id: 'mock-uid', center_id: 'ctr-1', full_name: 'Laura Martínez Ruiz',    phone: '677 456 123', email: 'laura.m@hotmail.com',     dni: '87654321B', birth_date: '1985-11-03', treatment_type: 'labios',   notes: '',               consent_signed: false, consent_date: null,                   created_at: '2026-03-20T10:00:00Z' },
    { id: 'cli-3', user_id: 'mock-uid', center_id: 'ctr-2', full_name: 'Sofía Fernández Castro', phone: '699 111 222', email: 'sofia.f@gmail.com',       dni: '11223344C', birth_date: '1995-07-14', treatment_type: 'eyeliner', notes: 'VIP',             consent_signed: false, consent_date: null,                   created_at: '2026-04-05T09:00:00Z' },
    { id: 'cli-4', user_id: 'mock-uid', center_id: 'ctr-2', full_name: 'Carmen Rodríguez Vega',  phone: '621 333 444', email: 'carmen.rv@yahoo.es',      dni: '',          birth_date: '',           treatment_type: 'areola',   notes: '',               consent_signed: false, consent_date: null,                   created_at: '2026-04-12T10:00:00Z' },
  ])

  setTable('consent_forms', [
    {
      id: 'csn-1', user_id: 'mock-uid', client_id: 'cli-1', center_id: 'ctr-1',
      token: 'demo-firmado',
      client_name: 'Ana García López', client_dni: '12345678A', client_email: 'ana.garcia@gmail.com',
      client_phone: '654 321 987', client_birth_date: '1990-05-20', client_address: 'Calle Provença 45, Barcelona',
      treatment_type: 'cejas', allergies: 'Ninguna', medical_conditions: 'Ninguna',
      medications: 'Ninguno', pregnant_or_breastfeeding: false, previous_treatments: false,
      previous_treatments_details: '', signature_data: null,
      ip_address: '93.188.45.12', user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', rgpd_accepted: true,
      // Campos Firma Electrónica Avanzada eIDAS (OTP + SHA-256)
      otp_verified: true, otp_verified_at: '2026-03-10T11:29:45Z',
      otp_phone: '+34654321987', otp_provider_id: 'SM_demo_ana_001', otp_sent_at: '2026-03-10T11:29:00Z',
      pdf_hash: 'a3f8c2e1d4b7f09621c85e3a917d6b40f2e8c1a95d3f7b206e4c8a1d5f9b3e7c',
      signed: true, signed_date: '2026-03-10T11:30:00Z', created_at: '2026-03-01T09:00:00Z',
    },
    {
      id: 'csn-2', user_id: 'mock-uid', client_id: 'cli-2', center_id: 'ctr-1',
      token: 'demo-pendiente',
      client_name: 'Laura Martínez Ruiz', client_dni: '87654321B', client_email: 'laura.m@hotmail.com',
      client_phone: '677 456 123', client_birth_date: '1985-11-03', client_address: '',
      treatment_type: 'labios', allergies: '', medical_conditions: '',
      medications: '', pregnant_or_breastfeeding: false, previous_treatments: false,
      previous_treatments_details: '', signature_data: null,
      ip_address: null, user_agent: null, rgpd_accepted: false,
      // Sin OTP ni hash (aún no firmado)
      otp_verified: false, otp_verified_at: null,
      otp_phone: null, otp_provider_id: null, otp_sent_at: null,
      pdf_hash: null,
      signed: false, signed_date: null, created_at: '2026-03-20T10:00:00Z',
    },
  ])

  // Tabla de registros OTP (vacía en seed — se crea en tiempo real)
  setTable('consent_otp', [])

  localStorage.setItem('dermaflow_seeded', '1')
}

// ── Mock Auth ─────────────────────────────────────────────────────────────────

const _listeners = []

const mockAuth = {
  async getSession() {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) return { data: { session: JSON.parse(raw) }, error: null }
    return { data: { session: null }, error: null }
  },

  onAuthStateChange(cb) {
    _listeners.push(cb)
    const raw = localStorage.getItem(AUTH_KEY)
    setTimeout(() => raw ? cb('SIGNED_IN', JSON.parse(raw)) : cb('SIGNED_OUT', null), 50)
    return {
      data: {
        subscription: {
          unsubscribe: () => { const i = _listeners.indexOf(cb); if (i !== -1) _listeners.splice(i, 1) }
        }
      }
    }
  },

  async signInWithPassword({ email, password }) {
    if (!email || !password) return { data: {}, error: { message: 'Rellena email y contraseña' } }
    const user = { id: 'mock-uid', email }
    const session = { user, access_token: 'mock-token' }
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    _listeners.forEach(fn => fn('SIGNED_IN', session))
    return { data: { user, session }, error: null }
  },

  async signOut() {
    localStorage.removeItem(AUTH_KEY)
    _listeners.forEach(fn => fn('SIGNED_OUT', null))
    return { error: null }
  },
}

// ── Query Builder ─────────────────────────────────────────────────────────────

class QB {
  constructor(table) {
    this._t        = table
    this._mode     = null
    this._filters  = []
    this._data     = null
    this._orderCol = null
    this._orderAsc = true
    this._single   = false
    this._maybe    = false
    this._limit    = null
  }

  select()          { this._mode = 'select';                       return this }
  insert(data)      { this._mode = 'insert'; this._data = data;    return this }
  update(data)      { this._mode = 'update'; this._data = data;    return this }
  delete()          { this._mode = 'delete';                       return this }
  eq(col, val)      { this._filters.push({ op: 'eq',  col, val }); return this }
  gt(col, val)      { this._filters.push({ op: 'gt',  col, val }); return this }
  lt(col, val)      { this._filters.push({ op: 'lt',  col, val }); return this }
  limit(n)          { this._limit = n;                              return this }
  order(col, o={})  { this._orderCol = col; this._orderAsc = o.ascending !== false; return this }
  single()          { this._single = true;                         return this }
  maybeSingle()     { this._single = true; this._maybe = true;     return this }

  then(res, rej)    { return this._run().then(res, rej) }

  _match(row) {
    return this._filters.every(f => {
      if (f.op === 'eq')  return row[f.col] === f.val
      if (f.op === 'gt')  return row[f.col] > f.val
      if (f.op === 'lt')  return row[f.col] < f.val
      return true
    })
  }

  _sort(rows) {
    if (!this._orderCol) return rows
    return [...rows].sort((a, b) => {
      const va = a[this._orderCol] ?? ''
      const vb = b[this._orderCol] ?? ''
      const cmp = String(va).localeCompare(String(vb), 'es', { numeric: true })
      return this._orderAsc ? cmp : -cmp
    })
  }

  async _run() {
    const rows = getTable(this._t)

    // ── SELECT ────────────────────────────────────────────────────────────────
    if (this._mode === 'select') {
      let result = this._sort(rows.filter(r => this._match(r)))
      if (this._limit !== null) result = result.slice(0, this._limit)
      if (this._single) {
        if (!result.length) {
          // maybeSingle devuelve null sin error; single devuelve error
          return this._maybe
            ? { data: null, error: null }
            : { data: null, error: { message: 'Not found' } }
        }
        return { data: result[0], error: null }
      }
      return { data: result, error: null }
    }

    // ── INSERT ────────────────────────────────────────────────────────────────
    if (this._mode === 'insert') {
      const authRaw = localStorage.getItem(AUTH_KEY)
      const userId  = authRaw ? (JSON.parse(authRaw)?.user?.id || 'mock-uid') : 'mock-uid'
      const items   = Array.isArray(this._data) ? this._data : [this._data]
      const inserted = items.map(row => ({ id: genId(), created_at: new Date().toISOString(), user_id: userId, ...row }))
      setTable(this._t, [...rows, ...inserted])
      return { data: inserted, error: null }
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    if (this._mode === 'update') {
      // Replica el trigger de Supabase: al firmar un consentimiento, actualizar la clienta
      if (this._t === 'consent_forms' && this._data?.signed === true) {
        rows.filter(r => this._match(r) && !r.signed).forEach(consent => {
          if (consent.client_id) {
            setTable('clients', getTable('clients').map(c =>
              c.id === consent.client_id
                ? { ...c, consent_signed: true, consent_date: this._data.signed_date }
                : c
            ))
          }
        })
      }
      const updated = rows.map(r => this._match(r) ? { ...r, ...this._data } : r)
      setTable(this._t, updated)
      return { data: updated, error: null }
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (this._mode === 'delete') {
      setTable(this._t, rows.filter(r => !this._match(r)))
      return { data: null, error: null }
    }

    return { data: null, error: { message: 'Modo desconocido' } }
  }
}

// ── Inicializar demo data y exportar ─────────────────────────────────────────

seed()

export const mockSupabase = {
  auth: mockAuth,
  from: (table) => new QB(table),
}
