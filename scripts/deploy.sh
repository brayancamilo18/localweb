#!/usr/bin/env bash
# Copia canónica del script de deploy del VPS (/var/www/onez/deploy.sh).
# Instalar/actualizar en el servidor (como root):
#   sudo cp scripts/deploy.sh /var/www/onez/deploy.sh && sudo chmod 755 /var/www/onez/deploy.sh
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
BACKEND="$APP_DIR/backend"
FRONTEND="$APP_DIR/frontend"

echo "==> Desplegando entorno: $ENV (rama: $BRANCH)"

echo "==> Limpiando temporales huérfanos..."
rm -rf /tmp/tmp.* /var/tmp/tmp.* 2>/dev/null || true

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
BUILD_TMP=$(mktemp -d -p /var/tmp 2>/dev/null) || BUILD_TMP=$(mktemp -d)
trap 'rm -rf "$BUILD_TMP"' EXIT

rsync -a \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.vite' \
    "$REPO_DIR/front/" "$BUILD_TMP/"
cd "$BUILD_TMP"

case "$ENV" in
    prod) echo 'VITE_API_URL=https://app.onez.es/api/v1' > .env.production ;;
    pre)  echo 'VITE_API_URL=https://pre.onez.es/api/v1' > .env.production ;;
    des)  echo 'VITE_API_URL=https://des.onez.es/api/v1' > .env.production ;;
esac

npm ci --silent
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
