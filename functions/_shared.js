export const SERVICES={"bienestar":{"id":"bienestar","slug":"consulta-bienestar-composición-corporal","name":"Consulta Bienestar/Composición Corporal","minutes":60,"price":850,"location":"presencial"},"hormonal":{"id":"hormonal","slug":"consulta-de-nutrición-hormonal","name":"Consulta de Nutrición Hormonal","minutes":60,"price":850,"location":"presencial"},"embarazo":{"id":"embarazo","slug":"consulta-de-embarazo","name":"Consulta de Embarazo","minutes":60,"price":850,"location":"presencial"},"climaterio":{"id":"climaterio","slug":"consulta-para-el-climaterio-y-menopausia","name":"Consulta para el Climaterio y Menopausia","minutes":60,"price":850,"location":"presencial"},"inmune":{"id":"inmune","slug":"consulta-de-nutrición-y-sistema-inmune","name":"Consulta de Nutrición y Sistema Inmune","minutes":60,"price":850,"location":"presencial"},"tanita":{"id":"tanita","slug":"tanita-bioempedancia","name":"Tanita (Bioempedancia)","minutes":30,"price":300,"location":"presencial"},"online":{"id":"online","slug":"consulta-online-1","name":"Consulta Online","minutes":60,"price":800,"location":"online"}};
export const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store'}});
export const readJson=async request=>{try{return await request.json()}catch{return null}};
export const clean=(value,max=500)=>String(value??'').trim().slice(0,max);
export const escapeHtml=value=>clean(value,5000).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const CONSULTATION_POLICIES_HTML='<h2>Políticas de consulta</h2><ul><li>Las cancelaciones o reprogramaciones deben solicitarse al menos 24 horas antes.</li><li>La sesión contempla 10 minutos de tolerancia.</li><li>Si tu cita incluye una medición de composición corporal, sigue las indicaciones de ayuno que recibas y llega con al menos 30 minutos sin tomar líquidos.</li></ul><p>Si necesitas ayuda, responde a este correo o comunícate con Makanuy.</p>';
export const folio=(prefix='MK')=>prefix+'-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+crypto.randomUUID().slice(0,8).toUpperCase();
const sha256=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function rateLimit(env,request,scope,limit=6,windowSeconds=600){
  if(!env.DB)return {ok:true};
  const ip=request.headers.get('CF-Connecting-IP')||'unknown',bucket=Math.floor(Date.now()/(windowSeconds*1000));
  const key=await sha256(`${scope}:${ip}:${bucket}`);
  try{
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL)').run();
    const row=await env.DB.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,(bucket+1)*windowSeconds).first();
    if(Math.random()<0.02)await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(Math.floor(Date.now()/1000)).run();
    return {ok:Number(row?.count||1)<=limit,retryAfter:(bucket+1)*windowSeconds-Math.floor(Date.now()/1000)};
  }catch{return {ok:true}}
}
export async function verifyTurnstile(env,request,token){
  if(!env.TURNSTILE_SECRET_KEY)return true;
  if(!clean(token,2048))return false;
  try{
    const body=new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:clean(token,2048),remoteip:request.headers.get('CF-Connecting-IP')||''});
    const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body});
    const result=await response.json();
    return Boolean(result.success);
  }catch{return false}
}
export async function googleAutomation(env,payload){
  if(!env.GOOGLE_AUTOMATION_URL||!env.GOOGLE_AUTOMATION_SECRET)return {skipped:true};
  try{
    const response=await fetch(env.GOOGLE_AUTOMATION_URL,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},body:JSON.stringify({...payload,secret:env.GOOGLE_AUTOMATION_SECRET})});
    const data=await response.json();
    return {ok:response.ok&&data.ok,...data};
  }catch{return {ok:false}}
}
export async function sendEmail(env,{to,subject,html}){
  if(!env.RESEND_API_KEY)return googleAutomation(env,{action:'email',to:Array.isArray(to)?to:[to],subject,html});
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM||'Makanuy <reservas@makanuyconsultas.com>',to:Array.isArray(to)?to:[to],subject,html})});
  return {ok:response.ok,status:response.status};
}
