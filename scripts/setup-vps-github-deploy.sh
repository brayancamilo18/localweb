#!/usr/bin/env bash
# Ejecutar UNA VEZ en el VPS como root:
#   sudo bash scripts/setup-vps-github-deploy.sh USUARIO_SSH
#
# USUARIO_SSH = el mismo valor que GitHub secret VPS_USER (no tiene que ser root).
#
# Qué hace:
#   1. Da a ese usuario sudo sin contraseña para /var/www/onez/deploy.sh
#   2. Comprueba que sudo -n funciona (o avisa si usas sudo-rs)

set -euo pipefail

DEPLOY_USER="${1:-}"
if [ -z "$DEPLOY_USER" ] || [ "$(id -u)" -ne 0 ]; then
  echo "Uso (como root): $0 USUARIO_SSH_DE_GITHUB"
  exit 1
fi

if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "ERROR: no existe el usuario $DEPLOY_USER"
  exit 1
fi

SUDOERS_FILE="/etc/sudoers.d/onez-github-deploy"
cat > "$SUDOERS_FILE" <<EOF
# Deploy ONEZ desde GitHub Actions (${DEPLOY_USER})
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/bin/bash /var/www/onez/deploy.sh
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /var/www/onez/deploy.sh
EOF
chmod 440 "$SUDOERS_FILE"

if command -v visudo &>/dev/null; then
  visudo -cf "$SUDOERS_FILE"
fi

echo "==> Probando sudo como ${DEPLOY_USER}..."
if sudo -u "$DEPLOY_USER" sudo -n -l 2>&1 | head -5; then
  true
fi

if sudo -u "$DEPLOY_USER" sudo -n bash /var/www/onez/deploy.sh 2>&1 | head -1; then
  echo "(solo prueba de invocación; no se ejecutó el deploy completo)"
fi

# Prueba real: solo listar que el script arranca (fallará sin arg válido si no pasamos env)
set +e
OUT=$(sudo -u "$DEPLOY_USER" sudo -n bash -c 'test -x /var/www/onez/deploy.sh && echo OK_SUDO' 2>&1)
set -e
if [ "$OUT" = "OK_SUDO" ]; then
  echo "==> Listo. ${DEPLOY_USER} puede ejecutar: sudo -n bash /var/www/onez/deploy.sh prod"
else
  echo "==> AVISO: sudo -n sigue fallando para ${DEPLOY_USER}:"
  echo "$OUT"
  echo ""
  echo "Si ves 'sudo-rs: I'm afraid I can't do that':"
  echo "  - Añade en sudoers (menos seguro pero funciona):"
  echo "      ${DEPLOY_USER} ALL=(ALL) NOPASSWD: ALL"
  echo "  - O usa VPS_USER=root en GitHub Secrets (rápido, menos recomendable)"
  echo "  - O revisa si sudo-rs usa otro archivo de config (/etc/sudo-rs/...)"
  exit 1
fi
