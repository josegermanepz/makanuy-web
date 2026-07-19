import {SERVICES,json} from '../_shared.js';

const hours={1:[15,21],2:[15,21],3:[15,21],4:[15,21],5:[9,14]};
const calendarId='yunuen.preg@gmail.com';

const localParts=date=>new Intl.DateTimeFormat('en-CA',{
  timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',hourCycle:'h23'
}).formatToParts(date).reduce((a,x)=>(a[x.type]=x.value,a),{});

function parseCalendarTime(line,targetDate){
  const value=line.slice(line.indexOf(':')+1).trim();
  const match=value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if(!match)return null;
  if(value.endsWith('Z')){
    const p=localParts(new Date(value.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,'$1-$2-$3T$4:$5:$6Z')));
    if(`${p.year}-${p.month}-${p.day}`!==targetDate)return null;
    return Number(p.hour)*60+Number(p.minute);
  }
  if(`${match[1]}-${match[2]}-${match[3]}`!==targetDate)return null;
  return Number(match[4])*60+Number(match[5]);
}

async function googleBusy(url,targetDate){
  if(!url)return [];
  try{
    const response=await fetch(url,{headers:{accept:'text/calendar'}});
    if(!response.ok)throw new Error('calendar unavailable');
    const text=(await response.text()).replace(/\r?\n[ \t]/g,'');
    return text.split('BEGIN:VEVENT').slice(1).flatMap(block=>{
      const lines=block.split(/\r?\n/),start=lines.find(x=>x.startsWith('DTSTART')),end=lines.find(x=>x.startsWith('DTEND'));
      const a=start&&parseCalendarTime(start,targetDate),b=end&&parseCalendarTime(end,targetDate);
      return Number.isFinite(a)&&Number.isFinite(b)?[[a,b]]:[];
    });
  }catch{return [];}
}

export const onRequestGet=async({request,env})=>{
  const u=new URL(request.url),service=SERVICES[u.searchParams.get('service')],date=u.searchParams.get('date');
  if(!service||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date||''))return json({error:'Servicio o fecha inválidos'},400);
  const day=new Date(date+'T12:00:00-06:00').getDay(),range=hours[day];
  if(!range)return json({slots:[],calendar:calendarId,calendarConnected:Boolean(env.GOOGLE_CALENDAR_ICS_URL)});
  const rows=env.DB?await env.DB.prepare("SELECT start_at,end_at FROM appointments WHERE date=? AND status IN ('pending_confirmation','pending','confirmed')").bind(date).all():{results:[]};
  const internal=(rows.results||[]).map(x=>[Number(x.start_at.slice(11,13))*60+Number(x.start_at.slice(14,16)),Number(x.end_at.slice(11,13))*60+Number(x.end_at.slice(14,16))]);
  const external=await googleBusy(env.GOOGLE_CALENDAR_ICS_URL,date),busy=[...internal,...external];
  const slots=[];
  for(let mins=range[0]*60;mins+service.minutes<=range[1]*60;mins+=service.minutes+10){
    const end=mins+service.minutes,overlaps=busy.some(([a,b])=>mins<b&&end>a);
    if(!overlaps)slots.push(String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0'));
  }
  return json({slots,calendar:calendarId,calendarConnected:Boolean(env.GOOGLE_CALENDAR_ICS_URL)});
};
