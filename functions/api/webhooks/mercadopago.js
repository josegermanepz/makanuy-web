import {json} from '../../_shared.js';

// Kept as a harmless tombstone so any old webhook receives a definitive response.
export const onRequestPost=async()=>json({disabled:true},410);
