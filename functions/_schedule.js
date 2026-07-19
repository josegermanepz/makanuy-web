export const HOURS={1:[15,21],2:[15,21],3:[15,21],4:[15,21],5:[9,14]};
export const TIME_ZONE='America/Mexico_City';

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
  return minutes>=range[0]*60&&minutes+service.minutes<=range[1]*60&&(minutes-range[0]*60)%(service.minutes+10)===0;
}

function parseCalendarTime(line,targetDate){
  const value=line.slice(line.indexOf(':')+1).trim();
  const match=value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if(!match)return null;
  if(value.endsWith('Z')){
    const parsed=new Date(value.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,'$1-$2-$3T$4:$5:$6Z'));
    const local=localMinutes(parsed);
    return local.date===targetDate?local.minutes:null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`===targetDate?Number(match[4])*60+Number(match[5]):null;
}

async function googleBusy(url,targetDate){
  if(!url)return [];
  try{
    const response=await fetch(url,{headers:{accept:'text/calendar'}});
    if(!response.ok)throw new Error('calendar unavailable');
    const text=(await response.text()).replace(/\r?\n[ \t]/g,'');
    return text.split('BEGIN:VEVENT').slice(1).flatMap(block=>{
      const lines=block.split(/\r?\n/),start=lines.find(line=>line.startsWith('DTSTART')),end=lines.find(line=>line.startsWith('DTEND'));
      const from=start&&parseCalendarTime(start,targetDate),to=end&&parseCalendarTime(end,targetDate);
      return Number.isFinite(from)&&Number.isFinite(to)?[[from,to]]:[];
    });
  }catch{return []}
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
  return [...internal,...await googleBusy(env.GOOGLE_CALENDAR_ICS_URL,date)];
}

export async function availableSlots(env,service,date,excludeId=''){
  const day=new Date(`${date}T12:00:00-06:00`).getDay(),range=HOURS[day];
  if(!range)return [];
  const busy=await busyIntervals(env,date,excludeId),slots=[];
  for(let minutes=range[0]*60;minutes+service.minutes<=range[1]*60;minutes+=service.minutes+10){
    const end=minutes+service.minutes;
    if(!busy.some(([from,to])=>minutes<to&&end>from))slots.push(`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`);
  }
  return slots;
}

export async function slotAvailable(env,service,date,time,excludeId=''){
  return validSlot(service,date,time)&&(await availableSlots(env,service,date,excludeId)).includes(time);
}
