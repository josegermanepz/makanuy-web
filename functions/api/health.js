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
  const calendar = Boolean(env.GOOGLE_CALENDAR_ICS_URL && env.GOOGLE_AUTOMATION_URL);
  const ok = database && calendar;
  return json({ ok, database, calendar, checkedAt: new Date().toISOString() }, ok ? 200 : 503);
};
