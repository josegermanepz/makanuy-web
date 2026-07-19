# Makanuy — migración a Cloudflare Pages

Versión estática inicial del sitio público de Makanuy.

## Contenido incluido

- Inicio, servicios, consulta ideal, empresas, recomendaciones y referidos.
- Tres recetas completas.
- Calculadora de agua y calculadora orientativa de equivalentes.
- Agenda por WhatsApp, contacto por correo y formularios que generan mensajes.
- Diseño adaptable a celular, metadatos SEO, sitemap, robots, redirecciones y encabezados de seguridad.

## Punto pendiente más importante

Las imágenes siguen cargándose desde `static.wixstatic.com`. Antes de cerrar o eliminar el sitio de Wix, descarga los archivos originales desde el Administrador de medios de Wix, guárdalos en `assets/images/` y sustituye las URLs remotas. Así el sitio será completamente independiente de Wix.

La base de la calculadora de equivalentes es una versión inicial y debe ser validada por la responsable clínica antes de su publicación definitiva.

## Vista local

Desde esta carpeta:

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080`.

## Publicar con GitHub + Cloudflare Pages

1. Crea un repositorio vacío en GitHub.
2. Sube el contenido de esta carpeta a la raíz del repositorio.
3. En Cloudflare entra a **Workers & Pages**.
4. Selecciona **Create application > Pages > Connect to Git**.
5. Elige el repositorio.
6. Framework preset: **None**.
7. Build command: dejar vacío.
8. Build output directory: `/`.
9. Publica y prueba primero el subdominio `*.pages.dev`.
10. En el proyecto entra a **Custom domains > Set up a domain** y agrega `makanuyconsultas.com` y `www.makanuyconsultas.com`.

Cloudflare indica que un proyecto iniciado con integración Git no puede cambiarse después a Direct Upload, y viceversa; para mantenimiento continuo conviene usar Git.

## Migración del dominio sin interrupción

1. Mantén Wix activo mientras validas el sitio `pages.dev`.
2. Revisa todas las páginas, botones, precios y textos.
3. Configura el dominio en Cloudflare Pages.
4. Cambia DNS solo después de que el nuevo sitio esté validado.
5. Conserva Wix durante algunos días como respaldo.

## Datos de contacto configurados

- Teléfono/WhatsApp: 55 8577 0856
- Correo: yunuen.preg@gmail.com
- Dirección: Av. Homero 1339, Piso 5, Polanco II Secc., Miguel Hidalgo, 11530 Ciudad de México, CDMX
