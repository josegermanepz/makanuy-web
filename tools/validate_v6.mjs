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

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Validación aprobada: ${files.length} páginas, sin dependencias de Wix, pagos visibles, ids duplicados, recursos locales faltantes ni variaciones del menú.`);
