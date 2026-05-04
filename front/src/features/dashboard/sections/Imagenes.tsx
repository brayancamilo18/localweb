import { useCallback, useRef, useState, type DragEvent } from 'react'
import axios from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Btn, Card, Icon } from '../../../components/primitives/primitives'
import { uploadImage } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'

type Section = 'cover' | 'about' | 'gallery'

function DropZone({
  title,
  section,
  disabled,
  onPick,
  progress,
}: {
  title: string
  section: Section
  disabled?: boolean
  onPick: (section: Section, files: FileList | null) => void
  progress: number | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  return (
    <div
      style={{
        borderRadius: 'var(--lw-r)',
        padding: 16,
        border: `2px dashed ${drag ? 'var(--lw-accent)' : 'var(--lw-border)'}`,
        background: drag ? 'var(--lw-accent-soft)' : 'var(--lw-bg-elev)',
        opacity: disabled ? 0.6 : 1,
        boxShadow: 'var(--lw-shadow-1)',
      }}
      onDragOver={(e: DragEvent) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault()
        setDrag(false)
        if (disabled) return
        onPick(section, e.dataTransfer.files)
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <p className="lw-small" style={{ marginBottom: 12 }}>
        Arrastra imágenes aquí o elige archivos
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={section === 'gallery'}
        style={{ display: 'none' }}
        onChange={(e) => onPick(section, e.target.files)}
      />
      <Btn kind="outline" type="button" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
        Seleccionar
      </Btn>
      {progress != null && progress >= 0 ? (
        <div style={{ marginTop: 12 }}>
          <div className="lw-small" style={{ marginBottom: 4 }}>
            Subiendo… {progress}%
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 4,
              background: 'var(--lw-border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--lw-accent)',
                transition: 'width .12s',
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function Imagenes() {
  const { business, refetch } = useDashboard()
  const qc = useQueryClient()
  const [progress, setProgress] = useState<number | null>(null)
  const [upgradeBanner, setUpgradeBanner] = useState(false)

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: keys.dashboard.business })
    refetch()
  }, [qc, refetch])

  const mutation = useMutation({
    mutationFn: async ({ file, section }: { file: File; section: Section }) =>
      uploadImage(file, section, (pct) => setProgress(pct)),
    onMutate: () => {
      setProgress(0)
      setUpgradeBanner(false)
    },
    onSuccess: async () => {
      setProgress(null)
      await invalidate()
    },
    onError: (err) => {
      setProgress(null)
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const data = err.response.data as { upgrade_required?: boolean }
        if (data?.upgrade_required) setUpgradeBanner(true)
      }
    },
  })

  const handleFiles = (section: Section, files: FileList | null) => {
    if (!files?.length || mutation.isPending) return
    const list = Array.from(files)
    const toUpload = section === 'gallery' ? list : [list[0]]
    const run = async () => {
      for (const file of toUpload) {
        await mutation.mutateAsync({ file, section })
      }
    }
    void run()
  }

  return (
    <div>
      <h1 className="lw-h2" style={{ marginBottom: 8 }}>
        Imágenes
      </h1>
      <p className="lw-small" style={{ marginBottom: 20 }}>
        Portada, sección «Sobre nosotros» y galería.
      </p>

      {upgradeBanner ? (
        <Card
          padding={18}
          style={{
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'linear-gradient(180deg, var(--lw-bg-elev), var(--lw-surface))',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--lw-r)',
              background: 'var(--lw-pro-soft)',
              color: 'var(--lw-pro)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="sparkle" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Has alcanzado el límite de fotos</div>
            <p className="lw-small">Pasa a Pro para subir más imágenes y desbloquear todo el potencial.</p>
          </div>
          <Btn kind="primary" iconRight="arrowRight" type="button" onClick={() => (window.location.href = '/dashboard/billing')}>
            Mejorar plan
          </Btn>
        </Card>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DropZone
          title="Portada"
          section="cover"
          disabled={mutation.isPending}
          onPick={handleFiles}
          progress={mutation.isPending ? progress : null}
        />
        <DropZone
          title="Sobre nosotros"
          section="about"
          disabled={mutation.isPending}
          onPick={handleFiles}
          progress={mutation.isPending ? progress : null}
        />
        <DropZone
          title="Galería"
          section="gallery"
          disabled={mutation.isPending}
          onPick={handleFiles}
          progress={mutation.isPending ? progress : null}
        />
      </div>

      <p className="lw-small" style={{ marginTop: 20, color: 'var(--lw-text-3)' }}>
        {business.images.cover.length} portada · {business.images.about.length} sobre nosotros ·{' '}
        {business.images.gallery.length} galería
      </p>
    </div>
  )
}
