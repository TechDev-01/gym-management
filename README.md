# Gym Management API

Backend académico para la gestión de clientes, entrenadores, membresías, pagos,
asistencia, rutinas, progreso y estadísticas. La API usa TypeScript, Express,
PostgreSQL, TypeORM, Redis y BullMQ.

## Requisitos

- Node.js 26 o compatible con el proyecto
- Docker y Docker Compose
- PostgreSQL y Redis (se pueden levantar con Docker)

## Instalación y ejecución

```bash
npm ci
cp .env.example .env
docker compose up -d
npm run build
npx typeorm migration:run -d dist/database/data-source.js
npm run seed
```

Después, iniciar el servidor con el comando disponible para desarrollo:

```bash
npm run dev
```

La documentación interactiva queda disponible en `http://localhost:3000/api/docs`.
El documento OpenAPI está disponible en `http://localhost:3000/api/docs.json`.

## Datos de demostración

`npm run seed` es idempotente y crea o actualiza datos para demostrar el flujo
completo. Las credenciales locales son:

| Rol | Email | Contraseña |
|---|---|---|
| ADMIN | `admin@gym.local` | `Admin1234!` |
| RECEPTION | `reception@gym.local` | `Reception1234!` |
| COACH | `coach@gym.local` | `Coach1234!` |
| CLIENT | `ana.client@gym.local` | `Client1234!` |

Estas credenciales son únicamente para la demostración local y no deben reutilizarse
en un entorno real.

## Pruebas y calidad

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

## Stripe y jobs

El webhook debe reenviarse a
`http://localhost:3000/api/v1/payments/webhook` usando Stripe CLI. Redis debe estar
activo para las colas BullMQ. Las claves de Stripe y demás variables se configuran
en `.env` a partir de `.env.example`.

## Entregables académicos

- [Arquitectura y decisiones técnicas](docs/architecture.md)
- [Limitaciones y trabajo futuro](docs/limitations.md)
- [Guion de demostración](docs/demo-checklist.md)
