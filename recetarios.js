(() => {
  const search = document.querySelector('#recipe-search');
  let cards = [...document.querySelectorAll('.recipe-card')];
  const buttons = [...document.querySelectorAll('[data-recipe-filter]')];
  const count = document.querySelector('#recipe-count');
  const empty = document.querySelector('#recipe-empty');
  if (!search || !cards.length) return;
  let filter = 'all';
  const normalize = value => value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const apply = () => {
    const query = normalize(search.value.trim());
    let visible = 0;
    cards.forEach(card => {
      const matchesFilter = filter === 'all' || card.dataset.tags.split(' ').includes(filter);
      const matchesSearch = !query || normalize(card.dataset.search + ' ' + card.textContent).includes(query);
      card.hidden = !(matchesFilter && matchesSearch);
      if (!card.hidden) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? 'receta disponible' : 'recetas disponibles'}`;
    empty.hidden = visible !== 0;
    document.dispatchEvent(new CustomEvent('makanuy:track', { detail: { event: 'recipe_filter', data: { filter, label: query } } }));
  };
  search.addEventListener('input', apply);
  buttons.forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.recipeFilter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    apply();
  }));
  const safe=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  fetch('/api/recipes').then(response=>response.ok?response.json():{recipes:[]}).then(data=>{
    const grid=document.querySelector('#recipe-grid');
    (data.recipes||[]).forEach(recipe=>{
      const article=document.createElement('article');article.className='recipe-card';article.dataset.tags=(recipe.tags||[]).map(normalize).join(' ');article.dataset.search=normalize([recipe.title,recipe.summary,...(recipe.tags||[])].join(' '));
      article.innerHTML=`<img src="${safe(recipe.image_url||'/hero-collage.avif')}" alt="${safe(recipe.title)}" loading="lazy" decoding="async"><div class="recipe-tags">${(recipe.tags||[]).map(tag=>`<span>${safe(tag)}</span>`).join('')}</div><h2>${safe(recipe.title)}</h2><p>${safe(recipe.summary)}</p><a class="button" href="/receta.html?slug=${encodeURIComponent(recipe.slug)}">Ver receta</a>`;
      grid.append(article);
    });
    cards=[...document.querySelectorAll('.recipe-card')];apply();
  }).catch(()=>{});
})();
