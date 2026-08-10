# Funciones independientes de Makanuy

## Bindings y variables de Cloudflare Pages

- D1 binding: `DB`
- `GOOGLE_AUTOMATION_URL`: implementación de Google Apps Script que consulta disponibilidad, crea, actualiza y cancela eventos exclusivamente en `yunuen.preg@gmail.com`, además de enviar correos.
- Secret `GOOGLE_AUTOMATION_SECRET`: valida las solicitudes al Apps Script.
- `BOOKING_EMAIL`: `yunuen.preg@gmail.com`.
- `TURNSTILE_SITE_KEY` y secret `TURNSTILE_SECRET_KEY`: protección de formularios.
- Secret `CONTENT_ADMIN_TOKEN`: acceso a `/panel-contenido/` para publicar, editar o retirar recetarios.
- Secret `ANALYTICS_ADMIN_TOKEN`: acceso a `/panel-resultados/` para consultar el recorrido agregado, conversiones y errores sin datos personales.
- Opcionales: `RESEND_API_KEY`, `EMAIL_FROM` y `BUSINESS_EMAIL`.

Los pagos permanecen deshabilitados. Los antiguos endpoints de Mercado Pago responden `410` y no aparecen en la interfaz.

La agenda no utiliza un calendario público ni horarios de respaldo. Si Google Calendar no responde, no ofrece horarios ni guarda solicitudes. Cada horario se comprueba nuevamente antes de crear o reprogramar una cita. Las consultas consecutivas pueden comenzar exactamente cuando termina la anterior; no se añade un margen automático de 10 minutos.

Ejecutar `schema.sql` en la base D1 después de cada cambio de estructura. Las nuevas tablas de v6 son `waitlist_requests` y `recipes`.
