
(function () {
  function initHero() {
    const slider = document.querySelector('[data-hero-slider]');
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll('.hero-slide'));
    const dots = Array.from(slider.querySelectorAll('.dot'));
    const prev = slider.querySelector('[data-prev]');
    const next = slider.querySelector('[data-next]');
    let index = 0;
    function setSlide(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, n) => slide.classList.toggle('active', n === index));
      dots.forEach((dot, n) => dot.classList.toggle('active', n === index));
    }
    function tick() { setSlide(index + 1); }
    let timer = setInterval(tick, 5500);
    if (prev) prev.addEventListener('click', () => { clearInterval(timer); setSlide(index - 1); timer = setInterval(tick, 5500); });
    if (next) next.addEventListener('click', () => { clearInterval(timer); setSlide(index + 1); timer = setInterval(tick, 5500); });
    dots.forEach((dot, n) => dot.addEventListener('click', () => { clearInterval(timer); setSlide(n); timer = setInterval(tick, 5500); }));
    setSlide(0);
  }

  function initFilters() {
    const input = document.querySelector('[data-filter-input]');
    const region = document.querySelector('[data-filter-region]');
    const year = document.querySelector('[data-filter-year]');
    const cards = Array.from(document.querySelectorAll('[data-search]'));
    if (!input && !region && !year) return;
    function run() {
      const q = (input?.value || '').trim().toLowerCase();
      const regionValue = (region?.value || '').trim();
      const yearValue = (year?.value || '').trim();
      cards.forEach(card => {
        const hay = (card.dataset.search || '').toLowerCase();
        const okQ = !q || hay.includes(q);
        const okR = !regionValue || card.dataset.region === regionValue;
        const okY = !yearValue || String(card.dataset.year) === yearValue;
        card.style.display = (okQ && okR && okY) ? '' : 'none';
      });
    }
    input?.addEventListener('input', run);
    region?.addEventListener('change', run);
    year?.addEventListener('change', run);
    run();
  }

  function initPlayer() {
    const video = document.querySelector('[data-player-video]');
    if (!video) return;
    const fallback = video.dataset.fallback || '';
    const sources = Array.from(document.querySelectorAll('[data-src]'));
    let currentObjectUrl = null;

    function setSource(url, type) {
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
      }
      if (video._hls) {
        try { video._hls.destroy(); } catch (e) {}
        video._hls = null;
      }
      video.pause();
      video.removeAttribute('src');
      while (video.firstChild) video.removeChild(video.firstChild);

      if (type === 'hls' && window.Hls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        video._hls = hls;
      } else if (type === 'hls' && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        video.src = url;
      }
      video.load();
      video.play().catch(() => {});
      sources.forEach(btn => btn.classList.toggle('active', btn.dataset.src === url));
    }

    sources.forEach(btn => {
      btn.addEventListener('click', () => setSource(btn.dataset.src, btn.dataset.type || 'mp4'));
    });

    const defaultBtn = sources.find(btn => btn.classList.contains('active')) || sources[0];
    if (defaultBtn) setSource(defaultBtn.dataset.src, defaultBtn.dataset.type || 'mp4');
    else if (fallback) setSource(fallback, 'mp4');
  }

  function initCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy || '';
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = '已复制';
          setTimeout(() => { btn.textContent = '复制链接'; }, 1500);
        } catch (e) {}
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHero();
    initFilters();
    initPlayer();
    initCopyButtons();
  });
})();
