// «Своя игра»: команды, табло, вопросы с таймером, финал со ставками.
(function () {
  var DATA = window.QUIZ;
  var KEY = 'shum-quiz';
  var DEFAULT_NAMES = ['Сигнал', 'Фильтр', 'Антиспам', 'Фактчек', 'Детектор'];
  var COLORS = ['#35c46b', '#e8503a', '#7c6bf5', '#ffc53d', '#6fb8e3'];
  var HINTS = { 2: '15 человек — две команды по 7–8', 3: '15 человек — три команды по 5', 4: '15 человек — четыре команды по 3–4', 5: '15 человек — пять команд по 3' };
  var Q_TIME = 30;
  var FINAL_TIME = 45;

  var $ = function (id) { return document.getElementById(id); };
  var state = null;
  var draft = { count: 3, names: DEFAULT_NAMES.slice() };
  var open = null;      // открытый вопрос: { c, i, revealed, failed: {} }
  var finalStep = null; // 'bets' | 'question' | 'answer'
  var finalMarks = [];
  var timer = { id: null, left: 0, total: 0, paused: false, el: null, bar: null, num: null };

  // --- Хранилище: счёт переживает случайное обновление страницы ---
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* без хранилища игра идёт до перезагрузки */ }
  }
  function clearSaved() {
    try { localStorage.removeItem(KEY); } catch (e) { /* нечего чистить */ }
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function plural(n, one, few, many) {
    var d = n % 10, h = n % 100;
    if (d === 1 && h !== 11) return one;
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
    return many;
  }
  function total() {
    return DATA.categories.reduce(function (sum, c) { return sum + c.questions.length; }, 0);
  }
  function usedCount() { return Object.keys(state.used).length; }

  // --- Настройка ---
  function renderSetup() {
    $('teamCount').querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(Number(b.dataset.n) === draft.count));
    });
    $('teamHint').textContent = HINTS[draft.count];
    var box = $('names');
    box.textContent = '';
    for (var i = 0; i < draft.count; i++) {
      var label = el('label');
      label.style.setProperty('--team', COLORS[i]);
      label.appendChild(el('i'));
      var input = el('input');
      input.type = 'text';
      input.maxLength = 18;
      input.value = draft.names[i];
      input.setAttribute('aria-label', 'Название команды ' + (i + 1));
      input.dataset.i = i;
      label.appendChild(input);
      box.appendChild(label);
    }
    var saved = load();
    $('resumeBtn').hidden = !(saved && saved.teams && saved.phase !== 'setup');
  }

  $('teamCount').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    draft.count = Number(b.dataset.n);
    renderSetup();
  });
  $('names').addEventListener('input', function (e) {
    draft.names[Number(e.target.dataset.i)] = e.target.value;
  });
  $('startBtn').addEventListener('click', function () {
    state = {
      phase: 'board',
      penalty: $('penalty').checked,
      turn: 0,
      used: {},
      finalDone: false,
      teams: draft.names.slice(0, draft.count).map(function (name, i) {
        return { name: name.trim() || DEFAULT_NAMES[i], score: 0 };
      })
    };
    save();
    showBoard();
  });
  $('resumeBtn').addEventListener('click', function () {
    state = load();
    if (state.phase === 'results') showResults(); else showBoard();
  });

  // --- Табло ---
  function showBoard() {
    state.phase = 'board';
    $('setup').hidden = true;
    $('results').hidden = true;
    $('boardScreen').hidden = false;
    renderScores();
    renderBoard();
  }

  function renderScores(bumped) {
    var box = $('scores');
    box.textContent = '';
    state.teams.forEach(function (team, i) {
      var card = el('div', 'team' + (i === state.turn && !state.finalDone ? ' is-turn' : '') + (i === bumped ? ' bump' : ''));
      card.style.setProperty('--team', COLORS[i]);
      card.appendChild(el('span', 'team__name', team.name));
      card.appendChild(el('span', 'team__score', String(team.score)));
      var adj = el('span', 'team__adj');
      [['+', 100], ['−', -100]].forEach(function (pair) {
        var b = el('button', '', pair[0]);
        b.type = 'button';
        b.title = 'Поправить счёт на ' + pair[1];
        b.setAttribute('aria-label', team.name + ': ' + (pair[1] > 0 ? 'плюс' : 'минус') + ' 100');
        b.addEventListener('click', function () { addScore(i, pair[1]); });
        adj.appendChild(b);
      });
      card.appendChild(adj);
      box.appendChild(card);
    });
    var left = total() - usedCount();
    $('turnLine').textContent = left
      ? 'выбирает «' + state.teams[state.turn].name + '» · осталось ' + left + ' ' + plural(left, 'вопрос', 'вопроса', 'вопросов')
      : 'вопросы закончились — время финала';
    $('finalBtn').classList.toggle('is-ready', !left && !state.finalDone);
    $('finalBtn').disabled = state.finalDone;
  }

  function renderBoard() {
    var board = $('board');
    var cats = DATA.categories;
    board.textContent = '';
    board.style.gridTemplateColumns = 'repeat(' + cats.length + ', 1fr)';
    cats.forEach(function (cat) { board.appendChild(el('div', 'board__head', cat.title)); });
    var rows = cats[0].questions.length;
    for (var r = 0; r < rows; r++) {
      cats.forEach(function (cat, c) { board.appendChild(makeCell(cat, c, r)); });
    }
  }

  function makeCell(cat, c, r) {
    var q = cat.questions[r];
    var cell = el('button', 'cell', String(q.value));
    cell.type = 'button';
    cell.disabled = !!state.used[c + '-' + r];
    cell.setAttribute('aria-label', cat.title + ', ' + q.value);
    cell.addEventListener('click', function () { openQuestion(c, r); });
    return cell;
  }

  function addScore(i, delta) {
    state.teams[i].score += delta;
    save();
    renderScores(i);
  }

  // --- Таймер ---
  function startTimer(seconds, wrap, bar, num) {
    stopTimer();
    timer.left = timer.total = seconds;
    timer.paused = false;
    timer.el = wrap; timer.bar = bar; timer.num = num;
    wrap.classList.remove('is-low', 'is-out', 'is-paused');
    drawTimer();
    timer.id = setInterval(tick, 1000);
  }
  function tick() {
    if (timer.paused) return;
    timer.left -= 1;
    drawTimer();
    if (timer.left <= 0) stopTimer();
  }
  function drawTimer() {
    timer.bar.style.transform = 'scaleX(' + Math.max(0, timer.left) / timer.total + ')';
    timer.num.textContent = timer.left > 0 ? timer.left : 'время!';
    timer.el.classList.toggle('is-low', timer.left <= 10 && timer.left > 0);
    timer.el.classList.toggle('is-out', timer.left <= 0);
  }
  function stopTimer() { clearInterval(timer.id); timer.id = null; }
  function toggleTimer() {
    if (!timer.id) return;
    timer.paused = !timer.paused;
    timer.el.classList.toggle('is-paused', timer.paused);
  }
  $('timer').addEventListener('click', toggleTimer);
  $('fTimer').addEventListener('click', toggleTimer);

  // --- Вопрос ---
  function openQuestion(c, i) {
    var cat = DATA.categories[c];
    var q = cat.questions[i];
    open = { c: c, i: i, revealed: false, failed: {} };
    $('qCat').textContent = cat.title;
    $('qValue').textContent = q.value;
    $('qText').textContent = q.q;
    renderOptions(q);
    $('qAnswerMain').textContent = q.options ? q.options[q.correct] : q.a;
    $('qAnswerNote').textContent = q.note || '';
    $('qAnswer').hidden = true;
    $('qBody').classList.toggle('has-img', !!q.img);
    $('qBody').classList.toggle('no-options', !q.options);
    $('qBody').classList.remove('is-revealed');
    $('qImgWrap').hidden = !q.img;
    if (q.img) $('qImg').src = q.img;
    $('revealBtn').hidden = false;
    $('award').hidden = true;
    $('qOverlay').hidden = false;
    $('revealBtn').focus();
    startTimer(Q_TIME, $('timer'), $('timerBar'), $('timerNum'));
  }

  function renderOptions(q) {
    var list = $('qOptions');
    list.textContent = '';
    list.hidden = !q.options;
    (q.options || []).forEach(function (text, n) {
      var li = el('li', n === q.correct ? 'is-correct' : '');
      li.appendChild(el('b', '', 'АБВГ'.charAt(n)));
      li.appendChild(el('span', '', text));
      list.appendChild(li);
    });
  }

  function reveal() {
    if (!open || open.revealed) return;
    open.revealed = true;
    stopTimer();
    $('qAnswer').hidden = false;
    $('qBody').classList.add('is-revealed');
    $('revealBtn').hidden = true;
    renderAward();
    $('award').hidden = false;
  }

  function renderAward() {
    var q = DATA.categories[open.c].questions[open.i];
    var box = $('awardTeams');
    box.textContent = '';
    state.teams.forEach(function (team, i) {
      var group = el('span', 'award__team');
      group.style.setProperty('--team', COLORS[i]);
      var plus = el('button');
      plus.type = 'button';
      plus.appendChild(el('kbd', '', String(i + 1)));
      plus.appendChild(document.createTextNode(team.name + ' +' + q.value));
      plus.disabled = !!open.failed[i];
      plus.addEventListener('click', function () { award(i); });
      group.appendChild(plus);
      if (state.penalty) {
        var minus = el('button', 'minus', '−' + q.value);
        minus.type = 'button';
        minus.title = 'Неверный ответ';
        minus.disabled = !!open.failed[i];
        minus.addEventListener('click', function () { fail(i); });
        group.appendChild(minus);
      }
      box.appendChild(group);
    });
  }

  function award(i) {
    if (!open || !open.revealed || open.failed[i]) return;
    var value = DATA.categories[open.c].questions[open.i].value;
    state.teams[i].score += value;
    finishQuestion(i);
  }
  function fail(i) {
    var value = DATA.categories[open.c].questions[open.i].value;
    state.teams[i].score -= value;
    open.failed[i] = true;
    save();
    renderAward();
  }
  function finishQuestion(bumped) {
    state.used[open.c + '-' + open.i] = true;
    state.turn = (state.turn + 1) % state.teams.length;
    closeQuestion();
    save();
    renderScores(bumped);
    renderBoard();
  }
  function closeQuestion() {
    stopTimer();
    open = null;
    $('qOverlay').hidden = true;
  }

  $('revealBtn').addEventListener('click', reveal);
  $('nobodyBtn').addEventListener('click', function () { finishQuestion(); });
  $('qClose').addEventListener('click', function () { closeQuestion(); renderScores(); });

  // --- Финал со ставками ---
  function maxBet(team) { return Math.max(team.score, 100); }

  function openFinal() {
    finalStep = 'bets';
    finalMarks = state.teams.map(function () { return false; });
    $('finalTheme').textContent = 'тема: ' + DATA.final.theme;
    $('finalAnswer').hidden = true;
    $('finalText').parentNode.classList.remove('is-revealed');
    $('fTimer').hidden = true;
    $('finalStep').textContent = 'шаг 1 из 3 · ставки';
    $('finalText').textContent = 'Команды называют ставку от 0 до своего счёта. За верный ответ ставка прибавляется, за неверный вычитается.';
    $('finalNext').textContent = 'Показать вопрос';
    renderBets();
    $('finalOverlay').hidden = false;
  }

  function renderBets() {
    var box = $('bets');
    var prev = Array.prototype.map.call(box.querySelectorAll('input'), function (inp) { return inp.value; });
    box.textContent = '';
    state.teams.forEach(function (team, i) {
      var card = el('div', 'bet');
      card.style.setProperty('--team', COLORS[i]);
      card.appendChild(el('span', 'bet__name', team.name));
      card.appendChild(el('span', 'bet__score', 'счёт ' + team.score + ' · ставка до ' + maxBet(team)));
      var input = el('input');
      input.type = 'number';
      input.min = 0;
      input.max = maxBet(team);
      input.step = 50;
      input.value = prev[i] !== undefined ? prev[i] : 0;
      input.disabled = finalStep !== 'bets';
      input.setAttribute('aria-label', 'Ставка команды ' + team.name);
      card.appendChild(input);
      if (finalStep === 'answer') {
        var ok = el('button', 'bet__ok', finalMarks[i] ? 'Ответ верный ✓' : 'Ответ неверный');
        ok.type = 'button';
        ok.setAttribute('aria-pressed', String(finalMarks[i]));
        ok.addEventListener('click', function () { finalMarks[i] = !finalMarks[i]; renderBets(); });
        card.appendChild(ok);
      }
      box.appendChild(card);
    });
  }

  function readBets() {
    return Array.prototype.map.call($('bets').querySelectorAll('input'), function (inp, i) {
      var n = Math.round(Number(inp.value) || 0);
      return Math.max(0, Math.min(maxBet(state.teams[i]), n));
    });
  }

  $('finalNext').addEventListener('click', function () {
    if (finalStep === 'bets') {
      var bets = readBets();
      $('bets').querySelectorAll('input').forEach(function (inp, i) { inp.value = bets[i]; });
      finalStep = 'question';
      $('finalStep').textContent = 'шаг 2 из 3 · вопрос · отвечают все команды письменно';
      $('finalText').textContent = DATA.final.q;
      $('finalNext').textContent = 'Показать ответ';
      $('fTimer').hidden = false;
      renderBets();
      startTimer(FINAL_TIME, $('fTimer'), $('fTimerBar'), $('fTimerNum'));
    } else if (finalStep === 'question') {
      finalStep = 'answer';
      stopTimer();
      $('finalStep').textContent = 'шаг 3 из 3 · отметьте, чьи ответы верны';
      $('finalAnswerMain').textContent = DATA.final.a;
      $('finalAnswerNote').textContent = DATA.final.note;
      $('finalAnswer').hidden = false;
      $('finalText').parentNode.classList.add('is-revealed');
      $('finalNext').textContent = 'Подвести итоги';
      renderBets();
    } else {
      var final = readBets();
      state.teams.forEach(function (team, i) { team.score += finalMarks[i] ? final[i] : -final[i]; });
      state.finalDone = true;
      closeFinal();
      showResults();
    }
  });

  function closeFinal() {
    stopTimer();
    finalStep = null;
    $('bets').textContent = '';
    $('finalOverlay').hidden = true;
  }
  $('finalBtn').addEventListener('click', openFinal);
  $('fClose').addEventListener('click', closeFinal);

  // --- Итоги ---
  function showResults() {
    state.phase = 'results';
    save();
    var ranked = state.teams
      .map(function (team, i) { return { name: team.name, score: team.score, i: i }; })
      .sort(function (a, b) { return b.score - a.score; });
    var best = ranked[0].score;
    var winners = ranked.filter(function (t) { return t.score === best; });
    $('winnerLine').textContent = winners.length === 1
      ? 'Победила команда «' + winners[0].name + '»'
      : 'Ничья: ' + winners.map(function (t) { return '«' + t.name + '»'; }).join(' и ');
    var list = $('podium');
    list.textContent = '';
    var place = 0, prevScore = null;
    ranked.forEach(function (team, n) {
      if (team.score !== prevScore) place = n + 1;
      prevScore = team.score;
      var li = el('li', team.score === best ? 'is-winner' : '');
      li.style.setProperty('--team', COLORS[team.i]);
      li.appendChild(el('span', 'place', String(place)));
      li.appendChild(el('span', '', team.name));
      li.appendChild(el('span', 'pts', String(team.score)));
      list.appendChild(li);
    });
    $('setup').hidden = true;
    $('boardScreen').hidden = true;
    $('results').hidden = false;
    confetti();
  }

  function confetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var canvas = $('confetti');
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.clientWidth;
    var h = canvas.height = canvas.clientHeight;
    var bits = [];
    for (var i = 0; i < 140; i++) {
      bits.push({ x: Math.random() * w, y: -Math.random() * h, s: 6 + Math.random() * 10, v: 2 + Math.random() * 4, d: Math.random() * 2 - 1, c: COLORS[i % COLORS.length], r: Math.random() * 6 });
    }
    var started = Date.now();
    (function frame() {
      ctx.clearRect(0, 0, w, h);
      if (Date.now() - started > 5000 || $('results').hidden) return;
      bits.forEach(function (b) {
        b.y += b.v; b.x += b.d; b.r += 0.1;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
        ctx.restore();
      });
      requestAnimationFrame(frame);
    })();
  }

  function newGame() {
    if (state && usedCount() && !state.finalDone && !confirm('Начать новую игру? Текущий счёт сбросится.')) return;
    clearSaved();
    state = null;
    $('boardScreen').hidden = true;
    $('results').hidden = true;
    $('setup').hidden = false;
    renderSetup();
  }
  $('newBtn').addEventListener('click', newGame);
  $('againBtn').addEventListener('click', newGame);
  $('resultsBtn').addEventListener('click', showResults);
  $('backBtn').addEventListener('click', showBoard);
  $('fs').addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  });

  // --- Клавиатура: пробел — ответ, цифры — кому баллы, 0 — никому, Esc — закрыть ---
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (open) {
      if (e.key === 'Escape') { closeQuestion(); renderScores(); return; }
      if ((e.key === ' ' || e.key === 'Enter') && !open.revealed) { e.preventDefault(); reveal(); return; }
      if (open.revealed && e.key >= '1' && e.key <= String(state.teams.length)) { award(Number(e.key) - 1); return; }
      if (open.revealed && e.key === '0') finishQuestion();
    } else if (finalStep && e.key === 'Escape') {
      closeFinal();
    }
  });

  renderSetup();
})();
