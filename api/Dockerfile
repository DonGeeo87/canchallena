# CanchaLlena API — single-stage (patrón skill: copia dist pre-compilado)
# OBLIGATORIO Node 22+: _lib/db.ts usa node:sqlite (DatabaseSync), no existe en Node 20
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev --no-save 2>/dev/null || true
# dist pre-compilado (tsc) + schema.sql (para db:init dentro del container)
COPY dist ./dist
COPY db ./db
VOLUME ["/data"]
ENV DATA_DIR=/data
EXPOSE 3000
CMD ["node", "dist/server.js"]
