# Roadmap del frontend web

Roadmap basado en `apps/web/SPECS.md` para transformar el piloto visual actual en
una aplicación React funcional, mantenible y conectada con la API del gimnasio.

## Objetivo

Construir un frontend responsive para los roles `ADMIN`, `RECEPTION`, `COACH` y
`CLIENT`, con navegación protegida, consumo tipado de `/api/v1`, dashboard
operativo y módulos de clientes, membresías, asistencia, rutinas, progreso, pagos
y estadísticas.

La arquitectura seguirá un enfoque **feature-based**:

```text
app -> layout/components -> features -> lib/api
```

La API será la autoridad para autenticación, autorización, validación y reglas de
negocio. El frontend gestionará presentación, navegación, estado remoto y
experiencia de usuario.

## Estado actual

El proyecto ya cuenta con:

- Workspace `@gym-management/web` basado en Vite.
- Piloto visual de dashboard en `src/main.ts`.
- Tema oscuro con paleta violeta y radios visuales de hasta `3px`.
- Diseño responsive inicial para escritorio, tablet y móvil.
- Cliente HTTP mínimo en `src/api.ts` con operación de login.
- Variable `VITE_API_URL` con valor local por defecto.
- Build funcional mediante `npm run build --workspace @gym-management/web`.

El piloto actual es estático y debe reemplazarse progresivamente por componentes
React y datos reales sin perder la dirección visual aprobada.

## Fase 0 - Preparación del frontend

Dependencia: ninguna.

- Instalar React y React DOM.
- Instalar React Router.
- Instalar TanStack Query.
- Instalar React Hook Form y Zod.
- Usar MUI como librería única de componentes visuales.
- Instalar Vitest, Testing Library y la configuración necesaria para pruebas.
- Revisar los scripts de `apps/web/package.json`: `dev`, `build` y `typecheck`.
- Mantener TypeScript en modo estricto.
- Crear `.env.example` para `VITE_API_URL`.

La fase utiliza React 19, React Router, TanStack Query, React Hook Form, Zod y
MUI. Las pruebas se ejecutan con Vitest en `jsdom` y Testing Library.

**Criterio de terminado:**

- La aplicación inicia con `npm run dev:web`.
- El build y el typecheck del workspace pasan.
- Las dependencias y la librería visual elegida están documentadas.

## Fase 1 - Base React y arquitectura de aplicación

Dependencia: Fase 0.

Crear la estructura definida en `SPECS.md`:

```text
src/
├── app/
│   ├── App.tsx
│   ├── config.ts
│   ├── providers.tsx
│   └── router.tsx
├── components/
│   ├── feedback/
│   ├── forms/
│   ├── layout/
│   └── ui/
├── features/
├── hooks/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── http/
│   └── storage/
├── styles/
├── types/
├── utils/
└── main.tsx
```

- Trasladar el entrypoint estático a `main.tsx`.
- Crear `App.tsx` y `providers.tsx`.
- Configurar React Query con defaults razonables para stale time, retries y
  refetch.
- Configurar el tema oscuro aprobado.
- Mantener la paleta actual y `border-radius` entre `1px` y `3px`.
- Crear una ruta de fallback para páginas no encontradas.

**Criterio de terminado:**

- La aplicación renderiza mediante React.
- Los providers globales están configurados una sola vez.
- El piloto visual puede mostrarse desde un componente de dashboard.
- No queda lógica de renderizado principal en `innerHTML`.

## Fase 2 - Sistema visual y layout autenticado

Dependencia: Fase 1.

- Convertir el piloto en componentes React:
  `AppShell`, `Sidebar`, `Topbar`, `PageHeader`, `KpiCard`, `Panel`,
  `DataTable`, `StatusBadge`, `EmptyState`, `LoadingState` y `ErrorState`.
