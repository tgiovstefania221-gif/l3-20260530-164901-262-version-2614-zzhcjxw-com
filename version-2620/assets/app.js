(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function initSearchForms() {
    document.querySelectorAll('[data-search-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = form.querySelector('input[name="q"]');
        if (!input || input.value.trim() === '') {
          event.preventDefault();
          window.location.href = 'search.html';
        }
      });
    });
  }

  function initHero() {
    var root = document.querySelector('[data-hero-carousel]');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    if (slides.length <= 1) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
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
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    start();
  }

  function initFilters() {
    var input = document.querySelector('[data-filter-input]');
    var list = document.querySelector('[data-filter-list]');
    if (!input || !list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll('[data-movie-card]'));
    input.addEventListener('input', function () {
      var query = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = card.getAttribute('data-search') || '';
        card.classList.toggle('is-hidden', query !== '' && text.indexOf(query) === -1);
      });
    });
  }

  function playVideo(player) {
    var video = player.querySelector('video');
    var overlay = player.querySelector('[data-play-button]');
    var source = player.getAttribute('data-src');
    if (!video || !source) {
      return;
    }

    function reveal() {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    }

    function restore() {
      if (overlay) {
        overlay.classList.remove('is-hidden');
      }
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (!video.getAttribute('src')) {
        video.setAttribute('src', source);
      }
      reveal();
      video.play().catch(restore);
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      if (!video._hlsInstance) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        video._hlsInstance = hls;
      }
      reveal();
      video.play().catch(restore);
      return;
    }

    if (!video.getAttribute('src')) {
      video.setAttribute('src', source);
    }
    reveal();
    video.play().catch(restore);
  }

  function initPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (player) {
      var button = player.querySelector('[data-play-button]');
      var video = player.querySelector('video');
      if (button) {
        button.addEventListener('click', function () {
          playVideo(player);
        });
      }
      if (video) {
        video.addEventListener('play', function () {
          if (button) {
            button.classList.add('is-hidden');
          }
        });
        video.addEventListener('pause', function () {
          if (video.currentTime === 0 && button) {
            button.classList.remove('is-hidden');
          }
        });
      }
    });
  }

  function movieCardMarkup(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return '' +
      '<article class="movie-card" data-movie-card>' +
      '<a class="poster-link" href="' + escapeHtml(movie.url) + '" aria-label="观看' + escapeHtml(movie.title) + '">' +
      '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" />' +
      '<span class="poster-shade"></span>' +
      '<span class="play-chip">播放</span>' +
      '</a>' +
      '<div class="card-body">' +
      '<div class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span></div>' +
      '<h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>' +
      '<p>' + escapeHtml(movie.oneLine || '') + '</p>' +
      '<div class="tag-list">' + tags + '</div>' +
      '</div>' +
      '</article>';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function initSearchPage() {
    var results = document.querySelector('[data-search-results]');
    var status = document.querySelector('[data-search-status]');
    if (!results || !status || !window.MOVIE_INDEX) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim().toLowerCase();
    document.querySelectorAll('input[name="q"]').forEach(function (input) {
      input.value = params.get('q') || '';
    });

    var source = window.MOVIE_INDEX;
    var matched = query ? source.filter(function (movie) {
      return movie.searchText.indexOf(query) !== -1;
    }) : source.slice(0, 60);

    var visible = matched.slice(0, 120);
    results.innerHTML = visible.map(movieCardMarkup).join('');
    if (query) {
      status.textContent = '共找到 ' + matched.length + ' 条与“' + (params.get('q') || '') + '”相关的影片，当前显示前 ' + visible.length + ' 条。';
    } else {
      status.textContent = '当前展示精选内容，输入关键词可检索完整片库。';
    }
  }

  ready(function () {
    initMenu();
    initSearchForms();
    initHero();
    initFilters();
    initPlayers();
    initSearchPage();
  });
})();
