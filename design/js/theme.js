/* Atomic Chat — skin + theme controller.
   Two skins, each persisted and system-aware:
     glass  Liquid Glass — variants: light · dark · clear · tinted
     soft   Soft Mono     — variants: light · dark
   - setSkin(name)   switch skin, clamping the theme into its range
   - setTheme(name)  jump to a theme valid for the current skin
   - toggleTheme()   cycle themes within the current skin
   [data-theme-label]/[data-skin-label] reflect the current names;
   [data-theme-pick]/[data-skin-pick] receive aria-pressed. */
(function () {
  var SKIN_KEY = "atomic-skin", THEME_KEY = "atomic-theme";
  var THEMES = { glass: ["light", "dark", "clear", "tinted"], soft: ["light", "dark"] };
  var THEME_NAMES = { light: "Light", dark: "Dark", clear: "Clear", tinted: "Tinted" };
  var SKIN_NAMES = { glass: "Liquid Glass", soft: "Soft Mono" };
  var root = document.documentElement;

  function sysDark() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function resolveSkin() {
    var s = localStorage.getItem(SKIN_KEY);
    return s === "soft" || s === "glass" ? s : "glass";
  }
  function resolveTheme(skin) {
    var t = localStorage.getItem(THEME_KEY);
    if (THEMES[skin].indexOf(t) >= 0) return t;
    return sysDark() ? "dark" : "light";
  }
  function apply(skin, theme) {
    root.setAttribute("data-skin", skin);
    root.setAttribute("data-theme", theme);
    document.querySelectorAll("[data-theme-label]").forEach(function (el) {
      el.textContent = THEME_NAMES[theme] || "Light";
    });
    document.querySelectorAll("[data-skin-label]").forEach(function (el) {
      el.textContent = SKIN_NAMES[skin] || "Liquid Glass";
    });
    document.querySelectorAll("[data-theme-pick]").forEach(function (el) {
      el.setAttribute("aria-pressed", el.getAttribute("data-theme-pick") === theme ? "true" : "false");
    });
    document.querySelectorAll("[data-skin-pick]").forEach(function (el) {
      el.setAttribute("aria-pressed", el.getAttribute("data-skin-pick") === skin ? "true" : "false");
    });
  }

  /* keep an .aurora drift layer present (soft skin hides it via CSS) */
  function ensureAurora() {
    if (!document.querySelector(".aurora")) {
      var a = document.createElement("div");
      a.className = "aurora";
      a.setAttribute("aria-hidden", "true");
      document.body.insertBefore(a, document.body.firstChild);
    }
  }

  var skin = resolveSkin();
  apply(skin, resolveTheme(skin));
  if (document.body) ensureAurora();
  else document.addEventListener("DOMContentLoaded", ensureAurora);

  window.setSkin = function (s) {
    if (!THEMES[s]) return;
    var t = root.getAttribute("data-theme");
    if (THEMES[s].indexOf(t) < 0) t = THEMES[s][0];
    localStorage.setItem(SKIN_KEY, s);
    localStorage.setItem(THEME_KEY, t);
    apply(s, t);
    return s;
  };
  window.setTheme = function (t) {
    var s = root.getAttribute("data-skin") || "glass";
    if (THEMES[s].indexOf(t) < 0) return;
    localStorage.setItem(THEME_KEY, t);
    apply(s, t);
  };
  window.toggleTheme = function () {
    var s = root.getAttribute("data-skin") || "glass";
    var list = THEMES[s];
    var next = list[(list.indexOf(root.getAttribute("data-theme")) + 1) % list.length];
    localStorage.setItem(THEME_KEY, next);
    apply(s, next);
    return next;
  };

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (!localStorage.getItem(THEME_KEY)) {
      apply(root.getAttribute("data-skin") || "glass", sysDark() ? "dark" : "light");
    }
  });
})();
