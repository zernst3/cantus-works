/* Services: the inspection estimator, the remediation hours calculator, the title that follows the
   card you point at, and a pointer spotlight on each card. With GSAP and motion allowed it also
   plays the entrance (cards rise, nodes pop, prices count up, highlight sweeps).
   The controls work without GSAP. */
(function () {
  var sec = document.getElementById('services');
  if (!sec) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = !reduced && !!(window.gsap && window.ScrollTrigger);
  var cards = Array.prototype.slice.call(sec.querySelectorAll('.svc'));

  function money(v) { return '$' + Math.round(v).toLocaleString('en-US'); }

  /* a number that glides to its new value (or jumps, without motion) */
  function glide(el, to, fmt) {
    if (!motion) { el.textContent = fmt(to); return; }
    el._o = el._o || { v: to };
    gsap.to(el._o, { v: to, duration: 0.45, ease: 'power2.out', overwrite: true, onUpdate: function () { el.textContent = fmt(el._o.v); } });
  }

  /* ---------- inspection estimator ----------
     $3,000 up to 50,000 lines, $20 per 1,000 lines to 300,000, then $30 per 1,000 above, rounded to the nearest $250 */
  var range = document.getElementById('est-range');
  var priceEl = document.getElementById('est-price');
  var linesEl = document.getElementById('est-lines');
  var barsEl = sec.querySelector('.est-bars');
  var presets = Array.prototype.slice.call(sec.querySelectorAll('.est-presets button'));
  var BARS = 44;
  for (var b = 0; b < BARS; b++) {
    var i = document.createElement('i');
    i.style.height = (30 + 62 * Math.abs(Math.sin(b * 1.73) * Math.cos(b * 0.41))).toFixed(0) + '%';   /* uneven, like line lengths */
    barsEl.appendChild(i);
  }
  var bars = barsEl.children;
  function estimate(lines) {
    var p = lines <= 50000 ? 3000 : lines <= 300000 ? 3000 + 20 * ((lines - 50000) / 1000) : 8000 + 30 * ((lines - 300000) / 1000);
    return Math.round(p / 250) * 250;
  }
  function updateEstimate() {
    var lines = Number(range.value), max = Number(range.max);
    var price = estimate(lines);
    glide(priceEl, price, function (v) { return 'Estimated: ' + money(Math.round(v / 250) * 250); });
    linesEl.textContent = lines.toLocaleString('en-US') + ' lines';
    var findQuote = document.getElementById('find-quote');
    if (findQuote) findQuote.href = '/quote?need=find&lines=' + lines;
    range.style.setProperty('--fill', (lines / max * 100).toFixed(1) + '%');
    range.setAttribute('aria-valuetext', lines.toLocaleString('en-US') + ' lines, Estimated: ' + money(price));
    var on = lines > 0 ? Math.max(1, Math.ceil(lines / max * BARS)) : 0;
    for (var k = 0; k < BARS; k++) bars[k].classList.toggle('on', k < on);
    presets.forEach(function (p) { p.classList.toggle('is-on', Number(p.dataset.lines) === lines); });
  }
  range.addEventListener('input', updateEstimate);
  presets.forEach(function (p) {
    p.addEventListener('click', function () { range.value = p.dataset.lines; updateEstimate(); });
  });
  updateEstimate();

  /* ---------- remediation hours: $150 an hour, ten-hour minimum, in steps of five ---------- */
  var hours = 10, MIN = 10, MAX = 80, RATE = 150;
  var hoursN = document.getElementById('hours-n');
  var hoursTotal = document.getElementById('hours-total');
  var blocksEl = sec.querySelector('.hours-blocks');
  var hourBtns = Array.prototype.slice.call(sec.querySelectorAll('.hours-btn'));
  for (var h = 0; h < MAX / 5; h++) blocksEl.appendChild(document.createElement('i'));
  function updateHours() {
    glide(hoursN, hours, function (v) { return String(Math.round(v)); });
    glide(hoursTotal, hours * RATE, money);
    Array.prototype.forEach.call(blocksEl.children, function (blk, k) {
      blk.classList.toggle('on', k < hours / 5);
      blk.classList.toggle('min', k < MIN / 5);
    });
    hourBtns[0].disabled = hours <= MIN;
    hourBtns[1].disabled = hours >= MAX;
  }
  hourBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      hours = Math.min(MAX, Math.max(MIN, hours + Number(btn.dataset.step)));
      updateHours();
    });
  });
  updateHours();

  /* ---------- title follows the card you're on; spotlight follows the pointer ---------- */
  var words = Array.prototype.slice.call(sec.querySelectorAll('.svc-title span'));
  function focusWord(i) {
    words.forEach(function (w, k) { w.classList.toggle('lit', k === i); w.classList.toggle('dim', i >= 0 && k !== i); });
  }
  cards.forEach(function (card, i) {
    card.addEventListener('pointerenter', function () { focusWord(i); });
    card.addEventListener('pointerleave', function () { focusWord(-1); });
    card.addEventListener('focusin', function () { focusWord(i); });
    card.addEventListener('focusout', function () { focusWord(-1); });
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  if (!motion) return;
  gsap.registerPlugin(ScrollTrigger);
  sec.classList.add('svc-js');

  /* ---------- entrance ---------- */
  var nodes = Array.prototype.slice.call(sec.querySelectorAll('.svc-node'));
  var amts = Array.prototype.slice.call(sec.querySelectorAll('.price .amt'));
  var mark = sec.querySelector('.svc-mark');

  var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  tl.fromTo(nodes, { scale: 0 }, { scale: 1, duration: 0.5, stagger: 0.16, ease: 'back.out(2.6)' }, 0.6)
    .fromTo(cards, { y: 70, autoAlpha: 0, rotationX: 14, transformPerspective: 1000, transformOrigin: '50% 100%' },
      { y: 0, autoAlpha: 1, rotationX: 0, duration: 1.1, stagger: 0.16, clearProps: 'transform,translate,rotate,scale,opacity,visibility' }, 0.15)
    .add(function () { mark.classList.add('is-drawn'); }, 1.1);
  amts.forEach(function (el, k) {
    var to = Number(el.dataset.to), o = { v: 0 };
    tl.fromTo(o, { v: 0 }, { v: to, duration: 1.1, ease: 'power2.out', onUpdate: function () { el.textContent = money(o.v); } }, 0.45 + k * 0.16);
  });
  ScrollTrigger.create({ trigger: sec.querySelector('.svc-grid'), start: 'top 78%', once: true, onEnter: function () { tl.play(); } });

})();
