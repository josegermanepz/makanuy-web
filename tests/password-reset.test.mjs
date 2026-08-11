import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root=new URL('../',import.meta.url);
const read=(file)=>readFile(new URL(file,root),'utf8');

test('recovery route uses the Makanuy secure flow',async()=>{
  const [html,script,config,redirects]=await Promise.all([
    read('restablecer-contrasena.html'),
    read('password-reset.js'),
    read('functions/api/password-reset-config.js'),
    read('_redirects')
  ]);
  assert.match(html,/Crea una nueva contraseña/);
  assert.match(html,/noindex,nofollow,noarchive/);
  assert.match(script,/window\.location\.hash/);
  assert.match(script,/window\.history\.replaceState/);
  assert.match(script,/type !== 'recovery'/);
  assert.match(script,/method: 'PUT'/);
  assert.match(script,/\/api\/password-reset-config/);
  assert.doesNotMatch(script,/service.role|SERVICE_ROLE/i);
  assert.doesNotMatch(script,/sb_publishable_[A-Za-z0-9_-]+/);
  assert.match(config,/env\.SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(config,/sb_publishable_[A-Za-z0-9_-]+/);
  assert.match(redirects,/\/restablecer-contrasena\/ \/restablecer-contrasena\.html 200/);
});

test('recovery route receives strict response headers',async()=>{
  const headers=await read('_headers');
  const block=headers.split('/restablecer-contrasena*')[1].split('\n\n')[0];
  assert.match(block,/Cache-Control: no-store/);
  assert.match(block,/X-Frame-Options: DENY/);
  assert.match(block,/Referrer-Policy: no-referrer/);
  assert.match(block,/frame-ancestors 'none'/);
  assert.match(block,/object-src 'none'/);
  assert.match(block,/connect-src 'self' https:\/\/bxjuhvshpmaivbavdwqp\.supabase\.co/);
});
