import {json,readJson,clean,rateLimit} from '../_shared.js';

const authorized=(request,env)=>{
  const expected=clean(env.CONTENT_ADMIN_TOKEN,240);
  const provided=clean(request.headers.get('authorization'),260).replace(/^Bearer\s+/i,'');
  return Boolean(expected&&provided&&provided===expected);
};
const slugify=value=>clean(value,100).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
const parseLines=value=>clean(value,8000).split(/\r?\n/).map(item=>clean(item,300)).filter(Boolean).slice(0,30);
const ensureTable=env=>env.DB.prepare("CREATE TABLE IF NOT EXISTS recipes (id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,title TEXT NOT NULL,summary TEXT NOT NULL,ingredients TEXT NOT NULL,steps TEXT NOT NULL,tags TEXT NOT NULL,image_url TEXT,status TEXT NOT NULL DEFAULT 'published',created_at TEXT NOT NULL,updated_at TEXT NOT NULL)").run();
const recipeFields=body=>{
  const title=clean(body?.title,160),summary=clean(body?.summary,500),slug=slugify(body?.slug||title),ingredients=parseLines(body?.ingredients),steps=parseLines(body?.steps),tags=clean(body?.tags,300).split(',').map(tag=>clean(tag,40)).filter(Boolean).slice(0,8),image=clean(body?.imageUrl,240)||'/hero-collage.avif';
  if(!title||!summary||!slug||ingredients.length<2||steps.length<2)return {error:'Completa título, resumen, al menos dos ingredientes y dos pasos.'};
  if(!image.startsWith('/'))return {error:'La imagen debe ser una ruta local que comience con /.'};
  return {title,summary,slug,ingredients,steps,tags,image};
};
const serialize=recipe=>({...recipe,ingredients:JSON.parse(recipe.ingredients),steps:JSON.parse(recipe.steps),tags:JSON.parse(recipe.tags)});

export const onRequestGet=async({request,env})=>{
  if(!env.DB)return json({recipes:[]});
  const url=new URL(request.url),slug=slugify(url.searchParams.get('slug')||'');
  try{
    await ensureTable(env);
    if(authorized(request,env)){
      const throttle=await rateLimit(env,request,'recipe-admin-read',40,300);if(!throttle.ok)return json({error:'Demasiados intentos.'},429);
      const rows=await env.DB.prepare("SELECT slug,title,summary,ingredients,steps,tags,image_url,status,created_at,updated_at FROM recipes ORDER BY updated_at DESC LIMIT 100").all();
      return json({recipes:(rows.results||[]).map(serialize)});
    }
    if(slug){const recipe=await env.DB.prepare("SELECT slug,title,summary,ingredients,steps,tags,image_url,created_at FROM recipes WHERE slug=? AND status='published'").bind(slug).first();return recipe?json({recipe:serialize(recipe)}):json({error:'Receta no encontrada.'},404)}
    const rows=await env.DB.prepare("SELECT slug,title,summary,tags,image_url,created_at FROM recipes WHERE status='published' ORDER BY created_at DESC LIMIT 60").all();
    return json({recipes:(rows.results||[]).map(item=>({...item,tags:JSON.parse(item.tags)}))});
  }catch{return json({recipes:[]})}
};

export const onRequestPost=async({request,env})=>{
  if(!env.DB)return json({error:'Editor no disponible.'},503);
  const throttle=await rateLimit(env,request,'recipe-admin',20,600);if(!throttle.ok)return json({error:'Demasiados intentos.'},429);
  if(!authorized(request,env))return json({error:'Acceso no autorizado.'},401);
  const body=await readJson(request),fields=recipeFields(body);if(fields.error)return json({error:fields.error},400);
  const {title,summary,slug,ingredients,steps,tags,image}=fields;
  try{
    await ensureTable(env);
    await env.DB.prepare("INSERT INTO recipes(id,slug,title,summary,ingredients,steps,tags,image_url,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'published',datetime('now'),datetime('now'))").bind(crypto.randomUUID(),slug,title,summary,JSON.stringify(ingredients),JSON.stringify(steps),JSON.stringify(tags),image).run();
    return json({ok:true,slug,url:`/receta/?slug=${encodeURIComponent(slug)}`},201);
  }catch(error){return json({error:String(error).includes('UNIQUE')?'Ya existe una receta con ese nombre o dirección.':'No fue posible publicar la receta.'},400)}
};

export const onRequestPut=async({request,env})=>{
  if(!env.DB)return json({error:'Editor no disponible.'},503);
  const throttle=await rateLimit(env,request,'recipe-admin',20,600);if(!throttle.ok)return json({error:'Demasiados intentos.'},429);
  if(!authorized(request,env))return json({error:'Acceso no autorizado.'},401);
  const body=await readJson(request),current=slugify(body?.currentSlug||''),fields=recipeFields(body);if(fields.error)return json({error:fields.error},400);
  if(!current)return json({error:'No se indicó la receta que deseas actualizar.'},400);
  const {title,summary,slug,ingredients,steps,tags,image}=fields;
  try{
    await ensureTable(env);
    const result=await env.DB.prepare("UPDATE recipes SET slug=?,title=?,summary=?,ingredients=?,steps=?,tags=?,image_url=?,status='published',updated_at=datetime('now') WHERE slug=?").bind(slug,title,summary,JSON.stringify(ingredients),JSON.stringify(steps),JSON.stringify(tags),image,current).run();
    if(!result.meta?.changes)return json({error:'No encontramos esa receta.'},404);
    return json({ok:true,slug,url:`/receta/?slug=${encodeURIComponent(slug)}`});
  }catch(error){return json({error:String(error).includes('UNIQUE')?'Ya existe una receta con ese nombre o dirección.':'No fue posible actualizar la receta.'},400)}
};

export const onRequestDelete=async({request,env})=>{
  if(!env.DB)return json({error:'Editor no disponible.'},503);
  const throttle=await rateLimit(env,request,'recipe-admin',20,600);if(!throttle.ok)return json({error:'Demasiados intentos.'},429);
  if(!authorized(request,env))return json({error:'Acceso no autorizado.'},401);
  const slug=slugify(new URL(request.url).searchParams.get('slug')||'');if(!slug)return json({error:'Receta inválida.'},400);
  try{
    await ensureTable(env);
    const result=await env.DB.prepare("UPDATE recipes SET status='archived',updated_at=datetime('now') WHERE slug=?").bind(slug).run();
    return result.meta?.changes?json({ok:true,message:'La receta dejó de estar publicada.'}):json({error:'No encontramos esa receta.'},404);
  }catch{return json({error:'No fue posible retirar la receta.'},400)}
};
