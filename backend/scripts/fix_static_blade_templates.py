#!/usr/bin/env python3
"""Post-fix versa / mono / luxe blade templates after automated conversion."""
import re
from pathlib import Path

TPL = Path(__file__).resolve().parents[1] / "resources/views/public/templates"

NAV_BRAND_FIX = """      <span class="brand-mark" id="navBrandMark">
        @if($logo_url)
        <img id="navBrandLogo" class="nav-brand-img" src="{{ $logo_url }}" alt="{{ $nombre }}" decoding="async"/>
        @else
        <span id="navBrandInitial">{{ $inicial }}</span>
        @endif
      </span>"""

SCHEDULE_VERSA = """@php
  $scheduleDays = [
    ['mon', 'Lunes', 1],
    ['tue', 'Martes', 2],
    ['wed', 'Miércoles', 3],
    ['thu', 'Jueves', 4],
    ['fri', 'Viernes', 5],
    ['sat', 'Sábado', 6],
    ['sun', 'Domingo', 0],
  ];
  $todayIdx = (int) now()->dayOfWeek;
@endphp
          <div id="schedule">
@foreach($scheduleDays as [$key, $dayName, $idx])
@php
  $row = is_array($horario) ? ($horario[$key] ?? null) : null;
  $closed = !$row || !empty($row['closed']);
  $open = !$closed && !empty($row['open']);
  $isToday = $idx === $todayIdx;
@endphp
            <div class="schedule-row{{ $isToday ? ' today' : '' }}" data-day="{{ $idx }}"><span class="day">{{ $dayName }}</span><span class="dots"></span><span class="time{{ !$open ? ' closed' : '' }}">@if($open){{ $row['open'] }} — {{ $row['close'] }}@else Cerrado@endif</span></div>
@endforeach
          </div>"""

PRICE_FIXES = [
    (
        r'<span class="svc-price">@if\(isset\(\$services\[(\d+)\]\) && \$services\[\1\]\[\'price\'\] !== null\)\{\{ number_format\(\$services\[\1\]\[\'price\'\], 2, \',\', \'\.\'\) \}\}@else@endif€<small>([^<]+)</small></span>',
        r'''<span class="svc-price">
            @if(isset($services[\1]) && $services[\1]['price'] !== null)
            {{ number_format($services[\1]['price'], 2, ",", ".") }}€
            @else
            a consultar
            @endif
            <small>\2</small>
          </span>''',
    ),
    (
        r'<div class="svc-price">@if\(isset\(\$services\[(\d+)\]\) && \$services\[\1\]\[\'price\'\] !== null\)\{\{ number_format\(\$services\[\1\]\[\'price\'\], 2, \',\', \'\.\'\) \}\}@else@endif<small>([^<]+)</small></div>',
        r'''<div class="svc-price">
            @if(isset($services[\1]) && $services[\1]['price'] !== null)
            {{ number_format($services[\1]['price'], 2, ",", ".") }}
            @else
            Consultar
            @endif
            <small>\2</small>
          </div>''',
    ),
    (
        r'<span class="acc-price">@if\(isset\(\$services\[(\d+)\]\) && \$services\[\1\]\[\'price\'\] !== null\)\{\{ number_format\(\$services\[\1\]\[\'price\'\], 2, \',\', \'\.\'\) \}\}@else@endif €</span>',
        r'''<span class="acc-price">
            @if(isset($services[\1]) && $services[\1]['price'] !== null)
            {{ number_format($services[\1]['price'], 2, ",", ".") }} €
            @else
            Consultar
            @endif
          </span>''',
    ),
]


def fix_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    # Nav brand broken structure
    text = re.sub(
        r'<span class="brand-mark" id="navBrandMark"><span id="navBrandInitial">\{\{ \$inicial \}\}</span>@if\(\$logo_url\).*?@endif</span>',
        NAV_BRAND_FIX,
        text,
        count=1,
        flags=re.DOTALL,
    )

    # Schedule block with inline @php mess
    text = re.sub(
        r'<div id="schedule">\s*<div class="schedule-row" data-day="1">.*?<div class="schedule-row" data-day="0"><span class="day">Domingo</span><span class="dots"></span><span class="time closed">Cerrado</span></div>\s*</div>',
        SCHEDULE_VERSA,
        text,
        count=1,
        flags=re.DOTALL,
    )

    # Mono/luxe accordion schedule rows
    text = re.sub(
        r'(<div class="schedule">)\s*<div class="schedule-row" data-day="1"><span class="day">Lunes</span><span class="time">@php.*?<div class="schedule-row" data-day="6"><span class="day">Sábado</span><span class="time">@php.*?@endif</span></div>\s*<div class="schedule-row" data-day="0"><span class="day">Domingo</span><span class="time closed">Cerrado</span></div>',
        r'\1\n' + SCHEDULE_VERSA.replace('id="schedule"', 'class="schedule"').replace('<div id="schedule">', '<div>').replace('</div>\n          </div>', '</div>'),
        text,
        count=1,
        flags=re.DOTALL,
    )

    for pat, repl in PRICE_FIXES:
        text = re.sub(pat, repl, text)

    path.write_text(text, encoding="utf-8")
    print("fixed", path.name)


for slug in ("versa-studio", "mono-edito", "luxe-atelier"):
    fix_file(TPL / f"{slug}.blade.php")
