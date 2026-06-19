(function () {
    'use strict';

    function selectAll(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function setupMobileMenu() {
        var button = document.querySelector('[data-mobile-menu-button]');
        var nav = document.querySelector('[data-mobile-nav]');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function setupBackToTop() {
        var button = document.querySelector('[data-back-to-top]');
        if (!button) {
            return;
        }
        window.addEventListener('scroll', function () {
            button.classList.toggle('is-visible', window.scrollY > 420);
        });
        button.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function setupImageFallbacks() {
        selectAll('img').forEach(function (img) {
            img.addEventListener('error', function () {
                img.classList.add('is-missing');
                img.setAttribute('aria-label', img.getAttribute('alt') || '影片图片');
            }, { once: true });
        });
    }

    function setupHeroCarousel() {
        var root = document.querySelector('[data-hero-carousel]');
        if (!root) {
            return;
        }
        var slides = selectAll('[data-hero-slide]', root);
        var dots = selectAll('[data-hero-dot]', root);
        var nextButton = root.querySelector('[data-hero-next]');
        var prevButton = root.querySelector('[data-hero-prev]');
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

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                restart();
            });
        });

        if (nextButton) {
            nextButton.addEventListener('click', function () {
                show(current + 1);
                restart();
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', function () {
                show(current - 1);
                restart();
            });
        }

        show(0);
        restart();
    }

    function setupFilters() {
        selectAll('[data-filter-panel]').forEach(function (panel) {
            var searchInput = panel.querySelector('[data-search-input]');
            var regionSelect = panel.querySelector('[data-filter-region]');
            var typeSelect = panel.querySelector('[data-filter-type]');
            var yearSelect = panel.querySelector('[data-filter-year]');
            var countTarget = panel.querySelector('[data-filter-count]');
            var grid = panel.parentElement ? panel.parentElement.querySelector('[data-filter-grid]') : null;
            var cards = grid ? selectAll('.movie-card', grid) : [];

            var params = new URLSearchParams(window.location.search);
            var query = params.get('q');
            if (query && searchInput && !searchInput.value) {
                searchInput.value = query;
            }

            function applyFilter() {
                var q = normalize(searchInput && searchInput.value);
                var region = normalize(regionSelect && regionSelect.value);
                var type = normalize(typeSelect && typeSelect.value);
                var year = normalize(yearSelect && yearSelect.value);
                var visible = 0;

                cards.forEach(function (card) {
                    var haystack = normalize([
                        card.getAttribute('data-title'),
                        card.getAttribute('data-region'),
                        card.getAttribute('data-type'),
                        card.getAttribute('data-year'),
                        card.getAttribute('data-tags')
                    ].join(' '));
                    var matchesQuery = !q || haystack.indexOf(q) !== -1;
                    var matchesRegion = !region || normalize(card.getAttribute('data-region')) === region;
                    var matchesType = !type || normalize(card.getAttribute('data-type')) === type;
                    var matchesYear = !year || normalize(card.getAttribute('data-year')) === year;
                    var show = matchesQuery && matchesRegion && matchesType && matchesYear;
                    card.classList.toggle('is-hidden-by-filter', !show);
                    if (show) {
                        visible += 1;
                    }
                });

                if (countTarget) {
                    countTarget.textContent = '当前显示 ' + visible + ' 部影片';
                }
            }

            [searchInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', applyFilter);
                    control.addEventListener('change', applyFilter);
                }
            });

            applyFilter();
        });
    }

    function setupPlayer() {
        selectAll('[data-player-shell]').forEach(function (shell) {
            var video = shell.querySelector('video');
            var button = shell.querySelector('[data-player-start]');
            var message = shell.querySelector('[data-player-message]');
            var source = shell.getAttribute('data-video-url');
            var hlsInstance = null;

            function writeMessage(text) {
                if (message) {
                    message.textContent = text;
                }
            }

            function startPlayback() {
                if (!video || !source) {
                    writeMessage('当前播放源不可用。');
                    return;
                }

                shell.classList.add('is-playing');
                writeMessage('正在加载播放源…');

                if (window.Hls && window.Hls.isSupported()) {
                    if (hlsInstance) {
                        hlsInstance.destroy();
                    }
                    hlsInstance = new window.Hls({ enableWorker: true });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        video.play().catch(function () {
                            writeMessage('浏览器阻止了自动播放，请再次点击播放控件。');
                        });
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            writeMessage('播放源加载异常，请刷新页面重试。');
                        }
                    });
                    return;
                }

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    video.addEventListener('loadedmetadata', function () {
                        video.play().catch(function () {
                            writeMessage('浏览器阻止了自动播放，请再次点击播放控件。');
                        });
                    }, { once: true });
                    return;
                }

                video.src = source;
                video.play().catch(function () {
                    writeMessage('当前浏览器不支持该 HLS 播放源，请更换浏览器。');
                });
            }

            if (button) {
                button.addEventListener('click', startPlayback);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupBackToTop();
        setupImageFallbacks();
        setupHeroCarousel();
        setupFilters();
        setupPlayer();
    });
}());
