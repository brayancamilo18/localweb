/**
 * Banner de cookies (RGPD / LOPD-GDD).
 *
 * Cookies técnicas sin consentimiento (Art. 22.2 LSSI-CE; considerando 47 RGPD):
 * - Sesión Sanctum (HttpOnly) y XSRF-TOKEN
 * - Borrador de onboarding en localStorage (lw.onboarding.wizard.*): funcional, sin tracking
 *
 * Analytics propias (page_visits, IP hasheada en servidor): interés legítimo — ver RegisterPageVisit.
 * Scripts de terceros (GA, etc.): solo tras consentimiento explícito (Art. 6.1.a RGPD).
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import {
  CONSENT_KEY,
  CONSENT_VERSION,
  getConsent,
  writeConsent,
  type CookieConsentData,
} from '../../lib/cookieConsent'
import { Link } from 'react-router-dom'
import { legalRoutes } from '../../lib/legal'
import CookiePreferencesButton from './CookiePreferencesButton'

// ---------- Tokens ----------
const C = {
  bg: "#FAFAF7",
  surface: "#FFFFFF",
  subtle: "#F3F2EF",
  text: "#0B1F1A",
  text2: "#2C2C2A",
  muted: "#888780",
  border: "#E8E6E1",
  borderStrong: "#D4D2CC",
  brand: "#0F6E56",
  brandHover: "#0A5A45",
  brandSoft: "#E1F5EE",
  backdrop: "rgba(11,31,26,0.55)",
  trackOff: "#CBD5E1",
};

const fontStack =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ---------- Toggle ----------
function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      style={{
        position: "relative",
        width: 36,
        height: 22,
        borderRadius: 999,
        border: "none",
        padding: 0,
        background: checked ? C.brand : C.trackOff,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 16 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          transition: "left 0.15s ease",
        }}
      />
    </button>
  );
}

// ---------- Button helpers ----------
const baseBtn: CSSProperties = {
  fontFamily: fontStack,
  fontSize: 13,
  fontWeight: 500,
  borderRadius: 6,
  cursor: "pointer",
  transition: "background 0.12s ease, border-color 0.12s ease, color 0.12s ease",
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

function GhostBtn({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...baseBtn,
        background: hover ? C.subtle : "transparent",
        color: C.muted,
        border: "none",
        padding: "8px 14px",
      }}
    >
      {children}
    </button>
  );
}

function OutlineBtn({
  children,
  onClick,
  full,
}: {
  children: ReactNode;
  onClick: () => void;
  full?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...baseBtn,
        background: C.surface,
        color: C.text,
        border: `1px solid ${hover ? C.borderStrong : C.border}`,
        padding: full ? undefined : "8px 14px",
        height: full ? 44 : undefined,
        width: full ? "100%" : undefined,
        borderRadius: full ? 10 : 6,
        fontSize: full ? 15 : 13,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({
  children,
  onClick,
  full,
}: {
  children: ReactNode;
  onClick: () => void;
  full?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...baseBtn,
        background: hover ? C.brandHover : C.brand,
        color: "#FFFFFF",
        border: "none",
        padding: full ? undefined : "8px 18px",
        height: full ? 44 : undefined,
        width: full ? "100%" : undefined,
        borderRadius: full ? 10 : 6,
        fontSize: full ? 15 : 13,
        boxShadow: "0 1px 2px rgba(15,23,42,0.12)",
      }}
    >
      {children}
    </button>
  );
}

// ---------- Categories ----------
type Prefs = {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

const CATEGORIES: {
  key: keyof Prefs | "necessary";
  title: string;
  desc: string;
  locked?: boolean;
}[] = [
  {
    key: "necessary",
    title: "Necesarias",
    desc: "Imprescindibles para el funcionamiento de la web.",
    locked: true,
  },
  {
    key: "analytics",
    title: "Analíticas",
    desc: "Nos ayudan a entender cómo se usa la web.",
  },
  {
    key: "marketing",
    title: "Marketing",
    desc: "Para mostrarte publicidad relevante.",
  },
  {
    key: "preferences",
    title: "Preferencias",
    desc: "Recuerdan tus ajustes y personalizaciones.",
  },
];

/** Iframe de preview de plantilla dentro del wizard (no la ventana principal). */
function isOnboardingEmbed(): boolean {
  if (typeof window === 'undefined') return false
  if (window.self === window.top) return false
  return new URLSearchParams(window.location.search).has('parentOrigin')
}

