(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  function escapeHtml(value) {
    return (value || '').toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupNavigation() {
    var toggle = $('[data-nav-toggle]');
    var menu = $('[data-nav-menu]');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
  }

  function setupHero() {
    var root = $('[data-hero-carousel]');
    if (!root) {
      return;
    }
    var slides = $all('.hero-slide', root);
    var dots = $all('[data-hero-dot]', root);
    var prev = $('[data-hero-prev]', root);
    var next = $('[data-hero-next]', root);
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(parseInt(dot.getAttribute('data-hero-dot'), 10));
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupFilters() {
    $all('[data-filter-scope]').forEach(function (scope) {
      var queryInput = $('.js-card-filter', scope);
      var selects = $all('.js-select-filter', scope);
      var tagButtons = $all('[data-filter-tag]', scope);
      var clear = $('[data-clear-filters]', scope);
      var cards = $all('.movie-card', scope);
      var count = $('[data-filter-count]', scope);
      var activeTag = '';

      function apply() {
        var query = normalize(queryInput ? queryInput.value : '');
        var selectValues = {};
        selects.forEach(function (select) {
          selectValues[select.getAttribute('data-filter-field')] = normalize(select.value);
        });
        var visible = 0;
        cards.forEach(function (card) {
          var text = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year'),
            card.getAttribute('data-tags'),
            card.getAttribute('data-category')
          ].join(' '));
          var matchesQuery = !query || text.indexOf(query) !== -1;
          var matchesSelects = Object.keys(selectValues).every(function (field) {
            var selected = selectValues[field];
            return !selected || normalize(card.getAttribute('data-' + field)) === selected;
          });
          var matchesTag = !activeTag || normalize(card.getAttribute('data-tags')).indexOf(activeTag) !== -1;
          var show = matchesQuery && matchesSelects && matchesTag;
          card.hidden = !show;
          if (show) {
            visible += 1;
          }
        });
        if (count) {
          count.textContent = visible;
        }
      }

      if (queryInput) {
        queryInput.addEventListener('input', apply);
      }
      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });
      tagButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          var tag = normalize(button.getAttribute('data-filter-tag'));
          activeTag = activeTag === tag ? '' : tag;
          tagButtons.forEach(function (item) {
            item.classList.toggle('active', normalize(item.getAttribute('data-filter-tag')) === activeTag);
          });
          apply();
        });
      });
      if (clear) {
        clear.addEventListener('click', function () {
          if (queryInput) {
            queryInput.value = '';
          }
          selects.forEach(function (select) {
            select.value = '';
          });
          activeTag = '';
          tagButtons.forEach(function (button) {
            button.classList.remove('active');
          });
          apply();
        });
      }
      apply();
    });
  }

  function setupRankingTabs() {
    var tabs = $all('[data-rank-tab]');
    if (!tabs.length) {
      return;
    }
    var panels = $all('[data-rank-panel]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-rank-tab');
        tabs.forEach(function (item) {
          item.classList.toggle('active', item === tab);
        });
        panels.forEach(function (panel) {
          panel.classList.toggle('active', panel.getAttribute('data-rank-panel') === key);
        });
      });
    });
  }

  function setupSearchPage() {
    var root = $('[data-search-page]');
    if (!root || !window.MOVIES) {
      return;
    }
    var form = $('[data-search-form]');
    var input = form ? $('input[name="q"]', form) : null;
    var results = $('[data-search-results]', root);
    var title = $('[data-search-title]', root);
    var count = $('[data-search-count]', root);
    var history = $('[data-search-history]', root);
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';

    if (input) {
      input.value = initialQuery;
    }

    function getHistory() {
      try {
        return JSON.parse(window.localStorage.getItem('movieSearchHistory') || '[]');
      } catch (error) {
        return [];
      }
    }

    function saveHistory(query) {
      if (!query) {
        return;
      }
      var current = getHistory().filter(function (item) {
        return item !== query;
      });
      current.unshift(query);
      window.localStorage.setItem('movieSearchHistory', JSON.stringify(current.slice(0, 8)));
    }

    function renderHistory() {
      var items = getHistory();
      if (!history) {
        return;
      }
      history.innerHTML = items.map(function (item) {
        return '<a href="search.html?q=' + encodeURIComponent(item) + '">' + escapeHtml(item) + '</a>';
      }).join('');
    }

    function card(movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');
      return [
        '<article class="movie-card">',
        '  <a class="movie-card-link" href="movies/' + movie.file + '">',
        '    <div class="poster-wrap">',
        '      <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '      <span class="card-category">' + escapeHtml(movie.category) + '</span>',
        '    </div>',
        '    <div class="card-body">',
        '      <div class="card-title-row">',
        '        <h3>' + escapeHtml(movie.title) + '</h3>',
        '        <span class="score">' + escapeHtml(movie.score) + '</span>',
        '      </div>',
        '      <p class="card-desc">' + escapeHtml(movie.oneLine) + '</p>',
        '      <div class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
        '      <div class="card-tags">' + tags + '</div>',
        '    </div>',
        '  </a>',
        '</article>'
      ].join('');
    }

    function performSearch(query) {
      var q = normalize(query);
      var matches = window.MOVIES.filter(function (movie) {
        return !q || normalize(movie.searchText).indexOf(q) !== -1;
      });
      var shown = matches.slice(0, 120);
      results.innerHTML = shown.map(card).join('');
      if (title) {
        title.textContent = q ? '搜索结果：' + query : '推荐内容';
      }
      if (count) {
        count.textContent = q
          ? '共找到 ' + matches.length + ' 部内容，当前显示前 ' + shown.length + ' 部。'
          : '展示热度靠前的推荐内容。';
      }
      saveHistory(query.trim());
      renderHistory();
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var query = input ? input.value.trim() : '';
        var url = query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html';
        window.history.replaceState(null, '', url);
        performSearch(query);
      });
    }

    renderHistory();
    performSearch(initialQuery);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();
    setupHero();
    setupFilters();
    setupRankingTabs();
    setupSearchPage();
  });
})();
