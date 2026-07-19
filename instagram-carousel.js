(() => {
  const carousel = document.querySelector('[data-instagram-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('[data-instagram-track]');
  const cards = [...track.children];
  const prev = carousel.querySelector('[data-instagram-prev]');
  const next = carousel.querySelector('[data-instagram-next]');
  const dots = carousel.querySelector('[data-instagram-dots]');
  let index = 0;
  const visible = () => innerWidth <= 560 ? 1 : innerWidth <= 800 ? 2 : 3;
  const maximum = () => Math.max(0, cards.length - visible());
  const render = () => {
    index = Math.min(index, maximum());
    const width = cards[0].getBoundingClientRect().width + 16;
    track.style.transform = `translateX(${-index * width}px)`;
    prev.disabled = index === 0;
    next.disabled = index === maximum();
    dots.querySelectorAll('button').forEach((dot, position) => dot.setAttribute('aria-current', String(position === index)));
  };
  for (let position = 0; position <= maximum(); position += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Ir a publicación ${position + 1}`);
    dot.addEventListener('click', () => { index = position; render(); });
    dots.append(dot);
  }
  prev.addEventListener('click', () => { index = Math.max(0, index - 1); render(); });
  next.addEventListener('click', () => { index = Math.min(maximum(), index + 1); render(); });
  addEventListener('resize', render, { passive: true });
  render();
})();
