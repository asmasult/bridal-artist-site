  (function () {
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('dragstart', function (e) { e.preventDefault(); });
  })();

  (function () {
    var root = document.documentElement;
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) { return; }

    var getStored = function () {
      try { return localStorage.getItem('theme'); } catch (e) { return null; }
    };
    var setStored = function (value) {
      try { localStorage.setItem('theme', value); } catch (e) {}
    };
    var effectiveTheme = function () {
      var explicit = root.getAttribute('data-theme');
      if (explicit === 'dark' || explicit === 'light') { return explicit; }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };
    var render = function () {
      var theme = effectiveTheme();
      toggle.classList.toggle('is-dark', theme === 'dark');
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    };

    var stored = getStored();
    if (stored === 'light' || stored === 'dark') { root.setAttribute('data-theme', stored); }
    render();

    toggle.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      setStored(next);
      render();
    });
  })();

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
    // How far each slide zooms in while active (1 = no zoom, 1.08 = 8%).
    // Bump this to zoom more; override per-slide with a `zoom` field in
    // hero-gallery.json.
    var HERO_GALLERY_ZOOM = 1.18;

    // Photos/videos come from hero-gallery.json instead of being listed
    // here. To change what shows: add or remove files under Image/<folder>/,
    // then run `python generate-hero-gallery.py` to rebuild that file — no
    // code edits needed. See generate-hero-gallery.py for the defaults it
    // applies (duration for images, slow motion for videos).
    var HERO_GALLERY_FALLBACK = [
      { type: 'image', src: 'Image/face/zainab_Face_1.jpeg', duration: 4500 }
    ];

    var buildHeroGallery = function (heroGallerySlides) {
    document.querySelectorAll('.hero-gallery').forEach(function (gallery) {
      var frame = gallery.querySelector('.hero-gallery__frame');
      var dotsWrap = gallery.querySelector('.hero-gallery__dots');
      if (!frame || !heroGallerySlides.length) { return; }

      // A previous run may have already populated this frame — clear it
      // before rebuilding so slides don't double up.
      frame.innerHTML = '';
      if (dotsWrap) { dotsWrap.innerHTML = ''; }

      var slideEls = heroGallerySlides.map(function (slide, idx) {
        var el;
        if (slide.type === 'video') {
          el = document.createElement('video');
          el.muted = true;
          el.playsInline = true;
          el.preload = idx === 0 ? 'auto' : 'metadata';
          el.src = slide.src;
          var rate = slide.slowMotion || 1;
          el.playbackRate = rate;
          el.addEventListener('loadedmetadata', function () {
            el.playbackRate = rate;
            // Stretch the zoom animation to match the slowed-down runtime
            // so it finishes right as the video ends.
            el.style.setProperty('--hero-gallery-duration', (el.duration / rate) + 's');
          });
        } else {
          el = document.createElement('img');
          el.src = slide.src;
          el.alt = '';
          el.loading = idx === 0 ? 'eager' : 'lazy';
          el.style.setProperty('--hero-gallery-duration', (slide.duration || 4500) / 1000 + 's');
        }
        el.style.setProperty('--hero-gallery-zoom', slide.zoom || HERO_GALLERY_ZOOM);
        el.className = 'hero-gallery__slide' + (idx === 0 ? ' is-active' : '');
        frame.appendChild(el);

        if (dotsWrap) {
          var dot = document.createElement('span');
          dot.className = 'dot' + (idx === 0 ? ' is-active' : '');
          dotsWrap.appendChild(dot);
        }
        return el;
      });

      var dots = gallery.querySelectorAll('.dot');
      if (slideEls.length <= 1 || reduceMotion) { return; }

      var i = 0;
      var imageTimer = null;

      var advance = function () {
        var current = slideEls[i];
        if (current.tagName === 'VIDEO') { current.pause(); }
        if (imageTimer) { clearTimeout(imageTimer); imageTimer = null; }
        current.classList.remove('is-active');
        if (dots[i]) { dots[i].classList.remove('is-active'); }

        i = (i + 1) % slideEls.length;
        var next = slideEls[i];
        next.classList.add('is-active');
        if (dots[i]) { dots[i].classList.add('is-active'); }

        if (next.tagName === 'VIDEO') {
          next.currentTime = 0;
          var p = next.play();
          // If autoplay is blocked, don't get stuck on this slide forever.
          if (p) { p.catch(advance); }
        } else {
          imageTimer = setTimeout(advance, heroGallerySlides[i].duration || 4500);
        }
      };

      // Video slides advance themselves once playback finishes.
      slideEls.forEach(function (el) { if (el.tagName === 'VIDEO') { el.addEventListener('ended', advance); } });

      if (slideEls[0].tagName === 'VIDEO') {
        var p0 = slideEls[0].play();
        if (p0) { p0.catch(advance); }
      } else {
        imageTimer = setTimeout(advance, heroGallerySlides[0].duration || 4500);
      }
    });
    };

    fetch('hero-gallery.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        buildHeroGallery(Array.isArray(data) && data.length ? data : HERO_GALLERY_FALLBACK);
      })
      .catch(function () { buildHeroGallery(HERO_GALLERY_FALLBACK); });
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

