# Despliegue de la aplicación

La aplicación se despliega como cinco recursos en Render:

```text
Static Site (web) -> Web Service (API) -> PostgreSQL
                         |
                         +-> Key Value (Redis) -> Background Worker
```

La infraestructura está declarada en [`render.yaml`](../render.yaml). El archivo
no contiene secretos: Render solicita los valores marcados con `sync: false` y
genera `JWT_SECRET` automáticamente.

## Configuración inicial

1. Crear un Blueprint en Render conectado al repositorio.
2. Seleccionar `render.yaml` como definición de infraestructura.
3. Completar `CORS_ORIGIN` con la URL pública del frontend.
4. Completar `VITE_API_URL` con la URL pública de la API y el sufijo
   `/api/v1`.
5. Configurar las claves productivas de Stripe y el webhook secreto.
6. Confirmar que API, worker, PostgreSQL y Redis están en la misma región.

El frontend recibe `VITE_API_URL` durante el build. Las variables con prefijo
`VITE_` son públicas y nunca deben contener secretos.

## Migraciones y procesos

El Web Service ejecuta las migraciones como pre-deploy mediante:

```bash
npx typeorm migration:run -d apps/api/dist/database/data-source.js
```

El seed no se ejecuta en producción. El API y el worker tienen procesos
separados: el API atiende HTTP y webhooks, mientras el worker consume BullMQ y
programa el escaneo diario de vencimientos.

## CI y protección de ramas

`.github/workflows/ci.yml` ejecuta en Pull Requests y en `main`:

```text
openapi:check -> lint -> typecheck -> test:web -> test -> build
```

La rama `main` debe exigir este workflow antes de permitir el merge.

## Verificación posterior al despliegue

- `GET /api/v1/health` responde `200`.
- `/login`, `/dashboard` y rutas profundas funcionan al recargar el navegador.
- El frontend puede iniciar sesión contra la URL pública de la API.
- La API rechaza solicitudes sin JWT y roles insuficientes.
- El worker procesa reportes y webhooks pendientes.
- Stripe puede entregar eventos a `/api/v1/payments/webhook`.
- Los logs no muestran JWT, contraseñas ni claves Stripe.
- PostgreSQL tiene backups y la migración aplicada corresponde al commit.

## Rollback

Ante un fallo, detener la promoción del deployment y volver al último deployment
saludable desde Render. Las migraciones deben ser compatibles hacia atrás; no se
deben eliminar columnas ni modificar migraciones ya ejecutadas.
