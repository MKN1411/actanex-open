(function initPlaceSuggest() {
  const SELECTOR = [
    "#travel-origin",
    "#travel-dest",
    "#travel-return-dest",
    "#edit-trip-origin",
    "#edit-trip-dest",
    "#edit-trip-return-dest",
    ".leg-start",
    ".leg-dest",
  ].join(",");

  const state = new WeakMap();
  let activeList = null;
  let activeInput = null;

  function apiBase() {
    if (typeof API_BASE !== "undefined" && API_BASE) return API_BASE;
    return "/api/v1";
  }

  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function isReadonlyBlocked(el) {
    return !!(el && (el.readOnly || el.disabled));
  }

  function ensureState(el) {
    let s = state.get(el);
    if (!s) {
      s = { session: uuid(), debounce: null, results: [], highlight: -1, provider: "photon" };
      state.set(el, s);
    }
    return s;
  }

  function closeList() {
    if (activeList && activeList.parentNode) activeList.parentNode.removeChild(activeList);
    activeList = null;
    activeInput = null;
  }

  function attributionText(provider, fallback) {
    const used = fallback || provider || "photon";
    if (used === "google") return "Powered by Google";
    return "© OpenStreetMap";
  }

  function positionList(input, list) {
    const rect = input.getBoundingClientRect();
    list.style.position = "fixed";
    list.style.left = `${Math.max(8, rect.left)}px`;
    list.style.top = `${rect.bottom + 4}px`;
    list.style.width = `${Math.max(220, rect.width)}px`;
    list.style.zIndex = "10050";
  }

  function renderList(input, payload) {
    closeList();
    const results = payload.results || [];
    const s = ensureState(input);
    s.results = results;
    s.highlight = results.length ? 0 : -1;
    s.provider = payload.provider || "photon";
    s.fallback = payload.fallback || null;

    if (!results.length) return;

    const list = document.createElement("div");
    list.className = "place-suggest-list";
    list.setAttribute("role", "listbox");
    list.style.cssText = [
      "background:#fff",
      "border:1px solid #cbd5e1",
      "border-radius:8px",
      "box-shadow:0 10px 30px rgba(15,23,42,0.12)",
      "max-height:260px",
      "overflow:auto",
      "font-size:0.9rem",
    ].join(";");

    results.forEach((r, idx) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "place-suggest-item";
      item.setAttribute("role", "option");
      item.style.cssText = [
        "display:block",
        "width:100%",
        "text-align:left",
        "padding:10px 12px",
        "border:0",
        "background:transparent",
        "cursor:pointer",
        "color:#0f172a",
      ].join(";");
      item.innerHTML = `<div style="font-weight:600;">${escapeHtml(r.label)}</div>
        <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">${escapeHtml(r.source)}</div>`;
      item.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        selectResult(input, r);
      });
      item.addEventListener("mouseenter", () => {
        s.highlight = idx;
        paintHighlight(list, s.highlight);
      });
      list.appendChild(item);
    });

    const foot = document.createElement("div");
    foot.style.cssText = "padding:6px 12px;font-size:0.7rem;color:#64748b;border-top:1px solid #e2e8f0;";
    foot.textContent = attributionText(s.provider, s.fallback);
    list.appendChild(foot);

    document.body.appendChild(list);
    positionList(input, list);
    activeList = list;
    activeInput = input;
    paintHighlight(list, s.highlight);
  }

  function paintHighlight(list, idx) {
    const items = list.querySelectorAll(".place-suggest-item");
    items.forEach((el, i) => {
      el.style.background = i === idx ? "#eef2ff" : "transparent";
    });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function selectResult(input, result) {
    const s = ensureState(input);
    closeList();
    if (!result) return;

    if (result.source === "google" && result.placeId) {
      try {
        const url = `${apiBase()}/places/details?placeId=${encodeURIComponent(result.placeId)}&session=${encodeURIComponent(s.session)}`;
        const res = await fetch(url, { credentials: "same-origin" });
        if (res.ok) {
          const data = await res.json();
          if (data.formattedAddress) {
            input.value = data.formattedAddress;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            s.session = uuid();
            return;
          }
        }
      } catch (e) {
        console.warn("place details failed", e);
      }
    }

    input.value = result.label || input.value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    s.session = uuid();
  }

  async function runSuggest(input) {
    if (isReadonlyBlocked(input)) {
      closeList();
      return;
    }
    const q = (input.value || "").trim();
    if (q.length < 3) {
      closeList();
      return;
    }
    const s = ensureState(input);
    try {
      const url = `${apiBase()}/places/suggest?q=${encodeURIComponent(q)}&session=${encodeURIComponent(s.session)}`;
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) {
        closeList();
        return;
      }
      const data = await res.json();
      if (document.activeElement !== input) return;
      renderList(input, data);
    } catch (e) {
      console.warn("place suggest failed", e);
      closeList();
    }
  }

  function onFocus(ev) {
    const input = ev.target.closest(SELECTOR);
    if (!input || isReadonlyBlocked(input)) return;
    const s = ensureState(input);
    s.session = uuid();
  }

  function onInput(ev) {
    const input = ev.target.closest(SELECTOR);
    if (!input || isReadonlyBlocked(input)) return;
    const s = ensureState(input);
    if (s.debounce) clearTimeout(s.debounce);
    s.debounce = setTimeout(() => runSuggest(input), 300);
  }

  function onKeydown(ev) {
    const input = ev.target.closest(SELECTOR);
    if (!input || !activeList || activeInput !== input) return;
    const s = ensureState(input);
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      if (!s.results.length) return;
      s.highlight = (s.highlight + 1) % s.results.length;
      paintHighlight(activeList, s.highlight);
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      if (!s.results.length) return;
      s.highlight = (s.highlight - 1 + s.results.length) % s.results.length;
      paintHighlight(activeList, s.highlight);
    } else if (ev.key === "Enter") {
      if (s.highlight >= 0 && s.results[s.highlight]) {
        ev.preventDefault();
        selectResult(input, s.results[s.highlight]);
      }
    } else if (ev.key === "Escape") {
      closeList();
    }
  }

  function onBlur(ev) {
    const input = ev.target.closest(SELECTOR);
    if (!input) return;
    setTimeout(() => {
      if (activeInput === input) closeList();
    }, 150);
  }

  document.addEventListener("focusin", onFocus, true);
  document.addEventListener("input", onInput, true);
  document.addEventListener("keydown", onKeydown, true);
  document.addEventListener("focusout", onBlur, true);
  window.addEventListener("resize", () => {
    if (activeList && activeInput) positionList(activeInput, activeList);
  });
  window.addEventListener("scroll", () => {
    if (activeList && activeInput) positionList(activeInput, activeList);
  }, true);
})();
