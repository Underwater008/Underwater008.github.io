// Photo-collage slideshow generated from /public/slides.json
// Layout positions are encoded as percentages of the slide rect (10in × 5.625in).

const SLIDES_URL = `${import.meta.env.BASE_URL}slides.json`;
const MEDIA_BASE = `${import.meta.env.BASE_URL}media/`;

const deck = document.getElementById('deck');
const counter = document.getElementById('counter');
const prev = document.getElementById('prev');
const next = document.getElementById('next');

let current = 0;
let total = 0;

function makeShape(shape) {
  const el = document.createElement('div');
  el.className = `shape ${shape.type}`;
  el.style.left = `${shape.left_pct}%`;
  el.style.top = `${shape.top_pct}%`;
  el.style.width = `${shape.width_pct}%`;
  el.style.height = `${shape.height_pct}%`;

  if (shape.type === 'image') {
    const img = document.createElement('img');
    img.src = `${MEDIA_BASE}${shape.src}`;
    img.alt = '';
    img.loading = 'lazy';
    el.appendChild(img);
  } else if (shape.type === 'text') {
    const span = document.createElement('span');
    span.textContent = shape.text;
    // Distinguish small date labels from large finale heading by box height.
    span.className = shape.height_pct > 10 ? 'happy' : 'date-label';
    el.appendChild(span);
  }

  return el;
}

function renderSlide(data, index, totalSlides) {
  const slide = document.createElement('section');
  slide.className = 'slide';
  slide.dataset.index = String(index);

  // Slide-specific styling hooks
  if (index === 0) slide.classList.add('cover');
  if (index === totalSlides - 1) slide.classList.add('finale');

  for (const shape of data.shapes) {
    slide.appendChild(makeShape(shape));
  }

  return slide;
}

function go(target) {
  const slides = deck.querySelectorAll('.slide');
  if (slides.length === 0) return;
  const next = ((target % slides.length) + slides.length) % slides.length;
  slides[current]?.classList.remove('active');
  slides[next].classList.add('active');
  current = next;
  counter.textContent = `${current + 1} / ${total}`;
}

function fitDeck() {
  const stage = document.getElementById('stage');
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  const dw = deck.offsetWidth;
  const dh = deck.offsetHeight;
  const scale = Math.min(sw / dw, sh / dh);
  deck.style.transform = `translate(-50%, -50%) scale(${scale})`;
  deck.style.position = 'absolute';
  deck.style.left = '50%';
  deck.style.top = '50%';
}

async function init() {
  const res = await fetch(SLIDES_URL);
  const data = await res.json();

  // Drop slide 7 (the 5-photo collage); keep cover, dates, app screens, and finale.
  const slides = data.slides.filter((s) => s.index !== 7);

  total = slides.length;

  slides.forEach((s, i) => {
    deck.appendChild(renderSlide(s, i, slides.length));
  });

  // Set deck aspect ratio from data (10:5.625 = 16:9)
  const ratio = data.slide_width_in / data.slide_height_in;
  // Keep CSS variable in sync — use 1920×1080 for sharpness
  deck.style.width = `1920px`;
  deck.style.height = `${1920 / ratio}px`;

  go(0);
  fitDeck();

  window.addEventListener('resize', fitDeck);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(current + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(current - 1); }
    if (e.key === 'Home') { e.preventDefault(); go(0); }
    if (e.key === 'End') { e.preventDefault(); go(total - 1); }
  });

  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));

  // Click anywhere (except HUD) advances
  document.getElementById('stage').addEventListener('click', (e) => {
    if (e.target.closest('#hud')) return;
    go(current + 1);
  });
}

init();
