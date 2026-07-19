(() => {
  const clean = value => (value || '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const current = clean(location.pathname);
  document.querySelectorAll('.site-header nav a[href]').forEach(link => {
    const target = clean(new URL(link.href, location.href).pathname);
    const active = current === target || (current === '/nutricion-mujer' && target === '/nutricion-mujer');
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  const water = document.querySelector('[data-wix-water]');
  if (water) water.addEventListener('submit', event => {
    event.preventDefault();
    const kg = Number(new FormData(water).get('weight'));
    const output = water.querySelector('.result');
    if (!Number.isFinite(kg) || kg <= 0) { output.textContent = 'Ingresa un peso válido.'; return; }
    const ml = Math.round(kg * 35);
    output.innerHTML = '<span>¿Cuántos mililitros debes tomar?</span><br><strong>' + ml.toLocaleString('es-MX') + ' ml al día</strong>';
  });
  const portions = {
    'Proteína': {'Pechuga de pollo cocida':'30 g','Pescado cocido':'40 g','Atún en agua':'30 g','Huevo entero':'1 pieza','Queso panela':'40 g'},
    'Cereales': {'Tortilla de maíz':'1 pieza','Pan de caja':'1 rebanada','Arroz cocido':'1/3 taza','Pasta cocida':'1/2 taza','Avena cruda':'1/3 taza'},
    'Leguminosas': {'Frijoles cocidos':'1/2 taza','Lentejas cocidas':'1/2 taza','Garbanzos cocidos':'1/2 taza','Habas cocidas':'1/2 taza'},
    'Lácteos': {'Leche descremada':'1 taza','Yogurt natural':'1 taza','Leche de soya sin azúcar':'1 taza'},
    'Verduras': {'Verdura cruda':'1 taza','Verdura cocida':'1/2 taza','Ensalada de hojas':'2 tazas'},
    'Frutas': {'Manzana':'1 pieza','Plátano':'1/2 pieza','Papaya':'1 taza','Fresas':'1 taza','Mango':'1/2 pieza'},
    'Aceites': {'Aceite':'1 cucharadita','Aguacate':'1/3 pieza','Nueces':'3 piezas','Almendras':'10 piezas','Crema de cacahuate':'2 cucharaditas'}
  };
  const eq = document.querySelector('[data-wix-equivalents]');
  if (eq) {
    const group = eq.querySelector('[name="group"]'), food = eq.querySelector('[name="food"]'), target = eq.querySelector('[name="target"]'), output = eq.querySelector('.result');
    const fill = () => {
      const items = portions[group.value] || {};
      const options = Object.keys(items).map(name => '<option value="' + name + '">' + name + ' — ' + items[name] + '</option>').join('');
      food.innerHTML = '<option value="">Mi Alimento</option>' + options;
      target.innerHTML = '<option value="">Equivalente</option>' + options;
      output.textContent = '¿Estás listo para conocer tus equivalentes?';
    };
    group.addEventListener('change', fill);
    eq.addEventListener('submit', event => {
      event.preventDefault();
      if (!group.value || !food.value || !target.value) { output.textContent = 'Selecciona el grupo, tu alimento y el equivalente.'; return; }
      output.innerHTML = '<strong>1 equivalente</strong><br>' + portions[group.value][food.value] + ' de ' + food.value + ' equivale a ' + portions[group.value][target.value] + ' de ' + target.value + '.';
    });
  }
})();
