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

  const controlClass = [
    'lw-searchable-combobox__control',
    error && 'lw-searchable-combobox__control--error',
    open && 'lw-searchable-combobox__control--open',
    disabled && 'lw-searchable-combobox__control--disabled',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={rootRef} className="lw-searchable-combobox">
      <label htmlFor={inputId} className="lw-searchable-combobox__label">
        {label}
      </label>
      <div className={controlClass}>
        <span className="lw-searchable-combobox__prefix" aria-hidden>
          <Icon name={prefixIcon} size={15} color="var(--lw-text-2)" />
        </span>
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
          className="lw-searchable-combobox__input"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className="lw-searchable-combobox__toggle"
          aria-label={open ? 'Cerrar lista' : 'Abrir lista'}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name="chevronDown" size={14} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
        </button>
      </div>
      {error ? <div className="lw-searchable-combobox__error">{error}</div> : null}
      {open && !disabled ? (
        <ul id={listId} role="listbox" className="lw-searchable-combobox__listbox">
          {filtered.length === 0 ? (
            <li className="lw-searchable-combobox__empty">{emptyMessage}</li>
          ) : (
            filtered.map((opt, i) => {
              const active = i === activeIndex
              const selected = opt.value === value
              return (
                <li key={opt.value} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={[
                      'lw-searchable-combobox__option',
                      active && 'lw-searchable-combobox__option--active',
                      selected && 'lw-searchable-combobox__option--selected',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(opt.value)}
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
