import {SERVICES,json,readJson,clean,folio,sendEmail,escapeHtml,googleAutomation} from '../_shared.js';
import {localDateTime,slotAvailable} from '../_schedule.js';

export const onRequestPost=async({request,env})=>{
  if(!env.DB)return json({error:'La agenda temporalmente no está conectada. Escríbenos por WhatsApp.'},503);
  const body=await readJson(request),service=SERVICES[body?.serviceId];
  if(!service)return json({error:'Servicio inválido'},400);
  if(clean(body?.companyWebsite))return json({error:'No fue posible procesar la solicitud.'},400);
  for(const key of ['date','time','name','email','phone'])if(!clean(body?.[key]))return json({error:'Completa nombre, correo y teléfono.'},400);
  if(!body.privacy)return json({error:'Acepta el aviso de privacidad y la política de cancelación.'},400);
  if(!/^\S+@\S+\.\S+$/.test(clean(body.email,180)))return json({error:'Escribe un correo válido.'},400);
  if(!await slotAvailable(env,service,body.date,body.time))return json({error:'Ese horario ya no está disponible. Elige otro.'},409);

  const id=crypto.randomUUID(),code=folio('CITA'),start=localDateTime(body.date,body.time),end=new Date(start.getTime()+service.minutes*60000);
  const startIso=start.toISOString(),endIso=end.toISOString();
  const patient=clean(body.name,120),email=clean(body.email,180),phone=clean(body.phone,40);
  try{
    const result=await env.DB.prepare("INSERT INTO appointments(id,folio,service_id,service_name,date,start_at,end_at,name,email,phone,status,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,'pending_confirmation',datetime('now') WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE status IN ('pending_confirmation','pending','confirmed') AND start_at < ? AND end_at > ?)").bind(id,code,service.id,service.name,body.date,startIso,endIso,patient,email,phone,endIso,startIso).run();
    if(!result.meta?.changes)return json({error:'Ese horario acaba de ocuparse. Elige otro.'},409);
  }catch{return json({error:'No fue posible guardar la cita. Intenta nuevamente.'},500)}

  const safeName=escapeHtml(patient),safeService=escapeHtml(service.name),safeDate=escapeHtml(body.date),safeTime=escapeHtml(body.time),safeEmail=escapeHtml(email),safePhone=escapeHtml(phone);
  const calendar=await googleAutomation(env,{action:'create',title:`Makanuy · ${service.name}`,start:startIso,end:endIso,description:`Solicitud ${code}\nPaciente: ${patient}\nTeléfono: ${phone}\nCorreo: ${email}`,location:service.location==='online'?'Consulta online':'Av. Homero 1339, Piso 5, Polanco II Secc, CDMX',guest:email,folio:code,patient,service:service.name,date:body.date,time:body.time,admin:env.BOOKING_EMAIL||'yunuen.preg@gmail.com'});
  if(calendar.ok&&calendar.eventId)await env.DB.prepare('UPDATE appointments SET calendar_event_id=? WHERE id=?').bind(calendar.eventId,id).run();
  const notifications=calendar.ok?[]:await Promise.all([
    sendEmail(env,{to:env.BOOKING_EMAIL||'yunuen.preg@gmail.com',subject:`Nueva solicitud de cita · ${code}`,html:`<h1>Nueva solicitud de cita</h1><p><strong>${safeService}</strong></p><p>${safeDate} · ${safeTime}</p><p>${safeName}<br>${safeEmail}<br>${safePhone}</p><p>Folio: ${code}</p>`}),
    sendEmail(env,{to:email,subject:`Recibimos tu solicitud · ${code}`,html:`<h1>Recibimos tu solicitud</h1><p>${safeService}</p><p>${safeDate} · ${safeTime}</p><p>Folio: ${code}</p><p>Tu cita quedará confirmada cuando Makanuy te envíe la confirmación.</p>`})
  ]);
  return json({id,folio:code,email,notificationSent:Boolean(calendar.ok)||notifications.every(item=>item.ok),calendarConnected:Boolean(calendar.ok)});
};
