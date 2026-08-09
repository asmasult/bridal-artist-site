  var bandMessages = [];
  fetch('messages.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { if (Array.isArray(data) && data.length) { bandMessages = data; } })
    .catch(function () {});

  (function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var band = document.querySelector('.media-band');
    if (band) {
      var bandSlides = band.querySelectorAll('.media-band__slide');
      var bandVideos = band.querySelectorAll('.media-band__video');
      bandVideos.forEach(function (v) {
        v.addEventListener('loadeddata', function () { v.classList.add('is-ready'); });
      });

      if (!reduceMotion && bandSlides.length) {
        var bandIndex = 0;
        var bandInView = false;

        var play = function (video) {
          var p = video.play();
          if (p) { p.catch(function () {}); }
        };

        var goToNext = function () {
          var current = bandSlides[bandIndex];
          var currentVideo = current.querySelector('.media-band__video');
          current.classList.remove('is-active');
          currentVideo.pause();
          bandIndex = (bandIndex + 1) % bandSlides.length;
          var next = bandSlides[bandIndex];
          var nextVideo = next.querySelector('.media-band__video');
          next.classList.add('is-active');
          nextVideo.currentTime = 0;
          if (bandInView) { play(nextVideo); }
        };

        bandVideos.forEach(function (v) { v.addEventListener('ended', goToNext); });

        var io = ('IntersectionObserver' in window) && new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            bandInView = entry.isIntersecting;
            var activeVideo = bandSlides[bandIndex].querySelector('.media-band__video');
            if (bandInView) { play(activeVideo); } else { activeVideo.pause(); }
          });
        }, { threshold: 0.1 });
        if (io) { io.observe(band); }

        var msgIndex = 0;
        var rotateCaption = function () {
          if (!bandInView || bandMessages.length <= 1) { return; }
          var slide = bandSlides[bandIndex];
          var caption = slide.querySelector('.media-band__caption');
          if (!caption) { return; }
          msgIndex = (msgIndex + 1) % bandMessages.length;
          var msg = bandMessages[msgIndex];
          caption.classList.add('is-fading');
          setTimeout(function () {
            var eyebrowEl = caption.querySelector('.eyebrow');
            var headEl = caption.querySelector('h2');
            if (eyebrowEl) { eyebrowEl.textContent = msg.eyebrow; }
            if (headEl) { headEl.textContent = msg.headline; }
            caption.classList.remove('is-fading');
          }, 350);
        };
        var captionInterval = window.matchMedia('(max-width: 599px)').matches ? 7000 : 4500;
        setInterval(rotateCaption, captionInterval);
      }
    }
    document.querySelectorAll('.hero-gallery').forEach(function (gallery) {
      var slides = gallery.querySelectorAll('.hero-gallery__slide');
      var dots = gallery.querySelectorAll('.dot');
      if (slides.length <= 1 || reduceMotion) { return; }
      var i = 0;
      setInterval(function () {
        slides[i].classList.remove('is-active');
        if (dots[i]) { dots[i].classList.remove('is-active'); }
        i = (i + 1) % slides.length;
        slides[i].classList.add('is-active');
        if (dots[i]) { dots[i].classList.add('is-active'); }
      }, 4500);
    });
  })();

  (function () {
    document.querySelectorAll('.swatch-carousel').forEach(function (carousel) {
      var rail = carousel.querySelector('.swatch-rail');
      var prevBtn = carousel.querySelector('.swatch-nav--prev');
      var nextBtn = carousel.querySelector('.swatch-nav--next');
      if (!rail || !prevBtn || !nextBtn) { return; }

      var updateNav = function () {
        var maxScroll = rail.scrollWidth - rail.clientWidth - 1;
        prevBtn.disabled = rail.scrollLeft <= 0;
        nextBtn.disabled = rail.scrollLeft >= maxScroll;
      };

      prevBtn.addEventListener('click', function () {
        rail.scrollBy({ left: -rail.clientWidth, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', function () {
        rail.scrollBy({ left: rail.clientWidth, behavior: 'smooth' });
      });

      rail.addEventListener('scroll', function () {
        window.requestAnimationFrame(updateNav);
      }, { passive: true });
      window.addEventListener('resize', updateNav);
      updateNav();
    });
  })();

  (function () {
    var wordmark = document.querySelector('.wordmark');
    var band = document.querySelector('.media-band');
    if (!wordmark || !band || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

    var minScale = 1, maxScale = 1.3;
    var ticking = false;

    var update = function () {
      ticking = false;
      var bandHeight = band.offsetHeight || 1;
      var progress = Math.min(Math.max(window.scrollY / bandHeight, 0), 1);
      wordmark.style.setProperty('--wm-scale', (minScale + (maxScale - minScale) * progress).toFixed(3));
    };

    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    update();
  })();

  (function () {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

