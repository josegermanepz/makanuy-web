# Makanuy Consultas — Cloudflare Worker Static Assets

Configuración recomendada en Cloudflare Workers Builds:

- Production branch: `main`
- Root directory: vacío
- Build command: vacío
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy command: `npx wrangler versions upload`

El nombre del proyecto/Worker en Cloudflare debe ser exactamente `makanuy-consultas`, igual que el campo `name` de `wrangler.jsonc`.
