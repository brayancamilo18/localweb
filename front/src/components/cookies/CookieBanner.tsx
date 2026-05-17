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
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  CONSENT_KEY,
  CONSENT_VERSION,
  getConsent,
  writeConsent,
  type CookieConsentData,
} from '../../lib/cookieConsent'

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

// ---------- Main component ----------
export default function CookieBanner() {
  const isPreview =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('parentOrigin')

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [modalIn, setModalIn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    analytics: false,
    marketing: false,
    preferences: false,
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const showBannerAgain = useCallback(() => {
    setShowModal(false)
    setModalIn(false)
    setVisible(true)
    requestAnimationFrame(() => setAnimateIn(true))
  }, [])

  // Mount + initial detection (avoid SSR mismatch)
  useEffect(() => {
    setMounted(true);
    const existing = getConsent();
    if (!existing) {
      showBannerAgain();
    }
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [showBannerAgain]);

  useEffect(() => {
    const onReset = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsentData | null>).detail
      if (detail === null) showBannerAgain()
    }
    window.addEventListener('onez:cookie-consent', onReset as EventListener)
    return () => window.removeEventListener('onez:cookie-consent', onReset as EventListener)
  }, [showBannerAgain])

  // Si borran la preferencia en DevTools (localStorage) sin recargar, o en otra pestaña.
  useEffect(() => {
    const syncIfConsentRemoved = () => {
      if (!getConsent()) showBannerAgain()
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY && e.newValue === null) syncIfConsentRemoved()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', syncIfConsentRemoved)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', syncIfConsentRemoved)
    }
  }, [showBannerAgain])

  // Modal animation + focus management
  useEffect(() => {
    if (!showModal) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => setModalIn(true));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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
  }, [showModal]);

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
    setModalIn(false);
    setTimeout(() => setShowModal(false), 180);
  };

  const closeAll = () => {
    setModalIn(false);
    setAnimateIn(false);
    setTimeout(() => {
      setShowModal(false);
      setVisible(false);
    }, 220);
  };

  if (isPreview) return null
  if (!mounted || !visible) return null;

  // ---------- VIEW 1: compact bar ----------
  const barWrap: CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    background: C.surface,
    borderTop: `1px solid ${C.border}`,
    boxShadow: "0 -4px 16px rgba(11,31,26,0.08)",
    padding: isMobile ? "14px 16px" : "16px 24px",
    fontFamily: fontStack,
    transform: animateIn ? "translateY(0)" : "translateY(100%)",
    transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
  };

  const barInner: CSSProperties = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
    gap: isMobile ? 12 : 16,
    maxWidth: 1280,
    margin: "0 auto",
  };

  const textBlock: CSSProperties = {
    display: "flex",
    alignItems: isMobile ? "flex-start" : "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  };

  const btnRow: CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: isMobile ? "stretch" : "flex-end",
  };

  return (
    <>
      <div
        role="region"
        aria-label="Aviso de cookies"
        style={barWrap}
      >
        <div style={barInner}>
          <div style={textBlock}>
            <span
              aria-hidden="true"
              style={{
                fontSize: 20,
                lineHeight: 1,
                flexShrink: 0,
                marginTop: isMobile ? 2 : 0,
              }}
            >
              🍪
            </span>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 2 : 8, alignItems: isMobile ? "flex-start" : "baseline", flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                Usamos cookies
              </span>
              <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.4 }}>
                Utilizamos cookies propias y de terceros para mejorar tu experiencia y analizar el uso de la web.
              </span>
            </div>
          </div>
          <div style={btnRow}>
            <GhostBtn onClick={acceptNecessary}>Solo necesarias</GhostBtn>
            <OutlineBtn onClick={() => setShowModal(true)}>Personalizar</OutlineBtn>
            <PrimaryBtn onClick={acceptAll}>Aceptar todo</PrimaryBtn>
          </div>
        </div>
      </div>

      {/* VIEW 2: Modal */}
      {showModal && (
        <div
          aria-hidden={false}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: C.backdrop,
            zIndex: 1001,
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
              <button
                type="button"
                aria-label="Cerrar"
                onClick={closeModal}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: C.subtle,
                  border: "none",
                  color: C.muted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
