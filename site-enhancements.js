(()=>{
  const menu=document.querySelector('.menu-toggle');
  const nav=document.querySelector('#menu');
  menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Cerrar':'Menú'});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false');if(menu)menu.textContent='Menú'}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menú';menu.focus()}});
  const path=location.pathname.replace(/index\.html$/,'');
  nav?.querySelectorAll('a[href]').forEach(a=>{const href=new URL(a.href,location.href).pathname.replace(/index\.html$/,'');if(href===path)a.setAttribute('aria-current','page')});
  document.querySelectorAll('a[href*="instagram.com/makanuyconsultas"]').forEach(a=>a.href='https://www.instagram.com/yunfig/');
  if(!document.querySelector('.floating-wa')){
    const wa=document.createElement('a');wa.className='floating-wa';wa.href='https://wa.me/525585770856?text=Hola%2C%20conoc%C3%AD%20Makanuy%20en%20su%20p%C3%A1gina.%20Me%20gustar%C3%ADa%20recibir%20orientaci%C3%B3n.';wa.target='_blank';wa.rel='noopener';wa.setAttribute('aria-label','Escribir a Makanuy por WhatsApp');wa.dataset.track='click_whatsapp';wa.innerHTML='<b aria-hidden="true">WA</b><span>WhatsApp</span>';document.body.append(wa)
  }
  window.dataLayer=window.dataLayer||[];
  document.addEventListener('click',e=>{const link=e.target.closest('[data-track],a[href*="agendar"],a[href*="wa.me"]');if(!link)return;window.dataLayer.push({event:link.dataset.track||(/wa\.me/.test(link.href)?'click_whatsapp':'click_agenda'),page_path:location.pathname,link_url:link.href})});
  document.querySelectorAll('form').forEach(form=>{let started=false;form.addEventListener('input',()=>{if(!started){started=true;window.dataLayer.push({event:'form_start',form_id:form.id||form.dataset.form||'form',page_path:location.pathname})}},{once:false})});
})();
