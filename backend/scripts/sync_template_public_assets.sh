#!/usr/bin/env bash
# Copia JS/CSS compartidos de plantillas → backend/public/templates/
# (las webs de tenant se sirven desde Laravel, no desde el build de Vite).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/front/public/templates"
DST="$ROOT/backend/public/templates"

mkdir -p "$DST"
for asset in brand-apply.js lw-about-extras.css lw-about-extras.js lw-contact-links.js lw-events.css lw-events.js lw-landing-demo.js lw-schedule.js; do
  if [[ -f "$SRC/$asset" ]]; then
    cp "$SRC/$asset" "$DST/$asset"
    echo "OK $asset"
  else
    echo "SKIP (missing) $asset"
  fi
done
