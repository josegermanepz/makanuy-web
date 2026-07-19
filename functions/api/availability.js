import {SERVICES,json} from '../_shared.js';
import {availableSlots} from '../_schedule.js';

const calendarId='yunuen.preg@gmail.com';

export const onRequestGet=async({request,env})=>{
  const url=new URL(request.url),service=SERVICES[url.searchParams.get('service')],date=url.searchParams.get('date');
  if(!service||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date||''))return json({error:'Servicio o fecha inválidos'},400);
  const slots=await availableSlots(env,service,date);
  return json({slots,calendar:calendarId,calendarConnected:Boolean(env.GOOGLE_CALENDAR_ICS_URL)});
};
