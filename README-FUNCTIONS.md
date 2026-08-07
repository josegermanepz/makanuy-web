# Funciones independientes de Makanuy

## Bindings y variables de Cloudflare Pages

- D1 binding: `DB`
- `GOOGLE_CALENDAR_ICS_URL`: calendario público utilizado para consultar disponibilidad.
- `GOOGLE_AUTOMATION_URL`: implementación de Google Apps Script para crear, actualizar y cancelar eventos y enviar correos.
- Secret `GOOGLE_AUTOMATION_SECRET`: valida las solicitudes al Apps Script.
- `BOOKING_EMAIL`: `yunuen.preg@gmail.com`.
- `TURNSTILE_SITE_KEY` y secret `TURNSTILE_SECRET_KEY`: protección de formularios.
- Secret `CONTENT_ADMIN_TOKEN`: acceso a `/panel-contenido.html`.
- Secret `ANALYTICS_ADMIN_TOKEN`: acceso a `/panel-resultados.html`.
- Opcionales: `RESEND_API_KEY`, `EMAIL_FROM` y `BUSINESS_EMAIL`.

Los pagos permanecen deshabilitados. Los antiguos endpoints de Mercado Pago responden `410` y no aparecen en la interfaz.

Ejecutar `schema.sql` en la base D1 después de cada cambio de estructura. Las nuevas tablas de v6 son `waitlist_requests` y `recipes`.
