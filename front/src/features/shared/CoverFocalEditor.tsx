import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { Btn } from '../../components/primitives/primitives'
import './coverFocalEditor.css'

export type CoverFocalEditorProps = {
  imageUrl: string
  focalX: number
  focalY: number
  onFocalChange: (x: number, y: number) => void
  onSave: (x: number, y: number) => Promise<void>
  disabled?: boolean
}

function clampFocal(n: number): number {
  if (!Number.isFinite(n)) return 50
  return Math.max(0, Math.min(100, Math.round(n)))
}

export default function CoverFocalEditor({
  imageUrl,
  focalX,
  focalY,
  onFocalChange,
  onSave,
  disabled = false,
}: CoverFocalEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const x = draft?.x ?? focalX
  const y = draft?.y ?? focalY

  const setFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = frameRef.current
      if (!el || disabled) return
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const nextX = clampFocal(((clientX - rect.left) / rect.width) * 100)
      const nextY = clampFocal(((clientY - rect.top) / rect.height) * 100)
      setDraft({ x: nextX, y: nextY })
      onFocalChange(nextX, nextY)
      setDirty(true)
    },
    [disabled, onFocalChange],
  )

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromPointer(e.clientX, e.clientY)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return
    setFromPointer(e.clientX, e.clientY)
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const handleSave = async () => {
    if (disabled || saving) return
    const saveX = draft?.x ?? focalX
    const saveY = draft?.y ?? focalY
    setSaving(true)
    try {
      await onSave(saveX, saveY)
      setDraft(null)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="lw-cover-focal">
      <div className="lw-cover-focal__head">
        <div>
          <p className="lw-cover-focal__title">Encuadre en ordenador</p>
          <p className="lw-cover-focal__hint">
            Toca o arrastra sobre la vista previa para elegir qué parte de la foto se ve en pantallas anchas.
            La portada siempre llena el hero completo.
          </p>
        </div>
        {dirty ? (
          <Btn kind="primary" type="button" onClick={() => void handleSave()} disabled={saving || disabled}>
            {saving ? 'Guardando…' : 'Guardar encuadre'}
          </Btn>
        ) : null}
      </div>
      <div
        ref={frameRef}
        className="lw-cover-focal__frame"
        role="img"
        aria-label="Vista previa del encuadre de portada en ordenador"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          className="lw-cover-focal__img"
          src={imageUrl}
          alt=""
          draggable={false}
          style={{ objectPosition: `${x}% ${y}%` }}
        />
        <span className="lw-cover-focal__reticle" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden />
      </div>
    </div>
  )
}
