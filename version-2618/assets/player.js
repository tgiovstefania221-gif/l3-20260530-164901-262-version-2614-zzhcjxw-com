(function () {
  function setupPlayer(shell) {
    var video = shell.querySelector('video');
    var button = shell.querySelector('[data-play]');
    var source = video ? video.getAttribute('data-src') : '';
    var attached = false;
    var hls = null;

    function markError() {
      shell.classList.add('has-error');
    }

    function attachSource() {
      if (attached || !video || !source) {
        return;
      }
      attached = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              markError();
              hls.destroy();
            }
          }
        });
      } else {
        markError();
      }
    }

    function playVideo() {
      attachSource();
      var promise = video.play();
      if (promise && typeof promise.then === 'function') {
        promise.then(function () {
          shell.classList.add('is-playing');
        }).catch(function () {
          markError();
        });
      } else {
        shell.classList.add('is-playing');
      }
    }

    if (button && video) {
      button.addEventListener('click', playVideo);
      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        shell.classList.remove('is-playing');
      });
      video.addEventListener('error', markError);
      video.addEventListener('click', function () {
        if (video.paused) {
          playVideo();
        }
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  document.querySelectorAll('[data-player]').forEach(setupPlayer);
})();
