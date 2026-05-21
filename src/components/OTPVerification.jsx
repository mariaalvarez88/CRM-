// OTPVerification.jsx
// Pantalla de verificación de identidad por SMS (OTP de 6 dígitos).
// Diseño mobile-first, compatible con autocompletado de iOS/Android.

import { useState, useRef, useEffect } from 'react'
import { ShieldCheck, Loader2, RotateCcw, AlertCircle, MessageSquare } from 'lucide-react'

export default function OTPVerification({ phoneMasked, onVerified, onResend, isMock }) {
  const [digits, setDigits]       = useState(['', '', '', '', '', ''])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [resendTimer, setResend]  = useState(60)
  const inputs = useRef([])

  // Foco en primer campo al montar + temporizador de reenvío
  useEffect(() => {
    inputs.current[0]?.focus()
    const tick = setInterval(() => setResend(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(tick)
  }, [])

  // Maneja escritura en cada caja
  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return             // solo dígitos
    const next = [...digits]
    next[i] = val
    setDigits(next)
    setError(null)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  // Backspace retrocede al campo anterior
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  // Pegar código completo (ej. desde el SMS en iOS/Android)
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputs.current[5]?.focus()
    }
  }

  // Llamar al callback de verificación
  const handleVerify = async () => {
    const code = digits.join('')
    if (code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      await onVerified(code)
    } catch (err) {
      setError(err.message || 'Código incorrecto. Inténtalo de nuevo.')
      setDigits(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  // Reenviar código
  const handleResend = async () => {
    setResend(60)
    setDigits(['', '', '', '', '', ''])
    setError(null)
    try {
      await onResend()
    } catch {
      setError('No se pudo reenviar el código. Inténtalo más tarde.')
    }
    inputs.current[0]?.focus()
  }

  const fullCode = digits.join('')

  return (
    <div className="min-h-screen bg-[#f9f5f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full">

        {/* Icono y título */}
        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Verificación de identidad
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Hemos enviado un código SMS al número{' '}
            <span className="font-semibold text-gray-800">{phoneMasked}</span>
          </p>

          {/* Banner modo demo */}
          {isMock && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              🔧 <strong>Modo demo</strong> — usa el código{' '}
              <span className="font-mono font-bold tracking-widest">1 2 3 4 5 6</span>
            </div>
          )}
        </div>

        {/* 6 cajas de dígito */}
        <div
          className="flex gap-2 justify-center mb-6"
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => (inputs.current[i] = el)}
              type="tel"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none transition-colors"
              style={{
                borderColor: error
                  ? '#fca5a5'
                  : d
                  ? '#e11d48'
                  : '#e5e7eb',
                color: '#111',
              }}
            />
          ))}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Botón verificar */}
        <button
          onClick={handleVerify}
          disabled={fullCode.length !== 6 || loading}
          className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-rose-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Verificar y firmar
            </>
          )}
        </button>

        {/* Reenvío */}
        <div className="mt-5 text-center">
          {resendTimer > 0 ? (
            <p className="text-xs text-gray-400">
              ¿No has recibido el SMS? Reenviar en{' '}
              <span className="font-semibold text-gray-600">{resendTimer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-600 mx-auto transition-colors font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reenviar código SMS
            </button>
          )}
        </div>

        {/* Nota legal */}
        <p className="mt-6 text-xs text-center text-gray-400 leading-relaxed">
          La verificación por SMS acredita tu identidad según{' '}
          <strong>eIDAS (UE 910/2014)</strong> para una firma electrónica avanzada.
        </p>
      </div>
    </div>
  )
}
