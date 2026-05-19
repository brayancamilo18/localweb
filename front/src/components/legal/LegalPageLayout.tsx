import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { legalLastUpdate, legalRoutes } from '../../lib/legal'
import '../../styles/legal.css'

export interface TocItem {
  id: string
  label: string
}

export type LegalPageLayoutProps = {
  title: string
  badge: string
  subtitle?: string
  lastUpdate?: string
  toc: TocItem[]
  children: ReactNode
}

export function LegalPageLayout({
  title,
  badge,
  subtitle,
  lastUpdate = legalLastUpdate,
  toc,
  children,
}: LegalPageLayoutProps) {
  const [showTop, setShowTop] = useState(false)
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? '')

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => !!el)
    if (!els.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-90px 0px -65% 0px', threshold: 0 },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [toc])

  return (
    <div className="lw-legal">
      <header className="lw-hero">
        <div className="lw-hero__glow-1" aria-hidden="true" />
        <div className="lw-hero__glow-2" aria-hidden="true" />
        <div className="lw-hero__inner">
          <Link to="/login" className="lw-logo" aria-label="ONEZ — Inicio">
            ONEZ
          </Link>
          <span className="lw-badge">
            <span className="lw-badge__icon" aria-hidden="true">
              ✨
            </span>
            {badge}
          </span>
          <h1>{title}</h1>
          {subtitle ? <p className="lw-hero__subtitle">{subtitle}</p> : null}
        </div>
      </header>

      <div className="lw-container">
        <nav className="lw-toc" aria-label="Apartados">
          <p className="lw-toc__title">En esta página</p>
          <ul>
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className={activeId === t.id ? 'is-active' : ''}>
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main>
          <article className="lw-card">
            <p className="lw-meta">Última actualización: {lastUpdate}</p>
            {children}
          </article>
        </main>
      </div>

      <footer className="lw-footer">
        <div className="lw-footer__grid">
          <div className="lw-footer__brand">
            <Link to="/login" className="lw-logo">
              ONEZ
            </Link>
            <p>Tu web profesional en menos de 10 minutos.</p>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li>
                <Link to={legalRoutes.avisoLegal}>Aviso Legal</Link>
              </li>
              <li>
                <Link to={legalRoutes.privacidad}>Política de Privacidad</Link>
              </li>
              <li>
                <Link to={legalRoutes.cookies}>Política de Cookies</Link>
              </li>
              <li>
                <Link to={legalRoutes.terminos}>Términos y Condiciones</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li>
                <a href="mailto:soporte@onez.es">soporte@onez.es</a>
              </li>
              <li>
                <a href="mailto:privacidad@onez.es">privacidad@onez.es</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="lw-footer__legal">© {new Date().getFullYear()} ONEZ · Hecho en Madrid</div>
      </footer>

      <button
        type="button"
        aria-label="Volver al inicio de la página"
        className={`lw-back-top${showTop ? ' is-visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  )
}