function isOnboardingRoute(pathname: string): boolean {
  return pathname === '/onboarding' || pathname.startsWith('/onboarding/')
}

// ---------- Main component ----------
export default function CookieBanner() {
  const { pathname } = useLocation()
  const hideOnOnboarding = isOnboardingRoute(pathname)
  const isPreview = isOnboardingEmbed()

  const [hasConsent, setHasConsent] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalIn, setModalIn] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(() => {
    const existing = getConsent();
    return {
      analytics: existing?.analytics ?? false,
      marketing: existing?.marketing ?? false,
      preferences: existing?.preferences ?? false,
    };
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const openConsentModal = useCallback(() => {
    setShowBanner(false)
    setShowModal(true)
    setModalIn(true)
  }, [])

  // Sincronizar con localStorage antes del primer pintado (evita modal invisible u oculto).
  useLayoutEffect(() => {
    const existing = getConsent()
    if (existing) {
      setHasConsent(true)
      setShowBanner(false)
      setShowModal(false)
      setModalIn(false)
    } else {
      setHasConsent(false)
      setShowBanner(true)
      setShowModal(false)
      setModalIn(false)
    }
  }, [])

  useEffect(() => {
    const onConsentEvent = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsentData | null>).detail;
      if (detail === null) {
        setHasConsent(false);
        setPrefs({ analytics: false, marketing: false, preferences: false });
        openConsentModal();
        return;
      }
      if (detail) {
        setHasConsent(true);
        setPrefs({
          analytics: detail.analytics,
          marketing: detail.marketing,
          preferences: detail.preferences,
        });
      }
    };
    window.addEventListener('onez:cookie-consent', onConsentEvent as EventListener);
    return () => window.removeEventListener('onez:cookie-consent', onConsentEvent as EventListener);
  }, [openConsentModal]);

  // Si otra pestaña borra el consentimiento en localStorage.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY && e.newValue === null && !getConsent()) {
        setHasConsent(false);
        setShowBanner(true);
        openConsentModal();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [openConsentModal]);

  // Modal animation + focus management
  useEffect(() => {
    if (!showModal) {
      setModalIn(false)
      return
    }
    lastFocusedRef.current = document.activeElement as HTMLElement | null
    setModalIn(true)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && hasConsent) {
        closeModal();
      } else if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);

    // initial focus
    setTimeout(() => {
      modalRef.current
        ?.querySelector<HTMLElement>("button, [tabindex]:not([tabindex='-1'])")
        ?.focus();
    }, 0);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lastFocusedRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, hasConsent]);

  const persist = (p: Prefs) => {
    writeConsent({
      version: CONSENT_VERSION,
      necessary: true,
      analytics: p.analytics,
      marketing: p.marketing,
      preferences: p.preferences,
      updatedAt: new Date().toISOString(),
    });
  };

  const acceptAll = () => {
    persist({ analytics: true, marketing: true, preferences: true });
    closeAll();
  };

  const acceptNecessary = () => {
    persist({ analytics: false, marketing: false, preferences: false });
    closeAll();
  };

  const savePrefs = () => {
    persist(prefs);
    closeAll();
  };

  const closeModal = () => {
    if (!hasConsent) return;
    setModalIn(false);
    setTimeout(() => setShowModal(false), 180);
  };

  const closeAll = () => {
    setModalIn(false);
    setTimeout(() => {
      setShowModal(false);
      setShowBanner(false);
      setHasConsent(true);
    }, 220);
  };

  if (isPreview || hideOnOnboarding) return null

  return (
    <>
      <CookiePreferencesButton
        visible={hasConsent && !showModal && !showBanner}
        onClick={openConsentModal}
      />

      {showBanner && !hasConsent && !showModal ? (
        <div
          role="dialog"
          aria-labelledby="onez-cookie-banner-title"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            padding: '16px clamp(16px, 4vw, 24px)',
            background: C.surface,
            borderTop: `1px solid ${C.border}`,
            boxShadow: '0 -8px 32px rgba(11,31,26,0.12)',
            fontFamily: fontStack,
          }}
        >
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <h2
              id="onez-cookie-banner-title"
              style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: C.text }}
            >
              Usamos cookies
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: C.muted, lineHeight: 1.55, maxWidth: 920 }}>
              Utilizamos cookies estrictamente necesarias para que el servicio funcione. Si lo deseas, puedes activar
              también cookies analíticas para ayudarnos a mejorar. Puedes consultar el detalle en nuestra{' '}
              <Link to={legalRoutes.cookies} style={{ color: C.brand, textDecoration: 'underline' }}>
                Política de Cookies
              </Link>{' '}
              y cambiar tus preferencias en cualquier momento desde Mi cuenta → Privacidad.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
                maxWidth: 640,
              }}
            >
              <OutlineBtn full onClick={acceptNecessary}>
                Rechazar todas
              </OutlineBtn>
              <OutlineBtn full onClick={openConsentModal}>
                Personalizar
              </OutlineBtn>
              <PrimaryBtn full onClick={acceptAll}>
                Aceptar todas
              </PrimaryBtn>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal de personalización */}
      {showModal && (
        <div
          aria-hidden={false}
          onClick={(e) => {
            if (e.target === e.currentTarget && hasConsent) closeModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: C.backdrop,
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            opacity: modalIn ? 1 : 0,
            transition: "opacity 0.15s ease",
            fontFamily: fontStack,
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onez-cookie-title"
            style={{
              background: C.surface,
              borderRadius: 14,
              padding: 28,
              maxWidth: 480,
              width: "calc(100% - 32px)",
              boxShadow:
                "0 8px 24px rgba(11,31,26,0.10), 0 1px 2px rgba(11,31,26,0.06)",
              transform: modalIn ? "scale(1)" : "scale(0.96)",
              opacity: modalIn ? 1 : 0,
              transition: "opacity 0.2s ease, transform 0.2s ease",
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <h2
                id="onez-cookie-title"
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: C.text,
                  letterSpacing: "-0.3px",
                }}
              >
                Preferencias de cookies
              </h2>
              {hasConsent ? (
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={closeModal}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: C.subtle,
                    border: 'none',
                    color: C.muted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              ) : (
                <span style={{ width: 28, flexShrink: 0 }} aria-hidden="true" />
              )}
            </div>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 13,
                color: C.muted,
                lineHeight: 1.5,
              }}
            >
              Puedes activar o desactivar cada categoría. Las cookies necesarias no pueden desactivarse.
            </p>

            <div>
              {CATEGORIES.map((cat, i) => {
                const isLocked = cat.locked;
                const checked = isLocked
                  ? true
                  : prefs[cat.key as keyof Prefs];
                return (
                  <div
                    key={cat.key}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      padding: "14px 0",
                      borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: C.text,
                        }}
                      >
                        {cat.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: C.muted,
                          marginTop: 2,
                          lineHeight: 1.45,
                        }}
                      >
                        {cat.desc}
                      </div>
                    </div>
                    <Toggle
                      checked={checked}
                      disabled={isLocked}
                      ariaLabel={cat.title}
                      onChange={(v) =>
                        setPrefs((p) => ({ ...p, [cat.key]: v }))
                      }
                    />
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 20,
              }}
            >
              <PrimaryBtn full onClick={savePrefs}>
                Guardar preferencias
              </PrimaryBtn>
              <OutlineBtn full onClick={acceptAll}>
                Aceptar todo
              </OutlineBtn>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                <GhostBtn onClick={acceptNecessary}>Solo necesarias</GhostBtn>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
