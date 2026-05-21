import { useRef, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPoint = useRef(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const logicalSize = useRef({ w: 600, h: 200 })

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas.parentElement
    const rect = parent.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = rect.width || 600
    const h = 200

    logicalSize.current = { w, h }

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPoint = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    drawing.current = true
    lastPoint.current = getPoint(e)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const point = getPoint(e)
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPoint.current = point
    if (isEmpty) setIsEmpty(false)
    onChange(canvas.toDataURL('image/png'))
  }

  const stopDrawing = () => {
    drawing.current = false
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, logicalSize.current.w, logicalSize.current.h)
    setIsEmpty(true)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Firma aquí <span className="text-rose-500">*</span>
        </span>
        {!isEmpty && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Borrar firma
          </button>
        )}
      </div>

      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block w-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {isEmpty && (
        <p className="text-xs text-center text-gray-400">
          ✍️ Desliza el dedo (o el ratón) para firmar
        </p>
      )}
    </div>
  )
}