- Crear tokens de color, tipografía, espaciado y sombras.
- Implementar el sidebar responsive con drawer o menú móvil.
- Crear navegación lateral configurable por rol.
- Crear breadcrumbs y encabezados de página.
- Añadir estados de carga, error y vacío consistentes.
- Mantener el diseño orientado a operaciones: tablas, filtros, acciones rápidas y
  estados claros.

**Criterio de terminado:**

- El dashboard se compone de componentes reutilizables.
- El layout funciona en escritorio, tablet y móvil.
- Los componentes compartidos no conocen reglas de un dominio específico.
- La navegación no contiene enlaces a módulos no autorizados para el usuario.

## Fase 3 - Cliente HTTP y manejo de errores

Dependencia: Fase 1.

- Crear una instancia HTTP centralizada en `lib/http`.
- Usar `VITE_API_URL` como base configurable.
- Serializar requests JSON y parsear responses.
- Adjuntar `Authorization: Bearer <token>` automáticamente.
- Definir un tipo común para errores HTTP.
- Mapear respuestas `400`, `401`, `403`, `404` y `500`.
- Evitar errores genéricos que oculten la respuesta útil de la API.
- Redirigir al login y limpiar la sesión al recibir un `401`.

**Criterio de terminado:**

- Las features no construyen URLs ni headers manualmente.
- Las respuestas y errores tienen tipos explícitos.
- El cliente funciona contra `http://localhost:3000/api/v1`.
- Los errores de red muestran feedback visible al usuario.

## Fase 4 - Autenticación, sesión y roles

Dependencia: Fases 2 y 3.

- Crear `features/auth` con `api.ts`, `types.ts`, `hooks.ts`, páginas y
  componentes.
- Implementar pantalla `/login`.
- Implementar `AuthProvider` y `useAuth()`.
- Guardar inicialmente token y usuario en `sessionStorage`.
- Implementar restauración de sesión al recargar la página.
- Implementar `login`, `logout` y estado de carga.
- Crear `ProtectedRoute`.
- Crear `RoleGuard` o helpers de permisos.
- Soportar `ADMIN`, `RECEPTION`, `COACH` y `CLIENT`.
- Ocultar navegación y acciones no disponibles para el rol.
- Revisar antes de producción la migración a cookies seguras y protección CSRF.

**Criterio de terminado:**

- Un usuario no autenticado solo puede acceder a `/login`.
- Un usuario autenticado llega a `/dashboard`.
- Un `401` cierra la sesión y redirige correctamente.
- La UI diferencia los cuatro roles sin sustituir la autorización del backend.
- Login, logout y guards tienen pruebas automatizadas.

## Fase 5 - Dashboard conectado

Dependencia: Fases 2, 3 y 4.

- Crear `features/dashboard`.
- Consultar endpoints disponibles del módulo `stats`.
- Sustituir KPIs estáticos por datos de la API.
- Mostrar clientes activos, ingresos, asistencias y renovaciones.
- Implementar filtros de periodo cuando el endpoint los soporte.
- Mostrar listas de alertas y actividad reciente.
- Gestionar estados de carga, error, vacío y refresco.
- Adaptar el dashboard según rol:
  - `ADMIN`: KPIs financieros y operativos.
  - `RECEPTION`: clientes, renovaciones y asistencia.
  - `COACH`: clientes asignados, rutinas y progreso.
  - `CLIENT`: membresía, asistencia, rutina y progreso propio.

**Criterio de terminado:**

- El dashboard no depende de datos mock en el flujo normal.
- Las consultas usan TanStack Query.
- Las tarjetas y gráficos tienen estados de carga y error.
- Las métricas se muestran solo si el rol puede consultarlas.

## Fase 6 - Clientes y entrenadores

Dependencia: Fases 3 y 4.

### Clientes

- Listado con búsqueda, filtros y estado.
- Alta de cliente.
- Edición de cliente.
- Vista de detalle.
- Resumen de membresía, asistencia y progreso.
- Validación con React Hook Form y Zod.
- Confirmación antes de acciones sensibles.

