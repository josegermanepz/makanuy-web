document.querySelectorAll('[data-api-form]').forEach(form => form.addEventListener('submit', async event => {
  event.preventDefault();
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('[type="submit"]');
  const formId = form.id || form.dataset.apiForm || 'form';
  status.textContent = 'Enviando…';
  status.className = 'form-status';
  submit.disabled = true;
  try {
    const data = Object.fromEntries(new FormData(form));
    data.turnstileToken = window.turnstile?.getResponse(form.dataset.turnstileWidget) || '';
    const response = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    });
    const output = await response.json();
    if (!response.ok) throw new Error(output.error || 'No se pudo enviar');
    form.reset();
    window.turnstile?.reset(form.dataset.turnstileWidget);
    status.textContent = 'Gracias. Recibimos tu información con el folio ' + output.folio + '.';
    status.className = 'form-status success';
    document.dispatchEvent(new CustomEvent('makanuy:track', { detail: { event: 'form_success', data: { form_id: formId } } }));
  } catch (error) {
    status.textContent = error.message;
    status.className = 'form-status error';
    document.dispatchEvent(new CustomEvent('makanuy:track', { detail: { event: 'form_error', data: { form_id: formId } } }));
  } finally {
    submit.disabled = false;
  }
}));
