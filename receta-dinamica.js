(() => {
  const slug=new URLSearchParams(location.search).get('slug');
  const site='https://www.makanuyconsultas.com';
  const text=(selector,value)=>{document.querySelector(selector).textContent=value};
  const meta=(selector,value)=>{const element=document.querySelector(selector);if(element)element.setAttribute('content',value)};
  if(!slug){text('#recipe-loading','No encontramos la receta solicitada.');return}
  fetch(`/api/recipes?slug=${encodeURIComponent(slug)}`).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||'No encontramos la receta.');return data.recipe}).then(recipe=>{
    document.title=`${recipe.title} | Makanuy`;text('#dynamic-title',recipe.title);text('#dynamic-summary',recipe.summary);
    const image=document.querySelector('#dynamic-image');image.src=recipe.image_url;image.alt=recipe.title;
    const canonical=`${site}/receta/?slug=${encodeURIComponent(recipe.slug)}`;
    const canonicalElement=document.querySelector('link[rel="canonical"]');if(canonicalElement)canonicalElement.href=canonical;
    const socialImage=new URL(recipe.image_url,site).href;
    meta('meta[name="description"]',recipe.summary);meta('meta[property="og:title"]',`${recipe.title} | Makanuy`);meta('meta[property="og:description"]',recipe.summary);meta('meta[property="og:url"]',canonical);meta('meta[property="og:image"]',socialImage);meta('meta[name="twitter:title"]',`${recipe.title} | Makanuy`);meta('meta[name="twitter:description"]',recipe.summary);meta('meta[name="twitter:image"]',socialImage);
    document.querySelector('#dynamic-tags').innerHTML=recipe.tags.map(tag=>`<span>${String(tag).replace(/[&<>]/g,'')}</span>`).join('');
    document.querySelector('#dynamic-ingredients').innerHTML=recipe.ingredients.map(item=>`<li>${String(item).replace(/[&<>]/g,'')}</li>`).join('');
    document.querySelector('#dynamic-steps').innerHTML=recipe.steps.map(item=>`<li>${String(item).replace(/[&<>]/g,'')}</li>`).join('');
    const schema=document.createElement('script');schema.type='application/ld+json';schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Recipe',name:recipe.title,description:recipe.summary,image:[new URL(recipe.image_url,site).href],author:{'@type':'Person',name:'Yunuen Figueroa González'},datePublished:recipe.created_at,recipeIngredient:recipe.ingredients,recipeInstructions:recipe.steps.map(step=>({'@type':'HowToStep',text:step}))});document.head.append(schema);
    document.querySelector('#recipe-loading').hidden=true;document.querySelector('#dynamic-recipe').hidden=false;
  }).catch(error=>text('#recipe-loading',error.message));
})();
