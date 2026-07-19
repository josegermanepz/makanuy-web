import {json} from '../_shared.js';

// Payments are intentionally disabled. Appointments are requested and confirmed
// without processing a charge on this website.
export const onRequestPost=async()=>json({error:'Los pagos no están disponibles en este sitio.'},410);
