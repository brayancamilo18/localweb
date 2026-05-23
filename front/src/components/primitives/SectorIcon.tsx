import type { SVGProps } from 'react'

export type SectorIconProps = {
  id: string
  size?: number
}

function svgProps(size: number): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
}

function AllGridIcon({ size }: { size: number }) {
  const common = svgProps(size)
  return (
    <svg {...common}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function RestauracionIcon({ size }: { size: number }) {
  const common = svgProps(size)
  return (
    <svg {...common}>
      <path d="M5 3v8a2 2 0 002 2v8M9 3v8a2 2 0 01-2 2M7 3v6" />
      <path d="M17 3c-2 0-3 2-3 5s1 5 3 5v8" />
    </svg>
  )
}

function ClinicaIcon({ size }: { size: number }) {
  const common = svgProps(size)
  return (
    <svg {...common}>
      <path d="M6 3v6a4 4 0 008 0V3" />
      <path d="M10 13v3a4 4 0 008 0v-2" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  )
}

export function SectorIcon({ id, size = 18 }: SectorIconProps) {
  const common = svgProps(size)

  switch (id) {
    case 'all':
    case 'otros':
      return <AllGridIcon size={size} />

    case 'peluqueria':
      return (
        <svg {...common}>
          <circle cx="6" cy="7" r="2.5" />
          <circle cx="6" cy="17" r="2.5" />
          <path d="M8 8.5l12 7M8 15.5l12-7" />
        </svg>
      )

    case 'belleza':
      return (
        <svg {...common}>
          <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" />
          <path d="M18 16l.9 2.1L21 19l-2.1.9L18 22l-.9-2.1L15 19l2.1-.9z" />
        </svg>
      )

    case 'barberia':
      return (
        <svg {...common}>
          <path d="M5 4l8 8M5 8l4 4M16 4l-3 3" />
          <path d="M14 14l5.5 5.5a1.5 1.5 0 102.1-2.1L16 12" />
          <circle cx="5.5" cy="14.5" r="2" />
          <circle cx="9.5" cy="18.5" r="2" />
        </svg>
      )

    case 'estetica':
    case 'spa':
      return (
        <svg {...common}>
          <path d="M12 3c0 4-3 6-3 9a3 3 0 006 0c0-3-3-5-3-9z" />
          <path d="M6 14c-1 1.5-1.5 3-1.5 4.5M18 14c1 1.5 1.5 3 1.5 4.5" />
        </svg>
      )

    case 'restauracion':
    case 'restaurante':
      return <RestauracionIcon size={size} />

    case 'cafeteria':
      return (
        <svg {...common}>
          <path d="M17 8h2a2 2 0 010 4h-2" />
          <path d="M5 8h12v9a2 2 0 01-2 2H7a2 2 0 01-2-2z" />
          <path d="M3 8h2" />
        </svg>
      )

    case 'panaderia':
      return (
        <svg {...common}>
          <path d="M4 14l6-10M20 10a6 6 0 00-6-6c-2 0-4 1-5.5 3L4 14a4 4 0 005.7 5.7l4.5-4.5" />
          <path d="M14 14l2 2" />
        </svg>
      )

    case 'florista':
    case 'floristeria':
      return (
        <svg {...common}>
          <path d="M12 22V12" />
          <path d="M12 12c0-4 4-7 4-7s0 4-4 4" />
          <path d="M12 12c0-4-4-7-4-7s0 4 4 4" />
          <path d="M12 12c4 0 7-4 7-4s-4 0-4 4" />
          <path d="M12 12c-4 0-7-4-7-4s4 0 4 4" />
        </svg>
      )

    case 'bar':
      return (
        <svg {...common}>
          <path d="M8 3h8l-1 9H9L8 3z" />
          <path d="M12 12v3" />
          <path d="M9.5 18h5a1.5 1.5 0 010 3h-5a1.5 1.5 0 010-3z" />
        </svg>
      )

    case 'tienda_ropa':
      return (
        <svg {...common}>
          <path d="M6 3l2 4h8l2-4" />
          <path d="M8 7h8l-1.5 14H9.5L8 7z" />
          <path d="M12 11v6" />
        </svg>
      )

    case 'tienda_calzado':
      return (
        <svg {...common}>
          <path d="M4 14c0-2 2-4 4-4h8c2 0 4 2 4 4v3H4v-3z" />
          <path d="M8 10V8a2 2 0 012-2h0a2 2 0 012 2v2" />
          <path d="M6 17h12" />
        </svg>
      )

    case 'farmacia':
      return (
        <svg {...common}>
          <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4z" />
        </svg>
      )

    case 'clinica_dental':
      return (
        <svg {...common}>
          <path d="M12 3c-2.5 0-4.5 2-4.5 4.5 0 1.5.8 2.8 2 3.5-.5 1.2-1 2.5-1 4 0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.5-.5-2.8-1-4 1.2-.7 2-2 2-3.5C16.5 5 14.5 3 12 3z" />
        </svg>
      )

    case 'fisioterapia':
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4l-3 3M12 11l3 3" />
          <path d="M9 18l3-3 3 3" />
          <path d="M7 14h10" />
        </svg>
      )

    case 'yoga':
      return (
        <svg {...common}>
          <circle cx="12" cy="4" r="1.5" />
          <path d="M12 7l-2 5h4l-2 5" />
          <path d="M7 10l5 2M17 10l-5 2" />
        </svg>
      )

    case 'bienestar':
      return (
        <svg {...common}>
          <path d="M3 12h3l2-6 4 12 2-6h3" />
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      )

    case 'taller':
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 00-5.4 5.4l-5.6 5.6a1.5 1.5 0 002.1 2.1l5.6-5.6a4 4 0 005.4-5.4l-2.5 2.5-2.1-2.1z" />
        </svg>
      )

    case 'gasolinera':
      return (
        <svg {...common}>
          <rect x="4" y="3" width="9" height="18" rx="1.5" />
          <path d="M4 9h9" />
          <path d="M13 8l3 3v6.5a1.5 1.5 0 003 0V11l-2.5-2.5" />
        </svg>
      )

    case 'tienda':
      return (
        <svg {...common}>
          <path d="M4 8l1-4h14l1 4M4 8v11a1 1 0 001 1h14a1 1 0 001-1V8M4 8h16" />
          <path d="M9 8a3 3 0 006 0" />
        </svg>
      )

    case 'clinica':
    case 'dental':
    case 'medico':
      return <ClinicaIcon size={size} />

    case 'veterinario':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="17" rx="3" ry="2.5" />
          <ellipse cx="7" cy="13" rx="1.5" ry="2" />
          <ellipse cx="17" cy="13" rx="1.5" ry="2" />
          <ellipse cx="9" cy="9" rx="1.5" ry="2" />
          <ellipse cx="15" cy="9" rx="1.5" ry="2" />
        </svg>
      )

    case 'fitness':
    case 'gimnasio':
      return (
        <svg {...common}>
          <path d="M3 9v6M21 9v6M6 6v12M18 6v12M6 12h12" />
        </svg>
      )

    case 'hotel':
      return (
        <svg {...common}>
          <path d="M3 19V8M21 19V11a3 3 0 00-3-3H10v6M3 14h18M3 19h18" />
          <circle cx="7" cy="11" r="1.5" />
        </svg>
      )

    case 'servicios':
      return (
        <svg {...common}>
          <path d="M4 8h16v11a1 1 0 01-1 1H5a1 1 0 01-1-1z" />
          <path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2" />
          <path d="M4 13h16" />
        </svg>
      )

    case 'inmobiliaria':
      return (
        <svg {...common}>
          <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" />
        </svg>
      )

    case 'tecnologia':
      return (
        <svg {...common}>
          <rect x="9" y="9" width="6" height="6" rx="1" />
          <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M19 9h3M2 15h3M19 15h3" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      )

    case 'consultoria':
      return (
        <svg {...common}>
          <rect x="2" y="7" width="20" height="15" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M10 14h4" />
        </svg>
      )

    case 'startup':
      return (
        <svg {...common}>
          <path d="M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2l8-8a3 3 0 00-4-4z" />
          <path d="M14 6l4 4" />
        </svg>
      )

    case 'artesania':
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 00-5.4 5.4l-5.6 5.6a1.5 1.5 0 002.1 2.1l5.6-5.6a4 4 0 005.4-5.4l-2.5 2.5-2.1-2.1z" />
        </svg>
      )

    case 'reformas':
      return (
        <svg {...common}>
          <path d="M2 20h20M12 2C9 2 6.5 4 6.5 7v1h11V7C17.5 4 15 2 12 2z" />
          <rect x="4" y="8" width="16" height="4" rx="2" />
        </svg>
      )

    case 'fotografia':
      return (
        <svg {...common}>
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      )

    case 'diseno':
      return (
        <svg {...common}>
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          <path d="M15 5l3 3" />
        </svg>
      )

    case 'arquitectura':
      return (
        <svg {...common}>
          <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V12h6v9" />
        </svg>
      )

    default:
      return <AllGridIcon size={size} />
  }
}
