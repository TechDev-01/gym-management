# Patrón de módulos autocontenidos

Cada módulo de negocio vive en `src/modules/<module>/` y contiene sus rutas, capas de
aplicación y tipos. El módulo exporta su router desde `index.ts`; el punto de
entrada solo necesita montarlo bajo el prefijo correspondiente.

## Elementos del patrón

- **`routes.ts`**: crea el `Router` de Express y conecta cada verbo y ruta con
  un método del controlador. Ejemplo: `router.get('/health',
  controller.health)`.
- **`controller.ts`**: adapta HTTP a la aplicación: recibe `Request`, invoca
  el servicio y escribe la respuesta o delega errores. Ejemplo:
  `response.status(200).json(service.health())`.
- **`service.ts`**: contiene los casos de uso y coordina repositorios,
  validación y reglas de negocio. Ejemplo: `health()` construye y valida la
  respuesta del módulo.
- **`repository.ts`**: abstrae el acceso a datos y evita que el servicio
  conozca TypeORM o SQL. Ejemplo: una interfaz `ClientsRepository` con
  `getModuleName()`.
- **`schemas.ts`**: define esquemas de entrada y salida con Zod. Ejemplo:
  `z.object({ status: z.literal('ok') })`.
- **`types.ts`**: contiene tipos TypeScript compartidos por las capas.
  Ejemplo: `interface ClientsHealthResponse { status: 'ok' }`.
- **`index.ts`**: es la API pública del módulo; crea y exporta su router.
  Ejemplo: `export const clientsRouter = createClientsRouter()`.

## Crear un módulo nuevo

1. Copia `src/modules/clients/` a `src/modules/<module>/`.
2. Renombra los símbolos y literales `clients` por el nombre del módulo.
3. Conserva las siete piezas y agrega los casos de uso dentro del servicio,
   repositorio, esquemas y tipos correspondientes.
4. Monta el router en `src/routes/v1/index.ts`, por ejemplo:
   `v1Router.use('/<module>', moduleRouter)`.
5. Añade tests bajo `test/<module>/` y ejecuta `npm test`, `npm run lint` y
   `npm run typecheck`.

El módulo no debe importar controladores, servicios o repositorios de otro
módulo; las dependencias compartidas pertenecen a `src/shared/`.
