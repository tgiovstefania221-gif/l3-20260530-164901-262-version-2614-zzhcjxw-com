(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
    } else {
      document.addEventListener("DOMContentLoaded", callback);
    }
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-button]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function setupQuickSearch() {
    var form = document.querySelector("[data-site-search]");
    if (!form) {
      return;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = form.querySelector("input[name='q']");
      var value = input ? input.value.trim() : "";
      var target = "./search.html";
      if (value) {
        target += "?q=" + encodeURIComponent(value);
      }
      window.location.href = target;
    });
  }

  function setupFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));
    if (!scopes.length) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var queryParam = params.get("q") || "";

    scopes.forEach(function (scope) {
      var keyword = scope.querySelector("[data-filter-keyword]");
      var category = scope.querySelector("[data-filter-category]");
      var year = scope.querySelector("[data-filter-year]");
      var container = scope.parentElement || document;
      var cards = Array.prototype.slice.call(container.querySelectorAll(".movie-card"));

      if (keyword && queryParam) {
        keyword.value = queryParam;
      }

      function apply() {
        var keywordValue = keyword ? keyword.value.trim().toLowerCase() : "";
        var categoryValue = category ? category.value : "";
        var yearValue = year ? year.value : "";

        cards.forEach(function (card) {
          var text = (card.getAttribute("data-text") || "").toLowerCase();
          var cardYear = card.getAttribute("data-year") || "";
          var cardCategory = card.getAttribute("data-category") || "";
          var matched = true;

          if (keywordValue && text.indexOf(keywordValue) === -1) {
            matched = false;
          }
          if (categoryValue && cardCategory !== categoryValue) {
            matched = false;
          }
          if (yearValue && cardYear !== yearValue) {
            matched = false;
          }

          card.classList.toggle("is-filter-hidden", !matched);
        });
      }

      [keyword, category, year].forEach(function (field) {
        if (field) {
          field.addEventListener("input", apply);
          field.addEventListener("change", apply);
        }
      });

      apply();
    });
  }

  function setupBackTop() {
    var button = document.querySelector("[data-back-top]");
    if (!button) {
      return;
    }
    function update() {
      button.classList.toggle("is-visible", window.scrollY > 420);
    }
    window.addEventListener("scroll", update, { passive: true });
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    update();
  }

  window.initMoviePlayer = function (videoId, url, buttonId) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    if (!video || !button || !url) {
      return;
    }

    function attach() {
      if (video.getAttribute("data-ready") === "1") {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else {
        video.src = url;
      }
      video.setAttribute("data-ready", "1");
    }

    function play() {
      attach();
      button.classList.add("is-hidden");
      var result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function () {});
      }
    }

    button.addEventListener("click", play);
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupQuickSearch();
    setupFilters();
    setupBackTop();
  });
})();
