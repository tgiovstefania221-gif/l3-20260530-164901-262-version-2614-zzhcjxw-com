(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  var current = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('active', slideIndex === current);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('active', dotIndex === current);
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      showSlide(index);
    });
  });

  if (slides.length > 1) {
    setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
  }

  function applyFilter(scope) {
    var input = scope.querySelector('[data-filter-input]');
    var year = scope.querySelector('[data-filter-year]');
    var type = scope.querySelector('[data-filter-type]');
    var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-title]'));
    var empty = scope.querySelector('.empty-result');
    var query = normalize(input ? input.value : '');
    var yearValue = year ? year.value : '';
    var typeValue = type ? type.value : '';
    var shown = 0;

    cards.forEach(function (card) {
      var haystack = normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-tags'),
        card.getAttribute('data-year')
      ].join(' '));
      var matchQuery = !query || haystack.indexOf(query) !== -1;
      var matchYear = !yearValue || card.getAttribute('data-year') === yearValue;
      var matchType = !typeValue || card.getAttribute('data-genre').indexOf(typeValue) !== -1 || card.getAttribute('data-tags').indexOf(typeValue) !== -1;
      var visible = matchQuery && matchYear && matchType;
      card.style.display = visible ? '' : 'none';
      if (visible) {
        shown += 1;
      }
    });

    if (empty) {
      empty.style.display = shown ? 'none' : 'block';
    }
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]')).forEach(function (scope) {
    Array.prototype.slice.call(scope.querySelectorAll('[data-filter-input], [data-filter-year], [data-filter-type]')).forEach(function (control) {
      control.addEventListener('input', function () {
        applyFilter(scope);
      });
      control.addEventListener('change', function () {
        applyFilter(scope);
      });
    });
    applyFilter(scope);
  });

  var params = new URLSearchParams(window.location.search);
  var q = params.get('q');
  if (q) {
    var searchInput = document.querySelector('[data-filter-input]');
    if (searchInput) {
      searchInput.value = q;
      var searchScope = document.querySelector('[data-filter-scope]');
      if (searchScope) {
        applyFilter(searchScope);
      }
    }
  }
})();