### Entrenadores

- Listado y detalle.
- Alta y edición.
- Horarios del entrenador cuando estén disponibles en la API.
- Relación con rutinas y clientes asignados.

**Criterio de terminado:**

- Las operaciones CRUD muestran feedback de éxito o error.
- Las mutaciones invalidan las queries relacionadas.
- Los formularios no duplican reglas de validación innecesariamente.
- Las tablas son responsive y tienen estado vacío.

## Fase 7 - Membresías, suscripciones y pagos

Dependencia: Fase 6.

- Crear catálogo de membresías.
- Mostrar suscripciones activas, pendientes, vencidas y canceladas.
- Crear y actualizar membresías según permisos.
- Mostrar detalle de suscripción.
- Integrar confirmación de pagos manuales.
- Mostrar estados de pagos y errores de Stripe sin exponer secretos.
- Implementar cancelación con confirmación explícita.
- Mantener separación entre catálogo `membership` y contratación
  `subscription`.

**Criterio de terminado:**

- Los estados del backend se representan de forma consistente.
- Las acciones destructivas requieren confirmación.
- El frontend nunca maneja claves privadas de Stripe.
- La caché se actualiza después de crear, cancelar o confirmar operaciones.

## Fase 8 - Asistencia

Dependencia: Fase 6 y suscripciones disponibles.

- Crear pantalla de asistencia diaria.
- Implementar búsqueda rápida de clientes.
- Implementar check-in.
- Implementar check-out.
- Mostrar historial y filtros por fecha.
- Mostrar membresía activa o motivo de rechazo.
- Adaptar el flujo para recepción y cliente.
- Priorizar acciones rápidas para uso en recepción.

**Criterio de terminado:**

- Check-in y check-out reflejan inmediatamente el estado actualizado.
- Los errores de membresía vencida o asistencia duplicada son comprensibles.
- La pantalla funciona correctamente en resoluciones pequeñas.

## Fase 9 - Rutinas y progreso

Dependencia: Fases 6 y 8.

### Rutinas

- Catálogo de ejercicios.
- Creación y edición de rutinas.
- Configuración de ejercicios, series, repeticiones y orden.
- Asignación de rutinas a clientes.
- Vista de rutinas para entrenadores y clientes.
- Respetar que un entrenador solo modifique recursos autorizados.

### Progreso

- Registro de mediciones físicas.
- Historial por cliente.
- Gráficos o tablas de evolución.
- Restricción de clientes a su propio progreso.
- Vista de progreso para entrenadores autorizados.

**Criterio de terminado:**

- Los formularios validan mediciones y ejercicios antes de enviar.
- Las consultas respetan el rol del usuario.
- Las visualizaciones representan correctamente valores numéricos y fechas.

## Fase 10 - Estadísticas y reportes

Dependencia: Fase 5 y módulos de negocio principales.

- Crear pantalla administrativa de estadísticas.
- Añadir filtros de periodo.
- Mostrar métricas de clientes, membresías, ingresos y asistencia.
- Añadir segmentación por entrenador cuando exista en la API.
- Preparar solicitud y estado de reportes asíncronos.
- Mostrar errores y ausencia de datos sin inventar valores.

**Criterio de terminado:**

- Las estadísticas requieren autorización adecuada.
- Los filtros actualizan las queries de forma predecible.
- Los reportes muestran estados pendiente, completado y fallido.

## Fase 11 - Contratos OpenAPI y tipado compartido

Dependencia: contratos de API estabilizados y módulos principales implementados.

- Revisar el documento OpenAPI existente.
- Reemplazar `GenericObject` y `GenericResponse` por esquemas específicos.
- Definir requests y responses completos por endpoint.
- Evaluar generación automática de tipos.
- Crear `packages/api-contracts` solo si reduce duplicación real.
- Mantener el frontend desacoplado de entidades TypeORM.

