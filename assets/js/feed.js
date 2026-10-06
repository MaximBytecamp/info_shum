// «Лента»: на каждую карточку игрок отвечает «шум» или «сигнал» и сразу видит объяснение.
(function () {
  var LEVELS = window.FEED.levels;
  var BONUS_TIME = 15000; // мс, пока идёт бонус за скорость; когда время вышло, карточка просто ждёт
  var BEST_KEY = 'shum-feed-best';
  var SWIPE = 90;

  var $ = function (id) { return document.getElementById(id); };
  var views = ['start', 'intro', 'play', 'end'];
  var totalCards = LEVELS.reduce(function (n, l) { return n + l.cards.length; }, 0);
  var s = null;          // состояние партии
  var phase = 'start';   // start | intro | card | verdict | end
  var shownAt = 0;
  var raf = null;
  var drag = null;

  function readBest() {
    try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; }
  }
  function writeBest(n) {
    try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) { /* рекорд живёт до закрытия вкладки */ }
  }

  function view(name) {
    views.forEach(function (v) { $(v).hidden = v !== name; });
    window.scrollTo(0, 0);
  }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // --- Ход игры ---
  function newGame() {
    s = { level: 0, queue: [], i: 0, done: 0, score: 0, streak: 0, bestStreak: 0, right: 0, mistakes: [] };
    showIntro();
  }

  function showIntro() {
    var level = LEVELS[s.level];
    phase = 'intro';
    s.queue = shuffle(level.cards);
    s.i = 0;
    $('introLevel').textContent = 'уровень ' + (s.level + 1) + ' из ' + LEVELS.length;
    $('introGoal').textContent = level.goal;
    $('introHint').textContent = level.hint || '';
    $('introHint').hidden = !level.hint;
    view('intro');
    $('goBtn').focus();
  }

  function startLevel() {
    $('goal').textContent = LEVELS[s.level].goal;
    view('play');
    showCard();
  }

  function showCard() {
    var c = s.queue[s.i];
    var card = $('card');
    phase = 'card';
    card.className = 'card is-in';
    card.style.transform = '';
    card.removeAttribute('data-lean');
    $('cardAva').textContent = c.from.charAt(0);
    $('cardFrom').textContent = c.from;
    $('cardMeta').textContent = c.meta;
    $('cardKind').textContent = c.kind;
    $('cardText').textContent = c.text;
    $('cardThumb').hidden = !c.thumb;
    if (c.thumb) $('cardThumb').dataset.thumb = c.thumb;
    $('verdict').hidden = true;
    $('choice').removeAttribute('data-off');
    $('progress').textContent = (s.done + 1) + '/' + totalCards;
    $('timebar').classList.remove('is-empty');
    shownAt = performance.now();
    cancelAnimationFrame(raf);
    drawTime();
  }

  function timeLeft() { return Math.max(0, 1 - (performance.now() - shownAt) / BONUS_TIME); }

  function drawTime() {
    var left = timeLeft();
    $('timeFill').style.transform = 'scaleX(' + left + ')';
    if (left > 0 && phase === 'card') raf = requestAnimationFrame(drawTime);
    else $('timebar').classList.toggle('is-empty', left === 0);
  }

  function answer(saysSignal) {
    if (phase !== 'card') return;
    var c = s.queue[s.i];
    var right = saysSignal === c.signal;
    var card = $('card');
    phase = 'verdict';
    cancelAnimationFrame(raf);
    s.done += 1;

    if (right) {
      s.streak += 1;
      s.right += 1;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      s.score += Math.round((100 + 50 * timeLeft()) * multiplier());
      pop('score');
    } else {
      s.streak = 0;
      s.mistakes.push(c);
    }
    $('score').textContent = s.score;
    $('streak').textContent = '×' + multiplier().toFixed(1).replace('.', ',');

    card.className = 'card ' + (right ? 'is-right' : 'is-wrong');
    card.style.transform = '';
    card.removeAttribute('data-lean');
    $('verdictMark').textContent = (right ? 'Верно: ' : 'Неверно: ') + (c.signal ? 'это сигнал' : 'это шум');
    $('verdictType').textContent = c.type;
    $('verdictType').parentNode.hidden = c.signal;
    $('verdictWhy').textContent = c.why;
    $('verdict').hidden = false;
    $('choice').setAttribute('data-off', '');
    $('nextBtn').focus();
  }

  // серия верных ответов поднимает множитель с ×1,0 до ×1,5
  function multiplier() { return 1 + 0.1 * Math.min(Math.max(s.streak - 1, 0), 5); }

  function pop(id) {
    var item = $(id).parentNode;
    item.classList.remove('pop');
    void item.offsetWidth; // перезапуск анимации
    item.classList.add('pop');
  }

  function next() {
    if (phase !== 'verdict') return;
    s.i += 1;
    if (s.i < s.queue.length) { showCard(); return; }
    s.level += 1;
    if (s.level < LEVELS.length) showIntro(); else finish();
  }

  function finish() {
    phase = 'end';
    var acc = Math.round(s.right / totalCards * 100);
    var best = readBest();
    $('finalScore').textContent = s.score;
    $('rank').textContent = acc >= 90 ? 'Вы почти не ошибались'
      : acc >= 75 ? 'Большую часть шума вы отсеяли'
      : acc >= 55 ? 'Часть шума вы приняли за сигнал'
      : 'Пока трудно: посмотрите разбор ниже';
    $('statRight').textContent = s.right + ' из ' + totalCards;
    $('statAcc').textContent = acc + '%';
    $('statStreak').textContent = s.bestStreak;

    var list = $('reviewList');
    list.textContent = '';
    s.mistakes.forEach(function (c) {
      var li = el('li');
      li.appendChild(el('q', '', c.text));
      li.appendChild(el('span', 'tag', c.signal ? 'был сигнал' : c.type));
      li.appendChild(document.createTextNode(c.why));
      list.appendChild(li);
    });
    $('review').hidden = !s.mistakes.length;

    if (s.score > best) writeBest(s.score);
    showBest();
    view('end');
  }

  function showBest() {
    var best = readBest();
    $('bestLine').textContent = best ? 'ваш рекорд на этом компьютере: ' + best : '';
  }

  // --- Управление: кнопки, клавиатура, свайп ---
  $('startBtn').addEventListener('click', newGame);
  $('againBtn').addEventListener('click', newGame);
  $('goBtn').addEventListener('click', startLevel);
  $('nextBtn').addEventListener('click', next);
  $('noiseBtn').addEventListener('click', function () { answer(false); });
  $('signalBtn').addEventListener('click', function () { answer(true); });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    var k = e.key.toLowerCase();
    if (phase === 'card') {
      if (k === 'arrowleft' || k === 'a' || k === 'ф') { e.preventDefault(); answer(false); }
      if (k === 'arrowright' || k === 'd' || k === 'в') { e.preventDefault(); answer(true); }
    } else if (k === 'enter' || k === ' ') {
      e.preventDefault();
      if (phase === 'verdict') next();
      else if (phase === 'intro') startLevel();
      else newGame();
    }
  });

  var card = $('card');
  card.addEventListener('pointerdown', function (e) {
    if (phase !== 'card' || e.target.closest('button')) return;
    drag = { x: e.clientX, dx: 0 };
    card.classList.remove('is-in', 'is-back');
    card.setPointerCapture(e.pointerId);
  });
  card.addEventListener('pointermove', function (e) {
    if (!drag) return;
    drag.dx = e.clientX - drag.x;
    card.style.transform = 'translateX(' + drag.dx + 'px) rotate(' + drag.dx / 22 + 'deg)';
    if (Math.abs(drag.dx) > SWIPE) card.dataset.lean = drag.dx < 0 ? 'noise' : 'signal';
    else card.removeAttribute('data-lean');
  });
  function drop() {
    if (!drag) return;
    var dx = drag.dx;
    drag = null;
    if (Math.abs(dx) > SWIPE) { answer(dx > 0); return; }
    card.classList.add('is-back');
    card.style.transform = '';
  }
  card.addEventListener('pointerup', drop);
  card.addEventListener('pointercancel', drop);

  showBest();
})();
