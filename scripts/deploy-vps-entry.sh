#!/usr/bin/env bash
# Entrada mínima en el VPS: /var/www/onez/deploy.sh
# Instalar una vez (como root):
#   sudo cp scripts/deploy-vps-entry.sh /var/www/onez/deploy.sh && sudo chmod 755 /var/www/onez/deploy.sh
set -euo pipefail

ENV="${1:-}"
if [[ ! "$ENV" =~ ^(prod|pre|des)$ ]]; then
    echo "Uso: $0 {prod|pre|des}"
    exit 1
fi

exec bash "/var/www/onez/$ENV/repo/scripts/deploy.sh" "$ENV"
