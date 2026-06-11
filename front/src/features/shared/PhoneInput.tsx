import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Country } from 'country-state-city'

// ─── tipos ────────────────────────────────────────────────────
type CountryEntry = {
  isoCode: string
  name: string
  flag: string
  dialCode: string
}

type PhoneInputProps = {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  className?: string
}

// ─── datos de países (cacheados fuera del componente) ─────────
function buildCountries(): CountryEntry[] {
  return Country.getAllCountries()
    .filter((c) => c.phonecode && c.phonecode !== '0')
    .map((c) => ({
      isoCode: c.isoCode,
      name: c.name,
      flag: c.flag ?? '',
      dialCode: c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

const ALL_COUNTRIES = buildCountries()

function parseStored(stored: string): { dialCode: string; local: string } {
  const trimmed = stored.trim()
  const match = trimmed.match(/^(\+\d{1,4})\s?(.*)$/)
  if (match) {
    return { dialCode: match[1], local: match[2].replace(/[^\d\s]/g, '') }
  }
  return { dialCode: '+34', local: trimmed.replace(/[^\d\s]/g, '') }
}

function guessIso(dialCode: string): string {
  const found = ALL_COUNTRIES.find((c) => c.dialCode === dialCode)
  return found?.isoCode ?? 'ES'
}

// ─── CSS (inyectado una sola vez) ─────────────────────────────
const STYLES = `
.lw-phone-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  position: relative;
}

/* ── trigger ── */
.lw-phone-trigger {
  flex: 0 0 auto;
  min-width: 96px;
  height: var(--lw-form-control-height, 40px);
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--lw-bg-elev);
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-r-sm);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: border-color .12s, box-shadow .12s;
  font-family: inherit;
}
.lw-phone-trigger:focus-visible {
  outline: none;
  border-color: var(--lw-accent);
  box-shadow: 0 0 0 3px var(--lw-accent-ring, rgba(99,102,241,.15));
}
.lw-phone-trigger--error {
  border-color: var(--lw-danger);
  box-shadow: 0 0 0 3px rgba(220,38,38,.12);
}
.lw-phone-trigger--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--lw-surface);
}
.lw-phone-trigger__flag { font-size: 18px; line-height: 1; }
.lw-phone-trigger__dial { font-size: 13px; color: var(--lw-text-2); }
.lw-phone-trigger__caret { font-size: 10px; color: var(--lw-text-3); margin-left: 2px; }

/* ── dropdown ── */
.lw-phone-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 9999;
  width: 280px;
  max-width: calc(100vw - 24px);
  background: var(--lw-bg-elev);
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-r);
  box-shadow: 0 8px 24px rgba(15,23,42,.14), 0 2px 6px rgba(15,23,42,.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.lw-phone-search-wrap {
  padding: 8px;
  border-bottom: 1px solid var(--lw-border);
  display: flex;
  align-items: center;
  gap: 6px;
}
.lw-phone-search-icon {
  flex-shrink: 0;
  color: var(--lw-text-3);
}
.lw-phone-search {
  flex: 1;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  color: var(--lw-text);
  outline: none;
  padding: 0;
}
.lw-phone-search::placeholder { color: var(--lw-text-4); }
.lw-phone-list {
  overflow-y: auto;
  max-height: 220px;
  padding: 4px 0;
}
.lw-phone-list-empty {
  padding: 12px 14px;
  font-size: 13px;
  color: var(--lw-text-3);
  text-align: center;
}
.lw-phone-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  cursor: pointer;
  font-size: 13px;
  transition: background .08s;
}
.lw-phone-option:hover,
.lw-phone-option--active {
  background: var(--lw-surface);
}
.lw-phone-option--active {
  font-weight: 500;
}
.lw-phone-option__flag { font-size: 17px; line-height: 1; flex-shrink: 0; }
.lw-phone-option__name { flex: 1; color: var(--lw-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lw-phone-option__dial { color: var(--lw-text-3); flex-shrink: 0; }

/* ── número ── */
.lw-phone-number {
  flex: 1 1 0;
  min-width: 0;
  height: var(--lw-form-control-height, 40px);
  padding: 0 12px;
  background: var(--lw-bg-elev);
  border: 1px solid var(--lw-border);
  border-radius: var(--lw-r-sm);
  font-family: inherit;
  font-size: var(--lw-form-input, 14px);
  color: var(--lw-text);
  outline: none;
  -moz-appearance: textfield;
  transition: border-color .12s, box-shadow .12s;
}
.lw-phone-number--error {
  border-color: var(--lw-danger);
  box-shadow: 0 0 0 3px rgba(220,38,38,.12);
}
.lw-phone-number--disabled {
  opacity: 0.6;
  background: var(--lw-surface);
}
.lw-phone-number::-webkit-outer-spin-button,
.lw-phone-number::-webkit-inner-spin-button { -webkit-appearance: none; }
.lw-phone-number:focus {
  border-color: var(--lw-accent);
  box-shadow: 0 0 0 3px var(--lw-accent-ring, rgba(99,102,241,.15));
}
.lw-phone-error-msg {
  font-size: var(--lw-form-caption, 12px);
  color: var(--lw-danger);
  margin-top: 4px;
}

/* ── responsive ── */
@media (max-width: 400px) {
  .lw-phone-row { flex-direction: column; align-items: stretch; }
  .lw-phone-trigger { min-width: 0; width: 100%; }
  .lw-phone-number { width: 100%; }
  .lw-phone-dropdown { width: 100%; left: 0; right: 0; }
}
`

let stylesInjected = false
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return
  const el = document.createElement('style')
  el.textContent = STYLES
  document.head.appendChild(el)
  stylesInjected = true
}

// ─── componente principal ─────────────────────────────────────
export default function PhoneInput({
  value = '',
  onChange,
  disabled = false,
  error,
  className,
}: PhoneInputProps) {
  injectStyles()

  const { dialCode: initDial, local: initLocal } = useMemo(
    () => parseStored(value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [selectedIso, setSelectedIso] = useState<string>(() => guessIso(initDial))
  const [localNumber, setLocalNumber] = useState<string>(initLocal)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedCountry = useMemo(
    () => ALL_COUNTRIES.find((c) => c.isoCode === selectedIso) ?? ALL_COUNTRIES[0],
    [selectedIso],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ALL_COUNTRIES
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.isoCode.toLowerCase().includes(q),
    )
  }, [search])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Enfocar buscador al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 30)
      // Scroll al país activo
      const activeEl = listRef.current?.querySelector('[data-active="true"]') as HTMLElement | null
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [open])

  const emit = useCallback(
    (iso: string, local: string) => {
      const country = ALL_COUNTRIES.find((c) => c.isoCode === iso)
      const dial = country?.dialCode ?? '+34'
      const digits = local.replace(/[^\d\s]/g, '').trimStart()
      onChange?.(digits ? `${dial} ${digits}` : '')
    },
    [onChange],
  )

  const handleSelect = useCallback(
    (iso: string) => {
      setSelectedIso(iso)
      setOpen(false)
      setSearch('')
      emit(iso, localNumber)
    },
    [localNumber, emit],
  )

  const handleNumberChange = useCallback(
    (raw: string) => {
      const clean = raw.replace(/[^\d\s]/g, '')
      setLocalNumber(clean)
      emit(selectedIso, clean)
    },
    [selectedIso, emit],
  )

  const triggerClass = [
    'lw-phone-trigger',
    error ? 'lw-phone-trigger--error' : '',
    disabled ? 'lw-phone-trigger--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const numberClass = [
    'lw-phone-number',
    error ? 'lw-phone-number--error' : '',
    disabled ? 'lw-phone-number--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} ref={wrapperRef}>
      <div className="lw-phone-row">
        {/* ── Trigger del selector ── */}
        <button
          type="button"
          className={triggerClass}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Seleccionar prefijo de país"
          onClick={() => !disabled && setOpen((v) => !v)}
        >
          <span className="lw-phone-trigger__flag">{selectedCountry.flag}</span>
          <span className="lw-phone-trigger__dial">{selectedCountry.dialCode}</span>
          <span className="lw-phone-trigger__caret">{open ? '▴' : '▾'}</span>
        </button>

        {/* ── Dropdown con buscador ── */}
        {open && (
          <div className="lw-phone-dropdown" role="listbox" aria-label="Lista de países">
            {/* Buscador */}
            <div className="lw-phone-search-wrap">
              <svg
                className="lw-phone-search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="6.5" />
                <line x1="16" y1="16" x2="20" y2="20" />
              </svg>
              <input
                ref={searchRef}
                className="lw-phone-search"
                type="text"
                placeholder="Buscar país o prefijo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false)
                    setSearch('')
                  }
                  if (e.key === 'Enter' && filtered.length === 1) {
                    handleSelect(filtered[0].isoCode)
                  }
                }}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Borrar búsqueda"
                  onClick={() => setSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 2px',
                    color: 'var(--lw-text-3)',
                    fontSize: 14,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Lista de resultados */}
            <div ref={listRef} className="lw-phone-list">
              {filtered.length === 0 ? (
                <div className="lw-phone-list-empty">Sin resultados</div>
              ) : (
                filtered.map((c) => {
                  const isActive = c.isoCode === selectedIso
                  return (
                    <div
                      key={c.isoCode}
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      className={`lw-phone-option${isActive ? ' lw-phone-option--active' : ''}`}
                      onClick={() => handleSelect(c.isoCode)}
                    >
                      <span className="lw-phone-option__flag">{c.flag}</span>
                      <span className="lw-phone-option__name">{c.name}</span>
                      <span className="lw-phone-option__dial">{c.dialCode}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── Input numérico ── */}
        <input
          className={numberClass}
          type="tel"
          inputMode="numeric"
          pattern="[0-9 ]*"
          placeholder="600 000 000"
          value={localNumber}
          disabled={disabled}
          aria-label="Número de teléfono"
          onChange={(e) => handleNumberChange(e.target.value)}
        />
      </div>

      {error && <div className="lw-phone-error-msg">{error}</div>}
    </div>
  )
}
