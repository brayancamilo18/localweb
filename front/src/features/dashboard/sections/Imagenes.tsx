import { useCallback, useRef, useState, type DragEvent, type ReactNode } from 'react'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { Btn, Icon } from '../../../components/primitives/primitives'
import { deleteBusinessLogo, deleteImage, uploadBusinessLogo, uploadImage } from '../../../api/dashboard'
import { compressImageForUpload } from '../../../utils/compressImageForUpload'
import FaviconUploader from '../../shared/FaviconUploader'
import { keys } from '../../../api/queryKeys'
import { useDashboard } from '../context/DashboardContext'
import type { BusinessImage } from '../../../types/api'
import DashboardSectionHeader from '../components/DashboardSectionHeader'
import './imagenesContent.css'
import '../components/dashboardSectionHeader.css'

type Section = 'cover' | 'about' | 'gallery'

function isAxiosStatus(err: unknown, status: number): boolean {
  return axios.isAxiosError(err) && err.response?.status === status
}

function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' }) {
  return (
    <span className={`lw-images-pill lw-images-pill--${tone === 'ok' ? 'ok' : 'neutral'}`}>{children}</span>
  )
}

function SectionCard({
  icon,
  title,
  subtitle,
  meta,
  children,
}: {
  icon: string
  title: string
  subtitle: string
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="lw-images-section">
      <div className="lw-images-section__head">
        <div className="lw-images-section__icon">
          <Icon name={icon} size={20} stroke={2.2} />
        </div>
        <div className="lw-images-section__titles">
          <h2 className="lw-images-section__title">{title}</h2>
          <p className="lw-images-section__subtitle">{subtitle}</p>
        </div>
        {meta ? <div className="lw-images-section__meta">{meta}</div> : null}
      </div>
      {children}
    </section>
  )
}

