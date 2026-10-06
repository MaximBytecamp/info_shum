// Переключатель светлой и тёмной темы. По умолчанию светлая: она лучше читается на проекторе.
(function () {
  var KEY = 'shum-theme';
  var root = document.documentElement;

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* без хранилища тема живёт до перезагрузки */ }
  }
  function apply(theme) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }

  apply(read());

  window.toggleTheme = function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    write(next);
  };

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-theme-toggle]')) window.toggleTheme();
  });
})();
