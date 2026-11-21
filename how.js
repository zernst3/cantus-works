/* How it works: the four step cards as a 3D coverflow.
   One number, state.c (0..3), says which card is in front; layout() places every card from it:
   the front card large and flat, the others pushed back, scaled down and turned in perspective.
   Desktop: the section pins and scrolling moves state.c, snapping to each card.
   Small or short screens: it advances on its own while on screen, plus swipe and tap.
   Cards fly in from the left once, then keep a slow float; the front card tilts toward the pointer. */
(function () {
  var how = document.getElementById('how');
  if (!how || !window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  var pinEl = how.querySelector('.how-pin');
  var stage = how.querySelector('.how-steps');
  var steps = gsap.utils.toArray('.how-step', how);
  var cards = steps.map(function (s) { return s.querySelector('.how-card'); });
  var dots = gsap.utils.toArray('.how-dots i', how);
  var countNow = how.querySelector('.how-count-now');
  var last = steps.length - 1;
  var state = { c: 0 };
  var current = -1;

  how.classList.add('how-3d');

  function layout() {
    var w = steps[0].offsetWidth;
    steps.forEach(function (s, i) {
      var d = i - state.c, a = Math.abs(d), side = d < 0 ? -1 : 1;
      gsap.set(s, {
        x: a <= 1 ? d * w * 0.6 : side * (w * 0.6 + (a - 1) * w * 0.28),
        z: -Math.min(a, 3) * 170,
        rotationY: -gsap.utils.clamp(-1, 1, d) * 42,
        scale: 1 - Math.min(a, 2) * 0.09,
        zIndex: 100 - Math.round(a * 10)
      });
      s.style.setProperty('--shade', (Math.min(a, 2) * 0.17).toFixed(3));
    });
    var i = Math.round(state.c);
    if (i !== current) {
      if (current >= 0) gsap.to(cards[current], { rotationX: 0, rotationY: 0, duration: 0.6, overwrite: 'auto' });
      current = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
      countNow.textContent = '0' + (i + 1);
    }
  }
  layout();
  window.addEventListener('resize', layout);

  /* entrance: cards fly in from off the left edge, the far one first, tilted and blurred by speed */
  gsap.fromTo(cards, {
    x: function (i) { return -(window.innerWidth * 0.6 + i * 90); },
    y: function (i) { return 50 - i * 16; },
    rotation: -10, autoAlpha: 0, filter: 'blur(10px)'
  }, {
    x: 0, y: 0, rotation: 0, autoAlpha: 1, filter: 'blur(0px)',
    duration: 1.2, ease: 'power4.out', stagger: { each: 0.13, from: 'end' },
    clearProps: 'filter,visibility,opacity',
    scrollTrigger: { trigger: stage, start: 'top 85%', once: true },
    onComplete: function () {
      /* then a slow float, each card on its own phase */
      cards.forEach(function (card, i) {
        gsap.to(card, { y: -9, duration: 2.4 + i * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
    }
  });

  /* front card leans toward the pointer */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    stage.addEventListener('pointermove', function (e) {
      var card = cards[current], r = card.getBoundingClientRect();
      var nx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var ny = (e.clientY - (r.top + r.height / 2)) / r.height;
      gsap.to(card, { rotationY: gsap.utils.clamp(-1, 1, nx) * 9, rotationX: gsap.utils.clamp(-1, 1, ny) * -7, transformPerspective: 1200, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    });
    stage.addEventListener('pointerleave', function () {
      gsap.to(cards[current], { rotationX: 0, rotationY: 0, duration: 0.8, ease: 'power3.out', overwrite: 'auto' });
    });
  }

  var mm = gsap.matchMedia();

  /* desktop: pin and let the scroll turn the cards, snapping to each one */
  mm.add('(min-width: 900px) and (min-height: 700px)', function () {
    var st = ScrollTrigger.create({
      trigger: pinEl, start: 'center center',
      end: function () { return '+=' + Math.round(window.innerHeight * 2.2); },
      pin: true, anticipatePin: 1, scrub: 0.8,
      animation: gsap.fromTo(state, { c: 0 }, { c: last, ease: 'none', onUpdate: layout }),
      snap: { snapTo: 1 / last, duration: { min: 0.25, max: 0.7 }, ease: 'power2.inOut', delay: 0.05 }
    });
    function goTo(i) { window.scrollTo({ top: st.start + (st.end - st.start) * (i / last), behavior: 'smooth' }); }
    function onClick(e) {
      var s = e.target.closest('.how-step, .how-dots i');
      if (!s) return;
      var i = s.matches('.how-step') ? steps.indexOf(s) : dots.indexOf(s);
      if (i !== current) goTo(i);
    }
    pinEl.addEventListener('click', onClick);
    return function () { pinEl.removeEventListener('click', onClick); };
  });

  /* small or short screens: step on its own every few seconds while visible; swipe or tap to move */
  mm.add('(max-width: 899px), (max-height: 699px)', function () {
    var timer = null;
    function goTo(i) {
      gsap.to(state, { c: i, duration: 0.9, ease: 'power3.inOut', onUpdate: layout, overwrite: true });
      restart();
    }
    function next() { goTo(current >= last ? 0 : current + 1); }
    function restart() { if (timer) { clearInterval(timer); timer = setInterval(next, 4000); } }
    var vis = ScrollTrigger.create({
      trigger: stage, start: 'top 85%', end: 'bottom 15%',
      onToggle: function (self) {
        clearInterval(timer); timer = null;
        if (self.isActive) timer = setInterval(next, 4000);
      }
    });
    var x0 = null;
    function down(e) { x0 = e.clientX; }
    function up(e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) goTo(gsap.utils.clamp(0, last, current + (dx < 0 ? 1 : -1)));
      else {
        var s = e.target.closest('.how-step');
        if (s && steps.indexOf(s) !== current) goTo(steps.indexOf(s));
      }
    }
    function onDot(e) { var d = e.target.closest('.how-dots i'); if (d) goTo(dots.indexOf(d)); }
    stage.addEventListener('pointerdown', down);
    stage.addEventListener('pointerup', up);
    pinEl.addEventListener('click', onDot);
    return function () {
      clearInterval(timer); vis.kill();
      stage.removeEventListener('pointerdown', down);
      stage.removeEventListener('pointerup', up);
      pinEl.removeEventListener('click', onDot);
    };
  });
})();
