#!/bin/bash
# ============================================================
# CanchaLlena — Pipeline de clonación de agente por club (chip propio)
# Crea un perfil Hermes dedicado para un club Pro con su número propio.
# Versionado en repo: scripts/crear_club_agente.sh (deploy manual al VPS /root/scripts/)
#
# USO:
#   bash crear_club_agente.sh --club "Club Olmue" --slug club-olmue \
#     --bridge-port 3010 --owners "+56941294775,+56951095354" [--dry-run]
#
# IMPORTANTE: bash NO soporta variables con tildes/ñ; usar SOLO ASCII.
# Qué hace: clona 'canchallena', personaliza SOUL, configura bridge propio
# y allow_admin_from con los dueños. NO se ejecuta para ningún club
# hasta que un plan Pro contrate (queda inerte).
# ============================================================
set -euo pipefail

BASE_DIR="/root/.hermes"
BASE_PROFILE="canchallena"
DRY_RUN=0
CLUB_NAME=""
SLUG=""
BRIDGE_PORT=""
OWNERS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --club) CLUB_NAME="$2"; shift 2 ;;
    --slug) SLUG="$2"; shift 2 ;;
    --bridge-port) BRIDGE_PORT="$2"; shift 2 ;;
    --owners) OWNERS="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "Desconocido: $1"; exit 1 ;;
  esac
done

[ -z "$CLUB_NAME" ] && [ -z "$SLUG" ] && { echo "ERROR: --club o --slug requerido"; exit 1; }
[ -z "$BRIDGE_PORT" ] && { echo "ERROR: --bridge-port requerido (usados: 3003, 3009, 3011)"; exit 1; }
[ -z "$SLUG" ] && SLUG=$(echo "$CLUB_NAME" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9' )

NEW_PROFILE="canchallena-${SLUG}"
NEW_DIR="$BASE_DIR/profiles/$NEW_PROFILE"

echo "> Clonando agente para: ${CLUB_NAME:-$SLUG}"
echo "  Perfil: $NEW_PROFILE | Bridge: $BRIDGE_PORT | Owners: ${OWNERS:-ninguno}"
[ $DRY_RUN -eq 1 ] && echo "  [DRY-RUN] sin cambios."

# 1. Clonar perfil base
if [ $DRY_RUN -eq 0 ]; then
  cp -r "$BASE_DIR/profiles/$BASE_PROFILE" "$NEW_DIR"
  rm -rf "$NEW_DIR/platforms/whatsapp/session" "$NEW_DIR/logs" "$NEW_DIR/cron/output" \
         "$NEW_DIR/state" "$NEW_DIR/image_cache" "$NEW_DIR/audio_cache" \
         "$NEW_DIR/response_store.db" "$NEW_DIR/auth.lock" "$NEW_DIR/gateway.lock"
  echo "  OK perfil clonado (estado limpio)"
fi

# 2. Personalizar SOUL
if [ $DRY_RUN -eq 0 ] && [ -n "$CLUB_NAME" ]; then
  sed -i "s/el agente digital de un club de pádel/el agente digital del club ${CLUB_NAME}/g" "$NEW_DIR/SOUL.md" 2>/dev/null || true
  echo "  OK SOUL personalizado"
fi

# 3. Configur bridge propio + session en config
if [ $DRY_RUN -eq 0 ]; then
  python3 - "$NEW_DIR/config.yaml" "$BRIDGE_PORT" "$NEW_PROFILE" <<'EOF'
import sys, yaml
p, port, prof = sys.argv[1], sys.argv[2], sys.argv[3]
c = yaml.safe_load(open(p))
pls = c.setdefault('gateway',{}).setdefault('platforms',{})
wa = pls.setdefault('whatsapp',{})
wa['extra'] = {'bridge_port': int(port), 'session_path': f'/root/.hermes/profiles/{prof}/platforms/whatsapp/session'}
wa['enabled'] = True
c.setdefault('platforms',{}).setdefault('whatsapp',{}).setdefault('allow_admin_from',[])
yaml.safe_dump(c, open(p,'w'), default_flow_style=False, allow_unicode=True, sort_keys=False)
print('  OK config bridge_port', port)
EOF
fi

# 4. Configurar owners (allow_admin_from)
if [ $DRY_RUN -eq 0 ] && [ -n "$OWNERS" ]; then
  python3 - "$NEW_DIR/config.yaml" "$OWNERS" <<'EOF'
import sys, yaml
p, owners = sys.argv[1], sys.argv[2]
c = yaml.safe_load(open(p))
targets = []
for o in owners.split(','):
    o = o.strip().replace('+','').replace(' ','')
    targets.append(o + '@s.whatsapp.net' if not o.endswith('@s.whatsapp.net') else o)
c.setdefault('platforms',{}).setdefault('whatsapp',{})['allow_admin_from'] = targets
yaml.safe_dump(c, open(p,'w'), default_flow_style=False, allow_unicode=True, sort_keys=False)
print('  OK owners:', targets)
EOF
elif [ $DRY_RUN -eq 1 ] && [ -n "$OWNERS" ]; then
  echo "  [dry] owners <- $OWNERS"
fi

cat <<'EOF'

----------------------------------------------
PROXIMOS PASOS (manuales, con el chip del club):
1. Entregar el chip/SIM al dueno y que lo active.
2. Parear la sesion del nuevo perfil (scaneo QR) en su session_path.
3. Arrancar el gateway del nuevo perfil + su bridge propio.
4. El MCP usa la API multi-tenant; el club se reconoce por club_id.
----------------------------------------------
EOF
echo "Pipeline listo. (DRY_RUN=$DRY_RUN)"
