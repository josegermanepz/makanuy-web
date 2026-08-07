(() => {
  const form=document.querySelector('#recipe-admin'),status=form?.querySelector('.form-status'),success=document.querySelector('#recipe-admin-success');
  form?.addEventListener('submit',async event=>{
    event.preventDefault();const fields=Object.fromEntries(new FormData(form)),token=fields.token;delete fields.token;status.textContent='Publicando…';success.hidden=true;
    try{
      const response=await fetch('/api/recipes',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(fields)});const data=await response.json();if(!response.ok)throw new Error(data.error||'No fue posible publicar');
      status.textContent='';success.innerHTML=`<strong>Receta publicada.</strong><p><a href="${data.url}">Abrir la receta</a></p>`;success.hidden=false;form.reset();
    }catch(error){status.textContent=error.message;status.className='form-status error'}
  });
})();
