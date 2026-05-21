import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mockSupabase'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Modo demo: se activa si no hay credenciales reales configuradas
const isPlaceholder = !url || url.includes('placeholder') || url.includes('tu-proyecto') || key === 'tu-clave-anonima-aqui' || !key

export const IS_MOCK = isPlaceholder
export const supabase = isPlaceholder ? mockSupabase : createClient(url, key)
