# Pruebas del frontend

La suite de `apps/web` usa Vitest y Testing Library con entorno `jsdom`. Las
pruebas no levantan la API ni dependen de PostgreSQL, Redis o Stripe.

## Comandos

```bash
npm run test:web
npm run typecheck --workspace @gym-management/web
npm run build --workspace @gym-management/web
```

Las respuestas HTTP se simulan mediante `fetch` y los fixtures deben respetar
los tipos generados desde OpenAPI. Para nuevos tests se recomienda reutilizar
los helpers de `apps/web/src/test-utils.tsx`.

## Cobertura esperada

Cada feature crítica debe cubrir estados exitosos, carga, vacío, errores HTTP,
validaciones y mutaciones. Auth y navegación deben comprobar restauración de
sesión, expiración por `401` y restricciones por rol.

Las pruebas de accesibilidad se limitan a Testing Library: roles, labels,
mensajes de estado, alertas y comportamiento básico de diálogos. Esta fase no
incluye pruebas end-to-end ni un navegador real.
