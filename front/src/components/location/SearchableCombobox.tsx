import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from '../primitives/primitives'

export type ComboboxOption = {
  value: string
  label: string
}

type SearchableComboboxProps = {
  id?: string
  label: string
  value: string
  options: ComboboxOption[]
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  placeholder?: string
  prefixIcon?: 'pin' | 'map'
  emptyMessage?: string
  maxVisible?: number
}

const MAX_DEFAULT = 80

export function SearchableCombobox({
  id: idProp,
  label,
  value,
  options,
  onChange,
  disabled,
  error,
  placeholder = 'Buscar…',
  prefixIcon = 'pin',
  emptyMessage = 'Sin resultados',
  maxVisible = MAX_DEFAULT,
}: SearchableComboboxProps) {
  const autoId = useId()
  const inputId = idProp ?? autoId
  const listId = `${inputId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
      : options
    return base.slice(0, maxVisible)
  }, [options, query, maxVisible])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const displayValue = open ? query : selectedLabel

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      else setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter' && open && filtered[activeIndex]) {
      e.preventDefault()
      pick(filtered[activeIndex].value)
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 500, color: 'var(--lw-text)' }}>
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 44,
          padding: '0 12px',
          background: disabled ? 'var(--lw-surface)' : 'var(--lw-bg-elev)',
          border: `1px solid ${error ? 'var(--lw-danger)' : open ? 'var(--lw-accent)' : 'var(--lw-border)'}`,
          borderRadius: 'var(--lw-r-sm)',
          boxShadow: error ? '0 0 0 3px rgba(220,38,38,.12)' : open ? '0 0 0 3px rgba(45,90,67,.15)' : 'none',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Icon name={prefixIcon} size={15} color="var(--lw-text-2)" />
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!open) setOpen(true)
            setActiveIndex(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            fontSize: 14,
            color: 'var(--lw-text)',
            minWidth: 0,
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={open ? 'Cerrar lista' : 'Abrir lista'}
          onClick={() => setOpen((v) => !v)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: disabled ? 'default' : 'pointer',
            color: 'var(--lw-text-3)',
            display: 'inline-flex',
          }}
        >
          <Icon name="chevronDown" size={14} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
        </button>
      </div>
      {error ? <div style={{ fontSize: 12, color: 'var(--lw-danger)' }}>{error}</div> : null}
      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            margin: 0,
            padding: 6,
            listStyle: 'none',
            maxHeight: 240,
            overflowY: 'auto',
            background: 'var(--lw-bg-elev)',
            border: '1px solid var(--lw-border)',
            borderRadius: 'var(--lw-r-sm)',
            boxShadow: 'var(--lw-shadow-md, 0 8px 24px rgba(0,0,0,.12))',
          }}
        >
          {filtered.length === 0 ? (
            <li style={{ padding: '10px 12px', fontSize: 13, color: 'var(--lw-text-3)' }}>{emptyMessage}</li>
          ) : (
            filtered.map((opt, i) => {
              const active = i === activeIndex
              return (
                <li key={opt.value} role="option" aria-selected={opt.value === value}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(opt.value)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontFamily: 'inherit',
                      fontSize: 14,
                      background: active ? 'var(--lw-surface)' : 'transparent',
                      color: opt.value === value ? 'var(--lw-accent)' : 'var(--lw-text)',
                      fontWeight: opt.value === value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}

