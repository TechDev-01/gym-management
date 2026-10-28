# Especificación del frontend web

## 1. Objetivo

Construir una aplicación web para consumir la API de gestión de gimnasio y ofrecer
interfaces para administradores, recepción, entrenadores y clientes.

El frontend debe mantener una separación clara entre presentación, estado de la
interfaz y comunicación con la API. La seguridad y autorización definitiva
permanecen en el backend; el frontend solo replica la visibilidad y experiencia de
usuario según el rol autenticado.

## 2. Stack tecnológico

| Área | Tecnología | Uso |
|---|---|---|
| Framework | React | Componentes, composición de vistas y ecosistema |
| Lenguaje | TypeScript | Tipado estático y contratos explícitos |
| Build/dev server | Vite | Desarrollo local y compilación |
| Routing | React Router | Rutas públicas, protegidas y navegación |
| Datos remotos | TanStack Query | Caché, consultas, mutaciones e invalidación |
| Formularios | React Hook Form + Zod | Formularios tipados y validación |
| UI | MUI | Componentes visuales reutilizables |
| Pruebas | Vitest + Testing Library | Pruebas de componentes, hooks y flujos |

La selección inicial es React + TypeScript + Vite + MUI. No se introducirán Redux,
microfrontends ni Turborepo como parte de la primera implementación.

Las pruebas del frontend usan Vitest, Testing Library, `jsdom` y
`@testing-library/user-event`. La configuración vive en `apps/web/vite.config.ts`
y el script `test` ejecuta la suite sin servicios externos.

## 3. Arquitectura general

Se utilizará una arquitectura **feature-based**. Cada dominio funcional agrupa su
cliente de API, tipos, hooks, componentes y páginas. Los elementos reutilizables y
agnósticos del dominio viven fuera de las features.

```text
apps/
├── api/
├── web/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── utils/
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── tsconfig.json
└── packages/
    └── api-contracts/       # Fase posterior, opcional
```

### 3.1. Aplicación

`app/` configura los elementos globales:

```text
app/
├── App.tsx
├── router.tsx
├── providers.tsx
└── config.ts
```

- `App.tsx`: componente raíz.
- `router.tsx`: rutas públicas, protegidas y de error.
- `providers.tsx`: React Query, autenticación, tema y otros providers globales.
- `config.ts`: configuración derivada de variables `VITE_*`.

### 3.2. Componentes compartidos

```text
components/
├── ui/          # Botones, inputs, tablas, modales y componentes base
├── layout/      # Sidebar, header, navegación y shell autenticado
├── feedback/    # Loading, errores, estados vacíos y notificaciones
└── forms/       # Campos y patrones de formulario reutilizables
```

Estos componentes no deben conocer reglas específicas de clientes, membresías u
otro dominio. Las reglas de negocio deben permanecer en la feature correspondiente.

### 3.3. Features

```text
features/
├── auth/
├── dashboard/
├── clients/
├── coaches/
├── memberships/
├── attendance/
├── routines/
├── progress/
├── payments/
└── stats/
```

La estructura base de una feature será:

```text
features/clients/
├── api.ts
├── types.ts
├── hooks.ts
├── components/
├── pages/
└── routes.ts
```

- `pages/`: coordina la pantalla y composición de componentes.
- `components/`: componentes propios del dominio.
- `api.ts`: operaciones HTTP de la feature.
- `hooks.ts`: hooks de TanStack Query y lógica de acceso a datos.
- `types.ts`: tipos de requests, responses y modelos de UI.
- `routes.ts`: rutas de la feature si resulta útil separarlas.

## 4. Comunicación con la API

La API actual está versionada bajo:

```text
/api/v1
```

El cliente HTTP debe centralizar:

- URL base configurable mediante `VITE_API_URL`.
- Serialización de requests JSON.
- Inyección automática del token Bearer.
- Parseo de respuestas y errores.
- Tratamiento uniforme de `401`, `403`, `404` y `500`.
- Logout o redirección al login cuando la sesión expire.

