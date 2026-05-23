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
# GitHub Actions → /var/www/onez/deploy.sh (requiere privilegios de root)
${DEPLOY_USER} ALL=(ALL) NOPASSWD: ALL
Defaults:${DEPLOY_USER} !requiretty
EOF
chmod 440 "$SUDOERS_FILE"
visudo -cf "$SUDOERS_FILE" 2>/dev/null || true

echo "==> Probando como ${DEPLOY_USER}..."
if sudo -u "$DEPLOY_USER" sudo -n -v 2>&1; then
  echo "OK: ${DEPLOY_USER} tiene sudo -n"
  echo ""
  echo "Prueba el deploy (tarda varios minutos):"
  echo "  sudo -u ${DEPLOY_USER} sudo -n bash /var/www/onez/deploy.sh prod"
else
  echo "FALLO: sudo -n no funciona. Usa VPS_USER=root en GitHub Secrets."
  exit 1
fi
