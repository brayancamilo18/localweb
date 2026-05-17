import type { CSSProperties, ReactElement, SVGProps } from 'react'

type IconProps = {
  name: string
  size?: number
  stroke?: number
  color?: string
  style?: CSSProperties
}

export default function Icon({ name, size = 16, stroke = 1.5, color = 'currentColor', style }: IconProps) {
  const common: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { display: 'inline-block', flexShrink: 0, ...style },
  }

  const paths: Record<string, ReactElement> = {
    check: <polyline points="4 12 10 18 20 6" />,
    x: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    minus: <line x1="5" y1="12" x2="19" y2="12" />,
    chevronRight: <polyline points="9 6 15 12 9 18" />,
    chevronLeft: <polyline points="15 6 9 12 15 18" />,
    chevronDown: <polyline points="6 9 12 15 18 9" />,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></>,
    arrowUpRight: <><line x1="7" y1="17" x2="17" y2="7" /><polyline points="9 7 17 7 17 15" /></>,
    upload: <><path d="M12 16V4" /><polyline points="6 9 12 3 18 9" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><polyline points="3 17 9 13 14 17 21 12" /></>,
    camera: <><path d="M4 8h3l2-2h6l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" /><circle cx="12" cy="13" r="3.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
    map: <><polygon points="3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20 3 6" /><line x1="9" y1="4" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="20" /></>,
    pin: <><path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
    phone: <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></>,
    user: <><circle cx="12" cy="9" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    users: <><circle cx="9" cy="9" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5a3.5 3.5 0 0 1 0 7" /><path d="M21.5 20a6.5 6.5 0 0 0-3.5-5.5" /></>,
    sparkle: <><path d="M12 3v6" /><path d="M12 15v6" /><path d="M3 12h6" /><path d="M15 12h6" /><path d="M6 6l3 3" /><path d="M15 15l3 3" /><path d="M18 6l-3 3" /><path d="M9 15l-3 3" /></>,
    bolt: <polygon points="13 3 5 13 11 13 10 21 18 11 12 11 13 3" />,
    smartphone: <><rect x="6" y="2" width="12" height="20" rx="2.5" /><line x1="11" y1="18" x2="13" y2="18" /></>,
    monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><line x1="8" y1="20" x2="16" y2="20" /><line x1="12" y1="16" x2="12" y2="20" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: (
      <>
        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
        <path d="m2 2 20 20" />
      </>
    ),
    edit: <><path d="M4 20h4l10-10-4-4L4 16v4z" /><line x1="14" y1="6" x2="18" y2="10" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.8a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.4a7 7 0 0 0-2 1.2l-2.4-.8-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-.8a7 7 0 0 0 2 1.2L10 21h4l.5-2.4a7 7 0 0 0 2-1.2l2.4.8 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    barChart: <><line x1="4" y1="20" x2="20" y2="20" /><rect x="6" y="11" width="3" height="9" /><rect x="11" y="6" width="3" height="14" /><rect x="16" y="14" width="3" height="6" /></>,
    trending: <><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></>,
    creditCard: <><rect x="3" y="6" width="18" height="13" rx="2" /><line x1="3" y1="11" x2="21" y2="11" /></>,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    unlock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 7-2.5" /></>,
    menu: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><line x1="16" y1="16" x2="20" y2="20" /></>,
    trash: <><polyline points="4 7 20 7" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /></>,
    info: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r=".7" fill={color} stroke="none" /></>,
    alert: <><path d="M12 3l10 17H2L12 3z" /><line x1="12" y1="10" x2="12" y2="14" /><circle cx="12" cy="17" r=".7" fill={color} stroke="none" /></>,
    star: <polygon points="12 3 14.6 9 21 9.7 16 14 17.5 20.5 12 17.2 6.5 20.5 8 14 3 9.7 9.4 9 12 3" />,
    whatsapp: <><path d="M3 21l1.6-5A9 9 0 1 1 8 19.4L3 21z" /><path d="M8.5 9.5c.5-.7 1.4-.7 1.8 0l.4 1c.2.5 0 .9-.3 1.2-.4.4-.4 1 0 1.5a5 5 0 0 0 2 2c.5.4 1.1.4 1.5 0 .3-.3.7-.5 1.2-.3l1 .4c.7.4.7 1.3 0 1.8-1 .7-2.4.7-3.4 0-1.6-1-3-2.4-4-4-.7-1-.7-2.4 0-3.4z" /></>,
    list: <><line x1="8" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="8" y1="18" x2="20" y2="18" /><circle cx="4.5" cy="6" r=".7" fill={color} stroke="none" /><circle cx="4.5" cy="12" r=".7" fill={color} stroke="none" /><circle cx="4.5" cy="18" r=".7" fill={color} stroke="none" /></>,
    home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>,
    layout: <><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="9" x2="9" y2="20" /></>,
    palette: <><circle cx="7" cy="11" r="1.5" /><circle cx="11" cy="7" r="1.5" /><circle cx="16" cy="9" r="1.5" /><circle cx="17" cy="14" r="1.5" /><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.5 1.5-1.5 0-1-1-1.5-1-2.5 0-1 1-2 2-2h2a4 4 0 0 0 4-4 9 9 0 0 0-9-8z" /></>,
    scissors: <><circle cx="6" cy="7" r="2.5" /><circle cx="6" cy="17" r="2.5" /><line x1="20" y1="4" x2="8.5" y2="15.5" /><line x1="14" y1="14" x2="20" y2="20" /><line x1="20" y1="4" x2="14" y2="10" /></>,
    refresh: <><polyline points="20 6 20 11 15 11" /><polyline points="4 18 4 13 9 13" /><path d="M20 11A8 8 0 0 0 6 7" /><path d="M4 13a8 8 0 0 0 14 4" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0v5l1.5 3H4.5L6 13z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
    logOut: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  }

  return <svg {...common}>{paths[name] || null}</svg>
}
