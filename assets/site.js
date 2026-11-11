/* MTravel Business — поведение страниц без канвы: выбор языка, выезжающая форма заявки,
   ответы форм, оценка звездами, лента акций. Данные форм пока никуда не уходят. */
(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function toggle(el, on) { if (el) el.classList.toggle('x-hide', !on); }

  // Карточки предложений со сроком: после даты until прячутся, даже если сайт не пересобрали.
  // Если в месте не осталось видимых карточек — прячется весь раздел.
  var today = new Date().toISOString().slice(0, 10);
  $$('[data-until]').forEach(function (c) {
    if (c.getAttribute('data-until') < today) c.style.display = 'none';
  });
  $$('[data-site-slot]').forEach(function (slot) {
    if ($$('a', slot).some(function (a) { return a.style.display !== 'none'; })) return;
    var sec = $('[data-site-section="' + slot.getAttribute('data-site-slot') + '"]');
    if (sec) sec.hidden = true;
  });

  // Меню на телефоне (бургер). Пункты берутся со страницы: верхнее меню (.nav, .hd-nav), а на
  // страницах разделов, где его нет, — разделы страницы с id и общие ссылки из подвала.
  // Плюс кнопка заявки из шапки и выбор языка.
  var MENU_TXT = {
    ru: { title: 'Меню', close: 'Закрыть меню', all: 'Все разделы MTravel Business' },
    ky: { title: 'Меню', close: 'Менюну жабуу', all: 'MTravel Business бардык бөлүмдөрү' },
    en: { title: 'Menu', close: 'Close menu', all: 'All MTravel Business sections' }
  };
  var burger = $('.burger');
  if (burger) {
    var lang = (document.documentElement.lang || 'ru').slice(0, 2);
    var T = MENU_TXT[lang] || MENU_TXT.ru;
    var header = $('header');
    var items = [];
    var nav = $('.nav, .hd-nav');
    var home = (header && $('a[href$="index.html"]', header)) || null;
    var homeHref = home ? home.getAttribute('href') : 'index.html';
    if (nav) {
      $$('a', nav).forEach(function (a) { items.push({ href: a.getAttribute('href'), text: a.textContent.trim(), accent: !!a.getAttribute('style') }); });
    } else {
      $$('section[id]').forEach(function (s) {
        var label = $('.eyebrow', s) || $('h2', s);
        if (label && label.textContent.trim()) items.push({ href: '#' + s.id, text: label.textContent.trim() });
      });
      var foot = $('footer');
      if (foot) {
        $$('a[href]', foot).forEach(function (a) {
          var h = a.getAttribute('href');
          if (/^(tel:|mailto:|https?:)/.test(h) || $('svg', a) || !a.textContent.trim()) return;
          if (h === 'contacts.html' && /\[|конфиденц|құпия|купуя|privacy/i.test(a.textContent)) return;
          if (/index\.html$/.test(h)) return;
          if (items.some(function (it) { return it.href === h; })) return;
          items.push({ href: h, text: a.textContent.trim() });
        });
      }
      items.push({ href: homeHref, text: T.all });
    }
    var cta = header && $$('a.btn', header).filter(function (a) { return !a.classList.contains('icon-btn'); })[0];
    var langs = header && $('.lang', header);

    var panel = document.createElement('div');
    panel.className = 'x-menu';
    panel.id = 'x-menu';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', T.title);
    panel.hidden = true;
    var html = '<div class="x-menu-top"><span class="x-menu-title">' + T.title + '</span>'
      + '<button type="button" class="x-menu-close" aria-label="' + T.close + '"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><nav class="x-menu-list">';
    items.forEach(function (it) {
      var a = document.createElement('a');
      a.href = it.href;
      a.textContent = it.text;
      if (it.accent) a.className = 'x-accent';
      html += a.outerHTML;
    });
    html += '</nav>';
    panel.innerHTML = html;
    if (cta) {
      var c = document.createElement('a');
      c.className = 'x-menu-cta';
      c.href = cta.getAttribute('href');
      c.textContent = cta.textContent.trim();
      panel.appendChild(c);
    }
    if (langs) {
      var l = langs.cloneNode(true);
      l.classList.add('x-menu-lang');
      panel.appendChild(l);
    }
    document.body.appendChild(panel);
    burger.setAttribute('aria-controls', 'x-menu');
    burger.setAttribute('aria-expanded', 'false');

    var openMenu = function () {
      panel.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      var first = $('a, button', panel);
      if (first) first.focus();
    };
    var closeMenu = function () {
      if (panel.hidden) return;
      panel.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      burger.focus();
    };
    burger.addEventListener('click', openMenu);
    $('.x-menu-close', panel).addEventListener('click', closeMenu);
    panel.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
      if (e.key === 'Tab' && !panel.hidden) {
        var f = $$('a, button', panel);
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1100) closeMenu(); });
  }

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
  // Проверка полей: required — заполнить; телефон — 9–15 цифр (с кодом 996 — ровно 12);
  // почта — вид name@domain; data-req-group — хотя бы одно поле группы; data-consent — галочка
  // согласия обязательна. Ошибка — под полем, на языке страницы.
  var ERR = {
    ru: { req: 'Заполните это поле', tel: 'Введите номер полностью, например +996 555 123 456', mail: 'Проверьте почту, например name@company.kg', group: 'Укажите телефон или почту', consent: 'Без согласия на обработку данных мы не сможем принять заявку' },
    ky: { req: 'Бул талааны толтуруңуз', tel: 'Номерди толук жазыңыз, мисалы +996 555 123 456', mail: 'Почтаны текшериңиз, мисалы name@company.kg', group: 'Телефон же почтаны жазыңыз', consent: 'Маалыматтарды иштетүүгө макулдуксуз өтүнмөнү кабыл ала албайбыз' },
    en: { req: 'Please fill in this field', tel: 'Enter the full number, e.g. +996 555 123 456', mail: 'Check the email, e.g. name@company.kg', group: 'Enter a phone number or email', consent: 'We can’t accept the request without your consent to data processing' }
  };
  var E = ERR[(document.documentElement.lang || 'ru').slice(0, 2)] || ERR.ru;
  function telOk(v) {
    var d = v.replace(/\D/g, '');
    if (!d) return false;
    if (d.indexOf('996') === 0) return d.length === 12;
    return d.length >= 9 && d.length <= 15;
  }
  function mailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
  function holder(el) { return el.closest('.field') || el.closest('label') || el.parentNode; }
  function setErr(el, msg) {
    var h = holder(el);
    var after = el.type === 'checkbox';
    var box = after ? (h.nextElementSibling && h.nextElementSibling.classList.contains('x-err') ? h.nextElementSibling : null)
      : h.querySelector(':scope > .x-err');
    if (!msg) {
      if (box) box.parentNode.removeChild(box);
      el.removeAttribute('aria-invalid');
      return;
    }
    if (!box) {
      box = document.createElement('span');
      box.className = 'x-err';
      box.id = (el.id || 'f' + Math.random().toString(36).slice(2, 8)) + '-err';
      if (after) h.parentNode.insertBefore(box, h.nextSibling);
      else h.appendChild(box);
      // В строке с переносом (подписка) — отдельной строкой во всю ширину
      var pcs = window.getComputedStyle(box.parentNode);
      if (pcs.display.indexOf('flex') >= 0 && pcs.flexDirection.indexOf('row') === 0) box.style.flex = '1 1 100%';
    }
    box.textContent = msg;
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', box.id);
  }
  function checkField(el) {
    var v = (el.value || '').trim();
    var msg = '';
    if (el.type === 'checkbox') msg = el.hasAttribute('data-consent') && !el.checked ? E.consent : '';
    else if (el.required && !v) msg = E.req;
    else if (v && el.type === 'tel') msg = telOk(v) ? '' : E.tel;
    else if (v && el.type === 'email') msg = mailOk(v) ? '' : E.mail;
    setErr(el, msg);
    return !msg;
  }
  function validate(form) {
    var ok = true;
    var first = null;
    $$('input, textarea', form).forEach(function (el) {
      if (el.type === 'radio' || el.type === 'file' || el.type === 'hidden') return;
      if (el.type === 'checkbox' && !el.hasAttribute('data-consent')) return;
      if (!checkField(el)) { ok = false; first = first || el; }
    });
    var groups = {};
    $$('[data-req-group]', form).forEach(function (el) {
      var g = el.getAttribute('data-req-group');
      (groups[g] = groups[g] || []).push(el);
    });
    Object.keys(groups).forEach(function (g) {
      var list = groups[g];
      if (list.some(function (el) { return el.value.trim(); })) return;
      setErr(list[0], E.group);
      ok = false;
      first = first || list[0];
    });
    if (first) first.focus();
    return ok;
  }
  $$('form[data-submit]').forEach(function (form) {
    form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) checkField(e.target); });
    form.addEventListener('change', function (e) { if (e.target.getAttribute('aria-invalid')) checkField(e.target); });
  });

  $$('form[data-submit]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
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
