# Publicar un recetario

La versión v6 incluye un panel interno en `/panel-contenido.html`. El panel publica el texto de una receta en la base D1 y la muestra automáticamente en `/recetas.html`.

## Activación inicial

1. Crear en Cloudflare Pages el secreto `CONTENT_ADMIN_TOKEN`.
2. Ejecutar las nuevas instrucciones de `schema.sql` en la base D1.
3. Abrir `/panel-contenido.html` e ingresar la misma clave.
4. Completar título, resumen, ingredientes, pasos y etiquetas.

La clave no se guarda en el navegador. El panel no aparece en menús ni en el sitemap y está marcado `noindex`.

## Imágenes

El campo de imagen acepta una ruta local como `/assets/images/mi-receta.webp`. Si se deja vacío, se utiliza una imagen general de Makanuy. Para una imagen particular:

- WebP o AVIF horizontal, idealmente 1,200 × 900 px.
- Menor a 250 KB cuando sea razonable.
- Nombre breve, sin espacios ni acentos.
- Subir primero el archivo al repositorio y después indicar su ruta en el panel.

## Revisión editorial

- No incluir recomendaciones clínicas individualizadas.
- Revisar alergias, conservación y seguridad alimentaria cuando corresponda.
- Separar cada ingrediente y cada paso en una línea.
- Confirmar ortografía y cantidades antes de publicar.
