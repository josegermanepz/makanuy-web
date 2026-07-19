import{json}from'../_shared.js';export const onRequestGet=async({env})=>json({publicKey:env.MP_PUBLIC_KEY||''});
