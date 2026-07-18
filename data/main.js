/* ════════════════════════════════════════════════════════════
   КАРТЫ УСПЕХА — логика
   ════════════════════════════════════════════════════════════ */
(function () {
  const ALL = window.DECK_CARDS || [];
  const CAT_LABEL = { dark: "Тёмные истории", light: "Исцеляющие истории" };

  /* ---------- настройки (управляются Tweaks) ---------- */
  const settings = {
    filter: "all"   // all | light | dark
  };
  function pool() {
    if (settings.filter === "light") return ALL.filter(c => c.cat === "light");
    if (settings.filter === "dark")  return ALL.filter(c => c.cat === "dark");
    return ALL;
  }

  /* ---------- детерминированный хеш (FNV-1a) ---------- */
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function dateKey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }

  /* ---------- построение карты ---------- */
  function buildCard(card) {
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.setAttribute("role", "button");
    wrap.setAttribute("tabindex", "0");
    wrap.setAttribute("aria-label", "Перевернуть карту");

    const back = document.createElement("div");
    back.className = "face back";
    back.innerHTML = '<div class="back-inner"></div>';

    const front = document.createElement("div");
    front.className = "face front cat-" + card.cat;
    if (card.img) {
      front.innerHTML = '<img src="' + card.img + '" alt="' + card.name + '" />';
    } else {
      // карта ещё не загружена — стилизованная заглушка
      front.classList.add("placeholder");
      front.innerHTML =
        '<div class="ph-inner">' +
          '<div class="ph-num">' + card.n + '</div>' +
          '<div class="ph-name">' + card.name + '</div>' +
          '<div class="ph-cat">' + CAT_LABEL[card.cat] + '</div>' +
          '<div class="ph-note">изображение скоро будет добавлено</div>' +
        '</div>';
    }

    wrap.appendChild(back);
    wrap.appendChild(front);
    wrap._card = card;
    return wrap;
  }

  function detailHTML(card, full) {
    var body =
      '<div class="d-cat cat-' + card.cat + '">' +
        '<span class="d-num">№ ' + card.n + '</span>' +
        '<span class="d-catlabel">' + CAT_LABEL[card.cat] + '</span>' +
      '</div>' +
      '<h2 class="d-name">' + card.name + '</h2>' +
      '<div class="d-rule"></div>';
    if (full && card.desc) {
      body +=
        '<div class="d-sectlabel">Полное значение</div>' +
        '<p class="d-text">' + card.desc + '</p>' +
        '<div class="d-sectlabel d-sectlabel-2">Значение карты</div>' +
        '<p class="d-text">' + card.meaning + '</p>';
    } else {
      body += '<p class="d-text">' + card.meaning + '</p>';
    }
    return body;
  }

  /* ════════════════════ КАРТА ДНЯ ════════════════════ */
  function renderDaily() {
    const host = document.getElementById("daily-card");
    const detail = document.getElementById("daily-detail");
    host.innerHTML = ""; detail.innerHTML = ""; detail.classList.remove("show");

    const now = new Date();
    const key = dateKey(now);
    const p = pool();
    const card = p[hashStr("denek-" + key + "-" + settings.filter) % p.length];

    const el = buildCard(card);
    host.appendChild(el);

    const revealKey = "ku-daily-" + key + "-" + settings.filter;
    const reveal = () => { detail.innerHTML = detailHTML(card); detail.classList.add("show"); };

    if (localStorage.getItem(revealKey) === "1") { el.classList.add("flipped"); reveal(); }

    const flip = () => {
      if (el.classList.contains("flipped")) return;
      el.classList.add("flipped");
      localStorage.setItem(revealKey, "1");
      setTimeout(reveal, 360);
    };
    el.addEventListener("click", flip);
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });

    document.getElementById("daily-date").textContent =
      now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  /* ════════════════════ РАСКЛАД / ВЫТЯНУТЬ ════════════════════ */
  const SPREADS = {
    one:   { positions: ["Послание"] },
    three: { positions: ["Что есть сейчас", "Что мешает", "Что исцелит"] },
    love:  { positions: ["Вы", "Партнёр", "Что вас связывает", "Что мешает близости", "Куда движутся отношения"] },
    success: { positions: ["Где вы сейчас", "Ваша сила", "Препятствие", "Что нужно изменить", "Путь к успеху", "Результат"] }
  };
  let currentSpread = "one";

  function drawSpread() {
    const cfg = SPREADS[currentSpread];
    const n = cfg.positions.length;
    const p = pool().slice();
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    const picks = p.slice(0, n).map((card, k) => ({ card, pos: cfg.positions[k] }));
    renderSpread(picks);
  }

  function renderSpread(picks) {
    const board = document.getElementById("spread-board");
    const reading = document.getElementById("spread-reading");
    board.innerHTML = ""; reading.innerHTML = ""; reading.classList.remove("show");
    board.dataset.count = picks.length;

    picks.forEach(p => {
      const slot = document.createElement("div");
      slot.className = "slot";
      const lab = document.createElement("div");
      lab.className = "slot-label";
      lab.textContent = p.pos;
      const el = buildCard(p.card);
      slot.appendChild(lab); slot.appendChild(el); board.appendChild(slot);

      const flip = () => {
        if (el.classList.contains("flipped")) { highlight(p.pos); return; }
        el.classList.add("flipped");
        setTimeout(() => addReading(p), 340);
      };
      el.addEventListener("click", flip);
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    });
    document.getElementById("spread-hint").textContent = "Нажимайте на карты, чтобы открыть их.";
  }

  function addReading(p) {
    const reading = document.getElementById("spread-reading");
    reading.classList.add("show");
    const block = document.createElement("div");
    block.className = "read-block";
    block.dataset.pos = p.pos;
    block.innerHTML = '<div class="rb-pos">' + p.pos + '</div>' + detailHTML(p.card, true);
    reading.appendChild(block);
    highlight(p.pos);
  }
  function highlight(pos) {
    document.querySelectorAll(".read-block").forEach(b => b.classList.toggle("active", b.dataset.pos === pos));
  }

  /* ════════════════════ НАВИГАЦИЯ ════════════════════ */
  function setMode(mode) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.dataset.view === mode));
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === mode));
    localStorage.setItem("ku-mode", mode);
  }

  function init() {
    document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => setMode(t.dataset.tab)));

    document.querySelectorAll(".spread-pick").forEach(b => {
      b.addEventListener("click", () => {
        currentSpread = b.dataset.spread;
        document.querySelectorAll(".spread-pick").forEach(x => x.classList.toggle("active", x === b));
        drawSpread();
      });
    });
    document.getElementById("draw-btn").addEventListener("click", drawSpread);

    renderDaily();
    drawSpread();
    setMode(localStorage.getItem("ku-mode") || "daily");

    window.__applyDeckSettings = (s) => {
      Object.assign(settings, s);
      renderDaily();
      drawSpread();
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