function UploadProgress({ progress, label }: { progress: number; label?: string }) {
  return (
    <div className="lw-images-progress">
      <div className="lw-images-progress__label">
        {label ?? 'Subiendo…'} {progress}%
      </div>
      <div className="lw-images-progress__track">
        <div className="lw-images-progress__fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function ImageThumb({
  src,
  alt,
  primary,
  onDelete,
  deleteBusy,
  deleteDisabled,
}: {
  src: string
  alt: string
  primary?: boolean
  onDelete: () => void
  deleteBusy: boolean
  deleteDisabled: boolean
}) {
  return (
    <div className="lw-images-tile">
      <img src={src} alt={alt} />
      {primary ? (
        <div className="lw-images-tile__badge">
          <Icon name="star" size={11} />
          Principal
        </div>
      ) : null}
      <div className="lw-images-tile__overlay">
        <button
          type="button"
          className="lw-images-tile__delete"
          disabled={deleteDisabled || deleteBusy}
          onClick={onDelete}
          aria-label="Eliminar"
        >
          <Icon name="trash" size={14} color="#fff" />
        </button>
      </div>
    </div>
  )
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
  sectionTitle,
  sectionSubtitle,
  sectionIcon,
  meta,
  galleryLimit,
}: {
  title: string
  section: Section
  busy: boolean
  progress: number | null
  images: BusinessImage[]
  onPick: (section: Section, files: File[]) => void
  onDeleteImage: (id: number) => void
  deletingImageId: number | null
  atLimit?: boolean
  sectionTitle: string
  sectionSubtitle: string
  sectionIcon: string
  meta?: ReactNode
  galleryLimit: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const pickFiles = (list: File[]) => {
    if (busy || atLimit) return
    onPick(section, list)
  }

  const dropHint =
    section === 'gallery'
      ? 'Arrastra imágenes aquí o elige archivos. Se añadirán a la galería.'
      : section === 'cover' && !atLimit && images.length > 0
        ? 'Arrastra una imagen aquí o elige archivo. Se añadirá al collage.'
        : 'Arrastra una imagen aquí o elige archivo. Reemplaza la actual.'

  const buttonLabel =
    section === 'gallery' ? 'Añadir fotos' : images.length > 0 ? 'Cambiar foto' : 'Elegir archivo'

  const dropzone = !atLimit ? (
    <div
      className={`lw-images-dropzone${drag ? ' lw-images-dropzone--drag' : ''}${busy ? ' lw-images-dropzone--busy' : ''}`}
      onDragOver={(e: DragEvent) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault()
        setDrag(false)
        const dropped = e.dataTransfer.files
        pickFiles(dropped ? Array.from(dropped) : [])
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
    >
      <div className="lw-images-dropzone__icon-box">
        <Icon name="upload" size={18} stroke={2.2} />
      </div>
      <div className="lw-images-dropzone__text">
        <div className="lw-images-dropzone__title">{title}</div>
        <div className="lw-images-dropzone__hint">{dropHint}</div>
      </div>
      <button
        type="button"
        className="lw-images-dropzone__btn"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation()
          inputRef.current?.click()
        }}
      >
        {busy ? 'Subiendo…' : buttonLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={section === 'gallery'}
        style={{ display: 'none' }}
        onChange={(e) => {
          const list = e.target.files ? Array.from(e.target.files) : []
          e.target.value = ''
          pickFiles(list)
        }}
      />
    </div>
  ) : null

  if (section === 'gallery') {
    return (
      <SectionCard icon={sectionIcon} title={sectionTitle} subtitle={sectionSubtitle} meta={meta}>
        <div className="lw-images-gallery-grid">
          {images.map((img, idx) => (
            <ImageThumb
              key={img.id}
              src={img.url}
              alt={`${title} ${idx + 1}`}
              onDelete={() => onDeleteImage(img.id)}
              deleteBusy={deletingImageId === img.id}
              deleteDisabled={busy || deletingImageId != null}
            />
          ))}
          {!atLimit ? (
            <div
              className="lw-images-tile lw-images-tile--empty"
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  inputRef.current?.click()
                }
              }}
              onDragOver={(e: DragEvent) => {
                e.preventDefault()
                setDrag(true)
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e: DragEvent) => {
                e.preventDefault()
                setDrag(false)
                const dropped = e.dataTransfer.files
                pickFiles(dropped ? Array.from(dropped) : [])
              }}
            >
              <div className="lw-images-tile__placeholder">
                <Icon name="plus" size={22} />
                <span>Añadir foto</span>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const list = e.target.files ? Array.from(e.target.files) : []
                  e.target.value = ''
                  pickFiles(list)
                }}
              />
            </div>
          ) : null}
        </div>
        {dropzone ? <div style={{ marginTop: 12 }}>{dropzone}</div> : null}
        {progress != null && progress >= 0 ? <UploadProgress progress={progress} /> : null}
        <div className="lw-images-info-bar">
          <Icon name="info" size={14} color="var(--lw-images-accent-dark)" />
          <span>
            Hasta {galleryLimit} imágenes en galería. Se optimizan automáticamente para web.
          </span>
        </div>
      </SectionCard>
    )
  }

  const multi = images.length > 1

  return (
    <SectionCard icon={sectionIcon} title={sectionTitle} subtitle={sectionSubtitle} meta={meta}>
      <div className={`lw-images-split${multi ? ' lw-images-split--multi' : ''}`}>
        <div className={`lw-images-thumbs${multi ? ' lw-images-thumbs--row' : ''}`}>
          {images.length > 0 ? (
            images.map((img, idx) => (
              <ImageThumb
                key={img.id}
                src={img.url}
                alt={`${title} ${idx + 1}`}
                primary={section === 'cover' && idx === 0}
                onDelete={() => onDeleteImage(img.id)}
                deleteBusy={deletingImageId === img.id}
                deleteDisabled={busy || deletingImageId != null}
              />
            ))
          ) : (
            <div className="lw-images-tile lw-images-tile--empty" aria-hidden>
              <div className="lw-images-tile__placeholder">
                <Icon name="image" size={22} />
              </div>
            </div>
          )}
        </div>
        <div>
          {dropzone}
          {images.length === 0 && !atLimit ? (
            <p className="lw-images-empty">No hay imágenes todavía.</p>
          ) : null}
          {progress != null && progress >= 0 ? <UploadProgress progress={progress} /> : null}
        </div>
      </div>
    </SectionCard>
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
  const [logoDrag, setLogoDrag] = useState(false)
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

  const totalImages =
    (business.logo_url ? 1 : 0) + (business.favicon_url ? 1 : 0) + cover.length + about.length + gallery.length

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: keys.dashboard.business })
    refetch()
  }, [qc, refetch])

  const safeDelete = useCallback(async (id: number) => {
    try {
      await deleteImage(id)
    } catch (err) {
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
    [about, busySection, cover, heroPhotoSlots, invalidate, safeDelete],
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
    [busySection, deletingImageId, invalidate, safeDelete],
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
    [invalidate, logoBusy],
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

  const coverTitle = heroPhotoSlots > 1 ? `Portada (${cover.length}/${heroPhotoSlots} fotos)` : 'Portada'

  return (
    <div className="lw-images-page lw-dash-section-page lw-dash-section-page--wide" data-tour="imagenes-main">
      <DashboardSectionHeader
        badgeIcon="sparkle"
        badgeLabel="Imágenes de tu web"
        title="Imágenes"
        subtitle="Logo, favicon, portada, sección «Sobre nosotros» y galería."
        aside={
          <div className="lw-images-page__pills">
            <Pill tone="ok">
              <Icon name="check" size={12} />
              {totalImages} imágenes
            </Pill>
            <Pill>
              {cover.length} portada · {about.length} sobre nosotros · {gallery.length} galería
            </Pill>
          </div>
        }
      />

      <div className="lw-images-page__two-col">
        <SectionCard
          icon="image"
          title="Logo del negocio"
          subtitle="Aparece en la barra superior. Cuadrado u horizontal, máx. 2 MB (JPG, PNG, WebP)."
        >
          <div className="lw-images-logo-row">
            <div className="lw-images-logo-preview">
              {business.logo_url ? (
                <img src={business.logo_url} alt="Logo" />
              ) : (
                <Icon name="image" size={28} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className={`lw-images-dropzone${logoDrag ? ' lw-images-dropzone--drag' : ''}${logoBusy || logoDeleteBusy ? ' lw-images-dropzone--busy' : ''}`}
                onDragOver={(e: DragEvent) => {
                  e.preventDefault()
                  setLogoDrag(true)
                }}
                onDragLeave={() => setLogoDrag(false)}
                onDrop={(e: DragEvent) => {
                  e.preventDefault()
                  setLogoDrag(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) void handleLogoChange(f)
                }}
                onClick={() => logoInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    logoInputRef.current?.click()
                  }
                }}
              >
                <div className="lw-images-dropzone__icon-box">
                  <Icon name="upload" size={16} stroke={2.2} />
                </div>
                <div className="lw-images-dropzone__text">
                  <div className="lw-images-dropzone__title">
                    {business.logo_url ? 'Cambiar logo' : 'Subir logo'}
                  </div>
                  <div className="lw-images-dropzone__hint">Arrastra aquí o haz click</div>
                </div>
                <button
                  type="button"
                  className="lw-images-dropzone__btn"
                  disabled={logoBusy || logoDeleteBusy}
                  onClick={(e) => {
                    e.stopPropagation()
                    logoInputRef.current?.click()
                  }}
                >
                  Elegir archivo
                </button>
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
              </div>
              {business.logo_url ? (
                <button
                  type="button"
                  className="lw-images-favicon-btn lw-images-favicon-btn--ghost"
                  style={{ marginTop: 8 }}
                  disabled={logoBusy || logoDeleteBusy}
                  onClick={() => void handleLogoDelete()}
                >
                  {logoDeleteBusy ? 'Eliminando…' : 'Eliminar logo'}
                </button>
              ) : null}
              {logoProgress != null && logoProgress >= 0 ? (
                <UploadProgress progress={logoProgress} label="Subiendo logo…" />
              ) : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon="layout"
          title="Favicon"
          subtitle="Icono cuadrado de pestaña. Usa tu símbolo, no el logo completo. PNG transparente, mín. 64×64 px."
        >
          <FaviconUploader enabled={isPro} embedded />
        </SectionCard>
      </div>

      {upgradeBanner && !isPro ? (
        <div className="lw-images-banner lw-images-banner--upgrade">
          <div className="lw-images-banner__icon">
            <Icon name="sparkle" size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--lw-images-ink)' }}>
              Has alcanzado el límite de fotos
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--lw-images-muted)' }}>
              Pasa a Pro para subir más imágenes y desbloquear todo el potencial.
            </p>
          </div>
          <Btn
            kind="primary"
            iconRight="arrowRight"
            type="button"
            onClick={() => {
              window.location.href = '/dashboard/account?tab=plan'
            }}
          >
            Mejorar plan
          </Btn>
        </div>
      ) : upgradeBanner && isPro ? (
        <div className="lw-images-banner">
          <p style={{ margin: 0, fontSize: 13, color: 'var(--lw-images-muted)' }}>
            Has alcanzado el límite de 20 fotos de galería de tu plan Pro.
          </p>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="lw-images-banner lw-images-banner--error">
          <p>{errorMsg}</p>
        </div>
      ) : null}

      <div className="lw-images-page__two-col">
        <DropZone
          title={cover.length > 0 ? 'Cambiar portada' : 'Subir portada'}
          sectionTitle={coverTitle}
          sectionSubtitle="Imagen principal del hero. Arrastra una imagen o elige archivo."
          sectionIcon="star"
          meta={
            cover.length > 0 ? (
              <Pill tone="ok">
                <Icon name="check" size={12} />
                Configurada
              </Pill>
            ) : undefined
          }
          section="cover"
          busy={busySection === 'cover'}
          progress={busySection === 'cover' ? progress : null}
          images={cover}
          onPick={(s, f) => void handleFiles(s, f)}
          onDeleteImage={handleDeleteImage}
          deletingImageId={deletingImageId}
          atLimit={heroPhotoSlots > 1 && cover.length >= heroPhotoSlots}
          galleryLimit={galleryLimit}
        />
        <DropZone
          title={about.length > 0 ? 'Cambiar imagen' : 'Subir imagen'}
          sectionTitle="Sobre nosotros"
          sectionSubtitle="Aparece en la sección de presentación de tu equipo o historia."
          sectionIcon="users"
          meta={
            about.length > 0 ? (
              <Pill tone="ok">
                <Icon name="check" size={12} />
                Configurada
              </Pill>
            ) : undefined
          }
          section="about"
          busy={busySection === 'about'}
          progress={busySection === 'about' ? progress : null}
          images={about}
          onPick={(s, f) => void handleFiles(s, f)}
          onDeleteImage={handleDeleteImage}
          deletingImageId={deletingImageId}
          galleryLimit={galleryLimit}
        />
      </div>

      <DropZone
        title="Añadir fotos a la galería"
        sectionTitle="Galería"
        sectionSubtitle="Se mostrarán en cuadrícula en tu página pública."
        sectionIcon="grid"
        meta={
          <Pill>
            {gallery.length} / {galleryLimit}
          </Pill>
        }
        section="gallery"
        busy={busySection === 'gallery'}
        progress={busySection === 'gallery' ? progress : null}
        images={gallery}
        onPick={(s, f) => void handleFiles(s, f)}
        onDeleteImage={handleDeleteImage}
        deletingImageId={deletingImageId}
        atLimit={galleryFull}
        galleryLimit={galleryLimit}
      />
    </div>
  )
}
