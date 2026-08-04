(() => {
  const endpoint = '/api/analytics';
  const sentForms = new WeakSet();

  const safeReferrer = () => {
    if (!document.referrer) return '';
    try {
      const url = new URL(document.referrer);
      return url.origin === location.origin ? 'internal' : url.hostname.slice(0, 120);
    } catch {
      return '';
    }
  };

  const send = (event, details = {}) => {
    const payload = JSON.stringify({
      event,
      path: location.pathname,
      referrer: safeReferrer(),
      details
    });
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, page_path: location.pathname, ...details });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch {
      // La medición nunca debe interferir con la navegación o los formularios.
    }
  };

  window.makanuyTrack = send;
  send('page_view', { title: document.title.slice(0, 120) });

  document.addEventListener('click', event => {
    const link = event.target.closest('a,button');
    if (!link) return;
    const href = link instanceof HTMLAnchorElement ? link.href : '';
    let name = link.dataset.track || '';
    if (!name && /\/agendar(?:\.html)?(?:[?#]|$)/.test(href)) name = 'click_agenda';
    if (!name && /wa\.me/.test(href)) name = 'click_whatsapp';
    if (!name && /instagram\.com/.test(href)) name = 'click_instagram';
    if (!name && /servicios/.test(href)) name = 'click_service';
    if (name) send(name, { label: (link.textContent || '').trim().slice(0, 80) });
  });

  document.addEventListener('input', event => {
    const form = event.target.closest('form');
    if (!form || sentForms.has(form)) return;
    sentForms.add(form);
    send('form_start', { form_id: form.id || form.dataset.apiForm || 'form' });
  });

  document.addEventListener('makanuy:track', event => {
    const detail = event.detail || {};
    if (detail.event) send(detail.event, detail.data || {});
  });
})();
