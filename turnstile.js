(()=>{
  const forms=[...document.querySelectorAll('[data-api-form],#booking-form')];
  if(!forms.length)return;
  fetch('/api/config').then(response=>response.ok?response.json():{}).then(config=>{
    if(!config.turnstileSiteKey)return;
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;script.defer=true;
    script.onload=()=>forms.forEach(form=>{
      const mount=document.createElement('div');mount.className='cf-turnstile';
      form.querySelector('[type="submit"]')?.before(mount);
      form.dataset.turnstileWidget=String(window.turnstile.render(mount,{sitekey:config.turnstileSiteKey,theme:'light',language:'es'}));
    });
    document.head.append(script);
  }).catch(()=>{});
})();
