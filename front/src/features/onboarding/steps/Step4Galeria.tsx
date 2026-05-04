import { useRef } from 'react'
import { Badge, Btn, Card } from '../../../components/primitives'

type Props = {
  files: File[]
  onChange: (files: File[]) => void
}

export default function Step4Galeria({ files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const next = [...files, ...Array.from(incoming)].slice(0, 3)
    onChange(next)
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <h2 style={{ margin: 0 }}>Galería</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge tone="default">{files.length}/3 fotos</Badge>
        <Btn kind="outline" onClick={() => inputRef.current?.click()}>
          Añadir fotos
        </Btn>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => addFiles(e.target.files)} />

      <Card style={{ borderStyle: 'dashed', borderWidth: 2 }} onClick={() => inputRef.current?.click()}>
        <div style={{ textAlign: 'center', color: 'var(--lw-text-3)' }}>Arrastra imágenes o haz click para subir</div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {files.map((file, idx) => (
          <Card key={`${file.name}-${idx}`} padding={8}>
            <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
            <Btn kind="ghost" onClick={() => onChange(files.filter((_, i) => i !== idx))}>
              Eliminar
            </Btn>
          </Card>
        ))}
      </div>
    </div>
  )
}
