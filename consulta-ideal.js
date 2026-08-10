(() => {
  const root = document.querySelector('[data-consultation-quiz]');
  if (!root) return;
  const stages = [...root.querySelectorAll('[data-quiz-stage]')];
  const progress = root.querySelector('.quiz-progress span');
  const status = root.querySelector('#quiz-status');
  let goal = '';
  const recommendations = {
    bienestar: { title: 'Bienestar y composición corporal', copy: 'Una estrategia personalizada para trabajar hábitos, energía, peso o masa muscular sin dietas extremas.', detail: '/servicios/consulta-bienestar-composicion-corporal/', service: 'bienestar', image: '/assets/images/service-bienestar-cover.webp' },
    hormonal: { title: 'Consulta de nutrición hormonal', copy: 'Acompañamiento nutricional adaptado a síntomas, objetivos y contexto, en coordinación médica cuando corresponde.', detail: '/servicios/consulta-de-nutricion-hormonal/', service: 'hormonal', image: '/servicio-hormonal.avif' },
    embarazo: { title: 'Consulta de nutrición en embarazo', copy: 'Una estrategia realista y segura que considera trimestre, síntomas, hábitos y necesidades individuales.', detail: '/servicios/consulta-de-embarazo/', service: 'embarazo', image: '/servicio-embarazo.avif' },
    climaterio: { title: 'Consulta para climaterio y menopausia', copy: 'Acompañamiento para alimentación, bienestar y composición corporal durante esta etapa de vida.', detail: '/servicios/consulta-para-el-climaterio-y-menopausia/', service: 'climaterio', image: '/servicio-climaterio.avif' },
    inmune: { title: 'Nutrición y bienestar inmunológico', copy: 'Orientación alimentaria responsable como parte de un abordaje integral, sin sustituir la atención médica.', detail: '/servicios/consulta-de-nutricion-y-sistema-inmune/', service: 'inmune', image: '/servicio-inmune.avif' },
    tanita: { title: 'Bioimpedancia Tanita', copy: 'Una medición breve de composición corporal, acompañada de indicaciones de preparación y lectura responsable.', detail: '/servicios/tanita-bioempedancia/', service: 'tanita', image: '/servicio-tanita.avif' },
    online: { title: 'Consulta nutricional en línea', copy: 'Acompañamiento personalizado desde donde estés, con un proceso claro y materiales digitales.', detail: '/servicios/consulta-online/', service: 'online', image: '/assets/images/service-online-cover.webp' }
  };
  const show = name => {
    stages.forEach(stage => { stage.hidden = stage.dataset.quizStage !== name; });
    const step = name === 'goal' ? 1 : 2;
    progress.style.width = name === 'goal' ? '50%' : '100%';
    status.textContent = name === 'result' ? 'Tu resultado' : 'Elige tu objetivo';
    root.querySelector(`[data-quiz-stage="${name}"] h2`)?.focus({ preventScroll: true });
  };
  root.querySelectorAll('[data-goal]').forEach(button => button.addEventListener('click', () => {
    goal = button.dataset.goal;
    root.querySelectorAll('[data-goal]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.dispatchEvent(new CustomEvent('makanuy:track', { detail: { event: 'quiz_answer', data: { label: goal } } }));
    const result = recommendations[goal];
    root.querySelector('#quiz-result-title').textContent = result.title;
    root.querySelector('#quiz-result-copy').textContent = result.copy;
    root.querySelector('#quiz-result-detail').href = result.detail;
    root.querySelector('#quiz-result-book').href = `/agendar/?servicio=${encodeURIComponent(result.service)}`;
    root.querySelector('#quiz-result-image').src = result.image;
    root.querySelector('#quiz-result-image').alt = result.title;
    document.dispatchEvent(new CustomEvent('makanuy:track', { detail: { event: 'quiz_complete', data: { service_id: result.service, label: goal } } }));
    show('result');
  }));
  root.querySelector('[data-quiz-reset]')?.addEventListener('click', () => { goal = ''; root.querySelectorAll('.quiz-option').forEach(item => item.removeAttribute('aria-pressed')); show('goal'); });
})();
