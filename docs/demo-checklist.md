# Guion de demostración

## Preparación

1. Copiar `.env.example` a `.env` y completar las variables locales.
2. Ejecutar `docker compose up -d`.
3. Ejecutar `npm ci`, `npm run build`, las migraciones y `npm run seed`.
4. Iniciar la API con `npm run dev`.
5. Abrir `http://localhost:3000/api/docs`.

## Flujo principal

1. Iniciar sesión como `CLIENT` con las credenciales del README y guardar el JWT.
2. Consultar membresías y seleccionar `Plan Estándar Demo`.
3. Consultar la suscripción activa del cliente.
4. Consultar asistencia y comprobar el registro creado por el seed.
5. Consultar rutinas y la asignación `Fuerza inicial Demo`.
6. Consultar progreso y mostrar la evolución de las dos mediciones.
7. Iniciar sesión como `ADMIN` o `RECEPTION`.
8. Consultar `/api/v1/stats/dashboard` y mostrar clientes, membresías, pagos y
   asistencias agregadas.

## Comprobaciones académicas

- Intentar una ruta administrativa sin JWT y comprobar `401`.
- Intentar una ruta restringida con un rol insuficiente y comprobar `403`.
- Repetir `npm run seed` y comprobar que no aparecen duplicados.
- Ejecutar `npm test` y los comandos de build, typecheck y lint.
- Para pagos Stripe, reenviar un evento con Stripe CLI y comprobar que una segunda
  entrega del mismo evento no modifica nuevamente el estado.
