# Gym Management Monorepo

Backend académico para la gestión de clientes, entrenadores, membresías, pagos,
asistencia, rutinas, progreso y estadísticas. La API usa TypeScript, Express,
PostgreSQL, TypeORM, Redis y BullMQ, además de un frontend web inicial.

## Estructura

```text
apps/
├── api/  # Backend y pruebas
└── web/  # Frontend web
```

## Requisitos

- Node.js 26 o compatible con el proyecto
- Docker y Docker Compose
- PostgreSQL y Redis (se pueden levantar con Docker)

## Instalación y ejecución

```bash
npm ci
cp .env.example .env
docker compose up -d
npm run build --workspace @gym-management/api
npx typeorm migration:run -d apps/api/dist/database/data-source.js
npm run seed --workspace @gym-management/api
```

Después, iniciar la API y el frontend en terminales separadas:

```bash
npm run dev:api
npm run dev:web
```

La aplicación web queda disponible en `http://localhost:5173`.
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

Los contratos HTTP consumidos por el frontend se documentan en
`apps/api/src/docs/openapi.ts` y sus tipos generados/versionados en
`apps/web/src/types/generated/api.ts`. Para regenerarlos y comprobar que están
actualizados:

```bash
npm run openapi:generate
npm run openapi:check
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
