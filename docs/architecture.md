# Arquitectura y decisiones técnicas

## Estructura

La API está organizada por módulos de negocio. Cada petición sigue la cadena:

```text
Ruta -> Controlador -> Servicio -> Repositorio -> PostgreSQL
```

Las rutas adaptan HTTP, los controladores coordinan request/response, los servicios
contienen las reglas de negocio y los repositorios encapsulan TypeORM. Los módulos
exponen su router desde `index.ts` para evitar dependencias directas entre capas de
otros módulos.

## Persistencia

PostgreSQL conserva el modelo relacional y TypeORM administra las entidades y
migraciones. `membership` representa el catálogo de planes y `subscription`
representa una contratación histórica, permitiendo conocer vigencia, cancelaciones y
vencimientos. Los montos se almacenan como enteros en la unidad mínima de moneda.

Las migraciones se ejecutan sobre el código compilado para que TypeORM cargue los
archivos JavaScript de `dist/database/migrations`.

## Seguridad

`POST /api/v1/auth/login` valida credenciales con bcrypt y emite un JWT de acceso
con identidad, rol y relación con cliente o entrenador. `authenticate` valida el
token y `requireRole` limita operaciones administrativas. Las entradas HTTP se
validan con Zod antes de llegar al servicio: los errores de validación responden
`422 UNPROCESSABLE_ENTITY`; un JSON malformado sigue respondiendo
`400 INVALID_JSON`.

El JWT de acceso se guarda en `sessionStorage` y dura una hora. La sesión se
renueva con un refresh token opaco que se almacena hasheado (SHA-256) en la tabla
`refresh_token`, se rota en cada uso y solo viaja en la cookie httpOnly
`gym_refresh_token` (`SameSite=Strict`, path `/api/v1/auth`). Reutilizar un token
ya revocado invalida todas las sesiones del usuario. La vigencia se configura con
`REFRESH_TOKEN_TTL_DAYS` (7 días por defecto).

## Pagos

La suscripción y el pago se crean inicialmente como pendientes. Stripe recibe los
identificadores en `metadata`; la activación solo ocurre al confirmar el webhook.
Los eventos se persisten en `stripe_event` para garantizar idempotencia. La ruta usa
`express.raw()` antes de `express.json()` para conservar la firma verificable.

## Procesamiento asíncrono

BullMQ y Redis desacoplan notificaciones, reportes y webhooks de Stripe del ciclo
HTTP. Los workers invocan servicios de aplicación y no acceden directamente a
repositorios ni a la base de datos. El scheduler de vencimientos genera trabajos
diarios para notificaciones.

## Decisiones para la entrega

- `app.ts` exporta Express sin abrir un puerto, lo que permite pruebas de integración.
- `server.ts` es el único punto responsable de iniciar el servidor y los procesos
  auxiliares.
- El seed es idempotente y usa claves naturales para que la demostración pueda
  repetirse sin duplicar registros.
- Swagger/OpenAPI documenta los endpoints versionados bajo `/api/v1`.
