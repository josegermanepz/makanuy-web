# Publicar un recetario

La versión v6 incluye un panel interno en `/panel-contenido/`. El panel permite publicar, corregir, retirar y volver a publicar recetas guardadas en D1. Los cambios aparecen automáticamente en `/recetas/`.

## Activación inicial

1. Crear en Cloudflare Pages el secreto `CONTENT_ADMIN_TOKEN`.
2. Ejecutar las nuevas instrucciones de `schema.sql` en la base D1.
3. Abrir `/panel-contenido/` e ingresar la misma clave.
4. Completar título, resumen, ingredientes, pasos y etiquetas.
5. Usar “Cargar recetarios publicados” para editar o retirar contenido existente.

La clave no se guarda en el navegador. El panel no aparece en menús ni en el sitemap, está marcado `noindex` y sus respuestas no se almacenan en caché.

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
