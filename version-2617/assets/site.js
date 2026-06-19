(function () {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let index = 0;
    let timer = null;

    const show = function (nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    };

    const start = function () {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    };

    const restart = function () {
      window.clearInterval(timer);
      start();
    };

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.dataset.heroDot || 0));
        restart();
      });
    });

    start();
  }

  const input = document.querySelector('[data-search-input]');
  const cards = Array.from(document.querySelectorAll('.movie-card'));
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  let currentFilter = '全部';

  const normalize = function (value) {
    return String(value || '').trim().toLowerCase();
  };

  const cardText = function (card) {
    return normalize([
      card.dataset.title,
      card.dataset.region,
      card.dataset.type,
      card.dataset.year,
      card.dataset.tags,
      card.textContent
    ].join(' '));
  };

  const applySearch = function () {
    const query = normalize(input ? input.value : '');
    const filter = normalize(currentFilter);

    cards.forEach(function (card) {
      const text = cardText(card);
      const matchesQuery = !query || text.includes(query);
      const matchesFilter = filter === '全部' || text.includes(filter);
      card.classList.toggle('hidden', !(matchesQuery && matchesFilter));
    });
  };

  if (input) {
    input.addEventListener('input', applySearch);
  }

  filterButtons.forEach(function (button) {
    if (button.dataset.filter === '全部') {
      button.classList.add('active');
    }

    button.addEventListener('click', function () {
      currentFilter = button.dataset.filter || '全部';
      filterButtons.forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      applySearch();
    });
  });
})();
