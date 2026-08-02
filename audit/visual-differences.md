# Revisión visual v5

## Corregido en esta rama

- Un único encabezado global: 92 px en escritorio, Arial 14 px en navegación, los mismos espacios y estado rosa activo en todas las páginas.
- Paleta unificada en rosa claro, verde suave, blanco y tinta oscura; el antiguo tono arena queda sustituido por la variable rosa `--cream` del sistema actual.
- Las páginas heredadas comparten una sola hoja base en lugar de repetir una fuente incrustada de aproximadamente 100 KB por archivo.
- Tanita y Consulta Online ya no amplían miniaturas de 250 px; usan recursos locales de mayor resolución.
- Los dos recetarios muestran portadas propias y no el mismo ícono pequeño.
- La tarjeta de calculadoras usa la imagen correcta y conserva el enlace directo a `#calculadoras`.
- Se mantienen foco visible, botones táctiles de al menos 44 px y reducción de movimiento.

## Diferencias deliberadas respecto a Wix

- La agenda, formularios y calculadoras son código propio para que el sitio no dependa de Wix.
- No se muestran los cuatro servicios retirados ni funciones de pago.
- Instagram es un carrusel local enlazado a `@yunfig`; evita una dependencia frágil de la API social.
- El diseño conserva la identidad visual, pero mejora jerarquía, contraste, legibilidad y comportamiento móvil.

## Validación pendiente antes de fusionar

- Revisión visual de la URL preview en 1440, 1024, 768, 390 y 375 px.
- Prueba no destructiva de disponibilidad; no crear una cita real durante QA sin autorización.
- Confirmar que las variables y el binding D1 también estén disponibles para el entorno preview.
