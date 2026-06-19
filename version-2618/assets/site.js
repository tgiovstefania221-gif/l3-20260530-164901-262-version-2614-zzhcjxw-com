(function () {
  var toggle = document.querySelector('[data-menu-toggle]');
  var panel = document.querySelector('[data-mobile-panel]');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var thumbs = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-thumb]'));
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, current) {
        slide.classList.toggle('is-active', current === index);
      });
      thumbs.forEach(function (thumb, current) {
        thumb.classList.toggle('is-active', current === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var next = Number(thumb.getAttribute('data-hero-thumb')) || 0;
        show(next);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
  }

  var panels = document.querySelectorAll('[data-filter-panel]');
  panels.forEach(function (panelNode) {
    var input = panelNode.querySelector('[data-live-search]');
    var type = panelNode.querySelector('[data-type-filter]');
    var region = panelNode.querySelector('[data-region-filter]');
    var list = document.querySelector('[data-card-list]');
    if (!list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card, .rank-row'));
    var params = new URLSearchParams(window.location.search);
    var preset = params.get('q') || '';
    if (input && preset) {
      input.value = preset;
    }

    function apply() {
      var keyword = normalize(input && input.value);
      var typeValue = normalize(type && type.value);
      var regionValue = normalize(region && region.value);
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-year'),
          card.getAttribute('data-tags')
        ].join(' '));
        var typeText = normalize(card.getAttribute('data-type'));
        var regionText = normalize(card.getAttribute('data-region'));
        var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchType = !typeValue || typeText.indexOf(typeValue) !== -1 || haystack.indexOf(typeValue) !== -1;
        var matchRegion = !regionValue || regionText.indexOf(regionValue) !== -1 || haystack.indexOf(regionValue) !== -1;
        card.style.display = matchKeyword && matchType && matchRegion ? '' : 'none';
      });
    }

    [input, type, region].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });
    apply();
  });
})();
