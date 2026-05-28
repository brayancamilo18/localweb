#!/usr/bin/env bash
# Script de deploy (también puede vivir en /var/www/onez/deploy.sh en el VPS).
# Si se invoca la copia estática del VPS, hace git pull y re-ejecuta la versión
# canónica de este archivo en el repo para no quedar desactualizado.
set -euo pipefail

ENV="${1:-}"
if [[ ! "$ENV" =~ ^(prod|pre|des)$ ]]; then
    echo "Uso: $0 {prod|pre|des}"
    exit 1
fi

case "$ENV" in
    prod) BRANCH="main" ;;
    pre)  BRANCH="pre" ;;
    des)  BRANCH="des" ;;
esac

APP_DIR="/var/www/onez/$ENV"
REPO_DIR="$APP_DIR/repo"
CANONICAL_DEPLOY="$REPO_DIR/scripts/deploy.sh"
SCRIPT_SELF="$(readlink -f "${BASH_SOURCE[0]}")"

# Wrapper del VPS (/var/www/onez/deploy.sh) → siempre usar la versión del repo tras pull.
if [[ -f "$CANONICAL_DEPLOY" ]]; then
    CANONICAL_SELF="$(readlink -f "$CANONICAL_DEPLOY")"
    if [[ "$SCRIPT_SELF" != "$CANONICAL_SELF" ]]; then
        git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true
        cd "$REPO_DIR"
        git fetch --all --prune
        git checkout "$BRANCH"
        git reset --hard "origin/$BRANCH"
        exec bash "$CANONICAL_DEPLOY" "$ENV"
    fi
fi

BACKEND="$APP_DIR/backend"
FRONTEND="$APP_DIR/frontend"
LOCK_FILE="$APP_DIR/.deploy.lock"

echo "==> Desplegando entorno: $ENV (rama: $BRANCH)"

exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    echo "ERROR: Ya hay un deploy en curso para $ENV ($LOCK_FILE)."
    exit 1
fi

echo "==> Limpiando builds frontend huérfanos (>24 h)..."
find "$APP_DIR" -maxdepth 1 -type d -name '.front-build.*' -mtime +1 -exec rm -rf {} + 2>/dev/null || true

git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true

cd "$REPO_DIR"
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Sincronizando backend..."
rsync -a --delete \
    --exclude='.env' \
    --exclude='storage/logs/*' \
    --exclude='storage/framework/cache/*' \
    --exclude='storage/framework/sessions/*' \
    --exclude='storage/framework/views/*' \
    --exclude='node_modules' \
    "$REPO_DIR/backend/" "$BACKEND/"

echo "==> Building frontend..."
BUILD_TMP=$(mktemp -d "$APP_DIR/.front-build.XXXXXX")
trap 'rm -rf "$BUILD_TMP"' EXIT

rsync -a \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.vite' \
    "$REPO_DIR/front/" "$BUILD_TMP/"

if [[ ! -f "$BUILD_TMP/src/main.tsx" || ! -f "$BUILD_TMP/vite.config.ts" ]]; then
    echo "ERROR: El checkout no tiene el frontend completo en $REPO_DIR/front (falta src/)."
    echo "       Revisa el clone en el VPS y vuelve a ejecutar: git -C \"$REPO_DIR\" checkout \"$BRANCH\" -- front/"
    exit 1
fi

cd "$BUILD_TMP"

case "$ENV" in
    prod) echo 'VITE_API_URL=https://app.onez.es/api/v1' > .env.production ;;
    pre)  echo 'VITE_API_URL=https://pre.onez.es/api/v1' > .env.production ;;
    des)  echo 'VITE_API_URL=https://des.onez.es/api/v1' > .env.production ;;
esac

npm ci --silent
# Evita TS6053 por tsbuildinfo incremental con rutas de un build anterior.
rm -rf node_modules/.tmp dist
npm run build

rsync -a --delete "$BUILD_TMP/dist/" "$FRONTEND/"
rm -rf "$BUILD_TMP"

echo "==> Backend: composer + artisan..."
cd "$BACKEND"

chown -R www-data:www-data "$APP_DIR"
find "$BACKEND/storage" -type d -exec chmod 775 {} \;
find "$BACKEND/bootstrap/cache" -type d -exec chmod 775 {} \;

sudo -u www-data php artisan down --render="errors::503" || true
sudo -u www-data composer install --no-dev --optimize-autoloader --no-interaction
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan storage:link || true
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
sudo -u www-data php artisan event:cache

echo "==> Restart servicios..."
systemctl reload php8.4-fpm
systemctl restart "onez-queue@$ENV"
sudo -u www-data php artisan queue:restart

sudo -u www-data php artisan up

nginx -t && systemctl reload nginx

echo "==> Deploy de $ENV completado."
