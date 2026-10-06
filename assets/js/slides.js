// Движок презентации: навигация, заметки и интерактивные слайды.
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var count = document.getElementById('count');
  var bar = document.getElementById('bar');
  var notesPanel = document.getElementById('notesPanel');
  var current = 0;
  var notesOn = false;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(i) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, n) { s.classList.toggle('active', n === current); });
    count.textContent = (current + 1) + ' / ' + slides.length;
    bar.style.width = ((current + 1) / slides.length * 100) + '%';
    try { history.replaceState(null, '', '#' + (current + 1)); } catch (e) { /* file:// в некоторых браузерах */ }
    renderNotes();
    staticLoop();
  }

  function renderNotes() {
    var note = slides[current].querySelector('.notes');
    notesPanel.hidden = !notesOn;
    notesPanel.textContent = note ? note.textContent : 'К этому слайду заметок нет.';
  }

  function toggleNotes() { notesOn = !notesOn; renderNotes(); }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }

  document.getElementById('prev').addEventListener('click', function () { show(current - 1); });
  document.getElementById('next').addEventListener('click', function () { show(current + 1); });
  document.getElementById('fs').addEventListener('click', toggleFullscreen);
  document.getElementById('notesBtn').addEventListener('click', toggleNotes);

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = e.target.tagName;
    var onControl = tag === 'INPUT' || tag === 'BUTTON' || tag === 'A';
    // на ползунке стрелки двигают ползунок, на кнопке пробел нажимает кнопку
    if (tag === 'INPUT') return;
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': show(current + 1); break;
      case 'ArrowLeft': case 'PageUp': show(current - 1); break;
      case ' ': if (!onControl) { e.preventDefault(); show(current + 1); } break;
      case 'Home': show(0); break;
      case 'End': show(slides.length - 1); break;
      case 'f': case 'F': case 'а': case 'А': toggleFullscreen(); break;
      case 'n': case 'N': case 'т': case 'Т': toggleNotes(); break;
    }
  });

  var touchX = null;
  document.addEventListener('touchstart', function (e) {
    touchX = e.target.closest('input, .snr') ? null : e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 70) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  window.addEventListener('hashchange', function () {
    var n = parseInt(location.hash.slice(1), 10);
    if (n && n - 1 !== current) show(n - 1);
  });

  // --- Титул: «снег» как на телевизоре без сигнала ---
  var canvas = document.getElementById('static');
  var ctx = canvas.getContext('2d');
  var staticTimer = null;
  canvas.width = 192;
  canvas.height = 108;

  function drawStatic() {
    var img = ctx.createImageData(canvas.width, canvas.height);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  function staticLoop() {
    clearInterval(staticTimer);
    if (current !== 0) return;
    drawStatic();
    if (!reduceMotion) staticTimer = setInterval(drawStatic, 90);
  }

  // --- Опыт: десять секунд уведомлений ---
  var TOASTS = [
    ['Чат группы', '+47 новых сообщений'],
    ['Маркетплейс', 'Товар из корзины подешевел на 3 ₽'],
    ['Игра', 'Твой сундук готов! Забери награду'],
    ['Мама', 'Ты поел?'],
    ['Видео', 'Новое: «ТОП-10 фактов, которые…»'],
    ['Банк', 'Кэшбэк 1% уже ждёт вас'],
    ['Чат группы', 'Кто-нибудь сделал третье задание?'],
    ['Доставка', 'Скидка 20% только до полуночи'],
    ['Канал', 'ШОК! Учёные выяснили…'],
    ['Соцсеть', 'Вас давно не было. Загляните!'],
    ['Чат группы', '+'],
    ['Чат группы', '+'],
    ['Музыка', 'Новый релиз специально для вас'],
    ['Такси', 'Куда поедем сегодня?'],
    ['Соцсеть', 'Возможно, вы знакомы'],
    ['Игра', 'Друг обогнал тебя в рейтинге'],
    ['Канал', 'Опрос: кто вы из «Смешариков»?'],
    ['Одногруппник', 'скинь дз'],
    ['Почта', 'Вы выиграли! Осталось подтвердить'],
    ['Чат дома', 'Чья машина стоит у подъезда?']
  ];
  var toastBtn = document.getElementById('toastStart');
  var toastLayer = document.getElementById('toastLayer');
  var toastTimer = document.getElementById('toastTimer');
  var toastAfter = document.getElementById('toastAfter');

  function spawnToast(n) {
    var data = TOASTS[n % TOASTS.length];
    var el = document.createElement('div');
    el.className = 'toast';
    var app = document.createElement('b');
    app.textContent = data[0];
    el.appendChild(app);
    el.appendChild(document.createTextNode(data[1]));
    el.style.left = (4 + Math.random() * 72) + '%';
    el.style.top = (4 + Math.random() * 80) + '%';
    toastLayer.appendChild(el);
    setTimeout(function () { el.remove(); }, 2300);
  }

  toastBtn.addEventListener('click', function () {
    var left = 10;
    var n = Math.floor(Math.random() * TOASTS.length);
    toastBtn.disabled = true;
    toastAfter.hidden = true;
    toastTimer.textContent = left + ' с';
    var spawn = setInterval(function () { spawnToast(n++); }, 320);
    var tick = setInterval(function () {
      left -= 1;
      toastTimer.textContent = left + ' с';
      if (left > 0) return;
      clearInterval(spawn);
      clearInterval(tick);
      toastTimer.textContent = '';
      toastAfter.hidden = false;
      toastBtn.disabled = false;
      toastBtn.textContent = 'Ещё раз';
    }, 1000);
  });

  // --- Сигнал и шум: ползунок добавляет «шумные» сообщения поверх нужного ---
  var NOISE = ['ШОК!', '−90%', 'лайк = удача', 'а вы знали?', 'ТОП-10', 'смотри скорее', 'СРОЧНО', 'репост!',
    'вас давно не было', 'кто ты из Смешариков?', 'подпишись', '🔥🔥🔥', 'только сегодня', 'не поверите', '+',
    'мем дня', 'розыгрыш', 'акция', 'жми сюда', 'новое видео', 'скидка', 'все в чат', 'опрос', 'стрим начался',
    'ты выиграл', 'смотреть до конца', '18 новых', 'кэшбэк', 'тест', 'гороскоп', 'осталось 2 часа', 'сторис', 'реакция',
    'тренд', 'новинка', 'ещё'];
  var FILLS = ['var(--noise)', 'var(--mark)', 'var(--ai)', '#ffffff'];
  var snrBox = document.getElementById('snrBox');
  var snrRange = document.getElementById('snrRange');
  var snrVal = document.getElementById('snrVal');
  var seed = 7;
  function rand() { // детерминированный генератор: раскладка шума одинакова при каждом показе
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }
  var chips = NOISE.map(function (text, i) {
    var el = document.createElement('span');
    var angle = rand() * Math.PI * 2;
    var radius = 46 - (i / NOISE.length) * 40; // сначала шум по краям, потом закрывает центр
    el.className = 'snr__chip';
    el.textContent = text;
    el.style.left = (50 + Math.cos(angle) * radius) + '%';
    el.style.top = (50 + Math.sin(angle) * radius * 0.9) + '%';
    el.style.background = FILLS[i % FILLS.length];
    el.style.fontSize = (0.95 + rand() * 0.9) + 'em';
    el.style.setProperty('--r', Math.round(rand() * 30 - 15) + 'deg');
    snrBox.appendChild(el);
    return el;
  });
  snrRange.addEventListener('input', function () {
    var level = Number(snrRange.value);
    snrVal.textContent = level;
    chips.forEach(function (el, i) { el.classList.toggle('on', i < level); });
  });

  // --- Карточки с числами ---
  document.querySelectorAll('.flip').forEach(function (card) {
    card.addEventListener('click', function () { card.classList.toggle('open'); });
  });

  // --- ИИ или фото ---
  document.querySelectorAll('.guess').forEach(function (fig) {
    fig.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-pick]');
      if (!btn || fig.classList.contains('done')) return;
      fig.classList.add('done', btn.dataset.pick === fig.dataset.answer ? 'is-right' : 'is-wrong');
      fig.querySelector('.guess__res').hidden = false;
    });
  });

  show((parseInt(location.hash.slice(1), 10) || 1) - 1);
})();
