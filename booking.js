(() => {
  const stages = [...document.querySelectorAll('[data-booking-stage]')];
  const steps = [...document.querySelectorAll('.booking-step')];
  const alert = document.querySelector('#booking-alert');
  const services = [
    { id: 'bienestar', slug: 'consulta-bienestar-composición-corporal', name: 'Bienestar/Composición Corporal', minutes: 60, price: 850, location: 'Presencial' },
    { id: 'hormonal', slug: 'consulta-de-nutrición-hormonal', name: 'Nutrición Hormonal', minutes: 60, price: 850, location: 'Presencial' },
    { id: 'embarazo', slug: 'consulta-de-embarazo', name: 'Nutrición en Embarazo', minutes: 60, price: 850, location: 'Presencial' },
    { id: 'climaterio', slug: 'consulta-para-el-climaterio-y-menopausia', name: 'Climaterio y Menopausia', minutes: 60, price: 850, location: 'Presencial' },
    { id: 'inmune', slug: 'consulta-de-nutrición-y-sistema-inmune', name: 'Nutrición y Bienestar Inmunológico', minutes: 60, price: 850, location: 'Presencial' },
    { id: 'tanita', slug: 'tanita-bioempedancia', name: 'Bioimpedancia Tanita', minutes: 30, price: 300, location: 'Presencial' },
    { id: 'online', slug: 'consulta-online-1', name: 'Consulta Online', minutes: 60, price: 800, location: 'Online' }
  ];
  const state = { service: null, date: null, time: null };
  const track = (event, data = {}) => document.dispatchEvent(new CustomEvent('makanuy:track', { detail: { event, data } }));

  const show = name => {
    stages.forEach(stage => { stage.hidden = stage.dataset.bookingStage !== name; });
    const index = { service: 0, date: 1, details: 2, complete: 3 }[name];
    steps.forEach((step, stepIndex) => {
      step.classList.toggle('active', stepIndex <= index);
      if (stepIndex === index) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    document.querySelector(`[data-booking-stage="${name}"] h2`)?.focus({ preventScroll: true });
    window.scrollTo({ top: 90, behavior: 'smooth' });
  };
  const message = (text, bad = false) => {
    alert.textContent = text;
    alert.className = 'form-status ' + (bad ? 'error' : '');
  };
  const localDate = value => new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City'
  }).format(new Date(`${value}T12:00:00-06:00`));
  const isoDate = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  const today = () => isoDate(new Date());

  document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-service]').forEach(item => item.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true');
    state.service = services.find(item => item.id === button.dataset.service);
    document.querySelector('[data-next="date"]').disabled = false;
    message('Servicio seleccionado: ' + state.service.name);
    track('booking_service', { service_id: state.service.id });
  }));

  document.querySelector('[data-next="date"]')?.addEventListener('click', () => show('date'));
  document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => show(button.dataset.back)));

  const date = document.querySelector('#booking-date');
  const slots = document.querySelector('#slot-grid');
  const next = document.querySelector('[data-next="details"]');
  const findNext = document.querySelector('[data-find-next]');
  if (date) {
    date.min = today();
    const max = new Date();
    max.setMonth(max.getMonth() + 4);
    date.max = isoDate(max);
  }

  const loadSlots = async selectedDate => {
    state.date = selectedDate;
    state.time = null;
    next.disabled = true;
    slots.innerHTML = '<span class="loading-inline">Consultando el calendario de Yunuen…</span>';
    const response = await fetch('/api/availability?service=' + encodeURIComponent(state.service.id) + '&date=' + encodeURIComponent(selectedDate));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No fue posible consultar horarios');
    slots.innerHTML = data.slots.length
      ? data.slots.map(time => `<button class="slot" type="button" data-time="${time}" aria-pressed="false">${time}</button>`).join('')
      : '<p class="empty-state">No hay horarios disponibles en esta fecha. Prueba otro día.</p>';
    slots.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => {
      slots.querySelectorAll('[data-time]').forEach(item => item.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      state.time = button.dataset.time;
      next.disabled = false;
      message(`Elegiste ${localDate(state.date)} a las ${state.time} h.`);
      track('booking_slot', { service_id: state.service.id, date: state.date });
    }));
    track('booking_date', { service_id: state.service.id, date: selectedDate, status: data.slots.length ? 'available' : 'empty' });
    return data.slots;
  };

  date?.addEventListener('change', async () => {
    try {
      await loadSlots(date.value);
    } catch (error) {
      slots.innerHTML = `<span class="error">${error.message}</span>`;
    }
  });

  findNext?.addEventListener('click', async () => {
    if (!state.service) return;
    findNext.disabled = true;
    findNext.textContent = 'Buscando…';
    const start = new Date();
    try {
      for (let offset = 0; offset < 21; offset += 1) {
        const candidate = new Date(start);
        candidate.setDate(start.getDate() + offset);
        const value = isoDate(candidate);
        date.value = value;
        const available = await loadSlots(value);
        if (available.length) {
          message(`Primer día disponible: ${localDate(value)}.`);
          return;
        }
      }
      message('No encontramos horarios en los próximos 21 días. Puedes probar una fecha posterior o escribirnos por WhatsApp.', true);
    } catch (error) {
      message(error.message, true);
    } finally {
      findNext.disabled = false;
      findNext.textContent = 'Buscar el próximo horario';
    }
  });

  next?.addEventListener('click', () => {
    const chosen = document.querySelector('#chosen-booking');
    if (chosen) chosen.textContent = `${state.service.name} · ${localDate(state.date)} · ${state.time} h (${state.service.location})`;
    show('details');
  });

  document.querySelector('#booking-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!state.service || !state.date || !state.time) return message('Selecciona servicio, fecha y horario.', true);
    const submit = event.currentTarget.querySelector('[type="submit"]');
    submit.disabled = true;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    fields.turnstileToken = window.turnstile?.getResponse() || '';
    message('Guardando tu solicitud…');
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...fields, serviceId: state.service.id, date: state.date, time: state.time })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No fue posible guardar la solicitud');
      document.querySelector('#booking-summary').innerHTML = `<strong>${state.service.name}</strong><br>${localDate(state.date)} · ${state.time} h<br>${state.service.location} · $${state.service.price} MXN`;
      document.querySelector('#booking-success').textContent = `Folio ${data.folio}. ${data.notificationSent ? 'Enviamos los datos y las políticas a tu correo.' : 'Conserva este folio; Makanuy te contactará para confirmar.'}`;
      show('complete');
      track('booking_success', { service_id: state.service.id, status: data.calendarConnected ? 'calendar_connected' : 'saved' });
    } catch (error) {
      message(error.message, true);
      track('booking_error', { service_id: state.service?.id || '', status: String(error.message).slice(0, 80) });
      window.turnstile?.reset();
      submit.disabled = false;
    }
  });

  const requested = decodeURIComponent(new URLSearchParams(location.search).get('servicio') || '');
  if (requested) {
    const item = services.find(service => service.slug === requested || service.id === requested);
    document.querySelector(`[data-service="${item?.id || ''}"]`)?.click();
  }
})();
