# Limitaciones y trabajo futuro

- Las notificaciones y reportes tienen la infraestructura de colas preparada, pero
  los adaptadores externos de correo, mensajería y generación de archivos pueden
  sustituirse por implementaciones de producción.
- Stripe se prueba con claves de prueba y requiere configurar un endpoint o Stripe
  CLI para recibir webhooks localmente.
- El seed contiene credenciales conocidas para facilitar la evaluación académica; un
  entorno real debe usar secretos rotados y un mecanismo de administración segura.
- No se incluye una interfaz web; la demostración se realiza mediante Swagger,
  clientes HTTP o scripts.
- La autorización se basa en roles y relaciones básicas. Un despliegue mayor podría
  añadir permisos por recurso, auditoría y rate limiting específico por operación.
- Los reportes administrativos pueden ampliarse con almacenamiento de archivos,
  expiración de resultados y métricas de ejecución.
- Una base local existente puede tener `membership.description` creada antes de que
  la migración correspondiente figure como ejecutada; en ese caso TypeORM detecta la
  migración pendiente y falla por columna duplicada. Una base nueva, creada desde cero
  con el historial completo, no presenta esta inconsistencia.
