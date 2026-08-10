import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=path.resolve(import.meta.dirname,'..');
const files=fs.readdirSync(root).filter(file=>file.endsWith('.html'));
const errors=[];
const navs=new Map();

for(const file of files){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  const duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index);
  if(duplicates.length)errors.push(`${file}: ids duplicados ${[...new Set(duplicates)].join(', ')}`);
  if(!['404.html'].includes(file)){
    const h1=(source.match(/<h1\b/gi)||[]).length;
    if(h1!==1)errors.push(`${file}: contiene ${h1} elementos h1`);
  }
  if(/static\.wixstatic\.com|wix\.com/i.test(source))errors.push(`${file}: conserva una dependencia de Wix`);
  if(/mercadopago|mercado pago/i.test(source))errors.push(`${file}: muestra una referencia de pago`);
  if(/href="\/[^"]+\.html(?:[?#][^"]*)?"/i.test(source))errors.push(`${file}: conserva enlaces internos con extensión .html`);
  if(/Makanuy confirmará el horario después de recibir tu solicitud|genera una solicitud con folio|horario queda confirmado cuando/i.test(source))errors.push(`${file}: conserva textos de la agenda anterior`);
  if(!source.includes('class="skip"'))errors.push(`${file}: no incluye enlace para saltar al contenido`);
  const description=source.match(/<meta name="description" content="([^"]*)"/i)?.[1];
  if(description&&description.length>165)errors.push(`${file}: la descripción SEO supera 165 caracteres`);
  const nav=source.match(/<nav id="menu"[\s\S]*?<\/nav>/i)?.[0];
  if(nav)navs.set(file,nav);
  for(const match of source.matchAll(/(?:src|href)="(\/[^"]+)"/g)){
    const raw=match[1].split(/[?#]/)[0];
    if(!raw||raw==='/'||raw.startsWith('/api/')||raw.endsWith('/'))continue;
    const local=path.join(root,raw.slice(1));
    if(!fs.existsSync(local))errors.push(`${file}: no existe ${raw}`);
  }
}

const reference=navs.get('index.html');
for(const [file,nav] of navs)if(nav!==reference)errors.push(`${file}: el menú superior difiere del inicio`);

const schedule=fs.readFileSync(path.join(root,'functions/_schedule.js'),'utf8');
if(!schedule.includes("CALENDAR_ID='yunuen.preg@gmail.com'"))errors.push('agenda: no fija el calendario exclusivo de Yunuen');
if(/GOOGLE_CALENDAR_ICS_URL/.test(schedule))errors.push('agenda: todavía depende del calendario público ICS');
if(/service\.minutes\s*\+\s*10/.test(schedule))errors.push('agenda: todavía agrega un margen automático de 10 minutos');
if(!schedule.includes("action:'availability'"))errors.push('agenda: no consulta disponibilidad mediante la automatización privada');
const bookingPage=fs.readFileSync(path.join(root,'agendar.html'),'utf8');
for(const field of ['name','email','phone'])if(!new RegExp(`<input[^>]*required[^>]*name="${field}"|<input[^>]*name="${field}"[^>]*required`).test(bookingPage))errors.push(`agenda: el campo ${field} no es obligatorio`);
const bookingApi=fs.readFileSync(path.join(root,'functions/api/bookings.js'),'utf8');
const bookingScript=fs.readFileSync(path.join(root,'booking.js'),'utf8');
if(/name=["']modality["']/.test(bookingScript)||/name=["']modality["']/.test(bookingPage))errors.push('agenda: todavía solicita una modalidad separada del servicio');
if(!bookingApi.includes("patient.split(/\\s+/).filter(Boolean).length<2"))errors.push('agenda: el servidor no exige nombre completo');
if(!bookingApi.includes("phoneDigits.length<10||phoneDigits.length>15"))errors.push('agenda: el servidor no valida el teléfono');
if(!bookingApi.includes("const isOnline=service.location==='online'"))errors.push('agenda: el servidor no deriva la modalidad del servicio');
if(!bookingApi.includes("meetLink:isOnline?"))errors.push('agenda: la respuesta no limita Google Meet a la consulta online');
const redirects=fs.readFileSync(path.join(root,'_redirects'),'utf8');
for(const route of ['/recetarios /recetas/ 301','/receta/ /receta.html 200','/panel-contenido/ /panel-contenido.html 200','/panel-resultados/ /panel-resultados.html 200'])if(!redirects.includes(route))errors.push(`rutas: falta ${route}`);
const recipeApi=fs.readFileSync(path.join(root,'functions/api/recipes.js'),'utf8');
if(!recipeApi.includes('onRequestPut')||!recipeApi.includes('onRequestDelete'))errors.push('recetarios: el panel no permite editar y retirar publicaciones');

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Validación aprobada: ${files.length} páginas, sin dependencias de Wix ni referencias de pago, sin ids duplicados, recursos locales faltantes o variaciones del menú; calendario exclusivo de Yunuen, modalidad derivada del servicio y sin margen automático.`);
