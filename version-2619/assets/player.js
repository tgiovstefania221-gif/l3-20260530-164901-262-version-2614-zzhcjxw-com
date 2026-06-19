(function () {
  function setStatus(container, message) {
    var status = container.querySelector('[data-player-status]');
    if (status) {
      status.textContent = message;
    }
  }

  function loadVideo(container, video, source) {
    if (!source) {
      setStatus(container, '未找到播放源。');
      return Promise.reject(new Error('missing video source'));
    }

    if (video.dataset.loaded === 'true') {
      return video.play();
    }

    video.dataset.loaded = 'true';
    setStatus(container, '正在加载播放源，请稍候...');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.load();
      return video.play().then(function () {
        setStatus(container, '正在播放。');
      });
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      window.addEventListener('beforeunload', function () {
        hls.destroy();
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        video.play().then(function () {
          setStatus(container, '正在播放。');
        }).catch(function () {
          setStatus(container, '播放源已加载，可使用播放器控制栏开始播放。');
        });
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          setStatus(container, '播放加载失败，请刷新页面后重试。');
        }
      });
      return Promise.resolve();
    }

    setStatus(container, '当前浏览器不支持 HLS 播放，请更换现代浏览器。');
    return Promise.reject(new Error('hls not supported'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.player-card').forEach(function (container) {
      var video = container.querySelector('[data-video-src]');
      var button = container.querySelector('[data-player-start]');
      if (!video || !button) {
        return;
      }
      var source = video.getAttribute('data-video-src');
      button.addEventListener('click', function () {
        button.classList.add('hidden');
        loadVideo(container, video, source).catch(function () {
          button.classList.remove('hidden');
        });
      });
    });
  });
})();
