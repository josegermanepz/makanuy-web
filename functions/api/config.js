import {json} from '../_shared.js';

export const onRequestGet=async({env})=>json({
  bookingEmail:'yunuen.preg@gmail.com',
  calendarConnected:Boolean(env.GOOGLE_AUTOMATION_URL&&env.GOOGLE_AUTOMATION_SECRET),
  turnstileSiteKey:env.TURNSTILE_SITE_KEY||'',
  paymentsEnabled:false
});
