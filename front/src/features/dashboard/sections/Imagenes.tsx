import { useCallback, useRef, useState, type DragEvent } from 'react'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { Btn, Card, Icon } from '../../../components/primitives/primitives'
import { deleteBusinessLogo, deleteImage, uploadBusinessLogo, uploadImage } from '../../../api/dashboard'
import { compressImageForUpload } from '../../../utils/compressImageForUpload'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'
import type { BusinessImage } from '../../../types/api'

type Section = 'cover' | 'about' | 'gallery'

function isAxiosStatus(err: unknown, status: number): boolean {
  return axios.isAxiosError(err) && err.response?.status === status
}

function DropZone({
  title,
  section,
  busy,
  progress,
  images,
  onPick,
  onDeleteImage,
  deletingImageId,
  atLimit = false,
}: {
  title: string
  section: Section
  busy: boolean
  progress: number | null
  images: BusinessImage[]
  onPick: (section: Section, files: File[]) => void
  onDeleteImage: (id: number) => void
  deletingImageId: number | null
  /** Solo galería: oculta «Añadir fotos» y bloquea nuevas subidas cuando ya está al límite. */
  atLimit?: boolean
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
        opacity: busy ? 0.6 : 1,
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
        if (busy) return
        if (atLimit) return
        const dropped = e.dataTransfer.files
        const list = dropped ? Array.from(dropped) : []
        onPick(section, list)
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <p className="lw-small" style={{ marginBottom: 12 }}>
        {section === 'gallery'
          ? 'Arrastra imágenes aquí o elige archivos. Se añadirán a la galería.'
          : section === 'cover' && !atLimit && images.length > 0
            ? 'Arrastra una imagen aquí o elige archivo. Se añadirá al collage.'
            : 'Arrastra una imagen aquí o elige archivo. Reemplaza la actual.'}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={section === 'gallery'}
        style={{ display: 'none' }}
        onChange={(e) => {
          const list = e.target.files ? Array.from(e.target.files) : []
          e.target.value = ''
          if (atLimit) return
          onPick(section, list)
        }}
      />
      {!atLimit ? (
        <Btn kind="primary" type="button" size="sm" disabled={busy} loading={busy} onClick={() => inputRef.current?.click()}>
          {section === 'gallery' ? 'Añadir fotos' : images.length > 0 ? 'Cambiar foto' : 'Seleccionar foto'}
        </Btn>
      ) : null}
      {images.length > 0 ? (
        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: section === 'gallery' ? 'repeat(auto-fill, minmax(120px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 10,
          }}
        >
          {images.map((img, idx) => (
            <div
              key={img.id}
              style={{
                position: 'relative',
                border: '1px solid var(--lw-border)',
                borderRadius: 'var(--lw-r-sm)',
                overflow: 'hidden',
                background: 'var(--lw-bg-elev)',
              }}
            >
              <img
                src={img.url}
                alt={`${title} ${idx + 1}`}
                style={{
                  width: '100%',
                  height: section === 'gallery' ? 112 : 132,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                }}
              >
                <Btn
                  type="button"
                  size="sm"
                  kind="ghost"
                  disabled={busy || deletingImageId === img.id}
                  loading={deletingImageId === img.id}
                  onClick={() => onDeleteImage(img.id)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.62)',
                    color: '#fff',
                  }}
                >
                  Eliminar
                </Btn>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lw-small" style={{ marginTop: 10, color: 'var(--lw-text-3)' }}>
          No hay imágenes todavía.
        </div>
      )}
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

  const [busySection, setBusySection] = useState<Section | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [logoProgress, setLogoProgress] = useState<number | null>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const [logoDeleteBusy, setLogoDeleteBusy] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const [upgradeBanner, setUpgradeBanner] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const cover = Array.isArray(business.images?.cover) ? business.images.cover : []
  const about = Array.isArray(business.images?.about) ? business.images.about : []
  const gallery = Array.isArray(business.images?.gallery) ? business.images.gallery : []

  const isPro = business?.is_pro === true || business?.plan === 'pro'
  const galleryLimit = isPro ? 20 : 3
  const galleryFull = gallery.length >= galleryLimit
  const heroPhotoSlots = (business as { template?: { hero_photo_slots?: number } })?.template?.hero_photo_slots ?? 1

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: keys.dashboard.business })
    refetch()
  }, [qc, refetch])

  const safeDelete = useCallback(async (id: number) => {
    try {
      await deleteImage(id)
    } catch (err) {
      // 404 = ya estaba borrada en backend; lo tratamos como éxito.
      if (!isAxiosStatus(err, 404)) throw err
    }
  }, [])

  const describeError = (err: unknown): string => {
    if (isAxiosStatus(err, 429)) {
      return 'Has hecho demasiadas operaciones seguidas. Espera unos segundos e inténtalo de nuevo.'
    }
    if (axios.isAxiosError(err) && err.response?.status === 422) {
      const data = err.response.data as { upgrade_required?: boolean; message?: string }
      if (data?.upgrade_required) {
        setUpgradeBanner(true)
        return isPro
          ? 'Has alcanzado el límite de 20 fotos de galería.'
          : 'Has alcanzado el límite de fotos para tu plan.'
      }
      return data?.message ?? 'No se pudo procesar la imagen.'
    }
    return 'Se produjo un error al guardar la imagen. Inténtalo otra vez.'
  }

  const handleFiles = useCallback(
    async (section: Section, files: File[]) => {
      if (!files.length) return
      if (busySection != null) return
      setBusySection(section)
      setErrorMsg(null)
      setUpgradeBanner(false)
      setProgress(0)
      try {
        const toUpload = section === 'gallery' ? files : [files[0]]

        if (section === 'about') {
          for (const img of about) {
            await safeDelete(img.id)
          }
        } else if (section === 'cover' && heroPhotoSlots <= 1) {
          for (const img of cover) {
            await safeDelete(img.id)
          }
        }

        for (const file of toUpload) {
          await uploadImage(file, section, (pct) => setProgress(pct))
        }

        await invalidate()
      } catch (err) {
        setErrorMsg(describeError(err))
      } finally {
        setProgress(null)
        setBusySection(null)
      }
    },
    [about, busySection, cover, invalidate, isPro, safeDelete],
  )

  const handleDeleteImage = useCallback(
    async (id: number) => {
      if (busySection != null || deletingImageId != null) return
      setDeletingImageId(id)
      setErrorMsg(null)
      try {
        await safeDelete(id)
        await invalidate()
      } catch (err) {
        setErrorMsg(describeError(err))
      } finally {
        setDeletingImageId(null)
      }
    },
    [busySection, deletingImageId, invalidate, isPro, safeDelete],
  )

  const handleLogoChange = useCallback(
    async (file: File) => {
      if (logoBusy) return
      setLogoBusy(true)
      setLogoProgress(0)
      setErrorMsg(null)
      try {
        const ready = await compressImageForUpload(file, { maxSide: 2000, quality: 0.88 })
        await uploadBusinessLogo(ready, (pct) => setLogoProgress(pct))
        await invalidate()
      } catch (err) {
        setErrorMsg(describeError(err))
      } finally {
        setLogoProgress(null)
        setLogoBusy(false)
      }
    },
    [invalidate, isPro, logoBusy],
  )

  const handleLogoDelete = useCallback(async () => {
    if (logoDeleteBusy) return
    if (!window.confirm('¿Eliminar el logo? En la barra superior volverá a mostrarse el nombre.')) return
    setLogoDeleteBusy(true)
    setErrorMsg(null)
    try {
      await deleteBusinessLogo()
      await invalidate()
    } catch (err) {
      setErrorMsg(describeError(err))
    } finally {
      setLogoDeleteBusy(false)
    }
  }, [invalidate, logoDeleteBusy])

  return (
    <div>
      <h1 className="lw-h2" style={{ marginBottom: 8 }}>
        Imágenes
      </h1>
      <p className="lw-small" style={{ marginBottom: 20 }}>
        Portada, sección «Sobre nosotros» y galería.
      </p>

      <Card
        padding={18}
        style={{
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Logo del negocio</div>
          <p className="lw-small" style={{ margin: 0, color: 'var(--lw-text-2)' }}>
            Aparece en la barra superior de tu web. Cuadrado o horizontal, máx. 2 MB (JPG, PNG, WebP).
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 12,
              background: 'var(--lw-bg-elev)',
              border: '1px solid var(--lw-border)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {business.logo_url ? (
              <img src={business.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Icon name="sparkle" size={24} style={{ opacity: 0.25 }} />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                void handleLogoChange(f)
              }}
            />
            <Btn
              type="button"
              size="sm"
              kind="outline"
              disabled={logoBusy || logoDeleteBusy}
              onClick={() => logoInputRef.current?.click()}
            >
              {business.logo_url ? 'Cambiar logo' : 'Subir logo'}
            </Btn>
            {business.logo_url ? (
              <Btn
                type="button"
                size="sm"
                kind="ghost"
                disabled={logoBusy || logoDeleteBusy}
                loading={logoDeleteBusy}
                onClick={() => void handleLogoDelete()}
              >
                Eliminar logo
              </Btn>
            ) : null}
            {logoProgress != null && logoProgress >= 0 ? (
              <div className="lw-small" style={{ color: 'var(--lw-text-3)' }}>
                Subiendo logo… {logoProgress}%
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {upgradeBanner && !isPro ? (
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
          <Btn kind="primary" iconRight="arrowRight" type="button" onClick={() => (window.location.href = '/dashboard/account?tab=plan')}>
            Mejorar plan
          </Btn>
        </Card>
      ) : upgradeBanner && isPro ? (
        <Card padding={14} style={{ marginBottom: 20, borderColor: 'var(--lw-border)' }}>
          <p className="lw-small" style={{ margin: 0 }}>
            Has alcanzado el límite de 20 fotos de galería de tu plan Pro.
          </p>
        </Card>
      ) : null}

      {errorMsg ? (
        <Card padding={14} style={{ marginBottom: 20, borderColor: 'var(--lw-danger)' }}>
          <p className="lw-small" style={{ margin: 0, color: 'var(--lw-danger)' }}>
            {errorMsg}
          </p>
        </Card>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-tour="imagenes-main">
        <DropZone
          title={heroPhotoSlots > 1 ? `Portada (${cover.length}/${heroPhotoSlots} fotos)` : 'Portada'}
          section="cover"
          busy={busySection === 'cover'}
          progress={busySection === 'cover' ? progress : null}
          images={cover}
          onPick={(s, f) => void handleFiles(s, f)}
          onDeleteImage={handleDeleteImage}
          deletingImageId={deletingImageId}
          atLimit={heroPhotoSlots > 1 && cover.length >= heroPhotoSlots}
        />
        <DropZone
          title="Sobre nosotros"
          section="about"
          busy={busySection === 'about'}
          progress={busySection === 'about' ? progress : null}
          images={about}
          onPick={(s, f) => void handleFiles(s, f)}
          onDeleteImage={handleDeleteImage}
          deletingImageId={deletingImageId}
        />
        <DropZone
          title="Galería"
          section="gallery"
          busy={busySection === 'gallery'}
          progress={busySection === 'gallery' ? progress : null}
          images={gallery}
          onPick={(s, f) => void handleFiles(s, f)}
          onDeleteImage={handleDeleteImage}
          deletingImageId={deletingImageId}
          atLimit={galleryFull}
        />
      </div>

      <p className="lw-small" style={{ marginTop: 20, color: 'var(--lw-text-3)' }}>
        {cover.length} portada · {about.length} sobre nosotros · {gallery.length} galería
      </p>
    </div>
  )
}
