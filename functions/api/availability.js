import {SERVICES,json} from '../_shared.js';
import {availableSlots,CALENDAR_ID} from '../_schedule.js';

export const onRequestGet=async({request,env})=>{
  const url=new URL(request.url),service=SERVICES[url.searchParams.get('service')],date=url.searchParams.get('date');
  if(!service||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date||''))return json({error:'Servicio o fecha inválidos'},400);
  try{
    const slots=await availableSlots(env,service,date);
    return json({slots,calendar:CALENDAR_ID,calendarConnected:true});
  }catch{return json({error:'No pudimos consultar el calendario de Yunuen. Intenta nuevamente en unos minutos.',slots:[],calendar:CALENDAR_ID,calendarConnected:false},503)}
};
