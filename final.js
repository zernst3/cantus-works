/* Final call to action: the dot grid lights up around the pointer, the button leans toward it,
   and on entry the headline rises word by word, then the button pops and the trust icons draw. */
(function () {
  var sec = document.getElementById('contact');
  if (!sec || !window.gsap) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* pointer light on the dot grid */
  sec.addEventListener('pointermove', function (e) {
    var r = sec.getBoundingClientRect();
    sec.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    sec.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  /* magnetic button: leans toward the pointer while it's near */
  var btn = sec.querySelector('.btn-magnet');
  var zone = sec.querySelector('.final-cta');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var bx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
    var by = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
    zone.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      bx((e.clientX - (r.left + r.width / 2)) * 0.25);
      by((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    zone.addEventListener('pointerleave', function () { bx(0); by(0); });
  }

  if (!window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  sec.classList.add('final-js');

  /* headline words, each in a mask */
  var title = sec.querySelector('.final-title');
  Array.prototype.slice.call(title.children).forEach(function (part) {
    part.innerHTML = part.textContent.split(' ').map(function (w) { return '<span class="w"><span>' + w + '</span></span>'; }).join(' ');
  });

  var trust = sec.querySelector('.final-trust');
  var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  tl.fromTo(title.querySelectorAll('.w > span'), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.07, ease: 'power4.out' }, 0)
    .fromTo('.final-sub', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, 0.45)
    .fromTo(btn, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8, ease: 'back.out(2)' }, 0.65)
    .fromTo(trust.children, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, clearProps: 'transform,opacity,visibility' }, 0.8)
    .add(function () { trust.classList.add('drawn'); }, 1);
  ScrollTrigger.create({ trigger: sec, start: 'top 70%', once: true, onEnter: function () { tl.play(); } });
})();
