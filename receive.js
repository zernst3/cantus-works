/* What you receive: three objects always on show. The active one gets a ring and a scan sweep; pressing an
   object or its name makes it active, the highlight cycles on its own while the section is on
   screen (paused on hover).
   Everything works without GSAP; GSAP adds the entrance. */
(function () {
  var sec = document.getElementById('receive');
  if (!sec) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var row = sec.querySelector('.rcv-row');
  var cols = Array.prototype.slice.call(sec.querySelectorAll('.rcv-col'));
  var docs = cols.map(function (c) { return c.querySelector('.rcv-doc'); });
  var items = cols.map(function (c) { return c.querySelector('.rcv-item'); });
  var narrow = window.matchMedia('(max-width: 900px)');
  var CYCLE = 4500;
  var active = 0, timer = null, inView = false, hovering = false;

  /* waveform bars for the call card */
  var wave = sec.querySelector('.call-wave');
  for (var w = 0; w < 28; w++) {
    var bar = document.createElement('i');
    bar.style.setProperty('--h', (30 + 65 * Math.abs(Math.sin(w * 0.9) * Math.cos(w * 0.37))).toFixed(0) + '%');
    bar.style.animationDelay = (-(w % 7) * 0.16).toFixed(2) + 's';
    wave.appendChild(bar);
  }

  function show(i) {
    if (i !== active) {
      docs[i].classList.remove('lift');
      if (!reduced) { void docs[i].offsetWidth; docs[i].classList.add('lift'); }
      active = i;
      /* on small screens the objects sit in a swipe row: bring the active one into view (row only, not the page) */
      if (narrow.matches && inView) row.scrollTo({ left: cols[i].offsetLeft - parseFloat(getComputedStyle(row).paddingLeft), behavior: reduced ? 'auto' : 'smooth' });
    }
    cols.forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
    items.forEach(function (it, k) {
      it.classList.toggle('is-active', k === i);
      it.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      it.classList.remove('running');
    });
    if (timer) { void items[i].offsetWidth; items[i].classList.add('running'); }
  }

  /* autoplay: only while the section is on screen and the pointer isn't over it */
  function play() {
    if (reduced || timer || !inView || hovering) return;
    timer = setInterval(function () { show((active + 1) % cols.length); }, CYCLE);
    sec.style.setProperty('--cycle', CYCLE + 'ms');
    show(active);
  }
  function stop() { clearInterval(timer); timer = null; items.forEach(function (it) { it.classList.remove('running'); }); }

  cols.forEach(function (c, k) {
    function pick() { stop(); show(k); play(); }
    items[k].addEventListener('click', pick);
    docs[k].addEventListener('click', pick);
  });
  row.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; stop(); } });
  row.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; play(); } });


  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      inView ? play() : stop();
    }, { threshold: 0.35 }).observe(row);
  }

  if (reduced || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  sec.classList.add('rcv-js');

  /* entrance: the three objects rise and tip up one after another, then the rest follows in levels */
  var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  tl.fromTo(cols, { y: 90, rotationX: 22, autoAlpha: 0, transformPerspective: 1200, transformOrigin: '50% 100%' },
      { y: 0, rotationX: 0, autoAlpha: 1, duration: 1.1, stagger: 0.14, clearProps: 'transform,opacity,visibility' }, 0)
    .fromTo(sec.querySelectorAll('.rcv-promises li, #receive .dated, #receive .cta-row'), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, clearProps: 'transform,opacity,visibility' }, 0.7)
    .add(function () { sec.querySelector('.rcv-mark').classList.add('is-drawn'); }, 1.2);
  ScrollTrigger.create({ trigger: row, start: 'top 80%', once: true, onEnter: function () { tl.play(); } });
})();
