# Cancha Llena

Plataforma para canchas deportivas (reservas, gestión).

## Stack
- Frontend: React (Vite)
- Backend: API (Express)
- Base de datos: PostgreSQL / Turso
- Deploy: VPS Docker + GitHub Actions

## Estructura
```
app/            Frontend
api/            Backend
docs/           Documentación
docker-compose.yml
nginx-default.conf
```

## Desarrollo
```bash
docker compose up -d
```

## Despliegue
GitHub Actions → VPS. Incluye `.github/workflows/`.
