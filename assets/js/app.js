(function () {
    'use strict';

    var HLS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
    var hlsPromise = null;

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
            return;
        }
        callback();
    }

    function initMobileMenu() {
        var button = document.querySelector('[data-mobile-menu-button]');
        var links = document.querySelector('[data-nav-links]');
        if (!button || !links) {
            return;
        }
        button.addEventListener('click', function () {
            var isOpen = links.classList.toggle('is-open');
            document.body.classList.toggle('is-menu-open', isOpen);
            button.setAttribute('aria-label', isOpen ? '关闭导航' : '打开导航');
            button.textContent = isOpen ? '×' : '☰';
        });
    }

    function initFooterYear() {
        document.querySelectorAll('[data-current-year]').forEach(function (node) {
            node.textContent = String(new Date().getFullYear());
        });
    }

    function initBackToTop() {
        var button = document.querySelector('[data-back-to-top]');
        if (!button) {
            return;
        }
        window.addEventListener('scroll', function () {
            button.classList.toggle('is-visible', window.scrollY > 360);
        }, { passive: true });
        button.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function initHeroCarousel() {
        var slider = document.querySelector('[data-hero-slider]');
        if (!slider) {
            return;
        }
        var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
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

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                show(dotIndex);
                start();
            });
        });
        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function normalize(text) {
        return String(text || '').trim().toLowerCase();
    }

    function initFilterPanels() {
        document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
            var scopeSelector = panel.getAttribute('data-filter-scope') || 'body';
            var scope = document.querySelector(scopeSelector) || document;
            var searchInput = panel.querySelector('[data-filter-search]');
            var yearSelect = panel.querySelector('[data-filter-year]');
            var typeSelect = panel.querySelector('[data-filter-type]');
            var countNode = document.querySelector(panel.getAttribute('data-result-count') || '');
            var emptyNode = document.querySelector(panel.getAttribute('data-empty-results') || '');
            var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
            var urlParams = new URLSearchParams(window.location.search);
            var query = urlParams.get('q') || '';

            if (query && searchInput) {
                searchInput.value = query;
            }

            function apply() {
                var term = normalize(searchInput && searchInput.value);
                var year = yearSelect ? normalize(yearSelect.value) : '';
                var type = typeSelect ? normalize(typeSelect.value) : '';
                var visible = 0;

                cards.forEach(function (card) {
                    var searchable = normalize(card.getAttribute('data-search'));
                    var cardYear = normalize(card.getAttribute('data-year'));
                    var cardType = normalize(card.getAttribute('data-type'));
                    var matchesTerm = !term || searchable.indexOf(term) !== -1;
                    var matchesYear = !year || cardYear === year;
                    var matchesType = !type || cardType === type;
                    var showCard = matchesTerm && matchesYear && matchesType;
                    card.classList.toggle('is-hidden', !showCard);
                    if (showCard) {
                        visible += 1;
                    }
                });

                if (countNode) {
                    countNode.textContent = '当前显示 ' + visible + ' 部影片';
                }
                if (emptyNode) {
                    emptyNode.classList.toggle('is-visible', visible === 0);
                }
            }

            [searchInput, yearSelect, typeSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', apply);
                    control.addEventListener('change', apply);
                }
            });
            panel.addEventListener('submit', function (event) {
                event.preventDefault();
                apply();
            });
            apply();
        });
    }

    function loadHlsLibrary() {
        if (window.Hls) {
            return Promise.resolve(window.Hls);
        }
        if (hlsPromise) {
            return hlsPromise;
        }
        hlsPromise = new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = HLS_CDN;
            script.async = true;
            script.onload = function () {
                if (window.Hls) {
                    resolve(window.Hls);
                    return;
                }
                reject(new Error('Hls is not available'));
            };
            script.onerror = function () {
                reject(new Error('Unable to load HLS library'));
            };
            document.head.appendChild(script);
        });
        return hlsPromise;
    }

    function setPlayerState(player, text) {
        var state = player.querySelector('[data-player-state]');
        if (state) {
            state.textContent = text;
        }
    }

    function playWithNativeHls(video, src) {
        video.src = src;
        return video.play();
    }

    function playWithHlsJs(video, src) {
        return loadHlsLibrary().then(function (Hls) {
            if (!Hls.isSupported()) {
                video.src = src;
                return video.play();
            }
            if (video._hlsInstance) {
                video._hlsInstance.destroy();
            }
            var hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            video._hlsInstance = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            return new Promise(function (resolve, reject) {
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    video.play().then(resolve).catch(reject);
                });
                hls.on(Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        reject(new Error(data.details || 'HLS playback error'));
                    }
                });
            });
        });
    }

    function initPlayers() {
        document.querySelectorAll('[data-player]').forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('[data-player-button]');
            if (!video || !button) {
                return;
            }
            var src = video.getAttribute('data-src');
            var start = function () {
                if (!src) {
                    setPlayerState(player, '当前播放源暂不可用');
                    return;
                }
                setPlayerState(player, '正在加载播放源...');
                video.controls = true;
                player.classList.add('is-playing');
                var playTask = video.canPlayType('application/vnd.apple.mpegurl')
                    ? playWithNativeHls(video, src)
                    : playWithHlsJs(video, src);
                Promise.resolve(playTask).then(function () {
                    setPlayerState(player, '正在播放');
                }).catch(function () {
                    player.classList.remove('is-playing');
                    setPlayerState(player, '点击重试播放');
                });
            };
            button.addEventListener('click', function (event) {
                event.preventDefault();
                start();
            });
            video.addEventListener('click', function () {
                if (video.paused) {
                    start();
                }
            });
        });
    }

    ready(function () {
        initMobileMenu();
        initFooterYear();
        initBackToTop();
        initHeroCarousel();
        initFilterPanels();
        initPlayers();
    });
}());
