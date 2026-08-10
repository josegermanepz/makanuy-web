import { json } from '../_shared.js';

export const onRequestGet = async ({ env }) => {
  let database = false;
  try {
    if (env.DB) {
      const row = await env.DB.prepare('SELECT 1 AS ok').first();
      database = Number(row?.ok) === 1;
    }
  } catch {
    database = false;
  }
  const calendar = Boolean(env.GOOGLE_AUTOMATION_URL && env.GOOGLE_AUTOMATION_SECRET);
  const email = Boolean(env.RESEND_API_KEY || env.GOOGLE_AUTOMATION_URL);
  const turnstile = Boolean(env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY);
  const ok = database && calendar;
  return json({ ok, database, calendar, email, turnstile, contentEditor:Boolean(env.CONTENT_ADMIN_TOKEN),analyticsPanel:Boolean(env.ANALYTICS_ADMIN_TOKEN),checkedAt: new Date().toISOString() }, ok ? 200 : 503);
};
