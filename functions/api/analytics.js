import { clean, json, readJson, rateLimit } from '../_shared.js';

const EVENTS = new Set([
  'page_view', 'click_agenda', 'click_whatsapp', 'click_instagram', 'click_service',
  'form_start', 'form_success', 'form_error', 'booking_service', 'booking_date',
  'booking_slot', 'booking_success', 'booking_error', 'calculator_water',
  'calculator_equivalents', 'recommendation_filter'
]);

export const onRequestPost = async ({ request, env }) => {
  if (!env.DB) return new Response(null, { status: 204 });
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ error: 'Origen inválido' }, 403);
  const throttle = await rateLimit(env, request, 'analytics', 80, 300);
  if (!throttle.ok) return new Response(null, { status: 204 });
  const body = await readJson(request);
  const event = clean(body?.event, 48);
  if (!EVENTS.has(event)) return json({ error: 'Evento inválido' }, 400);
  const path = clean(body?.path, 180).replace(/[^a-zA-Z0-9_\-./]/g, '') || '/';
  const referrer = clean(body?.referrer, 120);
  const source = body?.details && typeof body.details === 'object' ? body.details : {};
  const details = {};
  for (const key of ['title', 'label', 'form_id', 'service_id', 'date', 'status', 'filter']) {
    if (source[key] != null) details[key] = clean(source[key], 120);
  }
  try {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS site_events (id TEXT PRIMARY KEY,event TEXT NOT NULL,path TEXT NOT NULL,referrer TEXT,details TEXT,created_at TEXT NOT NULL)').run();
    await env.DB.prepare("INSERT INTO site_events(id,event,path,referrer,details,created_at) VALUES(?,?,?,?,?,datetime('now'))")
      .bind(crypto.randomUUID(), event, path, referrer, JSON.stringify(details)).run();
    if (Math.random() < 0.01) await env.DB.prepare("DELETE FROM site_events WHERE created_at < datetime('now','-90 days')").run();
  } catch {
    return new Response(null, { status: 204 });
  }
  return new Response(null, { status: 204 });
};
