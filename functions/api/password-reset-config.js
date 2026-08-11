import {json} from '../_shared.js';

export const onRequestGet=async({env})=>{
  const publishableKey=String(env.SUPABASE_PUBLISHABLE_KEY||'').trim();
  if(!publishableKey)return json({error:'not_configured'},503);
  return json({publishableKey});
};
