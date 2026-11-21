/* Questions. Every answer gets its first sentence marked as the short answer.
   Desktop: the questions become a list with a sliding pill and the chosen answer shows in a sticky
   panel (question, short answer word by word, detail), with previous/next buttons and arrow keys.
   Small screens: an accordion that opens and closes smoothly. */
(function () {
  var faq = document.getElementById('faq');
  if (!faq) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = !reduced && !!window.gsap;
  var items = Array.prototype.slice.call(faq.querySelectorAll('details'));

  /* short answer = first sentence, wrapped in .lead */
  items.forEach(function (d) {
    var ans = d.querySelector('.answer');
    var first = ans.firstChild;
    if (!first || first.nodeType !== 3) return;
    var m = first.textContent.match(/^(.+?[.?!])(\s+|$)/);
    if (!m) return;
    var lead = document.createElement('strong'); lead.className = 'lead'; lead.textContent = m[1];
    first.textContent = first.textContent.slice(m[0].length);
    ans.insertBefore(lead, first);
  });

  /* ---------- desktop: list + panel ---------- */
  var list = document.createElement('div'); list.className = 'faq-list';
  var pill = document.createElement('span'); pill.className = 'faq-pill'; pill.setAttribute('aria-hidden', 'true');
  var panel = document.createElement('div'); panel.className = 'faq-panel'; panel.setAttribute('aria-live', 'polite');
  panel.innerHTML =
    '<div class="fp-head"><img src="headshot.jpg" alt=""><p class="fp-who">Zachary Ernst<span>Answers</span></p><p class="fp-count"><b>01</b> / 0' + items.length + '</p></div>' +
    '<p class="fp-q"></p><p class="fp-lead"></p><p class="fp-rest"></p>' +
    '<div class="fp-nav"><button type="button" data-dir="-1" aria-label="Previous question">&larr;</button><button type="button" data-dir="1" aria-label="Next question">&rarr;</button></div>';
  var pq = panel.querySelector('.fp-q'), plead = panel.querySelector('.fp-lead'), prest = panel.querySelector('.fp-rest'), pcount = panel.querySelector('.fp-count b');
  var current = -1, split = false, swap = null;

  function movePill(i, instant) {
    var s = items[i];
    var props = { y: s.offsetTop, height: s.offsetHeight };
    if (motion && !instant) gsap.to(pill, Object.assign({ duration: 0.5, ease: 'power3.out' }, props));
    else if (window.gsap) gsap.set(pill, props);
    else { pill.style.transform = 'translateY(' + props.y + 'px)'; pill.style.height = props.height + 'px'; }
  }

  function select(i, instant) {
    if (i === current) return;
    current = i;
    items.forEach(function (d, k) {
      d.classList.toggle('is-active', k === i);
      d.querySelector('summary').setAttribute('aria-current', k === i ? 'true' : 'false');
    });
    movePill(i, instant);
    var ans = items[i].querySelector('.answer');
    var lead = ans.querySelector('.lead');
    function fill() {
      pcount.textContent = (i < 9 ? '0' : '') + (i + 1);
      pq.textContent = items[i].querySelector('summary').textContent;
      plead.innerHTML = '';
      (lead ? lead.textContent : '').split(' ').forEach(function (word, k, all) {
        var w = document.createElement('span'); w.className = 'w';
        var inner = document.createElement('span'); inner.textContent = word;
        w.appendChild(inner); plead.appendChild(w);
        if (k < all.length - 1) plead.appendChild(document.createTextNode(' '));
      });
      var rest = ans.cloneNode(true);
      var l = rest.querySelector('.lead'); if (l) l.remove();
      prest.innerHTML = rest.innerHTML.trim();
    }
    if (!motion || instant) { fill(); return; }
    /* old answer leaves, then the new one comes in: question, short answer word by word, detail */
    if (swap) swap.kill();
    swap = gsap.to([pq, plead, prest], {
      autoAlpha: 0, y: -8, duration: 0.16, ease: 'power2.in',
      onComplete: function () {
        fill();
        swap = gsap.timeline()
          .set([plead], { autoAlpha: 1, y: 0 })
          .fromTo(pq, { autoAlpha: 0, x: -10, y: 0 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power2.out' })
          .fromTo(plead.querySelectorAll('.w > span'), { yPercent: 110 }, { yPercent: 0, duration: 0.55, stagger: 0.035, ease: 'power4.out' }, '<')
          .fromTo(prest, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.3');
      }
    });
  }

  function onSummary(e) {
    e.preventDefault();
    var i = items.indexOf(e.currentTarget.parentNode);
    if (split) { select(i); return; }
    toggle(items[i]);
  }
  function onKey(e) {
    if (!split || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    var i = (current + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    select(i); items[i].querySelector('summary').focus();
  }
  panel.querySelector('.fp-nav').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    select((current + Number(b.dataset.dir) + items.length) % items.length);
  });

  /* ---------- small screens: smooth accordion ---------- */
  function toggle(d) {
    var ans = d.querySelector('.answer');
    if (!motion) { d.open = !d.open; return; }
    if (d.open) {
      gsap.to(ans, { height: 0, paddingBottom: 0, autoAlpha: 0, duration: 0.35, ease: 'power2.inOut', onComplete: function () { d.open = false; gsap.set(ans, { clearProps: 'all' }); } });
    } else {
      d.open = true;
      gsap.fromTo(ans, { height: 0, paddingBottom: 0, autoAlpha: 0 }, { height: 'auto', paddingBottom: 20, autoAlpha: 1, duration: 0.45, ease: 'power3.out', clearProps: 'all' });
    }
  }

  items.forEach(function (d) {
    var s = d.querySelector('summary');
    s.addEventListener('click', onSummary);
    s.addEventListener('keydown', onKey);
  });

  /* switch layouts with the viewport */
  var wide = window.matchMedia('(min-width: 900px)');
  function apply() {
    if (wide.matches && !split) {
      split = true;
      items.forEach(function (d) { d.open = false; list.appendChild(d); });
      list.insertBefore(pill, list.firstChild);
      faq.appendChild(list); faq.appendChild(panel);
      faq.classList.add('faq-split');
      current = -1; select(0, true);
    } else if (!wide.matches && split) {
      split = false;
      faq.classList.remove('faq-split');
      items.forEach(function (d) { d.classList.remove('is-active'); d.querySelector('summary').removeAttribute('aria-current'); faq.appendChild(d); });
      list.remove(); panel.remove();
    }
  }
  apply();
  if (wide.addEventListener) wide.addEventListener('change', apply);
  window.addEventListener('resize', function () { if (split && current >= 0) movePill(current, true); });

  /* entrance on desktop: the list items slide in, the panel rises */
  if (motion && window.ScrollTrigger && split) {
    gsap.registerPlugin(ScrollTrigger);
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    tl.fromTo(items, { x: -30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, clearProps: 'transform,opacity,visibility' }, 0)
      .fromTo(panel, { y: 50, autoAlpha: 0, rotationX: 10, transformPerspective: 1200 }, { y: 0, autoAlpha: 1, rotationX: 0, duration: 1, clearProps: 'transform,opacity,visibility' }, 0.15)
      .fromTo(pill, { scaleX: 0.6, autoAlpha: 0 }, { scaleX: 1, autoAlpha: 1, duration: 0.6 }, 0.4);
    ScrollTrigger.create({ trigger: faq, start: 'top 80%', once: true, onEnter: function () { tl.play(); } });
  }
})();
