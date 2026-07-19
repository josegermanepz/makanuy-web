# Makanuy — Cloudflare Workers

Proyecto estático listo para Cloudflare Workers con Static Assets.

## Configuración en Cloudflare

- Production branch: `main`
- Root directory: dejar vacío
- Build command: dejar vacío
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy command: `npx wrangler versions upload`
- Environment variables: ninguna

## Estructura

- `public/`: sitio completo
- `wrangler.jsonc`: configuración de Worker y activos estáticos
- `package.json`: versión de Wrangler y comandos

## Validación local

```bash
npm install
npm run dev
```

Las imágenes aún se cargan desde `static.wixstatic.com`. Antes de eliminar definitivamente la cuenta o los medios de Wix, conviene descargarlas y sustituir esas URLs por archivos locales.
