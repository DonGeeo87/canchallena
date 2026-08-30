# CanchaLlena API — single-stage (patrón skill project-scaffold-workflow)
# Context = raíz del repo. Dist se copia pre-compilado.
# OBLIGATORIO Node 22: _lib/db.ts usa node:sqlite (DatabaseSync), no existe en Node 20
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY api/package.json ./package.json
RUN npm install --omit=dev --no-save 2>/dev/null || true
# dist pre-compilado + schema.sql
COPY api/dist ./dist
COPY api/db ./db
VOLUME ["/data"]
ENV DATA_DIR=/data
EXPOSE 3000
CMD ["node", "dist/server.js"]
