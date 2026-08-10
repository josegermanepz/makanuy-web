(() => {
  const form = document.querySelector('#recipe-admin');
  const token = document.querySelector('#recipe-token');
  const status = document.querySelector('#recipe-admin-status');
  const success = document.querySelector('#recipe-admin-success');
  const list = document.querySelector('#recipe-admin-list');
  const cancel = document.querySelector('#cancel-recipe-edit');
  let recipes = [];

  const safe = value => String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const setStatus = (message, bad = false) => {
    status.textContent = message;
    status.className = `form-status${bad ? ' error' : ''}`;
  };
  const request = async (url, options = {}) => {
    if (!token.value.trim()) throw new Error('Escribe la clave de publicación.');
    const response = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), authorization: `Bearer ${token.value.trim()}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No fue posible completar la operación.');
    return data;
  };
  const preview = () => {
    const fields = Object.fromEntries(new FormData(form));
    document.querySelector('#recipe-preview-title').textContent = fields.title || 'Título del recetario';
    document.querySelector('#recipe-preview-summary').textContent = fields.summary || 'Aquí aparecerá el resumen antes de publicar.';
    document.querySelector('#recipe-preview-image').src = fields.imageUrl?.startsWith('/') ? fields.imageUrl : '/hero-collage.avif';
    document.querySelector('#recipe-preview-tags').innerHTML = String(fields.tags || '').split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 8).map(tag => `<span>${safe(tag)}</span>`).join('');
  };
  const reset = () => {
    form.reset();
    form.elements.currentSlug.value = '';
    form.elements.imageUrl.value = '/hero-collage.avif';
    form.querySelector('[type="submit"]').textContent = 'Publicar receta';
    document.querySelector('#recipe-form-title').textContent = 'Publicar un recetario';
    cancel.hidden = true;
    success.hidden = true;
    preview();
  };
  const render = () => {
    list.innerHTML = recipes.length ? recipes.map(recipe => `
      <article class="admin-list-item${recipe.status === 'archived' ? ' is-archived' : ''}">
        <img src="${safe(recipe.image_url || '/hero-collage.avif')}" alt="">
        <div><strong>${safe(recipe.title)}</strong><p>${safe(recipe.summary)}</p><small>${recipe.status === 'archived' ? 'No publicada' : 'Publicada'} · /${safe(recipe.slug)}</small></div>
        <div class="actions"><button class="button" type="button" data-edit-recipe="${safe(recipe.slug)}">Editar</button>${recipe.status !== 'archived' ? `<button class="button" type="button" data-archive-recipe="${safe(recipe.slug)}">Retirar</button>` : ''}</div>
      </article>`).join('') : '<p>Aún no hay recetarios creados desde este panel.</p>';
  };
  const load = async () => {
    setStatus('Cargando…');
    try {
      const data = await request('/api/recipes');
      recipes = data.recipes || [];
      render();
      setStatus(`${recipes.length} ${recipes.length === 1 ? 'recetario encontrado' : 'recetarios encontrados'}.`);
    } catch (error) { setStatus(error.message, true); }
  };
  const edit = slug => {
    const recipe = recipes.find(item => item.slug === slug);
    if (!recipe) return;
    form.elements.currentSlug.value = recipe.slug;
    form.elements.slug.value = recipe.slug;
    form.elements.title.value = recipe.title;
    form.elements.summary.value = recipe.summary;
    form.elements.ingredients.value = (recipe.ingredients || []).join('\n');
    form.elements.steps.value = (recipe.steps || []).join('\n');
    form.elements.tags.value = (recipe.tags || []).join(', ');
    form.elements.imageUrl.value = recipe.image_url || '/hero-collage.avif';
    form.querySelector('[type="submit"]').textContent = recipe.status === 'archived' ? 'Volver a publicar' : 'Guardar cambios';
    document.querySelector('#recipe-form-title').textContent = `Editar: ${recipe.title}`;
    cancel.hidden = false;
    preview();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  document.querySelector('#load-recipes')?.addEventListener('click', load);
  cancel?.addEventListener('click', reset);
  form?.addEventListener('input', preview);
  list?.addEventListener('click', async event => {
    const editButton = event.target.closest('[data-edit-recipe]');
    if (editButton) return edit(editButton.dataset.editRecipe);
    const archiveButton = event.target.closest('[data-archive-recipe]');
    if (!archiveButton || !confirm('¿Quieres retirar este recetario del sitio? Podrás restaurarlo después.')) return;
    setStatus('Retirando recetario…');
    try {
      await request(`/api/recipes?slug=${encodeURIComponent(archiveButton.dataset.archiveRecipe)}`, { method: 'DELETE' });
      await load();
    } catch (error) { setStatus(error.message, true); }
  });
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(form));
    const editing = Boolean(fields.currentSlug);
    setStatus(editing ? 'Guardando cambios…' : 'Publicando…');
    success.hidden = true;
    try {
      const data = await request('/api/recipes', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(fields)
      });
      setStatus('');
      success.innerHTML = `<strong>${editing ? 'Recetario actualizado.' : 'Recetario publicado.'}</strong><p><a href="${safe(data.url)}">Abrir la receta</a></p>`;
      success.hidden = false;
      await load();
      reset();
      success.hidden = false;
    } catch (error) { setStatus(error.message, true); }
  });
  reset();
})();
