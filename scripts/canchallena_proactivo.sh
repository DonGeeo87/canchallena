#!/bin/bash
# Proactividad CanchaLlena: monitorea partidos 2/4-3/4 y llena canchas.
# Instalado en el VPS: /usr/local/bin/canchallena_proactivo.sh
# Cron: */5 * * * * /usr/local/bin/canchallena_proactivo.sh
# Log: /var/log/canchallena-proactivo.log
LOG=/var/log/canchallena-proactivo.log
RESP=$(curl -s -X POST http://127.0.0.1:3018/api/proactivo/fill -H 'Content-Type: application/json' -d '{}' 2>&1)
if echo "$RESP" | grep -q '"accionados":\[\]'; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') sin accion" >> "$LOG"
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') $RESP" >> "$LOG"
fi
