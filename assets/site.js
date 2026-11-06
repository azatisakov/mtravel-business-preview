/* MTravel Business — поведение страниц без канвы: выбор языка, выезжающая форма заявки,
   ответы форм, оценка звездами, лента акций. Данные форм пока никуда не уходят. */
(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function toggle(el, on) { if (el) el.classList.toggle('x-hide', !on); }

  // Выбор языка: каждая языковая версия — отдельная страница
  $$('[data-href]').forEach(function (b) {
    b.addEventListener('click', function () { window.location.href = b.getAttribute('data-href'); });
  });

  // Выезжающая форма заявки (главная)
  var drawer = $('[data-if="drawer"]');
  function openDrawer() {
    if (!drawer) return;
    toggle($('[data-if="notSent"]', drawer), true);
    toggle($('[data-if="sent"]', drawer), false);
    toggle(drawer, true);
    document.body.style.overflow = 'hidden';
    var first = $('input, textarea, select', drawer);
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeDrawer() { toggle(drawer, false); document.body.style.overflow = ''; }
  $$('[data-on="openForm"]').forEach(function (b) { b.addEventListener('click', openDrawer); });
  $$('[data-on="closeForm"]').forEach(function (b) { b.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && !drawer.classList.contains('x-hide')) closeDrawer();
  });

  // Формы: после отправки показываем ответ
  var PAIRS = { send: ['notSent', 'sent'], sendRev: ['revNotSent', 'revSent'] };
  $$('form[data-submit]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pair = PAIRS[form.getAttribute('data-submit')];
      var scope = form.closest('[data-if="drawer"]') || document;
      var done = pair && $('[data-if="' + pair[1] + '"]', scope);
      if (done) {
        toggle(form.closest('[data-if="' + pair[0] + '"]'), false);
        toggle(done, true);
      } else {
        $$('[data-ok]', form).forEach(function (el) { el.textContent = el.getAttribute('data-ok'); });
      }
    });
  });
  var RESETS = { reset: ['notSent', 'sent'], resetRev: ['revNotSent', 'revSent'] };
  Object.keys(RESETS).forEach(function (key) {
    $$('[data-on="' + key + '"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = RESETS[key];
        var scope = b.closest('[data-if="drawer"]') || document;
        var wrap = $('[data-if="' + p[0] + '"]', scope);
        toggle(wrap, true);
        toggle(b.closest('[data-if="' + p[1] + '"]'), false);
        var f = wrap && $('form', wrap);
        if (f) f.reset();
      });
    });
  });

  // Оценка звездами (контакты)
  [1, 2, 3, 4, 5].forEach(function (k) {
    $$('[data-on="set' + k + '"]').forEach(function (b) {
      b.addEventListener('click', function () {
        [1, 2, 3, 4, 5].forEach(function (i) {
          var s = $('[data-on="set' + i + '"]');
          if (s) s.classList.toggle('on', i <= k);
        });
      });
    });
  });

  // Лента акций (главная)
  var track = $('.track');
  if (track) {
    var dots = $$('[data-on="d.go"]');
    var max = Math.max(0, dots.length - 1);
    var cur = 0;
    var go = function (i) {
      cur = Math.max(0, Math.min(max, i));
      track.style.setProperty('--i', cur);
      dots.forEach(function (d, j) { d.classList.toggle('on', j === cur); });
    };
    $$('[data-on="prev"]').forEach(function (b) { b.addEventListener('click', function () { go(cur - 1); }); });
    $$('[data-on="next"]').forEach(function (b) { b.addEventListener('click', function () { go(cur + 1); }); });
    dots.forEach(function (d, j) { d.addEventListener('click', function () { go(j); }); });
  }
})();
