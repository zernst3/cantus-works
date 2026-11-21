/* Cantus Works hero: GSAP intro, scrambled "codebase", floating report card with pointer tilt. */
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduced) { root.classList.remove('hero-anim'); return; }

  var hero = document.querySelector('.hero');
  var scr = hero.querySelector('.scr');
  var stage = hero.querySelector('.report-stage');
  var tilt = hero.querySelector('.report-tilt');
  var crit = hero.querySelector('.sev.crit');
  var scan = hero.querySelector('.scanline');
  var wide = window.matchMedia('(min-width: 900px)');
  var base = wide.matches ? { x: 5, y: -9 } : { x: 3, y: -4 };

  /* ---------- "codebase" decodes from code characters ---------- */
  function scramble(el, duration) {
    var final = el.textContent;
    var glyphs = '{}<>/[]=+*#$%01;:_';
    var state = { p: 0 };
    el.style.display = 'inline-block';
    el.style.minWidth = el.offsetWidth + 'px';
    el.classList.add('scrambling');
    return gsap.to(state, {
      p: 1, duration: duration, ease: 'none',
      onUpdate: function () {
        var done = Math.floor(state.p * final.length);
        var out = final.slice(0, done);
        for (var i = done; i < final.length; i++) out += glyphs[(Math.random() * glyphs.length) | 0];
        el.textContent = out;
        el.classList.toggle('scrambling', state.p < 1);
      },
      onComplete: function () {
        el.textContent = final;
        el.classList.remove('scrambling');
        el.style.minWidth = '';
      }
    });
  }

  gsap.set(hero.querySelector('.report-ghost'), { z: -90 });
  gsap.set(hero.querySelectorAll('.chip'), { z: 70 });
  gsap.set(tilt, { rotationX: base.x, rotationY: base.y });

  /* ---------- intro ---------- */
  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  root.classList.remove('hero-anim');

  tl.fromTo('.hero h1 .w > span', { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.07, ease: 'power4.out' }, 0)
    .add(scramble(scr, 0.9), 0.2)
    /* no clip-path here: WebKit stops painting the gradient text under a clipped ancestor */
    .fromTo('.hero h1 .hl2',
      { opacity: 0, y: 28, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', clearProps: 'opacity,transform,filter' }, 0.6)
    .fromTo(['.standfirst', '.hero-cta', '.hero-note'], { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12 }, 1.1)
    .fromTo(stage, { y: 90, opacity: 0, rotationX: 22, transformPerspective: 1400 },
      { y: 0, opacity: 1, rotationX: 0, duration: 1.5 }, 0.35)
    .fromTo('.report-caption', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.4)
    .fromTo('.chip', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, stagger: 0.18, ease: 'back.out(2.2)' }, 1.3)
    .add(startScan, 1.6)
    .add(startFloat, 1.5);

  /* ---------- scan pass, then the critical pill pings ---------- */
  function startScan() {
    gsap.timeline({ repeat: -1, repeatDelay: 5 })
      .set(scan, { yPercent: -100, top: 0, opacity: 1 })
      .to(scan, { top: '100%', duration: 1.6, ease: 'power1.inOut' })
      .to(scan, { opacity: 0, duration: 0.3 }, '-=0.3')
      .add(function () { crit.classList.add('ping'); }, 0.45);
  }

  /* ---------- float: card bobs, ground shadow breathes against it, chips drift ---------- */
  function startFloat() {
    var float = { duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 };
    gsap.to('.report-float', Object.assign({ y: -18, rotation: 0.5 }, float));
    gsap.to('.report-shadow', Object.assign({ scaleX: 0.8, opacity: 0.5 }, float));
    gsap.to('.chip-a', { y: -10, duration: 2.7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.chip-b', { y: 9, x: -4, duration: 3.9, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.4 });
  }

  /* ---------- pointer tilt (desktop with a real pointer only) ---------- */
  if (wide.matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    var ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    hero.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var nx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      var ny = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      ry(base.y + nx * 18);
      rx(base.x - ny * 14);
    });
    hero.addEventListener('pointerleave', function () { rx(base.x); ry(base.y); });
  }
})();
