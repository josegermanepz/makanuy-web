(()=>{
  if(!document.querySelector('link[href^="/v6.css"]')){
    const styles=document.createElement('link');styles.rel='stylesheet';styles.href='/v6.css?v=20260809b';document.head.append(styles)
  }
  const menu=document.querySelector('.menu-toggle');
  const nav=document.querySelector('#menu');
  const closeMenu=(returnFocus=false)=>{nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Abrir menú principal');if(menu)menu.textContent='Menú';if(returnFocus)menu?.focus()};
  menu?.setAttribute('aria-label','Abrir menú principal');
  menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú principal':'Abrir menú principal');menu.textContent=open?'Cerrar':'Menú';if(open)nav.querySelector('a')?.focus()});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));
  document.addEventListener('click',event=>{if(nav?.classList.contains('open')&&!event.target.closest('.site-header'))closeMenu()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open'))closeMenu(true)});
  const normalize=value=>value.replace(/index\.html$/,'').replace(/\.html$/,'').replace(/\/$/,'')||'/';
  const path=normalize(location.pathname);
  nav?.querySelectorAll('a[href]').forEach(a=>{const href=normalize(new URL(a.href,location.href).pathname);if(href===path)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  document.querySelectorAll('a[href*="instagram.com/makanuyconsultas"]').forEach(a=>a.href='https://www.instagram.com/yunfig/');
  if(!document.querySelector('.floating-wa')){
    const wa=document.createElement('a');wa.className='floating-wa';wa.href='https://wa.me/525585770856?text=Hola%2C%20conoc%C3%AD%20Makanuy%20en%20su%20p%C3%A1gina.%20Me%20gustar%C3%ADa%20recibir%20orientaci%C3%B3n.';wa.target='_blank';wa.rel='noopener';wa.setAttribute('aria-label','Escribir a Makanuy por WhatsApp');wa.dataset.track='click_whatsapp';wa.innerHTML='<b aria-hidden="true">WA</b><span>WhatsApp</span>';document.body.append(wa)
  }
  if(!document.querySelector('.mobile-booking-bar')&&!/\/agendar(?:\.html)?\/?$/.test(location.pathname)){
    const agenda=document.createElement('a');agenda.className='mobile-booking-bar';agenda.href='/agendar/';agenda.dataset.track='click_agenda';agenda.textContent='Agendar consulta';document.body.append(agenda)
  }
})();
