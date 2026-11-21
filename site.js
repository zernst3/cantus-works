(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- nav: glass once the page scrolls ---------- */
  var hdr = document.querySelector('header.site');
  if (hdr) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        hdr.classList.toggle('scrolled', window.scrollY > 6);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    /* header height, so the hero can fill exactly the rest of the screen */
    var setHdr = function () { root.style.setProperty('--hdr-h', hdr.offsetHeight + 'px'); };
    window.addEventListener('resize', setHdr);
    setHdr();
  }

  /* ---------- reveals: calm rise-in, once, only when motion is allowed ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    root.classList.add('anim');
    var sel = '.blog-hero > *, .problem, .svc-note, .teaser p, section h2, .post, .cta-center';
    var els = document.querySelectorAll(sel);
    var counts = new Map();
    els.forEach(function (el) {
      el.setAttribute('data-reveal', '');
      var p = el.parentElement;
      var i = counts.get(p) || 0;
      counts.set(p, i + 1);
      el.style.transitionDelay = (Math.min(i, 6) * 75) + 'ms';
    });
    /* reversible: elements rise in on entering, and leave in the direction they exit
       (up and out past the top when scrolling down; back down when scrolling up) */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) {
          el.classList.remove('above');
          el.classList.add('in-view');
          if (!el.dataset.seen) {
            el.dataset.seen = '1';
            /* stagger only on the first entrance; afterwards respond instantly */
            setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
          } else {
            el.style.transitionDelay = '';
          }
        } else {
          el.classList.remove('in-view');
          el.classList.toggle('above', e.boundingClientRect.top < 0);
        }
      });
    }, { threshold: 0, rootMargin: '-6% 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

})();
