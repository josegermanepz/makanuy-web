(() => {
  const form=document.querySelector('#analytics-login'),status=form?.querySelector('.form-status'),results=document.querySelector('#analytics-results');
  const value=(rows,event)=>Number(rows.find(row=>row.event===event)?.count||0);
  const list=(target,rows,label,key)=>{target.innerHTML=rows.length?`<ol>${rows.map(row=>`<li><strong>${String(row[label]||'Sin dato').replace(/[&<>]/g,'')}</strong> — ${Number(row[key]||0)}</li>`).join('')}</ol>`:'<p>Aún no hay datos en este periodo.</p>'};
  form?.addEventListener('submit',async event=>{
    event.preventDefault();status.textContent='Consultando…';results.hidden=true;
    try{
      const response=await fetch(`/api/analytics-summary?days=${encodeURIComponent(document.querySelector('#analytics-days').value)}`,{headers:{authorization:`Bearer ${document.querySelector('#analytics-token').value}`}});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'No fue posible consultar');
      document.querySelector('#metric-views').textContent=value(data.totals,'page_view').toLocaleString('es-MX');
      document.querySelector('#metric-agenda').textContent=value(data.totals,'click_agenda').toLocaleString('es-MX');
      document.querySelector('#metric-bookings').textContent=value(data.totals,'booking_success').toLocaleString('es-MX');
      list(document.querySelector('#analytics-pages'),data.pages,'path','views');list(document.querySelector('#analytics-services'),data.services,'service','count');
      document.querySelector('#analytics-generated').textContent=`Actualizado ${new Date(data.generatedAt).toLocaleString('es-MX')}.`;
      status.textContent='';results.hidden=false;
    }catch(error){status.textContent=error.message;status.className='form-status error'}
  });
})();
