# Makanuy Comprehensive V4

Versión integral independiente de Wix, preparada para Cloudflare Pages.

## Incluye

- Portada reconstruida y responsive.
- Navegación consistente en 30 páginas.
- Servicios, nutrición para mujeres, empresas, recursos, contacto, preguntas frecuentes y perfil profesional.
- Agenda propia con disponibilidad, folio, cancelación y reprogramación.
- Formularios empresariales con validación y minimización de datos.
- Programa de referidos sin compartir datos personales de terceros.
- Calculadora de agua y calculadora de equivalentes.
- Enlaces uniformes a `@yunfig`.
- SEO, sitemap, redirecciones, datos estructurados, accesibilidad y encabezados de seguridad.

## Pendientes intencionales

- El sitio no muestra ni procesa pagos. La agenda genera una solicitud pendiente de confirmación.
- Las credenciales académicas y cédula de Yunuen deben validarse antes de publicarse.
- Privacidad y términos requieren revisión jurídica mexicana.
- GA4/Meta Pixel no se activan hasta definir consentimiento y cuentas.
- Turnstile requiere claves/configuración en Cloudflare.

## Despliegue

Cloudflare Pages debe publicar la raíz del repositorio y conservar el binding `DB` existente.

## Calendario y correo de agenda

- Las notificaciones de nuevas solicitudes se envían a `yunuen.preg@gmail.com` mediante el secreto `RESEND_API_KEY`.
- Para descontar automáticamente los eventos ocupados de Google Calendar, configura en Cloudflare el secreto `GOOGLE_CALENDAR_ICS_URL` con la dirección iCal privada del calendario de `yunuen.preg@gmail.com`.
- La dirección iCal privada es sensible: debe guardarse únicamente como secreto de Cloudflare y nunca dentro del repositorio.
- Sin ese secreto, la agenda continúa funcionando con las citas guardadas en D1, pero no puede detectar reuniones creadas directamente en Google Calendar.