La configuración local por defecto será:

```text
http://localhost:3000/api/v1
```

El backend permite configurar CORS mediante `CORS_ORIGIN`, con
`http://localhost:5173` como origen de desarrollo esperado.

## 5. Autenticación y autorización

El backend expone `POST /auth/login` y devuelve:

```ts
interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    role: string
    clientId: number | null
    coachId: number | null
  }
}
```

Flujo esperado:

1. El usuario envía email y contraseña desde la pantalla de login.
2. El frontend llama a `/api/v1/auth/login`.
3. El token y la información mínima del usuario se guardan en la sesión.
4. `useAuth()` expone usuario, rol, login, logout y estado de autenticación.
5. Las rutas privadas se protegen mediante `ProtectedRoute`.
6. Las vistas y acciones se filtran mediante `RoleGuard` o helpers de permisos.
7. El cliente HTTP envía `Authorization: Bearer <token>`.
8. Un `401` limpia la sesión y redirige al login.

La primera implementación puede usar `sessionStorage` para evitar conservar el
token después de cerrar la pestaña. La decisión debe revisarse antes de producción
considerando una estrategia de cookies seguras y protección CSRF.

Roles contemplados:

- `ADMIN`
- `RECEPTION`
- `COACH`
- `CLIENT`

El filtrado visual por rol nunca sustituye la autorización del backend.

## 6. Estado de la aplicación

El estado se dividirá en tres categorías:

| Tipo de estado | Solución |
|---|---|
| Datos remotos de la API | TanStack Query |
| Sesión y usuario autenticado | Context API inicialmente |
| Formularios, modales y filtros locales | React state y React Hook Form |

No se usará Redux inicialmente. Podrá evaluarse si aparecen flujos globales que no
se resuelvan adecuadamente con Context API, TanStack Query y estado local.

TanStack Query debe gestionar caché, estados de carga y error, invalidación después
de mutaciones y refetch de datos relacionados.

## 7. Rutas principales

Rutas públicas:

```text
/login
```

Rutas protegidas:

```text
/dashboard
/clients
/coaches
/memberships
/subscriptions
/attendance
/routines
/progress
/stats
/payments
```

El shell autenticado debe incluir navegación lateral, encabezado, usuario actual,
rol, logout y un área principal para las páginas.

## 8. Módulos funcionales

| Feature | Responsabilidad principal |
|---|---|
| `auth` | Login, logout, sesión, guards y roles |
| `dashboard` | Resumen operativo según el rol |
| `clients` | Listado, detalle, creación y actualización de clientes |
| `coaches` | Listado, detalle, creación y actualización de entrenadores |
| `memberships` | Catálogo de membresías y cambios de estado |
| `attendance` | Check-in, check-out e historial |
| `routines` | Ejercicios, rutinas y asignaciones |
| `progress` | Registro y consulta de progreso físico |
| `payments` | Pagos, confirmaciones y estado de suscripciones |
| `stats` | Indicadores, agregados y reportes administrativos |

Las pantallas y acciones disponibles deben adaptarse al rol, pero deben consumir
únicamente endpoints autorizados por el backend.

## 9. Contratos y tipos

En la primera fase los tipos pueden vivir dentro de cada feature:

```text
features/*/types.ts
```

En una fase posterior se podrá crear:

```text
packages/api-contracts/
```

Ese paquete debe generarse desde OpenAPI para evitar duplicar contratos entre
frontend y backend. Antes de adoptarlo conviene completar los esquemas genéricos
actuales del documento OpenAPI, especialmente `GenericObject` y
`GenericResponse`, por respuestas específicas de cada módulo.

El frontend no debe importar entidades TypeORM ni código interno del backend.
Compartirá contratos HTTP, no modelos de persistencia.

## 10. Formularios y validación

