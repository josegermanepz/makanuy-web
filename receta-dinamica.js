(() => {
  const slug=new URLSearchParams(location.search).get('slug');
  const text=(selector,value)=>{document.querySelector(selector).textContent=value};
  if(!slug){text('#recipe-loading','No encontramos la receta solicitada.');return}
  fetch(`/api/recipes?slug=${encodeURIComponent(slug)}`).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||'No encontramos la receta.');return data.recipe}).then(recipe=>{
    document.title=`${recipe.title} | Makanuy`;text('#dynamic-title',recipe.title);text('#dynamic-summary',recipe.summary);
    const image=document.querySelector('#dynamic-image');image.src=recipe.image_url;image.alt=recipe.title;
    document.querySelector('#dynamic-tags').innerHTML=recipe.tags.map(tag=>`<span>${String(tag).replace(/[&<>]/g,'')}</span>`).join('');
    document.querySelector('#dynamic-ingredients').innerHTML=recipe.ingredients.map(item=>`<li>${String(item).replace(/[&<>]/g,'')}</li>`).join('');
    document.querySelector('#dynamic-steps').innerHTML=recipe.steps.map(item=>`<li>${String(item).replace(/[&<>]/g,'')}</li>`).join('');
    document.querySelector('#recipe-loading').hidden=true;document.querySelector('#dynamic-recipe').hidden=false;
  }).catch(error=>text('#recipe-loading',error.message));
})();
