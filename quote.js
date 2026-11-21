/* Cantus Works quote page: context from the link (?need=find|fix|govern, ?lines=N),
   copy-the-prompt button, and a background submit to Formspree so the thank-you stays on the site. */
(function () {
  var params = new URLSearchParams(window.location.search);
  var need = (params.get('need') || '').toLowerCase();
  var lines = Number(params.get('lines'));

  var CONTEXT = {
    find: { title: 'Get your quote', option: 'Inspection (Find)', subject: 'Quote request: inspection' },
    fix: { title: 'Ask about fixes', option: 'Fixes (Fix)', subject: 'Inquiry: fixes',
           lede: 'Tell me what needs fixing and how big the codebase is. If you already have a Cantus Works report, say so and I will work from it.' },
    govern: { title: 'Ask about ongoing governance', option: 'Ongoing governance (Govern)', subject: 'Inquiry: ongoing governance',
              lede: 'Tell me about your team and your codebase. Ongoing governance starts after a first inspection, so mention it if you already have one.' }
  };

  var ctx = CONTEXT[need];
  if (ctx) {
    document.getElementById('q-title').textContent = ctx.title;
    document.title = ctx.title + ' | Cantus Works';
    if (ctx.lede) document.getElementById('q-lede').textContent = ctx.lede;
    document.getElementById('q-need').value = ctx.option;
    document.getElementById('q-subject').value = ctx.subject;
  }

  if (lines > 0) {
    var size = lines < 50000 ? 'Under 50,000 lines'
      : lines <= 150000 ? '50,000 to 150,000 lines'
      : lines <= 400000 ? '150,000 to 400,000 lines'
      : 'Over 400,000 lines';
    document.getElementById('q-size').value = size;
  }

  // Keep the subject in step if the visitor changes "What you need".
  var needSel = document.getElementById('q-need');
  needSel.addEventListener('change', function () {
    var label = needSel.value === 'Not sure' ? 'Quote request' : 'Quote request: ' + needSel.options[needSel.selectedIndex].text.toLowerCase();
    document.getElementById('q-subject').value = label;
  });

  // Copy the AI sizing prompt.
  document.querySelectorAll('.q-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = document.getElementById(btn.dataset.target).textContent;
      var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy prompt'; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { btn.textContent = 'Select and copy'; });
      } else { btn.textContent = 'Select and copy'; }
    });
  });

  // Submit in the background; show the thank-you on this page.
  var form = document.getElementById('q-form');
  var status = document.getElementById('q-status');
  var send = document.getElementById('q-send');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = 'Please fill in your name, email, what you need and the rough size.';
      return;
    }
    send.disabled = true;
    status.textContent = 'Sending…';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('status ' + res.status);
        form.hidden = true;
        document.getElementById('q-thanks').hidden = false;
        if (window.umami && typeof window.umami.track === 'function') window.umami.track('quote-sent');
      })
      .catch(function () {
        send.disabled = false;
        status.innerHTML = 'Something went wrong. Please email <a href="mailto:hello@cantusworks.com">hello@cantusworks.com</a> instead.';
      });
  });
})();
