(()=>{
  const stages=[...document.querySelectorAll('[data-booking-stage]')];
  const steps=[...document.querySelectorAll('.booking-step')];
  const alert=document.querySelector('#booking-alert');
  const services=[
    {id:'bienestar',slug:'consulta-bienestar-composición-corporal',name:'Bienestar/Composición Corporal',minutes:60,price:850,location:'Presencial'},
    {id:'hormonal',slug:'consulta-de-nutrición-hormonal',name:'Nutrición Hormonal',minutes:60,price:850,location:'Presencial'},
    {id:'embarazo',slug:'consulta-de-embarazo',name:'Nutrición en Embarazo',minutes:60,price:850,location:'Presencial'},
    {id:'climaterio',slug:'consulta-para-el-climaterio-y-menopausia',name:'Climaterio y Menopausia',minutes:60,price:850,location:'Presencial'},
    {id:'inmune',slug:'consulta-de-nutrición-y-sistema-inmune',name:'Nutrición y Bienestar Inmunológico',minutes:60,price:850,location:'Presencial'},
    {id:'tanita',slug:'tanita-bioempedancia',name:'Bioimpedancia Tanita',minutes:30,price:300,location:'Presencial'},
    {id:'online',slug:'consulta-online-1',name:'Consulta Online',minutes:60,price:800,location:'Online'},
  ];
  const state={service:null,date:null,time:null};
  const show=name=>{stages.forEach(x=>x.hidden=x.dataset.bookingStage!==name);const index={service:0,date:1,details:2,payment:3,complete:3}[name];steps.forEach((x,i)=>x.classList.toggle('active',i<=index));window.scrollTo({top:90,behavior:'smooth'})};
  const message=(text,bad=false)=>{alert.textContent=text;alert.className='form-status '+(bad?'error':'')};
  document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-service]').forEach(x=>x.setAttribute('aria-pressed','false'));button.setAttribute('aria-pressed','true');state.service=services.find(x=>x.id===button.dataset.service);document.querySelector('[data-next="date"]').disabled=false;message('Servicio seleccionado: '+state.service.name)}));
  document.querySelector('[data-next="date"]')?.addEventListener('click',()=>show('date'));
  document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.back)));
  const date=document.querySelector('#booking-date'),slots=document.querySelector('#slot-grid'),next=document.querySelector('[data-next="details"]');
  const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
  if(date){date.min=today();const max=new Date();max.setMonth(max.getMonth()+4);date.max=[max.getFullYear(),String(max.getMonth()+1).padStart(2,'0'),String(max.getDate()).padStart(2,'0')].join('-')}
  date?.addEventListener('change',async()=>{state.date=date.value;state.time=null;next.disabled=true;slots.textContent='Consultando disponibilidad…';try{const response=await fetch('/api/availability?service='+encodeURIComponent(state.service.id)+'&date='+encodeURIComponent(state.date));const data=await response.json();if(!response.ok)throw new Error(data.error||'No fue posible consultar horarios');slots.innerHTML=data.slots.length?data.slots.map(time=>`<button class="slot" type="button" data-time="${time}" aria-pressed="false">${time}</button>`).join(''):'No hay horarios disponibles para esta fecha.';slots.querySelectorAll('[data-time]').forEach(button=>button.addEventListener('click',()=>{slots.querySelectorAll('[data-time]').forEach(x=>x.setAttribute('aria-pressed','false'));button.setAttribute('aria-pressed','true');state.time=button.dataset.time;next.disabled=false}))}catch(error){slots.innerHTML=`<span class="error">${error.message}</span>`}});
  next?.addEventListener('click',()=>show('details'));
  document.querySelector('#booking-form')?.addEventListener('submit',async event=>{event.preventDefault();if(!state.service||!state.date||!state.time)return message('Selecciona servicio, fecha y horario.',true);const submit=event.currentTarget.querySelector('[type="submit"]');submit.disabled=true;const fields=Object.fromEntries(new FormData(event.currentTarget));message('Guardando tu solicitud…');try{const response=await fetch('/api/bookings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...fields,serviceId:state.service.id,date:state.date,time:state.time})});const data=await response.json();if(!response.ok)throw new Error(data.error||'No fue posible guardar la solicitud');document.querySelector('#booking-summary').innerHTML=`<strong>${state.service.name}</strong><br>${state.date} · ${state.time}<br>${state.service.location} · $${state.service.price} MXN`;document.querySelector('#booking-success').textContent=`Folio ${data.folio}. Recibimos tu solicitud.${data.notificationSent?' Enviamos una copia a tu correo.':' Conserva este folio; Makanuy confirmará contigo el horario.'}`;show('complete');window.dataLayer?.push({event:'booking_request',service_id:state.service.id,booking_folio:data.folio})}catch(error){message(error.message,true);submit.disabled=false}});
  const requested=decodeURIComponent(new URLSearchParams(location.search).get('servicio')||'');
  if(requested){const item=services.find(x=>x.slug===requested||x.id===requested);document.querySelector(`[data-service="${item?.id||''}"]`)?.click()}
})();
