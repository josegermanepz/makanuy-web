import {SERVICES,json,readJson,clean,folio,sendEmail,escapeHtml,rateLimit,verifyTurnstile} from '../_shared.js';

export const onRequestPost=async({request,env})=>{
  if(!env.DB)return json({error:'La lista de espera no está disponible temporalmente.'},503);
  const throttle=await rateLimit(env,request,'waitlist',3,900);
  if(!throttle.ok)return json({error:'Recibimos demasiados intentos. Espera unos minutos.'},429);
  const body=await readJson(request),service=SERVICES[body?.serviceId];
  if(!service)return json({error:'Selecciona una consulta válida.'},400);
  if(clean(body?.companyWebsite))return json({error:'No fue posible procesar la solicitud.'},400);
  if(!await verifyTurnstile(env,request,body?.turnstileToken))return json({error:'No pudimos validar la verificación de seguridad.'},400);
  const name=clean(body?.name,120),email=clean(body?.email,180),phone=clean(body?.phone,40),preferredDate=clean(body?.preferredDate,10);
  if(!name||!/^\S+@\S+\.\S+$/.test(email)||!body?.privacy)return json({error:'Completa nombre, correo y acepta el aviso de privacidad.'},400);
  const existing=await env.DB.prepare("SELECT folio FROM waitlist_requests WHERE service_id=? AND lower(email)=lower(?) AND status='active' LIMIT 1").bind(service.id,email).first();
  if(existing)return json({ok:true,folio:existing.folio,message:'Ya estabas en la lista de espera para esta consulta.'});
  const code=folio('ESPERA'),id=crypto.randomUUID();
  await env.DB.prepare("INSERT INTO waitlist_requests(id,folio,service_id,service_name,name,email,phone,preferred_date,status,created_at) VALUES(?,?,?,?,?,?,?,?,'active',datetime('now'))").bind(id,code,service.id,service.name,name,email,phone,preferredDate).run();
  const safeName=escapeHtml(name),safeService=escapeHtml(service.name),safeDate=escapeHtml(preferredDate||'Sin fecha específica'),safePhone=escapeHtml(phone||'No proporcionado');
  await Promise.all([
    sendEmail(env,{to:env.BOOKING_EMAIL||'yunuen.preg@gmail.com',subject:`Nueva lista de espera · ${code}`,html:`<h1>Lista de espera</h1><p><strong>${safeService}</strong></p><p>${safeName}<br>${escapeHtml(email)}<br>${safePhone}</p><p>Fecha preferida: ${safeDate}</p><p>Folio: ${code}</p>`}),
    sendEmail(env,{to:email,subject:`Te agregamos a la lista de espera · ${code}`,html:`<h1>Lista de espera Makanuy</h1><p>Hola ${safeName}, registramos tu interés en <strong>${safeService}</strong>.</p><p>Si se abre un horario compatible, Makanuy se comunicará contigo. Esto no reserva ni confirma una cita.</p><p>Folio: ${code}</p>`})
  ]);
  return json({ok:true,folio:code,message:'Te agregamos a la lista de espera. Revisa tu correo.'});
};
