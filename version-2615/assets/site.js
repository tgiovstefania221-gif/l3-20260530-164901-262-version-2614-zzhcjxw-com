import { H as Hls } from './hls.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function initNav() {
  const button = $('.nav-toggle');
  const nav = $('.main-nav');
  if (!button || !nav) return;
  button.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

function initHero() {
  const hero = $('.hero');
  if (!hero) return;
  const slides = $$('.hero-slide', hero);
  const dots = $$('.hero-dots button', hero);
  if (slides.length <= 1) return;
  let index = 0;
  let timer = null;
  const show = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  };
  const start = () => {
    timer = window.setInterval(() => show(index + 1), 5200);
  };
  const reset = () => {
    if (timer) window.clearInterval(timer);
    start();
  };
  $('.hero-arrow.prev', hero)?.addEventListener('click', () => {
    show(index - 1);
    reset();
  });
  $('.hero-arrow.next', hero)?.addEventListener('click', () => {
    show(index + 1);
    reset();
  });
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      show(i);
      reset();
    });
  });
  show(0);
  start();
}

function initPlayers() {
  $$('.player-shell').forEach((shell) => {
    const video = $('video', shell);
    const cover = $('.player-cover', shell);
    const button = $('.big-play', shell);
    if (!video) return;
    const src = video.getAttribute('data-video') || '';
    if (!src) return;
    let ready = false;
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        ready = true;
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      ready = true;
    }
    const play = () => {
      cover?.classList.add('hidden');
      video.controls = true;
      const run = video.play();
      if (run && typeof run.catch === 'function') {
        run.catch(() => {
          cover?.classList.remove('hidden');
        });
      }
    };
    cover?.addEventListener('click', play);
    button?.addEventListener('click', (event) => {
      event.stopPropagation();
      play();
    });
    video.addEventListener('click', () => {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    });
  });
}

function createResult(item) {
  return `
<article class="movie-card compact">
  <a class="poster-link" href="${item.url}">
    <img src="${item.cover}" alt="${item.title}" loading="lazy">
    <span class="poster-shade"></span>
    <span class="play-dot">▶</span>
    <span class="poster-region">${item.region}</span>
    <span class="poster-year">${item.year}</span>
  </a>
  <div class="movie-card-body">
    <h3><a href="${item.url}">${item.title}</a></h3>
    <p>${item.line}</p>
    <div class="meta-line"><span>★ ${item.rating}</span><span>${item.type}</span></div>
    <div class="tag-row"><span>${item.category}</span></div>
  </div>
</article>`;
}

async function initSearch() {
  const page = $('.search-page');
  if (!page) return;
  const input = $('#searchInput');
  const select = $('#searchType');
  const button = $('#searchButton');
  const grid = $('#searchResults');
  const info = $('#searchInfo');
  if (!input || !select || !button || !grid || !info) return;
  const module = await import('./search-index.js');
  const source = module.SEARCH_INDEX || [];
  const render = () => {
    const keyword = input.value.trim().toLowerCase();
    const type = select.value;
    let list = source.filter((item) => {
      const text = `${item.title} ${item.region} ${item.type} ${item.genre} ${item.tags} ${item.line}`.toLowerCase();
      const keywordOk = !keyword || text.includes(keyword);
      const typeOk = !type || item.type.includes(type) || item.genre.includes(type) || item.tags.includes(type);
      return keywordOk && typeOk;
    }).slice(0, 96);
    if (!keyword && !type) list = source.slice(0, 48);
    grid.innerHTML = list.map(createResult).join('');
    info.textContent = list.length ? '已为你匹配到相关影片' : '暂无匹配影片';
  };
  button.addEventListener('click', render);
  input.addEventListener('input', render);
  select.addEventListener('change', render);
  render();
}

initNav();
initHero();
initPlayers();
initSearch();