Los formularios deben usar React Hook Form y esquemas Zod. Las validaciones del
frontend mejoran la experiencia, pero el backend continúa siendo la fuente de
verdad y debe validar cada request.

Los errores de validación de la API deben transformarse a mensajes de campo o
mensajes generales consistentes, sin ocultar errores inesperados.

## 11. Diseño y experiencia de usuario

La interfaz debe priorizar un dashboard administrativo claro y componentes
reutilizables para:

- Tablas con paginación, filtros y ordenamiento.
- Formularios de alta y edición.
- Detalles de cliente, entrenador y suscripción.
- Confirmaciones antes de acciones destructivas o irreversibles.
- Estados de carga, error y vacío.
- Feedback visible después de mutaciones.
- Diseño responsive para escritorio y dispositivos móviles.

La librería visual definitiva —MUI, Mantine o shadcn/ui— debe seleccionarse antes
de construir el sistema completo de componentes para evitar mezclar patrones.

## 12. Pruebas

Se utilizarán Vitest y Testing Library para cubrir:

- Login, logout y expiración de sesión.
- Protección de rutas y visibilidad por rol.
- Formularios y validaciones.
- Estados de carga, error y vacío.
- Mutaciones importantes y actualización de caché.
- Flujos críticos de clientes, membresías y asistencia.

Las pruebas no deben depender de una base de datos real. Las llamadas HTTP deben
simularse mediante mocks o un servidor HTTP de prueba.

## 13. Variables de entorno

Variables esperadas en `apps/web`:

```text
VITE_API_URL=http://localhost:3000/api/v1
```

Las variables con prefijo `VITE_` son públicas en el bundle. Nunca deben contener
secretos, contraseñas, claves privadas ni credenciales de Stripe.

## 14. Desarrollo local

Desde la raíz del monorepo:

```bash
npm ci
npm run dev:api
npm run dev:web
```

Servicios esperados:

- API: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- Swagger: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs.json`

El frontend debe conectarse al backend mediante `VITE_API_URL`; no debe acceder
directamente a PostgreSQL, Redis o TypeORM.

## 15. Plan de implementación

### Fase 1: base de aplicación

- Incorporar React, React DOM y React Router.
- Crear `main.tsx`, `App.tsx`, providers y router.
- Elegir la librería visual.
- Crear tema, layout autenticado y estados globales básicos.

### Fase 2: autenticación

- Implementar cliente HTTP centralizado.
- Implementar `AuthProvider` y `useAuth()`.
- Construir login.
- Añadir `ProtectedRoute` y `RoleGuard`.
- Manejar expiración y logout.

### Fase 3: dashboard y navegación

- Crear shell responsive.
- Implementar navegación por rol.
- Crear dashboard inicial con estados de carga y error.

### Fase 4: módulos de negocio

Implementar progresivamente:

1. Clientes.
2. Membresías y suscripciones.
3. Asistencia.
4. Entrenadores.
5. Rutinas.
6. Progreso.
7. Pagos.
8. Estadísticas.

### Fase 5: contratos y calidad

- Completar esquemas OpenAPI específicos.
- Evaluar paquete `api-contracts` generado.
- Añadir pruebas de frontend.
- Revisar accesibilidad, responsive design y manejo de errores.
- Preparar build y despliegue.

## 16. Decisiones y límites iniciales

- React es la opción elegida frente a Vue por su ecosistema para dashboards,
  formularios, tablas, gráficos y disponibilidad de librerías TypeScript.
- La arquitectura será feature-based, no una separación global por tipo de archivo.
- No se implementarán microfrontends.
- No se introducirá Redux sin una necesidad concreta.
- No se compartirá código de persistencia entre backend y frontend.
- El paquete de contratos compartidos es opcional y posterior a la estabilización
  del OpenAPI.
- La seguridad real continuará en la API.
- La primera entrega debe priorizar un shell autenticado, login y estructura de
  navegación antes de desarrollar todos los módulos.
