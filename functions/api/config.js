import {json} from '../_shared.js';

export const onRequestGet=async({env})=>json({
  bookingEmail:'yunuen.preg@gmail.com',
  calendarConnected:Boolean(env.GOOGLE_CALENDAR_ICS_URL),
  paymentsEnabled:false
});
