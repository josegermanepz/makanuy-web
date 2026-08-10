import {SERVICES,json,readJson,clean,googleAutomation} from '../_shared.js';
import {availableSlots,localDateTime,slotAvailable} from '../_schedule.js';

const find=async(env,folio,email)=>env.DB.prepare('SELECT id,folio,service_id,service_name,date,start_at,end_at,name,email,phone,status,calendar_event_id FROM appointments WHERE folio=? AND lower(email)=lower(?)').bind(clean(folio,40),clean(email,180)).first();
const canChange=row=>['pending_confirmation','pending','confirmed'].includes(row.status)&&new Date(row.start_at).getTime()-Date.now()>=24*60*60*1000;
export const onRequestGet=async({request,env})=>{
  if(!env.DB)return json({error:'Servicio no disponible'},503);
  const url=new URL(request.url),row=await find(env,url.searchParams.get('folio'),url.searchParams.get('email'));
  if(!row)return json({error:'No encontramos una cita con esos datos.'},404);
  const service=SERVICES[row.service_id],requestedDate=url.searchParams.get('date');
  try{
    const slots=requestedDate&&service&&canChange(row)?await availableSlots(env,service,requestedDate,row.id):undefined;
    return json({appointment:row,canChange:canChange(row),slots});
  }catch{return json({error:'No pudimos consultar el calendario de Yunuen. Intenta nuevamente en unos minutos.'},503)}
};

export const onRequestPost=async({request,env})=>{
  if(!env.DB)return json({error:'Servicio no disponible'},503);
  const body=await readJson(request),row=await find(env,body?.folio,body?.email);
  if(!row)return json({error:'No encontramos una cita con esos datos.'},404);
  if(!canChange(row))return json({error:'Los cambios en línea cierran 24 horas antes de la cita.'},400);
  if(body.action==='cancel'){
    const calendar=await googleAutomation(env,{action:'cancel',eventId:row.calendar_event_id,folio:row.folio,guest:row.email,admin:env.BOOKING_EMAIL||'yunuen.preg@gmail.com',service:row.service_name});
    if(!calendar.ok)return json({error:'No pudimos cancelar la cita en el calendario de Yunuen. No se realizó ningún cambio.'},503);
    await env.DB.prepare("UPDATE appointments SET status='cancelled',updated_at=datetime('now') WHERE id=?").bind(row.id).run();
    return json({ok:true,message:'Tu cita fue cancelada. Enviamos el aviso por correo.'});
  }
  if(body.action==='reschedule'){
    const service=SERVICES[row.service_id],date=clean(body.date,10),time=clean(body.time,5);
    try{
      if(!await slotAvailable(env,service,date,time,row.id))return json({error:'Ese horario ya no está disponible. Elige otro.'},409);
    }catch{return json({error:'No pudimos consultar el calendario de Yunuen. No se realizó ningún cambio.'},503)}
    const start=localDateTime(date,time),startIso=start.toISOString(),endIso=new Date(start.getTime()+service.minutes*60000).toISOString();
    const result=await env.DB.prepare("UPDATE appointments SET date=?,start_at=?,end_at=?,status='pending_confirmation',updated_at=datetime('now') WHERE id=? AND NOT EXISTS (SELECT 1 FROM appointments WHERE id<>? AND status IN ('pending_confirmation','pending','confirmed') AND start_at < ? AND end_at > ?)").bind(date,startIso,endIso,row.id,row.id,endIso,startIso).run();
    if(!result.meta?.changes)return json({error:'Ese horario acaba de ocuparse. Elige otro.'},409);
    const calendar=await googleAutomation(env,{action:'update',eventId:row.calendar_event_id,title:`Makanuy · ${row.service_name}`,start:startIso,end:endIso,folio:row.folio,guest:row.email,admin:env.BOOKING_EMAIL||'yunuen.preg@gmail.com',service:row.service_name,date,time});
    if(!calendar.ok){
      await env.DB.prepare('UPDATE appointments SET date=?,start_at=?,end_at=?,status=?,updated_at=datetime(\'now\') WHERE id=?').bind(row.date,row.start_at,row.end_at,row.status,row.id).run();
      return calendar.error==='slot-unavailable'
        ?json({error:'Ese horario acaba de ocuparse en el calendario de Yunuen. Elige otro.'},409)
        :json({error:'No pudimos actualizar el calendario de Yunuen. Se conservó el horario anterior.'},503);
    }
    await env.DB.prepare("UPDATE appointments SET status='confirmed',updated_at=datetime('now') WHERE id=?").bind(row.id).run();
    return json({ok:true,message:'Tu cita fue reprogramada. Recibirás la confirmación actualizada por correo.'});
  }
  return json({error:'Acción inválida.'},400);
};
