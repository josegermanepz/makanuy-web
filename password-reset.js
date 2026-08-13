import {readAllowedReturnTo} from './password-reset-return.js';

(() => {
  'use strict';

  const SUPABASE_URL = 'https://bxjuhvshpmaivbavdwqp.supabase.co';
  const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/;
  const root = document.querySelector('#recovery-root');
  const returnLink = document.querySelector('#return-to-app');
  const returnHelp = document.querySelector('#return-help');
  let accessToken = '';
  let publishableKey = '';

  function configureReturnToApp() {
    const returnTo = readAllowedReturnTo(window.location.search);
    if (!returnTo) {
      returnLink.hidden = true;
      returnLink.removeAttribute('href');
      returnHelp.hidden = false;
      return;
    }

    returnLink.href = returnTo;
    returnLink.hidden = false;
    returnLink.addEventListener('click', () => {
      returnHelp.hidden = false;
    });
  }

  function clearSensitiveUrl() {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }

  function clearSensitiveState() {
    accessToken = '';
    publishableKey = '';
    document.querySelectorAll('input[type="password"]').forEach((input) => { input.value = ''; });
  }

  function renderInvalid() {
    clearSensitiveState();
    root.innerHTML = '<div class="status-panel status-error" role="alert"><strong>Este enlace ya no puede utilizarse.</strong><span>Vuelve a Makanuy y solicita un solo correo nuevo.</span></div>';
  }

  function renderConfiguration() {
    clearSensitiveState();
    root.innerHTML = '<div class="status-panel status-error" role="alert"><strong>No pudimos preparar la recuperación.</strong><span>Inténtalo nuevamente en unos minutos.</span></div>';
  }

  function renderSuccess() {
    clearSensitiveState();
    root.innerHTML = '<div class="status-panel status-success" role="status"><span class="success-icon" aria-hidden="true">✓</span><strong>Contraseña actualizada</strong><span>Ya puedes cerrar esta página y entrar en Makanuy con tu nueva contraseña.</span></div>';
  }

  function renderForm() {
    root.innerHTML = `
      <form class="recovery-form" novalidate>
        <label><span>Nueva contraseña</span><input name="password" type="password" autocomplete="new-password" required minlength="12"></label>
        <p class="password-help">12 caracteres o más · mayúscula · minúscula · número</p>
        <label><span>Confirmar contraseña</span><input name="confirmation" type="password" autocomplete="new-password" required minlength="12"></label>
        <p class="form-message" role="alert" hidden></p>
        <button type="submit">Actualizar contraseña</button>
      </form>`;

    const form = root.querySelector('form');
    const password = form.elements.password;
    const confirmation = form.elements.confirmation;
    const message = form.querySelector('.form-message');
    const button = form.querySelector('button');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      message.hidden = true;
      message.textContent = '';

      if (!passwordRule.test(password.value)) {
        message.textContent = 'Usa 12 caracteres o más, con mayúscula, minúscula y número.';
        message.hidden = false;
        return;
      }

      if (password.value !== confirmation.value) {
        message.textContent = 'Las contraseñas no coinciden.';
        message.hidden = false;
        return;
      }

      if (!accessToken || !publishableKey) {
        renderInvalid();
        return;
      }

      button.disabled = true;
      button.textContent = 'Actualizando…';

      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          method: 'PUT',
          headers: {
            apikey: publishableKey,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: password.value }),
          cache: 'no-store'
        });

        if (!response.ok) {
          renderInvalid();
          return;
        }

        renderSuccess();
      } catch {
        button.disabled = false;
        button.textContent = 'Actualizar contraseña';
        message.textContent = 'No pudimos conectarnos. Revisa tu conexión e inténtalo otra vez.';
        message.hidden = false;
      }
    });
  }

  async function start() {
    configureReturnToApp();
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('access_token') || '';
    const refreshToken = params.get('refresh_token') || '';
    const type = params.get('type');
    const callbackError = params.has('error') || params.has('error_code');

    clearSensitiveUrl();

    if (callbackError || type !== 'recovery' || !token || !refreshToken) {
      renderInvalid();
      return;
    }

    try {
      const response = await fetch('/api/password-reset-config', {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      const config = await response.json();

      if (!response.ok || typeof config.publishableKey !== 'string' || !config.publishableKey) {
        renderConfiguration();
        return;
      }

      accessToken = token;
      publishableKey = config.publishableKey;
      renderForm();
    } catch {
      renderConfiguration();
    }
  }

  void start();
})();
