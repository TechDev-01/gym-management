# Contratos OpenAPI

El documento OpenAPI de la API se mantiene en
`apps/api/src/docs/openapi.ts`. Los tipos que consume el frontend se generan
desde ese documento y se versionan en
`apps/web/src/types/generated/api.ts`.

## Comandos

```bash
npm run openapi:generate
npm run openapi:check
```

`openapi:generate` debe ejecutarse después de modificar un request o response
consumido por `apps/web`. El archivo generado no debe editarse manualmente.

`openapi:check` regenera los tipos y falla si el resultado no coincide con el
archivo versionado.

Los tipos generados describen el contrato HTTP público. No deben incluir ni
reutilizar entidades, repositorios o servicios internos de TypeORM.
