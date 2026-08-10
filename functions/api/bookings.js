import {SERVICES,json,readJson,clean,folio,googleAutomation,rateLimit,verifyTurnstile} from '../_shared.js';
import {localDateTime,slotAvailable} from '../_schedule.js';

export const onRequestPost=async({request,env})=>{
  if(!env.DB)return json({error:'La agenda temporalmente no está conectada. Escríbenos por WhatsApp.'},503);
  const throttle=await rateLimit(env,request,'bookings',4,600);if(!throttle.ok)return json({error:'Recibimos demasiados intentos. Espera unos minutos e inténtalo de nuevo.'},429);
  const body=await readJson(request),service=SERVICES[body?.serviceId];
  if(!service)return json({error:'Servicio inválido'},400);
  if(clean(body?.companyWebsite))return json({error:'No fue posible procesar la solicitud.'},400);
  if(!await verifyTurnstile(env,request,body?.turnstileToken))return json({error:'No pudimos validar la verificación de seguridad.'},400);
  for(const key of ['date','time','name','email','phone'])if(!clean(body?.[key]))return json({error:'Completa nombre, correo y teléfono.'},400);
  const patient=clean(body.name,120),email=clean(body.email,180),phone=clean(body.phone,40);
  const isOnline=service.location==='online',modality=isOnline?'online':'presencial',modalityLabel=isOnline?'En línea':'Presencial';
  if(patient.split(/\s+/).filter(Boolean).length<2)return json({error:'Escribe tu nombre completo y al menos un apellido.'},400);
  if(!body.privacy)return json({error:'Acepta el aviso de privacidad y la política de cancelación.'},400);
  if(!/^\S+@\S+\.\S+$/.test(email))return json({error:'Escribe un correo válido.'},400);
  const phoneDigits=phone.replace(/\D/g,'');
  if(phoneDigits.length<10||phoneDigits.length>15)return json({error:'Escribe un teléfono válido de 10 a 15 dígitos.'},400);
  try{
    if(!await slotAvailable(env,service,body.date,body.time))return json({error:'Ese horario ya no está disponible. Elige otro.'},409);
  }catch{return json({error:'No pudimos verificar el calendario de Yunuen. No se creó ninguna cita; intenta nuevamente en unos minutos.'},503)}

  const id=crypto.randomUUID(),code=folio('CITA'),start=localDateTime(body.date,body.time),end=new Date(start.getTime()+service.minutes*60000);
  const startIso=start.toISOString(),endIso=end.toISOString(),serviceName=`${service.name} · ${modalityLabel}`;
  try{
    const result=await env.DB.prepare("INSERT INTO appointments(id,folio,service_id,service_name,date,start_at,end_at,name,email,phone,status,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,'pending_confirmation',datetime('now') WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE status IN ('pending_confirmation','pending','confirmed') AND start_at < ? AND end_at > ?)").bind(id,code,service.id,serviceName,body.date,startIso,endIso,patient,email,phone,endIso,startIso).run();
    if(!result.meta?.changes)return json({error:'Ese horario acaba de ocuparse. Elige otro.'},409);
  }catch{return json({error:'No fue posible guardar la cita. Intenta nuevamente.'},500)}

  const calendar=await googleAutomation(env,{action:'create',title:`Makanuy · ${serviceName}`,start:startIso,end:endIso,description:`Cita ${code}\nPaciente: ${patient}\nTeléfono: ${phone}\nCorreo: ${email}\nModalidad: ${modalityLabel}`,location:isOnline?'Consulta en línea':'Av. Homero 1339, Piso 5, Polanco II Secc, CDMX',guest:email,folio:code,patient,service:serviceName,modality:modalityLabel,date:body.date,time:body.time,admin:env.BOOKING_EMAIL||'yunuen.preg@gmail.com'});
  if(!calendar.ok){
    await env.DB.prepare('DELETE FROM appointments WHERE id=?').bind(id).run();
    return calendar.error==='slot-unavailable'
      ?json({error:'Ese horario acaba de ocuparse en el calendario de Yunuen. Elige otro.'},409)
      :json({error:'No pudimos crear la cita en el calendario de Yunuen. No se guardó la solicitud; intenta nuevamente.'},503);
  }
  await env.DB.prepare('UPDATE appointments SET calendar_event_id=?,status=\'confirmed\' WHERE id=?').bind(calendar.eventId||'',id).run();
  return json({id,folio:code,email,modality,meetLink:isOnline?(calendar.meetLink||''):null,notificationSent:true,calendarConnected:true});
};
