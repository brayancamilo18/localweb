#!/usr/bin/env bash
# Ejecutar en el VPS como root:
#   sudo bash scripts/setup-vps-github-deploy.sh NOMBRE_USUARIO_GITHUB
#
# Si sigues viendo "sudo-rs: I'm afraid I can't do that", la opción fiable es
# usar root en GitHub: Secrets VPS_USER=root + clave SSH de root.

set -euo pipefail

DEPLOY_USER="${1:-}"
if [ -z "$DEPLOY_USER" ] || [ "$(id -u)" -ne 0 ]; then
  echo "Uso (como root): $0 USUARIO_SSH"
  exit 1
fi

if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "ERROR: no existe el usuario $DEPLOY_USER"
  exit 1
fi

SUDOERS_FILE="/etc/sudoers.d/onez-github-deploy"
cat > "$SUDOERS_FILE" <<EOF
# GitHub Actions (SSH sin TTY, como appleboy/ssh-action)
Defaults:${DEPLOY_USER} !requiretty
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /bin/bash /var/www/onez/deploy.sh *
EOF
chmod 440 "$SUDOERS_FILE"
visudo -c

echo "==> Prueba sin TTY (igual que GitHub Actions)..."
if sudo -u "$DEPLOY_USER" script -q -c "sudo -n /bin/bash /var/www/onez/deploy.sh des" /dev/null; then
  echo "OK: sudo -n funciona sin TTY"
else
  echo "FALLO: añade !requiretty o usa VPS_USER=root en GitHub Secrets"
  exit 1
fi
