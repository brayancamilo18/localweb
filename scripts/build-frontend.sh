#!/usr/bin/env bash
# Compila el SPA (front/). Requiere Node >= 20.19 (Vite 8).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONT="$ROOT/front"

if [ ! -f "$FRONT/package.json" ]; then
  echo "ERROR: no se encuentra $FRONT/package.json" >&2
  exit 1
fi

if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  if [ -f "$FRONT/.nvmrc" ]; then
    nvm install
    nvm use
  else
    nvm install 22
    nvm use 22
  fi
fi

if ! node -e "const [M,m]=process.version.slice(1).split('.').map(Number); process.exit(M>20||(M===20&&m>=19)?0:1)"; then
  echo "ERROR: Node 20.19+ requerido para Vite 8 (actual: v$(node -v))." >&2
  echo "Instala Node 22 en el servidor (nvm install 22) o usa el workflow de CI." >&2
  exit 1
fi

cd "$FRONT"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"

echo "==> npm ci (front)..."
npm ci

echo "==> npm run build..."
npm run build

echo "==> Frontend OK: $FRONT/dist"
