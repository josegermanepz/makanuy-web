import {googleAutomation} from './_shared.js';

export const HOURS={1:[15,21],2:[15,21],3:[15,21],4:[15,21],5:[9,14]};
export const TIME_ZONE='America/Mexico_City';
export const CALENDAR_ID='yunuen.preg@gmail.com';

const localParts=date=>new Intl.DateTimeFormat('en-CA',{
  timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',hourCycle:'h23'
}).formatToParts(date).reduce((result,part)=>(result[part.type]=part.value,result),{});

export const localDateTime=(date,time)=>new Date(`${date}T${time}:00-06:00`);
export const localMinutes=date=>{
  const parts=localParts(date);
  return {date:`${parts.year}-${parts.month}-${parts.day}`,minutes:Number(parts.hour)*60+Number(parts.minute)};
};

export function validSlot(service,date,time){
  if(!service||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date||'')||!/^[0-9]{2}:[0-9]{2}$/.test(time||''))return false;
  const start=localDateTime(date,time);
  if(!Number.isFinite(start.getTime())||start<=new Date())return false;
  const range=HOURS[start.getDay()];
  if(!range)return false;
  const [hour,minute]=time.split(':').map(Number),minutes=hour*60+minute;
  return minutes>=range[0]*60&&minutes+service.minutes<=range[1]*60&&(minutes-range[0]*60)%service.minutes===0;
}

async function googleBusy(env,targetDate){
  if(!env.GOOGLE_AUTOMATION_URL||!env.GOOGLE_AUTOMATION_SECRET)throw new Error('calendar unavailable');
  const result=await googleAutomation(env,{action:'availability',date:targetDate,calendarId:CALENDAR_ID});
  if(!result.ok||result.calendarId!==CALENDAR_ID||!Array.isArray(result.events))throw new Error('calendar unavailable');
  return result.events.flatMap(event=>{
    const startDate=new Date(event.start),endDate=new Date(event.end);
    if(!Number.isFinite(startDate.getTime())||!Number.isFinite(endDate.getTime())||endDate<=startDate)return [];
    const start=localMinutes(startDate),end=localMinutes(endDate);
    if(start.date>targetDate||end.date<targetDate||(end.date===targetDate&&end.minutes===0))return [];
    const from=start.date<targetDate?0:start.minutes,to=end.date>targetDate?24*60:end.minutes;
    return from<to?[[from,to]]:[];
  });
}

export async function busyIntervals(env,date,excludeId=''){
  let internal=[];
  if(env.DB){
    const query=excludeId
      ?"SELECT start_at,end_at FROM appointments WHERE date=? AND id<>? AND status IN ('pending_confirmation','pending','confirmed')"
      :"SELECT start_at,end_at FROM appointments WHERE date=? AND status IN ('pending_confirmation','pending','confirmed')";
    const rows=excludeId?await env.DB.prepare(query).bind(date,excludeId).all():await env.DB.prepare(query).bind(date).all();
    internal=(rows.results||[]).flatMap(row=>{
      const start=localMinutes(new Date(row.start_at)),end=localMinutes(new Date(row.end_at));
      return start.date===date&&end.date===date?[[start.minutes,end.minutes]]:[];
    });
  }
  return [...internal,...await googleBusy(env,date)];
}

export async function availableSlots(env,service,date,excludeId=''){
  const day=new Date(`${date}T12:00:00-06:00`).getDay(),range=HOURS[day];
  if(!range)return [];
  const busy=await busyIntervals(env,date,excludeId),slots=[];
  for(let minutes=range[0]*60;minutes+service.minutes<=range[1]*60;minutes+=service.minutes){
    const end=minutes+service.minutes;
    if(!busy.some(([from,to])=>minutes<to&&end>from))slots.push(`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`);
  }
  return slots;
}

export async function slotAvailable(env,service,date,time,excludeId=''){
  return validSlot(service,date,time)&&(await availableSlots(env,service,date,excludeId)).includes(time);
}
