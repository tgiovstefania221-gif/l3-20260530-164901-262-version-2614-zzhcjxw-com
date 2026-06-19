(function () {
  const video = document.getElementById('moviePlayer');
  const overlay = document.getElementById('playerOverlay');

  if (!video || typeof currentVideoUrl === 'undefined') {
    return;
  }

  const hideOverlay = function () {
    if (overlay) {
      overlay.classList.add('hidden');
    }
  };

  const playVideo = function () {
    hideOverlay();
    const result = video.play();

    if (result && typeof result.catch === 'function') {
      result.catch(function () {});
    }
  };

  const setSource = function () {
    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false
      });

      hls.loadSource(currentVideoUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentVideoUrl;
    } else {
      video.src = currentVideoUrl;
    }
  };

  setSource();

  if (overlay) {
    overlay.addEventListener('click', playVideo);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      playVideo();
    } else {
      video.pause();
    }
  });

  video.addEventListener('play', hideOverlay);
})();
