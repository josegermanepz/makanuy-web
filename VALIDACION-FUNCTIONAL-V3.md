# Validación Functional V3

Fecha: 19 de julio de 2026

## Alcance comprobado

- 25 páginas HTML con referencias locales válidas.
- 11 servicios reservables y preselección desde cada botón de reserva.
- Disponibilidad real conectada con Cloudflare D1.
- Solicitud de cita con folio mientras Mercado Pago permanece pendiente.
- Consulta, cancelación y reprogramación mediante folio y correo.
- Formularios de empresas y referidos conectados a la API del sitio.
- 23 categorías de recomendaciones con buscador y fotografías locales.
- 6 referencias visuales de porciones.
- Calculadora de agua y consulta de grupos de equivalentes.
- Navegación móvil, rutas limpias, sitemap y redirecciones.

## Pruebas ejecutadas

- Se generó una cita técnica completa y se obtuvo un folio.
- Se localizó y canceló la misma cita; no quedó bloqueando disponibilidad.
- Se comprobaron horarios de lunes y el bloqueo de fechas/horas inválidas.
- Se comprobó el filtrado de recomendaciones.
- Se comprobó que no existen referencias locales a archivos faltantes.

## Pendiente intencional

- Mercado Pago no está activado, por decisión de la propietaria. Hasta conectarlo, la cita queda como solicitud pendiente de confirmación y muestra su folio.
- No se ha fusionado `functional-v3` con `main`; la versión de producción permanece sin cambios hasta la aprobación visual final.
