/* ════════════════ TWEAKS (vanilla, host-протокол) ════════════════ */
(function () {
  const DEFAULTS = window.TWEAK_DEFAULTS || {};
  const LS = "ku-tweaks";
  let values = Object.assign({}, DEFAULTS);
  try { values = Object.assign(values, JSON.parse(localStorage.getItem(LS) || "{}")); } catch (e) {}

  const ACCENTS = {
    gold:   { g: "#D8AA3A", l: "#F1CF73", d: "#B8871E" },
    amber:  { g: "#E8B84B", l: "#F7DD92", d: "#C8901F" },
    pale:   { g: "#EADCAE", l: "#F7EDCF", d: "#C9B173" }
  };

  function apply() {
    const root = document.documentElement.style;
    const a = ACCENTS[values.accent] || ACCENTS.gold;
    root.setProperty("--gold", a.g);
    root.setProperty("--gold-light", a.l);
    root.setProperty("--gold-deep", a.d);
    if (window.__applyDeckSettings) window.__applyDeckSettings({ filter: values.filter });
  }

  function setTweak(key, val) {
    values[key] = val;
    try { localStorage.setItem(LS, JSON.stringify(values)); } catch (e) {}
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [key]: val } }, "*");
    apply();
  }

  function buildPanel() {
    const panel = document.createElement("div");
    panel.id = "tweaks-panel";
    panel.innerHTML =
      '<div class="tw-head"><span>Настройки</span><button class="tw-close" aria-label="Закрыть">✕</button></div>' +
      '<div class="tw-body">' +
        '<div class="tw-section">Оттенок золота</div>' +
        '<div class="tw-seg" data-key="accent">' +
          '<button data-val="gold">Золото</button>' +
          '<button data-val="amber">Янтарь</button>' +
          '<button data-val="pale">Светлое</button>' +
        '</div>' +
        '<div class="tw-section">Какие карты тянуть</div>' +
        '<div class="tw-seg tw-seg-v" data-key="filter">' +
          '<button data-val="all">Вся колода</button>' +
          '<button data-val="light">Только исцеляющие</button>' +
          '<button data-val="dark">Только тёмные</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(panel);

    function wireSeg(key) {
      const btns = panel.querySelectorAll('.tw-seg[data-key="' + key + '"] button');
      btns.forEach(b => {
        b.classList.toggle("active", b.dataset.val === values[key]);
        b.addEventListener("click", () => {
          btns.forEach(x => x.classList.remove("active"));
          b.classList.add("active");
          setTweak(key, b.dataset.val);
        });
      });
    }
    wireSeg("accent"); wireSeg("filter");

    panel.querySelector(".tw-close").addEventListener("click", () => {
      panel.classList.remove("open");
      window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*");
    });
    return panel;
  }

  let panel = null;
  const ensure = () => panel || (panel = buildPanel());

  window.addEventListener("message", e => {
    const t = e && e.data && e.data.type;
    if (t === "__activate_edit_mode") ensure().classList.add("open");
    else if (t === "__deactivate_edit_mode") { if (panel) panel.classList.remove("open"); }
  });

  function start() { apply(); window.parent.postMessage({ type: "__edit_mode_available" }, "*"); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
