# Validación integral v6

## Mejoras implementadas

- Cuestionario accesible de dos pasos para recomendar una consulta sin diagnosticar.
- Lista de espera protegida para fechas sin disponibilidad.
- Recetarios con búsqueda, filtros y avisos de nuevas publicaciones.
- Panel interno para publicar recetas desde el navegador.
- Panel interno de métricas agregadas sin datos de pacientes.
- Botón persistente de agenda en móvil.
- Normalización del estado activo del menú en rutas limpias y `.html`.
- Imágenes sociales específicas para las páginas prioritarias.
- Testimonios anonimizados y con aclaración sobre variabilidad de resultados.
- Información profesional pública limitada a datos ya verificados.

## Activaciones que requieren secretos

- `CONTENT_ADMIN_TOKEN` para el panel editorial.
- `ANALYTICS_ADMIN_TOKEN` para el tablero de resultados.

No se deben guardar estos secretos en GitHub ni en archivos públicos.

## Pruebas obligatorias antes de producción

1. Ejecutar `schema.sql` en D1.
2. Completar el cuestionario en las seis rutas de objetivo y comprobar sus enlaces.
3. Consultar una fecha sin horarios y enviar una lista de espera de prueba.
4. Crear, consultar, reprogramar y cancelar una cita de prueba.
5. Confirmar los correos recibidos por paciente y Yunuen.
6. Publicar una receta de prueba y retirarla directamente en D1 después de validarla.
7. Revisar 390, 768 y 1440 px sin desbordamiento horizontal.
