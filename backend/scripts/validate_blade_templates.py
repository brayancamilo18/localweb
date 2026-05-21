"""
Valida estructura de directivas Blade en plantillas públicas de tenant.
Reporta plantillas con desbalance de @if/@endif, @foreach/@endforeach,
@push/@endpush, @section/@endsection y @verbatim/@endverbatim
(las directivas dentro de bloques @verbatim se excluyen del conteo).
"""
import re
import sys
from pathlib import Path

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / 'resources/views/public/templates'

def analyze(path: Path) -> dict:
    text = path.read_text(encoding='utf-8')
    # Bloques verbatim
    verbatim_open = len(re.findall(r'@verbatim\b', text))
    verbatim_close = len(re.findall(r'@endverbatim\b', text))
    # Quitar bloques verbatim para contar el resto
    cleaned = re.sub(r'@verbatim.*?@endverbatim', '', text, flags=re.DOTALL)
    cleaned = re.sub(r'\{\{--.*?--\}\}', '', cleaned, flags=re.DOTALL)
    return {
        'if': len(re.findall(r'@if\b', cleaned)),
        'endif': len(re.findall(r'@endif\b', cleaned)),
        'foreach': len(re.findall(r'@foreach\b', cleaned)),
        'endforeach': len(re.findall(r'@endforeach\b', cleaned)),
        'forelse': len(re.findall(r'@forelse\b', cleaned)),
        'endforelse': len(re.findall(r'@endforelse\b', cleaned)),
        'push': len(re.findall(r'@push\b', cleaned)),
        'endpush': len(re.findall(r'@endpush\b', cleaned)),
        'section': len(re.findall(r'@section\b', cleaned)),
        'endsection': len(re.findall(r'@endsection\b', cleaned)),
        'extends': len(re.findall(r'@extends\b', cleaned)),
        'verbatim_open': verbatim_open,
        'verbatim_close': verbatim_close,
    }

def main() -> int:
    has_errors = False
    templates = sorted(TEMPLATES_DIR.glob('*.blade.php'))
    if not templates:
        print(f"ERROR: no templates found in {TEMPLATES_DIR}")
        return 1
    for tpl in templates:
        r = analyze(tpl)
        problems = []
        # Cada plantilla debe tener exactamente 1 @extends, 1 section/endsection, 2 push/endpush
        if r['extends'] != 1:
            problems.append(f"@extends count {r['extends']} (expected 1)")
        if r['section'] != 1 or r['endsection'] != 1:
            problems.append(f"@section/@endsection {r['section']}/{r['endsection']} (expected 1/1)")
        if r['push'] != 2 or r['endpush'] != 2:
            problems.append(f"@push/@endpush {r['push']}/{r['endpush']} (expected 2/2)")
        if r['verbatim_open'] != r['verbatim_close']:
            problems.append(f"@verbatim/@endverbatim {r['verbatim_open']}/{r['verbatim_close']} (must be equal)")
        if r['if'] != r['endif']:
            problems.append(f"@if/@endif {r['if']}/{r['endif']}")
        if r['foreach'] != r['endforeach']:
            problems.append(f"@foreach/@endforeach {r['foreach']}/{r['endforeach']}")
        if r['forelse'] != r['endforelse']:
            problems.append(f"@forelse/@endforelse {r['forelse']}/{r['endforelse']}")
        # Cada plantilla debe tener >0 @if (al menos uno para logo, etc) — sirve de
        # detección de verbatim huérfanos que devoran el archivo entero
        if r['if'] == 0 and r['section'] == 1:
            problems.append("@if count is 0 but @section exists — possible orphan @verbatim")
        if problems:
            has_errors = True
            print(f"FAIL {tpl.name}: " + "; ".join(problems))
        else:
            print(f"OK   {tpl.name}: if={r['if']} foreach={r['foreach']} push={r['push']} verbatim={r['verbatim_open']}")
    return 1 if has_errors else 0

if __name__ == '__main__':
    sys.exit(main())
