# Inventario funcional v5

## Agenda

- Siete servicios autorizados: Bienestar, Hormonal, Embarazo, Climaterio/Menopausia, Sistema Inmune, Tanita y Online.
- Consulta disponibilidad con `/api/availability`, cruza citas guardadas y el calendario configurado de Yunuen.
- Guarda una solicitud atómica en D1 para evitar doble reserva.
- Genera folio, evento de Google Calendar y notificaciones.
- Permite cancelar o reprogramar hasta 24 horas antes.
- No procesa pagos y los endpoints históricos responden como deshabilitados.
- Se añadió límite de intentos y soporte opcional para Cloudflare Turnstile.

## Formularios

- Empresas: guarda folio y datos en D1 y envía notificación.
- Contacto: nuevo formulario de orientación general, con aviso para no enviar información clínica.
- Ambos usan validación cliente/servidor, honeypot, límite de tamaño, rate limiting y Turnstile cuando se configuren sus claves.
- Referidos no recopila datos de terceras personas: únicamente crea un enlace para compartir.

## Recursos

- Calculadora de agua con validación numérica.
- Calculadora de equivalentes por grupo y alimento.
- Marcas recomendadas con búsqueda y filtros.
- Recetarios con portadas locales de mayor resolución.
- Carrusel local de `@yunfig`; no depende de la API de Instagram.

## Integraciones y datos

- Google Calendar y correo: configurados mediante secretos de Cloudflare y automatización de Google.
- D1: citas, formularios y contadores temporales de intentos.
- Mercado Pago/pagos: intencionalmente deshabilitados.
- Wix: ninguna imagen, script, estilo o función se carga en tiempo de ejecución.

## Acciones de cuenta todavía necesarias

- Crear un widget Turnstile y guardar `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` en Cloudflare para activar el reto anti-bot.
- Mantener vigentes `GOOGLE_AUTOMATION_URL`, `GOOGLE_AUTOMATION_SECRET`, `GOOGLE_CALENDAR_ICS_URL` y el binding `DB` en producción y previews.
