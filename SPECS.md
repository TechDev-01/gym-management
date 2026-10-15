# Sistema de Gestión de Gimnasio

Proyecto académico de backend que implementa un sistema de gestión integral para un
gimnasio: clientes, entrenadores, membresías, pagos, asistencia, rutinas de
entrenamiento, progreso físico, horarios y un panel administrativo con estadísticas.

Se construye con **arquitectura en capas por módulo** (rutas → controlador → servicio →
repositorio → base de datos) y usa **colas de trabajo** para tareas asíncronas, como
ejercicio de aprendizaje además de cumplir los requisitos funcionales.

## Tabla de contenidos

1. [Requisitos funcionales](#1-requisitos-funcionales)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Módulos y requisitos que cubren](#5-módulos-y-requisitos-que-cubren)
6. [Modelo de datos](#6-modelo-de-datos)
7. [Integración con Stripe](#7-integración-con-stripe)
8. [Sistema de colas (BullMQ)](#8-sistema-de-colas-bullmq)
9. [Autenticación y roles](#9-autenticación-y-roles)
10. [Variables de entorno](#10-variables-de-entorno)
11. [Cómo ejecutar el proyecto](#11-cómo-ejecutar-el-proyecto)

---

## 1. Requisitos funcionales

- Registro de clientes
- Registro de entrenadores
- Gestión de membresías
- Control de pagos
- Registro de asistencia
- Creación de rutinas de entrenamiento
- Asignación de rutinas a clientes
- Registro del progreso físico
- Gestión de horarios de entrenadores
- Panel administrativo con estadísticas

---

## 2. Stack tecnológico

| Área | Tecnología | Motivo |
|---|---|---|
| Runtime / lenguaje | Node.js + TypeScript | Tipado estático en todo el proyecto |
| Framework HTTP | Express | Simple, explícito, ideal para aprender arquitectura en capas |
| Base de datos | PostgreSQL | Datos muy relacionales (clientes ↔ membresías ↔ pagos ↔ asistencia) |
| ORM | TypeORM | Entidades tipadas con decoradores, migraciones, repositorios integrados |
| Validación | Zod | Esquemas de entrada y tipado inferido (`z.infer`) |
| Autenticación | JWT + bcrypt | Tokens sin estado, hash seguro de contraseñas |
| Pagos | Stripe (Checkout + Webhooks) | Pasarela definida para el proyecto |
| Colas / jobs | BullMQ + Redis | Tareas asíncronas y programadas |
| Pruebas | Vitest o Jest + Supertest | Pruebas unitarias y de integración sobre `app.ts` |
| Documentación de API | Swagger / OpenAPI | Contrato de la API |
| Contenedores | Docker + Docker Compose | Postgres y Redis reproducibles en cualquier máquina |

---

## 3. Arquitectura

Arquitectura en capas, organizada por módulo de negocio. Cada petición sigue siempre
el mismo camino:

```
Ruta → Controlador → Servicio → Repositorio → Base de datos
```

- **Rutas/Controladores**: reciben la petición HTTP, validan la entrada (vía
  middleware) y devuelven la respuesta. Sin lógica de negocio.
- **Servicios**: contienen las reglas de negocio (p. ej. "no se puede registrar
  asistencia si la membresía está vencida").
- **Repositorios**: son los únicos que hablan con la base de datos (TypeORM).
- **Tipos/DTOs**: definen la forma de los datos que viajan entre capas.

Reglas que mantienen la arquitectura limpia:

- Las dependencias solo bajan: controlador → servicio → repositorio. El controlador
  nunca toca el repositorio directamente.
- La comunicación entre módulos es de servicio a servicio, nunca accediendo al
  repositorio de otro módulo. Por eso cada módulo expone un único `index.ts` como
  puerta pública.
- Los workers de `jobs/` tampoco acceden a la base de datos directamente: llaman a los
  servicios de los módulos correspondientes.

---

## 4. Estructura de carpetas

```
gym-management/
├── src/
│   ├── config/
│   │   ├── env.ts            # valida process.env con Zod al arrancar
│   │   ├── database.ts       # inicializa (.initialize()) y exporta el DataSource de TypeORM
│   │   ├── redis.ts          # conexión de Redis (para BullMQ)
│   │   ├── stripe.ts         # instancia del SDK de Stripe
│   │   └── logger.ts         # Pino o Winston
│   │
│   ├── database/
│   │   ├── data-source.ts    # define el DataSource: conexión, entidades, carpeta de migraciones
│   │   ├── migrations/
│   │   └── seeds/
│   │       └── seed.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── coaches/
│   │   ├── memberships/
│   │   ├── payments/
│   │   ├── attendance/
│   │   ├── routines/
│   │   ├── progress/
│   │   └── stats/
│   │
│   ├── jobs/
│   │   ├── queues/            # definición de cada cola (BullMQ Queue)
│   │   │   ├── notifications.queue.ts
│   │   │   ├── reports.queue.ts
│   │   │   └── stripe-webhooks.queue.ts
│   │   ├── workers/           # los procesadores (BullMQ Worker)
│   │   │   ├── notifications.worker.ts
│   │   │   ├── reports.worker.ts
│   │   │   └── stripe-webhooks.worker.ts
│   │   └── schedulers/
│   │       └── membership-expiry.scheduler.ts  # cron que revisa vencimientos
│   │
│   ├── shared/
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts       # verifica JWT
│   │   │   ├── role.middleware.ts       # requireRole('ADMIN', 'COACH')
│   │   │   ├── validate.middleware.ts   # ejecuta un schema Zod
│   │   │   ├── error-handler.middleware.ts
│   │   │   └── not-found.middleware.ts
│   │   ├── errors/
│   │   │   ├── app-error.ts             # clase base de errores de negocio
│   │   │   ├── unauthorized.error.ts    # 401
│   │   │   ├── forbidden.error.ts       # 403
│   │   │   ├── not-found.error.ts       # 404
│   │   │   └── conflict.error.ts        # 409
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types/
│   │       └── express.d.ts             # extiende Request con req.user
│   │
│   ├── routes/
│   │   └── v1/
│   │       └── index.ts       # junta el router de cada módulo bajo /api/v1
│   │
│   ├── app.ts                 # crea la app Express, monta middlewares y rutas
│   └── server.ts              # hace app.listen(); arranca workers/schedulers
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── docker-compose.yml          # postgres + redis
├── Dockerfile
├── .env.example
└── package.json
```

Cada módulo (p. ej. `clients/`) es autocontenido y sigue siempre la misma plantilla:

```
clients/
  client.entity.ts        # entidad TypeORM (@Entity, @Column, relaciones)
  client.routes.ts       # define las rutas y conecta middlewares
  client.controller.ts   # ClientController: maneja req/res
  client.service.ts      # ClientService: reglas de negocio
  client.repository.ts   # usa el Repository<Client> de TypeORM
  client.schemas.ts      # validaciones Zod (crear, actualizar)
  client.types.ts        # DTOs y tipos del módulo
  index.ts               # puerta pública: lo único que otros módulos importan
```

A diferencia de Prisma, que centraliza todo el esquema en un único archivo, con
TypeORM cada módulo define su propia entidad junto al resto de sus capas. El
`data-source.ts` solo las registra para que TypeORM las reconozca.

Puntos clave de `app.ts` (orden importa, especialmente por el webhook de Stripe):

```ts
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), paymentsWebhookHandler);
app.use(express.json());          // después del webhook, para el resto de rutas
app.use(helmet());
app.use(cors());
app.use('/api/v1', v1Router);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);  // siempre al final
```

`app.ts` exporta la app Express sin levantar el puerto, para que los tests de
integración puedan usarla con Supertest sin abrir un socket real. `server.ts` es el
único archivo que hace `listen()`.

---

## 5. Módulos y requisitos que cubren

| Requisito | Módulo | Tablas que maneja |
|---|---|---|
| Autenticación y roles (transversal) | `auth` | `app_user` |
| Registro de clientes | `clients` | `client` |
| Registro de entrenadores | `coaches` | `coach` |
| Gestión de horarios de entrenadores | `coaches` | `coach_schedule` |
| Gestión de membresías | `memberships` | `membership`, `subscription` |
| Control de pagos | `payments` | `payment`, `stripe_event` (+ endpoint de webhooks) |
| Registro de asistencia | `attendance` | `attendance` |
| Rutinas y asignación a clientes | `routines` | `exercise`, `routine`, `routine_exercise`, `client_routine` |
| Registro del progreso físico | `progress` | `progress_record` |
| Panel administrativo con estadísticas | `stats` | ninguna propia; consultas agregadas sobre las demás |

---

## 6. Modelo de datos

Entidades principales (PostgreSQL, cada una definida como entidad TypeORM dentro de
su propio módulo, p. ej. `modules/clients/client.entity.ts`):

| Entidad | Descripción |
|---|---|
| `client` | Datos del cliente del gimnasio; guarda `stripe_customer_id` cuando paga con tarjeta |
| `coach` | Datos del entrenador |
| `coach_schedule` | Turnos de trabajo del entrenador por día de la semana |
| `app_user` | Cuenta de acceso al sistema (login), ligada a un `client` o a un `coach` según el rol |
| `membership` | Catálogo de planes (duración, precio, límite de días por semana) |
| `subscription` | Contratación de un plan por un cliente, con fechas y estado (`PENDING`, `ACTIVE`, `EXPIRED`, `CANCELLED`) |
| `payment` | Pago asociado a una suscripción; soporta tarjeta (Stripe), efectivo o transferencia |
| `stripe_event` | Bitácora de webhooks recibidos de Stripe, para procesarlos de forma idempotente |
| `attendance` | Registro de ingreso/salida del cliente, ligado a su suscripción vigente |
| `exercise` | Catálogo de ejercicios (grupo muscular, equipo) |
| `routine` | Rutina de entrenamiento creada por un entrenador |
| `routine_exercise` | Ejercicios que componen una rutina (día, orden, series, repeticiones) |
| `client_routine` | Asignación de una rutina a un cliente, con estado y fechas |
| `progress_record` | Mediciones físicas del cliente en el tiempo (peso, % grasa, medidas corporales) |

Decisiones de diseño relevantes:

- `subscription` está separada de `membership` para conservar historial y fechas de
  vigencia; sin esto no se puede saber si una membresía está vencida.
- Los montos de dinero se guardan como enteros en la unidad mínima de la moneda
  (igual que Stripe maneja los centavos), nunca como `float`.
- `coach_schedule` permite varios turnos por entrenador y por día, en vez de un único
  turno fijo.

El esquema completo, con todos los campos, tipos e índices, vive distribuido en las
entidades de cada módulo (`*.entity.ts`); el archivo `gym-schema.dbml` generado como
referencia sigue siendo válido para visualizar el modelo relacional completo en
dbdiagram.io.

---

## 7. Integración con Stripe

Flujo de pago:

1. Se crea la `subscription` en estado `PENDING` y un `payment` en estado `PENDING`.
2. Se crea una Checkout Session de Stripe, con `subscription_id` y `payment_id` en el
   `metadata`.
3. El webhook `checkout.session.completed` marca el pago como `SUCCEEDED`, activa la
   suscripción y calcula `start_date` y `end_date`.
4. `payment_intent.payment_failed` y `charge.refunded` cubren fallos y reembolsos.

La fuente de verdad del estado de un pago es siempre el webhook, nunca la página de
retorno del navegador.

Notas técnicas:

- La ruta del webhook necesita el cuerpo **sin parsear** para verificar la firma, por
  lo que debe usar `express.raw({ type: 'application/json' })` **antes** de
  `express.json()` en `app.ts`.
- Cada evento de Stripe se guarda primero en `stripe_event` (idempotencia); si
  Stripe reenvía un evento ya procesado, se ignora.
- Nunca se guardan datos de tarjeta: Stripe los maneja por completo.
- El modelo admite tanto pago único (Checkout Session) como suscripción recurrente de
  Stripe; para el alcance académico, pago único es más simple de controlar.

---

## 8. Sistema de colas (BullMQ)

Las colas se usan solo en tareas que no deben bloquear la respuesta HTTP o que son
programadas:

| Cola / job | Disparador | Qué hace |
|---|---|---|
| `notifications` | Evento de negocio (pago confirmado, rutina asignada) o scheduler | Envía correos/mensajes |
| `reports` | Solicitud desde el panel administrativo | Genera reportes en PDF/Excel |
| `stripe-webhooks` | Webhook recibido de Stripe | Procesa el evento guardado en `stripe_event` fuera del ciclo de la petición |
| `membership-expiry` (scheduler) | Cron diario | Revisa suscripciones por vencer y encola los avisos |

Cada worker llama a los servicios de los módulos correspondientes (nunca accede a la
base de datos directamente), manteniendo la misma regla de capas que el resto del
sistema.

---

## 9. Autenticación y roles

- **Roles**: `ADMIN`, `RECEPTION`, `COACH`, `CLIENT`.
- **Login**: `POST /api/v1/auth/login` valida credenciales contra `app_user` (hash con
  bcrypt) y devuelve un JWT firmado con `{ sub, role, clientId, coachId }`.
- **Rutas protegidas**: pasan primero por `authenticate` (verifica el JWT y llena
  `req.user`) y, si aplica, por `requireRole(...)`.
- **Creación de cuentas**: `POST /api/v1/auth/register` solo puede ejecutarla un
  `ADMIN` ya autenticado.
- Un ejemplo completo y funcional del módulo `auth/` (rutas, controlador, servicio,
  repositorio, schemas, middlewares y errores) ya fue implementado como plantilla para
  replicar en los demás módulos.

---

## 10. Variables de entorno

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:password@localhost:5432/gym

JWT_SECRET=una-cadena-aleatoria-de-al-menos-32-caracteres

REDIS_URL=redis://localhost:6379

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Se validan con Zod en `src/config/env.ts` al arrancar el servidor, de modo que si
falta o es inválida alguna variable, el proceso falla inmediatamente en vez de romperse
a mitad de una petición en producción.

---

## 11. Cómo ejecutar el proyecto

```bash
# 1. Levantar Postgres y Redis
docker compose up -d

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp .env.example .env

# 4. Ejecutar migraciones de TypeORM
npm run typeorm migration:run -- -d src/database/data-source.ts

# 5. (Opcional) Cargar datos de ejemplo
npm run seed

# 6. Levantar el servidor en desarrollo
npm run dev

# 7. Ejecutar pruebas
npm test
```

El webhook de Stripe en desarrollo se prueba con la CLI de Stripe:

```bash
stripe listen --forward-to localhost:3000/api/v1/payments/webhook
```