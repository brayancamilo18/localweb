import { useCallback, useRef, useState, type DragEvent, type ReactNode, type RefObject } from 'react'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { Btn, Icon } from '../../../components/primitives/primitives'
import { deleteBusinessLogo, deleteImage, uploadBusinessLogo, uploadImage } from '../../../api/dashboard'
import {
  prepareImageForUpload,
  prepareImagesForUpload,
  UPLOAD_MAX_BYTES,
} from '../../../lib/imageUpload'
import {
  clearImageUploadError,
  reportImageUploadError,
  resolveImageUploadError,
  type ImageUploadArea,
} from '../../../lib/uploadErrorFeedback'
import { useToast } from '../../../components/ui/Toast'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
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

function UploadInlineError({ message }: { message?: string | null }) {
  if (!message) {
    return null
  }

  return (
    <div className="lw-images-upload-error" role="alert" aria-live="assertive">
      <p>{message}</p>
    </div>
  )
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
  heroPhotoSlots = 1,
  uploadAreaRef,
  inlineError,
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
  /** Slots de portada del template (>1 = collage; layout en fila). */
  heroPhotoSlots?: number
  uploadAreaRef: RefObject<HTMLDivElement | null>
  inlineError?: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const isMultiCover = section === 'cover' && heroPhotoSlots > 1
  const uploadBlocked = busy || (isMultiCover ? atLimit : false)

  const pickFiles = (list: File[]) => {
    if (busy || atLimit) return
    onPick(section, list)
  }

  const dropHint =
    section === 'gallery'
      ? 'Arrastra imágenes aquí o elige archivos. Se añadirán a la galería.'
      : isMultiCover && images.length > 0
        ? 'Arrastra una imagen aquí o elige archivo. Se añadirá al collage.'
        : section === 'cover' && !atLimit && images.length > 0
          ? 'Arrastra una imagen aquí o elige archivo. Se añadirá al collage.'
          : 'Arrastra una imagen aquí o elige archivo. Reemplaza la actual.'

  const buttonLabel =
    section === 'gallery'
      ? 'Añadir fotos'
      : isMultiCover
        ? images.length === 0
          ? 'Elegir archivo'
          : 'Añadir foto'
        : images.length > 0
          ? 'Cambiar foto'
          : 'Elegir archivo'

  const renderUploadArea = (options?: { alwaysShow?: boolean }) => {
    if (!options?.alwaysShow && !isMultiCover && atLimit) return null

    return (
      <div
        className={`lw-images-dropzone${drag ? ' lw-images-dropzone--drag' : ''}${uploadBlocked ? ' lw-images-dropzone--disabled' : ''}${busy ? ' lw-images-dropzone--busy' : ''}`}
        onDragOver={(e: DragEvent) => {
          if (uploadBlocked) return
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e: DragEvent) => {
          if (uploadBlocked) return
          e.preventDefault()
          setDrag(false)
          const dropped = e.dataTransfer.files
          pickFiles(dropped ? Array.from(dropped) : [])
        }}
        onClick={() => {
          if (!uploadBlocked) inputRef.current?.click()
        }}
        role="button"
        tabIndex={uploadBlocked ? -1 : 0}
        aria-disabled={uploadBlocked}
        onKeyDown={(e) => {
          if (uploadBlocked) return
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
          disabled={uploadBlocked}
          onClick={(e) => {
            e.stopPropagation()
            if (!uploadBlocked) inputRef.current?.click()
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
          disabled={uploadBlocked}
          onChange={(e) => {
            const list = e.target.files ? Array.from(e.target.files) : []
            e.target.value = ''
            pickFiles(list)
          }}
        />
      </div>
    )
  }

  if (section === 'gallery') {
    const galleryUpload = renderUploadArea()
    return (
      <SectionCard icon={sectionIcon} title={sectionTitle} subtitle={sectionSubtitle} meta={meta}>
        <div ref={uploadAreaRef} className="lw-images-upload-area">
          <UploadInlineError message={inlineError} />
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
        {galleryUpload ? <div style={{ marginTop: 12 }}>{galleryUpload}</div> : null}
        {progress != null && progress >= 0 ? <UploadProgress progress={progress} /> : null}
        <div className="lw-images-info-bar">
          <Icon name="info" size={14} color="var(--lw-images-accent-dark)" />
          <span>
            Hasta {galleryLimit} imágenes en galería. Se optimizan automáticamente para web.
          </span>
        </div>
        </div>
      </SectionCard>
    )
  }

  if (isMultiCover) {
    return (
      <SectionCard icon={sectionIcon} title={sectionTitle} subtitle={sectionSubtitle} meta={meta}>
        <div ref={uploadAreaRef} className="lw-images-upload-area">
          <UploadInlineError message={inlineError} />
        <div className="lw-images-cover-row">
          {images.map((img, idx) => (
            <ImageThumb
              key={img.id}
              src={img.url}
              alt={`${title} ${idx + 1}`}
              primary={idx === 0}
              onDelete={() => onDeleteImage(img.id)}
              deleteBusy={deletingImageId === img.id}
              deleteDisabled={busy || deletingImageId != null}
            />
          ))}
          {renderUploadArea({ alwaysShow: true })}
        </div>
        {progress != null && progress >= 0 ? <UploadProgress progress={progress} /> : null}
        </div>
      </SectionCard>
    )
  }

  const multi = images.length > 1
  const uploadArea = renderUploadArea()

  return (
    <SectionCard icon={sectionIcon} title={sectionTitle} subtitle={sectionSubtitle} meta={meta}>
      <div ref={uploadAreaRef} className="lw-images-upload-area">
        <UploadInlineError message={inlineError} />
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
          {uploadArea}
          {images.length === 0 && !atLimit ? (
            <p className="lw-images-empty">No hay imágenes todavía.</p>
          ) : null}
          {progress != null && progress >= 0 ? <UploadProgress progress={progress} /> : null}
        </div>
      </div>
      </div>
    </SectionCard>
  )
}

async function prepareFilesWithToast(
  files: File[],
  opts: { maxBytes: number; maxDimension: number; quality: number },
  showToast: (msg: string, type: 'info') => void,
): Promise<File[]> {
  const needsCompress = files.some((f) => f.size > opts.maxBytes * 0.5)
  if (needsCompress) {
    showToast('Comprimiendo imagen…', 'info')
  }
  return prepareImagesForUpload(files, opts)
}

export default function Imagenes() {
  const { showToast } = useToast()
  const { business, refetch } = useDashboard()
  const qc = useQueryClient()

  const [busySection, setBusySection] = useState<Section | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [logoProgress, setLogoProgress] = useState<number | null>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const [logoDeleteBusy, setLogoDeleteBusy] = useState(false)
  const [logoDeleteConfirmOpen, setLogoDeleteConfirmOpen] = useState(false)
  const [logoDrag, setLogoDrag] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const [upgradeBanner, setUpgradeBanner] = useState(false)
  const [inlineErrors, setInlineErrors] = useState<Partial<Record<ImageUploadArea, string>>>({})
  const logoInputRef = useRef<HTMLInputElement>(null)
  const logoUploadRef = useRef<HTMLDivElement>(null)
  const galleryUploadRef = useRef<HTMLDivElement>(null)
  const coverUploadRef = useRef<HTMLDivElement>(null)
  const aboutUploadRef = useRef<HTMLDivElement>(null)
  const faviconUploadRef = useRef<HTMLDivElement>(null)
  const lastUploadAttempt = useRef<{ section: Section; files: File[] } | null>(null)

  const setAreaError = useCallback((area: ImageUploadArea, message: string | null) => {
    setInlineErrors((prev) => {
      if (message == null) {
        const next = { ...prev }
        delete next[area]
        return next
      }
      return { ...prev, [area]: message }
    })
  }, [])

  const uploadRefForArea = useCallback((area: ImageUploadArea): RefObject<HTMLDivElement | null> => {
    if (area === 'logo') return logoUploadRef
    if (area === 'favicon') return faviconUploadRef
    if (area === 'gallery') return galleryUploadRef
    if (area === 'cover') return coverUploadRef
    return aboutUploadRef
  }, [])

  const cover = Array.isArray(business.images?.cover) ? business.images.cover : []
  const about = Array.isArray(business.images?.about) ? business.images.about : []
  const gallery = Array.isArray(business.images?.gallery) ? business.images.gallery : []

  const isPro = business?.is_pro === true || business?.plan === 'pro'
  const galleryLimit = isPro ? 20 : 3
  const galleryFull = gallery.length >= galleryLimit
  const heroPhotoSlots = (business as { template?: { hero_photo_slots?: number } })?.template?.hero_photo_slots ?? 1

  const reportUploadFailure = useCallback(
    (area: ImageUploadArea, err: unknown, retry?: () => void) => {
      const resolved = resolveImageUploadError(err)

      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as { upgrade_required?: boolean }
        if (data.upgrade_required) {
          setUpgradeBanner(true)
          if (area === 'gallery') {
            resolved.message = isPro
              ? 'Has alcanzado el límite de 20 fotos de galería.'
              : 'Has alcanzado el límite de fotos para tu plan.'
          }
        }
      }

      reportImageUploadError({
        area,
        message: resolved.message,
        uploadRef: uploadRefForArea(area),
        showToast,
        setInlineError: setAreaError,
        retry: resolved.retryable ? retry : undefined,
      })
    },
    [isPro, setAreaError, showToast, uploadRefForArea],
  )

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

  const handleFiles = useCallback(
    async (section: Section, files: File[]) => {
      if (!files.length) return
      if (busySection != null) return
      setBusySection(section)
      clearImageUploadError(setAreaError, section)
      setUpgradeBanner(false)
      setProgress(0)
      const rawFiles = section === 'gallery' ? files : [files[0]]
      lastUploadAttempt.current = { section, files: rawFiles }

      const retry = () => {
        const attempt = lastUploadAttempt.current
        if (attempt) {
          void handleFiles(attempt.section, attempt.files)
        }
      }

      try {
        const toUpload = await prepareFilesWithToast(
          rawFiles,
          { maxBytes: UPLOAD_MAX_BYTES.gallery, maxDimension: 2200, quality: 0.85 },
          showToast,
        )

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
        clearImageUploadError(setAreaError, section)
      } catch (err) {
        if (isAxiosStatus(err, 429)) {
          reportImageUploadError({
            area: section,
            message: 'Has hecho demasiadas operaciones seguidas. Espera unos segundos e inténtalo de nuevo.',
            uploadRef: uploadRefForArea(section),
            showToast,
            setInlineError: setAreaError,
          })
        } else {
          reportUploadFailure(section, err, retry)
        }
      } finally {
        setProgress(null)
        setBusySection(null)
      }
    },
    [about, busySection, cover, heroPhotoSlots, invalidate, reportUploadFailure, safeDelete, setAreaError, showToast, uploadRefForArea],
  )

  const handleDeleteImage = useCallback(
    async (id: number) => {
      if (busySection != null || deletingImageId != null) return
      setDeletingImageId(id)
      try {
        await safeDelete(id)
        await invalidate()
      } catch (err) {
        reportUploadFailure('gallery', err)
      } finally {
        setDeletingImageId(null)
      }
    },
    [busySection, deletingImageId, invalidate, reportUploadFailure, safeDelete],
  )

  const handleLogoChange = useCallback(
    async (file: File) => {
      if (logoBusy) return
      setLogoBusy(true)
      setLogoProgress(0)
      clearImageUploadError(setAreaError, 'logo')
      let lastLogoFile: File | null = file

      const retry = () => {
        if (lastLogoFile) {
          void handleLogoChange(lastLogoFile)
        }
      }

      try {
        if (file.size > UPLOAD_MAX_BYTES.logo * 0.5) {
          showToast('Comprimiendo imagen…', 'info')
        }
        const ready = await prepareImageForUpload(file, {
          maxBytes: UPLOAD_MAX_BYTES.logo,
          maxDimension: 2000,
          quality: 0.85,
        })
        lastLogoFile = ready
        await uploadBusinessLogo(ready, (pct) => setLogoProgress(pct))
        await invalidate()
        clearImageUploadError(setAreaError, 'logo')
      } catch (err) {
        reportUploadFailure('logo', err, retry)
      } finally {
        setLogoProgress(null)
        setLogoBusy(false)
      }
    },
    [invalidate, logoBusy, reportUploadFailure, setAreaError, showToast],
  )

  const handleLogoDelete = useCallback(() => {
    if (logoDeleteBusy) return
    setLogoDeleteConfirmOpen(true)
  }, [logoDeleteBusy])

  const performLogoDelete = useCallback(async () => {
    setLogoDeleteConfirmOpen(false)
    setLogoDeleteBusy(true)
    try {
      await deleteBusinessLogo()
      await invalidate()
    } catch (err) {
      reportUploadFailure('logo', err)
    } finally {
      setLogoDeleteBusy(false)
    }
  }, [invalidate, reportUploadFailure])

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
            <div ref={logoUploadRef} className="lw-images-upload-area" style={{ flex: 1, minWidth: 0 }}>
              <UploadInlineError message={inlineErrors.logo} />
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
          <FaviconUploader
            enabled={isPro}
            embedded
            uploadAreaRef={faviconUploadRef}
            inlineError={inlineErrors.favicon}
            onUploadError={(err, retry) => reportUploadFailure('favicon', err, retry)}
            onUploadSuccess={() => clearImageUploadError(setAreaError, 'favicon')}
          />
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

      <div
        className={`lw-images-page__two-col${heroPhotoSlots > 1 ? ' lw-images-page__two-col--stacked' : ''}`}
      >
        <DropZone
          title={
            heroPhotoSlots > 1
              ? cover.length > 0
                ? 'Añadir foto'
                : 'Subir portada'
              : cover.length > 0
                ? 'Cambiar portada'
                : 'Subir portada'
          }
          sectionTitle={coverTitle}
          sectionSubtitle="Imagen principal del hero. Arrastra una imagen o elige archivo."
          sectionIcon="star"
          heroPhotoSlots={heroPhotoSlots}
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
          uploadAreaRef={coverUploadRef}
          inlineError={inlineErrors.cover}
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
          uploadAreaRef={aboutUploadRef}
          inlineError={inlineErrors.about}
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
        uploadAreaRef={galleryUploadRef}
        inlineError={inlineErrors.gallery}
      />

      <ConfirmDialog
        open={logoDeleteConfirmOpen}
        onCancel={() => setLogoDeleteConfirmOpen(false)}
        onConfirm={() => { void performLogoDelete() }}
        title="Eliminar logo"
        description="En la barra superior de tu página volverá a mostrarse el nombre del negocio en lugar del logo. Podrás subir otro logo cuando quieras."
        confirmLabel="Eliminar logo"
        tone="danger"
        loading={logoDeleteBusy}
      />
    </div>
  )
}
