export const SERVICES={"bienestar":{"id":"bienestar","slug":"consulta-bienestar-composición-corporal","name":"Consulta Bienestar/Composición Corporal","minutes":60,"price":850,"location":"presencial"},"hormonal":{"id":"hormonal","slug":"consulta-de-nutrición-hormonal","name":"Consulta de Nutrición Hormonal","minutes":60,"price":850,"location":"presencial"},"embarazo":{"id":"embarazo","slug":"consulta-de-embarazo","name":"Consulta de Embarazo","minutes":60,"price":850,"location":"presencial"},"climaterio":{"id":"climaterio","slug":"consulta-para-el-climaterio-y-menopausia","name":"Consulta para el Climaterio y Menopausia","minutes":60,"price":850,"location":"presencial"},"inmune":{"id":"inmune","slug":"consulta-de-nutrición-y-sistema-inmune","name":"Consulta de Nutrición y Sistema Inmune","minutes":60,"price":850,"location":"presencial"},"tanita":{"id":"tanita","slug":"tanita-bioempedancia","name":"Tanita (Bioempedancia)","minutes":30,"price":300,"location":"presencial"},"online":{"id":"online","slug":"consulta-online-1","name":"Consulta Online","minutes":60,"price":800,"location":"online"}};
export const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store'}});
export const readJson=async request=>{try{return await request.json()}catch{return null}};
export const clean=(value,max=500)=>String(value??'').trim().slice(0,max);
export const escapeHtml=value=>clean(value,5000).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const folio=(prefix='MK')=>prefix+'-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+crypto.randomUUID().slice(0,8).toUpperCase();
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
