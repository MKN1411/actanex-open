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
    if (typeof API_BASE !== "undefined" && API_BASE) return String(API_BASE).replace(/\/$/, "");
    if (typeof window !== "undefined" && window.ACTANEX_API_BASE) {
      return String(window.ACTANEX_API_BASE).replace(/\/$/, "");
    }
    return `${window.location.origin}/api/v1`;
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
      s = { session: uuid(), debounce: null, results: [], highlight: -1, provider: "photon", reqId: 0 };
      state.set(el, s);
    }
    return s;
  }

  function closeList() {
    if (activeList && activeList.parentNode) activeList.parentNode.removeChild(activeList);
    activeList = null;
    activeInput = null;
  }

  function attributionText(provider, fallback, googleConfigured) {
    if (provider === "google" && !fallback) return "Powered by Google";
    if (fallback === "photon" && googleConfigured) {
      return "Google nicht erreichbar → © OpenStreetMap";
    }
    if (fallback === "photon" && googleConfigured === false) {
      return "Kein Google-Key → © OpenStreetMap";
    }
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

  function ensureListShell(input) {
    if (activeList && activeInput === input) return activeList;
    closeList();
    const list = document.createElement("div");
    list.className = "place-suggest-list";
    list.setAttribute("role", "listbox");
    list.style.cssText = [
      "background:#fff",
      "border:1px solid #cbd5e1",
      "border-radius:8px",
      "box-shadow:0 10px 30px rgba(15,23,42,0.12)",
      "max-height:280px",
      "overflow:auto",
      "font-size:0.9rem",
    ].join(";");
    document.body.appendChild(list);
    positionList(input, list);
    activeList = list;
    activeInput = input;
    return list;
  }

  function showStatus(input, message, isError) {
    const list = ensureListShell(input);
    list.innerHTML = "";
    const row = document.createElement("div");
    row.style.cssText = `padding:10px 12px;color:${isError ? "#b91c1c" : "#64748b"};font-size:0.85rem;`;
    row.textContent = message;
    list.appendChild(row);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function paintHighlight(list, idx) {
    const items = list.querySelectorAll(".place-suggest-item");
    items.forEach((el, i) => {
      el.style.background = i === idx ? "#eef2ff" : "transparent";
    });
  }

  function renderList(input, payload) {
    const results = Array.isArray(payload.results) ? payload.results : [];
    const s = ensureState(input);
    s.results = results;
    s.highlight = results.length ? 0 : -1;
    s.provider = payload.provider || "photon";
    s.fallback = payload.fallback || null;
    s.googleConfigured = payload.googleConfigured;

    if (!results.length) {
      const emptyMsg = payload.externalError
        ? "Adresssuche gerade nicht erreichbar — Freitext bleibt gültig."
        : (payload.fallback === "photon" && payload.googleConfigured === false
          ? "Keine Treffer (OpenStreetMap). Für Google Places API-Key im Hub Admin hinterlegen."
          : "Keine Treffer — Freitext bleibt gültig.");
      showStatus(input, emptyMsg, !!payload.externalError);
      const foot = document.createElement("div");
      foot.style.cssText = "padding:6px 12px;font-size:0.7rem;color:#64748b;border-top:1px solid #e2e8f0;";
      foot.textContent = attributionText(s.provider, s.fallback, s.googleConfigured);
      if (activeList) activeList.appendChild(foot);
      return;
    }

    const list = ensureListShell(input);
    list.innerHTML = "";

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
    foot.textContent = attributionText(s.provider, s.fallback, s.googleConfigured);
    list.appendChild(foot);
    paintHighlight(list, s.highlight);
  }

  function setCoords(input, lat, lng) {
    if (!input) return;
    if (lat != null && Number.isFinite(Number(lat))) input.dataset.lat = String(lat);
    else delete input.dataset.lat;
    if (lng != null && Number.isFinite(Number(lng))) input.dataset.lng = String(lng);
    else delete input.dataset.lng;
  }

  async function rememberPlace(label, lat, lng, placeId, provider) {
    try {
      await fetch(`${apiBase()}/places/remember`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, lat, lng, placeId, provider }),
      });
    } catch (_) { /* ignore */ }
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
            setCoords(input, data.lat, data.lng);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            s.session = uuid();
            maybeAutoKm(input);
            return;
          }
        }
      } catch (e) {
        console.warn("place details failed", e);
      }
    }

    input.value = result.label || input.value;
    setCoords(input, result.lat, result.lng);
    if (result.label) {
      rememberPlace(result.label, result.lat, result.lng, result.placeId, result.source);
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    s.session = uuid();
    maybeAutoKm(input);
  }

  let placesConfig = { autoKmAllowed: false, isPro: false, loaded: false };
  let placesConfigInflight = null;

  async function loadPlacesConfig(force = false) {
    if (placesConfig.loaded && !force) return placesConfig;
    if (placesConfigInflight) return placesConfigInflight;
    placesConfigInflight = (async () => {
      try {
        const res = await fetch(`${apiBase()}/places/config`, { credentials: "same-origin" });
        // Before login this is 401 — retry after auth / first travel-field focus.
        if (res.status === 401 || res.status === 403) {
          placesConfig.loaded = false;
          return placesConfig;
        }
        if (!res.ok) return placesConfig;
        const data = await res.json();
        placesConfig = {
          autoKmAllowed: !!data.autoKmAllowed,
          isPro: !!data.isPro,
          provider: data.provider || null,
          googleConfigured: !!data.googleConfigured,
          loaded: true,
        };
        syncAutoKmUi();
        return placesConfig;
      } catch (_) {
        return placesConfig;
      } finally {
        placesConfigInflight = null;
      }
    })();
    return placesConfigInflight;
  }

  function vehicleIsCar(prefix) {
    const id = prefix === "edit" ? "edit-trip-vehicle" : "travel-vehicle";
    const v = document.getElementById(id)?.value || "Train";
    return v === "PersonalCar";
  }

  function syncAutoKmUi() {
    [
      { cb: "travel-auto-km", badge: "travel-auto-km-pro-badge", prefix: "create" },
      { cb: "edit-trip-auto-km", badge: "edit-trip-auto-km-pro-badge", prefix: "edit" },
    ].forEach(({ cb, badge, prefix }) => {
      const el = document.getElementById(cb);
      const badgeEl = document.getElementById(badge);
      if (!el) return;
      if (!placesConfig.autoKmAllowed) {
        el.checked = false;
        el.disabled = true;
        if (badgeEl) badgeEl.style.display = "inline";
        return;
      }
      el.disabled = false;
      if (badgeEl) badgeEl.style.display = "none";
      if (!el.dataset.userTouched) {
        el.checked = vehicleIsCar(prefix === "edit" ? "edit" : "create");
      }
    });
  }

  function pairFor(input) {
    const id = input.id || "";
    if (id === "travel-origin" || id === "travel-dest") {
      return {
        origin: document.getElementById("travel-origin"),
        dest: document.getElementById("travel-dest"),
        km: document.getElementById("travel-km"),
        cb: document.getElementById("travel-auto-km"),
        status: document.getElementById("travel-auto-km-status"),
        calc: () => typeof calculateTravelTotals === "function" && calculateTravelTotals(),
        roundTrip:
          document.getElementById("travel-class-business")?.checked &&
          document.getElementById("travel-return-same-as-start")?.checked,
        manualFlag: "__travelKmManual",
      };
    }
    if (id === "edit-trip-origin" || id === "edit-trip-dest") {
      return {
        origin: document.getElementById("edit-trip-origin"),
        dest: document.getElementById("edit-trip-dest"),
        km: document.getElementById("edit-trip-km"),
        cb: document.getElementById("edit-trip-auto-km"),
        status: document.getElementById("edit-trip-auto-km-status"),
        calc: () => typeof calculateEditTripTotals === "function" && calculateEditTripTotals(),
        roundTrip: false,
        manualFlag: "__editTripKmManual",
      };
    }
    return null;
  }

  async function maybeAutoKm(input) {
    await loadPlacesConfig();
    const pair = pairFor(input);
    if (!pair || !pair.cb || !pair.km || !pair.origin || !pair.dest) return;
    if (!placesConfig.autoKmAllowed || !pair.cb.checked || pair.cb.disabled) return;
    if (window[pair.manualFlag]) return;
    const o = (pair.origin.value || "").trim();
    const d = (pair.dest.value || "").trim();
    if (o.length < 3 || d.length < 3) return;
    if (pair.status) pair.status.textContent = "Berechne Kilometer…";
    try {
      const res = await fetch(`${apiBase()}/places/distance`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: o,
          destination: d,
          originLat: pair.origin.dataset.lat ? Number(pair.origin.dataset.lat) : null,
          originLng: pair.origin.dataset.lng ? Number(pair.origin.dataset.lng) : null,
          destLat: pair.dest.dataset.lat ? Number(pair.dest.dataset.lat) : null,
          destLng: pair.dest.dataset.lng ? Number(pair.dest.dataset.lng) : null,
          roundTrip: !!pair.roundTrip,
        }),
      });
      if (!res.ok) {
        if (pair.status) pair.status.textContent = "km-Berechnung nicht verfügbar — bitte manuell.";
        return;
      }
      const data = await res.json();
      if (data.km != null) {
        pair.km.value = String(data.km);
        window[pair.manualFlag] = false;
        pair.calc();
        const src = data.fromCache ? "Cache" : (data.provider === "google" ? "Google Routes" : data.provider || "Route");
        if (pair.status) pair.status.textContent = `km automatisch (${src}${data.roundTrip ? ", Hin+Rück" : ""}).`;
      }
    } catch (e) {
      console.warn("auto-km failed", e);
      if (pair.status) pair.status.textContent = "km-Berechnung fehlgeschlagen — bitte manuell.";
    }
  }

  function onAutoKmCheckboxChange(ev) {
    const el = ev.target;
    if (!el || (el.id !== "travel-auto-km" && el.id !== "edit-trip-auto-km")) return;
    el.dataset.userTouched = "1";
    if (el.disabled) return;
    if (el.checked) {
      const isCar = vehicleIsCar(el.id.startsWith("edit") ? "edit" : "create");
      if (!isCar) {
        const ok = confirm(
          "Automatische km-Berechnung kann zusätzliche Google-Routes-Kosten verursachen (Inklusivkontingent / Overage).\n\nTrotzdem aktivieren?"
        );
        if (!ok) {
          el.checked = false;
          return;
        }
      }
      const origin = document.getElementById(el.id.startsWith("edit") ? "edit-trip-origin" : "travel-origin");
      if (origin) {
        window[el.id.startsWith("edit") ? "__editTripKmManual" : "__travelKmManual"] = false;
        maybeAutoKm(origin);
      }
    }
  }

  async function runSuggest(input) {
    if (isReadonlyBlocked(input)) {
      closeList();
      return;
    }
    await loadPlacesConfig();
    const q = (input.value || "").trim();
    if (q.length < 3) {
      closeList();
      return;
    }
    const s = ensureState(input);
    const reqId = ++s.reqId;
    showStatus(input, "Suche Orte…", false);

    try {
      const url = `${apiBase()}/places/suggest?q=${encodeURIComponent(q)}&session=${encodeURIComponent(s.session)}`;
      const res = await fetch(url, { credentials: "same-origin" });
      if (reqId !== s.reqId) return;
      if (!res.ok) {
        const errText = res.status === 401
          ? "Nicht angemeldet — bitte neu einloggen."
          : `Ortssuche fehlgeschlagen (${res.status}).`;
        showStatus(input, errText, true);
        return;
      }
      const data = await res.json();
      if (reqId !== s.reqId) return;
      if (document.activeElement !== input && activeInput !== input) return;
      renderList(input, data || { results: [] });
    } catch (e) {
      console.warn("place suggest failed", e);
      if (reqId !== s.reqId) return;
      showStatus(input, "Ortssuche nicht erreichbar.", true);
    }
  }

  function onFocus(ev) {
    const t = ev.target;
    if (!t || !t.closest) return;
    const input = t.closest(SELECTOR);
    if (!input || isReadonlyBlocked(input)) return;
    const s = ensureState(input);
    s.session = uuid();
    // Config is often requested on the login screen (401). Reload once authenticated.
    if (!placesConfig.loaded) loadPlacesConfig();
  }

  function onInput(ev) {
    const t = ev.target;
    if (!t || !t.closest) return;
    const input = t.closest(SELECTOR);
    if (!input || isReadonlyBlocked(input)) return;
    const s = ensureState(input);
    if (s.debounce) clearTimeout(s.debounce);
    s.debounce = setTimeout(() => runSuggest(input), 300);
  }

  function onKeydown(ev) {
    const t = ev.target;
    if (!t || !t.closest) return;
    const input = t.closest(SELECTOR);
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
    const t = ev.target;
    if (!t || !t.closest) return;
    const input = t.closest(SELECTOR);
    if (!input) return;
    setTimeout(() => {
      if (activeInput === input) closeList();
    }, 180);
  }

  document.addEventListener("focusin", onFocus, true);
  document.addEventListener("input", onInput, true);
  document.addEventListener("keydown", onKeydown, true);
  document.addEventListener("focusout", onBlur, true);
  document.addEventListener("change", (ev) => {
    onAutoKmCheckboxChange(ev);
    const t = ev.target;
    if (t && (t.id === "travel-vehicle" || t.id === "edit-trip-vehicle")) {
      syncAutoKmUi();
    }
  }, true);
  window.addEventListener("resize", () => {
    if (activeList && activeInput) positionList(activeInput, activeList);
  });
  window.addEventListener("scroll", () => {
    if (activeList && activeInput) positionList(activeInput, activeList);
  }, true);

  loadPlacesConfig();
  window.__syncTravelAutoKmUi = syncAutoKmUi;
  window.__placeSuggestReady = true;
})();
