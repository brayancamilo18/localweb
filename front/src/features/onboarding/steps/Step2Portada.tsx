import { useRef, useState } from 'react'
import { Badge, Btn, Card } from '../../../components/primitives'

type Props = {
  cover?: File | null
  previewUrl?: string
  progress?: number
  onSelect: (file: File) => void
}

function getQualityLabel(width: number) {
  if (width >= 800) return 'optima'
  if (width >= 600) return 'buena'
  if (width >= 400) return 'aceptable'
  return 'baja'
}

export default function Step2Portada({ cover, previewUrl, progress = 0, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [quality, setQuality] = useState<{ tone: 'default' | 'success' | 'warning'; label: string }>({
    tone: 'default',
    label: 'Pendiente',
  })

  const pickFile = () => inputRef.current?.click()

  const handleFile = (file?: File) => {
    if (!file) return
    const image = new Image()
    image.onload = () => {
      const label = getQualityLabel(image.width)
      if (label === 'optima') setQuality({ tone: 'success', label: 'Calidad óptima' })
      else if (label === 'buena') setQuality({ tone: 'success', label: 'Calidad buena' })
      else if (label === 'aceptable') setQuality({ tone: 'warning', label: 'Calidad aceptable' })
      else setQuality({ tone: 'warning', label: 'Resolución baja' })
    }
    image.src = URL.createObjectURL(file)
    onSelect(file)
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <h2 style={{ margin: 0 }}>Sube una portada</h2>
      <Card
        style={{
          borderStyle: 'dashed',
          borderWidth: 2,
          textAlign: 'center',
          padding: 28,
        }}
        onClick={pickFile}
      >
        <div style={{ fontWeight: 600 }}>Arrastra una imagen o haz click</div>
        <div style={{ fontSize: 12, color: 'var(--lw-text-3)', marginTop: 6 }}>JPG o PNG recomendado</div>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn kind="outline" onClick={pickFile}>
          Seleccionar portada
        </Btn>
        <Badge tone={quality.tone}>{cover ? quality.label : 'Sin imagen'}</Badge>
      </div>

      {progress > 0 ? (
        <div style={{ height: 8, borderRadius: 999, background: 'var(--lw-surface)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--lw-accent)', transition: 'width .2s' }} />
        </div>
      ) : null}

      <Card>
        <h3 style={{ margin: '0 0 8px 0' }}>Preview</h3>
        {previewUrl ? (
          <img src={previewUrl} alt="Preview portada" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 240 }} />
        ) : (
          <div style={{ color: 'var(--lw-text-3)' }}>Todavía no hay imagen seleccionada.</div>
        )}
      </Card>
    </div>
  )
}

export { getQualityLabel }