**Criterio de terminado:**

- Las interfaces usadas por las features corresponden al contrato HTTP real.
- Los cambios de contrato pueden detectarse mediante typecheck o generación.
- No existen tipos duplicados con diferencias silenciosas.

## Fase 12 - Pruebas y calidad

Dependencia: cada feature debe añadir sus pruebas al implementarse.

- Configurar Vitest y Testing Library.
- Mockear llamadas HTTP sin depender de PostgreSQL, Redis o Stripe reales.
- Probar login, logout y restauración de sesión.
- Probar protección de rutas y visibilidad por rol.
- Probar formularios y validaciones.
- Probar estados de carga, error y vacío.
- Probar mutaciones e invalidación de caché.
- Cubrir flujos críticos de clientes, membresías y asistencia.
- Revisar accesibilidad básica: labels, foco, teclado y mensajes de estado.
- Revisar responsive design en las vistas principales.

**Criterio de terminado:**

- Las pruebas son deterministas y no requieren servicios externos.
- Cada módulo crítico tiene casos felices y errores principales.
- `npm run typecheck`, `npm run build` y la suite de frontend pasan.

## Fase 13 - Preparación para despliegue

Dependencia: Fases 10, 11 y 12.

- Configurar variables de entorno por ambiente.
- Confirmar que no se incluyen secretos en variables `VITE_*`.
- Crear build de producción.
- Definir estrategia de hosting para el frontend.
- Configurar fallback del servidor para rutas SPA.
- Documentar URL de la API y CORS por ambiente.
- Revisar caché de assets y manejo de errores de runtime.
- Preparar pipeline de CI para typecheck, pruebas y build.

**Criterio de terminado:**

- El build de producción es reproducible.
- Las rutas SPA funcionan al recargar directamente.
- El frontend puede apuntar a una API distinta sin cambios de código.
- CI bloquea cambios que no pasen calidad básica.

## Orden recomendado de implementación

1. Preparación de dependencias y scripts.
2. Base React, providers y router.
3. Sistema visual y layout autenticado.
4. Cliente HTTP centralizado.
5. Login, sesión y roles.
6. Dashboard conectado.
7. Clientes y entrenadores.
8. Membresías, suscripciones y pagos.
9. Asistencia.
10. Rutinas y progreso.
11. Estadísticas y reportes.
12. Contratos OpenAPI y tipos compartidos.
13. Pruebas, accesibilidad y despliegue.

## Reglas de implementación

- Mantener arquitectura feature-based.
- No importar entidades, repositorios ni servicios internos de `apps/api`.
- No colocar lógica de negocio en componentes de presentación.
- Centralizar HTTP, autenticación, errores y almacenamiento.
- Usar TanStack Query para estado remoto.
- Usar Context API solo para sesión y configuración global mínima.
- No introducir Redux, microfrontends o Turborepo sin una necesidad documentada.
- Mantener la paleta oscura aprobada.
- Mantener `border-radius` entre `1px` y `3px`.
- Mantener accesibilidad y responsive design como requisitos de cada feature.
- El backend permanece como autoridad para permisos y validación.

## Criterios globales de listo

- La aplicación permite iniciar y cerrar sesión correctamente.
- Las rutas y acciones respetan los roles definidos por la API.
- El dashboard consume datos reales y muestra estados de carga, error y vacío.
- Los módulos críticos permiten completar sus flujos principales.
- Las mutaciones actualizan la interfaz sin recargas manuales.
- Los errores HTTP se muestran de forma clara y consistente.
- El frontend no accede directamente a PostgreSQL, Redis, TypeORM ni secretos.
- Las pruebas críticas pasan sin servicios externos.
- El typecheck, build y lint configurados pasan antes de cada entrega.
- La documentación de `SPECS.md` y este roadmap se mantienen sincronizados.
