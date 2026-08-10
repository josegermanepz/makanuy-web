import {json,clean,rateLimit} from '../_shared.js';

const authorized=(request,env)=>{
  const expected=clean(env.ANALYTICS_ADMIN_TOKEN,240);
  const provided=clean(request.headers.get('authorization'),260).replace(/^Bearer\s+/i,'');
  return Boolean(expected&&provided&&provided===expected);
};

export const onRequestGet=async({request,env})=>{
  if(!env.DB)return json({error:'Analítica no disponible.'},503);
  const throttle=await rateLimit(env,request,'analytics-admin',20,300);
  if(!throttle.ok)return json({error:'Demasiados intentos.'},429);
  if(!authorized(request,env))return json({error:'Acceso no autorizado.'},401);
  const days=Math.min(90,Math.max(7,Number(new URL(request.url).searchParams.get('days'))||30));
  const period=`-${days} days`;
  const [totals,pages,services,daily]=await Promise.all([
    env.DB.prepare("SELECT event,COUNT(*) count FROM site_events WHERE created_at>=datetime('now',?) GROUP BY event ORDER BY count DESC").bind(period).all(),
    env.DB.prepare("SELECT path,COUNT(*) views FROM site_events WHERE event='page_view' AND created_at>=datetime('now',?) GROUP BY path ORDER BY views DESC LIMIT 12").bind(period).all(),
    env.DB.prepare("SELECT json_extract(details,'$.service_id') service,COUNT(*) count FROM site_events WHERE event IN ('booking_service','booking_success','quiz_complete') AND created_at>=datetime('now',?) AND json_extract(details,'$.service_id') IS NOT NULL GROUP BY service ORDER BY count DESC").bind(period).all(),
    env.DB.prepare("SELECT date(created_at) day,SUM(event='page_view') views,SUM(event='click_agenda') agenda_clicks,SUM(event='booking_success') bookings,SUM(event='form_success') forms,SUM(event IN ('form_error','booking_error','waitlist_error')) errors FROM site_events WHERE created_at>=datetime('now',?) GROUP BY day ORDER BY day").bind(period).all()
  ]);
  return json({days,generatedAt:new Date().toISOString(),totals:totals.results||[],pages:pages.results||[],services:services.results||[],daily:daily.results||[]});
};
