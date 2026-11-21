/* Who reads your code: the sentence lights up word by word as it scrolls through the viewport,
   the two cards come in from either side, and the photo tilts toward the pointer. */
(function () {
  var sec = document.getElementById('who');
  if (!sec || !window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  /* split the sentence into words, keeping the .who-key span around its words */
  var statement = sec.querySelector('.who-statement');
  function split(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) split(n);
    });
  }
  split(statement);
  var words = statement.querySelectorAll('.w');
  sec.classList.add('who-js');
  ScrollTrigger.create({
    trigger: statement, start: 'top 85%', end: 'bottom 45%', scrub: true,
    onUpdate: function (self) {
      var lit = Math.round(self.progress * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < lit);
    }
  });

  /* cards: the person from the left, the engine from the right */
  var person = sec.querySelector('.who-person'), engine = sec.querySelector('.who-engine');
  var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out', duration: 1.1 } });
  tl.fromTo(person, { x: -80, autoAlpha: 0, rotationY: 12, transformPerspective: 1200 }, { x: 0, autoAlpha: 1, rotationY: 0, clearProps: 'transform,opacity,visibility' }, 0)
    .fromTo(engine, { x: 80, autoAlpha: 0, rotationY: -12, transformPerspective: 1200 }, { x: 0, autoAlpha: 1, rotationY: 0, clearProps: 'transform,opacity,visibility' }, 0.12)
    .fromTo(sec.querySelector('.who-rings'), { scale: 0.4, rotation: -120, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 0.6, duration: 1.6 }, 0.3);
  ScrollTrigger.create({ trigger: sec.querySelector('.who-grid'), start: 'top 80%', once: true, onEnter: function () { tl.play(); } });

  /* photo leans toward the pointer */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var img = sec.querySelector('.who-photo img');
    var rx = gsap.quickTo(img, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    var ry = gsap.quickTo(img, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    person.addEventListener('pointermove', function (e) {
      var r = img.getBoundingClientRect();
      ry(gsap.utils.clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / r.width) * 14);
      rx(gsap.utils.clamp(-1, 1, (e.clientY - (r.top + r.height / 2)) / r.height) * -10);
    });
    person.addEventListener('pointerleave', function () { rx(0); ry(0); });
  }
})();
