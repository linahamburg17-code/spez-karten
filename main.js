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
    three: { positions: ["Проблема (тёмная карта)", "Путь решения (исцеляющая карта)", "Результат (исцеляющая карта)"] },
    successlove: { positions: [
      "Отношения — главная карта", "Успех — главная карта",
      "Модель отношений", "Модель отношений", "Модель отношений",
      "Отношения сейчас",
      "Как проявляется успех", "Как проявляется успех", "Как проявляется успех",
      "Успех сейчас",
      "Наследие родителей", "Наследие родителей"
    ] },
    chakra: { positions: [] }
  };
  let currentSpread = "one";

  const CHAKRAS = [
    { name: "Корневая чакра", desc: "жизнь, жизненная сила и сексуальная энергия" },
    { name: "Вторая чакра", desc: "ваш образ и сексуальность" },
    { name: "Третья чакра", desc: "центр силы воли и успеха" },
    { name: "Сердечная чакра", desc: "энергия любви и открытость к близким людям" },
    { name: "Горловая чакра", desc: "лидерство и любовь к людям в целом" },
    { name: "Третий глаз", desc: "мышление и внутреннее зрение" },
    { name: "Коронная чакра", desc: "духовный центр и связь с бесконечностью" }
  ];
  const CHAKRA_INTRO =
    "Чакры — это семь важных энергетических центров нашего тела, которые начинаются у основания позвоночника и проходят по восходящей линии до макушки. Они оказывают воздействие на телесный, эмоционально-психологический и духовный план.\n\nВы можете использовать «Карты успеха», чтобы осознать, что мешает энергии чакр течь беспрепятственно. Для каждой чакры сначала вытяните негативную карту — она отражает ключевую проблему, блокирующую соответствующую чакру. Затем вытяните позитивную или исцеляющую карту, которая покажет переломную точку для этой чакры.";

  function drawSpread() {
    const cfg = SPREADS[currentSpread];
    const n = cfg.positions.length;

    if (currentSpread === "three") {
      const darkPile = ALL.filter(c => c.cat === "dark").slice();
      const lightPile = ALL.filter(c => c.cat === "light").slice();
      shuffle(darkPile); shuffle(lightPile);
      const picks = [
        { card: darkPile[0], pos: cfg.positions[0] },
        { card: lightPile[0], pos: cfg.positions[1] },
        { card: lightPile[1], pos: cfg.positions[2] }
      ];
      renderSpread(picks);
      return;
    }

    if (currentSpread === "chakra") {
      const darkPile = ALL.filter(c => c.cat === "dark").slice();
      const lightPile = ALL.filter(c => c.cat === "light").slice();
      shuffle(darkPile); shuffle(lightPile);
      const picks = [];
      CHAKRAS.forEach((ch, i) => {
        picks.push({ card: darkPile[i], pos: ch.name + " — блок", chakra: i, kind: "block" });
        picks.push({ card: lightPile[i], pos: ch.name + " — точка исцеления", chakra: i, kind: "heal" });
      });
      renderSpread(picks);
      return;
    }

    const p = pool().slice();
    shuffle(p);
    const picks = p.slice(0, n).map((card, k) => ({ card, pos: cfg.positions[k] }));
    renderSpread(picks);
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }

  const CROSS_AREA = {
    love:    { 1: "t", 4: "l", 3: "c", 5: "r", 6: "b" },
    success: { 2: "t", 8: "l", 7: "c", 9: "r", 10: "b" }
  };
  const THREE_INTRO =
    "Расклад с тремя картами может дать вам быстрый, ясный взгляд на любые проблемы или ситуации. Он предлагает великолепную возможность исследовать отдельные карты и их значение для вашей жизни, а также препятствия, стоящие у вас на пути. Первая карта отражает ситуацию в настоящем. Вторая карта — это поворотный момент: то, что приведёт к прорыву в ситуации. Последняя карта — это конечный результат или следующий шаг.\n\nРазделите карты на две стопки — тёмные и исцеляющие истории — и вытяните три карты. Сначала вытяните карту из стопки тёмных историй. Она показывает проблему, которая лежит в основе вашей ситуации. Затем вытяните карту из стопки исцеляющих историй. Она показывает путь решения ситуации. Последней вытяните карту из стопки исцеляющих историй. Она покажет результат.";
  const SUCCESSLOVE_INTRO =
    "Расклад на успешность отношений восходит к модели, которую вы узнали от матери и отца, а также к модели души: левая сторона (отношения) символизирует сторону матери, а правая сторона (успех) — сторону отца. Расклад на успех и отношения фактически отражает первоначальные аспекты мужского и женского в нашем подсознании, с которыми на сознательном уровне мы, как правило, себя не идентифицируем. В этом раскладе карты выбираются автоматически случайным образом.\n\nКарта 1 — главная тема ваших отношений. Она показывает ключевую энергию, которая сейчас влияет на вашу личную жизнь.\n\nКарта 2 — главная тема вашего успеха. Она раскрывает основной потенциал вашей реализации и достижений.\n\nКарты 3, 4 и 5 отражают вашу привычную модель отношений — сценарии, установки и способы взаимодействия с другими людьми.\n\nКарта 6 показывает, что происходит в ваших отношениях на настоящий момент.\n\nКарты 7, 8 и 9 раскрывают, как в вашей жизни проявляется успех, через какие качества, события и возможности он приходит.\n\nКарта 10 показывает, насколько успешно складывается ваша жизнь в настоящий момент.\n\nКарты 11 и 12 раскрывают наследие вашей родительской семьи — убеждения, модели поведения и внутренние программы, которые продолжают влиять на ваше настоящее.";

  function makeSlot(p) {
    const slot = document.createElement("div");
    slot.className = "slot";
    const lab = document.createElement("div");
    lab.className = "slot-label";
    lab.textContent = p.pos;
    const el = buildCard(p.card);
    slot.appendChild(lab); slot.appendChild(el);
    const flip = () => {
      if (el.classList.contains("flipped")) { highlight(p.pos); return; }
      el.classList.add("flipped");
      setTimeout(() => addReading(p), 340);
    };
    el.addEventListener("click", flip);
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    return slot;
  }

  function renderSpread(picks) {
    const board = document.getElementById("spread-board");
    const reading = document.getElementById("spread-reading");
    board.innerHTML = ""; reading.innerHTML = ""; reading.classList.remove("show");
    board.dataset.count = picks.length;

    if (currentSpread === "successlove") {
      board.classList.add("cross-layout");
      board.classList.remove("chakra-layout");
      const loveCross = document.createElement("div");
      loveCross.className = "cross cross-love";
      const successCross = document.createElement("div");
      successCross.className = "cross cross-success";
      const shared = document.createElement("div");
      shared.className = "cross-shared";

      picks.forEach((p, idx) => {
        const num = idx + 1;
        const slot = makeSlot(p);
        if (CROSS_AREA.love[num]) { slot.style.gridArea = CROSS_AREA.love[num]; loveCross.appendChild(slot); }
        else if (CROSS_AREA.success[num]) { slot.style.gridArea = CROSS_AREA.success[num]; successCross.appendChild(slot); }
        else { shared.appendChild(slot); }
      });

      const intro = document.createElement("div");
      intro.className = "cross-intro";
      intro.innerHTML = SUCCESSLOVE_INTRO.split("\n\n").map(p => "<p>" + p + "</p>").join("");
      board.appendChild(intro);

      const row = document.createElement("div");
      row.className = "cross-row";
      const loveWrap = document.createElement("div");
      loveWrap.className = "cross-col";
      loveWrap.innerHTML = '<div class="cross-title">Отношения</div>';
      loveWrap.appendChild(loveCross);
      const successWrap = document.createElement("div");
      successWrap.className = "cross-col";
      successWrap.innerHTML = '<div class="cross-title">Успех</div>';
      successWrap.appendChild(successCross);
      row.appendChild(loveWrap); row.appendChild(successWrap);
      board.appendChild(row);
      board.appendChild(shared);
    } else {
      board.classList.remove("cross-layout");
      board.classList.remove("chakra-layout");
      if (currentSpread === "three") {
        const intro = document.createElement("div");
        intro.className = "cross-intro three-intro";
        intro.innerHTML = THREE_INTRO.split("\n\n").map(p => "<p>" + p + "</p>").join("");
        board.appendChild(intro);
      }
      if (currentSpread === "chakra") {
        board.classList.add("chakra-layout");
        const intro = document.createElement("div");
        intro.className = "cross-intro chakra-intro";
        intro.innerHTML = CHAKRA_INTRO.split("\n\n").map(p => "<p>" + p + "</p>").join("");
        board.appendChild(intro);
        CHAKRAS.forEach((ch, i) => {
          const row = document.createElement("div");
          row.className = "chakra-row";
          row.innerHTML = '<div class="chakra-title">' + ch.name + '<span class="chakra-sub">' + ch.desc + '</span></div>';
          const pair = document.createElement("div");
          pair.className = "chakra-pair";
          pair.appendChild(makeSlot(picks[i * 2]));
          pair.appendChild(makeSlot(picks[i * 2 + 1]));
          row.appendChild(pair);
          board.appendChild(row);
        });
      } else {
        picks.forEach(p => board.appendChild(makeSlot(p)));
      }
    }
    document.getElementById("spread-hint").textContent = "Нажимайте на карты, чтобы открыть их.";
  }

  function addReading(p) {
    const reading = document.getElementById("spread-reading");
    reading.classList.add("show");
    const block = document.createElement("div");
    block.className = "read-block";
    block.dataset.pos = p.pos;
    block.innerHTML = '<div class="rb-pos">' + p.pos + '</div>' + detailHTML(p.card, currentSpread === "one");
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
