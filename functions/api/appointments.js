import {SERVICES,json,readJson,clean,sendEmail,escapeHtml,googleAutomation} from '../_shared.js';
import {availableSlots,localDateTime,slotAvailable} from '../_schedule.js';

const find=async(env,folio,email)=>env.DB.prepare('SELECT id,folio,service_id,service_name,date,start_at,end_at,name,email,phone,status,calendar_event_id FROM appointments WHERE folio=? AND lower(email)=lower(?)').bind(clean(folio,40),clean(email,180)).first();
const canChange=row=>['pending_confirmation','pending','confirmed'].includes(row.status)&&new Date(row.start_at).getTime()-Date.now()>=24*60*60*1000;
const notify=async(env,row,subject,message)=>Promise.all([
  sendEmail(env,{to:env.BOOKING_EMAIL||'yunuen.preg@gmail.com',subject,html:`<p>${escapeHtml(message)}</p><p>${escapeHtml(row.service_name)} · ${escapeHtml(row.folio)}</p>`}),
  sendEmail(env,{to:row.email,subject,html:`<p>${escapeHtml(message)}</p><p>${escapeHtml(row.service_name)} · ${escapeHtml(row.folio)}</p>`})
]);

export const onRequestGet=async({request,env})=>{
  if(!env.DB)return json({error:'Servicio no disponible'},503);
  const url=new URL(request.url),row=await find(env,url.searchParams.get('folio'),url.searchParams.get('email'));
  if(!row)return json({error:'No encontramos una cita con esos datos.'},404);
  const service=SERVICES[row.service_id],requestedDate=url.searchParams.get('date');
  const slots=requestedDate&&service&&canChange(row)?await availableSlots(env,service,requestedDate,row.id):undefined;
  return json({appointment:row,canChange:canChange(row),slots});
};

export const onRequestPost=async({request,env})=>{
  if(!env.DB)return json({error:'Servicio no disponible'},503);
  const body=await readJson(request),row=await find(env,body?.folio,body?.email);
  if(!row)return json({error:'No encontramos una cita con esos datos.'},404);
  if(!canChange(row))return json({error:'Los cambios en línea cierran 24 horas antes de la cita.'},400);
  if(body.action==='cancel'){
    await env.DB.prepare("UPDATE appointments SET status='cancelled',updated_at=datetime('now') WHERE id=?").bind(row.id).run();
    const calendar=await googleAutomation(env,{action:'cancel',eventId:row.calendar_event_id,folio:row.folio,guest:row.email,admin:env.BOOKING_EMAIL||'yunuen.preg@gmail.com',service:row.service_name});
    if(!calendar.ok)await notify(env,row,`Cita cancelada · ${row.folio}`,'La cita fue cancelada.');
    return json({ok:true,message:'Tu cita fue cancelada. Enviamos el aviso por correo.'});
  }
  if(body.action==='reschedule'){
    const service=SERVICES[row.service_id],date=clean(body.date,10),time=clean(body.time,5);
    if(!await slotAvailable(env,service,date,time,row.id))return json({error:'Ese horario ya no está disponible. Elige otro.'},409);
    const start=localDateTime(date,time),startIso=start.toISOString(),endIso=new Date(start.getTime()+service.minutes*60000).toISOString();
    const result=await env.DB.prepare("UPDATE appointments SET date=?,start_at=?,end_at=?,status='pending_confirmation',updated_at=datetime('now') WHERE id=? AND NOT EXISTS (SELECT 1 FROM appointments WHERE id<>? AND status IN ('pending_confirmation','pending','confirmed') AND start_at < ? AND end_at > ?)").bind(date,startIso,endIso,row.id,row.id,endIso,startIso).run();
    if(!result.meta?.changes)return json({error:'Ese horario acaba de ocuparse. Elige otro.'},409);
    const calendar=await googleAutomation(env,{action:'update',eventId:row.calendar_event_id,title:`Makanuy · ${row.service_name}`,start:startIso,end:endIso,folio:row.folio,guest:row.email,admin:env.BOOKING_EMAIL||'yunuen.preg@gmail.com',service:row.service_name,date,time});
    if(!calendar.ok)await notify(env,{...row,date,start_at:startIso,end_at:endIso},`Solicitud de cambio · ${row.folio}`,`La cita cambió al ${date} a las ${time} y quedó pendiente de confirmación.`);
    return json({ok:true,message:'Solicitamos el cambio. Recibirás la confirmación por correo.'});
  }
  return json({error:'Acción inválida.'},400);
};
