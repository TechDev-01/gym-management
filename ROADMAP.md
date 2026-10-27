# Ruta de trabajo

Roadmap basado en `SPECS.md` para construir el Sistema de Gestion de Gimnasio por
fases, respetando la arquitectura por capas: rutas -> controladores -> servicios ->
repositorios -> base de datos.

## Objetivo

Implementar una API backend en TypeScript, Node.js, Express, PostgreSQL y TypeORM
que cubra clientes, entrenadores, membresias, pagos, asistencia, rutinas, progreso,
estadisticas, autenticacion por roles, Stripe y jobs asincronos con BullMQ.

## Fase 0 - Preparacion del proyecto

- Confirmar scripts del proyecto: `build`, `typecheck`, `lint`, `test` y `dev`.
- Definir estructura base en `src/`: `config/`, `database/`, `shared/`, `routes/v1/`,
  `modules/` y `jobs/`.
- Crear middlewares compartidos: validacion Zod, manejo de errores, 404,
  autenticacion JWT y roles.
- Crear clases de error de negocio: `AppError`, `UnauthorizedError`,
  `ForbiddenError`, `NotFoundError` y `ConflictError`.
- Configurar `app.ts` para exportar Express sin `listen()`.
- Configurar `server.ts` como unico punto que levanta el puerto y arranca procesos
  auxiliares.

## Fase 1 - Configuracion e infraestructura local

- Crear validacion de variables de entorno con Zod en `src/config/env.ts`.
- Configurar TypeORM `DataSource` para PostgreSQL.
- Registrar entidades por modulo en el `DataSource`.
- Configurar Redis para BullMQ.
- Preparar instancia de Stripe.
- Crear `docker-compose.yml` para PostgreSQL y Redis.
- Definir `.env.example` con las variables documentadas en `SPECS.md`.

## Fase 2 - Modelo de datos y entidades

- Implementar entidades TypeORM principales:
  `app_user`, `client`, `coach`, `coach_schedule`, `membership`, `subscription`,
  `payment`, `stripe_event`, `attendance`, `exercise`, `routine`,
  `routine_exercise`, `client_routine` y `progress_record`.
- Usar enteros para montos de dinero en unidad minima de moneda.
- Separar `membership` de `subscription` para conservar historico y vigencias.
- Agregar indices y restricciones de unicidad donde aplique, especialmente en
  emails, eventos Stripe y relaciones principales.
- Crear migracion inicial de TypeORM una vez cerrado el modelo.

## Fase 3 - Autenticacion y seguridad

- Completar `auth` como modulo plantilla para el resto del sistema.
- Implementar `POST /api/v1/auth/login` contra `app_user`.
- Devolver JWT con `{ sub, role, clientId, coachId }`.
- Implementar `POST /api/v1/auth/register` protegido para `ADMIN`.
- Asegurar hash de contrasenas con bcrypt.
- Crear `authenticate` para validar JWT y poblar `req.user`.
- Crear `requireRole(...)` para rutas protegidas por rol.

## Fase 4 - Modulos core de negocio

- Implementar `clients`: registro, consulta, actualizacion y estado del cliente.
- Implementar `coaches`: registro, consulta, actualizacion y horarios.
- Implementar `memberships`: catalogo de planes y contratacion por cliente.
- Implementar `attendance`: registro de entrada/salida validando suscripcion activa.
- Implementar `routines`: ejercicios, rutinas, ejercicios por rutina y asignaciones a clientes.
- Implementar `progress`: registro historico de mediciones fisicas.
- Mantener cada modulo autocontenido con `routes`, `controller`, `service`,
  `repository`, `schemas`, `types` e `index`.

## Fase 5 - Pagos con Stripe

- Implementar creacion de `subscription` en estado `PENDING`.
- Implementar creacion de `payment` en estado `PENDING`.
- Crear Checkout Session con `subscription_id` y `payment_id` en `metadata`.
- Crear webhook `POST /api/v1/payments/webhook` usando `express.raw()` antes de
  `express.json()`.
- Guardar cada evento en `stripe_event` para idempotencia.
- Procesar `checkout.session.completed`, `payment_intent.payment_failed` y
  `charge.refunded`.
- Activar suscripciones solo desde webhook confirmado.

## Fase 6 - Colas y tareas asincronas

- Crear colas BullMQ: `notifications`, `reports` y `stripe-webhooks`.
- Crear workers que llamen a servicios, no a repositorios ni base de datos
  directamente.
- Encolar procesamiento de webhooks Stripe despues de persistir el evento.
- Crear scheduler diario `membership-expiry` para suscripciones por vencer.
- Encolar notificaciones por pago confirmado, rutina asignada y vencimientos.
- Preparar job de reportes para el panel administrativo.

## Fase 7 - Estadisticas y panel administrativo

- Implementar modulo `stats` sin tablas propias.
- Crear consultas agregadas para:
  clientes activos, membresias activas/vencidas, ingresos, asistencias por periodo,
  pagos por estado y uso por entrenador.
- Proteger endpoints administrativos con `ADMIN` y, donde aplique, `RECEPTION`.
- Preparar endpoint de solicitud de reporte que encole un job en `reports`.

## Fase 8 - Rutas API v1 y documentacion

- Crear `src/routes/v1/index.ts` para montar todos los routers de modulos.
- Montar `/api/v1` en `app.ts`.
- Respetar orden especial del webhook de Stripe antes de `express.json()`.
- Documentar endpoints con Swagger/OpenAPI.
- Mantener contratos claros de request/response usando schemas Zod y DTOs.

## Fase 9 - Pruebas y calidad

- Crear pruebas unitarias para servicios con repositorios simulados.
- Crear pruebas de integracion con Supertest sobre `app.ts`.
- Cubrir casos de autenticacion, roles, pagos, asistencia con membresia vencida y
  procesamiento idempotente de webhooks.
- Ejecutar antes de cerrar cada fase:
  `npm run build`, `npm run typecheck`, `npm run lint` y `npm test`.
- Corregir deuda tecnica antes de avanzar a la siguiente fase.

## Fase 10 - Cierre academico y entrega

- Cargar datos seed para demostracion.
- Validar flujo completo:
  registro -> login -> membresia -> pago -> asistencia -> rutina -> progreso ->
  estadisticas.
- Revisar documentacion de instalacion y ejecucion.
- Preparar descripcion de arquitectura, decisiones tecnicas y limitaciones.
- Entregar con migraciones reproducibles, endpoints documentados y pruebas clave.

## Orden recomendado de implementacion

1. Base compartida, configuracion y errores.
2. Entidades y migracion inicial.
3. Autenticacion y roles.
4. Clientes, entrenadores y membresias.
5. Pagos y Stripe.
6. Asistencia, rutinas y progreso.
7. Jobs, schedulers y notificaciones.
8. Estadisticas y reportes.
9. Swagger, seeds, pruebas finales y documentacion.

## Criterios de listo

- Todas las rutas siguen la cadena controlador -> servicio -> repositorio.
- Ningun controlador contiene reglas de negocio.
- Ningun worker accede directamente a la base de datos.
- Las entradas HTTP se validan con Zod.
- Los errores de negocio usan clases compartidas.
- Los pagos se confirman solo por webhook.
- Los eventos de Stripe son idempotentes.
- Las rutas protegidas validan JWT y roles.
- El proyecto compila, pasa lint y pasa pruebas antes de la entrega.
