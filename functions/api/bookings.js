import {SERVICES,json,readJson,clean,folio,sendEmail} from '../_shared.js';
const hours={1:[15,21],2:[15,21],3:[15,21],4:[15,21],5:[9,14]};
const validSlot=(service,date,time)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))return false;const start=new Date(date+'T'+time+':00-06:00');if(!Number.isFinite(start.getTime())||start<=new Date())return false;const range=hours[start.getDay()];if(!range)return false;const [h,m]=time.split(':').map(Number),mins=h*60+m;return mins>=range[0]*60&&mins+service.minutes<=range[1]*60&&(mins-range[0]*60)%(service.minutes+10)===0};
export const onRequestPost=async({request,env})=>{
  if(!env.DB)return json({error:'La agenda temporalmente no está conectada. Escríbenos por WhatsApp.'},503);
  const b=await readJson(request),service=SERVICES[b?.serviceId];
  if(!service)return json({error:'Servicio inválido'},400);
  for(const k of ['date','time','name','email','phone'])if(!clean(b?.[k]))return json({error:'Completa nombre, correo y teléfono.'},400);
  if(!/^\S+@\S+\.\S+$/.test(clean(b.email,180)))return json({error:'Escribe un correo válido.'},400);
  if(!validSlot(service,b.date,b.time))return json({error:'La fecha u hora seleccionada no es válida.'},400);
  const id=crypto.randomUUID(),code=folio('CITA'),start=b.date+'T'+b.time+':00-06:00',endDate=new Date(new Date(start).getTime()+service.minutes*60000).toISOString();
  try{
    await env.DB.prepare("INSERT INTO appointments(id,folio,service_id,service_name,date,start_at,end_at,name,email,phone,age,address,city,postal_code,height,reason,status,payment_option,amount_due,hold_until,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))").bind(id,code,service.id,service.name,b.date,start,endDate,clean(b.name,120),clean(b.email,180),clean(b.phone,40),null,null,null,null,null,null,'pending_confirmation',null,null,null).run();
  }catch{return json({error:'Ese horario acaba de ocuparse. Elige otro.'},409);}
  const patient=clean(b.name,120),email=clean(b.email,180),phone=clean(b.phone,40);
  await Promise.all([
    sendEmail(env,{to:'yunuen.preg@gmail.com',subject:`Nueva solicitud de cita · ${code}`,html:`<h1>Nueva solicitud de cita</h1><p><strong>${service.name}</strong></p><p>${b.date} · ${b.time}</p><p>${patient}<br>${email}<br>${phone}</p><p>Folio: ${code}</p>`}),
    sendEmail(env,{to:email,subject:`Recibimos tu solicitud · ${code}`,html:`<h1>Recibimos tu solicitud</h1><p>${service.name}</p><p>${b.date} · ${b.time}</p><p>Folio: ${code}</p><p>Tu cita quedará confirmada cuando Makanuy te envíe la confirmación.</p>`})
  ]);
  return json({id,folio:code,email});
};
