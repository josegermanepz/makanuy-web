(() => {
  const search = document.querySelector('#food-search');
  const cards = [...document.querySelectorAll('.food-card')];
  if (!search || !cards.length) return;

  const groups = {
    bebidas: ['Agua Mineral', 'Bebida Vegetal'],
    cereales: ['Cereales', 'Galletas de Arroz Inflado', 'Tostadas', 'Avena', 'Granola', 'Pan de Caja', 'Tortillas'],
    proteinas: ['Atún', 'Pechuga de Pavo', 'Frijoles'],
    lacteos: ['Kefir', 'Leche', 'Queso Feta', 'Queso Panela', 'Requesón', 'Yogurt'],
    colaciones: ['Barritas', 'Chocolate', 'Gelatinas', 'Snacks', 'Cacao y Cocoa']
  };
  cards.forEach(card => {
    const title = card.querySelector('h3')?.textContent.trim() || '';
    card.dataset.category = Object.entries(groups).find(([, names]) => names.includes(title))?.[0] || 'otros';
  });

  const controls = document.createElement('div');
  controls.className = 'recommendation-controls';
  controls.innerHTML = `
    <div class="filters" role="group" aria-label="Filtrar marcas por categoría">
      <button type="button" class="active" data-food-filter="todos" aria-pressed="true">Todos</button>
      <button type="button" data-food-filter="bebidas" aria-pressed="false">Bebidas</button>
      <button type="button" data-food-filter="cereales" aria-pressed="false">Cereales</button>
      <button type="button" data-food-filter="proteinas" aria-pressed="false">Proteínas</button>
      <button type="button" data-food-filter="lacteos" aria-pressed="false">Lácteos</button>
      <button type="button" data-food-filter="colaciones" aria-pressed="false">Colaciones</button>
      <button type="button" data-food-filter="otros" aria-pressed="false">Otros</button>
    </div>
    <p class="results-count" aria-live="polite"></p>`;
  search.closest('section')?.insertBefore(controls, search.previousElementSibling || search);

  let category = 'todos';
  const count = controls.querySelector('.results-count');
  const apply = () => {
    const query = search.value.trim().toLocaleLowerCase('es-MX');
    let visible = 0;
    cards.forEach(card => {
      const categoryMatch = category === 'todos' || card.dataset.category === category;
      const searchMatch = !query || card.textContent.toLocaleLowerCase('es-MX').includes(query);
      card.hidden = !(categoryMatch && searchMatch);
      if (!card.hidden) visible += 1;
    });
    count.textContent = visible ? `${visible} ${visible === 1 ? 'categoría encontrada' : 'categorías encontradas'}` : 'No encontramos resultados. Prueba otra palabra o categoría.';
  };

  controls.querySelectorAll('[data-food-filter]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.foodFilter;
    controls.querySelectorAll('[data-food-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    apply();
    document.dispatchEvent(new CustomEvent('makanuy:track', { detail: { event: 'recommendation_filter', data: { filter: category } } }));
  }));
  search.addEventListener('input', apply);
  apply();
})();
