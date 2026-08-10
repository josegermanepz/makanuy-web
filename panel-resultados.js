(() => {
  const form = document.querySelector('#analytics-login');
  const status = form?.querySelector('.form-status');
  const results = document.querySelector('#analytics-results');
  const number = value => Number(value || 0);
  const value = (rows, event) => number(rows.find(row => row.event === event)?.count);
  const format = value => number(value).toLocaleString('es-MX');
  const safe = value => String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const list = (target, rows, label, key) => {
    target.innerHTML = rows.length
      ? `<ol>${rows.map(row => `<li><strong>${safe(row[label] || 'Sin dato')}</strong> — ${format(row[key])}</li>`).join('')}</ol>`
      : '<p>Aún no hay datos en este periodo.</p>';
  };

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = 'Consultando…';
    status.className = 'form-status';
    results.hidden = true;
    try {
      const days = document.querySelector('#analytics-days').value;
      const token = document.querySelector('#analytics-token').value;
      const response = await fetch(`/api/analytics-summary?days=${encodeURIComponent(days)}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No fue posible consultar los resultados.');

      const views = value(data.totals, 'page_view');
      const agenda = value(data.totals, 'click_agenda');
      const bookings = value(data.totals, 'booking_success');
      const forms = value(data.totals, 'form_success');
      const waitlist = value(data.totals, 'waitlist_success');
      const errors = value(data.totals, 'form_error') + value(data.totals, 'booking_error') + value(data.totals, 'waitlist_error');

      document.querySelector('#metric-views').textContent = format(views);
      document.querySelector('#metric-agenda').textContent = format(agenda);
      document.querySelector('#metric-bookings').textContent = format(bookings);
      document.querySelector('#metric-conversion').textContent = `${agenda ? Math.round((bookings / agenda) * 100) : 0}%`;
      document.querySelector('#metric-forms').textContent = format(forms);
      document.querySelector('#metric-waitlist').textContent = format(waitlist);
      document.querySelector('#metric-errors').textContent = format(errors);

      list(document.querySelector('#analytics-pages'), data.pages, 'path', 'views');
      list(document.querySelector('#analytics-services'), data.services, 'service', 'count');
      document.querySelector('#analytics-daily').innerHTML = (data.daily || []).length
        ? data.daily.map(row => `<tr><td>${safe(row.day)}</td><td>${format(row.views)}</td><td>${format(row.agenda_clicks)}</td><td>${format(row.bookings)}</td><td>${format(row.forms)}</td><td>${format(row.errors)}</td></tr>`).join('')
        : '<tr><td colspan="6">Aún no hay actividad en este periodo.</td></tr>';
      document.querySelector('#analytics-generated').textContent = `Actualizado ${new Date(data.generatedAt).toLocaleString('es-MX')}. Los eventos se conservan durante 90 días.`;
      status.textContent = '';
      results.hidden = false;
    } catch (error) {
      status.textContent = error.message;
      status.className = 'form-status error';
    }
  });
})();
