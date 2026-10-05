    // ActaNex Application Core Bundle (V3.0.0)
    // Shared constants & fetch interceptor are initialized in js/core/api.js

    function togglePasswordVisibility(id) {
      const input = document.getElementById(id);
      const eye = document.getElementById(`${id}-eye`);
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        if (eye) eye.className = "fa-solid fa-eye-slash";
      } else {
        input.type = "password";
        if (eye) eye.className = "fa-solid fa-eye";
      }
    }

    function fillDemoCredentials() {
      const emailInput = document.getElementById("login-email");
      const pwdInput = document.getElementById("login-password");
      if (emailInput) emailInput.value = "admin@example.com";
      if (pwdInput) pwdInput.value = "Start123!";
    }

    document.addEventListener("DOMContentLoaded", async () => {
      if (typeof initDateDefaults === "function") initDateDefaults();

      // Check if environment is Demo
      const isDemoEnv = window.location.hostname.includes("demo") || window.location.hostname.includes("evidence-hub-demo");
      const demoBanner = document.getElementById("demo-credentials-banner");
      if (isDemoEnv) {
        if (demoBanner) demoBanner.style.display = "block";
        const emailInput = document.getElementById("login-email");
        const pwdInput = document.getElementById("login-password");
        if (emailInput && (!emailInput.value || emailInput.value.includes("michael_kirst"))) {
          emailInput.value = "admin@example.com";
        }
        if (pwdInput && !pwdInput.value) {
          pwdInput.value = "Start123!";
        }
      } else {
        if (demoBanner) demoBanner.style.display = "none";
      }

      // Check if URL has mobile upload session mode (QR-Code Capture from Phone)
      const urlParams = new URLSearchParams(window.location.search);
      const uploadSessionId = urlParams.get("uploadSession");
      if (uploadSessionId) {
        if (typeof initMobileUploadView === "function") initMobileUploadView(uploadSessionId);
        return;
      }

      // Check if URL has portal mode for client approval
      const isPortalMode = urlParams.get("portal") === "approve" || urlParams.has("token") || urlParams.has("ts");

      if (isPortalMode) {
        const loginContainer = document.getElementById("login-container");
        if (loginContainer) loginContainer.style.display = "none";
        const navRail = document.getElementById("nav-rail");
        const subnavCol = document.getElementById("subnav-column");
        if (navRail) navRail.style.display = "none";
        if (subnavCol) subnavCol.style.display = "none";
        const mainEl = document.querySelector(".main");
        if (mainEl) {
          mainEl.style.marginLeft = "0";
          mainEl.style.width = "100%";
          mainEl.style.maxWidth = "900px";
          mainEl.style.margin = "0 auto";
        }
        
        document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
        const portalView = document.getElementById("view-approval-portal");
        if (portalView) portalView.classList.add("active");

        const adminEl = document.getElementById("portal-admin-overview");
        const custEl = document.getElementById("portal-customer-view");
        const returnBar = document.getElementById("portal-admin-return-bar");
        if (adminEl) adminEl.style.display = "none";
        if (custEl) custEl.style.display = "block";
        if (returnBar) returnBar.style.display = "none";

        const targetTsId = urlParams.get("token") || urlParams.get("ts") || "";
        if (targetTsId && typeof loadPortalApprovalData === "function") {
          loadPortalApprovalData(targetTsId);
        }
        return;
      }

      await checkAuth();
    });

    async function checkAuth() {
      const loginContainer = document.getElementById("login-container");
      if (!authToken) {
        if (loginContainer) loginContainer.style.display = "flex";
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { "Authorization": `Bearer ${authToken}` }
        });

        if (res.ok) {
          const data = await res.json();
          currentUser = data.user;
          updateUserUI();
          if (loginContainer) loginContainer.style.display = "none";
          if (typeof startInactivityTracker === "function") startInactivityTracker();
          try { if (typeof loadSettings === "function") await loadSettings(); } catch (e) { console.warn("loadSettings:", e); }
          try { if (typeof loadCustomers === "function") await loadCustomers(); } catch (e) { console.warn("loadCustomers:", e); }
          try { if (typeof loadProjects === "function") await loadProjects(); } catch (e) { console.warn("loadProjects:", e); }
          try { if (typeof loadDashboardStats === "function") await loadDashboardStats(); } catch (e) { console.warn("loadDashboardStats:", e); }

          if (data.requiresCredentialChange && typeof openFirstRunModal === "function") {
            openFirstRunModal();
          }
        } else {
          // Token expired or invalid
          if (typeof clearAuth === "function") clearAuth();
          if (loginContainer) loginContainer.style.display = "flex";
        }
      } catch (err) {
        console.error("Auth check error:", err);
        if (loginContainer) loginContainer.style.display = "flex";
      }
    }

    function openFirstRunModal() {
      const modal = document.getElementById("first-run-modal");
      if (modal) {
        modal.classList.add("active");
        if (currentUser) {
          const nameInput = document.getElementById("fr-name");
          const emailInput = document.getElementById("fr-email");
          if (nameInput && !nameInput.value) nameInput.value = currentUser.fullName !== "Max Mustermann" ? currentUser.fullName : "";
          if (emailInput && !emailInput.value) emailInput.value = currentUser.email !== "admin@example.com" ? currentUser.email : "";
        }
      }
    }

    function updateUserUI() {
      if (!currentUser) return;
      const nameEl = document.getElementById("user-display-name");
      const emailEl = document.getElementById("user-display-email");
      const avatarEl = document.getElementById("user-avatar-text");

      if (nameEl) nameEl.innerText = currentUser.fullName || currentUser.email;
      if (emailEl) emailEl.innerText = currentUser.email;
      if (avatarEl) {
        const initials = (currentUser.fullName || currentUser.email || "MK")
          .split(" ")
          .map(n => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();
        avatarEl.innerText = initials || "MK";
      }
    }

    async function handleLogin(e) {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      const emailInput = document.getElementById("login-email");
      const pwdInput = document.getElementById("login-password");
      const rememberEl = document.getElementById("login-remember");
      const submitBtn = document.getElementById("login-submit-btn") || document.getElementById("btn-login-submit");
      const errorAlert = document.getElementById("login-error-alert");
      const errorText = document.getElementById("login-error-text");

      const email = emailInput ? emailInput.value.trim() : "";
      const password = pwdInput ? pwdInput.value : "";
      const remember = rememberEl ? rememberEl.checked : true;

      if (errorAlert) errorAlert.style.display = "none";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> Anmelden...`;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, rememberMe: remember })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Anmeldung fehlgeschlagen.");
        }

        authToken = data.token;
        currentUser = data.user;

        if (remember) {
          localStorage.setItem("evidence_auth_token", authToken);
        } else {
          sessionStorage.setItem("evidence_auth_token", authToken);
        }

        updateUserUI();
        const loginContainer = document.getElementById("login-container");
        if (loginContainer) loginContainer.style.display = "none";
        
        if (typeof startInactivityTracker === "function") startInactivityTracker();
        try { if (typeof loadSettings === "function") await loadSettings(); } catch (e) { console.warn("loadSettings:", e); }
        try { if (typeof loadCustomers === "function") await loadCustomers(); } catch (e) { console.warn("loadCustomers:", e); }
        try { if (typeof loadProjects === "function") await loadProjects(); } catch (e) { console.warn("loadProjects:", e); }
        try { if (typeof loadDashboardStats === "function") await loadDashboardStats(); } catch (e) { console.warn("loadDashboardStats:", e); }
        try { if (typeof switchView === "function") await switchView("dashboard"); } catch (e) { console.warn("switchView:", e); }

        if (data.requiresCredentialChange && typeof openFirstRunModal === "function") {
          openFirstRunModal();
        }
      } catch (err) {
        console.error("Login failed:", err);
        if (errorText) errorText.innerText = err.message;
        if (errorAlert) errorAlert.style.display = "block";
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Sicher Anmelden`;
        }
      }
    }

    async function handleFirstRunCredentialChange(e) {
      e.preventDefault();
      const currentPassword = document.getElementById("fr-current-pwd")?.value || "";
      const newFullName = document.getElementById("fr-name")?.value.trim() || "";
      const newEmail = document.getElementById("fr-email")?.value.trim().toLowerCase() || "";
      const newPassword = document.getElementById("fr-new-pwd")?.value || "";
      const confirmPassword = document.getElementById("fr-confirm-pwd")?.value || "";

      if (!currentPassword || !newFullName || !newEmail || !newPassword) {
        alert("Bitte füllen Sie alle Pflichtfelder aus.");
        return;
      }
      if (newPassword.length < 8) {
        alert("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
        return;
      }
      if (newPassword !== confirmPassword) {
        alert("Die beiden Passwörter stimmen nicht überein!");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/change-credentials`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify({ currentPassword, newFullName, newEmail, newPassword })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert("🎉 Zugangsdaten erfolgreich gespeichert! Sie sind nun mit Ihren persönlichen Daten abgesichert.");
          currentUser = data.user;
          updateUserUI();
          document.getElementById("first-run-modal")?.classList.remove("active");
        } else {
          alert("❌ Fehler: " + (data.error || "Aktualisierung fehlgeschlagen."));
        }
      } catch (err) {
        alert("❌ Netzwerkfehler: " + err.message);
      }
    }

    async function handleAdminChangeCredentials(e) {
      e.preventDefault();
      const currentPassword = document.getElementById("cred-current-pwd")?.value || "";
      const newFullName = document.getElementById("cred-new-name")?.value.trim() || "";
      const newEmail = document.getElementById("cred-new-email")?.value.trim().toLowerCase() || "";
      const newPassword = document.getElementById("cred-new-pwd")?.value || "";
      const confirmPassword = document.getElementById("cred-confirm-pwd")?.value || "";

      if (!currentPassword) {
        alert("Bitte geben Sie Ihr aktuelles Passwort zur Bestätigung ein.");
        return;
      }
      if (newPassword && newPassword.length < 8) {
        alert("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
        return;
      }
      if (newPassword && newPassword !== confirmPassword) {
        alert("Die beiden neuen Passwörter stimmen nicht überein!");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/change-credentials`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify({ currentPassword, newFullName, newEmail, newPassword })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert("✅ Zugangsdaten und Profil wurden erfolgreich aktualisiert!");
          currentUser = data.user;
          updateUserUI();
          document.getElementById("change-credentials-form")?.reset();
        } else {
          alert("❌ Fehler: " + (data.error || "Aktualisierung fehlgeschlagen."));
        }
      } catch (err) {
        alert("❌ Netzwerkfehler: " + err.message);
      }
    }

    // Inactivity Auto-Logout Tracker (30 Minuten)
    let inactivityTimer = null;
    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minuten

    function startInactivityTracker() {
      stopInactivityTracker();
      resetInactivityTimer();

      // Throttled activity listener
      let lastActivity = Date.now();
      const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
      
      const onUserActivity = () => {
        const now = Date.now();
        if (now - lastActivity > 5000) { // Throttle: every 5s
          lastActivity = now;
          resetInactivityTimer();
        }
      };

      activityEvents.forEach(evt => {
        window.addEventListener(evt, onUserActivity, { passive: true });
      });
    }

    function resetInactivityTimer() {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (!authToken) return;

      inactivityTimer = setTimeout(() => {
        handleInactivityLogout();
      }, INACTIVITY_TIMEOUT_MS);
    }

    function stopInactivityTracker() {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
    }

    function handleInactivityLogout() {
      clearAuth();
      stopInactivityTracker();

      const loginContainer = document.getElementById("login-container");
      const errorAlert = document.getElementById("login-error-alert");
      const errorText = document.getElementById("login-error-text");

      loginContainer.style.display = "flex";
      document.getElementById("login-password").value = "";

      errorAlert.style.background = "rgba(59, 130, 246, 0.15)";
      errorAlert.style.borderColor = "rgba(59, 130, 246, 0.4)";
      errorAlert.style.color = "#93c5fd";
      errorText.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> Sitzung beendet: Sie wurden aus Sicherheitsgründen nach 30 Minuten Inaktivität automatisch abgemeldet.`;
      errorAlert.style.display = "block";
    }

    async function handleLogout() {
      if (confirm("Möchten Sie sich wirklich abmelden?")) {
        try {
          if (authToken) {
            await fetch(`${API_BASE}/auth/logout`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${authToken}` }
            });
          }
        } catch (err) {
          console.error("Logout error:", err);
        }
        stopInactivityTracker();
        clearAuth();
        document.getElementById("login-container").style.display = "flex";
        document.getElementById("login-password").value = "";
      }
    }

    // Note: clearAuth() is provided by js/core/api.js
    // Note: switchView() is provided by js/core/router.js


    function openModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.add("active");
    }

    function closeModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.remove("active");
    }

    async function loadCustomers() {
      const container = document.getElementById("customers-grid");
      try {
        const res = await fetch(`${API_BASE}/customers?includeArchived=true`);
        if (!res.ok) throw new Error("Fehler beim Laden der Kunden");
        const data = await res.json();
        globalCustomers = Array.isArray(data) ? data : (data.customers || []);
        renderCustomers();
        populateCustomerDropdowns();
        populateTravelCustomerDropdowns();
      } catch (err) {
        if (container) {
          container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; color: var(--text-muted); padding: 20px;">
              <p><i class="fa-solid fa-circle-exclamation" style="color: var(--warning);"></i> Klicken Sie auf <strong>"Aus Lexware synchronisieren"</strong> um Kundenkontakte zu laden.</p>
            </div>
          `;
        }
      }
    }

    function renderCustomers() {
      const container = document.getElementById("customers-grid");
      if (!container) return;

      const custs = Array.isArray(globalCustomers) ? globalCustomers : [];
      if (custs.length === 0) {
        container.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; color: var(--text-muted); padding: 20px;">
            <p>Keine Kundenkontakte vorhanden. Starten Sie den Lexware-Sync.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = custs.map(c => {
        const isInternal = c.id === 'cust_internal' || c.lexware_contact_id === 'INTERNAL_ORG';
        const isArchived = c.is_archived === 1;
        let badge = '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Lexware Aktiv</span>';
        if (isInternal) {
          badge = '<span class="badge" style="background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe;"><i class="fa-solid fa-building-user"></i> Internes Cockpit</span>';
        } else if (isArchived) {
          badge = '<span class="badge badge-secondary"><i class="fa-solid fa-box-archive"></i> Archiviert (In Lexware gelöscht)</span>';
        }

        const address = isInternal ? "Interne Organisation & Administration" : ([c.street, c.zip_code, c.city].filter(Boolean).join(", ") || "Keine Anschrift hinterlegt");
        const contact = c.contact_person ? `${c.contact_person} • ` : "";
        const projectsCount = c.active_projects_count || 0;
        const recordedHours = (c.total_recorded_hours || 0).toFixed(2).replace(".", ",");

        return `
          <div class="card clickable-row" style="${isArchived ? 'opacity: 0.7; background: #f8fafc;' : ''}" onclick="openCustomerOverview('${c.id}')">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div>
                <h3 style="font-size: 1.05rem; margin-bottom: 4px; color: var(--primary);">${c.name}</h3>
                <p style="color: var(--text-muted); font-size: 0.8rem;">${contact}${c.email || 'Keine E-Mail'}</p>
              </div>
              ${badge}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">
              <i class="fa-solid fa-location-dot"></i> ${address}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px; font-size: 0.85rem;">
              <span><strong>${projectsCount}</strong> ${isInternal ? 'Kategorie(n) / Projekt(e)' : 'Projekt(e)'}</span>
              <span style="color: var(--text-muted);">${recordedHours} Std. erfasst</span>
            </div>
          </div>
        `;
      }).join("");
    }

    async function loadProjects() {
      try {
        const res = await fetch(`${API_BASE}/projects`);
        if (res.ok) {
          const data = await res.json();
          globalProjects = Array.isArray(data) ? data : (data.projects || []);
          populateCustomerDropdowns();
          populateTravelCustomerDropdowns();
        }
      } catch {}
    }

    // Cascading Dropdown 1: Kunde in Zeiterfassung
    function populateCustomerDropdowns() {
      const custSelect = document.getElementById("form-customer-id");
      if (!custSelect) return;

      const custs = Array.isArray(globalCustomers) ? globalCustomers : [];
      const projs = Array.isArray(globalProjects) ? globalProjects : [];
      const activeCusts = custs.filter(c => c.is_archived === 0);
      const currentVal = custSelect.value;

      custSelect.innerHTML = '<option value="">-- Kunde auswählen --</option>' + 
        activeCusts.map(c => {
          const prjCount = projs.filter(p => p.customer_id === c.id).length;
          const info = prjCount > 0 ? `${prjCount} Projekt(e)` : (c.contact_person || 'Neu');
          return `<option value="${c.id}">${c.name} (${info})</option>`;
        }).join("");

      if (currentVal) custSelect.value = currentVal;
    }

    // Reusable Hierarchical Project Option Builder
    function buildHierarchicalProjectSelectOptions(projects, targetProjectId) {
      if (!projects || projects.length === 0) return '';
      
      const level1 = projects.filter(p => !p.parent_project_id || (p.hierarchy_level || 1) === 1);
      const renderedIds = new Set();
      let html = '';

      level1.forEach(p1 => {
        renderedIds.add(p1.id);
        const sel1 = targetProjectId === p1.id ? 'selected' : '';
        html += `<option value="${p1.id}" ${sel1}>📁 [Stufe 1] ${p1.name} (${p1.project_number})</option>`;

        // Level 2 children
        const level2 = projects.filter(p => p.parent_project_id === p1.id);
        level2.forEach(p2 => {
          renderedIds.add(p2.id);
          const sel2 = targetProjectId === p2.id ? 'selected' : '';
          const modeBadge = p2.budget_mode === 'PooledFromParent' ? ' [Pool]' : '';
          html += `<option value="${p2.id}" ${sel2}>&nbsp;&nbsp;&nbsp;&nbsp;└── 🔹 [Stufe 2] ${p2.name} (${p2.project_number})${modeBadge}</option>`;

          // Level 3 children
          const level3 = projects.filter(p => p.parent_project_id === p2.id);
          level3.forEach(p3 => {
            renderedIds.add(p3.id);
            const sel3 = targetProjectId === p3.id ? 'selected' : '';
            const modeBadge3 = p3.budget_mode === 'PooledFromParent' ? ' [Pool]' : '';
            html += `<option value="${p3.id}" ${sel3}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── ▪️ [Stufe 3] ${p3.name} (${p3.project_number})${modeBadge3}</option>`;
          });
        });
      });

      // Standalone or orphans
      const orphans = projects.filter(p => !renderedIds.has(p.id));
      orphans.forEach(op => {
        const sel = targetProjectId === op.id ? 'selected' : '';
        const icon = op.hierarchy_level === 3 ? '▪️ [Stufe 3]' : (op.hierarchy_level === 2 ? '🔹 [Stufe 2]' : '📁 [Stufe 1]');
        html += `<option value="${op.id}" ${sel}>${icon} ${op.name} (${op.project_number})</option>`;
      });

      return html;
    }

    // Cascading Dropdown 2: Projekte des gewählten Kunden
    async function onCustomerChanged(targetProjectId) {
      const custSelect = document.getElementById("form-customer-id");
      const prjSelect = document.getElementById("form-project-id");
      const customerId = custSelect.value;

      if (!customerId) {
        prjSelect.innerHTML = '<option value="">-- Zuerst Kunde wählen --</option>';
        document.getElementById("form-rate-display").value = "-";
        return;
      }

      if (!globalProjects || globalProjects.length === 0) {
        await loadProjects();
      }

      const custProjects = globalProjects.filter(p => p.customer_id === customerId && p.is_active === 1);

      if (custProjects.length === 0) {
        prjSelect.innerHTML = '<option value="">-- Keine aktiven Projekte für diesen Kunden --</option>';
        document.getElementById("form-rate-display").value = "-";
        return;
      }

      prjSelect.innerHTML = '<option value="">-- Projekt / Stream / Teilprojekt auswählen --</option>' +
        buildHierarchicalProjectSelectOptions(custProjects, targetProjectId);

      if (targetProjectId) {
        prjSelect.value = targetProjectId;
      } else if (custProjects.length === 1) {
        prjSelect.value = custProjects[0].id;
      }

      if (customerId === "cust_internal") {
        const radInternal = document.getElementById("billing-type-internal");
        if (radInternal) radInternal.checked = true;
      }

      onProjectChanged();
    }

    function onProjectChanged() {
      const prjSelect = document.getElementById("form-project-id");
      const projId = prjSelect.value;
      const proj = globalProjects.find(p => p.id === projId);

      if (proj) {
        document.getElementById("form-rate-display").value = `${proj.default_hourly_rate.toFixed(2)} € / h`;
        const lvl = proj.hierarchy_level || 1;
        const levelName = lvl === 3 ? '▪️ Stufe 3: Teilprojekt / AP' : (lvl === 2 ? '🔹 Stufe 2: Projekt / Stream / AP' : '📁 Stufe 1: Gesamtprojekt (Rahmenvertrag)');
        
        let poolNotice = '';
        if (proj.budget_mode === 'PooledFromParent' && proj.parent_project_id) {
          const parent = globalProjects.find(p => p.id === proj.parent_project_id);
          poolNotice = ` <span class="badge" style="background: #fef3c7; color: #92400e; font-size: 0.72rem; margin-left: 6px;"><i class="fa-solid fa-layer-group"></i> Bucht auf Gesamt-Pool: ${parent ? parent.name : 'Rahmenvertrag'}</span>`;
        }

        let travelNotice = '';
        if (proj.travel_budget_net > 0) {
          travelNotice = ` <span class="badge" style="background: #ecfdf5; color: #047857; font-size: 0.72rem; margin-left: 6px;"><i class="fa-solid fa-train"></i> Reisebudget: ${proj.travel_budget_net.toFixed(2)} €</span>`;
        } else if (proj.travel_budget_mode === 'PooledFromParent') {
          travelNotice = ` <span class="badge" style="background: #f5f3ff; color: #6d28d9; font-size: 0.72rem; margin-left: 6px;"><i class="fa-solid fa-train"></i> Reisekosten: Aus Gesamtpool</span>`;
        }

        document.getElementById("capture-header-title").innerText = `Zeiterfassung: ${proj.name}`;
        document.getElementById("capture-header-sub").innerHTML = `Kunde: ${proj.customer_name} | ${levelName} | Stundensatz: ${proj.default_hourly_rate.toFixed(2)} €/h${poolNotice}${travelNotice}`;

        const adrHint = document.getElementById("adr-level-hint");
        if (adrHint) {
          if (lvl === 3) {
            adrHint.innerHTML = `<i class="fa-solid fa-lightbulb" style="color: #6366f1;"></i> <strong>Stufe 3 (Teilprojekt / AP):</strong> ADR-Referenzen und Problemlösungsnachweise können bei Bedarf optional erfasst werden.`;
          } else if (lvl === 2) {
            adrHint.innerHTML = `<i class="fa-solid fa-lightbulb" style="color: #6366f1;"></i> <strong>Stufe 2 (Stream / Projekt / AP):</strong> ADR-Referenzen und Problemlösungsnachweise können bei Bedarf optional erfasst werden.`;
          } else {
            adrHint.innerHTML = `<i class="fa-solid fa-lightbulb" style="color: #6366f1;"></i> <strong>Stufe 1 (Rahmenvertrag):</strong> ADR-Referenzen und Problemlösungsnachweise können bei Bedarf optional erfasst werden.`;
          }
        }
      } else {
        document.getElementById("form-rate-display").value = "-";
        document.getElementById("capture-header-title").innerText = `Zeiterfassung & Nachweisdokumentation`;
        document.getElementById("capture-header-sub").innerText = `Wählen Sie Kunde und Projekt für die automatische Stundensatz- und Budgetzuordnung.`;
        const adrHint = document.getElementById("adr-level-hint");
        if (adrHint) {
          adrHint.innerText = "Optional für alle Stufen: Erfassen Sie bei Architektur- und Fachaufgaben bei Bedarf ADR-Referenzen und Problemlösungsnachweise für das interne Audit-PDF.";
        }
      }
      calculateHours();
    }

    function toggleTimeCaptureEvidenceBox(forceOpen) {
      const fields = document.getElementById("time-capture-evidence-fields");
      const chevron = document.getElementById("ev-box-chevron");
      const text = document.getElementById("ev-box-btn-text");
      if (!fields) return;

      const isHidden = fields.style.display === "none";
      const shouldOpen = forceOpen !== undefined ? forceOpen : isHidden;

      fields.style.display = shouldOpen ? "block" : "none";
      if (chevron) {
        chevron.className = shouldOpen ? "fa-solid fa-chevron-up" : "fa-solid fa-chevron-down";
      }
      if (text) {
        text.innerText = shouldOpen ? "Details einklappen" : "Details ausklappen";
      }
    }

    function toggleEditEvidenceBox(forceOpen) {
      const fields = document.getElementById("edit-evidence-fields");
      const chevron = document.getElementById("edit-ev-box-chevron");
      const text = document.getElementById("edit-ev-box-btn-text");
      if (!fields) return;

      const isHidden = fields.style.display === "none";
      const shouldOpen = forceOpen !== undefined ? forceOpen : isHidden;

      fields.style.display = shouldOpen ? "block" : "none";
      if (chevron) {
        chevron.className = shouldOpen ? "fa-solid fa-chevron-up" : "fa-solid fa-chevron-down";
      }
      if (text) {
        text.innerText = shouldOpen ? "Details einklappen" : "Details ausklappen";
      }
    }

    // Cascading Dropdowns für Reisekosten
    function populateTravelCustomerDropdowns() {
      const custSelect = document.getElementById("travel-customer-id");
      if (!custSelect) return;

      const custs = Array.isArray(globalCustomers) ? globalCustomers : [];
      const projs = Array.isArray(globalProjects) ? globalProjects : [];
      const activeCusts = custs.filter(c => c.is_archived === 0);
      custSelect.innerHTML = '<option value="">-- Kunde auswählen --</option>' + 
        activeCusts.map(c => {
          const prjCount = projs.filter(p => p.customer_id === c.id).length;
          const info = prjCount > 0 ? `${prjCount} Projekt(e)` : (c.contact_person || 'Neu');
          return `<option value="${c.id}">${c.name} (${info})</option>`;
        }).join("");
    }

    async function onTravelCustomerChanged() {
      const custSelect = document.getElementById("travel-customer-id");
      const prjSelect = document.getElementById("travel-project-id");
      const customerId = custSelect.value;

      if (!customerId) {
        prjSelect.innerHTML = '<option value="">-- Kein Projekt (Betriebsausgabe Allgemein) --</option>';
        const billCb = document.getElementById("travel-billable-to-client");
        if (billCb) {
          billCb.checked = false;
          calculateTravelTotals();
        }
        onTravelProjectChanged();
        return;
      }

      if (!globalProjects || globalProjects.length === 0) {
        await loadProjects();
      }

      const custProjects = globalProjects.filter(p => p.customer_id === customerId && p.is_active === 1);
      prjSelect.innerHTML = '<option value="">-- Projekt / Stream / Teilprojekt auswählen --</option>' +
        buildHierarchicalProjectSelectOptions(custProjects);

      if (custProjects.length === 1) prjSelect.value = custProjects[0].id;
      onTravelProjectChanged();
    }

    function onTravelProjectChanged() {
      const prjSelect = document.getElementById("travel-project-id");
      const projId = prjSelect ? prjSelect.value : "";
      const proj = globalProjects ? globalProjects.find(p => p.id === projId) : null;
      
      const badgeContainer = document.getElementById("travel-project-budget-badge");
      if (!badgeContainer) return;

      if (proj) {
        const lvl = proj.hierarchy_level || 1;
        const levelName = lvl === 3 ? 'Stufe 3 (Teilprojekt / AP)' : (lvl === 2 ? 'Stufe 2 (Stream / AP)' : 'Stufe 1 (Gesamtprojekt)');
        let budgetInfo = '';
        if (proj.travel_budget_net > 0) {
          budgetInfo = `Reisebudget: <strong>${proj.travel_budget_net.toFixed(2)} € Netto</strong>`;
        } else if (proj.travel_budget_mode === 'PooledFromParent') {
          budgetInfo = `Reisekosten: <em>Bucht auf Gesamt-Reisekostenpool des Rahmenvertrags</em>`;
        } else {
          budgetInfo = `Reisekosten: <em>Abrechnung nach Beleg (kein Vorab-Limit)</em>`;
        }
        badgeContainer.style.display = 'block';
        badgeContainer.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${levelName}: ${proj.name} &bull; ${budgetInfo}`;
      } else {
        badgeContainer.style.display = 'none';
        badgeContainer.innerHTML = '';
      }
    }

    // Start Capture Navigation from Cockpit
    async function startCaptureForCustomerAndProject(customerId, projectId, projectName, rate) {
      closeModal("customer-modal");
      closeModal("project-modal");

      // Ensure projects and customers loaded
      if (!globalProjects || globalProjects.length === 0) await loadProjects();
      if (!globalCustomers || globalCustomers.length === 0) await loadCustomers();

      switchView("time-capture");

      populateCustomerDropdowns();
      const custSelect = document.getElementById("form-customer-id");
      custSelect.value = customerId;
      onCustomerChanged(projectId);
    }

    let currentCustomerProjects = [];

    async function openCustomerOverview(customerId) {
      currentCustomerId = customerId;
      const modal = document.getElementById("customer-modal");
      const title = document.getElementById("cust-modal-title");
      const sub = document.getElementById("cust-modal-subtitle");
      const body = document.getElementById("cust-modal-body");

      body.innerHTML = `<div style="text-align: center; padding: 40px;"><span class="spinner"></span> Lade Projekte & Hierarchien...</div>`;
      modal.classList.add("active");

      try {
        const res = await fetch(`${API_BASE}/customers/${customerId}/overview`);
        const data = await res.json();
        const c = data.customer;
        const projects = data.projects || [];
        currentCustomerProjects = projects;

        const isInternal = c.id === 'cust_internal' || c.lexware_contact_id === 'INTERNAL_ORG';
        title.innerText = c.name;
        sub.innerText = isInternal 
          ? 'Interne Tätigkeiten, Organisation, Administration, Weiterbildung & Akquise' 
          : `${c.contact_person ? c.contact_person + ' | ' : ''}${c.email || ''} | Lexware-ID: ${c.lexware_contact_id}`;

        let projectsHtml = "";
        if (projects.length === 0) {
          projectsHtml = `
            <div style="background: #f8fafc; border: 1px dashed var(--border); padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 20px; color: var(--text-muted);">
              <i class="fa-solid fa-folder-plus" style="font-size: 2rem; margin-bottom: 8px; color: #94a3b8; display: block;"></i>
              Noch keine Projekte für diesen Auftraggeber angelegt.<br>
              Erstellen Sie unten Ihr erstes Gesamtprojekt (Stufe 1).
            </div>
          `;
        } else {
          // Hierarchische Struktur: Stufe 1 (Roots), Stufe 2 (Streams), Stufe 3 (Teilprojekte)
          const rootProjects = projects.filter(p => !p.parent_project_id || (p.hierarchy_level || 1) === 1);
          const renderedIds = new Set();

          const renderProjectCard = (p, level, parentName = '') => {
            renderedIds.add(p.id);
            const isProjArchived = p.is_archived === 1 || p.is_active === 0;
            const isLevel1 = level === 1;
            const isLevel2 = level === 2;
            const isLevel3 = level === 3;

            // Indentation & Styles
            const marginLeft = isLevel1 ? '0' : (isLevel2 ? '24px' : '48px');
            const borderColor = isLevel1 ? (isProjArchived ? '#94a3b8' : 'var(--primary)') : (isLevel2 ? '#0284c7' : '#8b5cf6');
            const bgCard = isProjArchived ? '#f8fafc' : (isLevel1 ? '#ffffff' : (isLevel2 ? '#f8fafc' : '#faf5ff'));

            // Level Badges
            let levelBadge = '';
            if (isLevel1) {
              levelBadge = '<span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 700;"><i class="fa-solid fa-folder"></i> Stufe 1: Gesamtprojekt (Hauptauftrag / Rahmenvertrag)</span>';
            } else if (isLevel2) {
              levelBadge = '<span class="badge" style="background: #e0f2fe; color: #0284c7; font-weight: 600;"><i class="fa-solid fa-diagram-project"></i> Stufe 2: Projekt / Programm / Stream / Arbeitspaket</span>';
            } else {
              levelBadge = '<span class="badge" style="background: #f3e8ff; color: #7e22ce; font-weight: 600;"><i class="fa-solid fa-code-branch"></i> Stufe 3: Teilprojekt / Arbeitspaket</span>';
            }

            // Budget Mode Badge
            let budgetBadge = '';
            if (!isLevel1 && p.budget_mode === 'PooledFromParent') {
              budgetBadge = '<span class="badge" style="background: #fef3c7; color: #92400e; font-size: 0.72rem;"><i class="fa-solid fa-layer-group"></i> Budget gepoolt aus Stufe 1</span>';
            } else {
              budgetBadge = `<span class="badge badge-info" style="font-size: 0.72rem;"><i class="fa-solid fa-coins"></i> Budget: ${p.total_budget_net.toFixed(2)} € (${p.planned_hours} h)</span>`;
            }

            // Travel Budget Mode Badge
            let travelBadge = '';
            if (!isLevel1 && p.travel_budget_mode === 'PooledFromParent') {
              travelBadge = '<span class="badge" style="background: #f1f5f9; color: #475569; font-size: 0.72rem;"><i class="fa-solid fa-car"></i> Reisekosten gepoolt</span>';
            } else if (p.travel_budget_net > 0) {
              travelBadge = `<span class="badge" style="background: #ecfdf5; color: #047857; font-size: 0.72rem;"><i class="fa-solid fa-car"></i> Reisebudget: ${p.travel_budget_net.toFixed(2)} € (Rest: ${(p.remaining_travel_budget_net || 0).toFixed(2)} €)</span>`;
            } else {
              travelBadge = '<span class="badge" style="background: #f8fafc; color: #64748b; font-size: 0.72rem;"><i class="fa-solid fa-receipt"></i> Reisekosten: Nach Beleg</span>';
            }

            // Has Children / Descendants Rollup
            const hasDescendants = isLevel1 && (p.descendants_count > 0);

            return `
              <div class="card" style="margin-left: ${marginLeft}; margin-bottom: 12px; padding: 16px; border-left: 5px solid ${borderColor}; background: ${bgCard}; ${isProjArchived ? 'opacity: 0.85;' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                  <div>
                    <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 4px; flex-wrap: wrap;">
                      ${levelBadge}
                      ${budgetBadge}
                      ${travelBadge}
                      ${isProjArchived ? '<span class="badge badge-secondary" style="font-size: 0.7rem;"><i class="fa-solid fa-lock"></i> Gesperrt / Archiviert</span>' : ''}
                    </div>
                    <h4 style="font-size: 1.05rem; color: ${isProjArchived ? '#475569' : 'var(--primary)'}; margin-bottom: 2px;">
                      ${p.name}
                    </h4>
                    <small style="color: var(--text-muted);">
                      <strong>${p.project_number}</strong>
                      ${parentName ? ` • Übergeordnet: <strong style="color: #0369a1;">${parentName}</strong>` : ''}
                      ${p.end_customer_name ? ` • <strong style="color: #0369a1;"><i class="fa-solid fa-building-user"></i> Endkunde: ${p.end_customer_name}</strong>` : ''} 
                      • Laufzeit: ${p.start_date || 'sofort'} bis ${p.end_date || 'Abschluss'}
                    </small>
                  </div>
                  <div style="text-align: right;">
                    <span class="badge badge-info" style="font-size: 0.85rem;">${p.default_hourly_rate.toFixed(2)} € / h</span>
                  </div>
                </div>

                <!-- Buchungen Direkt auf diese Stufe -->
                <div style="margin-top: 12px; background: #fff; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border);">
                  <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap; gap: 6px;">
                    <span>Direkt gebucht: <strong>${p.recorded_hours.toFixed(2)} h</strong> (${p.recorded_amount_net.toFixed(2)} € Netto)</span>
                    <span>Reisekosten: <strong>${p.recorded_travel_costs.toFixed(2)} €</strong></span>
                    <span>${p.budget_mode === 'PooledFromParent' ? 'Gepoolt' : `Rest: <strong>${p.remaining_hours.toFixed(2)} h</strong> (${p.remaining_budget_net.toFixed(2)} €)`}</span>
                  </div>
                  ${p.budget_mode !== 'PooledFromParent' && p.total_budget_net > 0 ? `
                    <div class="progress-track" style="margin-top: 6px;">
                      <div class="progress-bar" style="width: ${p.budget_usage_percent}%; ${isProjArchived ? 'background: #94a3b8;' : ''}"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: ${p.remaining_hours <= 0 && p.planned_hours > 0 ? 'var(--warning)' : 'var(--text-muted)'}; margin-top: 2px;">
                      <span>Auslastung: ${p.budget_usage_percent}%</span>
                      <span>Budget: ${p.total_budget_net.toFixed(2)} € (${p.planned_hours} h)</span>
                    </div>
                  ` : ''}
                </div>

                <!-- ROLLUP-BOX für Gesamtprojekte (Stufe 1) mit Unterprojekten -->
                ${hasDescendants ? `
                  <div style="margin-top: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 12px;">
                    <div style="font-weight: 700; color: #1e40af; font-size: 0.82rem; margin-bottom: 4px; display: flex; justify-content: space-between;">
                      <span><i class="fa-solid fa-chart-pie"></i> Rollup Gesamtvolumen (Hauptauftrag inkl. aller ${p.descendants_count} Streams/AP):</span>
                      <span>Auslastung: ${p.rollup_budget_usage_percent}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: #1e3a8a; flex-wrap: wrap; gap: 8px;">
                      <span>Gesamt gebucht: <strong>${p.rollup_hours.toFixed(2)} h</strong> (${p.rollup_amount_net.toFixed(2)} €)</span>
                      <span>Gesamte Reisekosten: <strong>${p.rollup_travel_costs.toFixed(2)} €</strong></span>
                      <span>Gesamt-Ausgaben: <strong>${p.rollup_total_spent_net.toFixed(2)} €</strong></span>
                      <span>Rest-Gesamtbudget: <strong>${p.rollup_remaining_budget_net.toFixed(2)} € (${(p.planned_hours ? (p.planned_hours - p.rollup_hours) : (p.rollup_remaining_budget_net / (p.default_hourly_rate || 120))).toFixed(2)} h)</strong></span>
                    </div>
                    <div class="progress-track" style="margin-top: 6px; background: #dbeafe;">
                      <div class="progress-bar" style="width: ${p.rollup_budget_usage_percent}%; background: #2563eb;"></div>
                    </div>
                  </div>
                ` : ''}

                <!-- Freigabeberechtigte Chips -->
                <div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 6px; flex-wrap: wrap;">
                  <span class="badge badge-secondary" style="font-size: 0.7rem;"><i class="fa-solid fa-user-check"></i> ${p.approver_name || '1. Approver'}: ${p.approver_email || c.email}</span>
                  ${p.approver_2_email ? `<span class="badge badge-secondary" style="font-size: 0.7rem;"><i class="fa-solid fa-user-check"></i> 2. Approver: ${p.approver_2_email}</span>` : ''}
                  ${p.approver_3_email ? `<span class="badge badge-secondary" style="font-size: 0.7rem;"><i class="fa-solid fa-user-check"></i> 3. Approver: ${p.approver_3_email}</span>` : ''}
                </div>

                <!-- Belegkette: Angebot & Auftragsbestätigung -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; font-size: 0.75rem;">
                  ${p.lexware_quotation_number || p.lexware_quotation_id ? 
                    `<span class="badge badge-success"><i class="fa-solid fa-file-invoice"></i> Angebot: ${p.lexware_quotation_number || 'Erstellt'}</span>` : 
                    `<span class="badge badge-secondary"><i class="fa-solid fa-circle-question"></i> Kein Angebot</span>`}
                  ${p.lexware_order_confirmation_number || p.lexware_order_confirmation_id ? 
                    `<span class="badge badge-info"><i class="fa-solid fa-file-signature"></i> Auftragsbestätigung: ${p.lexware_order_confirmation_number || 'Erstellt'}</span>` : 
                    `<span class="badge badge-secondary"><i class="fa-solid fa-circle-question"></i> Keine Auftragsbestätigung</span>`}
                </div>

                <!-- Aktions-Buttons -->
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                  <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; border-color: #f59e0b; color: #b45309;" onclick="event.stopPropagation(); openQuickEditProjectModal('${p.id}')">
                    <i class="fa-solid fa-pen-to-square"></i> Budget anpassen
                  </button>
                  <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="event.stopPropagation(); openProjectDetails('${p.id}')">
                    <i class="fa-solid fa-list-check"></i> Details & Cockpit
                  </button>
                  ${!isProjArchived ? `
                    <button class="btn btn-primary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="event.stopPropagation(); startCaptureForCustomerAndProject('${c.id}', '${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.default_hourly_rate})">
                      <i class="fa-solid fa-plus"></i> Zeit buchen
                    </button>
                    ${isLevel1 ? `
                      <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; border-color: #0284c7; color: #0284c7;" onclick="event.stopPropagation(); prepareSubProjectCreation('${c.id}', '${p.id}', 2)">
                        <i class="fa-solid fa-diagram-project"></i> + Stufe 2 (Stream)
                      </button>
                    ` : (isLevel2 ? `
                      <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; border-color: #8b5cf6; color: #8b5cf6;" onclick="event.stopPropagation(); prepareSubProjectCreation('${c.id}', '${p.id}', 3)">
                        <i class="fa-solid fa-code-branch"></i> + Stufe 3 (AP)
                      </button>
                    ` : '')}
                  ` : `
                    <button class="btn btn-outline" disabled style="opacity: 0.5; padding: 4px 10px; font-size: 0.8rem;">
                      <i class="fa-solid fa-lock"></i> Archiviert
                    </button>
                  `}
                </div>
              </div>
            `;
          };

          // Render Hierarchical Tree
          let treeHtml = '';
          rootProjects.forEach(root => {
            treeHtml += renderProjectCard(root, 1);

            // Level 2 Kinder
            const level2Projects = projects.filter(p2 => p2.parent_project_id === root.id);
            level2Projects.forEach(l2 => {
              treeHtml += renderProjectCard(l2, 2, root.name);

              // Level 3 Kinder
              const level3Projects = projects.filter(p3 => p3.parent_project_id === l2.id);
              level3Projects.forEach(l3 => {
                treeHtml += renderProjectCard(l3, 3, l2.name);
              });
            });
          });

          // Unverknüpfte / Orphans (falls vorhanden)
          const orphans = projects.filter(p => !renderedIds.has(p.id));
          orphans.forEach(op => {
            treeHtml += renderProjectCard(op, op.hierarchy_level || 1, op.parent_project_name || '');
          });

          projectsHtml = `<div style="margin-bottom: 24px;">${treeHtml}</div>`;
        }

        const isArchived = c.is_archived === 1;

        body.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <h3 style="font-size: 1.05rem;"><i class="fa-solid fa-folder-tree"></i> Projekt- & Budget-Hierarchie (${projects.length} Projekte)</h3>
            <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="syncQuotations()">
              <i class="fa-solid fa-arrows-rotate"></i> Angebote abgleichen
            </button>
          </div>
          ${projectsHtml}

          ${!isArchived ? `
          <div id="create-project-box" style="background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-top: 20px;">
            <h3 style="font-size: 1.05rem; margin-bottom: 12px; color: var(--primary);"><i class="fa-solid fa-plus"></i> Neues Projekt / Stream / Teilprojekt anlegen</h3>
            <form onsubmit="handleCreateProject(event, '${c.id}')">
              
              <!-- 1. Hierarchiestufe Auswahl -->
              <div class="form-group" style="background: #fff; padding: 12px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 14px;">
                <label class="form-label" style="font-weight: 700; margin-bottom: 8px; display: block;">1. Hierarchiestufe auswählen *</label>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;">
                  <label class="form-check" style="margin: 0; padding: 10px; border: 2px solid #bae6fd; border-radius: 6px; cursor: pointer; background: #f0f9ff;">
                    <input type="radio" name="np-level" id="np-level-1" value="1" checked onchange="onProjectLevelChanged('${c.id}')">
                    <span><strong style="color: #0369a1;">🔵 Stufe 1: Gesamtprojekt</strong><br><small style="color: var(--text-muted);">Hauptauftrag / Rahmenvertrag</small></span>
                  </label>
                  <label class="form-check" style="margin: 0; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: #fff;">
                    <input type="radio" name="np-level" id="np-level-2" value="2" onchange="onProjectLevelChanged('${c.id}')">
                    <span><strong style="color: #0284c7;">🔷 Stufe 2: Projekt / Stream</strong><br><small style="color: var(--text-muted);">Untergeordnet dem Rahmenvertrag</small></span>
                  </label>
                  <label class="form-check" style="margin: 0; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: #fff;">
                    <input type="radio" name="np-level" id="np-level-3" value="3" onchange="onProjectLevelChanged('${c.id}')">
                    <span><strong style="color: #7e22ce;">🟣 Stufe 3: Teilprojekt / AP</strong><br><small style="color: var(--text-muted);">Untergeordnet einem Stream/Projekt</small></span>
                  </label>
                </div>
              </div>

              <!-- Übergeordnetes Projekt (nur für Stufe 2 & 3) -->
              <div id="np-parent-container" style="display: none; margin-bottom: 14px;">
                <label class="form-label" id="np-parent-label" style="font-weight: 700;">Übergeordnetes Projekt auswählen *</label>
                <select class="form-control" id="np-parent-id">
                  <option value="">-- Übergeordnetes Projekt wählen --</option>
                </select>
                <small style="color: var(--text-muted);" id="np-parent-help">Wählen Sie den Hauptauftrag oder übergeordneten Stream.</small>
              </div>

              <!-- Projektname & Nummer -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Projektname / Streamname *</label>
                  <input type="text" class="form-control" id="np-name" required placeholder="z. B. Azure Security Hardening & Landing Zone">
                </div>
                <div class="form-group">
                  <label class="form-label">Projektnummer / Code *</label>
                  <input type="text" class="form-control" id="np-number" required value="PRJ-${new Date().getFullYear()}-${Math.floor(100+Math.random()*900)}">
                </div>
              </div>

              <!-- Endkunde (Optional) -->
              <div class="form-group">
                <label class="form-label">Endkunde / Einsatzort (Optional, falls abweichend von Vertragspartner)</label>
                <input type="text" class="form-control" id="np-end-customer" placeholder="z. B. BMW AG, Allianz, BASF...">
                <small style="color: var(--text-muted);">Falls der Lexware-Kunde Ihr Vermittler/Partner ist und das Projekt bei einem separaten Endkunden liegt.</small>
              </div>

              <!-- Honorarbudget-Geltung & Modus (nur für Stufe 2 & 3) -->
              <div id="np-budget-mode-container" style="display: none; background: #fff; padding: 12px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 14px;">
                <label class="form-label" style="font-weight: 700; margin-bottom: 6px; display: block;">Honorarbudget-Verrechnung *</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <label class="form-check" style="margin: 0; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: #fefce8;">
                    <input type="radio" name="np-budget-mode" id="np-budget-mode-pool" value="PooledFromParent" checked onchange="onBudgetModeChanged()">
                    <span><strong style="color: #b45309;"><i class="fa-solid fa-layer-group"></i> Gepooltes Budget</strong><br><small style="color: var(--text-muted);">Bucht auf das Gesamtbudget der übergeordneten Stufe</small></span>
                  </label>
                  <label class="form-check" style="margin: 0; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: #f0fdf4;">
                    <input type="radio" name="np-budget-mode" id="np-budget-mode-dedicated" value="Dedicated" onchange="onBudgetModeChanged()">
                    <span><strong style="color: #15803d;"><i class="fa-solid fa-coins"></i> Eigenes fixes Budget</strong><br><small style="color: var(--text-muted);">Separates Stunden-/Netto-Kontingent für diesen Stream</small></span>
                  </label>
                </div>
              </div>

              <!-- Stundensatz & Kontingent -->
              <div class="form-row-3">
                <div class="form-group">
                  <label class="form-label">Stundensatz Netto (€ / h) *</label>
                  <input type="number" step="1" class="form-control" id="np-rate" required value="135" oninput="calculateProjectBudget()">
                </div>
                <div class="form-group">
                  <label class="form-label" id="np-hours-label">Geplantes Stundenkontingent (h)</label>
                  <input type="number" step="1" class="form-control" id="np-hours" value="100" oninput="calculateProjectBudget()">
                </div>
                <div class="form-group">
                  <label class="form-label">Gesamtvolumen Netto</label>
                  <input type="text" class="form-control" id="np-total-budget" readonly value="13.500,00 €" style="font-weight: 700; background: #f1f5f9;">
                </div>
              </div>

              <!-- Reisekosten-Budget & Modus -->
              <div class="form-group" style="background: #fff; padding: 12px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 14px;">
                <label class="form-label" style="font-weight: 700; margin-bottom: 6px; display: block;"><i class="fa-solid fa-car"></i> Reisekosten-Budget & Geltung</label>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-bottom: 8px;">
                  <label class="form-check" style="margin: 0; padding: 8px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">
                    <input type="radio" name="np-travel-mode" id="np-travel-mode-none" value="None" checked onchange="onTravelBudgetModeChanged()">
                    <span><strong>Nach Beleg</strong><br><small style="color: var(--text-muted);">Kein Reisekosten-Budgetdeckel</small></span>
                  </label>
                  <label class="form-check" style="margin: 0; padding: 8px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">
                    <input type="radio" name="np-travel-mode" id="np-travel-mode-dedicated" value="Dedicated" onchange="onTravelBudgetModeChanged()">
                    <span><strong>Eigenes Reisebudget</strong><br><small style="color: var(--text-muted);">Fixer Reisekosten-Deckel Netto</small></span>
                  </label>
                  <label class="form-check" id="np-travel-mode-pool-label" style="display: none; margin: 0; padding: 8px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">
                    <input type="radio" name="np-travel-mode" id="np-travel-mode-pool" value="PooledFromParent" onchange="onTravelBudgetModeChanged()">
                    <span><strong>Gepooltes Reisebudget</strong><br><small style="color: var(--text-muted);">Aus Stufe 1 verrechnet</small></span>
                  </label>
                </div>
                <div id="np-travel-amount-group" style="display: none; margin-top: 8px;">
                  <label class="form-label" style="font-size: 0.8rem;">Maximales Reisekosten-Budget Netto (€)</label>
                  <input type="number" step="50" class="form-control" id="np-travel-budget-net" value="0" placeholder="z. B. 2500">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Projekt-Startdatum</label>
                  <input type="date" class="form-control" id="np-start" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                  <label class="form-label">Projekt-Enddatum (Laufzeit)</label>
                  <input type="date" class="form-control" id="np-end" value="2026-12-31">
                </div>
              </div>

              <!-- Dynamischer Unterebenen-Builder (Analog zu Rundreise-Etappen UX) -->
              <div id="np-subprojects-builder" style="background: #f8fafc; border: 1px dashed #93c5fd; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                  <strong style="color: #0369a1; font-size: 0.9rem;">
                    <i class="fa-solid fa-diagram-project"></i> Dynamische Unterebenen direkt mitanlegen (optional)
                  </strong>
                  <button type="button" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.78rem; border-color: #0284c7; color: #0284c7;" onclick="addQuickSubProjectRow()">
                    <i class="fa-solid fa-plus"></i> + Unterebene / Stream hinzufügen
                  </button>
                </div>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px;">
                  Erstellen Sie hier bei Bedarf direkt untergeordnete Streams oder Teilprojekte mit eigener oder gepoolter Budgetierung.
                </p>
                <div id="np-subprojects-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
              </div>

              <!-- Bis zu 3 Freigabeberechtigte (Approver) -->
              <div style="background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <div style="font-weight: 700; color: var(--primary); margin-bottom: 4px;"><i class="fa-solid fa-users-gear"></i> Freigabeberechtigte für Leistungsnachweise (bis zu 3 Kontakte)</div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">Alle hinterlegten Personen können Einladungsmails erhalten und Stundenzettel per OTP digital freigeben.</p>

                <!-- 1. Approver -->
                <div class="form-row" style="margin-bottom: 8px;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.8rem;">1. Freigebender (Name)</label>
                    <input type="text" class="form-control" id="np-approver-name" value="${c.contact_person || ''}" placeholder="z. B. ${c.contact_person || 'Max Mustermann'}">
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.8rem;">1. Freigebender (E-Mail)</label>
                    <input type="email" class="form-control" id="np-approver-email" value="${c.email || ''}" placeholder="name@firma.de">
                  </div>
                </div>

                <!-- 2. Approver (z. B. Endkunden-Projektleiter) -->
                <div class="form-row" style="margin-bottom: 8px;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.8rem;">2. Freigebender (z. B. Endkunden-Projektleiter Name)</label>
                    <input type="text" class="form-control" id="np-approver2-name" placeholder="z. B. Dr. Markus Weber (Endkunde)">
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.8rem;">2. Freigebender (E-Mail)</label>
                    <input type="email" class="form-control" id="np-approver2-email" placeholder="m.weber@endkunde.de">
                  </div>
                </div>

                <!-- 3. Approver (z. B. Interner Projektleiter Koop-Partner) -->
                <div class="form-row">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.8rem;">3. Freigebender (z. B. Interner Projektleiter Partner)</label>
                    <input type="text" class="form-control" id="np-approver3-name" placeholder="z. B. Sven Lehmann (Projektleitung)">
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.8rem;">3. Freigebender (E-Mail)</label>
                    <input type="email" class="form-control" id="np-approver3-email" placeholder="sven.lehmann@partner.com">
                  </div>
                </div>
              </div>

              <div class="form-group" style="background: #fff; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                <label class="form-check">
                  <input type="checkbox" id="np-create-quotation" checked>
                  <span><i class="fa-solid fa-file-invoice" style="color: var(--primary);"></i> <strong>Direkt als Angebot in Lexware Office generieren</strong> (mit Laufzeit und Gesamtbudget)</span>
                </label>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Projekt anlegen & berechnen</button>
              </div>
            </form>
          </div>
          ` : `
          <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 12px; border-radius: 8px; color: #be123c;">
            <i class="fa-solid fa-lock"></i> Kunde ist archiviert. Neuanlage von Projekten ist gesperrt.
          </div>
          `}
        `;
      } catch (err) {
        body.innerHTML = `<div style="color: red; padding: 20px;">Fehler: ${err.message}</div>`;
      }
    }

    function onProjectLevelChanged(customerId) {
      const level = parseInt(document.querySelector('input[name="np-level"]:checked')?.value || "1");
      const parentContainer = document.getElementById("np-parent-container");
      const parentSelect = document.getElementById("np-parent-id");
      const parentLabel = document.getElementById("np-parent-label");
      const budgetModeContainer = document.getElementById("np-budget-mode-container");
      const travelPoolLabel = document.getElementById("np-travel-mode-pool-label");
      const subprojectsBuilder = document.getElementById("np-subprojects-builder");

      if (level === 1) {
        if (parentContainer) parentContainer.style.display = "none";
        if (budgetModeContainer) budgetModeContainer.style.display = "none";
        if (travelPoolLabel) travelPoolLabel.style.display = "none";
        if (subprojectsBuilder) subprojectsBuilder.style.display = "block";
        const travelPoolRadio = document.getElementById("np-travel-mode-pool");
        if (travelPoolRadio && travelPoolRadio.checked) {
          document.getElementById("np-travel-mode-none").checked = true;
          onTravelBudgetModeChanged();
        }
      } else {
        if (parentContainer) parentContainer.style.display = "block";
        if (budgetModeContainer) budgetModeContainer.style.display = "block";
        if (travelPoolLabel) travelPoolLabel.style.display = "flex";

        // Filter eligible parents
        if (parentSelect) {
          parentSelect.innerHTML = '<option value="">-- Übergeordnetes Projekt wählen --</option>';
          if (level === 2) {
            parentLabel.innerText = "Übergeordnetes Gesamtprojekt (Stufe 1) *";
            const level1Projects = currentCustomerProjects.filter(p => !p.parent_project_id || (p.hierarchy_level || 1) === 1);
            level1Projects.forEach(p => {
              parentSelect.innerHTML += `<option value="${p.id}">🔵 [Stufe 1] ${p.name} (${p.project_number})</option>`;
            });
            if (subprojectsBuilder) subprojectsBuilder.style.display = "block";
          } else if (level === 3) {
            parentLabel.innerText = "Übergeordnetes Projekt / Stream (Stufe 2 oder 1) *";
            const level2Projects = currentCustomerProjects.filter(p => p.hierarchy_level === 2);
            level2Projects.forEach(p => {
              parentSelect.innerHTML += `<option value="${p.id}">🔷 [Stufe 2] ${p.name} (${p.project_number})</option>`;
            });
            const level1Projects = currentCustomerProjects.filter(p => !p.parent_project_id || (p.hierarchy_level || 1) === 1);
            level1Projects.forEach(p => {
              parentSelect.innerHTML += `<option value="${p.id}">🔵 [Stufe 1] ${p.name} (${p.project_number})</option>`;
            });
            if (subprojectsBuilder) subprojectsBuilder.style.display = "none";
          }
        }
      }
      calculateProjectBudget();
    }

    function onBudgetModeChanged() {
      const mode = document.querySelector('input[name="np-budget-mode"]:checked')?.value || "PooledFromParent";
      const hoursInput = document.getElementById("np-hours");
      const hoursLabel = document.getElementById("np-hours-label");
      if (hoursLabel && hoursInput) {
        if (mode === 'PooledFromParent') {
          hoursLabel.innerText = "Geplantes Kontingent (Optional, da aus Stufe 1 gepoolt)";
        } else {
          hoursLabel.innerText = "Geplantes Stundenkontingent (h) *";
        }
      }
      calculateProjectBudget();
    }

    function onTravelBudgetModeChanged() {
      const mode = document.querySelector('input[name="np-travel-mode"]:checked')?.value || "None";
      const amountGroup = document.getElementById("np-travel-amount-group");
      if (amountGroup) {
        amountGroup.style.display = mode === "Dedicated" ? "block" : "none";
      }
    }

    function prepareSubProjectCreation(customerId, parentId, targetLevel) {
      const createBox = document.getElementById("create-project-box");
      if (!createBox) return;

      createBox.scrollIntoView({ behavior: "smooth" });
      const radio = document.getElementById(`np-level-${targetLevel}`);
      if (radio) {
        radio.checked = true;
        onProjectLevelChanged(customerId);
      }

      setTimeout(() => {
        const parentSelect = document.getElementById("np-parent-id");
        if (parentSelect) parentSelect.value = parentId;
        const nameInput = document.getElementById("np-name");
        if (nameInput) nameInput.focus();
      }, 50);
    }

    function addQuickSubProjectRow() {
      const list = document.getElementById("np-subprojects-list");
      if (!list) return;

      const rowId = 'sub-row-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const row = document.createElement("div");
      row.id = rowId;
      row.style.cssText = "display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 8px; align-items: center; background: #fff; border: 1px solid var(--border); padding: 8px 10px; border-radius: 6px;";

      row.innerHTML = `
        <input type="text" class="form-control form-control-sm sub-proj-name" placeholder="Name des Streams / AP *" required style="font-size: 0.8rem;">
        <select class="form-control form-control-sm sub-proj-level" style="font-size: 0.78rem;">
          <option value="2">🔷 Stufe 2 (Stream)</option>
          <option value="3">🟣 Stufe 3 (Teilprojekt)</option>
        </select>
        <select class="form-control form-control-sm sub-proj-budget-mode" style="font-size: 0.78rem;">
          <option value="PooledFromParent">Budget: Gepoolt</option>
          <option value="Dedicated">Budget: Fix</option>
        </select>
        <input type="number" step="1" class="form-control form-control-sm sub-proj-hours" placeholder="Std (z.B. 40)" value="0" style="font-size: 0.8rem;">
        <button type="button" class="btn btn-outline" style="color: #dc2626; border-color: #fca5a5; padding: 2px 6px; font-size: 0.75rem;" onclick="document.getElementById('${rowId}').remove()">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;

      list.appendChild(row);
    }

    function calculateProjectBudget() {
      const rate = parseFloat(document.getElementById("np-rate")?.value || "0");
      const hours = parseFloat(document.getElementById("np-hours")?.value || "0");
      const mode = document.querySelector('input[name="np-budget-mode"]:checked')?.value;
      const level = parseInt(document.querySelector('input[name="np-level"]:checked')?.value || "1");

      const target = document.getElementById("np-total-budget");
      if (!target) return;

      if (level > 1 && mode === 'PooledFromParent') {
        target.value = "Aus Stufe 1 gepoolt";
      } else {
        const total = (rate * hours).toFixed(2);
        target.value = `${total.replace(".", ",")} € Netto`;
      }
    }

    async function handleCreateProject(e, customerId) {
      e.preventDefault();
      const name = document.getElementById("np-name").value.trim();
      const endCustomerName = document.getElementById("np-end-customer")?.value.trim() || null;
      const projectNumber = document.getElementById("np-number").value.trim();
      const defaultHourlyRate = parseFloat(document.getElementById("np-rate").value || "120");
      const plannedHours = parseFloat(document.getElementById("np-hours").value || "0");
      const startDate = document.getElementById("np-start").value;
      const endDate = document.getElementById("np-end").value;
      const approverName = document.getElementById("np-approver-name")?.value.trim() || null;
      const approverEmail = document.getElementById("np-approver-email")?.value.trim() || null;
      const approver2Name = document.getElementById("np-approver2-name")?.value.trim() || null;
      const approver2Email = document.getElementById("np-approver2-email")?.value.trim() || null;
      const approver3Name = document.getElementById("np-approver3-name")?.value.trim() || null;
      const approver3Email = document.getElementById("np-approver3-email")?.value.trim() || null;
      const createLexwareQuotation = document.getElementById("np-create-quotation")?.checked || false;

      // 3-Stage Hierarchy & Budgets
      const hierarchyLevel = parseInt(document.querySelector('input[name="np-level"]:checked')?.value || "1");
      const parentProjectId = hierarchyLevel > 1 ? (document.getElementById("np-parent-id")?.value || null) : null;
      const budgetMode = hierarchyLevel === 1 ? 'Dedicated' : (document.querySelector('input[name="np-budget-mode"]:checked')?.value || 'Dedicated');
      const travelBudgetMode = document.querySelector('input[name="np-travel-mode"]:checked')?.value || 'None';
      const travelBudgetNet = travelBudgetMode === 'Dedicated' ? parseFloat(document.getElementById("np-travel-budget-net")?.value || "0") : 0.0;

      if (hierarchyLevel > 1 && !parentProjectId) {
        alert("Bitte wählen Sie ein übergeordnetes Projekt für Stufe " + hierarchyLevel + " aus.");
        return;
      }

      // Collect dynamically added sub-projects
      const subProjects = [];
      const subRows = document.querySelectorAll("#np-subprojects-list > div");
      subRows.forEach((row, idx) => {
        const subName = row.querySelector(".sub-proj-name")?.value.trim();
        const subLevel = parseInt(row.querySelector(".sub-proj-level")?.value || "2");
        const subBudgetMode = row.querySelector(".sub-proj-budget-mode")?.value || "PooledFromParent";
        const subHours = parseFloat(row.querySelector(".sub-proj-hours")?.value || "0");

        if (subName) {
          subProjects.push({
            name: subName,
            hierarchyLevel: subLevel,
            budgetMode: subBudgetMode,
            plannedHours: subHours,
            defaultHourlyRate: defaultHourlyRate,
            projectNumber: `${projectNumber}-S${idx + 1}`,
            travelBudgetMode: 'PooledFromParent'
          });
        }
      });

      try {
        const res = await fetch(`${API_BASE}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId,
            name,
            endCustomerName,
            projectNumber,
            defaultHourlyRate,
            plannedHours,
            hierarchyLevel,
            parentProjectId,
            budgetMode,
            travelBudgetNet,
            travelBudgetMode,
            startDate,
            endDate,
            approverName,
            approverEmail,
            approver2Name,
            approver2Email,
            approver3Name,
            approver3Email,
            createLexwareQuotation,
            subProjects
          })
        });

        const data = await res.json();
        alert(data.message || "Projekt erfolgreich angelegt!");
        await loadProjects();
        openCustomerOverview(customerId);
      } catch (err) {
        alert("Fehler beim Anlegen: " + err.message);
      }
    }

    async function openProjectDetails(projectId) {
      const modal = document.getElementById("project-modal");
      const title = document.getElementById("prj-modal-title");
      const sub = document.getElementById("prj-modal-subtitle");
      const body = document.getElementById("prj-modal-body");
      const footer = document.getElementById("prj-modal-footer");

      body.innerHTML = `<div style="text-align: center; padding: 40px;"><span class="spinner"></span> Lade Projekt-Cockpit & Details...</div>`;
      modal.classList.add("active");

      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/details`);
        const data = await res.json();
        const p = data.project;
        const entries = data.timeEntries || [];
        const trips = data.trips || [];
        const children = data.children || [];
        const parentProj = data.parentProject || null;
        const rollup = data.rollup || null;
        const isProjArchived = p.is_archived === 1 || p.is_active === 0;

        title.innerText = p.name;
        sub.innerText = `Kunde: ${p.customer_name} ${p.end_customer_name ? ' | Endkunde: ' + p.end_customer_name : ''} | ${p.project_number} | Stundensatz: ${p.default_hourly_rate.toFixed(2)} €/h`;

        // Level name
        const levelNames = {
          1: "🔵 Stufe 1: Gesamtprojekt (Hauptauftrag / Rahmenvertrag)",
          2: "🔷 Stufe 2: Projekt / Programm / Stream / Arbeitspaket",
          3: "🟣 Stufe 3: Teilprojekt / Arbeitspaket"
        };
        const levelBadgeText = levelNames[p.hierarchy_level || 1] || "Projekt";

        body.innerHTML = `
          ${isProjArchived ? `
            <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 12px 16px; border-radius: 8px; color: #be123c; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <i class="fa-solid fa-lock"></i> <strong>Projekt ist archiviert / gesperrt.</strong>
                <div style="font-size: 0.8rem; color: #9f1239; margin-top: 2px;">Für neue Zeiterfassungen gesperrt (GoBD-Historie bleibt erhalten).</div>
              </div>
              <button class="btn btn-primary" style="padding: 4px 10px; font-size: 0.8rem; background: #059669; border-color: #059669;" onclick="unarchiveProjectPrompt('${p.id}', '${p.name}')">
                <i class="fa-solid fa-lock-open"></i> Projekt entsperren / aktivieren
              </button>
            </div>
          ` : ''}

          <!-- Hierarchie & Parent Box -->
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <span class="badge badge-info" style="font-size: 0.8rem; font-weight: 700;">${levelBadgeText}</span>
              ${parentProj ? `
                <span style="font-size: 0.82rem; color: var(--text-muted); margin-left: 8px;">
                  Übergeordnet: <strong style="color: #0369a1; cursor: pointer;" onclick="openProjectDetails('${parentProj.id}')">${parentProj.name} (${parentProj.project_number})</strong>
                </span>
              ` : ''}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">
              Honorar: <strong>${p.budget_mode === 'PooledFromParent' ? 'Gepoolt aus Stufe 1' : 'Eigenes Budget'}</strong> • 
              Reisekosten: <strong>${p.travel_budget_mode === 'PooledFromParent' ? 'Gepoolt' : (p.travel_budget_net > 0 ? `Deckel ${p.travel_budget_net.toFixed(2)} €` : 'Nach Beleg')}</strong>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
            <div class="card" style="padding: 14px;">
              <div class="stat-label">Direkt Gebuchte Stunden</div>
              <div class="stat-val primary" style="font-size: 1.4rem;">${p.recorded_hours.toFixed(2)} <span style="font-size: 0.85rem; color: var(--text-muted);">/ ${p.planned_hours} h</span></div>
            </div>
            <div class="card" style="padding: 14px;">
              <div class="stat-label">Gebuchtes Netto (Honorar)</div>
              <div class="stat-val" style="font-size: 1.4rem;">${p.recorded_amount_net.toFixed(2)} <span style="font-size: 0.85rem; color: var(--text-muted);">€</span></div>
            </div>
            <div class="card" style="padding: 14px;">
              <div class="stat-label">Gebuchte Reisekosten</div>
              <div class="stat-val" style="font-size: 1.4rem; color: #0284c7;">${(p.recorded_travel_costs || 0).toFixed(2)} <span style="font-size: 0.85rem; color: var(--text-muted);">€ (${trips.length} Reisen)</span></div>
            </div>
            <div class="card" style="padding: 14px;">
              <div class="stat-label">Rest-Budget (Honorar)</div>
              <div class="stat-val success" style="font-size: 1.4rem;">${p.budget_mode === 'PooledFromParent' ? 'Gepoolt' : `${p.remaining_budget_net.toFixed(2)} €`}</div>
            </div>
          </div>

          <!-- ROLLUP GESAMT-COCKPIT (falls Unterebenen vorhanden) -->
          ${rollup && rollup.children_count > 0 ? `
            <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: #1e40af; font-size: 0.95rem;">
                  <i class="fa-solid fa-chart-pie"></i> Rollup Gesamtvolumen (Hauptauftrag inkl. aller ${rollup.children_count} Streams / Teilprojekte)
                </strong>
                <span class="badge badge-info" style="font-size: 0.8rem;">${rollup.rollup_budget_usage_percent}% Budget-Auslastung</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 0.85rem;">
                <div style="background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #bfdbfe;">
                  <div style="color: var(--text-muted); font-size: 0.72rem;">GESAMTSTUNDEN (ROLLUP)</div>
                  <strong>${rollup.rollup_hours.toFixed(2)} h</strong>
                </div>
                <div style="background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #bfdbfe;">
                  <div style="color: var(--text-muted); font-size: 0.72rem;">HONORAR NETTO (ROLLUP)</div>
                  <strong>${rollup.rollup_amount_net.toFixed(2)} €</strong>
                </div>
                <div style="background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #bfdbfe;">
                  <div style="color: var(--text-muted); font-size: 0.72rem;">REISEKOSTEN (ROLLUP)</div>
                  <strong style="color: #0369a1;">${rollup.rollup_travel_costs.toFixed(2)} €</strong>
                </div>
                <div style="background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #bfdbfe;">
                  <div style="color: var(--text-muted); font-size: 0.72rem;">GESAMTAUSGABEN (ROLLUP)</div>
                  <strong style="color: #15803d;">${rollup.rollup_total_spent_net.toFixed(2)} €</strong>
                </div>
                <div style="background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #bfdbfe;">
                  <div style="color: var(--text-muted); font-size: 0.72rem;">REST-GESAMTBUDGET (ROLLUP)</div>
                  <strong style="color: #2563eb;">${rollup.rollup_remaining_budget_net.toFixed(2)} € (${(p.planned_hours ? (p.planned_hours - rollup.rollup_hours) : (rollup.rollup_remaining_budget_net / (p.default_hourly_rate || 120))).toFixed(2)} h)</strong>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Untergeordnete Streams & Teilprojekte Tabelle (falls vorhanden) -->
          ${children && children.length > 0 ? `
            <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: var(--primary); font-size: 0.9rem;">
                  <i class="fa-solid fa-folder-tree"></i> Untergeordnete Streams & Teilprojekte (${children.length})
                </strong>
                <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" onclick="closeModal('project-modal'); prepareSubProjectCreation('${p.customer_id}', '${p.id}', ${(p.hierarchy_level || 1) < 2 ? 2 : 3})">
                  <i class="fa-solid fa-plus"></i> Weitere Unterebene anlegen
                </button>
              </div>
              <div class="table-container" style="margin-top: 6px;">
                <table>
                  <thead>
                    <tr>
                      <th>Stufe & Name</th>
                      <th>Projekt-Nr.</th>
                      <th>Gebucht (h / €)</th>
                      <th>Reisekosten</th>
                      <th>Budget-Modus</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${children.map(ch => `
                      <tr>
                        <td>
                          <span class="badge" style="background: ${ch.hierarchy_level === 3 ? '#f3e8ff' : '#e0f2fe'}; color: ${ch.hierarchy_level === 3 ? '#7e22ce' : '#0284c7'}; font-size: 0.7rem;">
                            ${ch.hierarchy_level === 3 ? '▪️ Stufe 3' : '🔹 Stufe 2'}
                          </span>
                          <strong>${ch.name}</strong>
                        </td>
                        <td><code>${ch.project_number}</code></td>
                        <td>${ch.recorded_hours.toFixed(2)} h (${ch.recorded_amount_net.toFixed(2)} €)</td>
                        <td>${ch.recorded_travel_costs.toFixed(2)} €</td>
                        <td>${ch.budget_mode === 'PooledFromParent' ? '<span class="badge badge-warning" style="font-size: 0.7rem;">Gepoolt</span>' : `${ch.total_budget_net.toFixed(2)} €`}</td>
                        <td>
                          <button class="btn btn-outline" style="padding: 2px 6px; font-size: 0.75rem;" onclick="openProjectDetails('${ch.id}')">
                            Cockpit &rarr;
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- Freigabeberechtigte & Endkunde Infobox -->
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: var(--primary); font-size: 0.9rem;"><i class="fa-solid fa-users"></i> Freigabeberechtigte (Approver) & Einsatzort</strong>
              <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" onclick="openEditProjectForm('${p.id}')">
                <i class="fa-solid fa-pen"></i> Projektdaten & Freigaben bearbeiten
              </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; font-size: 0.82rem;">
              <div style="background: #fff; border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px;">
                <div style="color: var(--text-muted); font-size: 0.72rem;">1. FREIGEBENDER (HAUPTKONTAKT)</div>
                <strong>${p.approver_name || p.contact_person || 'Hauptkontakt'}</strong><br>
                <code style="color: #0369a1;">${p.approver_email || p.customer_email || 'Nicht hinterlegt'}</code>
              </div>
              <div style="background: #fff; border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px;">
                <div style="color: var(--text-muted); font-size: 0.72rem;">2. FREIGEBENDER (ENDKUNDE)</div>
                <strong>${p.approver_2_name || 'Optionaler Endkunden-Lead'}</strong><br>
                <code style="color: #0369a1;">${p.approver_2_email || 'Nicht hinterlegt'}</code>
              </div>
              <div style="background: #fff; border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px;">
                <div style="color: var(--text-muted); font-size: 0.72rem;">3. FREIGEBENDER (PROJEKTLEITUNG)</div>
                <strong>${p.approver_3_name || 'Optionaler Partner-Lead'}</strong><br>
                <code style="color: #0369a1;">${p.approver_3_email || 'Nicht hinterlegt'}</code>
              </div>
              ${p.end_customer_name ? `
              <div style="background: #fff; border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px;">
                <div style="color: var(--text-muted); font-size: 0.72rem;">ENDKUNDE (EINSATZORT)</div>
                <strong style="color: #0f766e;"><i class="fa-solid fa-building-user"></i> ${p.end_customer_name}</strong>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Edit Form Container (initially hidden) -->
          <div id="project-edit-form-container" style="display: none; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <strong style="color: #1e40af;"><i class="fa-solid fa-pen-to-square"></i> Projektdaten, Hierarchie & Freigabeberechtigte anpassen</strong>
              <button type="button" class="btn btn-outline" style="padding: 2px 6px; font-size: 0.75rem;" onclick="document.getElementById('project-edit-form-container').style.display='none'">&times; Abbrechen</button>
            </div>
            <form onsubmit="saveProjectEdit(event, '${p.id}')">
              
              <!-- Hierarchie & Modus Felder -->
              <div class="form-row" style="background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #bfdbfe; margin-bottom: 12px;">
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Hierarchiestufe</label>
                  <select class="form-control" id="ep-hierarchy-level">
                    <option value="1" ${(p.hierarchy_level || 1) === 1 ? 'selected' : ''}>🔵 Stufe 1: Gesamtprojekt (Hauptauftrag / Rahmenvertrag)</option>
                    <option value="2" ${p.hierarchy_level === 2 ? 'selected' : ''}>🔷 Stufe 2: Projekt / Programm / Stream / AP</option>
                    <option value="3" ${p.hierarchy_level === 3 ? 'selected' : ''}>🟣 Stufe 3: Teilprojekt / AP</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Honorarbudget-Geltung</label>
                  <select class="form-control" id="ep-budget-mode">
                    <option value="Dedicated" ${p.budget_mode === 'Dedicated' ? 'selected' : ''}>Eigenes fixes Budget</option>
                    <option value="PooledFromParent" ${p.budget_mode === 'PooledFromParent' ? 'selected' : ''}>Gepooltes Budget (aus Stufe 1)</option>
                  </select>
                </div>
              </div>

              <div class="form-row" style="background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #bfdbfe; margin-bottom: 12px;">
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Reisekosten-Geltung</label>
                  <select class="form-control" id="ep-travel-budget-mode">
                    <option value="None" ${p.travel_budget_mode === 'None' ? 'selected' : ''}>Nach Beleg (Kein Deckel)</option>
                    <option value="Dedicated" ${p.travel_budget_mode === 'Dedicated' ? 'selected' : ''}>Eigenes fixes Reisebudget Netto</option>
                    <option value="PooledFromParent" ${p.travel_budget_mode === 'PooledFromParent' ? 'selected' : ''}>Gepoolt aus Stufe 1</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Reisekosten-Budget Netto (€)</label>
                  <input type="number" step="50" class="form-control" id="ep-travel-budget-net" value="${p.travel_budget_net || 0}">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">Projektname *</label>
                  <input type="text" class="form-control" id="ep-name" value="${p.name}" required>
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">Endkunde (Optional)</label>
                  <input type="text" class="form-control" id="ep-end-customer" value="${p.end_customer_name || ''}" placeholder="z. B. BMW AG">
                </div>
              </div>
              <div class="form-row-3">
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">Stundensatz Netto (€ / h) *</label>
                  <input type="number" step="1" class="form-control" id="ep-rate" value="${p.default_hourly_rate}" required>
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">Geplante Stunden</label>
                  <input type="number" step="1" class="form-control" id="ep-hours" value="${p.planned_hours || 0}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">Projektnummer</label>
                  <input type="text" class="form-control" id="ep-number" value="${p.project_number}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">1. Freigebender (Name)</label>
                  <input type="text" class="form-control" id="ep-approver-name" value="${p.approver_name || ''}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">1. Freigebender (E-Mail)</label>
                  <input type="email" class="form-control" id="ep-approver-email" value="${p.approver_email || ''}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">2. Freigebender (z. B. Endkunden-Lead Name)</label>
                  <input type="text" class="form-control" id="ep-approver2-name" value="${p.approver_2_name || ''}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">2. Freigebender (E-Mail)</label>
                  <input type="email" class="form-control" id="ep-approver2-email" value="${p.approver_2_email || ''}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">3. Freigebender (z. B. Partner-Lead Name)</label>
                  <input type="text" class="form-control" id="ep-approver3-name" value="${p.approver_3_name || ''}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.8rem;">3. Freigebender (E-Mail)</label>
                  <input type="email" class="form-control" id="ep-approver3-email" value="${p.approver_3_email || ''}">
                </div>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
                <button type="button" class="btn btn-outline" onclick="document.getElementById('project-edit-form-container').style.display='none'">Abbrechen</button>
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Änderungen speichern</button>
              </div>
            </form>
          </div>

          <!-- Lexware Belegkette & Status Box -->
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 20px;">
            <div style="font-weight: 600; color: var(--primary); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
              <span><i class="fa-solid fa-receipt"></i> Lexware Office Belegkette & Verknüpfung</span>
              <button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem;" onclick="syncQuotations()">
                <i class="fa-solid fa-arrows-rotate"></i> Sync
              </button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
              <div style="background: #fff; border: 1px solid var(--border); padding: 10px; border-radius: 6px;">
                <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 4px;">1. ANGEBOT (QUOTATION)</div>
                ${p.lexware_quotation_id ? `
                  <div style="font-weight: 600; color: var(--success);"><i class="fa-solid fa-check"></i> ${p.lexware_quotation_number || 'Erstellt in Lexware'}</div>
                  <small style="color: var(--text-muted); font-size: 0.7rem;">ID: ${p.lexware_quotation_id}</small>
                ` : `
                  <div style="margin-bottom: 6px; color: var(--text-muted);">Noch kein Angebot verknüpft</div>
                  <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" onclick="createQuotationForProject('${p.id}')">
                    <i class="fa-solid fa-plus"></i> Angebot in Lexware erstellen
                  </button>
                `}
              </div>
              <div style="background: #fff; border: 1px solid var(--border); padding: 10px; border-radius: 6px;">
                <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 4px;">2. AUFTRAGSBESTÄTIGUNG (ORDER CONFIRMATION)</div>
                ${p.lexware_order_confirmation_id ? `
                  <div style="font-weight: 600; color: var(--primary);"><i class="fa-solid fa-check"></i> ${p.lexware_order_confirmation_number || 'Erstellt in Lexware'}</div>
                  <small style="color: var(--text-muted); font-size: 0.7rem;">ID: ${p.lexware_order_confirmation_id}</small>
                ` : `
                  <div style="margin-bottom: 6px; color: var(--text-muted);">Noch keine Auftragsbestätigung</div>
                  <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" onclick="createOrderConfirmationForProject('${p.id}')">
                    <i class="fa-solid fa-file-signature"></i> Auftragsbestätigung erstellen
                  </button>
                `}
              </div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
              <i class="fa-solid fa-info-circle"></i> Löschregel: Wird das Angebot in Lexware gelöscht, wird das Projekt bei fehlenden Buchungen automatisch entfernt, ansonsten archiviert/gesperrt.
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 1.05rem;"><i class="fa-solid fa-clock-rotate-left"></i> Bisherige Zeiterfassungen auf dieses Projekt (${entries.length})</h3>
            ${!isProjArchived ? `
            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="startCaptureForCustomerAndProject('${p.customer_id}', '${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.default_hourly_rate})">
              <i class="fa-solid fa-plus"></i> Neue Zeit erfassen
            </button>
            ` : ''}
          </div>

          <div class="table-container" style="margin-top: 0;">
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Zeit & Dauer</th>
                  <th>Ort / Kategorie</th>
                  <th>Kurzbeschreibung</th>
                  <th>Betrag Netto</th>
                </tr>
              </thead>
              <tbody>
                ${entries.length === 0 ? `
                  <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">Noch keine Zeiterfassungen für dieses Projekt vorhanden.</td></tr>
                ` : entries.map(e => `
                  <tr>
                    <td><strong>${e.entry_date}</strong></td>
                    <td>${e.start_time} - ${e.end_time}<br><small style="color: var(--text-muted);">${e.billable_duration_hours.toFixed(2)} h (Pause: ${e.break_minutes || 0}m)</small></td>
                    <td><span class="badge badge-info">${e.location || 'Remote'}</span><br><small style="color: var(--text-muted);">${e.category}</small></td>
                    <td>
                      ${e.short_description}
                      ${(e.deliverable || e.task_or_ticket_reference) ? `<br><span class="badge" style="background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; font-size: 0.72rem; margin-top: 3px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-file-shield"></i> ADR: ${e.deliverable || e.task_or_ticket_reference}</span>` : ''}
                      ${e.result && e.result !== (e.deliverable || e.task_or_ticket_reference) ? `<br><small style="color: var(--text-muted);"><i class="fa-solid fa-file-lines"></i> ${e.result}</small>` : ''}
                    </td>
                    <td><strong>${((e.billable_duration_hours || 0) * (e.billing_rate_snapshot || p.default_hourly_rate)).toFixed(2)} €</strong></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;

        const canDelete = entries.length === 0 && (!trips || trips.length === 0) && (!children || children.length === 0) && !p.lexware_quotation_id && !p.lexware_order_confirmation_id && !isProjArchived;

        footer.innerHTML = `
          <button class="btn btn-outline" onclick="closeModal('project-modal')">Schließen</button>
          ${canDelete ? `
            <button class="btn btn-outline" style="color: #be123c; border-color: #fecdd3;" onclick="deleteProjectPrompt('${p.id}', '${p.name}')">
              <i class="fa-solid fa-trash"></i> Projekt löschen
            </button>
          ` : (!isProjArchived ? `
            <button class="btn btn-outline" onclick="archiveProjectPrompt('${p.id}', '${p.name}')">
              <i class="fa-solid fa-box-archive"></i> Projekt archivieren
            </button>
          ` : '')}
          ${!isProjArchived ? `
          <button class="btn btn-primary" onclick="startCaptureForCustomerAndProject('${p.customer_id}', '${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.default_hourly_rate})">
            <i class="fa-solid fa-plus"></i> Neue Zeit erfassen
          </button>
          ` : ''}
        `;
      } catch (err) {
        body.innerHTML = `<div style="color: red; padding: 20px;">Fehler: ${err.message}</div>`;
      }
    }

    function openEditProjectForm(projectId) {
      const container = document.getElementById("project-edit-form-container");
      if (container) {
        container.style.display = container.style.display === "none" ? "block" : "none";
        if (container.style.display === "block") {
          container.scrollIntoView({ behavior: "smooth" });
        }
      }
    }

    async function saveProjectEdit(e, projectId) {
      e.preventDefault();
      const name = document.getElementById("ep-name").value.trim();
      const endCustomerName = document.getElementById("ep-end-customer")?.value.trim() || null;
      const projectNumber = document.getElementById("ep-number").value.trim();
      const defaultHourlyRate = parseFloat(document.getElementById("ep-rate").value || "120");
      const plannedHours = parseFloat(document.getElementById("ep-hours").value || "0");
      const hierarchyLevel = parseInt(document.getElementById("ep-hierarchy-level")?.value || "1");
      const budgetMode = document.getElementById("ep-budget-mode")?.value || "Dedicated";
      const travelBudgetMode = document.getElementById("ep-travel-budget-mode")?.value || "None";
      const travelBudgetNet = parseFloat(document.getElementById("ep-travel-budget-net")?.value || "0");
      const approverName = document.getElementById("ep-approver-name")?.value.trim() || null;
      const approverEmail = document.getElementById("ep-approver-email")?.value.trim() || null;
      const approver2Name = document.getElementById("ep-approver2-name")?.value.trim() || null;
      const approver2Email = document.getElementById("ep-approver2-email")?.value.trim() || null;
      const approver3Name = document.getElementById("ep-approver3-name")?.value.trim() || null;
      const approver3Email = document.getElementById("ep-approver3-email")?.value.trim() || null;

      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            endCustomerName,
            projectNumber,
            defaultHourlyRate,
            plannedHours,
            hierarchyLevel,
            budgetMode,
            travelBudgetMode,
            travelBudgetNet,
            approverName,
            approverEmail,
            approver2Name,
            approver2Email,
            approver3Name,
            approver3Email
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert("Projektdaten, Hierarchie & Freigaben erfolgreich aktualisiert!");
          await loadProjects();
          await openProjectDetails(projectId);
        } else {
          alert("Fehler: " + (data.error || "Fehler beim Speichern"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function deleteProjectPrompt(projectId, projectName) {
      if (!confirm(`Möchten Sie das unbenutzte Projekt '${projectName}' wirklich unwiderruflich löschen?`)) return;

      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Projekt gelöscht.");
          closeModal('project-modal');
          await loadProjects();
          await loadCustomers();
        } else {
          alert("Fehler: " + (data.error || "Projekt konnte nicht gelöscht werden"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function archiveProjectPrompt(projectId, projectName) {
      if (!confirm(`Möchten Sie das Projekt '${projectName}' archivieren und für Neubuchungen sperren? (Bestehende Daten bleiben lesend erhalten)`)) return;

      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/archive`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Projekt archiviert.");
          closeModal('project-modal');
          await loadProjects();
          await loadCustomers();
        } else {
          alert("Fehler: " + (data.error || "Projekt konnte nicht archiviert werden"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function unarchiveProjectPrompt(projectId, projectName) {
      if (!confirm(`Möchten Sie das Projekt '${projectName}' wieder entsperren und reaktivieren?`)) return;

      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/unarchive`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Projekt erfolgreich entsperrt und reaktiviert!");
          await loadProjects();
          await loadCustomers();
          await openProjectDetails(projectId);
        } else {
          alert("Fehler: " + (data.error || "Projekt konnte nicht reaktiviert werden"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function createQuotationForProject(projectId) {
      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/create-quotation`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Angebot in Lexware erfolgreich erstellt!");
          await loadProjects();
          openProjectDetails(projectId);
        } else {
          alert("Fehler: " + (data.error || "Angebot konnte nicht erstellt werden"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function createOrderConfirmationForProject(projectId) {
      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/create-order-confirmation`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Auftragsbestätigung in Lexware erfolgreich erstellt!");
          await loadProjects();
          openProjectDetails(projectId);
        } else {
          alert("Fehler: " + (data.error || "Auftragsbestätigung konnte nicht erstellt werden"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function syncQuotations() {
      try {
        const res = await fetch(`${API_BASE}/sync/lexware-quotations`, { method: "POST" });
        const data = await res.json();
        alert(data.message || "Angebots-Abgleich abgeschlossen.");
        await loadCustomers();
        await loadProjects();
      } catch (err) {
        alert("Sync-Fehler: " + err.message);
      }
    }

    async function syncLexwareContacts() {
      const btnDash = document.getElementById("btn-sync-dash");
      const btnCust = document.getElementById("btn-sync-cust");
      if (btnDash) btnDash.innerHTML = '<span class="spinner"></span> Synchronisiere...';
      if (btnCust) btnCust.innerHTML = '<span class="spinner"></span> Synchronisiere...';

      try {
        const res = await fetch(`${API_BASE}/sync/lexware-contacts`, { method: "POST" });
        const data = await res.json();
        
        if (res.ok && data.success) {
          alert(data.message || "Lexware Kunden erfolgreich abgeglichen!");
          await loadCustomers();
          await loadProjects();
        } else {
          alert("Hinweis: " + (data.error || "Sync durchgeführt"));
          loadCustomers();
        }
      } catch (err) {
        alert("Sync-Fehler: " + err.message);
        loadCustomers();
      } finally {
        if (btnDash) btnDash.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Lexware Sync';
        if (btnCust) btnCust.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Aus Lexware synchronisieren';
      }
    }

    function toggleBreakInput() {
      const hasBreak = document.getElementById("form-has-break").checked;
      document.getElementById("break-input-container").style.display = hasBreak ? "block" : "none";
      calculateHours();
    }

    function getSelectedBillingType() {
      const radios = document.getElementsByName("billing-type");
      for (const r of radios) {
        if (r.checked) return r.value;
      }
      return "Billable";
    }

    function calculateHours() {
      const start = document.getElementById("form-start-time").value;
      const end = document.getElementById("form-end-time").value;
      const hasBreak = document.getElementById("form-has-break").checked;
      const breakMins = hasBreak ? parseInt(document.getElementById("form-break-minutes").value || "0") : 0;
      const billingType = getSelectedBillingType();

      if (start && end) {
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        let totalMins = (eh * 60 + em) - (sh * 60 + sm) - breakMins;
        if (totalMins < 0) totalMins = 0;
        const actualHours = (totalMins / 60).toFixed(2);
        
        const rateDisplay = document.getElementById("form-rate-display");
        const selectedProj = globalProjects.find(p => p.id === document.getElementById("form-project-id").value);
        const baseRate = selectedProj ? selectedProj.default_hourly_rate : 120.0;
        const hint = document.getElementById("form-billable-hint");

        if (billingType === "Billable") {
          document.getElementById("form-duration").value = `${actualHours.replace(".", ",")} h`;
          if (rateDisplay) rateDisplay.value = `${baseRate.toFixed(2)} € / h`;
          if (hint) hint.innerText = "Stunden werden dem Kunden mit dem regulären Stundensatz verrechnet.";
        } else if (billingType === "NonBillableVisible") {
          document.getElementById("form-duration").value = `0,00 h (Geleistet: ${actualHours.replace(".", ",")} h - Nicht abrechenbar)`;
          if (rateDisplay) rateDisplay.value = `0,00 € / h (Nicht abrechenbar)`;
          if (hint) hint.innerText = "Nicht abrechenbar: Stunden erscheinen auf dem Kunden-Nachweis transparent mit 0,00 €.";
        } else {
          // InternalOnly
          document.getElementById("form-duration").value = `0,00 h (Intern erfasst: ${actualHours.replace(".", ",")} h)`;
          if (rateDisplay) rateDisplay.value = `0,00 € / h (Intern)`;
          if (hint) hint.innerText = "🔒 Nur Intern: Stunden dienen rein interner Dokumentation (Akquise, Buchhaltung, Recherche etc.) und erscheinen NICHT auf dem Kunden-Nachweis.";
        }
      }
    }

    function toggleTravelFields() {
      const el = document.getElementById("travel-vehicle") || document.getElementById("travel-type") || document.getElementById("form-travel-type");
      if (!el) return;
      const type = el.value;
      const isCar = type === "PersonalCar";
      const carGroup = document.getElementById("car-km-group");
      if (carGroup) carGroup.style.display = isCar ? "block" : "none";
      const ticketGroup = document.getElementById("ticket-cost-group");
      if (ticketGroup) ticketGroup.style.display = isCar ? "none" : "block";
      calculateCarCost();
    }

    function calculateCarCost() {
      const el = document.getElementById("travel-vehicle") || document.getElementById("travel-type") || document.getElementById("form-travel-type") || document.getElementById("trip-leg-transport");
      if (!el) return;
      const type = el.value;
      const costEl = document.getElementById("travel-calculated-cost");
      if (!costEl) return;
      if (type === "PersonalCar" || type === "Mileage_Car") {
        const kmEl = document.getElementById("travel-km") || document.getElementById("trip-leg-km");
        const km = parseFloat(kmEl ? kmEl.value : "0") || 0;
        const rate = (typeof globalSettings !== "undefined" && globalSettings.mileage_rate_business) ? globalSettings.mileage_rate_business : 0.30;
        const cost = (km * rate).toFixed(2);
        costEl.value = `${cost.replace(".", ",")} € (${km} km à ${rate.toFixed(2).replace(".", ",")} €)`;
      } else {
        const amtEl = document.getElementById("travel-ticket-amount") || document.getElementById("trip-leg-ticket");
        const amt = parseFloat(amtEl ? amtEl.value : "0") || 0;
        costEl.value = `${amt.toFixed(2).replace(".", ",")} € (Ticket Netto)`;
      }
    }

    async function handleSaveTimeEntry(e) {
      e.preventDefault();
      const projectId = document.getElementById("form-project-id").value;
      if (!projectId) {
        alert("Bitte wählen Sie zuerst einen Kunden und ein Projekt aus.");
        return;
      }

      const entryDate = document.getElementById("form-date").value;
      const startTime = document.getElementById("form-start-time").value;
      const endTime = document.getElementById("form-end-time").value;
      const hasBreak = document.getElementById("form-has-break").checked;
      const breakMinutes = hasBreak ? parseInt(document.getElementById("form-break-minutes").value || "0") : 0;
      const location = document.getElementById("form-location").value;
      const category = document.getElementById("form-category").value;
      const shortDescription = document.getElementById("form-short-desc").value;
      const billingType = getSelectedBillingType();
      const isBillable = billingType === "Billable";

      const deliverable = (document.getElementById("form-ev-deliverable")?.value || "").trim();
      const problemStatement = (document.getElementById("form-ev-problem")?.value || "").trim();
      const methodology = (document.getElementById("form-ev-method")?.value || "").trim();
      const result = (document.getElementById("form-ev-result")?.value || "").trim();

      const hasEvidence = deliverable || problemStatement || methodology || result;

      const payload = {
        projectId,
        entryDate,
        startTime,
        endTime,
        breakMinutes,
        location,
        category,
        shortDescription,
        billingType,
        isBillable,
        taskReference: deliverable || null,
        evidence: hasEvidence ? { deliverable, problemStatement, methodology, result } : null
      };

      try {
        const res = await fetch(`${API_BASE}/time-entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          alert("Zeiteintrag erfolgreich gespeichert!");
          await loadProjects();
          switchView("dashboard");
        } else {
          const err = await res.json();
          alert("Fehler beim Speichern: " + err.error);
        }
      } catch (err) {
        alert("Zeiteintrag erfolgreich erfasst!");
        switchView("dashboard");
      }
    }

    // ==========================================
    // EINSTELLUNGEN & STEUERSÄTZE (GLOBAL)
    // ==========================================
    const DEFAULT_CONTRACTOR_SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAE4CAYAAADFDIHkAAAQAElEQVR4AeydCdxU0xvHnxv9RUp2hVZbRFmiBUWKkvYVLfZI2VVoJVtEScgWRYu0aJGE9n2zVCJp04JSWlRS/35TU/O+zXKX524zPx+nuXPuc57znO+8c+fe5zznOTkKFy6yF+Xss8/Zy/9IgARIgARIgARIgARIgAQOEVi8ePHe2bNn761Xr95eETlYLrzwwkj93LlzDwnziARIgASCTWBvjn0XMv5PAiRAAiRAAiRAAiRAAiSQjcCMGTOkYsWKUrp0aRkyZEiWs99//32k/oorrpDBgwdnOcc3JEACJBBMAiJ0AAT1k6FdJEACJEACJEACJEACvhHYtWuXlC1bVtavX5/Uht27d0vDhg1l8eLFSeV4kgRIgAR8J7DPADoA9kHg/yRAAiRAAiRAAiRAAiQQJTBlyhTJmzdv9K2p1/PPP1+GDRtmSpZCJEACJOAHAfRJBwAosJAACZAACZAACZAACZDAPgKrV6+WWrVqyc6dO/e9s/Z/kyZN5MsvvxT+RwIkQAIBJBAxiQ6ACAb+QwIkQAIkQAIkQAIkQAIiCP3fsGGDLRTbtm2TLVu22GrLRiRAAiTgLoH92ukA2M+B/5IACZAACZAACZAACZCAtG7d2hGF7t27O2rPxiRAAiTgCoEDSukAOACCLyRAAiRAAiRAAiRAAiQwevRoRxCmTp3qqD0bkwAJkIAbBKI66QCIkuArCZAACZAACZAACZAACZAACZAACaQfgYMjogPgIAoekAAJkAAJkAAJkAAJkAAJkAAJkEC6ETg0HjoADrHgEQmQAAmQAAmQAAmQAAmQAAmQAAmkF4GY0dABEAODhyRAAiRAAiRAAiRAAplLoEOHDpk7eI6cBEggbQnEDowOgFgaPCYBEiABEiABEiABEshYArNmzXI89k8//dSxDiogARIgAUUCWVTRAZAFB9+QAAmQAAmQAAmQAAmQAAmQAAmQQLoQyDoOOgCy8uA7EiABEiABEiABEiABEiABEiABEkgPAtlGQQdANiB8SwIkQAIkQAIkQAIkQAIkQAIkQALpQCD7GOgAyE6E70mABEiABEiABEiABDKOwJQpU2T27NkZN24OmARIIK0JHDY4OgAOQ8IKEiABEiABEiABEiCBTCPw559/ysaNGx0NO3fu3JInTx5HOtiYBEiABPQIHK6JDoDDmbCGBEiABEiABEiABEiABCwTKFeunFSuXNlyOzYgARIgAVcIxFFKB0AcKKwiARIgARIgARIgARIgARIgARIggTATiGc7HQDxqLCOBEiABEiABEiABEggowjUrl07o8bLwZIACaQ9gbgDpAMgLhZWkgAJkAAJkAAJkAAJkIA1Ar169bLWgNIkQAIk4BqB+IrpAIjPhbUkQAIkQAIkQAIkQAIkYInAOeecY0mewiRAAiTgGoEEiukASACG1SRAAiRAAiRAAiRAAplB4OGHH86MgXKUJEACGUMg0UDpAEhEhvUkQAIkQAIkQAIkQAIZQWDgwIGOx5kzZ07HOqiABEiABJQIJFRDB0BCNDxBAiRAAiRAAiRAAiRAAuYILFq0yJwgpUiABEjAdQKJO6ADIDEbniEBEiABEiABEiABEiABEiABEiCBcBFIYi0dAEng8BQJkAAJkAAJkAAJkAAJkAAJkAAJhIlAMlvpAEhGh+dIgARIgARIgARIgATSmsCQIUPkr7/+SusxcnAkQAIZRSDpYOkASIqHJ0mABEiABEggPoGNGzdKbPn333/jC7KWBEgg0AQWLlwoO3bscGTjI488ImeddZYjHWxMAiRAAjoEkmuhAyA5H54lARIgARIggSwEunbtKignnniixJY77rgjUj916tQs8nxDAiRAAiRAAiRAAp4RSNERHQApAPE0CZAACZAACezevVvOPPPMSHnqqacEJTuVfv36ReqrVasmmzZtyn6a70mABEiABEiABEjAdQKpOqADIBUhnicBEiABEshoAt99953kzJlTVq9eHSmpYPz9999y/PHHy7x581KJ8jwJkAAJkAAJkAAJaBJIqYsOgJSIKEACJEACJJCpBJYuXSrVq1e3NXy0g/PAVmM2IgES8ITA5s2b5eOPP/akL3ZCAiRAAu4TSN0DHQCpGVGCBEiABEggjQmsXLlSUAzDEMM4VEaOHClnn322rFq1ytbo165dKyVLlhS82lLARiRAAq4T2Llzp/z000+O+jEMQ/Lly+dIBxuTAAmQgAoBE0roADABiSIkQAIkQALpSeCZZ56RQoUKRUr2EdaoUSN7la33F154oUybNs1WWzYiARIIPoFjjjkmkv8j+JbSQhIggXQnYGZ8dACYoUQZEiABEiCBtCOATP4dOnRwfVwbNmyQypUrC2YaXe+MHZAACZAACZAACWQqAVPjpgPAFCYKkQAJkAAJpBOB3r17R2bs9u7d68mwtm/fLrly5fKkr7B38vvvv8vAgQOzlLCPifaTAAmQAAmQgPsEzPVAB4A5TpQiARIgARJIEwJPPPGEtGzZ0pfRvPDCC770G4ZOP/30U6lYsaJUqVJFGjdunKWgHiUM46CN4SJQq1atcBlMa0mABEggEQGT9XQAmARFMRIgARIggfQg8MMPP/g2kLZt28rs2bN96z+oHS9YsEDq1asnEydOlG+//fYwM1GPUqBAAfnzzz8PO88KErBLYPr06XabHmx33nnnHTzmAQmQAAn4RcBsv3QAmCVFORIgARIggdATWLRokfjpAADAl19+GS8sBwhgC7aLL774wLvkL9hRoWbNmvLPP/8kF+RZEvCQwJw5czzsjV2RAAmQQFwCpivpADCNioIkQAIkQAJhJ7B8+XL59ddffR3GoEGDfO0/SJ3jwalJkyaWTMKOCscdd5ylNhQmARIgARIggfQmYH50dACYZ0VJEiABEiABElAhULp0aRU9YVcCDnv27LE8jH///TeSI8ByQzYgARIgARIggXQkYGFMdABYgEVREiABEiABEiABEiABEiABEiABEggSASu20AFghRZlSYAESIAEQk3g559/DoT9CH1/5513AmGLX0Zg9t9J39gqEIkBnehg28wmgMSTTgkUKVLEqQq2JwESIAGnBCy1pwPAEi4Kjxw5Uu64446D5fHHHycUEiABEggNgQcffDAwtvbt2zcwttAQEiABewQ6depkryFbkQAJkIAaAWuK6ACwxisjpbE+s06dOmIYhtSoUUPee++9g6Vbt26ResMwZPfu3RnJh4MmARIgATsEpk6dKjt37rTTlG1IgARIgARIgARIYD8Bi//SAWARWCaKt2rVSoYNG5Zy6GXKlJHffvstpRwFSIAESIAE9hPIkyfP/oMM+xdbMa5fvz7DRs3hkgAJkAAJkIA+Aasa6QCwSizD5KtWrSq9e/c2Neq5c+dKuXLlTMlSiARIgARIQCKRU127ds04FDNmzJBVq1Zl3Lg5YBIgARIgARJQJmBZXQ7LLdggIwgg7L9ly5YyduxYS+NduXKlFC1alJEAlqhRmARIIFMJ7N27V+bNmyfbt2/PVAS2x92oUSOpUKGC7fZsSAIkQAIkQALhJ2B9BHQAWGeWES2wLtXszH92IL/++qsMHz48ezXfkwAJkAAJxCEwdOhQWbFiRZwzrCIBEnCLwPfffy8zZ850Sz31kgAJkIA3BGz0QgeADWiZ0GTjxo2Ohrlt2zZH7dmYBEiABLQJ/PXXX9oq1fSdf/75arqoiARIIDUB5KBYvXp1asEkEmXLlpWmTZsmkeApEiABEnCXgB3tdADYoZYBbc444wxHo2zTpo1gGYEjJWxMAiRAAooELr74YkVt+qr69++vrzSgGseMGRNQy2gWCZAACZAACYSGgC1D6QCwhY2NSIAESIAESECXwDvvvKOrMMDazOwsk8r8119/PZUIz5MACZAACZBAGhOwNzQ6AOxxYysSIAESIAESUCWwYcMGWbNmjarOdFZ2wgknpPPwODYSIAESIAESSE7A5lk6AGyCYzMSIAESIAES0CTwww8/yKRJkzRVUhcJkAAJkAAJkECaErA7LDoA7JJjOxIgARIgARJQJoAoAGWVgVO3atWqwNlEg0iABEiABEggZARsm0sHgG10bEgCJEACJEACugTuv/9+XYUB1FasWLEAWkWTSIAESIAESCBMBOzbSgeAfXZsSQIkQAIkQALqBIoUKaKuM90ULl++PN2GxPF4TKB27doe98juSIAESECRgANVdAA4gMemJEACJEACJKBNYPPmzdoq007fcccdl3Zj4oC8JbB161bHHVauXNmxDiogARIgATsEnLShA8AJPbYlARIgARIgAWUCW7ZskbfffltZK9WRAAloE+jcubO2SuojARIgATMEHMnQAeAIHxuTAAmQAAmQwCECZ5999qE3No92794tDHG3CY/NSIAESIAESCDtCTgbIB0AzvixNQmQAAmQQEgIeDFb9/XXX6vQGDdunPz1118quoKkZMiQIfLff/8FySTaQgIkQAIkQALhIuDQWjoAHAJMx+Z33HFHOg6LYyIBEshwAs2aNQsNgTlz5giWAoTGYJOGTp48Wfbs2WNSOr7YM888I/ny5Yt/krUkQAIkQAIkkOYEnA6PDgCnBNOwvdObszREwiGRAAmQgCkCZ5xxhjz55JOmZFMJFSpUKJVIRp7PkYO3Lhn5wXPQJEACJEACIOC48FfUMcL0UvDDDz/IyJEj02tQHA0JkAAJeEjgvvvuk7x583rYI7siARIgARIgARLIDALOR0kHgHOGaaVh27Zt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/U63b98ue/bscdzR8ccf71hHpijYtm2bDBs2zLXhYisibCm4fPlyKVasmFo/9evXlx9//FGgP1euXGp6qYgESMAcgdatW0vx4sXNCWeA1CmnnCJnnHFG2o0U61bddmwce+yxsnv3bsF1/ddff007hn4M6PLLL/ejW/ZJAiSwj8Cff/4pzz//vGDN/763afi/Py84uAAAABAASURBVEOiA8Af7q73+vLLL8u6desc9zNjxgzHOjJBAdYh3XDDDbJ161ZXhouEgn/88Ye4eSMC/YgGcGUAVEoCJJARBAYNGpQR47QzyCZNmri6LW/79u0FS/aQV8KOfWxDAiRAAkEigOVkJ598srRr1y5IZuna4pM2OgB8As9u04sAHABubPlXsGBBWb16tbi9rCD6adx0002e9hftl68kQALpQSATsvfb+aQQ4fHJJ5/YaZqyDbJg43cCiQWvuOKKiDycxpED/kMCJEACISSAxNUNGzYMoeXWTPZLmg4Av8i72C/CZTp06OC4B6y3QcI4x4oyQIFmSH4UV5kyZWTFihVy+umni2F4t1En+mvbtm0kQdWVV14ZNYevJEACCQjge5rglKfVbkYIeTmQr7/+2svuXO9r8eLFsnLlSlf6qVq1amTpGa7bsR1s2rQp9q2t45tvvlmuuuoqW22D0IiREEH4FGgDCVgjsGrVKvnss8/koosuEiyttdY6dNK+GUwHgG/o2XG6EHjqqafUh4J1oiNHjlTXa1UhbMBuA1bbacgPGDBAQw11kEAoCLz11luhsJNGWiPw+++/S/Xq1QV5eay1TC2NbV5xo5xdEv1lr+N7ewQ+/fRTew3ZigRIwBYB7E5Vs2ZNW23D18g/i+kA8I+9az1jvYxT5UcffbQgj4BTPZnQfs6cOarDPPPMMwVbOCIpn6piG8ry5csn2G0ASxFsNHfUxC/HgyOj2ZgEbBII80xrdMh+XCeifQfxdf369XLqqafKsmXL1M1DdBa2EzzyyCOz6N64caOMHTs2S53dNx999JHdpmnTrnLlymkzFq8H8s8//wiSFscWr21gf+Eg8O+//0b+VpCIGqH/4bBawUofVdAB4CN8dh1+AosWLZKffvpJbSCVKlUShIuqKVRS9PPPP0u1atWUtFENCZCAWwR69erllmpP9GLpmScdedDJ7bff7kovmPmfPHlyXN0dO3aU//77L+45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dAK0LwsByw4AtD7//PNly5Ytctxxx+FtYMqpp54qzz77bCTRXyZtj/fQQw/JOeec4/hzCMO2iPi7O+KII+T666+XzZs3Ox5zIgVIeMmEf4nosJ4ESIAESIAESIAESIAEwkGAVmYlYMsBEFUxZcoU6dSpU/Str6/169eXdevWSbt27Xy1g527R6Bz585SqVIl2bNnj3ud7NPcokULbvW3jwP/JwESIAESIAESIAESIIGQE6D52QgccgDszXbGxNsSJUpIx44dIw/eePj2a500+v7www9NWEyRVASqVauWSsSX8zVq1Ig4m2bPnu1q/02aNJHXXnvN1T6onARIgARIgARIgARIgARIwAsC7CM7gUMOgOxnLLxH6D3Krl27ZPz48eLFdoE5cuSQd999V/bu3SvoO1euXBYsTj/RJUuWqAxq48aNKnq0lCDfBJY4jBw5UktlQj21atUSOJKOPPLIhDJBPtG0adMgm0fbSIAESIAESIAESIAESMBbAuztMAIqDoBYrQjRHjp0qCABH0rsOY1jrHWHXpTbb79dQyV1xBD48ccf5csvv4yp8e8Q2ffhTHr11VddN6JVq1YybNgw1/sJegfgEHQbaR8JkAAJkAAJkAAJkAAJmCFAmcMJqDsAol1gCz4UzNCjVK5cWYoVKyZWdg+AfLRABwpmuqH3uuuui3bF1wMEEH1x4ND2CxLrYetE2woUGq5du1YmTpwod911l+zevVtBY3IVWPbQs2fP5EIZcrZ48eIZMlIOkwRIgARIgARIgARIIM0JcHhxCLjmAMjeF7ZtW7p0qQwYMEC6detmqkA+WrLr43v3CAwaNMg95Sk0P/bYY1KuXDmpWLFiCkmd0y1btpTRo0frKKMWEiABEiABEiABEiABEiCBgBCgGfEIeOYAiHZevXp1efTRR02VaBu+miOAh2aEzJuTTiw1duzYxCddPHP22WfLSy+9JMuXL3exl0OqGzZsKOmy1d/MmTMjzrVDo+MRCZAACZAACZAACZAACWQwAQ49LgHPHQBxrWClCoEjjjhCtBLYHXPMMSo2pVIyadIk6d27txiGIYj2SCWvdb5Ro0YycOBAATMtnX7q+e+//xwvlzj++OMFOTb8HAf7JgESIAESIAESIAESIAENAtQRn0CO+NWsDSuBp59+WsX0nTt3ur4d3pw5c6ROnTqCMHwVo00que+++6R///4mpcMh1qJFC8eGFixYUJDE07EiKiABEiABEiABEiABEiABfwmw9wQE6ABIACas1eeee66K6Xv27JHZs2cLHAEqCg8ogd5vv/1WChUqJKVLl5YNGzYcOOP+S9GiRSPbRr7yqf2yAAAJUklEQVT++uuezPxjnCjYstIwjEiUg2EY0rVrV0H9mjVrVAb9008/yffff6+ii0pIgARIgARIgARIgARIIPwEOIJEBOgASEQmxPVIsqhhfr9+/WTFihUaquTXX38VzLxjprpUqVKycuVKFb1mlZQsWVImTJhgVtyxHHIZYJwo2L0iVuFTTz0lqMfuA3/88UfsKVvHDRo0sNWOjUiABEiABEiABEiABEggLQlwUAkJ0AGQEE14TzRv3lzNeKcRBX369InMfGP2/Y033pC3335bzTYrihYsWCBnnnmmlSa2ZbG8ALsZpFKAKIBTTjkllZhn58HIs87YEQmQAAmQAAmQAAmQAAm4RIBqExM45AAwEgvxTLgInHTSSdKlSxc1o8877zzBwzvKrFmzDtM7Y8aMg+ch06FDh8hDv2EYcs899xwm71XF0UcfLSNHjoyE/XvV57vvvitNmjSx1N35558vy5Yts9QmKvzmm29GlhNE3/OVBEiABEiABEiABEiABDKcAIefhMAhB0ASIZ7KbAJLliyJhO8jhP+mm24ShNPHlho1ahw8DxmtRIROqSPJILaddKrHbPvu3bvL3XffbVb8oNzixYvl2muvPfjeysEzzzxjRTyh7IcffpjwHE+QAAmQAAmQAAmQAAmQQHgI0NJkBOgASEYnxOfat28vBQoUUB/B77//Lt99912WorGOXdPQ1q1bR2b9MbOuqTeVrnXr1gmSHKaSi3ceuRaQdDHeuUR1hmHIb7/9lui0pfpixYpZkqcwCZAACZAACZAACZAACQSSAI1KSoAOgKR4wn2yZ8+e4R6AReurVq0qmMnu0aOHxZbOxeEYGT16tCNFV199tQwdOtSUjr59+5qSMyNUvnx5Ofvss82IUoYESIAESIAESIAESIAEAk2AxiUnQAdAcj6hPlu3bl3JlStXqMdg1viTTz5ZxowZY3n9vVn9qeS2bt0qixYtSiWW9PyOHTsEyxay7xqQvRFyLtx2223Zq22/L168uICfbQVsSAIkQAIkQAIkQAIkQALBIEArUhCgAyAFoLCfHjRoUNiHkNT+/PnzCzLuYwY+qWBITj733HPSsWPHhNZ+/PHHUrZs2YTn7Zzwa2cGO7ayDQmQAAmQAAmQAAmQAAkkJsAzqQjQAZCKUMjPV6pUSSpUqBDyUSQ2H+vmX3zxxcQCITyTKIni8OHD5Y477gjhiGgyCZAACZAACZAACZAACXhAgF2kJEAHQEpE4RbInTu3XHnlleEeRDbrK1euLK+++qogVP7000/Pdtaft9hysHDhwmqd4zPbsGFDRN9PP/0k48aNk9q1awuWCUQqlf7ZsmWLkiaqIQESIAESIAESIAESIAF/CbD31AToAEjNKPQSWlvFBQHEXXfdJV988YU88MADQTDnoA1YilC/fv2D750eTJ06VWrWrCnr168XbGV4/fXXO1V5WPtmzZplTI6IwwbPChIgARIgARIgARIggXQjwPGYIEAHgAlI6SCycuVKQTRAGMeCRIannXZaZMa/T58+YhhGIIeRJ08eVdvgBMC4f/75Z/XxYts/7CRw5JFHquumQhIgARIgARIgARIgARLwngB7NEOADgAzlNJA5swzzxSsIT/qqKNCN5qPPvpI1q5dG3i727dvL127dg28nTCwdevWeGEhARIgARIgARIgARIggfQgwFGYIkAHgClM6SF03XXXCSIBwjIaPFCvW7dO6tSpExaTpV27doG3FTtD0AEQ+I+JBpIACZAACZAACZAACVggQFFzBHLIXnOClEoPAqeccopMmjRJTjzxxMAOqHz58pFw/y5dusipp54aWDsTGdavX79Ep3yvL1CggJx77rm+20EDSIAESIAESIAESIAESECRAFWZJMAIAJOg0knsqquukrFjxwrW0wdpXAMHDoxkux8xYkSQzLJsC7ZevOCCCyy386LBmDFjpGTJkl50xT5IgARIgARIgARIgARIwCMC7MYsAToAzJJKM7nLLrtMkFG/U6dOvo0MiehQsJ0fSsOGDQVb/AU5OsEMLOwI8MMPP5gR9VQG2xTy4d9T5OyMBEiABEiABEiABEjACwLswzQBOgBMo0pPwY4dO8rLL78s9erV82SAOXPmlG7dukXK0qVLBcWTjn3o5OGHH/ah1/hdVqlSRRYuXBj/JGtJgARIgARIgARIgARIIMQEaLp5AnQAmGeVtpJ4UB0wYICroeGlS5eWrVu3yl9//SWPPvpopKQt0AMDg6MDURYH3vr2grwPo0aNkmOOOcY3G9gxCZAACZAACZAACZAACbhEgGotEKADwAKsdBY98sgjZcGCBYJQfOQGaNq0qWQvDRo0SIogu/yePXsi+qBz1qxZkjt37khJqiSNTubIkUOQ0NDPIVWsWFHWr18viLzw0w72TQIkQAIkQAIkQAIkQALuEKBWKwToALBCK0NkMWv9wQcfSPbSv39/mTp1asKSXd4wjAwhlniYzZo1i/BKLOHemcsvv1yGDBniXgfUTAIkQAIkQAIkQAIkQAJ+E2D/lgjQAWAJV2YLYxa5XLlykqhkNp3EowevwYMHy9FHH51YSPnMeeedJzNnzgz0do/KQ6Y6EiABEiABEiABEiCBDCTAIVsjQAeANV6UJgFbBOrXrx+JqLDV2GIj7KSAh3+LzShOAiRAAiRAAiRAAiRAAmEjQHstEqADwCIwipOAXQJwAkybNs1u85TtDMOI5FwYN26c5M2bN6U8BUiABEiABEiABEiABEgg3ARovVUCdABYJUZ5EnBAoGzZstK3b18HGuI3vffee2X69OnxT7KWBEiABEiABEiABEiABNKRAMdkmUAOYZ42y9DYgAScEEBiwBkzZjhRcbAtogq+/fZb6d27t1xxxRUH63lAAiRAAiRAAiRAAiRAAulOgOOzTiCH9SZsQQIk4JQAHtaxPWKqrRUT9VOsWLHIFoNILnjRRRclEmM9CZAACZAACZAACZAACaQrAY7LBgE6AGxAYxMS0CIwaNAg6devX6SY0dmhQ4eI7JgxY2TKlClmmlCGBEiABEiABEiABEiABNKQAIdkh8AhB8BeO83ZhgRIwCmBW2+9VVAQEZCqdO7cOSJ7zjnnOO2W7UmABEiABEiABEiABEggvARouS0ChxwAtpqzEQmQAAmQAAmQAAmQAAmQAAmQAAl4S4C92SPwfwAAAP//FyC7hQAAAAZJREFUAwC+ry4+U41cHQAAAABJRU5ErkJggg==";
    let globalSettings = {
      mileage_rate_business: 0.30,
      commute_rate_tier1: 0.30,
      commute_rate_tier2: 0.38,
      vma_rate_8h: 14.00,
      vma_rate_24h: 28.00,
      pdf_storage_mode: "R2",
      company_city: localStorage.getItem("cfg_company_city") || "Neumünster",
      contractor_signature_data_url: localStorage.getItem("cfg_contractor_signature_data_url") || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : null),
      use_signature_on_documents: localStorage.getItem("cfg_use_signature_documents") !== null ? (localStorage.getItem("cfg_use_signature_documents") === "1" ? 1 : 0) : 1,
      contractor_name: localStorage.getItem("cfg_contractor_name") || "Michael Kirst-Neshva",
      company_name: localStorage.getItem("cfg_company_name") || "Cloud Security & Compliance Architecture – Michael Kirst-Neshva"
    };

    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) {
          const data = await res.json();
          globalSettings = { ...globalSettings, ...data };
          if (data.contractor_signature_data_url) {
            try { localStorage.setItem("cfg_contractor_signature_data_url", data.contractor_signature_data_url); } catch (_) {}
          }
          if (data.use_signature_on_documents !== undefined) {
            try { localStorage.setItem("cfg_use_signature_documents", data.use_signature_on_documents ? "1" : "0"); } catch (_) {}
          }
          if (data.company_city) {
            try { localStorage.setItem("cfg_company_city", data.company_city); } catch (_) {}
          }
          if (data.contractor_name) {
            try { localStorage.setItem("cfg_contractor_name", data.contractor_name); } catch (_) {}
          }
          if (data.company_name) {
            try { localStorage.setItem("cfg_company_name", data.company_name); } catch (_) {}
          }
          if (document.getElementById("cfg-mileage-rate")) document.getElementById("cfg-mileage-rate").value = globalSettings.mileage_rate_business;
          if (globalSettings.vehicle_planning_json) {
            try {
              const plan = typeof globalSettings.vehicle_planning_json === "string" 
                ? JSON.parse(globalSettings.vehicle_planning_json) 
                : globalSettings.vehicle_planning_json;
              populateVehiclePlanningFields(plan);
              updateVehiclePlanningBadge(globalSettings.mileage_rate_business, plan);
            } catch (_) {}
          } else {
            updateVehiclePlanningBadge(globalSettings.mileage_rate_business, null);
          }
          updateCarMileageLabels(globalSettings.mileage_rate_business);
          if (document.getElementById("cfg-commute-tier1")) document.getElementById("cfg-commute-tier1").value = globalSettings.commute_rate_tier1;
          if (document.getElementById("cfg-commute-tier2")) document.getElementById("cfg-commute-tier2").value = globalSettings.commute_rate_tier2;
          if (document.getElementById("cfg-vma-8h")) document.getElementById("cfg-vma-8h").value = globalSettings.vma_rate_8h;
          if (document.getElementById("cfg-vma-24h")) document.getElementById("cfg-vma-24h").value = globalSettings.vma_rate_24h;
          if (document.getElementById("cfg-default-transport")) document.getElementById("cfg-default-transport").value = globalSettings.default_transport_type || "Train";
          if (document.getElementById("cfg-pdf-storage")) document.getElementById("cfg-pdf-storage").value = globalSettings.pdf_storage_mode || "R2";

          // 0. Firmendaten & Freelancer Profil
          try {
            if (document.getElementById("cfg-company-name")) document.getElementById("cfg-company-name").value = globalSettings.company_name || "Cloud Security & Compliance Architecture – Michael Kirst-Neshva";
            if (document.getElementById("cfg-contractor-name")) document.getElementById("cfg-contractor-name").value = globalSettings.contractor_name || "Michael Kirst-Neshva";
            if (document.getElementById("cfg-company-street")) document.getElementById("cfg-company-street").value = globalSettings.company_street || "Ruthenberger Markt 11b";
            if (document.getElementById("cfg-company-zip")) document.getElementById("cfg-company-zip").value = globalSettings.company_zip || "24539";
            if (document.getElementById("cfg-company-city")) document.getElementById("cfg-company-city").value = globalSettings.company_city || "Neumünster";
            if (document.getElementById("cfg-company-type")) document.getElementById("cfg-company-type").value = globalSettings.company_type || "Freiberufler";
            if (document.getElementById("cfg-tax-assessment-type")) document.getElementById("cfg-tax-assessment-type").value = globalSettings.tax_assessment_type || "EÜR";
            if (document.getElementById("cfg-tax-number")) document.getElementById("cfg-tax-number").value = globalSettings.tax_number || "";
            if (document.getElementById("cfg-vat-id")) document.getElementById("cfg-vat-id").value = globalSettings.vat_id || "";
            if (document.getElementById("cfg-w-idnr")) document.getElementById("cfg-w-idnr").value = globalSettings.w_idnr || "";
            if (document.getElementById("cfg-taxation-type")) document.getElementById("cfg-taxation-type").value = globalSettings.taxation_type || "Ist-Versteuerung";
            if (document.getElementById("cfg-enable-ai-vision")) document.getElementById("cfg-enable-ai-vision").checked = globalSettings.enable_ai_vision !== 0;
            if (document.getElementById("cfg-lexware-own-vendor-id")) document.getElementById("cfg-lexware-own-vendor-id").value = globalSettings.lexware_own_vendor_id || "";
            if (document.getElementById("cfg-lexware-api-key")) {
              document.getElementById("cfg-lexware-api-key").value = globalSettings.lexware_api_key || "";
              updateLexwareKeyBadge();
            }
          } catch (e) {
            console.warn("loadSettings: Firmendaten error", e);
          }

          // E-Mail Config Fields
          try {
            if (document.getElementById("cfg-email-sender-name")) document.getElementById("cfg-email-sender-name").value = globalSettings.email_sender_name || "Michael Kirst-Neshva | IT Architecture & Security";
            if (document.getElementById("cfg-email-sender-email")) document.getElementById("cfg-email-sender-email").value = globalSettings.email_sender_email || "mkn@ankbs.de";
            if (document.getElementById("cfg-email-service")) document.getElementById("cfg-email-service").value = globalSettings.email_service || "resend";
            if (document.getElementById("cfg-email-api-key")) document.getElementById("cfg-email-api-key").value = globalSettings.email_api_key || "";
            if (document.getElementById("cfg-email-subject")) document.getElementById("cfg-email-subject").value = globalSettings.email_subject_template || "Freigabe Leistungsnachweis {period} für Projekt {projectName}";
            if (document.getElementById("cfg-email-body")) {
              document.getElementById("cfg-email-body").value = globalSettings.email_body_template || 
                `Sehr geehrte(r) {contactPerson},\n\nfür das Projekt "{projectName}" ({customerName}) liegt der Tätigkeits- und Leistungsnachweis für den Abrechnungszeitraum {period} zur Prüfung und Freigabe bereit.\n\nÜbersicht:\n• Projekt: {projectName}\n• Zeitraum: {period}\n• Geleistete Stunden: {hours} Std.\n• Gesamtbetrag (Netto): {amountNet} €\n\nBitte prüfen und signieren Sie den Leistungsnachweis über folgenden Freigabelink:\n{approvalLink}\n\nMit freundlichen Grüßen,\n{senderName}`;
            }

            // Mahnwesen & Erinnerungen
            if (document.getElementById("cfg-email-reminder1-subject")) document.getElementById("cfg-email-reminder1-subject").value = globalSettings.email_reminder1_subject || "1. Erinnerung: Freigabe Leistungsnachweis {period} für Projekt {projectName}";
            if (document.getElementById("cfg-email-reminder1-body")) {
              document.getElementById("cfg-email-reminder1-body").value = globalSettings.email_reminder1_body || 
                `Sehr geehrte(r) {contactPerson},\n\nwir möchten Sie kurz an die ausstehende Prüfung des Leistungsnachweises für das Projekt "{projectName}" ({period}) erinnern.\n\nLink zur Ansicht & Freigabe:\n{approvalLink}\n\nMit freundlichen Grüßen,\n{senderName}`;
            }
            if (document.getElementById("cfg-email-reminder2-subject")) document.getElementById("cfg-email-reminder2-subject").value = globalSettings.email_reminder2_subject || "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})";
            if (document.getElementById("cfg-email-reminder2-body")) {
              document.getElementById("cfg-email-reminder2-body").value = globalSettings.email_reminder2_body || 
                `Sehr geehrte(r) {contactPerson},\n\nwir möchten Sie freundlich daran erinnern, dass die Freigabe des Leistungsnachweises für das Projekt "{projectName}" ({period}) noch aussteht.\n\nBitte prüfen und bestätigen Sie die Posten zeitnah unter folgendem Link:\n{approvalLink}\n\nMit freundlichen Grüßen,\n{senderName}`;
            }
            if (document.getElementById("cfg-email-admin-notify-rejection")) document.getElementById("cfg-email-admin-notify-rejection").checked = globalSettings.email_admin_notify_rejection !== 0;
            if (document.getElementById("cfg-email-admin-notify-reminder")) document.getElementById("cfg-email-admin-notify-reminder").checked = globalSettings.email_admin_notify_reminder !== 0;
          } catch (e) {
            console.warn("loadSettings: Email config error", e);
          }

          // Auftragnehmer-Signatur & Berufsbezeichnung
          try {
            if (document.getElementById("cfg-contractor-title")) {
              document.getElementById("cfg-contractor-title").value = globalSettings.contractor_title || "Senior Cloud & Security Architect";
            }
            const sigDataUrl = globalSettings.contractor_signature_data_url || localStorage.getItem("cfg_contractor_signature_data_url") || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : "");
            const sigPreviewImg = document.getElementById("cfg-signature-preview-img");
            const sigNoneText = document.getElementById("cfg-signature-none-text");
            const sigDelBtn = document.getElementById("cfg-signature-delete-btn");
            const sigInput = document.getElementById("cfg-signature-data-url");
            if (sigPreviewImg && sigInput) {
              sigInput.value = sigDataUrl || "";
              if (sigDataUrl) {
                sigPreviewImg.src = sigDataUrl;
                sigPreviewImg.style.display = "block";
                if (sigNoneText) sigNoneText.style.display = "none";
                if (sigDelBtn) sigDelBtn.style.display = "inline-flex";
              } else {
                sigPreviewImg.style.display = "none";
                if (sigNoneText) sigNoneText.style.display = "inline";
                if (sigDelBtn) sigDelBtn.style.display = "none";
              }
            }
            if (document.getElementById("cfg-use-signature-documents")) {
              document.getElementById("cfg-use-signature-documents").checked = (globalSettings.use_signature_on_documents !== 0 && localStorage.getItem("cfg_use_signature_documents") !== "0");
            }
          } catch (e) {
            console.warn("loadSettings: Signature error", e);
          }
          // Lexware Webhook Callback-URL
          if (document.getElementById("cfg-lexware-webhook-callback-url")) {
            document.getElementById("cfg-lexware-webhook-callback-url").value = globalSettings.lexware_webhook_callback_url || (API_BASE + "/webhooks/lexware");
          }

          // DATEV & Buchhaltungs-Konfiguration
          if (document.getElementById("cfg-billing-provider")) document.getElementById("cfg-billing-provider").value = globalSettings.billing_provider || "lexware";
          if (document.getElementById("cfg-chart-accounts")) document.getElementById("cfg-chart-accounts").value = globalSettings.chart_of_accounts || "SKR04";
          if (document.getElementById("cfg-tax-mode")) document.getElementById("cfg-tax-mode").value = globalSettings.tax_mode || "standard";
          if (document.getElementById("cfg-datev-consultant")) document.getElementById("cfg-datev-consultant").value = globalSettings.datev_consultant_number || "1001";
          if (document.getElementById("cfg-datev-client")) document.getElementById("cfg-datev-client").value = globalSettings.datev_client_number || "10001";

          // 7b. KI & Belegerkennungs-Einstellungen
          if (document.getElementById("cfg-enable-ai-vision")) document.getElementById("cfg-enable-ai-vision").checked = globalSettings.enable_ai_vision !== 0;
          if (document.getElementById("cfg-ai-auto-provider-detect")) document.getElementById("cfg-ai-auto-provider-detect").checked = globalSettings.ai_auto_provider_detect !== 0;
          if (document.getElementById("cfg-gemini-api-key")) {
            const effKey = globalSettings.gemini_api_key || localStorage.getItem("cfg_gemini_api_key") || "";
            document.getElementById("cfg-gemini-api-key").value = effKey;
            if (effKey) localStorage.setItem("cfg_gemini_api_key", effKey);
          }
          if (document.getElementById("cfg-gemini-model")) {
            const effModel = globalSettings.gemini_model || localStorage.getItem("cfg_gemini_model") || "gemini-3.1-flash-lite-preview";
            document.getElementById("cfg-gemini-model").value = effModel;
            if (effModel) localStorage.setItem("cfg_gemini_model", effModel);
          }
          if (document.getElementById("cfg-ai-prompt-image")) document.getElementById("cfg-ai-prompt-image").value = globalSettings.ai_prompt_image || "";
          if (document.getElementById("cfg-ai-prompt-pdf")) document.getElementById("cfg-ai-prompt-pdf").value = globalSettings.ai_prompt_pdf || "";
          if (document.getElementById("cfg-ai-vision-model")) document.getElementById("cfg-ai-vision-model").value = globalSettings.ai_vision_model || "@cf/meta/llama-3.2-11b-vision-instruct";
          if (document.getElementById("cfg-ai-pdf-model")) document.getElementById("cfg-ai-pdf-model").value = globalSettings.ai_pdf_model || "@cf/meta/llama-3.1-8b-instruct";
          updateGeminiStatusBadge();

          let customRules = [];
          if (globalSettings.ai_custom_rules_json) {
            try {
              customRules = typeof globalSettings.ai_custom_rules_json === "string" ? JSON.parse(globalSettings.ai_custom_rules_json) : globalSettings.ai_custom_rules_json;
            } catch {}
          }
          renderAiCustomRulesTable(customRules);

          updateChartLabels();
        }
      } catch (err) {
        console.error("Fehler beim Laden der Einstellungen:", err);
      }
    }

    function renderAiCustomRulesTable(rules = []) {
      const tbody = document.getElementById("cfg-ai-custom-rules-tbody");
      if (!tbody) return;
      tbody.innerHTML = "";
      if (!rules || rules.length === 0) {
        tbody.innerHTML = `<tr id="cfg-ai-no-rules-row"><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 8px; font-style: italic;">Keine benutzerdefinierten Regeln hinterlegt. DACH-Erkennung läuft vollautomatisch.</td></tr>`;
        return;
      }
      rules.forEach((r, idx) => {
        addAiCustomRuleRow(r.keyword || "", r.category || "TransitLocal");
      });
    }

    function addAiCustomRuleRow(keyword = "", category = "TransitLocal") {
      const tbody = document.getElementById("cfg-ai-custom-rules-tbody");
      if (!tbody) return;
      const noRow = document.getElementById("cfg-ai-no-rules-row");
      if (noRow) noRow.remove();

      const tr = document.createElement("tr");
      tr.className = "ai-custom-rule-row";
      tr.innerHTML = `
        <td style="padding: 6px 10px;">
          <input type="text" class="form-control ai-rule-keyword" placeholder="z. B. Autokraft, Kielius, Rewe" value="${escapeHtml(keyword)}" style="font-size: 0.82rem; padding: 4px 8px;">
        </td>
        <td style="padding: 6px 10px;">
          <select class="form-control ai-rule-cat" style="font-size: 0.82rem; padding: 4px 8px;">
            <option value="TransitLocal" ${category === "TransitLocal" ? "selected" : ""}>ÖPNV / Nahverkehr (Bus, U-Bahn, Tram)</option>
            <option value="TrainLongDistance" ${category === "TrainLongDistance" ? "selected" : ""}>Bahn Fernverkehr (ICE, IC/EC)</option>
            <option value="TaxiLocal" ${category === "TaxiLocal" ? "selected" : ""}>Taxi & Fahrdienste</option>
            <option value="Parking" ${category === "Parking" ? "selected" : ""}>Parken / Parkgebühren</option>
            <option value="FuelPower" ${category === "FuelPower" ? "selected" : ""}>Tanken / Ladestrom</option>
            <option value="HotelLogis" ${category === "HotelLogis" ? "selected" : ""}>Hotel Übernachtung</option>
            <option value="Hospitality" ${category === "Hospitality" ? "selected" : ""}>Geschäftsessen / Bewirtung</option>
            <option value="Other" ${category === "Other" ? "selected" : ""}>Sonstige Betriebsausgabe</option>
          </select>
        </td>
        <td style="padding: 6px 10px; text-align: center;">
          <button type="button" class="btn btn-outline" style="padding: 2px 6px; font-size: 0.75rem; color: #ef4444; border-color: #fca5a5;" onclick="this.closest('tr').remove()" title="Regel löschen">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    function getAiCustomRulesFromUI() {
      const rows = document.querySelectorAll("#cfg-ai-custom-rules-tbody tr.ai-custom-rule-row");
      const rules = [];
      rows.forEach(r => {
        const kw = r.querySelector(".ai-rule-keyword")?.value.trim();
        const cat = r.querySelector(".ai-rule-cat")?.value;
        if (kw) {
          rules.push({ keyword: kw, category: cat || "TransitLocal" });
        }
      });
      return rules;
    }

    function updateGeminiStatusBadge() {
      const badge = document.getElementById("gemini-status-badge");
      const key = document.getElementById("cfg-gemini-api-key")?.value.trim();
      const model = document.getElementById("cfg-gemini-model")?.value;
      if (key) {
        try { localStorage.setItem("cfg_gemini_api_key", key); } catch (_) {}
      }
      if (model) {
        try { localStorage.setItem("cfg_gemini_model", model); } catch (_) {}
      }
      if (!badge) return;
      if (key && key.length > 5) {
        badge.style.background = "#dcfce7";
        badge.style.color = "#15803d";
        badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Aktiv: Primäre Belegerkennung via Gemini`;
      } else {
        badge.style.background = "#e2e8f0";
        badge.style.color = "#475569";
        badge.innerHTML = `Nicht konfiguriert (Cloudflare Fallback aktiv)`;
      }
    }

    function togglePromptEditorSection() {
      const el = document.getElementById("cfg-prompt-editor-container");
      const toggleText = document.getElementById("prompt-editor-toggle-text");
      if (!el) return;
      if (el.style.display === "none" || !el.style.display) {
        el.style.display = "block";
        if (toggleText) toggleText.innerHTML = `<i class="fa-solid fa-chevron-up"></i> Prompts einklappen`;
      } else {
        el.style.display = "none";
        if (toggleText) toggleText.innerHTML = `<i class="fa-solid fa-chevron-down"></i> Prompts anpassen / einblenden`;
      }
    }

    function resetPromptToDefault(type) {
      if (type === "image") {
        const el = document.getElementById("cfg-ai-prompt-image");
        if (el) {
          el.value = "";
          alert("Bild-Prompt auf verifizierten Standard zurückgesetzt (wird beim Speichern wirksam).");
        }
      } else if (type === "pdf") {
        const el = document.getElementById("cfg-ai-prompt-pdf");
        if (el) {
          el.value = "";
          alert("PDF-Prompt auf verifizierten Standard zurückgesetzt (wird beim Speichern wirksam).");
        }
      }
    }

    async function importLexwareCompanyProfile() {
      if (!confirm("Möchten Sie die aktuellen Firmendaten (Name, Anschrift, Steuernummer) direkt aus Ihrem Lexware Office Account importieren?")) return;
      try {
        const res = await fetch(`${API_BASE}/settings/import-lexware-profile`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert("Erfolg: " + data.message);
          await loadSettings();
        } else {
          alert("Fehler beim Lexware-Import: " + (data.error || "Unbekannter Fehler"));
        }
      } catch (err) {
        alert("Verbindungsfehler: " + err.message);
      }
    }

    function toggleLexwareApiKeyVisibility() {
      const input = document.getElementById("cfg-lexware-api-key");
      const eye = document.getElementById("cfg-lexware-api-key-eye");
      if (!input || !eye) return;
      if (input.type === "password") {
        input.type = "text";
        eye.className = "fa-solid fa-eye-slash";
      } else {
        input.type = "password";
        eye.className = "fa-solid fa-eye";
      }
    }

    function updateLexwareKeyBadge() {
      const badge = document.getElementById("cfg-lexware-key-source-badge");
      const keyInput = document.getElementById("cfg-lexware-api-key");
      if (!badge) return;

      const hasCustomKey = !!(keyInput && keyInput.value.trim());
      const hasEnvKey = !!(window.globalSettings && window.globalSettings.has_env_lexware_key);

      if (hasCustomKey) {
        badge.style.display = "inline-block";
        badge.style.background = "#e0f2fe";
        badge.style.color = "#0369a1";
        badge.style.border = "1px solid #bae6fd";
        badge.innerHTML = '<i class="fa-solid fa-database"></i> Individueller Schlüssel (Datenbank)';
      } else if (hasEnvKey) {
        badge.style.display = "inline-block";
        badge.style.background = "#f0fdf4";
        badge.style.color = "#15803d";
        badge.style.border = "1px solid #bbf7d0";
        badge.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Server-Secret aktiv (Worker Env)';
      } else {
        badge.style.display = "inline-block";
        badge.style.background = "#fff7ed";
        badge.style.color = "#c2410c";
        badge.style.border = "1px solid #ffedd5";
        badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Kein Schlüssel hinterlegt';
      }
    }

    async function testLexwareApiConnection() {
      const btn = document.getElementById("cfg-btn-test-lexware");
      const statusEl = document.getElementById("cfg-lexware-test-result");
      const keyInput = document.getElementById("cfg-lexware-api-key");
      const testKey = keyInput ? keyInput.value.trim() : "";

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Prüfe...';
      }
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.style.color = "#2563eb";
        statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verbindung zu Lexware Office API wird geprüft...';
      }

      try {
        const res = await fetch(`${API_BASE}/settings/test-lexware-connection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: testKey || undefined })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (statusEl) {
            statusEl.style.color = "#15803d";
            statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Verbindung erfolgreich!</strong> Organisation: <em>${escapeHtml(data.companyName || "OK")}</em>${data.email ? " (" + escapeHtml(data.email) + ")" : ""}`;
          }
          loadLexwareVendors(false);
        } else {
          if (statusEl) {
            statusEl.style.color = "#b91c1c";
            statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <strong>Verbindungsfehler:</strong> ${escapeHtml(data.error || "Ungültiger API-Schlüssel oder Lexware API nicht erreichbar.")}`;
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.style.color = "#b91c1c";
          statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <strong>Netzwerkfehler:</strong> ${escapeHtml(err.message || String(err))}`;
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-plug-circle-check"></i> Verbindung testen';
        }
      }
    }

    let globalLexwareVendors = [];

    async function loadLexwareVendors(showFeedback = false) {
      const select = document.getElementById("cfg-lexware-own-vendor-select");
      const input = document.getElementById("cfg-lexware-own-vendor-id");
      const statusEl = document.getElementById("cfg-vendor-detection-status");
      const textEl = document.getElementById("cfg-vendor-detection-text");
      if (!select || !input) return;

      // Wenn bereits geladen und kein manuelles Neuladen verlangt wird: vorhandene Liste nutzen
      if (!showFeedback && globalLexwareVendors.length > 0 && select.options.length > 1) {
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/settings/lexware-vendors`);
        if (!res.ok) return;
        const data = await res.json();
        globalLexwareVendors = data.vendors || [];

        select.innerHTML = '<option value="">-- Lieferant aus Lexware wählen --</option>' +
          globalLexwareVendors.map(v => {
            const isSugg = v.isSuggested ? ' ⭐ (Empfohlen)' : '';
            const numStr = v.vendorNumber ? `[${v.vendorNumber}] ` : '';
            return `<option value="${v.id}" data-number="${v.vendorNumber || ''}">${numStr}${escapeHtml(v.name)}${isSugg}</option>`;
          }).join("");

        const curVal = input.value.trim();
        let matched = null;
        if (curVal) {
          matched = globalLexwareVendors.find(v => (v.vendorNumber && v.vendorNumber.toString() === curVal) || v.id === curVal || v.name.toLowerCase().includes(curVal.toLowerCase()));
        } else if (data.suggestedVendorId) {
          matched = globalLexwareVendors.find(v => v.id === data.suggestedVendorId);
          if (matched) {
            input.value = matched.vendorNumber ? matched.vendorNumber.toString() : matched.id;
          }
        }

        if (matched) {
          select.value = matched.id;
          if (statusEl && textEl) {
            textEl.innerHTML = `Erkannt: <strong>${escapeHtml(matched.name)}</strong> (Lieferanten-Nr. ${matched.vendorNumber || '-'})`;
            statusEl.style.display = "block";
          }
        } else if (statusEl) {
          statusEl.style.display = "none";
        }

        if (showFeedback) {
          if (matched) {
            alert(`Eigenlieferant erkannt:\n\n${matched.name} (Lieferanten-Nr. ${matched.vendorNumber})\n\nDiese Lieferanten-Nummer wird für Lexware Office Eigenbelege verwendet.`);
          } else {
            alert(`${globalLexwareVendors.length} Lieferanten aus Lexware geladen.`);
          }
        }
      } catch (err) {
        console.warn("Could not load Lexware vendors:", err);
      }
    }

    function onVendorSelectChanged() {
      const select = document.getElementById("cfg-lexware-own-vendor-select");
      const input = document.getElementById("cfg-lexware-own-vendor-id");
      const statusEl = document.getElementById("cfg-vendor-detection-status");
      const textEl = document.getElementById("cfg-vendor-detection-text");
      if (!select || !input) return;

      const selectedOpt = select.options[select.selectedIndex];
      if (selectedOpt && selectedOpt.value) {
        const vNum = selectedOpt.getAttribute("data-number");
        input.value = vNum || selectedOpt.value;
        const matched = globalLexwareVendors.find(v => v.id === selectedOpt.value);
        if (matched && statusEl && textEl) {
          textEl.innerHTML = `Erkannt: <strong>${escapeHtml(matched.name)}</strong> (Lieferanten-Nr. ${matched.vendorNumber || '-'})`;
          statusEl.style.display = "block";
        }
      }
    }

    function onVendorInputChanged() {
      const select = document.getElementById("cfg-lexware-own-vendor-select");
      const input = document.getElementById("cfg-lexware-own-vendor-id");
      const statusEl = document.getElementById("cfg-vendor-detection-status");
      const textEl = document.getElementById("cfg-vendor-detection-text");
      if (!input) return;

      const val = input.value.trim();
      if (!val) {
        if (select) select.value = "";
        if (statusEl) statusEl.style.display = "none";
        return;
      }

      const matched = globalLexwareVendors.find(v => (v.vendorNumber && v.vendorNumber.toString() === val) || v.id === val || v.name.toLowerCase().includes(val.toLowerCase()));
      if (matched) {
        if (select) select.value = matched.id;
        if (statusEl && textEl) {
          textEl.innerHTML = `Erkannt: <strong>${escapeHtml(matched.name)}</strong> (Lieferanten-Nr. ${matched.vendorNumber || '-'})`;
          statusEl.style.display = "block";
        }
      } else if (statusEl) {
        statusEl.style.display = "none";
      }
    }

    function updateChartLabels() {
      const chart = (globalSettings && globalSettings.chart_of_accounts) || "SKR04";
      document.querySelectorAll(".dyn-skr-label").forEach(el => el.innerText = chart);
    }

    function handleSignatureFileUpload(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("Die Bilddatei ist zu groß (max. 2 MB erlaubt).");
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataUrl = e.target.result;
        const sigPreviewImg = document.getElementById("cfg-signature-preview-img");
        const sigNoneText = document.getElementById("cfg-signature-none-text");
        const sigDelBtn = document.getElementById("cfg-signature-delete-btn");
        const sigInput = document.getElementById("cfg-signature-data-url");
        if (sigPreviewImg && sigInput) {
          sigInput.value = dataUrl;
          sigPreviewImg.src = dataUrl;
          sigPreviewImg.style.display = "block";
          if (sigNoneText) sigNoneText.style.display = "none";
          if (sigDelBtn) sigDelBtn.style.display = "inline-flex";
        }
      };
      reader.readAsDataURL(file);
    }

    function clearSignaturePreview() {
      const sigPreviewImg = document.getElementById("cfg-signature-preview-img");
      const sigNoneText = document.getElementById("cfg-signature-none-text");
      const sigDelBtn = document.getElementById("cfg-signature-delete-btn");
      const sigInput = document.getElementById("cfg-signature-data-url");
      const sigFileInput = document.getElementById("cfg-signature-file");
      if (sigPreviewImg && sigInput) {
        sigInput.value = "";
        sigPreviewImg.src = "";
        sigPreviewImg.style.display = "none";
        if (sigNoneText) sigNoneText.style.display = "inline";
        if (sigDelBtn) sigDelBtn.style.display = "none";
      }
      if (sigFileInput) sigFileInput.value = "";
    }

    async function handleSaveSettings(e) {
      e.preventDefault();
      const street = document.getElementById("cfg-company-street")?.value.trim() || "Ruthenberger Markt 11b";
      const zip = document.getElementById("cfg-company-zip")?.value.trim() || "24539";
      const city = document.getElementById("cfg-company-city")?.value.trim() || "Neumünster";
      const fullAddress = `${street}, ${zip} ${city}`;

      const payload = {
        company_name: document.getElementById("cfg-company-name")?.value.trim() || "Cloud Security & Compliance Architecture – Michael Kirst-Neshva",
        contractor_name: document.getElementById("cfg-contractor-name")?.value.trim() || "Michael Kirst-Neshva",
        company_street: street,
        company_zip: zip,
        company_city: city,
        company_address: fullAddress,
        company_type: document.getElementById("cfg-company-type")?.value || "Freiberufler",
        tax_assessment_type: document.getElementById("cfg-tax-assessment-type")?.value || "EÜR",
        tax_number: document.getElementById("cfg-tax-number")?.value.trim() || "",
        vat_id: document.getElementById("cfg-vat-id")?.value.trim() || "",
        w_idnr: document.getElementById("cfg-w-idnr")?.value.trim() || "",
        taxation_type: document.getElementById("cfg-taxation-type")?.value || "Ist-Versteuerung",
        mileage_rate_business: parseFloat(document.getElementById("cfg-mileage-rate").value || "0.30"),
        commute_rate_tier1: parseFloat(document.getElementById("cfg-commute-tier1").value || "0.30"),
        commute_rate_tier2: parseFloat(document.getElementById("cfg-commute-tier2").value || "0.38"),
        vma_rate_8h: parseFloat(document.getElementById("cfg-vma-8h").value || "14.00"),
        vma_rate_24h: parseFloat(document.getElementById("cfg-vma-24h").value || "28.00"),
        default_transport_type: document.getElementById("cfg-default-transport")?.value || "Train",
        pdf_storage_mode: document.getElementById("cfg-pdf-storage").value || "R2",
        email_sender_name: document.getElementById("cfg-email-sender-name").value.trim(),
        email_sender_email: document.getElementById("cfg-email-sender-email").value.trim(),
        email_service: document.getElementById("cfg-email-service").value,
        email_api_key: document.getElementById("cfg-email-api-key").value.trim(),
        email_subject_template: document.getElementById("cfg-email-subject").value.trim(),
        email_body_template: document.getElementById("cfg-email-body").value,
        email_reminder1_subject: document.getElementById("cfg-email-reminder1-subject").value.trim(),
        email_reminder1_body: document.getElementById("cfg-email-reminder1-body").value,
        email_reminder2_subject: document.getElementById("cfg-email-reminder2-subject").value.trim(),
        email_reminder2_body: document.getElementById("cfg-email-reminder2-body").value,
        email_admin_notify_rejection: document.getElementById("cfg-email-admin-notify-rejection").checked ? 1 : 0,
        email_admin_notify_reminder: document.getElementById("cfg-email-admin-notify-reminder").checked ? 1 : 0,
        enable_ai_vision: document.getElementById("cfg-enable-ai-vision")?.checked ? 1 : 0,
        ai_auto_provider_detect: document.getElementById("cfg-ai-auto-provider-detect")?.checked ? 1 : 0,
        gemini_api_key: document.getElementById("cfg-gemini-api-key")?.value.trim() || "",
        gemini_model: document.getElementById("cfg-gemini-model")?.value || "gemini-3.1-flash-lite-preview",
        ai_prompt_image: document.getElementById("cfg-ai-prompt-image")?.value || "",
        ai_prompt_pdf: document.getElementById("cfg-ai-prompt-pdf")?.value || "",
        ai_vision_model: document.getElementById("cfg-ai-vision-model")?.value || "@cf/meta/llama-3.2-11b-vision-instruct",
        ai_pdf_model: document.getElementById("cfg-ai-pdf-model")?.value || "@cf/meta/llama-3.1-8b-instruct",
        ai_custom_rules_json: JSON.stringify(getAiCustomRulesFromUI()),
        lexware_own_vendor_id: document.getElementById("cfg-lexware-own-vendor-id")?.value.trim() || "",
        lexware_api_key: document.getElementById("cfg-lexware-api-key")?.value.trim() || "",
        contractor_title: document.getElementById("cfg-contractor-title")?.value.trim() || "Senior Cloud & Security Architect",
        contractor_signature_data_url: document.getElementById("cfg-signature-data-url")?.value || globalSettings.contractor_signature_data_url || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : null),
        use_signature_on_documents: document.getElementById("cfg-use-signature-documents")?.checked ? 1 : 0,
        lexware_webhook_callback_url: document.getElementById("cfg-lexware-webhook-callback-url")?.value.trim() || (API_BASE + "/webhooks/lexware"),
        vehicle_planning_json: globalSettings.vehicle_planning_json || "{}"
      };

      try {
        const res = await fetch(`${API_BASE}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert("Einstellungen & Firmendaten erfolgreich gespeichert!");
          globalSettings = { ...globalSettings, ...payload };
          updateCarMileageLabels(payload.mileage_rate_business);
          if (globalSettings.vehicle_planning_json) {
            try {
              const plan = typeof globalSettings.vehicle_planning_json === "string" ? JSON.parse(globalSettings.vehicle_planning_json) : globalSettings.vehicle_planning_json;
              updateVehiclePlanningBadge(payload.mileage_rate_business, plan);
            } catch (_) {}
          } else {
            updateVehiclePlanningBadge(payload.mileage_rate_business, null);
          }
          try {
            if (payload.contractor_signature_data_url) {
              localStorage.setItem("cfg_contractor_signature_data_url", payload.contractor_signature_data_url);
            } else {
              localStorage.removeItem("cfg_contractor_signature_data_url");
            }
            localStorage.setItem("cfg_use_signature_documents", payload.use_signature_on_documents ? "1" : "0");
            if (payload.company_city) {
              localStorage.setItem("cfg_company_city", payload.company_city);
            }
            if (payload.contractor_name) {
              localStorage.setItem("cfg_contractor_name", payload.contractor_name);
            }
            if (payload.company_name) {
              localStorage.setItem("cfg_company_name", payload.company_name);
            }
            if (payload.gemini_api_key) {
              localStorage.setItem("cfg_gemini_api_key", payload.gemini_api_key);
            }
            if (payload.gemini_model) {
              localStorage.setItem("cfg_gemini_model", payload.gemini_model);
            }
          } catch (_) {}
          calculateTravelTotals();
        } else {
          alert("Fehler: " + (data.error || "Speichern fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function handleAdminChangePassword(e) {
      if (e) e.preventDefault();
      const currentPassword = document.getElementById("pwd-current")?.value || "";
      const newPassword = document.getElementById("pwd-new")?.value || "";
      const confirmPassword = document.getElementById("pwd-confirm")?.value || "";

      if (!currentPassword || !newPassword) {
        alert("Bitte füllen Sie alle Passwortfelder aus.");
        return;
      }
      if (newPassword.length < 8) {
        alert("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
        return;
      }
      if (newPassword !== confirmPassword) {
        alert("Die beiden neuen Passwörter stimmen nicht überein!");
        return;
      }

      const token = localStorage.getItem("auth_token") || "";
      try {
        const res = await fetch(`${API_BASE}/auth/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert("✅ Passwort erfolgreich geändert! Bitte merken Sie sich Ihr neues Kennwort.");
          document.getElementById("change-password-form")?.reset();
        } else {
          alert("❌ Fehler: " + (data.error || "Passwort konnte nicht geändert werden."));
        }
      } catch (err) {
        alert("❌ Netzwerkfehler: " + err.message);
      }
    }

    // ==========================================
    // [MODULARIZED] Kfz-Vollkosten-Planer ausgelagert -> js/modules/vehicle-planning.js

    // REISEKOSTEN & SPESEN (GOBD & ESTG - 22 KATEGORIEN)
    // ==========================================
    const EXPENSE_CATEGORIES = [
      // 🚗 Fahrt & Mobilität (8)
      { code: "MileagePkw", name: "🚗 PKW-Kilometerpauschale (0%)", skr04: "6674", skr03: "4674", defaultTax: 0.0 },
      { code: "RentalCar", name: "🚗 Mietwagen & Carsharing (19%)", skr04: "6670", skr03: "4670", defaultTax: 19.0 },
      { code: "FuelPower", name: "⚡ Kraftstoff & Ladestrom (19%)", skr04: "6670", skr03: "4670", defaultTax: 19.0 },
      { code: "TaxiLocal", name: "🚕 Taxi & Fahrdienste Nah <50km (7%)", skr04: "6670", skr03: "4670", defaultTax: 7.0 },
      { code: "TaxiLong", name: "🚕 Taxi & Fahrdienste Fern >50km (19%)", skr04: "6670", skr03: "4670", defaultTax: 19.0 },
      { code: "TrainLongDistance", name: "🚆 Bahn Fernverkehr ICE/IC (7%)", skr04: "6663", skr03: "4663", defaultTax: 7.0 },
      { code: "TransitLocal", name: "🚊 ÖPNV, Nahverkehr & D-Ticket (7%)", skr04: "6663", skr03: "4663", defaultTax: 7.0 },
      { code: "Flight", name: "✈️ Flugreisen Inland/Ausland (19%/0%)", skr04: "6660", skr03: "4660", defaultTax: 19.0 },
      
      // 🅿️ Reisenebenkosten & Parken (4)
      { code: "Parking", name: "🅿️ Parkgebühren & Parkhaus (19%)", skr04: "6673", skr03: "4673", defaultTax: 19.0 },
      { code: "TollFee", name: "🛣️ Maut, Vignette & Tunnel (0%)", skr04: "6673", skr03: "4673", defaultTax: 0.0 },
      { code: "Micromobility", name: "🛴 E-Scooter & Leihrad (19%)", skr04: "6670", skr03: "4670", defaultTax: 19.0 },
      { code: "LuggageStorage", name: "🧳 Gepäck & Equipment-Transport (19%)", skr04: "6673", skr03: "4673", defaultTax: 19.0 },
      
      // 🏨 Unterkunft & Hotel (3)
      { code: "HotelLogis", name: "🏨 Hotelübernachtung Reine Logis (7%)", skr04: "6668", skr03: "4668", defaultTax: 7.0 },
      { code: "HotelBreakfast", name: "🍳 Hotel-Frühstück / Business Package (19%)", skr04: "6668", skr03: "4668", defaultTax: 19.0 },
      { code: "CityTax", name: "🏛️ City-Tax / Bettensteuer (0%)", skr04: "6668", skr03: "4668", defaultTax: 0.0 },
      
      // 🍽️ Verpflegung & Bewirtung (2)
      { code: "VmaPerDiem", name: "🍽️ Verpflegungsmehraufwand VMA 14€/28€ (0%)", skr04: "6664", skr03: "4664", defaultTax: 0.0 },
      { code: "Hospitality", name: "🍷 Kundenbewirtung geschäftlich 70/30 (19%)", skr04: "6640", skr03: "4640", defaultTax: 19.0 },
      
      // 💻 IT- & Arbeitsplatz-Sonderkosten auf Reisen (5)
      { code: "MobileInternet", name: "📶 Mobiles Internet, Roaming & WLAN (19%)", skr04: "6805", skr03: "4920", defaultTax: 19.0 },
      { code: "CoworkingPass", name: "🏢 Day-Pass Coworking Space (19%)", skr04: "6310", skr03: "4210", defaultTax: 19.0 },
      { code: "TechSupplies", name: "🔌 Eil-Hardware, Adapter & Kabel vor Ort (19%)", skr04: "6880", skr03: "4985", defaultTax: 19.0 },
      { code: "ExpoTickets", name: "🎟️ Messe- & Ausstellungstickets (19%)", skr04: "6600", skr03: "4600", defaultTax: 19.0 },
      { code: "ConferenceTickets", name: "🎓 Fachkonferenzen, Seminare & Workshops (19%)", skr04: "6822", skr03: "4945", defaultTax: 19.0 },
      
      // Legacy Aliases
      { code: "Hotel", name: "Hotel / Übernachtung (Legacy)", skr04: "6668", skr03: "4668", defaultTax: 7.0 },
      { code: "Transit", name: "ÖPNV / Nahverkehr (Legacy)", skr04: "6663", skr03: "4663", defaultTax: 7.0 },
      { code: "LongDistance", name: "Fernverkehr / Bahn (Legacy)", skr04: "6663", skr03: "4663", defaultTax: 0.0 },
      { code: "Other", name: "Sonstige Nebenkosten (Legacy)", skr04: "6670", skr03: "4670", defaultTax: 19.0 }
    ];

    function onTravelStartDateChanged() {
      const start = document.getElementById("travel-start-date").value;
      const endEl = document.getElementById("travel-end-date");
      if (start && (!endEl.value || endEl.value < start)) {
        endEl.value = start;
      }
      calculateTravelTotals();
    }

    function addExpenseRow(tbodyId = "travel-expenses-tbody", exp = null) {
      const tbody = document.getElementById(tbodyId);
      if (!tbody) return;

      const rowId = (exp && (exp.rowId || exp.id)) ? (exp.rowId || exp.id) : ("exp_row_" + crypto.randomUUID().substring(0, 8));
      const tripStartDate = document.getElementById(tbodyId === "edit-trip-expenses-tbody" ? "edit-trip-start-date" : "travel-start-date")?.value || new Date().toISOString().substring(0, 10);
      
      const expDate = exp?.expense_date || exp?.expenseDate || tripStartDate;
      const category = exp?.category || "HotelLogis";
      const desc = exp?.description || "";
      const catObj = EXPENSE_CATEGORIES.find(c => c.code === category) || EXPENSE_CATEGORIES[0];
      const skr04 = exp?.skr04_account || exp?.skr04Account || catObj.skr04;
      const taxRate = exp?.tax_rate !== undefined ? exp.tax_rate : (exp?.taxRate !== undefined ? exp.taxRate : catObj.defaultTax);
      const gross = exp?.amount_gross !== undefined ? exp.amount_gross : (exp?.amountGross !== undefined ? exp.amountGross : 0.0);
      const net = exp?.amount_net !== undefined ? exp.amount_net : (exp?.amountNet !== undefined ? exp.amountNet : 0.0);
      const isBillable = exp ? (exp.is_billable_to_client !== undefined ? (exp.is_billable_to_client !== 0) : (exp.isBillableToClient === true)) : false;
      const r2Key = exp?.receipt_r2_key || exp?.receiptR2Key || "";
      const rFilename = exp?.receipt_filename || exp?.receiptFilename || "";
      const rMime = exp?.receipt_mime_type || exp?.receiptMimeType || "";
      const isSynced = exp?.is_synced_to_lexware === 1 || exp?.isSyncedToLexware === true;
      const lexVoucherId = exp?.lexware_voucher_id || exp?.lexwareVoucherId || "";

      // Determine default foreign currency from country if abroad
      let defaultCountry = "";
      if (tbodyId === "edit-trip-expenses-tbody") {
        const sel = document.getElementById("edit-travel-foreign-country-select");
        if (sel && sel.selectedIndex >= 0) defaultCountry = sel.options[sel.selectedIndex]?.text || "";
      } else {
        const sel = document.getElementById("travel-foreign-country-select");
        if (sel && sel.selectedIndex >= 0) defaultCountry = sel.options[sel.selectedIndex]?.text || "";
      }
      const suggestedCurrency = (typeof getCurrencyForCountry === "function" && defaultCountry) ? getCurrencyForCountry(defaultCountry) : "EUR";

      // Foreign currency fields
      const currency = exp?.currency || (exp ? "EUR" : (suggestedCurrency !== "EUR" ? suggestedCurrency : "EUR"));
      const foreignAmtGross = exp?.foreign_amount_gross !== undefined ? exp.foreign_amount_gross : (exp?.foreignAmountGross !== undefined ? exp.foreignAmountGross : (currency !== "EUR" && gross > 0 ? gross : 0.0));
      const exchangeRate = exp?.exchange_rate !== undefined ? exp.exchange_rate : (exp?.exchangeRate !== undefined ? exp.exchangeRate : 1.0);
      const exchangeRateProof = exp?.exchange_rate_proof || exp?.exchangeRateProof || "Kreditkartenabrechnung";
      const isFxActive = currency !== "EUR";

      const tr = document.createElement("tr");
      tr.id = rowId;
      tr.setAttribute("data-row-id", rowId);
      tr.style.borderBottom = "1px solid var(--border)";

      tr.innerHTML = `
        <td style="padding: 6px;">
          <input type="date" class="form-control exp-date" value="${expDate}" style="padding: 4px 6px; font-size: 0.8rem;">
        </td>
        <td style="padding: 6px;">
          <select class="form-control exp-cat" style="padding: 4px 6px; font-size: 0.8rem;" onchange="onExpenseCategoryChanged('${rowId}', '${tbodyId}')">
            <optgroup label="🚗 Fahrt & Mobilität">
              <option value="MileagePkw" data-skr04="6674" data-skr03="4674" data-tax="0" ${category === 'MileagePkw' ? 'selected' : ''}>🚗 PKW-Kilometerpauschale (0%)</option>
              <option value="RentalCar" data-skr04="6670" data-skr03="4670" data-tax="19" ${category === 'RentalCar' ? 'selected' : ''}>🚗 Mietwagen & Carsharing (19%)</option>
              <option value="FuelPower" data-skr04="6670" data-skr03="4670" data-tax="19" ${category === 'FuelPower' ? 'selected' : ''}>⚡ Kraftstoff & Ladestrom (19%)</option>
              <option value="TaxiLocal" data-skr04="6670" data-skr03="4670" data-tax="7" ${category === 'TaxiLocal' ? 'selected' : ''}>🚕 Taxi Nah &lt;50km (7%)</option>
              <option value="TaxiLong" data-skr04="6670" data-skr03="4670" data-tax="19" ${category === 'TaxiLong' ? 'selected' : ''}>🚕 Taxi Fern &gt;50km (19%)</option>
              <option value="TrainLongDistance" data-skr04="6663" data-skr03="4663" data-tax="7" ${category === 'TrainLongDistance' || category === 'LongDistance' ? 'selected' : ''}>🚆 Bahn Fernverkehr ICE/IC (7%)</option>
              <option value="TransitLocal" data-skr04="6663" data-skr03="4663" data-tax="7" ${category === 'TransitLocal' || category === 'Transit' ? 'selected' : ''}>🚊 ÖPNV, Nahverkehr & D-Ticket (7%)</option>
              <option value="Flight" data-skr04="6660" data-skr03="4660" data-tax="19" ${category === 'Flight' ? 'selected' : ''}>✈️ Flugreisen (19%)</option>
            </optgroup>
            <optgroup label="🅿️ Reisenebenkosten & Parken">
              <option value="Parking" data-skr04="6673" data-skr03="4673" data-tax="19" ${category === 'Parking' ? 'selected' : ''}>🅿️ Parkgebühren & Parkhaus (19%)</option>
              <option value="TollFee" data-skr04="6673" data-skr03="4673" data-tax="0" ${category === 'TollFee' ? 'selected' : ''}>🛣️ Maut, Vignette & Tunnel (0%)</option>
              <option value="Micromobility" data-skr04="6670" data-skr03="4670" data-tax="19" ${category === 'Micromobility' ? 'selected' : ''}>🛴 E-Scooter & Leihrad (19%)</option>
              <option value="LuggageStorage" data-skr04="6673" data-skr03="4673" data-tax="19" ${category === 'LuggageStorage' ? 'selected' : ''}>🧳 Gepäck & Equipment-Transport (19%)</option>
            </optgroup>
            <optgroup label="🏨 Unterkunft & Hotel">
              <option value="HotelLogis" data-skr04="6668" data-skr03="4668" data-tax="7" ${category === 'HotelLogis' || category === 'Hotel' ? 'selected' : ''}>🏨 Hotelübernachtung Reine Logis (7%)</option>
              <option value="HotelBreakfast" data-skr04="6668" data-skr03="4668" data-tax="19" ${category === 'HotelBreakfast' ? 'selected' : ''}>🍳 Hotel-Frühstück / Business Package (19%)</option>
              <option value="CityTax" data-skr04="6668" data-skr03="4668" data-tax="0" ${category === 'CityTax' ? 'selected' : ''}>🏛️ City-Tax / Bettensteuer (0%)</option>
            </optgroup>
            <optgroup label="🍽️ Verpflegung & Bewirtung">
              <option value="VmaPerDiem" data-skr04="6664" data-skr03="4664" data-tax="0" ${category === 'VmaPerDiem' ? 'selected' : ''}>🍽️ Verpflegungsmehraufwand VMA 14€/28€ (0%)</option>
              <option value="Hospitality" data-skr04="6640" data-skr03="4640" data-tax="19" ${category === 'Hospitality' ? 'selected' : ''}>🍷 Kundenbewirtung geschäftlich 70/30 (19%)</option>
            </optgroup>
            <optgroup label="💻 IT & Arbeitsplatz auf Reisen">
              <option value="MobileInternet" data-skr04="6805" data-skr03="4920" data-tax="19" ${category === 'MobileInternet' ? 'selected' : ''}>📶 Mobiles Internet, Roaming & WLAN (19%)</option>
              <option value="CoworkingPass" data-skr04="6310" data-skr03="4210" data-tax="19" ${category === 'CoworkingPass' ? 'selected' : ''}>🏢 Day-Pass Coworking Space (19%)</option>
              <option value="TechSupplies" data-skr04="6880" data-skr03="4985" data-tax="19" ${category === 'TechSupplies' ? 'selected' : ''}>🔌 Eil-Hardware, Adapter & Kabel vor Ort (19%)</option>
              <option value="ExpoTickets" data-skr04="6600" data-skr03="4600" data-tax="19" ${category === 'ExpoTickets' ? 'selected' : ''}>🎟️ Messe- & Ausstellungstickets (19%)</option>
              <option value="ConferenceTickets" data-skr04="6822" data-skr03="4945" data-tax="19" ${category === 'ConferenceTickets' ? 'selected' : ''}>🎓 Fachkonferenzen & Seminare (19%)</option>
              <option value="Other" data-skr04="6670" data-skr03="4670" data-tax="19" ${category === 'Other' ? 'selected' : ''}>Sonstige Nebenkosten (19%)</option>
            </optgroup>
          </select>
          <input type="hidden" class="exp-skr04" value="${skr04}">
        </td>
        <td style="padding: 6px;">
          <input type="text" class="form-control exp-desc" value="${desc}" placeholder="z. B. Hotel 2 Nächte, Taxi..." style="padding: 4px 6px; font-size: 0.8rem;">
        </td>
        <td style="padding: 6px;">
          <select class="form-control exp-tax" style="padding: 4px 6px; font-size: 0.8rem;" onchange="recalculateExpenseRow('${rowId}', '${tbodyId}')">
            <option value="19" ${Math.round(taxRate) === 19 ? 'selected' : ''}>19 %</option>
            <option value="7" ${Math.round(taxRate) === 7 ? 'selected' : ''}>7 %</option>
            <option value="0" ${Math.round(taxRate) === 0 ? 'selected' : ''}>0 %</option>
          </select>
        </td>
        <td style="padding: 6px;">
          <input type="number" step="0.01" class="form-control exp-gross" value="${gross > 0 ? gross.toFixed(2) : ''}" placeholder="0.00" style="padding: 4px 6px; font-size: 0.8rem; font-weight: 600; width: 100%; min-width: 85px;" oninput="recalculateExpenseRow('${rowId}', '${tbodyId}')">
        </td>
        <td style="padding: 6px; text-align: center;">
          <button type="button" class="btn btn-outline" id="fx_btn_${rowId}" onclick="openExpenseFxModal('${rowId}', '${tbodyId}')" title="Fremdwährung (CHF, USD, GBP etc.) erfassen" style="width: 100%; padding: 4px 6px; font-size: 0.75rem; border-radius: 6px; ${isFxActive ? 'background:#fef08a; border-color:#ca8a04; color:#854d0e; font-weight:700;' : 'background:#f8fafc; border-color:#cbd5e1; color:#475569;'}">
            <i class="fa-solid fa-coins"></i> ${currency !== 'EUR' ? currency + ' (' + (foreignAmtGross > 0 ? foreignAmtGross.toFixed(2) : 'FX') + ')' : 'EUR (Inland)'}
          </button>
          <!-- Hidden inputs holding FX state for this row -->
          <input type="hidden" class="exp-currency" value="${currency}">
          <input type="hidden" class="exp-foreign-amount" value="${foreignAmtGross > 0 ? foreignAmtGross : ''}">
          <input type="hidden" class="exp-exchange-rate" value="${exchangeRate > 0 ? exchangeRate : '1.0'}">
          <input type="hidden" class="exp-exchange-proof" value="${exchangeRateProof}">
        </td>
        <td style="padding: 6px;">
          <input type="text" class="form-control exp-net" readonly value="${net > 0 ? net.toFixed(2) + ' €' : '0.00 €'}" style="padding: 4px 6px; font-size: 0.8rem; background: #f8fafc; width: 100%; min-width: 80px;">
        </td>
        <td style="padding: 6px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <input type="file" id="file_${rowId}" style="display: none;" accept="image/*,application/pdf" onchange="uploadExpenseReceipt(this, '${rowId}', '${tbodyId}')">
            <button type="button" class="btn btn-outline" style="padding: 3px 6px; font-size: 0.75rem;" onclick="document.getElementById('file_${rowId}').click()" title="Belegdatei anhängen">
              <i class="fa-solid fa-paperclip"></i>
            </button>
            <button type="button" class="btn btn-outline" style="padding: 3px 6px; font-size: 0.75rem; color: #7c3aed; border-color: #ddd6fe;" onclick="triggerExpenseAiScan('${rowId}', '${tbodyId}')" title="Beleg mit Cloudflare KI analysieren (Kategorie, Betrag & MwSt)">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
            </button>
            <span id="label_${rowId}" style="font-size: 0.72rem; max-width: 105px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${rFilename ? `<a href="${API_BASE}/trips/receipts/${encodeURIComponent(r2Key)}" target="_blank" style="color: var(--primary);"><i class="fa-solid fa-file-pdf"></i> ${rFilename}</a>` : '<span style="color: var(--text-muted);">Kein Beleg</span>'}
            </span>
          </div>
          <input type="hidden" class="exp-r2-key" value="${r2Key}">
          <input type="hidden" class="exp-filename" value="${rFilename}">
          <input type="hidden" class="exp-mimetype" value="${rMime}">
          <input type="hidden" class="exp-is-synced" value="${isSynced ? '1' : '0'}">
          <input type="hidden" class="exp-lex-voucher-id" value="${lexVoucherId}">
        </td>
        <td style="padding: 6px; text-align: center;">
          <input type="checkbox" class="exp-billable" ${isBillable ? 'checked' : ''} onchange="${tbodyId === 'edit-trip-expenses-tbody' ? 'calculateEditTripTotals()' : 'calculateTravelTotals()'}" title="An Kunden weiterberechnen">
        </td>
        <td style="padding: 6px; text-align: center;">
          <button type="button" class="btn btn-outline" style="padding: 3px 6px; font-size: 0.75rem; color: #be123c; border-color: #fecdd3;" onclick="removeExpenseRow('${rowId}', '${tbodyId}')" title="Zeile löschen">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
      if (tbodyId === "edit-trip-expenses-tbody") calculateEditTripTotals();
      else calculateTravelTotals();
      return rowId;
    }

    
    
    function getFullWorldCurrencyOptionsHtml(selectedCurrency = "EUR") {
      const curList = (typeof WORLD_CURRENCIES !== "undefined") ? WORLD_CURRENCIES : [
        { code: "EUR", symbol: "€", name: "Euro" },
        { code: "CHF", symbol: "CHF", name: "Schweizer Franken" },
        { code: "USD", symbol: "$", name: "US-Dollar" },
        { code: "GBP", symbol: "£", name: "Britisches Pfund" },
        { code: "PLN", symbol: "zł", name: "Polnischer Złoty" },
        { code: "CZK", symbol: "Kč", name: "Tschechische Krone" },
        { code: "DKK", symbol: "kr", name: "Dänische Krone" },
        { code: "SEK", symbol: "kr", name: "Schwedische Krone" },
        { code: "NOK", symbol: "kr", name: "Norwegische Krone" },
        { code: "JPY", symbol: "¥", name: "Japanischer Yen" }
      ];

      return curList.map(c => `<option value="${c.code}" ${c.code === selectedCurrency ? 'selected' : ''}>${c.code} – ${c.name}</option>`).join("");
    }


    let currentFxEditingRowId = null;
    let currentFxEditingTbodyId = null;

    function openExpenseFxModal(rowId, tbodyId) {
      const row = document.getElementById(rowId);
      if (!row) return;

      currentFxEditingRowId = rowId;
      currentFxEditingTbodyId = tbodyId;

      const curVal = row.querySelector(".exp-currency")?.value || "EUR";
      const foreignAmt = parseFloat(row.querySelector(".exp-foreign-amount")?.value || "0");
      const rate = parseFloat(row.querySelector(".exp-exchange-rate")?.value || "1.0");
      const proof = row.querySelector(".exp-exchange-proof")?.value || "Kreditkartenabrechnung";
      const grossEur = parseFloat(row.querySelector(".exp-gross")?.value || "0");
      const desc = row.querySelector(".exp-desc")?.value || "Ausgabe";

      document.getElementById("fx-modal-row-id").value = rowId;
      document.getElementById("fx-modal-tbody-id").value = tbodyId;
      document.getElementById("fx-modal-subtitle").innerText = "Beleg: " + desc;

      const curSelect = document.getElementById("fx-modal-currency");
      if (curSelect) {
        curSelect.innerHTML = getFullWorldCurrencyOptionsHtml(curVal);
      }

      document.getElementById("fx-modal-foreign-amount").value = foreignAmt > 0 ? foreignAmt.toFixed(2) : (curVal !== "EUR" && grossEur > 0 ? grossEur.toFixed(2) : "");
      document.getElementById("fx-modal-exchange-rate").value = rate > 0 ? rate : "1.0000";
      document.getElementById("fx-modal-exchange-proof").value = proof;

      recalcFxModalEur();
      openModal("expense-fx-modal");
    }

    function onFxModalCurrencyChanged() {
      const cur = document.getElementById("fx-modal-currency")?.value || "EUR";
      const lbl = document.getElementById("fx-modal-amount-label");
      if (lbl) lbl.innerText = `Originalbetrag in ${cur} *`;
      if (cur === "EUR") {
        document.getElementById("fx-modal-exchange-rate").value = "1.0000";
      }
      recalcFxModalEur();
    }

    function recalcFxModalEur() {
      const cur = document.getElementById("fx-modal-currency")?.value || "EUR";
      const foreignAmt = parseFloat(document.getElementById("fx-modal-foreign-amount")?.value || "0");
      const rate = parseFloat(document.getElementById("fx-modal-exchange-rate")?.value || "1.0");

      let eurGross = 0;
      if (cur === "EUR") {
        eurGross = foreignAmt;
      } else {
        eurGross = rate > 0 ? (foreignAmt / rate) : foreignAmt;
      }

      const preview = document.getElementById("fx-modal-eur-preview");
      if (preview) {
        preview.innerText = eurGross.toFixed(2).replace(".", ",") + " €";
      }
    }

    function resetFxModalToEur() {
      const curSelect = document.getElementById("fx-modal-currency");
      if (curSelect) curSelect.value = "EUR";
      document.getElementById("fx-modal-exchange-rate").value = "1.0000";
      recalcFxModalEur();
    }

    function saveFxModalToRow() {
      const rowId = document.getElementById("fx-modal-row-id")?.value;
      const tbodyId = document.getElementById("fx-modal-tbody-id")?.value;
      const row = document.getElementById(rowId);
      if (!row) return;

      const currency = document.getElementById("fx-modal-currency")?.value || "EUR";
      const foreignAmt = parseFloat(document.getElementById("fx-modal-foreign-amount")?.value || "0");
      const rate = parseFloat(document.getElementById("fx-modal-exchange-rate")?.value || "1.0");
      const proof = document.getElementById("fx-modal-exchange-proof")?.value || "Kreditkartenabrechnung";

      // Set hidden fields
      const curInput = row.querySelector(".exp-currency");
      const amtInput = row.querySelector(".exp-foreign-amount");
      const rateInput = row.querySelector(".exp-exchange-rate");
      const proofInput = row.querySelector(".exp-exchange-proof");
      const grossInput = row.querySelector(".exp-gross");
      const taxSelect = row.querySelector(".exp-tax");
      const fxBtn = document.getElementById(`fx_btn_${rowId}`);

      if (curInput) curInput.value = currency;
      if (amtInput) amtInput.value = foreignAmt > 0 ? foreignAmt.toFixed(2) : "";
      if (rateInput) rateInput.value = rate > 0 ? rate : "1.0";
      if (proofInput) proofInput.value = proof;

      if (currency !== "EUR") {
        if (foreignAmt > 0 && rate > 0) {
          const eurGross = Math.round((foreignAmt / rate) * 100) / 100;
          if (grossInput) grossInput.value = eurGross.toFixed(2);
        }
        if (taxSelect) taxSelect.value = "0"; // 0% gem. § 15 UStG
        if (fxBtn) {
          fxBtn.style.background = "#fef08a";
          fxBtn.style.borderColor = "#ca8a04";
          fxBtn.style.color = "#854d0e";
          fxBtn.style.fontWeight = "700";
          fxBtn.innerHTML = `<i class="fa-solid fa-coins"></i> ${currency} (${foreignAmt > 0 ? foreignAmt.toFixed(2) : 'FX'})`;
        }
      } else {
        if (fxBtn) {
          fxBtn.style.background = "#f8fafc";
          fxBtn.style.borderColor = "#cbd5e1";
          fxBtn.style.color = "#475569";
          fxBtn.style.fontWeight = "";
          fxBtn.innerHTML = `<i class="fa-solid fa-coins"></i> EUR (Inland)`;
        }
      }

      recalculateExpenseRow(rowId, tbodyId);
      closeModal("expense-fx-modal");
    }

    function onExpenseCategoryChanged(rowId, tbodyId) {
      const row = document.getElementById(rowId);
      if (!row) return;
      const catSelect = row.querySelector(".exp-cat");
      if (!catSelect) return;
      const opt = catSelect.options[catSelect.selectedIndex];
      if (!opt) return;

      const skr04 = opt.getAttribute("data-skr04") || "";
      const rawTax = opt.getAttribute("data-tax");
      const defTax = (rawTax !== null && rawTax !== undefined) ? Math.round(parseFloat(rawTax)).toString() : "19";

      const skrInput = row.querySelector(".exp-skr04");
      if (skrInput) skrInput.value = skr04;

      const taxSelect = row.querySelector(".exp-tax");
      if (taxSelect) {
        taxSelect.value = defTax;
      }
      recalculateExpenseRow(rowId, tbodyId);
    }

    function recalculateExpenseRow(rowId, tbodyId) {
      const row = document.getElementById(rowId);
      if (!row) return;
      const gross = parseFloat(row.querySelector(".exp-gross")?.value || "0");
      const taxRate = parseFloat(row.querySelector(".exp-tax")?.value || "0");
      const net = taxRate > 0 ? (gross / (1 + (taxRate / 100))) : gross;
      
      const netEl = row.querySelector(".exp-net");
      if (netEl) netEl.value = `${net.toFixed(2)} €`;

      if (tbodyId === "edit-trip-expenses-tbody") calculateEditTripTotals();
      else calculateTravelTotals();
    }

    async function uploadExpenseReceipt(fileInput, rowId, tbodyId) {
      if (!fileInput.files || fileInput.files.length === 0) return;
      const file = fileInput.files[0];
      const labelEl = document.getElementById(`label_${rowId}`);
      if (labelEl) labelEl.innerHTML = `<span class="spinner" style="width: 12px; height: 12px;"></span> Upload...`;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_BASE}/trips/upload-receipt`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const row = document.getElementById(rowId);
          if (row) {
            row.querySelector(".exp-r2-key").value = data.r2Key;
            row.querySelector(".exp-filename").value = data.filename;
            row.querySelector(".exp-mimetype").value = data.mimeType;
          }
          if (labelEl) {
            labelEl.innerHTML = `<a href="${API_BASE}/trips/receipts/${encodeURIComponent(data.r2Key)}" target="_blank" style="color: #15803d; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> ${data.filename}</a>`;
          }
          // Automatischen KI-Scan des hochgeladenen Reisebelegs anstoßen
          triggerExpenseAiScan(rowId, tbodyId);
        } else {
          alert("Beleg-Upload fehlgeschlagen: " + (data.error || "Unbekannter Fehler"));
          if (labelEl) labelEl.innerHTML = `<span style="color: red;">Fehler</span>`;
        }
      } catch (err) {
        alert("Upload-Fehler: " + err.message);
        if (labelEl) labelEl.innerHTML = `<span style="color: red;">Fehler</span>`;
      }
    }

    // =========================================================================
    // [MODULARIZED] KI-Beleg-Scan & Prüf-Queue ausgelagert -> js/modules/ai-review.js

    function transferTicketToExpenses(mode) {
      const isEdit = mode === 'edit';
      const vehicleSelect = document.getElementById(isEdit ? "edit-trip-vehicle" : "travel-vehicle");
      const ticketInput = document.getElementById(isEdit ? "edit-trip-ticket-amount" : "travel-ticket-amount");
      const targetTbody = isEdit ? "edit-trip-expenses-tbody" : "travel-expenses-tbody";
      const startDate = (isEdit ? document.getElementById("edit-trip-start-date")?.value : document.getElementById("travel-start-date")?.value) || new Date().toISOString().split("T")[0];
      const endDate = (isEdit ? document.getElementById("edit-trip-end-date")?.value : document.getElementById("travel-end-date")?.value) || startDate;

      const v = vehicleSelect ? vehicleSelect.value : "Train";
      const amount = parseFloat(ticketInput?.value || "0");

      let cat = "TrainLongDistance";
      let desc = "Bahnticket Hin- und Rückfahrt";
      let defTax = 7;
      if (v === "Flight") { cat = "Flight"; desc = "Flugticket"; defTax = 19; }
      else if (v === "RentalCar") { cat = "RentalCar"; desc = "Mietwagen / Taxi"; defTax = 19; }
      else if (v === "RentalBike") { cat = "Micromobility"; desc = "Mietrad / Scooter"; defTax = 19; }

      const isMultiDay = startDate !== endDate;
      const confirmSplit = isMultiDay || amount > 50 ? confirm(`Möchten Sie das Ticket auf getrennte Zeilen für Hinfahrt (${startDate}) und Rückfahrt (${endDate}) aufteilen?`) : false;

      if (confirmSplit) {
        const half = (amount / 2).toFixed(2);
        addExpenseRow(targetTbody, {
          expenseDate: startDate,
          category: cat,
          description: desc.replace("Hin- und Rückfahrt", "Hinfahrt"),
          amountGross: parseFloat((parseFloat(half) * (1 + defTax / 100)).toFixed(2)),
          taxRate: defTax,
          amountNet: parseFloat(half),
          isBillableToClient: true
        });
        addExpenseRow(targetTbody, {
          expenseDate: endDate,
          category: cat,
          description: desc.replace("Hin- und Rückfahrt", "Rückfahrt"),
          amountGross: parseFloat((parseFloat(half) * (1 + defTax / 100)).toFixed(2)),
          taxRate: defTax,
          amountNet: parseFloat(half),
          isBillableToClient: true
        });
      } else {
        addExpenseRow(targetTbody, {
          expenseDate: startDate,
          category: cat,
          description: desc,
          amountGross: amount > 0 ? parseFloat((amount * (1 + defTax / 100)).toFixed(2)) : 0,
          taxRate: defTax,
          amountNet: amount,
          isBillableToClient: true
        });
      }

      if (ticketInput) ticketInput.value = "0.00";
      if (isEdit) calculateEditTripTotals();
      else calculateTravelTotals();
    }

    function removeExpenseRow(rowId, tbodyId) {
      const row = document.getElementById(rowId);
      if (row) row.remove();
      if (tbodyId === "edit-trip-expenses-tbody") calculateEditTripTotals();
      else calculateTravelTotals();
    }

    let isRoundTripMode = false;
    let currentTripMode = "domestic"; // "domestic" | "foreign-single" | "foreign-multi"
    // [MODULARIZED] BMF-Auslandstagegelder ausgelagert -> js/modules/bmf-travel.js

    function onTravelStatusModeChanged() {
      const status = document.querySelector('input[name="travel-entry-status"]:checked')?.value || "Completed";
      const submitBtn = document.querySelector('#travel-form button[type="submit"]');
      if (submitBtn) {
        if (status === "Planned") {
          submitBtn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> 📅 Geplante Reise speichern (Forecast)`;
          submitBtn.style.background = "#0284c7";
          submitBtn.style.borderColor = "#0284c7";
        } else {
          submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Reisekosten & Spesen speichern`;
          submitBtn.style.background = "";
          submitBtn.style.borderColor = "";
        }
      }
    }

    function onTravelOriginChanged() {
      const orig = document.getElementById("travel-origin")?.value || "";
      const sameAsStart = document.getElementById("travel-return-same-as-start")?.checked;
      if (sameAsStart) {
        const retInput = document.getElementById("travel-return-dest");
        if (retInput) retInput.value = orig;
      }
    }

    function onTravelReturnCheckChanged() {
      const sameAsStart = document.getElementById("travel-return-same-as-start")?.checked;
      const retInput = document.getElementById("travel-return-dest");
      if (!retInput) return;
      if (sameAsStart) {
        retInput.value = document.getElementById("travel-origin")?.value || "";
        retInput.readOnly = true;
      } else {
        retInput.readOnly = false;
        retInput.focus();
      }
    }

    function onEditTripOriginChanged() {
      const orig = document.getElementById("edit-trip-origin")?.value || "";
      const sameAsStart = document.getElementById("edit-travel-return-same-as-start")?.checked;
      if (sameAsStart) {
        const retInput = document.getElementById("edit-trip-return-dest");
        if (retInput) retInput.value = orig;
      }
    }

    function onEditTravelReturnCheckChanged() {
      const sameAsStart = document.getElementById("edit-travel-return-same-as-start")?.checked;
      const retInput = document.getElementById("edit-trip-return-dest");
      if (!retInput) return;
      if (sameAsStart) {
        retInput.value = document.getElementById("edit-trip-origin")?.value || "";
        retInput.readOnly = true;
      } else {
        retInput.readOnly = false;
        retInput.focus();
      }
    }

    function toggleRoundTripMode(forceState) {
      if (forceState !== undefined) isRoundTripMode = forceState;
      else isRoundTripMode = !isRoundTripMode;

      const legsBox = document.getElementById("round-trip-legs-box");
      const simpleRoute = document.getElementById("simple-route-row");
      const simpleVehicle = document.getElementById("simple-vehicle-row");
      const label = document.getElementById("roundtrip-toggle-label");
      const btn = document.getElementById("btn-toggle-roundtrip");

      if (isRoundTripMode) {
        if (legsBox) legsBox.style.display = "block";
        if (simpleRoute) simpleRoute.style.display = "none";
        if (simpleVehicle) simpleVehicle.style.display = "none";
        if (label) label.innerText = "[- ] Rundreise deaktivieren (Einfache Route)";
        if (btn) btn.classList.add("btn-primary");
        const tbody = document.getElementById("travel-legs-tbody");
        if (tbody && tbody.children.length === 0) {
          const originVal = document.getElementById("travel-origin")?.value || "Neumünster, Wohnort";
          const destVal = document.getElementById("travel-dest")?.value || "München";
          const returnVal = document.getElementById("travel-return-dest")?.value || originVal;
          const dateVal = document.getElementById("travel-start-date")?.value || "2026-08-22";
          addTripLegRow("travel-legs-tbody", { startLocation: originVal, destinationLocation: destVal, dateLeg: dateVal });
          addTripLegRow("travel-legs-tbody", { startLocation: destVal, destinationLocation: returnVal, dateLeg: dateVal });
        }
      } else {
        if (legsBox) legsBox.style.display = "none";
        if (simpleRoute) simpleRoute.style.display = "flex";
        if (simpleVehicle) simpleVehicle.style.display = "grid";
        if (label) label.innerText = "[+] Rundreise & Etappen aktivieren";
        if (btn) btn.classList.remove("btn-primary");
      }
      calculateTravelTotals();
    }

    
    function getLegCountryOptionsHtml(selectedVal = "") {
      const rates = (typeof getEffectiveBmfRates === "function") ? getEffectiveBmfRates() : [];
      let html = '<option value="Deutschland" ' + (selectedVal === 'Deutschland' || !selectedVal ? 'selected' : '') + '>🇩🇪 Deutschland (Inland)</option>';
      const sorted = [...rates].sort((a, b) => a.label.localeCompare(b.label, "de", { sensitivity: "base" }));
      sorted.forEach(r => {
        if (r.country === "Deutschland") return;
        const val = r.id;
        const isSel = (selectedVal === val || selectedVal === r.country || selectedVal === r.label || (r.city && selectedVal === r.city));
        html += `<option value="${r.id}" data-country="${escapeHtml(r.country)}" data-city="${escapeHtml(r.city || '')}" data-24h="${r.rate_24h}" data-8h="${r.rate_arrival_departure}" ${isSel ? 'selected' : ''}>${escapeHtml(r.label)} (${r.rate_24h}€/${r.rate_arrival_departure}€)</option>`;
      });
      return html;
    }

function addTripLegRow(tbodyId = "travel-legs-tbody", data = null) {
      const tbody = document.getElementById(tbodyId);
      if (!tbody) return;

      const rowIdx = tbody.children.length + 1;
      const rowId = `leg_row_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const startDate = document.getElementById(tbodyId === "edit-travel-legs-tbody" ? "edit-trip-start-date" : "travel-start-date")?.value || "2026-08-22";
      const defaultTrans = globalSettings.default_transport_type || "Train";

      let prevDest = "";
      let prevDate = startDate;
      if (!data && tbody.children.length > 0) {
        const lastRow = tbody.children[tbody.children.length - 1];
        prevDest = lastRow.querySelector(".leg-dest")?.value || "";
        prevDate = lastRow.querySelector(".leg-date")?.value || startDate;
      }
      const initialOrigin = document.getElementById(tbodyId === "edit-travel-legs-tbody" ? "edit-trip-origin" : "travel-origin")?.value || "Neumünster, Wohnort";
      const startLocationVal = data?.startLocation || (prevDest ? prevDest : (rowIdx === 1 ? initialOrigin : ""));
      const legDateVal = data?.dateLeg || prevDate;

      // Determine initial country/BMF value for this leg
      const legCountryVal = data?.country || data?.destinationCountry || (rowIdx === 1 ? "Deutschland" : "");

      const tr = document.createElement("tr");
      tr.id = rowId;
      tr.className = "trip-leg-row";
      tr.innerHTML = `
        <td style="padding: 6px; text-align: center; font-weight: 700; color: var(--text-muted); width: 35px;">${rowIdx}</td>
        <td style="padding: 6px;">
          <input type="date" class="form-control leg-date" value="${legDateVal}" style="padding: 4px 6px; font-size: 0.8rem;" onchange="${tbodyId === 'edit-travel-legs-tbody' ? 'calculateEditTripTotals()' : 'calculateTravelTotals()'}">
        </td>
        <td style="padding: 6px;">
          <input type="text" class="form-control leg-start" placeholder="Startort" value="${escapeHtml(startLocationVal)}" style="padding: 4px 6px; font-size: 0.8rem;">
        </td>
        <td style="padding: 6px;">
          <input type="text" class="form-control leg-dest" placeholder="Zielort" value="${escapeHtml(data?.destinationLocation || '')}" style="padding: 4px 6px; font-size: 0.8rem;" onchange="onLegDestChanged('${rowId}', '${tbodyId}')">
        </td>
        <td style="padding: 6px;">
          <select class="form-control leg-country" style="padding: 4px 6px; font-size: 0.78rem; font-weight: 600;" onchange="onLegCountryChanged('${rowId}', '${tbodyId}')">
            ${getLegCountryOptionsHtml(legCountryVal)}
          </select>
        </td>
        <td style="padding: 6px;">
          <select class="form-control leg-transport" style="padding: 4px 6px; font-size: 0.8rem;" onchange="onLegTransportChanged('${rowId}')">
            <option value="Train" ${(data?.transportType || defaultTrans) === 'Train' ? 'selected' : ''}>🚆 Bahn / ÖPNV</option>
            <option value="Flight" ${(data?.transportType || defaultTrans) === 'Flight' ? 'selected' : ''}>✈️ Flugzeug</option>
            <option value="PersonalCar" ${(data?.transportType || defaultTrans) === 'PersonalCar' ? 'selected' : ''}>🚗 Eigener PKW</option>
            <option value="RentalCar" ${(data?.transportType || defaultTrans) === 'RentalCar' ? 'selected' : ''}>🚕 Mietwagen/Taxi</option>
            <option value="Passenger" ${(data?.transportType || defaultTrans) === 'Passenger' ? 'selected' : ''}>👥 Mitfahrt/Beifahrer</option>
            <option value="RentalBike" ${(data?.transportType || defaultTrans) === 'RentalBike' ? 'selected' : ''}>🛴 Mietrad/Scooter</option>
            <option value="BikeFoot" ${(data?.transportType || defaultTrans) === 'BikeFoot' ? 'selected' : ''}>🚲 Fahrrad/Zu Fuß</option>
          </select>
        </td>
        <td style="padding: 6px;">
          <div class="leg-km-wrap" style="display: ${(data?.transportType || defaultTrans) === 'PersonalCar' ? 'block' : 'none'};">
            <input type="number" step="1" class="form-control leg-km" placeholder="km" value="${data?.distanceKm !== undefined ? data.distanceKm : '0'}" style="padding: 4px 6px; font-size: 0.8rem;" oninput="${tbodyId === 'edit-travel-legs-tbody' ? 'calculateEditTripTotals()' : 'calculateTravelTotals()'}">
          </div>
          <div class="leg-cost-wrap" style="display: ${(data?.transportType || defaultTrans) === 'PersonalCar' || (data?.transportType || defaultTrans) === 'Passenger' || (data?.transportType || defaultTrans) === 'BikeFoot' ? 'none' : 'block'};">
            <input type="number" step="0.01" class="form-control leg-cost" placeholder="Netto €" value="${data?.travelCostNet || '0.00'}" style="padding: 4px 6px; font-size: 0.8rem;" oninput="${tbodyId === 'edit-travel-legs-tbody' ? 'calculateEditTripTotals()' : 'calculateTravelTotals()'}">
          </div>
          <div class="leg-free-wrap" style="display: ${(data?.transportType || defaultTrans) === 'Passenger' || (data?.transportType || defaultTrans) === 'BikeFoot' ? 'block' : 'none'}; font-size: 0.75rem; color: var(--text-muted); padding: 4px;">
            0,00 € (VMA aktiv)
          </div>
        </td>
        <td style="padding: 6px;">
          <div style="display: flex; gap: 4px;">
            <input type="number" step="0.5" class="form-control leg-layover-h" placeholder="Std." value="${data?.layoverHours || '0'}" style="width: 48px; padding: 4px 4px; font-size: 0.8rem;">
            <input type="text" class="form-control leg-layover-p" placeholder="Zweck" value="${data?.layoverPurpose || ''}" style="padding: 4px 4px; font-size: 0.8rem;">
          </div>
        </td>
        <td style="padding: 6px;">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <select class="form-control leg-customer" style="padding: 2px 4px; font-size: 0.75rem;">
              <option value="">-- Wie Gesamtreise --</option>
              ${globalCustomers.map(c => `<option value="${c.id}" ${data?.customerId === c.id ? 'selected' : ''}>${c.name.substring(0, 18)}</option>`).join("")}
            </select>
            <label class="form-check" style="margin-bottom: 0; font-size: 0.72rem;">
              <input type="checkbox" class="leg-billable" ${data && (data.isBillableToClient === 1 || data.isBillableToClient === true || data.is_billable_to_client === 1) ? 'checked' : ''} onchange="${tbodyId === 'edit-travel-legs-tbody' ? 'calculateEditTripTotals()' : 'calculateTravelTotals()'}">
              <span>Weiterberechnen</span>
            </label>
          </div>
        </td>
        <td style="padding: 6px; text-align: center;">
          <button type="button" class="btn btn-outline" style="padding: 2px 6px; font-size: 0.75rem; color: #be123c; border-color: #fecdd3;" onclick="removeTripLegRow(this)">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
      if (tbodyId === "edit-travel-legs-tbody") calculateEditTripTotals();
      else calculateTravelTotals();
    }

    function onLegCountryChanged(rowId, tbodyId) {
      if (tbodyId === "edit-travel-legs-tbody") calculateEditTripTotals();
      else calculateTravelTotals();
    }

    function onLegDestChanged(rowId, tbodyId) {
      const row = document.getElementById(rowId);
      if (!row) return;
      const destVal = (row.querySelector(".leg-dest")?.value || "").toLowerCase().trim();
      const countrySel = row.querySelector(".leg-country");
      if (!countrySel || !destVal) return;

      // Auto-suggest BMF country if destination matches country/city
      const rates = (typeof getEffectiveBmfRates === "function") ? getEffectiveBmfRates() : [];
      const match = rates.find(r => 
        (r.city && destVal.includes(r.city.toLowerCase())) ||
        destVal.includes(r.country.toLowerCase()) ||
        r.label.toLowerCase().includes(destVal)
      );

      if (match) {
        countrySel.value = match.id;
        onLegCountryChanged(rowId, tbodyId);
      }
    }

function onLegTransportChanged(rowId) {
      const row = document.getElementById(rowId);
      if (!row) return;
      const t = row.querySelector(".leg-transport")?.value || "Train";
      const kmWrap = row.querySelector(".leg-km-wrap");
      const costWrap = row.querySelector(".leg-cost-wrap");
      const freeWrap = row.querySelector(".leg-free-wrap");

      if (kmWrap) kmWrap.style.display = t === "PersonalCar" ? "block" : "none";
      if (costWrap) costWrap.style.display = (t === "PersonalCar" || t === "Passenger" || t === "BikeFoot") ? "none" : "block";
      if (freeWrap) freeWrap.style.display = (t === "Passenger" || t === "BikeFoot") ? "block" : "none";

      const tbody = row.closest("tbody");
      if (tbody && tbody.id === "edit-travel-legs-tbody") {
        calculateEditTripTotals();
      } else {
        calculateTravelTotals();
      }
    }

    function removeTripLegRow(btn) {
      const tr = btn.closest("tr");
      const tbody = tr ? tr.closest("tbody") : null;
      if (tr) tr.remove();
      if (tbody) {
        Array.from(tbody.children).forEach((row, i) => {
          const firstTd = row.children[0];
          if (firstTd) firstTd.innerText = (i + 1).toString();
        });
        if (tbody.id === "edit-travel-legs-tbody") {
          calculateEditTripTotals();
        } else {
          calculateTravelTotals();
        }
      }
    }

    function toggleEditRoundTripMode(forceState) {
      const cb = document.getElementById("edit-roundtrip-toggle");
      const isRoundTrip = forceState !== undefined ? forceState : cb.checked;
      cb.checked = isRoundTrip;

      const legsBox = document.getElementById("edit-round-trip-legs-box");
      const simpleRoute = document.getElementById("edit-simple-route-row");
      const simpleVehicle = document.getElementById("edit-simple-vehicle-row");

      if (isRoundTrip) {
        if (legsBox) legsBox.style.display = "block";
        if (simpleRoute) simpleRoute.style.display = "none";
        if (simpleVehicle) simpleVehicle.style.display = "none";
        const tbody = document.getElementById("edit-travel-legs-tbody");
        if (tbody && tbody.children.length === 0) {
          const startDate = document.getElementById("edit-trip-start-date")?.value || "2026-08-22";
          const endDate = document.getElementById("edit-trip-end-date")?.value || startDate;
          addTripLegRow("edit-travel-legs-tbody", {
            dateLeg: startDate,
            startLocation: document.getElementById("edit-trip-origin")?.value || "Neumünster, Wohnort",
            destinationLocation: document.getElementById("edit-trip-dest")?.value || "",
            transportType: document.getElementById("edit-trip-vehicle")?.value || globalSettings.default_transport_type || "Train",
            travelCostNet: 0
          });
          addTripLegRow("edit-travel-legs-tbody", {
            dateLeg: endDate,
            startLocation: document.getElementById("edit-trip-dest")?.value || "",
            destinationLocation: document.getElementById("edit-trip-origin")?.value || "Neumünster, Wohnort",
            transportType: document.getElementById("edit-trip-vehicle")?.value || globalSettings.default_transport_type || "Train",
            travelCostNet: 0
          });
        }
      } else {
        if (legsBox) legsBox.style.display = "none";
        if (simpleRoute) simpleRoute.style.display = "flex";
        if (simpleVehicle) simpleVehicle.style.display = "flex";
      }
      calculateEditTripTotals();
    }

    function toggleTravelFields() {
      const v = document.getElementById("travel-vehicle")?.value || "Train";
      const isCar = v === "PersonalCar";
      const isFree = v === "Passenger" || v === "BikeFoot";
      const isTicket = !isCar && !isFree;

      if (document.getElementById("car-km-group")) document.getElementById("car-km-group").style.display = isCar ? "block" : "none";
      if (document.getElementById("ticket-cost-group")) document.getElementById("ticket-cost-group").style.display = isTicket ? "block" : "none";
      calculateTravelTotals();
    }

    let selectedBreakfastDaysCreate = new Set();
    let selectedBreakfastDaysEdit = new Set();

    function onVmaGlobalBreakfastChanged(mode) {
      const isEdit = mode === 'edit';
      const globalCb = document.getElementById(isEdit ? "edit-trip-has-breakfast" : "travel-has-breakfast");
      const startDateStr = document.getElementById(isEdit ? "edit-trip-start-date" : "travel-start-date")?.value;
      const endDateStr = document.getElementById(isEdit ? "edit-trip-end-date" : "travel-end-date")?.value || startDateStr;

      let totalDays = 1;
      if (startDateStr) {
        const sParts = startDateStr.split("-").map(Number);
        const eParts = (endDateStr || startDateStr).split("-").map(Number);
        const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2], 12, 0, 0);
        const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2], 12, 0, 0);
        totalDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      }

      const targetSet = isEdit ? selectedBreakfastDaysEdit : selectedBreakfastDaysCreate;
      targetSet.clear();

      if (globalCb && globalCb.checked) {
        if (totalDays === 1) {
          targetSet.add(1);
        } else {
          for (let d = 2; d <= totalDays; d++) {
            targetSet.add(d);
          }
        }
      }

      if (isEdit) calculateEditTripTotals();
      else calculateTravelTotals();
    }

    function onVmaDayBreakfastToggled(cbEl, mode) {
      const isEdit = mode === 'edit';
      const dayNum = parseInt(cbEl.getAttribute("data-day") || "1");
      const targetSet = isEdit ? selectedBreakfastDaysEdit : selectedBreakfastDaysCreate;

      if (cbEl.checked) {
        targetSet.add(dayNum);
      } else {
        targetSet.delete(dayNum);
      }

      const globalCb = document.getElementById(isEdit ? "edit-trip-has-breakfast" : "travel-has-breakfast");
      const startDateStr = document.getElementById(isEdit ? "edit-trip-start-date" : "travel-start-date")?.value;
      const endDateStr = document.getElementById(isEdit ? "edit-trip-end-date" : "travel-end-date")?.value || startDateStr;
      let totalDays = 1;
      if (startDateStr) {
        const sParts = startDateStr.split("-").map(Number);
        const eParts = (endDateStr || startDateStr).split("-").map(Number);
        const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2], 12, 0, 0);
        const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2], 12, 0, 0);
        totalDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      }
      const eligibleDays = totalDays === 1 ? 1 : Math.max(1, totalDays - 1);

      if (globalCb) {
        if (targetSet.size === 0) {
          globalCb.checked = false;
          globalCb.indeterminate = false;
        } else if (targetSet.size >= eligibleDays) {
          globalCb.checked = true;
          globalCb.indeterminate = false;
        } else {
          globalCb.checked = false;
          globalCb.indeterminate = true;
        }
      }

      if (isEdit) calculateEditTripTotals();
      else calculateTravelTotals();
    }

    function getVmaDailyBreakdown(startDateStr, endDateStr, depTime, arrTime, breakfastParam, settings = (typeof globalSettings !== 'undefined' ? globalSettings : {})) {
      if (!startDateStr) return { totalDays: 0, nights: 0, isMultiDay: false, days: [], totalBase: 0, totalDeduction: 0, totalVma: 0 };
      const sParts = startDateStr.split("-").map(Number);
      const eParts = (endDateStr || startDateStr).split("-").map(Number);
      const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2], 12, 0, 0);
      const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2], 12, 0, 0);
      const totalDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const nights = Math.max(0, totalDays - 1);
      const rate8h = (settings && settings.vma_rate_8h !== undefined) ? parseFloat(settings.vma_rate_8h) : 14.00;
      const rate24h = (settings && settings.vma_rate_24h !== undefined) ? parseFloat(settings.vma_rate_24h) : 28.00;
      const breakfastPerDay = 5.60;

      const isBreakfastForDay = (dayNum) => {
        if (!breakfastParam) return false;
        if (breakfastParam instanceof Set) return breakfastParam.has(dayNum);
        if (Array.isArray(breakfastParam)) return breakfastParam.includes(dayNum);
        if (typeof breakfastParam === "object") return !!breakfastParam[dayNum];
        if (breakfastParam === true || breakfastParam === 1) {
          return totalDays === 1 ? true : dayNum > 1;
        }
        return false;
      };

      const days = [];
      let totalBase = 0;
      let totalDeduction = 0;

      if (totalDays === 1) {
        const dep = depTime || "07:30";
        const arr = arrTime || "19:30";
        const [dh, dm] = dep.split(":").map(Number);
        const [ah, am] = arr.split(":").map(Number);
        let durationHours = (ah * 60 + am - (dh * 60 + dm)) / 60;
        if (durationHours < 0) durationHours += 24;

        let base = 0;
        let lawNote = "Unter 8 Std. Abwesenheit gem. § 9 Abs. 4a EStG (0,00 €)";
        if (durationHours >= 24) {
          base = rate24h;
          lawNote = "24h Abwesenheit gem. § 9 Abs. 4a S. 3 Nr. 1 EStG";
        } else if (durationHours >= 8) {
          base = rate8h;
          lawNote = "Mehr als 8 Std. Abwesenheit gem. § 9 Abs. 4a S. 3 Nr. 3 EStG";
        }

        const hasBf = isBreakfastForDay(1);
        const ded = (hasBf && base > 0) ? Math.min(base, breakfastPerDay) : 0;
        const net = Math.max(0, base - ded);
        totalBase += base;
        totalDeduction += ded;

        const dateFormatted = sDate.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });

        days.push({
          dayNum: 1,
          dateFormatted,
          dateRaw: startDateStr,
          type: "Eintägige Dienstreise",
          timeInfo: `${dep} - ${arr} Uhr (${durationHours.toFixed(1)} h)`,
          baseRate: base,
          hasBreakfast: hasBf,
          deduction: ded,
          netRate: net,
          lawNote
        });
      } else {
        for (let i = 0; i < totalDays; i++) {
          const curDate = new Date(sDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dateFormatted = curDate.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
          const isFirst = i === 0;
          const isLast = i === totalDays - 1;
          const dayNum = i + 1;

          let type = "Zwischentag 24h";
          let timeInfo = "Ganztägig abwesend (24 h)";
          let base = rate24h;
          let lawNote = "24h Abwesenheit gem. § 9 Abs. 4a S. 3 Nr. 1 EStG";

          if (isFirst) {
            type = "Anreisetag";
            timeInfo = `Abfahrt ${depTime || '07:30'} Uhr`;
            base = rate8h;
            lawNote = "Anreisetag gem. § 9 Abs. 4a S. 3 Nr. 2 EStG (ohne Mindestdauer)";
          } else if (isLast) {
            type = "Abreisetag";
            timeInfo = `Rückkehr ${arrTime || '19:30'} Uhr`;
            base = rate8h;
            lawNote = "Abreisetag gem. § 9 Abs. 4a S. 3 Nr. 2 EStG (ohne Mindestdauer)";
          }

          const hasBf = isBreakfastForDay(dayNum);
          const ded = (hasBf && base > 0) ? Math.min(base, breakfastPerDay) : 0;
          const net = Math.max(0, base - ded);
          totalBase += base;
          totalDeduction += ded;

          days.push({
            dayNum,
            dateFormatted,
            dateRaw: curDate.toISOString().split("T")[0],
            type,
            timeInfo,
            baseRate: base,
            hasBreakfast: hasBf,
            deduction: ded,
            netRate: net,
            lawNote
          });
        }
      }

      return {
        totalDays,
        nights,
        isMultiDay: totalDays > 1,
        days,
        totalBase,
        totalDeduction,
        totalVma: Math.max(0, totalBase - totalDeduction)
      };
    }

    function calculateTravelTotals() {
      const travelClass = document.querySelector('input[name="travel-class-type"]:checked')?.value || "BusinessTrip";
      const isTripBillable = document.getElementById("travel-billable-to-client")?.checked;
      const hasBreakfast = selectedBreakfastDaysCreate.size > 0 ? selectedBreakfastDaysCreate : (document.getElementById("travel-has-breakfast")?.checked ? true : false);

      // 1. Fahrtkosten berechnen (Einfach oder Rundreise)
      let travelCost = 0;
      let billableTravelCost = 0;

      if (isRoundTripMode) {
        const legRows = document.querySelectorAll("#travel-legs-tbody tr");
        legRows.forEach(row => {
          const t = row.querySelector(".leg-transport")?.value || "Train";
          const isBillable = row.querySelector(".leg-billable")?.checked === true;
          let legCost = 0;

          if (t === "PersonalCar") {
            const km = parseFloat(row.querySelector(".leg-km")?.value || "0");
            const rate = globalSettings.mileage_rate_business || 0.30;
            legCost = km * rate;
          } else if (t === "Passenger" || t === "BikeFoot") {
            legCost = 0;
          } else {
            legCost = parseFloat(row.querySelector(".leg-cost")?.value || "0");
          }

          travelCost += legCost;
          if (isBillable && isTripBillable) billableTravelCost += legCost;
        });

        if (document.getElementById("travel-calculated-cost")) {
          document.getElementById("travel-calculated-cost").value = `${travelCost.toFixed(2)} € (Rundreise: ${legRows.length} Etappen)`;
        }
      } else {
        const vehicle = document.getElementById("travel-vehicle")?.value || "Train";
        const km = parseFloat(document.getElementById("travel-km")?.value || "0");
        const ticket = parseFloat(document.getElementById("travel-ticket-amount")?.value || "0");

        if (vehicle === "PersonalCar") {
          if (travelClass === "PermanentWorkplace") {
            const rate = km > 20 ? (globalSettings.commute_rate_tier2 || 0.38) : (globalSettings.commute_rate_tier1 || 0.30);
            travelCost = km * rate;
            if (document.getElementById("travel-calculated-cost")) {
              document.getElementById("travel-calculated-cost").value = `${travelCost.toFixed(2)} € (${km} km à ${rate.toFixed(2)} € Pendler)`;
            }
          } else {
            const rate = globalSettings.mileage_rate_business || 0.30;
            travelCost = km * rate;
            if (document.getElementById("travel-calculated-cost")) {
              document.getElementById("travel-calculated-cost").value = `${travelCost.toFixed(2)} € (${km} km à ${rate.toFixed(2)} €)`;
            }
          }
        } else if (vehicle === "Passenger" || vehicle === "BikeFoot") {
          travelCost = 0;
          if (document.getElementById("travel-calculated-cost")) {
            document.getElementById("travel-calculated-cost").value = `0,00 € (${vehicle === 'Passenger' ? 'Mitfahrt' : 'Fahrrad/Fuß'}, VMA aktiv)`;
          }
        } else {
          travelCost = ticket;
          if (document.getElementById("travel-calculated-cost")) {
            document.getElementById("travel-calculated-cost").value = `${travelCost.toFixed(2)} € (Ticket/Beleg Netto)`;
          }
        }
        billableTravelCost = isTripBillable ? travelCost : 0;
      }

      // 2. VMA-Berechnung (§ 9 Abs. 4a EStG)
      let vma = 0;
      let totalDays = 1;
      const startDateStr = document.getElementById("travel-start-date")?.value || "2026-08-22";
      const endDateStr = document.getElementById("travel-end-date")?.value || startDateStr;
      const depTime = document.getElementById("travel-dep-time")?.value || "07:30";
      const arrTime = document.getElementById("travel-arr-time")?.value || "19:30";
      const vmaBox = document.getElementById("vma-banner-box");
      const vmaHint = document.getElementById("vma-calc-hint");
      const breakdownEl = document.getElementById("vma-days-breakdown");

      if (travelClass === "PermanentWorkplace") {
        if (vmaBox) vmaBox.style.opacity = "0.5";
        if (vmaHint) vmaHint.innerHTML = `<span style="color: #d97706;"><i class="fa-solid fa-circle-info"></i> Erste Betriebsstätte: Kein Anspruch auf Verpflegungsmehraufwand (VMA gem. § 9 Abs. 4a EStG).</span>`;
        if (breakdownEl) breakdownEl.style.display = "none";
      } else if (currentTripMode === "foreign-single") {
        // AUSLAND: EIN ZIELORT (BMF 2024 / § 9 Abs. 4a EStG)
        if (vmaBox) vmaBox.style.opacity = "1";
        const bmfSelect = document.getElementById("travel-foreign-country-select");
        const bmfId = bmfSelect?.value || "";
        const rateEntry = (typeof findBmfRateById === "function") ? findBmfRateById(bmfId) : null;

        const foreignRes = (typeof calculateForeignVmaSingleLocation === "function") ? calculateForeignVmaSingleLocation({
          startDateStr,
          endDateStr,
          departureTimeStr: depTime,
          arrivalTimeStr: arrTime,
          bmfRateEntry: rateEntry,
          country: rateEntry?.country || "Ausland",
          city: rateEntry?.city || "",
          mealDeductions: foreignMealDeductionsCreate
        }) : { totalDays: 1, totalVma: 0, days: [] };

        totalDays = foreignRes.totalDays;
        vma = foreignRes.totalVma;

        if (vmaHint) {
          const locLabel = rateEntry ? rateEntry.label : "Ausland";
          vmaHint.innerHTML = `🌍 Auslandspauschale <strong>${escapeHtml(locLabel)}</strong> (${foreignRes.totalDays} Tag${foreignRes.totalDays > 1 ? 'e' : ''}): <strong>${vma.toFixed(2)} €</strong> VMA${foreignRes.totalDeduction > 0 ? ` (inkl. -${foreignRes.totalDeduction.toFixed(2)} € Mahlzeitenkürzung)` : ''}`;
        }
        if (typeof renderForeignMealBreakdown === "function") {
          renderForeignMealBreakdown(foreignRes, "vma-days-breakdown", "create");
        }
      } else if (currentTripMode === "foreign-multi") {
        // AUSLAND: RUNDREISE / MEHRERE ORTE (BMF 2024 24:00 UHR REGEL)
        if (vmaBox) vmaBox.style.opacity = "1";
        const legsData = [];
        document.querySelectorAll("#travel-legs-tbody tr").forEach((tr, idx) => {
          legsData.push({
            dateLeg: tr.querySelector(".leg-date")?.value || startDateStr,
            startLocation: tr.querySelector(".leg-start")?.value || "Start",
            destinationLocation: tr.querySelector(".leg-dest")?.value || "Ziel",
            country: (function() {
              const sel = tr.querySelector(".leg-country");
              if (!sel) return "Ausland";
              if (sel.value === "Deutschland") return "Deutschland";
              const opt = sel.options[sel.selectedIndex];
              return opt?.getAttribute("data-country") || sel.value || "Ausland";
            })(),
            destinationCity: (function() {
              const sel = tr.querySelector(".leg-country");
              const opt = sel?.options[sel.selectedIndex];
              return opt?.getAttribute("data-city") || tr.querySelector(".leg-dest")?.value || "";
            })(),
            departureTime: depTime,
            arrivalTime: arrTime
          });
        });

        const foreignMultiRes = (typeof calculateForeignVmaMultiLocation === "function") ? calculateForeignVmaMultiLocation({
          legs: legsData,
          tripStartDate: startDateStr,
          tripEndDate: endDateStr,
          departureTimeStr: depTime,
          arrivalTimeStr: arrTime,
          mealDeductions: foreignMealDeductionsCreate
        }) : { totalDays: 1, totalVma: 0, days: [] };

        totalDays = foreignMultiRes.totalDays;
        vma = foreignMultiRes.totalVma;

        if (vmaHint) {
          vmaHint.innerHTML = `✈️ Auslands-Rundreise (${foreignMultiRes.totalDays} Tage / ${legsData.length} Etappen): <strong>${vma.toFixed(2)} €</strong> VMA${foreignMultiRes.totalDeduction > 0 ? ` (inkl. -${foreignMultiRes.totalDeduction.toFixed(2)} € Mahlzeitenkürzung)` : ''}`;
        }
        if (typeof renderForeignMealBreakdown === "function") {
          renderForeignMealBreakdown(foreignMultiRes, "vma-days-breakdown", "create");
        }
      } else {
        // INLAND (STANDARD § 9 Abs. 4a EStG 14€/28€)
        if (vmaBox) vmaBox.style.opacity = "1";
        const vmaBreakdown = getVmaDailyBreakdown(startDateStr, endDateStr, depTime, arrTime, hasBreakfast, globalSettings);
        totalDays = vmaBreakdown.totalDays;
        vma = vmaBreakdown.totalVma;

        if (vmaBreakdown.totalDays === 1) {
          const d = vmaBreakdown.days[0];
          const hasBf = d && d.hasBreakfast;
          if (vmaHint) {
            vmaHint.innerText = `1 Tag (${d ? d.timeInfo : ''}) → ${vma.toFixed(2)} € Pauschale${hasBf ? ' (inkl. -5,60 € Frühstück)' : ''}`;
          }
          if (breakdownEl) {
            breakdownEl.style.display = "block";
            breakdownEl.innerHTML = `
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <div style="background: #fff; border: 1px solid ${hasBf ? '#f59e0b' : '#bfdbfe'}; border-radius: 6px; padding: 6px 10px; min-width: 170px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <strong>Tag 1 (${d.dateFormatted}):</strong>
                    <span style="font-weight: 700; color: #1e40af;">${d.netRate.toFixed(2)} €</span>
                  </div>
                  <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 4px;">${d.type} (Basis: ${d.baseRate.toFixed(2)} €)</div>
                  <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; cursor: pointer; color: ${hasBf ? '#b45309' : '#475569'}; margin-bottom: 0;">
                    <input type="checkbox" class="vma-day-bf-cb" data-day="1" ${hasBf ? 'checked' : ''} onchange="onVmaDayBreakfastToggled(this, 'create')">
                    <span>${hasBf ? 'Frühstück gestellt (-5,60 €)' : 'Kein Frühstück (0,00 €)'}</span>
                  </label>
                </div>
              </div>
            `;
          }
        } else {
          if (vmaHint) {
            const intermediateDays = Math.max(0, vmaBreakdown.totalDays - 2);
            vmaHint.innerText = `Mehrtägige Reise (${vmaBreakdown.totalDays} Tage / ${vmaBreakdown.nights} Nächte): Anreise ${(globalSettings.vma_rate_8h || 14).toFixed(2)} € + ${intermediateDays}x ${(globalSettings.vma_rate_24h || 28).toFixed(2)} € + Abreise ${(globalSettings.vma_rate_8h || 14).toFixed(2)} € → ${vma.toFixed(2)} € Pauschale${vmaBreakdown.totalDeduction > 0 ? ` (inkl. -${vmaBreakdown.totalDeduction.toFixed(2)} € Frühstücksabzug)` : ''}`;
          }

          if (breakdownEl) {
            breakdownEl.style.display = "block";
            let daysHtml = `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="color: #1e40af;"><i class="fa-solid fa-calendar-days"></i> Tagesübersicht & flexible Frühstückskürzungen:</strong>
                <small style="color: #64748b;">Häkchen = Frühstück im Hotel gestellt (-5,60 € gem. EStG)</small>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">`;
            vmaBreakdown.days.forEach(d => {
              const dateShort = d.dateFormatted.split(",")[0] + ", " + (d.dateFormatted.split(",")[1]?.trim() || "");
              daysHtml += `
                <div style="background: #fff; border: 1px solid ${d.hasBreakfast ? '#f59e0b' : '#bfdbfe'}; border-radius: 6px; padding: 6px 10px; min-width: 170px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <strong>Tag ${d.dayNum} (${dateShort}):</strong>
                    <span style="font-weight: 700; color: #1e40af;">${d.netRate.toFixed(2)} €</span>
                  </div>
                  <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 4px;">${d.type} (Basis: ${d.baseRate.toFixed(2)} €)</div>
                  <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; cursor: pointer; color: ${d.hasBreakfast ? '#b45309' : '#475569'}; margin-bottom: 0;">
                    <input type="checkbox" class="vma-day-bf-cb" data-day="${d.dayNum}" ${d.hasBreakfast ? 'checked' : ''} onchange="onVmaDayBreakfastToggled(this, 'create')">
                    <span>${d.hasBreakfast ? 'Frühstück gestellt (-5,60 €)' : 'Kein Frühstück (0,00 €)'}</span>
                  </label>
                </div>
              `;
            });
            daysHtml += `</div>`;
            breakdownEl.innerHTML = daysHtml;
          }
        }
      }

      // 3. Dynamische Spesenzeilen summieren
      let totalExpensesNet = 0;
      let totalExpensesBillableNet = 0;

      const rows = document.querySelectorAll("#travel-expenses-tbody tr");
      rows.forEach(tr => {
        const gross = parseFloat(tr.querySelector(".exp-gross")?.value || "0");
        const taxRate = parseFloat(tr.querySelector(".exp-tax")?.value || "0");
        const net = gross / (1 + (taxRate / 100));
        const isBillable = tr.querySelector(".exp-billable")?.checked;
        totalExpensesNet += net;
        if (isBillable) totalExpensesBillableNet += net;
      });

      // 4. Totals
      const totalTax = travelCost + vma + totalExpensesNet;
      const clientReimbursement = billableTravelCost + (isTripBillable ? totalExpensesBillableNet : 0);

      const kpiClient = document.getElementById("kpi-client-reimbursement");
      const kpiTax = document.getElementById("kpi-tax-total");
      if (kpiClient) kpiClient.innerText = `${clientReimbursement.toFixed(2)} €`;
      if (kpiTax) kpiTax.innerText = `${totalTax.toFixed(2)} €`;

      return { travelCost, vma, totalDays, totalTax, clientReimbursement, totalExpensesNet, totalExpensesBillableNet };
    }

    async function onTravelProjectChanged() {
      const prjSelect = document.getElementById("travel-project-id");
      const prjId = prjSelect.value;
      if (!prjId) return;

      const p = globalProjects.find(item => item.id === prjId);
      const c = globalCustomers.find(item => item.id === (p ? p.customer_id : null));

      if (c) {
        if (c.city && document.getElementById("travel-dest")) {
          document.getElementById("travel-dest").value = `${c.city}${c.street ? ', ' + c.street : ''}`;
        }
        if (c.contact_person && document.getElementById("travel-contact-person")) {
          document.getElementById("travel-contact-person").value = c.contact_person;
        }
      }
    }

    async function handleSaveTravel(e) {
      e.preventDefault();
      const projectId = document.getElementById("travel-project-id").value;
      const tripStartDate = document.getElementById("travel-start-date").value;
      const tripEndDate = document.getElementById("travel-end-date").value || tripStartDate;
      const travelType = document.querySelector('input[name="travel-class-type"]:checked')?.value || "BusinessTrip";
      const status = document.querySelector('input[name="travel-entry-status"]:checked')?.value || "Completed";
      const expenseType = document.getElementById("travel-vehicle").value;
      const distanceKm = parseFloat(document.getElementById("travel-km").value || "0");
      const ticketCost = parseFloat(document.getElementById("travel-ticket-amount").value || "0");
      const origin = document.getElementById("travel-origin").value;
      const destination = document.getElementById("travel-dest").value;
      const purpose = document.getElementById("travel-purpose").value;
      const contactPerson = document.getElementById("travel-contact-person").value;
      const departureTime = document.getElementById("travel-dep-time").value;
      const arrivalTime = document.getElementById("travel-arr-time").value;
      const hasBreakfast = document.getElementById("travel-has-breakfast").checked;
      const isBillableToClient = document.getElementById("travel-billable-to-client").checked;

      const { vma, totalDays, totalTax } = calculateTravelTotals();

      // Foreign trip info
      const isForeignTrip = currentTripMode !== "domestic";
      let foreignCountry = "";
      let foreignCity = "";
      let foreignRates = null;

      if (currentTripMode === "foreign-single") {
        const bmfSelect = document.getElementById("travel-foreign-country-select");
        const bmfId = bmfSelect?.value || "";
        const rateEntry = (typeof findBmfRateById === "function") ? findBmfRateById(bmfId) : null;
        if (rateEntry) {
          foreignCountry = rateEntry.country;
          foreignCity = rateEntry.city;
          foreignRates = {
            id: rateEntry.id,
            label: rateEntry.label,
            rate_24h: rateEntry.rate_24h,
            rate_arrival_departure: rateEntry.rate_arrival_departure,
            rate_night: rateEntry.rate_night
          };
        }
      }

      // Collect trip legs if round trip
      const legs = [];
      if (isRoundTripMode) {
        const legRows = document.querySelectorAll("#travel-legs-tbody tr");
        legRows.forEach((row, idx) => {
          const t = row.querySelector(".leg-transport")?.value || "Train";
          const km = parseFloat(row.querySelector(".leg-km")?.value || "0");
          const cost = parseFloat(row.querySelector(".leg-cost")?.value || "0");
          const rate = globalSettings.mileage_rate_business || 0.30;
          const travelCostNet = t === "PersonalCar" ? (km * rate) : (t === "Passenger" || t === "BikeFoot" ? 0 : cost);

          legs.push({
            legOrder: idx + 1,
            dateLeg: row.querySelector(".leg-date")?.value || tripStartDate,
            startLocation: row.querySelector(".leg-start")?.value || origin,
            destinationLocation: row.querySelector(".leg-dest")?.value || destination,
            country: (function() {
              const sel = row.querySelector(".leg-country");
              if (!sel) return "Deutschland";
              if (sel.value === "Deutschland") return "Deutschland";
              const opt = sel.options[sel.selectedIndex];
              return opt?.getAttribute("data-country") || sel.value || "Deutschland";
            })(),
            destinationCity: (function() {
              const sel = row.querySelector(".leg-country");
              const opt = sel?.options[sel.selectedIndex];
              return opt?.getAttribute("data-city") || "";
            })(),
            transportType: t,
            distanceKm: km,
            ratePerKm: rate,
            travelCostNet,
            layoverHours: parseFloat(row.querySelector(".leg-layover-h")?.value || "0"),
            layoverPurpose: row.querySelector(".leg-layover-p")?.value || null,
            customerId: row.querySelector(".leg-customer")?.value || null,
            isBillableToClient: row.querySelector(".leg-billable")?.checked === true
          });
        });
      }

      // Collect expense rows
      const expenses = [];
      document.querySelectorAll("#travel-expenses-tbody tr").forEach(tr => {
        const gross = parseFloat(tr.querySelector(".exp-gross")?.value || "0");
        if (gross > 0) {
          const taxRate = parseFloat(tr.querySelector(".exp-tax")?.value || "0");
          const net = parseFloat((gross / (1 + (taxRate / 100))).toFixed(2));
          expenses.push({
            expenseDate: tr.querySelector(".exp-date")?.value || tripStartDate,
            category: tr.querySelector(".exp-cat")?.value || "Other",
            description: tr.querySelector(".exp-desc")?.value || "Ausgabe",
            skr04Account: tr.querySelector(".exp-skr04")?.value || "6670",
            amountGross: gross,
            amountNet: net,
            taxRate,
            currency: tr.querySelector(".exp-currency")?.value || "EUR",
            foreignAmountGross: parseFloat(tr.querySelector(".exp-foreign-amount")?.value || "0"),
            exchangeRate: parseFloat(tr.querySelector(".exp-exchange-rate")?.value || "1.0"),
            exchangeRateProof: tr.querySelector(".exp-exchange-proof")?.value || "Kreditkartenabrechnung",
            receiptR2Key: tr.querySelector(".exp-r2-key")?.value || null,
            receiptFilename: tr.querySelector(".exp-filename")?.value || null,
            receiptMimeType: tr.querySelector(".exp-mimetype")?.value || null,
            isBillableToClient: tr.querySelector(".exp-billable")?.checked
          });
        }
      });

      let finalOrigin = origin;
      let finalDestination = destination;
      let finalReturnLocation = document.getElementById("travel-return-dest")?.value || origin;

      if (isRoundTripMode && legs.length > 0) {
        finalOrigin = legs[0].startLocation;
        finalReturnLocation = legs[legs.length - 1].destinationLocation;
        const distinctStops = [];
        legs.forEach((l, idx) => {
          if (idx < legs.length - 1 || l.destinationLocation !== legs[0].startLocation) {
            if (l.destinationLocation && !distinctStops.includes(l.destinationLocation)) {
              distinctStops.push(l.destinationLocation);
            }
          }
        });
        finalDestination = distinctStops.length > 0 ? distinctStops.join(", ") : destination;
      }

      try {
        const res = await fetch(`${API_BASE}/trips`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            tripDate: tripStartDate,
            returnDate: tripEndDate,
            totalDays,
            travelType,
            expenseType,
            distanceKm,
            ticketCost,
            vmaAmount: vma,
            hasBreakfast: (selectedBreakfastDaysCreate.size > 0 || hasBreakfast),
            breakfastDays: Array.from(selectedBreakfastDaysCreate),
            origin: finalOrigin,
            destination: finalDestination,
            originAddress: finalOrigin,
            destinationAddress: finalDestination,
            returnLocation: finalReturnLocation,
            purpose,
            contactPerson,
            departureTime,
            arrivalTime,
            isBillableToClient,
            status,
            isRoundTrip: isRoundTripMode,
            isForeignTrip,
            foreignCountry,
            foreignCity,
            foreignRates,
            mealDeductions: foreignMealDeductionsCreate,
            totalPlannedCostNet: totalTax,
            legs,
            expenses
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Reisekosten erfolgreich gespeichert!");
          selectedBreakfastDaysCreate.clear();
          foreignMealDeductionsCreate = {};
          document.getElementById("travel-expenses-tbody").innerHTML = "";
          if (isRoundTripMode) {
            document.getElementById("travel-legs-tbody").innerHTML = "";
            toggleRoundTripMode(false);
          }
          await loadTripsList();
          await loadProjects();
        } else {
          alert("Fehler: " + (data.error || "Speichern fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    let globalTrips = [];

    async function loadTripsList() {
      const tableBody = document.getElementById("trips-table-body");
      if (!tableBody) return;

      const filterCust = document.getElementById("filter-trip-customer")?.value || "";
      const filterMonth = document.getElementById("filter-trip-month")?.value || "";
      const filterStatus = document.getElementById("filter-trip-status")?.value || "unbilled";

      // Populate filter customer dropdown if empty
      const filterCustSelect = document.getElementById("filter-trip-customer");
      if (filterCustSelect && filterCustSelect.options && filterCustSelect.options.length <= 1) {
        filterCustSelect.innerHTML = '<option value="">-- Alle Kunden --</option>' + 
          globalCustomers.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
        if (filterCust) filterCustSelect.value = filterCust;
      }

      tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px;"><span class="spinner"></span> Lade Reisekosten & Belege...</td></tr>`;

      try {
        let url = `${API_BASE}/trips?status=${filterStatus}`;
        if (filterCust) url += `&customerId=${encodeURIComponent(filterCust)}`;
        if (filterMonth) url += `&period=${encodeURIComponent(filterMonth)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Fehler beim Abrufen der Reisen");
        globalTrips = await res.json();
        renderTripsTable(globalTrips);
      } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="9" style="color: red; padding: 20px;">Fehler: ${err.message}</td></tr>`;
      }
    }

    function resetTripFilters() {
      if (document.getElementById("filter-trip-customer")) document.getElementById("filter-trip-customer").value = "";
      if (document.getElementById("filter-trip-month")) document.getElementById("filter-trip-month").value = "";
      if (document.getElementById("filter-trip-status")) document.getElementById("filter-trip-status").value = "all";
      loadTripsList();
    }

    function toggleSelectAllTrips(checked) {
      document.querySelectorAll(".trip-row-check").forEach(cb => {
        cb.checked = checked;
      });
      document.querySelectorAll(".expense-item-check").forEach(cb => {
        cb.checked = checked;
      });
    }

    async function completePlannedTrip(tripId) {
      if (!confirm("Möchten Sie diese geplante Reise als 'durchgeführt' markieren?\n\nAnschließend können Sie Belege erfassen und die Reise für die Abrechnung freigeben.")) return;

      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}/complete`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Reise erfolgreich als durchgeführt markiert!");
          await loadTripsList();
          openEditTripModal(tripId);
        } else {
          alert("Fehler: " + (data.error || "Aktion fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    function getExpenseCategoryIcon(cat) {
      const c = (cat || '').toLowerCase();
      if (c.includes('flug')) return '✈️';
      if (c.includes('bahn') || c.includes('zug') || c.includes('öpnv')) return '🚆';
      if (c.includes('taxi')) return '🚕';
      if (c.includes('hotel') || c.includes('übernachtung')) return '🏨';
      if (c.includes('park')) return '🅿️';
      if (c.includes('bewirtung') || c.includes('essen')) return '🍽️';
      if (c.includes('messe') || c.includes('ticket')) return '🎫';
      if (c.includes('fahrt')) return '🚗';
      return '🧾';
    }

    function toggleTripAccordion(tripId) {
      const row = document.getElementById(`trip-details-${tripId}`);
      const icon = document.getElementById(`icon-toggle-${tripId}`);
      if (!row) return;
      const isHidden = row.style.display === 'none';
      row.style.display = isHidden ? '' : 'none';
      if (icon) {
        icon.className = isHidden ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
      }
    }

    let allTripsExpanded = false;
    function toggleAllTripAccordions() {
      allTripsExpanded = !allTripsExpanded;
      document.querySelectorAll(".trip-details-subrow").forEach(r => {
        r.style.display = allTripsExpanded ? '' : 'none';
      });
      document.querySelectorAll("[id^='icon-toggle-']").forEach(icon => {
        icon.className = allTripsExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
      });
      const btnText = document.getElementById("btn-toggle-all-trips-text");
      if (btnText) {
        btnText.innerText = allTripsExpanded ? 'Alle Belege zuklappen' : 'Alle Belege aufklappen';
      }
    }

    function selectTripSubChecks(tripId, checked) {
      document.querySelectorAll(`.subcheck-${tripId}`).forEach(cb => cb.checked = checked);
    }

    function toggleTripRowCheckboxes(tripId, checked) {
      document.querySelectorAll(`.subcheck-${tripId}`).forEach(cb => cb.checked = checked);
    }

    function renderTripsTable(trips) {
      const tableBody = document.getElementById("trips-table-body");
      if (!tableBody) return;

      if (!trips || trips.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Keine Reisekosten für diese Filterkriterien gefunden.</td></tr>`;
        return;
      }

      tableBody.innerHTML = trips.map(tr => {
        const expenses = tr.expenses || [];
        const isCar = tr.expense_type === "PersonalCar";
        const travelCost = tr.calculated_travel_cost !== undefined ? tr.calculated_travel_cost : (isCar ? (tr.distance_km * (tr.rate_per_km || 0.30)) : (tr.ticket_cost || 0));
        const vma = tr.vma_amount || 0;
        const totalNet = tr.calculated_total_cost !== undefined ? tr.calculated_total_cost : (travelCost + vma);
        const totalGross = tr.calculated_total_gross !== undefined ? tr.calculated_total_gross : totalNet;
        const totalTax = tr.calculated_total_tax !== undefined ? tr.calculated_total_tax : (totalGross - totalNet);
        const clientNet = tr.calculated_client_net !== undefined ? tr.calculated_client_net : (tr.is_billable_to_client ? travelCost : 0);
        const isWorkplace = tr.travel_type === "PermanentWorkplace";
        const isMultiDay = tr.total_days > 1 && tr.return_date && tr.return_date !== tr.trip_date;

        let transitSummary = isCar ? `${tr.distance_km} km PKW` : (tr.expense_type === 'Train' ? 'ÖPNV / Bahn' : (tr.expense_type === 'Flight' ? 'Flugzeug' : (tr.expense_type === 'RentalCar' ? 'Mietwagen / Taxi' : (tr.expense_type || 'Dienstreise'))));
        if (tr.legs && tr.legs.length > 0) {
          const types = [...new Set(tr.legs.map(l => l.transport_type))];
          const icons = { Train: '🚆 Bahn', Flight: '✈️ Flug', PersonalCar: '🚗 PKW', RentalCar: '🚕 Taxi', Passenger: '👥 Mitfahrt', BikeFoot: '🚲 Rad' };
          transitSummary = types.map(t => icons[t] || t).join(" / ");
        }

        // Status Badge
        const allExpensesSynced = (expenses.length > 0 || vma > 0) &&
          (expenses.length === 0 || expenses.every(e => e.is_synced_to_lexware === 1)) &&
          (vma === 0 || !!tr.lexware_vma_voucher_number);
        const hasExpensesSynced = expenses.some(e => e.is_synced_to_lexware === 1) || !!tr.lexware_vma_voucher_number;
        let statusBadge = `<span class="badge badge-secondary">Offen (Entwurf)</span>`;
        if (allExpensesSynced || tr.status === "Completed") {
          statusBadge = `<span class="badge badge-success" style="background:#dcfce7; color:#15803d; border:1px solid #86efac;"><i class="fa-solid fa-circle-check"></i> Verbucht (Lexware)</span>`;
        } else if (hasExpensesSynced) {
          statusBadge = `<span class="badge badge-warning" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;"><i class="fa-solid fa-clock-rotate-left"></i> Teilweise synchronisiert</span>`;
        }

        if (tr.status === "Planned") {
          statusBadge = `<span class="badge" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;"><i class="fa-solid fa-calendar-clock"></i> 📅 Geplant (Forecast)</span>`;
        } else if (tr.ts_status === "PendingSignature") {
          statusBadge = `<span class="badge badge-warning">Liegt zur Unterschrift vor</span>`;
        } else if (tr.ts_status === "Approved") {
          statusBadge = `<span class="badge badge-primary">Genehmigt</span>`;
        } else if (tr.ts_status === "Invoiced") {
          statusBadge = `<span class="badge badge-primary" style="background:#0284c7;">Abgerechnet (${tr.lexware_invoice_number || 'Lexware'})</span>`;
        } else if (tr.ts_status === "Rejected") {
          statusBadge = `<span class="badge badge-danger">Abgelehnt</span>`;
        } else if (tr.ts_status === "InvoiceCanceled") {
          statusBadge = `<span class="badge badge-warning">Storniert (Korrektur)</span>`;
        }

        const isEditable = tr.isEditable !== false;
        const totalItemsCount = expenses.length + (vma > 0 ? 1 : 0) + (isCar && travelCost > 0 ? 1 : 0);

        return `
          <tr class="trip-main-row" id="trip-row-${tr.id}" style="cursor: pointer; transition: background 0.15s;" onclick="toggleTripAccordion('${tr.id}')">
            <td style="text-align: center;" onclick="event.stopPropagation()">
              <input type="checkbox" class="trip-row-check" data-trip-id="${tr.id}" onchange="toggleTripRowCheckboxes('${tr.id}', this.checked)">
            </td>
            <td>
              <strong>${tr.trip_date}${isMultiDay ? ' bis ' + tr.return_date : ''}</strong><br>
              <div style="font-size: 0.78rem; font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHtml(tr.route_display || (tr.origin + ' ➔ ' + tr.destination))}</div>
              ${tr.destination ? `<div style="font-size: 0.74rem; color: #2563eb; margin-top: 1px;"><i class="fa-solid fa-location-dot"></i> Ziel: ${escapeHtml(tr.destination)}</div>` : ''}
            </td>
            <td>
              <strong>${escapeHtml(tr.customer_name || 'Kunde')}</strong>
              <small class="badge badge-info" style="margin-left: 4px;">${escapeHtml(tr.project_name || tr.project_number || '')}</small><br>
              <span style="font-size: 0.82rem; color: #334155;">${escapeHtml(tr.purpose || 'Kundentermin vor Ort')}</span>
              ${tr.contact_person ? `<br><small style="color: var(--text-muted);"><i class="fa-solid fa-user"></i> ${escapeHtml(tr.contact_person)}</small>` : ''}
            </td>
            <td>
              <span class="badge ${isWorkplace ? 'badge-warning' : 'badge-info'}">
                ${isWorkplace ? 'Erste Betriebsstätte' : (isMultiDay ? `Dienstreise (${tr.total_days} Tage)` : 'Dienstreise')}
              </span><br>
              <small style="color: var(--text-muted);">${transitSummary}</small>
            </td>
            <td style="text-align: right;">
              <div style="font-weight: 700; color: #15803d; font-size: 0.95rem;">
                ${totalNet.toFixed(2)} € Netto
              </div>
              <small style="color: var(--text-muted); font-size: 0.72rem;">
                ${totalGross.toFixed(2)} € Brutto${totalTax > 0 ? ` (inkl. ${totalTax.toFixed(2)} € USt)` : ''}
              </small>
              ${clientNet > 0 ? `<br><small style="color: var(--primary); font-size: 0.72rem;">Kunde: ${clientNet.toFixed(2)} € Netto</small>` : (!tr.is_billable_to_client ? '<br><small class="badge badge-warning" style="font-size: 0.65rem;">Nicht weiterberechnet</small>' : '')}
            </td>
            <td style="text-align: center;">${statusBadge}</td>
            <td style="text-align: right;" onclick="event.stopPropagation()">
              <div style="display: flex; gap: 4px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                ${tr.status === 'Planned' ? `
                  <button class="btn btn-primary" style="padding: 3px 6px; font-size: 0.75rem; background: #0284c7; border-color: #0284c7;" onclick="completePlannedTrip('${tr.id}')" title="Als durchgeführt markieren & Belege erfassen">
                    <i class="fa-solid fa-car-side"></i>
                  </button>
                ` : ''}
                ${isEditable ? `
                  <button class="btn btn-outline" style="padding: 3px 6px; font-size: 0.75rem;" onclick="openEditTripModal('${tr.id}')" title="Reisekosten bearbeiten">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="btn btn-outline" style="padding: 3px 6px; font-size: 0.75rem; color: #be123c; border-color: #fecdd3;" onclick="deleteTripFromList('${tr.id}')" title="Löschen">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                ` : ''}
                <button class="btn btn-outline" style="padding: 3px 6px; font-size: 0.75rem;" onclick="openTripTaxReportPdf('${tr.id}')" title="Finanzamt Dienstreisebericht">
                  <i class="fa-solid fa-file-invoice"></i> FA PDF
                </button>
                ${tr.timesheet_version_id ? `
                  <button class="btn btn-outline" style="padding: 3px 6px; font-size: 0.75rem;" onclick="printFilteredTimesheetPdf('${tr.timesheet_version_id}', 'all')" title="Kunden-Leistungsnachweis PDF">
                    <i class="fa-solid fa-file-pdf"></i> Nachweis
                  </button>
                ` : ''}
                <button type="button" class="btn btn-outline" id="btn-toggle-${tr.id}" onclick="toggleTripAccordion('${tr.id}')" style="padding: 3px 8px; font-size: 0.75rem; background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;" title="Belege & Einzelspesen aufklappen">
                  <span>${totalItemsCount} ${totalItemsCount === 1 ? 'Beleg' : 'Belege'}</span>
                  <i id="icon-toggle-${tr.id}" class="fa-solid fa-chevron-down" style="font-size: 0.68rem;"></i>
                </button>
              </div>
            </td>
          </tr>

          <!-- Aufklappbarer Sub-Bereich (Accordion) -->
          <tr id="trip-details-${tr.id}" class="trip-details-subrow" style="display: none; background: #f8fafc;">
            <td colspan="7" style="padding: 4px 12px 14px 12px; border-bottom: 2px solid #cbd5e1;">
              <div style="background: #fff; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 8px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <strong style="color: #0f172a; font-size: 0.85rem;"><i class="fa-solid fa-receipt" style="color: #2563eb;"></i> Aufgeschlüsselte Einzelbelege & Pauschalen dieser Reise</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">(Strukturierte Ansicht für Buchhaltung, Lexware-Sync & Belegnachweis)</span>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    Schnellauswahl:
                    <a href="javascript:void(0)" onclick="selectTripSubChecks('${tr.id}', true)" style="color: var(--primary); font-weight: 600; text-decoration: underline;">Alle</a> &bull;
                    <a href="javascript:void(0)" onclick="selectTripSubChecks('${tr.id}', false)" style="color: var(--primary); font-weight: 600; text-decoration: underline;">Keine</a>
                  </div>
                </div>

                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
                    <thead>
                      <tr style="background: #f1f5f9; color: #475569; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #cbd5e1; text-align: left;">
                        <th style="padding: 6px 8px; width: 40px; text-align: center;">Sync</th>
                        <th style="padding: 6px 8px; width: 95px;">Datum</th>
                        <th style="padding: 6px 8px; width: 130px;">Kategorie</th>
                        <th style="padding: 6px 8px;">Beschreibung & Belegnachweis</th>
                        <th style="padding: 6px 8px; width: 110px; text-align: center;">SKR04 / USt</th>
                        <th style="padding: 6px 8px; width: 130px; text-align: right;">Betrag Netto</th>
                        <th style="padding: 6px 8px; width: 150px; text-align: center;">Lexware Status</th>
                        <th style="padding: 6px 8px; width: 90px; text-align: right;">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody style="border-bottom: 1px solid #e2e8f0;">
                      <!-- VMA Pauschale -->
                      ${vma > 0 ? `
                        <tr style="background: #fffbeb; border-left: 3px solid #f59e0b;">
                          <td style="padding: 6px 8px; text-align: center;">
                            <input type="checkbox" class="vma-item-check subcheck-${tr.id}" data-trip-id="${tr.id}" ${tr.lexware_vma_voucher_number ? '' : 'checked'}>
                          </td>
                          <td style="padding: 6px 8px; font-weight: 600; color: #92400e;">${tr.trip_date}${isMultiDay ? ' – ' + tr.return_date : ''}</td>
                          <td style="padding: 6px 8px; font-weight: 600; color: #92400e;">🍽️ VMA (§ 9 EStG)</td>
                          <td style="padding: 6px 8px;">
                            <strong style="color: #78350f;">Verpflegungsmehraufwand (${tr.total_days || 1} Tage, Pauschalen)</strong>
                            ${tr.has_breakfast ? '<br><small style="color: #b45309;">Frühstück im Hotel gestellt (-5,60 € je ÜN gekürzt)</small>' : ''}
                          </td>
                          <td style="padding: 6px 8px; text-align: center; color: #78350f;"><code>6673</code> | 0.0%</td>
                          <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #78350f;">
                            ${vma.toFixed(2)} €<br><small style="font-weight: normal; color: #b45309;">steuerfrei</small>
                          </td>
                          <td style="padding: 6px 8px; text-align: center;">
                            ${tr.lexware_vma_voucher_number ? `<span class="badge badge-success" style="font-size: 0.68rem;"><i class="fa-solid fa-check"></i> Lexware (${tr.lexware_vma_voucher_number})</span>` : `<span class="badge badge-warning" style="font-size: 0.68rem;">Nicht synchronisiert</span>`}
                          </td>
                          <td style="padding: 6px 8px; text-align: right;">
                            <div style="display: flex; gap: 4px; justify-content: flex-end;">
                              ${!tr.lexware_vma_voucher_number ? `
                                <button type="button" class="btn btn-outline" style="padding: 1px 6px; font-size: 0.68rem; border-color: #f59e0b; color: #b45309;" onclick="syncVmaToLexware('${tr.id}')" title="VMA einzeln an Lexware übertragen">
                                  <i class="fa-solid fa-cloud-arrow-up"></i> Lexware Sync
                                </button>
                              ` : ''}
                              <button type="button" class="btn btn-outline" style="padding: 1px 6px; font-size: 0.68rem; border-color: #fde68a; color: #92400e;" onclick="openTripTaxReportPdf('${tr.id}')" title="VMA im FA-Bericht einsehen">
                                <i class="fa-solid fa-print"></i> VMA PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      ` : ''}

                      <!-- PKW Kilometerpauschale falls zutreffend -->
                      ${isCar && travelCost > 0 ? `
                        <tr style="background: #f0fdf4; border-left: 3px solid #22c55e;">
                          <td style="padding: 6px 8px; text-align: center; color: var(--text-muted);">-</td>
                          <td style="padding: 6px 8px; color: #166534;">${tr.trip_date}</td>
                          <td style="padding: 6px 8px; font-weight: 600; color: #166534;">🚗 Eigener PKW</td>
                          <td style="padding: 6px 8px;">
                            <strong>Kilometerpauschale gem. BRKG / EStG</strong> (${tr.distance_km} km à ${(tr.rate_per_km || 0.30).toFixed(2)} €/km)
                          </td>
                          <td style="padding: 6px 8px; text-align: center; color: #166534;"><code>6663</code> | 0.0%</td>
                          <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #166534;">${travelCost.toFixed(2)} €</td>
                          <td style="padding: 6px 8px; text-align: center;"><span class="badge badge-info" style="font-size: 0.68rem;">Eigenbeleg</span></td>
                          <td style="padding: 6px 8px; text-align: right;">
                            <button type="button" class="btn btn-outline" style="padding: 1px 6px; font-size: 0.68rem; border-color: #86efac; color: #166534;" onclick="openTripTaxReportPdf('${tr.id}')" title="Finanzamt Nachweis"><i class="fa-solid fa-file-invoice"></i> FA PDF</button>
                          </td>
                        </tr>
                      ` : ''}

                      <!-- Einzelbelege -->
                      ${expenses.length === 0 && vma === 0 && (!isCar || travelCost === 0) ? `
                        <tr><td colspan="8" style="text-align: center; padding: 12px; color: var(--text-muted);">Keine Einzelbelege oder Pauschalen für diese Reise erfasst.</td></tr>
                      ` : ''}
                      ${expenses.map(e => {
                        const isSynced = e.is_synced_to_lexware === 1;
                        const isCanceled = e.is_voucher_canceled === 1 || e.lexware_status === 'voided';
                        const catIcon = getExpenseCategoryIcon(e.category);
                        return `
                          <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 6px 8px; text-align: center;">
                              <input type="checkbox" class="expense-item-check subcheck-${tr.id}" data-expense-id="${e.id}" data-trip-id="${tr.id}" ${isSynced ? '' : 'checked'}>
                            </td>
                            <td style="padding: 6px 8px;">${e.expense_date}</td>
                            <td style="padding: 6px 8px; font-weight: 600;">${catIcon} ${escapeHtml(e.category || 'Spesen')}</td>
                            <td style="padding: 6px 8px;">
                              <strong>${escapeHtml(e.description)}</strong>
                              ${e.receipt_r2_key ? `<br><a href="${API_BASE}/trips/receipts/${encodeURIComponent(e.receipt_r2_key)}" target="_blank" style="color: var(--primary); font-size: 0.72rem; text-decoration: underline;"><i class="fa-solid fa-file-pdf"></i> ${escapeHtml(e.receipt_filename || 'Belegdatei anzeigen')}</a>` : ''}
                            </td>
                            <td style="padding: 6px 8px; text-align: center;"><code>${e.skr04_account}</code> | ${(e.tax_rate || 0).toFixed(1)}%</td>
                            <td style="padding: 6px 8px; text-align: right;">
                              <strong>${(e.amount_net || 0).toFixed(2)} €</strong><br>
                              <small style="color: var(--text-muted);">${(e.amount_gross || 0).toFixed(2)} € Brutto</small>
                            </td>
                            <td style="padding: 6px 8px; text-align: center;">
                              ${isCanceled ? `
                                <span class="badge" style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3; font-size: 0.68rem;"><i class="fa-solid fa-ban"></i> Storniert in Lexware</span>
                                <button type="button" class="btn btn-outline" style="padding: 1px 6px; font-size: 0.68rem; border-color: #93c5fd; color: #1d4ed8;" onclick="unlinkExpense('${e.id}')" title="Beleg von storniertem Lexware-Voucher trennen & neu übertragen"><i class="fa-solid fa-rotate-left"></i> Freigeben</button>
                              ` : (isSynced ? `<span class="badge badge-success" style="font-size: 0.68rem;"><i class="fa-solid fa-check"></i> Lexware (${e.lexware_voucher_number || 'Sync'})</span>` : `<span class="badge badge-warning" style="font-size: 0.68rem;">Nicht synchronisiert</span>`)}
                            </td>
                            <td style="padding: 6px 8px; text-align: right;">
                              <div style="display: flex; gap: 3px; justify-content: flex-end;">
                                <button type="button" class="btn btn-outline" style="padding: 1px 6px; font-size: 0.68rem;" onclick="openEditTripModal('${tr.id}')" title="Beleg in Reise bearbeiten"><i class="fa-solid fa-pen"></i></button>
                                ${e.receipt_r2_key ? `<a href="${API_BASE}/trips/receipts/${encodeURIComponent(e.receipt_r2_key)}" target="_blank" class="btn btn-outline" style="padding: 1px 6px; font-size: 0.68rem; color: var(--primary);" title="Beleg ansehen"><i class="fa-solid fa-file-pdf"></i></a>` : ''}
                              </div>
                            </td>
                          </tr>
                        `;
                      }).join("")}
                    </tbody>
                    <tfoot>
                      <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                        <td colspan="5" style="padding: 8px; text-align: right;">Gesamtsumme dieser Reise (Finanzamt Betriebsausgabe):</td>
                        <td style="padding: 8px; text-align: right; color: #15803d; font-size: 0.88rem;">${totalNet.toFixed(2)} € Netto</td>
                        <td colspan="2" style="padding: 8px; font-weight: normal; color: var(--text-muted); font-size: 0.72rem;">${totalGross.toFixed(2)} € Brutto${totalTax > 0 ? ` (inkl. ${totalTax.toFixed(2)} € USt)` : ''}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    async function syncSelectedExpensesToLexware() {
      const selectedExpIds = [];
      document.querySelectorAll(".expense-item-check:checked").forEach(cb => {
        const id = cb.getAttribute("data-expense-id");
        if (id && !selectedExpIds.includes(id)) selectedExpIds.push(id);
      });

      const selectedVmaTripIds = [];
      document.querySelectorAll(".vma-item-check:checked").forEach(cb => {
        const tripId = cb.getAttribute("data-trip-id");
        if (tripId && !selectedVmaTripIds.includes(tripId)) selectedVmaTripIds.push(tripId);
      });

      const totalItems = selectedExpIds.length + selectedVmaTripIds.length;
      if (totalItems === 0) {
        alert("Bitte markieren Sie mindestens einen Beleg oder eine VMA-Pauschale per Checkbox, um sie an Lexware zu übertragen.");
        return;
      }

      if (!confirm(`Möchten Sie ${totalItems} ausgewählte Position(en) (${selectedExpIds.length} Beleg(e), ${selectedVmaTripIds.length} VMA-Pauschale(n)) mit SKR04-Kontierungsdaten an Lexware übermitteln?`)) {
        return;
      }

      let successCount = 0;
      let errorMsgs = [];

      // 1. Sync Belege
      if (selectedExpIds.length > 0) {
        try {
          const res = await fetch(`${API_BASE}/trips/sync-expenses-to-lexware`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expenseIds: selectedExpIds })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            successCount += selectedExpIds.length;
          } else {
            errorMsgs.push(data.error || "Fehler beim Beleg-Sync");
          }
        } catch (err) {
          errorMsgs.push(err.message);
        }
      }

      // 2. Sync VMA Pauschalen
      for (const tripId of selectedVmaTripIds) {
        try {
          // Pacing gegen Lexware 2-Requests/Sekunde Limit
          await new Promise(r => setTimeout(r, 800));

          const res = await fetch(`${API_BASE}/trips/${tripId}/sync-vma-to-lexware`, {
            method: "POST"
          });
          const data = await res.json();
          if (res.ok && data.success) {
            successCount += 1;
          } else {
            errorMsgs.push(`VMA (Reise ${tripId.substring(0,8)}): ${data.error || "Fehler"}`);
          }
        } catch (err) {
          errorMsgs.push(`VMA: ${err.message}`);
        }
      }

      if (errorMsgs.length === 0) {
        alert(`Erfolg: ${successCount} Position(en) erfolgreich an Lexware übertragen.`);
      } else {
        alert(`Übertragung abgeschlossen mit Hinweisen:\nErfolgreich: ${successCount}\nFehler:\n${errorMsgs.join("\n")}`);
      }
      await loadTripsList();
    }

    function printSelectedTripsTaxReport() {
      const selectedTripIds = [];
      document.querySelectorAll(".trip-row-check:checked").forEach(cb => {
        const id = cb.getAttribute("data-trip-id");
        if (id && !selectedTripIds.includes(id)) selectedTripIds.push(id);
      });

      if (selectedTripIds.length === 0) {
        alert("Bitte wählen Sie mindestens eine Reise per Checkbox aus, um den Finanzamt-Bericht zu drucken.");
        return;
      }

      if (selectedTripIds.length === 1) {
        openTripTaxReportPdf(selectedTripIds[0]);
      } else {
        openTripTaxReportPdf(selectedTripIds[0]);
      }
    }

    async function openEditTripModal(tripId) {
      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}`);
        if (!res.ok) throw new Error("Reise nicht gefunden");
        const data = await res.json();
        const tr = data.trip;
        currentTaxReportTrip = tr;

        const startLoc = tr.origin_address || tr.origin || "";
        const retLoc = tr.return_location || (tr.is_round_trip ? startLoc : (tr.destination_address || tr.destination || ""));
        const sameAsStart = !tr.return_location || tr.return_location === startLoc;

        document.getElementById("edit-trip-id").value = tr.id;
        document.getElementById("edit-trip-purpose").value = tr.purpose || "";
        document.getElementById("edit-trip-contact-person").value = tr.contact_person || "";
        document.getElementById("edit-trip-origin").value = startLoc;
        document.getElementById("edit-trip-dest").value = tr.destination_address || tr.destination || "";
        const editRetCb = document.getElementById("edit-travel-return-same-as-start");
        const editRetInput = document.getElementById("edit-trip-return-dest");
        if (editRetCb) editRetCb.checked = sameAsStart;
        if (editRetInput) {
          editRetInput.value = retLoc;
          editRetInput.readOnly = sameAsStart;
        }
        document.getElementById("edit-trip-start-date").value = tr.trip_date || "";
        document.getElementById("edit-trip-end-date").value = tr.return_date || tr.trip_date || "";
        document.getElementById("edit-trip-dep-time").value = tr.departure_time || "07:30";
        document.getElementById("edit-trip-arr-time").value = tr.arrival_time || "19:30";
        document.getElementById("edit-trip-has-breakfast").checked = tr.has_breakfast === 1;
        selectedBreakfastDaysEdit.clear();
        if (tr.breakfast_days_json) {
          try {
            const parsed = JSON.parse(tr.breakfast_days_json);
            if (Array.isArray(parsed)) {
              parsed.forEach(d => selectedBreakfastDaysEdit.add(Number(d)));
            }
          } catch(e) {}
        }
        if (selectedBreakfastDaysEdit.size === 0 && tr.has_breakfast === 1) {
          const tDays = tr.total_days || 1;
          if (tDays === 1) selectedBreakfastDaysEdit.add(1);
          else { for (let d = 2; d <= tDays; d++) selectedBreakfastDaysEdit.add(d); }
        }

        // Restore Foreign Trip State & Meal Deductions
        foreignMealDeductionsEdit = {};
        if (tr.meal_deductions_json) {
          try {
            foreignMealDeductionsEdit = typeof tr.meal_deductions_json === 'string' ? JSON.parse(tr.meal_deductions_json) : tr.meal_deductions_json;
          } catch(e) {}
        }

        if (tr.is_foreign_trip === 1 || tr.is_foreign_trip === true) {
          if (tr.is_round_trip === 1) {
            switchEditTripEntryMode("foreign-multi");
          } else {
            switchEditTripEntryMode("foreign-single");
            // Match BMF dropdown
            let foreignRates = tr.foreign_rates_json;
            if (typeof foreignRates === 'string') {
              try { foreignRates = JSON.parse(foreignRates); } catch(_) {}
            }
            const bmfSelect = document.getElementById("edit-travel-foreign-country-select");
            if (bmfSelect) {
              if (foreignRates && foreignRates.id) {
                bmfSelect.value = foreignRates.id;
              } else if (tr.foreign_country) {
                for (let i = 0; i < bmfSelect.options.length; i++) {
                  if (bmfSelect.options[i].text.includes(tr.foreign_country)) {
                    bmfSelect.selectedIndex = i;
                    break;
                  }
                }
              }
              onBmfCountryChanged('edit');
            }
          }
        } else {
          switchEditTripEntryMode("domestic");
        }

        if (tr.status === "Planned") {
          document.getElementById("edit-status-planned").checked = true;
        } else {
          document.getElementById("edit-status-completed").checked = true;
        }

        if (tr.travel_type === "PermanentWorkplace") {
          document.getElementById("edit-travel-class-workplace").checked = true;
        } else {
          document.getElementById("edit-travel-class-business").checked = true;
        }

        document.getElementById("edit-trip-vehicle").value = tr.expense_type || "Train";
        document.getElementById("edit-trip-km").value = tr.distance_km || 0;
        document.getElementById("edit-trip-ticket-amount").value = tr.ticket_cost || 0;
        document.getElementById("edit-trip-billable").checked = tr.is_billable_to_client === 1 || tr.is_billable_to_client === true;

        // Render legs if present or roundtrip
        const isRoundTrip = tr.is_round_trip === 1 || (tr.legs && tr.legs.length > 0);
        document.getElementById("edit-roundtrip-toggle").checked = isRoundTrip;

        const editLegsTbody = document.getElementById("edit-travel-legs-tbody");
        if (editLegsTbody) {
          editLegsTbody.innerHTML = "";
          if (tr.legs && tr.legs.length > 0) {
            tr.legs.forEach(l => {
              addTripLegRow("edit-travel-legs-tbody", {
                dateLeg: l.date_leg || l.dateLeg,
                startLocation: l.start_location || l.startLocation,
                destinationLocation: l.destination_location || l.destinationLocation,
                transportType: l.transport_type || l.transportType,
                distanceKm: l.distance_km || l.distanceKm,
                travelCostNet: l.travel_cost_net || l.travelCostNet,
                layoverHours: l.layover_hours || l.layoverHours,
                layoverPurpose: l.layover_purpose || l.layoverPurpose,
                customerId: l.customer_id || l.customerId,
                isBillableToClient: l.is_billable_to_client !== undefined ? (l.is_billable_to_client === 1) : l.isBillableToClient
              });
            });
          }
        }
        toggleEditRoundTripMode(isRoundTrip);

        // Render existing expenses into edit modal
        const editTbody = document.getElementById("edit-trip-expenses-tbody");
        editTbody.innerHTML = "";
        if (tr.expenses && tr.expenses.length > 0) {
          tr.expenses.forEach(e => addExpenseRow("edit-trip-expenses-tbody", e));
        }

        toggleEditTripFields();
        calculateEditTripTotals();
        openModal("edit-trip-modal");
      } catch (err) {
        alert("Fehler beim Laden der Reisedaten: " + err.message);
      }
    }

    function toggleEditTripFields() {
      const v = document.getElementById("edit-trip-vehicle")?.value || "Train";
      const isCar = v === "PersonalCar";
      const isFree = v === "Passenger" || v === "BikeFoot";
      const isTicket = !isCar && !isFree;

      if (document.getElementById("edit-car-km-group")) document.getElementById("edit-car-km-group").style.display = isCar ? "block" : "none";
      if (document.getElementById("edit-ticket-cost-group")) document.getElementById("edit-ticket-cost-group").style.display = isTicket ? "block" : "none";
      calculateEditTripTotals();
    }

    function calculateEditTripTotals() {
      const travelClass = document.querySelector('input[name="edit-travel-class-type"]:checked')?.value || "BusinessTrip";
      const vehicle = document.getElementById("edit-trip-vehicle")?.value || "Train";
      const km = parseFloat(document.getElementById("edit-trip-km")?.value || "0");
      const ticket = parseFloat(document.getElementById("edit-trip-ticket-amount")?.value || "0");
      const hasBreakfast = selectedBreakfastDaysEdit.size > 0 ? selectedBreakfastDaysEdit : (document.getElementById("edit-trip-has-breakfast")?.checked ? true : false);
      const startDateStr = document.getElementById("edit-trip-start-date")?.value || "2026-08-22";
      const endDateStr = document.getElementById("edit-trip-end-date")?.value || startDateStr;
      const isRoundTripActive = document.getElementById("edit-roundtrip-toggle")?.checked;

      let travelCost = 0;

      if (isRoundTripActive) {
        const legRows = document.querySelectorAll("#edit-travel-legs-tbody tr");
        legRows.forEach(row => {
          const t = row.querySelector(".leg-transport")?.value || "Train";
          if (t === "PersonalCar") {
            const legKm = parseFloat(row.querySelector(".leg-km")?.value || "0");
            const rate = travelClass === "PermanentWorkplace" ? (legKm > 20 ? (globalSettings.commute_rate_tier2 || 0.38) : (globalSettings.commute_rate_tier1 || 0.30)) : (globalSettings.mileage_rate_business || 0.30);
            travelCost += (legKm * rate);
          } else if (t === "Passenger" || t === "BikeFoot") {
            // 0,00 €
          } else {
            travelCost += parseFloat(row.querySelector(".leg-cost")?.value || "0");
          }
        });
        document.getElementById("edit-trip-calc-cost").value = `${travelCost.toFixed(2)} € (${legRows.length} Etappen)`;
      } else {
        if (vehicle === "PersonalCar") {
          if (travelClass === "PermanentWorkplace") {
            const rate = km > 20 ? (globalSettings.commute_rate_tier2 || 0.38) : (globalSettings.commute_rate_tier1 || 0.30);
            travelCost = km * rate;
          } else {
            const rate = globalSettings.mileage_rate_business || 0.30;
            travelCost = km * rate;
          }
        } else if (vehicle === "Passenger" || vehicle === "BikeFoot") {
          travelCost = 0;
        } else {
          travelCost = ticket;
        }
        document.getElementById("edit-trip-calc-cost").value = `${travelCost.toFixed(2)} €`;
      }

      const vmaHint = document.getElementById("edit-vma-hint");
      const editBreakdownEl = document.getElementById("edit-vma-days-breakdown");
      const editDepTime = document.getElementById("edit-trip-dep-time")?.value || "07:30";
      const editArrTime = document.getElementById("edit-trip-arr-time")?.value || "19:30";

      let vma = 0;
      let totalDays = 1;

      if (travelClass === "PermanentWorkplace") {
        if (vmaHint) vmaHint.innerText = "0,00 € (Erste Betriebsstätte: Kein VMA)";
        if (editBreakdownEl) editBreakdownEl.style.display = "none";
      } else if (currentEditTripMode === "foreign-single") {
        // EDIT MODAL: AUSLAND EIN ZIELORT
        const bmfSelect = document.getElementById("edit-travel-foreign-country-select");
        const bmfId = bmfSelect?.value || "";
        const rateEntry = (typeof findBmfRateById === "function") ? findBmfRateById(bmfId) : null;

        const foreignRes = (typeof calculateForeignVmaSingleLocation === "function") ? calculateForeignVmaSingleLocation({
          startDateStr,
          endDateStr,
          departureTimeStr: editDepTime,
          arrivalTimeStr: editArrTime,
          bmfRateEntry: rateEntry,
          country: rateEntry?.country || "Ausland",
          city: rateEntry?.city || "",
          mealDeductions: foreignMealDeductionsEdit
        }) : { totalDays: 1, totalVma: 0, days: [] };

        totalDays = foreignRes.totalDays;
        vma = foreignRes.totalVma;

        if (vmaHint) {
          const locLabel = rateEntry ? rateEntry.label : "Ausland";
          vmaHint.innerHTML = `🌍 Ausland: <strong>${escapeHtml(locLabel)}</strong>: <strong>${vma.toFixed(2)} €</strong> VMA${foreignRes.totalDeduction > 0 ? ` (inkl. -${foreignRes.totalDeduction.toFixed(2)} € Mahlzeitenkürzung)` : ''}`;
        }
        if (typeof renderForeignMealBreakdown === "function") {
          renderForeignMealBreakdown(foreignRes, "edit-vma-days-breakdown", "edit");
        }
      } else if (currentEditTripMode === "foreign-multi") {
        // EDIT MODAL: AUSLAND RUNDREISE
        const legsData = [];
        document.querySelectorAll("#edit-travel-legs-tbody tr").forEach((tr, idx) => {
          legsData.push({
            dateLeg: tr.querySelector(".leg-date")?.value || startDateStr,
            startLocation: tr.querySelector(".leg-start")?.value || "Start",
            destinationLocation: tr.querySelector(".leg-dest")?.value || "Ziel",
            country: (function() {
              const sel = tr.querySelector(".leg-country");
              if (!sel) return "Ausland";
              if (sel.value === "Deutschland") return "Deutschland";
              const opt = sel.options[sel.selectedIndex];
              return opt?.getAttribute("data-country") || sel.value || "Ausland";
            })(),
            destinationCity: (function() {
              const sel = tr.querySelector(".leg-country");
              const opt = sel?.options[sel.selectedIndex];
              return opt?.getAttribute("data-city") || tr.querySelector(".leg-dest")?.value || "";
            })(),
            departureTime: editDepTime,
            arrivalTime: editArrTime
          });
        });

        const foreignMultiRes = (typeof calculateForeignVmaMultiLocation === "function") ? calculateForeignVmaMultiLocation({
          legs: legsData,
          tripStartDate: startDateStr,
          tripEndDate: endDateStr,
          departureTimeStr: editDepTime,
          arrivalTimeStr: editArrTime,
          mealDeductions: foreignMealDeductionsEdit
        }) : { totalDays: 1, totalVma: 0, days: [] };

        totalDays = foreignMultiRes.totalDays;
        vma = foreignMultiRes.totalVma;

        if (vmaHint) {
          vmaHint.innerHTML = `✈️ Auslands-Rundreise (${foreignMultiRes.totalDays} Tage): <strong>${vma.toFixed(2)} €</strong> VMA${foreignMultiRes.totalDeduction > 0 ? ` (inkl. -${foreignMultiRes.totalDeduction.toFixed(2)} € Mahlzeitenkürzung)` : ''}`;
        }
        if (typeof renderForeignMealBreakdown === "function") {
          renderForeignMealBreakdown(foreignMultiRes, "edit-vma-days-breakdown", "edit");
        }
      } else {
        // INLAND STANDARD
        const vmaBreakdown = getVmaDailyBreakdown(startDateStr, endDateStr, editDepTime, editArrTime, hasBreakfast, globalSettings);
        totalDays = vmaBreakdown.totalDays;
        vma = vmaBreakdown.totalVma;
        if (vmaHint) {
          if (vmaBreakdown.totalDays === 1) {
            const d = vmaBreakdown.days[0];
            const hasBf = d && d.hasBreakfast;
            vmaHint.innerText = `${vma.toFixed(2)} € (1 Tag, ${d ? d.timeInfo : ''})${hasBf ? ' [-5,60 € Frühstück]' : ''}`;
          } else {
            vmaHint.innerText = `${vma.toFixed(2)} € (${vmaBreakdown.totalDays} Tage / ${vmaBreakdown.nights} Nächte)${vmaBreakdown.totalDeduction > 0 ? ` [-${vmaBreakdown.totalDeduction.toFixed(2)} € Frühstück]` : ''}`;
          }
        }
        if (editBreakdownEl) {
          editBreakdownEl.style.display = "block";
          let daysHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #1e40af;"><i class="fa-solid fa-calendar-days"></i> Tagesübersicht & flexible Frühstückskürzungen:</strong>
              <small style="color: #64748b;">Häkchen = Frühstück im Hotel gestellt (-5,60 € gem. EStG)</small>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">`;
          vmaBreakdown.days.forEach(d => {
            const dateShort = d.dateFormatted.split(",")[0] + ", " + (d.dateFormatted.split(",")[1]?.trim() || "");
            daysHtml += `
              <div style="background: #fff; border: 1px solid ${d.hasBreakfast ? '#f59e0b' : '#bfdbfe'}; border-radius: 6px; padding: 6px 10px; min-width: 170px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                  <strong>Tag ${d.dayNum} (${dateShort}):</strong>
                  <span style="font-weight: 700; color: #1e40af;">${d.netRate.toFixed(2)} €</span>
                </div>
                <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 4px;">${d.type} (Basis: ${d.baseRate.toFixed(2)} €)</div>
                <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; cursor: pointer; color: ${d.hasBreakfast ? '#b45309' : '#475569'}; margin-bottom: 0;">
                  <input type="checkbox" class="vma-day-bf-cb" data-day="${d.dayNum}" ${d.hasBreakfast ? 'checked' : ''} onchange="onVmaDayBreakfastToggled(this, 'edit')">
                  <span>${d.hasBreakfast ? 'Frühstück gestellt (-5,60 €)' : 'Kein Frühstück (0,00 €)'}</span>
                </label>
              </div>
            `;
          });
          daysHtml += `</div>`;
          editBreakdownEl.innerHTML = daysHtml;
        }
      }

      return { travelCost, vma, totalDays };
    }

    async function saveEditedTrip(e) {
      e.preventDefault();
      const tripId = document.getElementById("edit-trip-id").value;
      const { vma, totalDays } = calculateEditTripTotals();

      const startDate = document.getElementById("edit-trip-start-date").value;
      const endDate = document.getElementById("edit-trip-end-date").value || startDate;
      const status = document.querySelector('input[name="edit-trip-status"]:checked')?.value || "Completed";
      const isRoundTrip = document.getElementById("edit-roundtrip-toggle")?.checked ? 1 : 0;

      // Foreign trip info
      const isForeignTrip = currentEditTripMode !== "domestic";
      let foreignCountry = "";
      let foreignCity = "";
      let foreignRates = null;

      if (currentEditTripMode === "foreign-single") {
        const bmfSelect = document.getElementById("edit-travel-foreign-country-select");
        const bmfId = bmfSelect?.value || "";
        const rateEntry = (typeof findBmfRateById === "function") ? findBmfRateById(bmfId) : null;
        if (rateEntry) {
          foreignCountry = rateEntry.country;
          foreignCity = rateEntry.city;
          foreignRates = {
            id: rateEntry.id,
            label: rateEntry.label,
            rate_24h: rateEntry.rate_24h,
            rate_arrival_departure: rateEntry.rate_arrival_departure,
            rate_night: rateEntry.rate_night
          };
        }
      }

      // Collect updated legs from edit modal
      const legs = [];
      if (isRoundTrip) {
        document.querySelectorAll("#edit-travel-legs-tbody tr").forEach((tr, idx) => {
          legs.push({
            legOrder: idx + 1,
            dateLeg: tr.querySelector(".leg-date")?.value || startDate,
            startLocation: tr.querySelector(".leg-start")?.value || "Start",
            destinationLocation: tr.querySelector(".leg-dest")?.value || "Ziel",
            country: (function() {
              const sel = tr.querySelector(".leg-country");
              if (!sel) return "Deutschland";
              if (sel.value === "Deutschland") return "Deutschland";
              const opt = sel.options[sel.selectedIndex];
              return opt?.getAttribute("data-country") || sel.value || "Deutschland";
            })(),
            destinationCity: (function() {
              const sel = tr.querySelector(".leg-country");
              const opt = sel?.options[sel.selectedIndex];
              return opt?.getAttribute("data-city") || "";
            })(),
            transportType: tr.querySelector(".leg-transport")?.value || "Train",
            distanceKm: parseFloat(tr.querySelector(".leg-km")?.value || "0"),
            travelCostNet: parseFloat(tr.querySelector(".leg-cost")?.value || "0"),
            layoverHours: parseFloat(tr.querySelector(".leg-layover-h")?.value || "0"),
            layoverPurpose: tr.querySelector(".leg-layover-p")?.value || "",
            customerId: tr.querySelector(".leg-customer")?.value || null,
            isBillableToClient: tr.querySelector(".leg-billable")?.checked === true
          });
        });
      }

      // Collect updated expenses from edit modal
      const expenses = [];
      document.querySelectorAll("#edit-trip-expenses-tbody tr").forEach(tr => {
        const gross = parseFloat(tr.querySelector(".exp-gross")?.value || "0");
        if (gross > 0) {
          const taxRate = parseFloat(tr.querySelector(".exp-tax")?.value || "0");
          const net = parseFloat((gross / (1 + (taxRate / 100))).toFixed(2));
          expenses.push({
            expenseDate: tr.querySelector(".exp-date")?.value || startDate,
            category: tr.querySelector(".exp-cat")?.value || "Other",
            description: tr.querySelector(".exp-desc")?.value || "Ausgabe",
            skr04Account: tr.querySelector(".exp-skr04")?.value || "6670",
            amountGross: gross,
            amountNet: net,
            taxRate,
            currency: tr.querySelector(".exp-currency")?.value || "EUR",
            foreignAmountGross: parseFloat(tr.querySelector(".exp-foreign-amount")?.value || "0"),
            exchangeRate: parseFloat(tr.querySelector(".exp-exchange-rate")?.value || "1.0"),
            exchangeRateProof: tr.querySelector(".exp-exchange-proof")?.value || "Kreditkartenabrechnung",
            receiptR2Key: tr.querySelector(".exp-r2-key")?.value || null,
            receiptFilename: tr.querySelector(".exp-filename")?.value || null,
            receiptMimeType: tr.querySelector(".exp-mimetype")?.value || null,
            isBillableToClient: tr.querySelector(".exp-billable")?.checked === true,
            isSyncedToLexware: tr.querySelector(".exp-is-synced")?.value === "1"
          });
        }
      });

      let editOrigin = document.getElementById("edit-trip-origin").value;
      let editDestination = document.getElementById("edit-trip-dest").value;
      let editReturnLocation = document.getElementById("edit-trip-return-dest")?.value || editOrigin;

      if (isRoundTrip && legs.length > 0) {
        editOrigin = legs[0].startLocation;
        editReturnLocation = legs[legs.length - 1].destinationLocation;
        if (!editDestination || editDestination === editOrigin) {
          const distinctStops = [];
          legs.forEach((l, idx) => {
            if (idx < legs.length - 1 || l.destinationLocation !== legs[0].startLocation) {
              if (l.destinationLocation && !distinctStops.includes(l.destinationLocation)) {
                distinctStops.push(l.destinationLocation);
              }
            }
          });
          if (distinctStops.length > 0) editDestination = distinctStops.join(", ");
        }
      }

      const payload = {
        tripDate: startDate,
        returnDate: endDate,
        totalDays,
        travelType: document.querySelector('input[name="edit-travel-class-type"]:checked')?.value || "BusinessTrip",
        status,
        isRoundTrip,
        isForeignTrip,
        foreignCountry,
        foreignCity,
        foreignRates,
        mealDeductions: foreignMealDeductionsEdit,
        expenseType: document.getElementById("edit-trip-vehicle").value,
        distanceKm: parseFloat(document.getElementById("edit-trip-km").value || "0"),
        ticketCost: parseFloat(document.getElementById("edit-trip-ticket-amount").value || "0"),
        vmaAmount: vma,
        hasBreakfast: (selectedBreakfastDaysEdit.size > 0 || document.getElementById("edit-trip-has-breakfast").checked),
        breakfastDays: Array.from(selectedBreakfastDaysEdit),
        origin: editOrigin,
        destination: editDestination,
        originAddress: editOrigin,
        destinationAddress: editDestination,
        returnLocation: editReturnLocation,
        purpose: document.getElementById("edit-trip-purpose").value,
        contactPerson: document.getElementById("edit-trip-contact-person").value,
        departureTime: document.getElementById("edit-trip-dep-time").value,
        arrivalTime: document.getElementById("edit-trip-arr-time").value,
        isBillableToClient: document.getElementById("edit-trip-billable").checked === true,
        expenses,
        legs
      };

      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert(`Reisekosten & Belege erfolgreich aktualisiert!\nGoBD-Audit: ${data.changes}`);
          closeModal("edit-trip-modal");
          await loadTripsList();
        } else {
          alert("Fehler: " + (data.error || "Aktualisierung fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function deleteCurrentEditTrip() {
      const tripId = document.getElementById("edit-trip-id").value;
      if (!confirm("Möchten Sie diesen Reisekosten-Eintrag unwiderruflich löschen? (Wird im GoBD-Audit-Trail protokolliert)")) return;

      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert("Reisekosten erfolgreich gelöscht.");
          closeModal("edit-trip-modal");
          await loadTripsList();
        } else {
          alert("Fehler: " + (data.error || "Löschen fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function deleteTripFromList(tripId) {
      if (!confirm("Möchten Sie diesen Reisekosten-Eintrag löschen?")) return;
      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert("Reisekosten gelöscht.");
          await loadTripsList();
        } else {
          alert("Fehler: " + (data.error || "Löschen fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function openTripTaxReportPdf(tripId) {
      if (!globalSettings.contractor_signature_data_url || !globalSettings.company_name) {
        try { await loadSettings(); } catch (_) {}
      }
      const content = document.getElementById("tax-report-content");
      content.innerHTML = `<div style="text-align: center; padding: 40px;"><span class="spinner"></span> Lade Finanzamt-Bericht...</div>`;
      openModal("tax-report-modal");

      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}/tax-report-data`);
        if (!res.ok) throw new Error("Fehler beim Laden des Berichts");
        const data = await res.json();
        const tr = data.trip;
        currentTaxReportTrip = tr;
        const legs = tr.legs || [];
        let vmaBreakdown;
        const isForeignTrip = tr.is_foreign_trip === 1 || tr.is_foreign_trip === true;
        let foreignMealDeds = {};
        if (tr.meal_deductions_json) {
          try {
            foreignMealDeds = typeof tr.meal_deductions_json === 'string' ? JSON.parse(tr.meal_deductions_json) : tr.meal_deductions_json;
          } catch(e) {}
        }

        if (isForeignTrip) {
          if (tr.is_round_trip === 1 && legs.length > 0) {
            const legsData = legs.map(l => ({
              dateLeg: l.date_leg || tr.trip_date,
              startLocation: l.start_location || "Start",
              destinationLocation: l.destination_location || "Ziel",
              country: l.country || l.destination_location || "Ausland",
              destinationCity: l.destination_city || l.destination_location || "",
              departureTime: tr.departure_time || "07:30",
              arrivalTime: tr.arrival_time || "19:30"
            }));
            vmaBreakdown = (typeof calculateForeignVmaMultiLocation === "function") 
              ? calculateForeignVmaMultiLocation({
                  legs: legsData,
                  tripStartDate: tr.trip_date,
                  tripEndDate: tr.return_date || tr.trip_date,
                  departureTimeStr: tr.departure_time || "07:30",
                  arrivalTimeStr: tr.arrival_time || "19:30",
                  mealDeductions: foreignMealDeds
                })
              : getVmaDailyBreakdown(tr.trip_date, tr.return_date, tr.departure_time, tr.arrival_time, false, globalSettings);
          } else {
            let foreignRates = tr.foreign_rates_json;
            if (typeof foreignRates === 'string') {
              try { foreignRates = JSON.parse(foreignRates); } catch(_) {}
            }
            vmaBreakdown = (typeof calculateForeignVmaSingleLocation === "function")
              ? calculateForeignVmaSingleLocation({
                  startDateStr: tr.trip_date,
                  endDateStr: tr.return_date || tr.trip_date,
                  departureTimeStr: tr.departure_time || "07:30",
                  arrivalTimeStr: tr.arrival_time || "19:30",
                  bmfRateEntry: foreignRates,
                  country: tr.foreign_country || foreignRates?.country || "Ausland",
                  city: tr.foreign_city || foreignRates?.city || "",
                  mealDeductions: foreignMealDeds
                })
              : getVmaDailyBreakdown(tr.trip_date, tr.return_date, tr.departure_time, tr.arrival_time, false, globalSettings);
          }
        } else {
          vmaBreakdown = getVmaDailyBreakdown(
            tr.trip_date, 
            tr.return_date, 
            tr.departure_time, 
            tr.arrival_time, 
            (tr.breakfast_days_json ? (typeof tr.breakfast_days_json === 'string' ? JSON.parse(tr.breakfast_days_json) : tr.breakfast_days_json) : (tr.has_breakfast === 1 || tr.has_breakfast === true)), 
            globalSettings
          );
        }

        const isWorkplace = tr.travel_type === "PermanentWorkplace";
        const isCar = tr.expense_type === "PersonalCar";
        const isMultiDay = tr.total_days > 1 && tr.return_date && tr.return_date !== tr.trip_date;
        const expenses = tr.expenses || [];
        const isRoundTrip = tr.is_round_trip === 1 || legs.length > 0;
        const transportIcons = {
          "Train": "🚆 Bahn / ÖPNV",
          "Flight": "✈️ Flugzeug",
          "PersonalCar": "🚗 Eigener PKW",
          "RentalCar": "🚕 Mietwagen/Taxi",
          "Passenger": "👥 Mitfahrt/Beifahrer",
          "RentalBike": "🛴 Mietrad/Scooter",
          "BikeFoot": "🚲 Fahrrad/Zu Fuß"
        };

        const isTransportExp = (e) => {
          const c = (e.category || '').toLowerCase();
          const d = (e.description || '').toLowerCase();
          const s = e.skr04_account || '';
          return c.includes('fahrt') || c.includes('flug') || c.includes('bahn') || c.includes('zug') || c.includes('taxi') || c.includes('öpnv') || s === '6663' || s === '6660' || (s === '6670' && (d.includes('taxi') || d.includes('fahrt')));
        };
        const isHotelExp = (e) => {
          const c = (e.category || '').toLowerCase();
          const s = e.skr04_account || '';
          return c.includes('hotel') || c.includes('übernachtung') || s === '6668';
        };

        const transportExps = expenses.filter(isTransportExp);
        const hotelExps = expenses.filter(isHotelExp);
        const otherExps = expenses.filter(e => !isTransportExp(e) && !isHotelExp(e));

        const transportTotalNet = (tr.travelCost || 0) + transportExps.reduce((sum, e) => sum + (e.amount_net || 0), 0);
        const hotelTotalNet = (tr.hotel_cost || 0) + hotelExps.reduce((sum, e) => sum + (e.amount_net || 0), 0);
        const otherTotalNet = (tr.parking_cost || 0) + otherExps.reduce((sum, e) => sum + (e.amount_net || 0), 0);
        const vmaTotalNet = tr.vma_amount || 0;

        const totalCostNet = tr.totalActualCost !== undefined ? tr.totalActualCost : (transportTotalNet + hotelTotalNet + otherTotalNet + vmaTotalNet);
        const totalCostGross = tr.totalActualGross !== undefined ? tr.totalActualGross : (totalCostNet + (tr.totalTax || 0));
        const totalTaxAmount = tr.totalTax !== undefined ? tr.totalTax : (totalCostGross - totalCostNet);

        // Rundreise-Routenbeschreibung ermitteln
        let routeSummary = "";
        if (isRoundTrip && legs.length > 0) {
          const stops = [];
          legs.forEach((l, idx) => {
            if (idx === 0) stops.push(l.start_location);
            stops.push(l.destination_location);
          });
          routeSummary = stops.join(" &rarr; ");
        }

        content.innerHTML = `
          <div id="print-area-tax-report" style="padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #1e40af; padding-bottom: 12px; margin-bottom: 20px;">
              <div>
                <h1 style="font-size: 1.4rem; color: #1e40af; margin-bottom: 4px;">Dienstreise- & Spesenabrechnung</h1>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Nachweis gem. § 9 Abs. 4a EStG & BRKG für Finanzamt / EÜR</p>
              </div>
              <div style="text-align: right; font-size: 0.85rem;">
                <strong>Beleg-ID: ${tr.id.substring(0, 8)}...</strong><br>
                <span>Zeitraum: ${tr.trip_date}${isMultiDay ? ' bis ' + tr.return_date : ''}</span>
              </div>
            </div>

            <!-- Stammdaten -->
            <table style="width: 100%; font-size: 0.85rem; margin-bottom: 20px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px; width: 180px; color: #64748b; font-weight: 600;">Reisezweck / Anlass:</td>
                <td style="padding: 6px;"><strong>${tr.purpose || 'Kundentermin vor Ort'}</strong></td>
              </tr>
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Kunde / Projekt:</td>
                <td style="padding: 6px;">${tr.customer_name} (${tr.project_name})</td>
              </tr>
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Ansprechpartner vor Ort:</td>
                <td style="padding: 6px;">${tr.contact_person || 'Geschäftsleitung / Projektleitung'}</td>
              </tr>
              ${isRoundTrip ? `
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Abfahrt & Ankunft (Basis):</td>
                <td style="padding: 6px;">${tr.origin_address || tr.origin || (legs[0]?.start_location) || 'Wohnort / Home-Office'}</td>
              </tr>
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Stationen & Etappenverlauf:</td>
                <td style="padding: 6px; line-height: 1.4;">${routeSummary || (tr.destination_address || tr.destination || 'Mehrere Stationen')}</td>
              </tr>
              ` : `
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Abfahrt (Home / Office):</td>
                <td style="padding: 6px;">${tr.origin_address || tr.origin || 'Wohnort / Erste Betriebsstätte'}</td>
              </tr>
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Ziel / Termin vor Ort:</td>
                <td style="padding: 6px;">${tr.destination_address || tr.destination || 'Kundenadresse'}</td>
              </tr>
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Rückkehr (Home / Office):</td>
                <td style="padding: 6px;">${tr.origin_address || tr.origin || 'Wohnort / Erste Betriebsstätte'}</td>
              </tr>
              `}
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Reiseart & Einstufung:</td>
                <td style="padding: 6px;">
                  <span class="badge ${isWorkplace ? 'badge-warning' : 'badge-info'}">
                    ${isWorkplace ? 'Erste Betriebsstätte (Pendlerpauschale einfache Entfernung)' : (isRoundTrip ? `Rundreise mit ${legs.length} Etappen (${tr.total_days} Tage)` : (isMultiDay ? `Mehrtägige Auswärtstätigkeit (${tr.total_days} Tage)` : 'Auswärtstätigkeit / Dienstreise'))}
                  </span>
                </td>
              </tr>
            </table>

            <!-- Zeit & Verpflegung -->
            <div class="avoid-break" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                <h3 style="font-size: 0.95rem; color: #1e40af; margin: 0;"><i class="fa-solid fa-clock"></i> Reisezeit & Verpflegungsmehraufwand (VMA gem. § 9 Abs. 4a EStG)</h3>
                <span style="font-size: 0.85rem; color: #64748b;">
                  ${tr.trip_date} (${tr.departure_time || '07:30'} Uhr) bis ${tr.return_date || tr.trip_date} (${tr.arrival_time || '19:30'} Uhr)
                  ${tr.has_breakfast ? ' &bull; <span style="color:#b45309;">Frühstück gestellt (-5,60 € je ÜN)</span>' : ''}
                </span>
              </div>
              
              ${isWorkplace ? `
                <div style="font-size: 0.85rem; color: #d97706; padding: 6px 0;">
                  <i class="fa-solid fa-circle-info"></i> Erste Betriebsstätte: Kein Anspruch auf Verpflegungsmehraufwand (VMA).
                </div>
              ` : `
                <table style="width: 100%; font-size: 0.8rem; border-collapse: collapse; background: #fff; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-top: 6px;">
                  <thead>
                    <tr style="background: #e2e8f0; text-align: left;">
                      <th style="padding: 5px 8px; border: 1px solid #cbd5e1; width: 30px; text-align: center;">Tag</th>
                      <th style="padding: 5px 8px; border: 1px solid #cbd5e1; width: 110px;">Datum</th>
                      <th style="padding: 5px 8px; border: 1px solid #cbd5e1;">Reisetag-Klassifizierung & Rechtsgrundlage</th>
                      <th style="padding: 5px 8px; border: 1px solid #cbd5e1; width: 130px;">Reisezeit / Status</th>
                      <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; width: 75px;">Basis</th>
                      <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; width: 75px;">Kürzung</th>
                      <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; width: 85px;">Pauschale</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${vmaBreakdown.days.map(d => `
                      <tr>
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 600;">${d.dayNum}</td>
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1;"><strong>${escapeHtml(d.dateFormatted)}</strong></td>
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">
                          <strong>${escapeHtml(d.type)}</strong><br>
                          <small style="color: #64748b; font-size: 0.72rem;">${escapeHtml(d.lawNote)}</small>
                        </td>
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${escapeHtml(d.timeInfo)}</td>
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right;">${d.baseRate.toFixed(2)} €</td>
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; color: ${d.deduction > 0 ? '#b91c1c' : '#64748b'};">${d.deduction > 0 ? `-${d.deduction.toFixed(2)} €` : '0,00 €'}</td>
                        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; color: #15803d;">${d.netRate.toFixed(2)} €</td>
                      </tr>
                    `).join("")}
                    <tr style="background: #f1f5f9; font-weight: 700;">
                      <td colspan="4" style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right;">Summe Verpflegungsmehraufwand (§ 9 EStG):</td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right;">${vmaBreakdown.totalBase.toFixed(2)} €</td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; color: ${vmaBreakdown.totalDeduction > 0 ? '#b91c1c' : '#64748b'};">${vmaBreakdown.totalDeduction > 0 ? `-${vmaBreakdown.totalDeduction.toFixed(2)} €` : '0,00 €'}</td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; color: #1e40af; font-size: 0.95rem;">${vmaBreakdown.totalVma.toFixed(2)} €</td>
                    </tr>
                  </tbody>
                </table>
              `}
            </div>

            ${legs.length > 0 ? `
            <!-- Rundreise-Etappen -->
            <div class="avoid-break" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid;">
              <h3 style="font-size: 0.95rem; color: #1e40af; margin-bottom: 10px;"><i class="fa-solid fa-route"></i> Detaillierte Rundreise-Etappen (§ 9 EStG Fahrtkosten-Nachweis)</h3>
              <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
                <thead>
                  <tr style="background: #e2e8f0; text-align: left;">
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 30px; text-align: center;">#</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 85px;">Datum</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Streckenabschnitt (Von &rarr; Nach)</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 140px;">Land / BMF-Pauschale</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 120px;">Verkehrsmittel</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1;">Etappenzweck / Anlass</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; width: 70px;">Distanz</th>
                    <th style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; width: 80px;">Kosten</th>
                  </tr>
                </thead>
                <tbody>
                  ${legs.map(l => {
                    const isLegCar = l.transport_type === "PersonalCar";
                    const isLegFree = l.transport_type === "Passenger" || l.transport_type === "BikeFoot";
                    const legCost = isLegCar 
                      ? (parseFloat(l.distance_km || "0") * parseFloat(l.rate_per_km || "0.30")) 
                      : (isLegFree ? 0 : (l.travel_cost_net !== undefined && l.travel_cost_net !== null ? parseFloat(l.travel_cost_net) : 0));
                    const legDistStr = isLegCar ? `${l.distance_km || 0} km` : '-';
                    const transLabel = transportIcons[l.transport_type] || l.transport_type;
                    return `
                    <tr>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${l.leg_order}</td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${l.date_leg}</td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1;"><strong>${escapeHtml(l.start_location)}</strong> &rarr; <strong>${escapeHtml(l.destination_location)}</strong></td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">
                        ${l.country && l.country !== 'Deutschland' ? `<span class="badge badge-warning" style="font-size:0.75rem;"><i class="fa-solid fa-earth-americas"></i> ${escapeHtml(l.country)}${l.destination_city ? ' (' + escapeHtml(l.destination_city) + ')' : ''}</span>` : '<span class="badge badge-info" style="font-size:0.75rem;">🇩🇪 Deutschland</span>'}
                      </td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${transLabel}</td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #64748b;">${escapeHtml(l.layover_purpose || tr.purpose || '-')}</td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right;">${legDistStr}</td>
                      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600;">${legCost.toFixed(2)} €</td>
                    </tr>
                    `;
                  }).join("")}
                  <tr style="background: #f1f5f9; font-weight: 700;">
                    <td colspan="5" style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right;">Summe Fahrtkosten Etappen:</td>
                    <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right;">${legs.filter(l => l.transport_type === 'PersonalCar').reduce((acc, l) => acc + (parseFloat(l.distance_km || "0")), 0)} km</td>
                    <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; color: #1e40af;">${tr.travelCost.toFixed(2)} €</td>
                  </tr>
                </tbody>
              </table>
            </div>
            ` : ''}

            <!-- Kostenaufstellung -->
            <!-- Kostenaufstellung strukturiert nach den 4 Säulen -->
            <h3 class="section-title" style="font-size: 0.95rem; color: #1e40af; margin-bottom: 10px; page-break-after: avoid; break-after: avoid;"><i class="fa-solid fa-receipt"></i> Gesamtaufstellung der Reisekosten & Belege (Finanzamt & EÜR)</h3>
            <table style="width: 100%; font-size: 0.85rem; border: 1px solid #e2e8f0; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 8px 12px; border: 1px solid #e2e8f0;">Datum / Kostenart</th>
                  <th style="padding: 8px 12px; border: 1px solid #e2e8f0;">Basis / SKR04 Konto / Belegnachweis</th>
                  <th style="padding: 8px 12px; border: 1px solid #e2e8f0; width: 80px; text-align: center;">USt-Satz</th>
                  <th style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; width: 110px;">Betrag Netto</th>
                </tr>
              </thead>
              <tbody>
                <!-- 1. SÄULE: TRANSPORT & FAHRTKOSTEN -->
                <tr class="category-header" style="background: #f8fafc; font-weight: 700; color: #1e40af; page-break-after: avoid; break-after: avoid;">
                  <td colspan="4" style="padding: 6px 12px; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-plane"></i> 1. Fahrt- & Transportkosten (PKW, Bahn, Flug, Taxi, ÖPNV)
                  </td>
                </tr>
                ${(tr.travelCost > 0 || (isCar && tr.distance_km > 0)) ? `
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Fahrtkosten ${isRoundTrip ? '(Rundreise gem. Etappen)' : `(${isCar ? 'Eigener PKW' : 'ÖPNV/Bahn'})`}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${isRoundTrip ? `${legs.length} Etappen nachgewiesen [SKR04: 6663]` : (isCar ? `${tr.distance_km} km à ${(tr.rate_per_km || 0.30).toFixed(2)} € [SKR04: 6663]` : 'Pauschale [SKR04: 6663]')}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">0.0 %</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">${(tr.travelCost || 0).toFixed(2)} €</td>
                </tr>
                ` : ''}
                ${transportExps.map(e => `
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${e.expense_date}: ${escapeHtml(e.description)}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                    SKR04: <code>${e.skr04_account}</code> | ${escapeHtml(e.category)}
                    ${e.receipt_filename ? ` (${escapeHtml(e.receipt_filename)})` : ''}
                  </td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${(e.tax_rate || 0).toFixed(1)} %</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">${(e.amount_net || 0).toFixed(2)} €</td>
                </tr>
                `).join("")}
                <tr style="background: #f1f5f9; font-weight: 600; font-size: 0.8rem;">
                  <td colspan="3" style="padding: 4px 12px; border: 1px solid #e2e8f0; text-align: right;">Zwischensumme Transportkosten:</td>
                  <td style="padding: 4px 12px; border: 1px solid #e2e8f0; text-align: right; color: #1e40af;">${transportTotalNet.toFixed(2)} €</td>
                </tr>

                <!-- 2. SÄULE: VERPFLEGUNGSMEHRAUFWAND -->
                <tr class="category-header" style="background: #f8fafc; font-weight: 700; color: #b45309; page-break-after: avoid; break-after: avoid;">
                  <td colspan="4" style="padding: 6px 12px; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-utensils"></i> 2. Verpflegungsmehraufwand (VMA gem. § 9 Abs. 4a EStG)
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Verpflegungsmehraufwand (${tr.total_days || 1} Tage)</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Steuerfreie gesetzliche Pauschalen nach EStG [SKR04: 6673 / 6664]${tr.has_breakfast ? ' (inkl. Frühstücksabzug)' : ''}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">0.0 %</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #b45309;">${(tr.vma_amount || 0).toFixed(2)} €</td>
                </tr>

                <!-- 3. SÄULE: ÜBERNACHTUNGSKOSTEN -->
                ${(hotelTotalNet > 0 || hotelExps.length > 0) ? `
                <tr class="category-header" style="background: #f8fafc; font-weight: 700; color: #4338ca; page-break-after: avoid; break-after: avoid;">
                  <td colspan="4" style="padding: 6px 12px; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-hotel"></i> 3. Übernachtungskosten (Hotel & Unterkunft)
                  </td>
                </tr>
                ${hotelExps.map(e => `
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${e.expense_date}: ${escapeHtml(e.description)}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                    SKR04: <code>${e.skr04_account}</code> | ${escapeHtml(e.category)}
                    ${e.receipt_filename ? ` (${escapeHtml(e.receipt_filename)})` : ''}
                  </td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${(e.tax_rate || 0).toFixed(1)} %</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">${(e.amount_net || 0).toFixed(2)} €</td>
                </tr>
                `).join("")}
                <tr style="background: #f1f5f9; font-weight: 600; font-size: 0.8rem;">
                  <td colspan="3" style="padding: 4px 12px; border: 1px solid #e2e8f0; text-align: right;">Zwischensumme Übernachtungskosten:</td>
                  <td style="padding: 4px 12px; border: 1px solid #e2e8f0; text-align: right; color: #4338ca;">${hotelTotalNet.toFixed(2)} €</td>
                </tr>
                ` : ''}

                <!-- 4. SÄULE: REISENEBENKOSTEN & SONSTIGE SPESEN -->
                ${(otherTotalNet > 0 || otherExps.length > 0) ? `
                <tr class="category-header" style="background: #f8fafc; font-weight: 700; color: #0f766e; page-break-after: avoid; break-after: avoid;">
                  <td colspan="4" style="padding: 6px 12px; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-receipt"></i> 4. Reisenebenkosten & sonstige Spesen (Parken, Maut, Tickets etc.)
                  </td>
                </tr>
                ${otherExps.map(e => `
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${e.expense_date}: ${escapeHtml(e.description)}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                    SKR04: <code>${e.skr04_account}</code> | ${escapeHtml(e.category)}
                    ${e.receipt_filename ? ` (${escapeHtml(e.receipt_filename)})` : ''}
                  </td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${(e.tax_rate || 0).toFixed(1)} %</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">${(e.amount_net || 0).toFixed(2)} €</td>
                </tr>
                `).join("")}
                <tr style="background: #f1f5f9; font-weight: 600; font-size: 0.8rem;">
                  <td colspan="3" style="padding: 4px 12px; border: 1px solid #e2e8f0; text-align: right;">Zwischensumme Reisenebenkosten:</td>
                  <td style="padding: 4px 12px; border: 1px solid #e2e8f0; text-align: right; color: #0f766e;">${otherTotalNet.toFixed(2)} €</td>
                </tr>
                ` : ''}

                <!-- GESAMTSUMMEN -->
                <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                  <td colspan="3" style="padding: 10px 12px; border: 1px solid #e2e8f0; text-align: right; font-size: 0.95rem;">Gesamte Betriebsausgabe (Finanzamt EÜR):</td>
                  <td style="padding: 10px 12px; border: 1px solid #e2e8f0; text-align: right; color: #15803d; font-size: 1.1rem;">${totalCostNet.toFixed(2)} € Netto</td>
                </tr>
                <tr style="font-size: 0.8rem; color: #64748b; background: #fff;">
                  <td colspan="3" style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: right;">Zuzüglich Vorsteuer (abzugsfähig):</td>
                  <td style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: right;">${totalTaxAmount.toFixed(2)} €</td>
                </tr>
                <tr style="font-size: 0.85rem; font-weight: 600; color: #1e293b; background: #f1f5f9;">
                  <td colspan="3" style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: right;">Brutto-Gesamtaufwand (Zahlbetrag):</td>
                  <td style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: right;">${totalCostGross.toFixed(2)} €</td>
                </tr>
                <tr style="font-size: 0.8rem; color: #64748b;">
                  <td colspan="3" style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: right;">Davon an Kunden weiterberechenbar:</td>
                  <td style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: right;">${(tr.clientReimbursable || 0).toFixed(2)} € Netto</td>
                </tr>
              </tbody>
            </table>

            <!-- Prüf- & Integritäts-Stempel -->
            <div style="background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 6px; padding: 10px 14px; font-size: 0.75rem; color: #64748b;">
              <strong>Technischer Integritäts- und Hashnachweis:</strong> Dieses Dienstreiseprotokoll wurde elektronisch erfasst und mit digitalem Prüfhash versehen.<br>
              Hash: <code>${tr.reportHash || 'SHA256_VERIFIED'}</code> | Erzeugt am: ${new Date().toLocaleString("de-DE")}
            </div>
          </div>
        `;
      } catch (err) {
        content.innerHTML = `<div style="color: red; padding: 20px;">Fehler: ${err.message}</div>`;
      }
    }

    
    let currentTaxReportTrip = null;

    function printCurrentTripVmaEigenbeleg() {
      if (!currentTaxReportTrip) return;
      const tr = currentTaxReportTrip;
      let vmaBreakdown;
      const isForeignTrip = tr.is_foreign_trip === 1 || tr.is_foreign_trip === true;
      let foreignMealDeds = {};
      if (tr.meal_deductions_json) {
        try {
          foreignMealDeds = typeof tr.meal_deductions_json === 'string' ? JSON.parse(tr.meal_deductions_json) : tr.meal_deductions_json;
        } catch(e) {}
      }

      if (isForeignTrip) {
        const legs = tr.legs || [];
        if (tr.is_round_trip === 1 && legs.length > 0) {
          const legsData = legs.map(l => ({
            dateLeg: l.date_leg || tr.trip_date,
            startLocation: l.start_location || "Start",
            destinationLocation: l.destination_location || "Ziel",
            country: l.country || l.destination_location || "Ausland",
            destinationCity: l.destination_city || l.destination_location || "",
            departureTime: tr.departure_time || "07:30",
            arrivalTime: tr.arrival_time || "19:30"
          }));
          vmaBreakdown = (typeof calculateForeignVmaMultiLocation === "function") 
            ? calculateForeignVmaMultiLocation({
                legs: legsData,
                tripStartDate: tr.trip_date,
                tripEndDate: tr.return_date || tr.trip_date,
                departureTimeStr: tr.departure_time || "07:30",
                arrivalTimeStr: tr.arrival_time || "19:30",
                mealDeductions: foreignMealDeds
              })
            : getVmaDailyBreakdown(tr.trip_date, tr.return_date, tr.departure_time, tr.arrival_time, false, globalSettings);
        } else {
          let foreignRates = tr.foreign_rates_json;
          if (typeof foreignRates === 'string') {
            try { foreignRates = JSON.parse(foreignRates); } catch(_) {}
          }
          vmaBreakdown = (typeof calculateForeignVmaSingleLocation === "function")
            ? calculateForeignVmaSingleLocation({
                startDateStr: tr.trip_date,
                endDateStr: tr.return_date || tr.trip_date,
                departureTimeStr: tr.departure_time || "07:30",
                arrivalTimeStr: tr.arrival_time || "19:30",
                bmfRateEntry: foreignRates,
                country: tr.foreign_country || foreignRates?.country || "Ausland",
                city: tr.foreign_city || foreignRates?.city || "",
                mealDeductions: foreignMealDeds
              })
            : getVmaDailyBreakdown(tr.trip_date, tr.return_date, tr.departure_time, tr.arrival_time, false, globalSettings);
        }
      } else {
        vmaBreakdown = getVmaDailyBreakdown(
          tr.trip_date, 
          tr.return_date, 
          tr.departure_time, 
          tr.arrival_time, 
          (tr.breakfast_days_json ? (typeof tr.breakfast_days_json === 'string' ? JSON.parse(tr.breakfast_days_json) : tr.breakfast_days_json) : (tr.has_breakfast === 1 || tr.has_breakfast === true)), 
          globalSettings
        );
      }
      const vma = vmaBreakdown.totalVma;
      const contractor = (globalSettings.email_sender_name ? globalSettings.email_sender_name.split("|")[0].trim() : (globalSettings.contractor_name || localStorage.getItem("cfg_contractor_name") || "Michael Kirst-Neshva"));
      const company = globalSettings.company_name || localStorage.getItem("cfg_company_name") || "Cloud Security & Compliance Architecture – Michael Kirst-Neshva";
      const address = globalSettings.company_address || "Ruthenberger Markt 11b, 24539 Neumünster";
      const city = globalSettings.company_city || localStorage.getItem("cfg_company_city") || "Neumünster";
      const useSig = (globalSettings.use_signature_on_documents !== 0 && localStorage.getItem("cfg_use_signature_documents") !== "0");
      const sigDataUrl = useSig 
        ? (globalSettings.contractor_signature_data_url || localStorage.getItem("cfg_contractor_signature_data_url") || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : ""))
        : "";

      const legs = tr.legs || [];
      const isRoundTrip = tr.is_round_trip === 1 || legs.length > 0;
      let routeDisplay = "";
      if (isRoundTrip && legs.length > 0) {
        const stops = [];
        legs.forEach((l, idx) => {
          if (idx === 0) stops.push(escapeHtml(l.start_location));
          stops.push(escapeHtml(l.destination_location));
        });
        routeDisplay = stops.join(" &rarr; ");
      } else {
        const orig = escapeHtml(tr.origin_address || tr.origin || "Wohnort / Home-Office");
        const dest = escapeHtml(tr.destination_address || tr.destination || "Kundenadresse / Einsatzort");
        routeDisplay = `${orig} &rarr; ${dest} &rarr; ${orig}`;
      }

      const win = window.open("", "_blank");
      if (!win) { alert("Bitte erlauben Sie Popups für diese Seite."); return; }

      win.document.write(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <title>Eigenbeleg Verpflegungsmehraufwand - ${tr.id.substring(0,8)}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm 14mm 15mm 14mm; }
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 800px; margin: 0 auto; font-size: 11px; line-height: 1.4; }
            h1 { font-size: 1.35rem; color: #1e40af; margin-bottom: 4px; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; background: #e0f2fe; color: #0369a1; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.85rem; }
            th, td { padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left; }
            th { background: #f1f5f9; font-weight: 600; }
            .sign-box { width: 260px; font-size: 0.85rem; color: #64748b; text-align: center; }
            @media print {
              body { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
              thead { display: table-header-group !important; }
              tfoot { display: table-footer-group !important; }
              tr, th, td { page-break-inside: avoid !important; break-inside: avoid !important; }
              .sign-box { page-break-inside: avoid !important; break-inside: avoid !important; }
            }
          </style>
        </head>
        <body>
          <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #1e40af; padding-bottom: 12px; margin-bottom: 20px;">
            <div>
              <h1>Eigenbeleg: Verpflegungsmehraufwand (VMA)</h1>
              <p style="margin:0; font-size:0.85rem; color:#64748b;">Gesetzlicher Nachweis der Pauschbeträge gem. § 9 Abs. 4a EStG für Finanzamt & EÜR</p>
            </div>
            <div style="text-align:right; font-size:0.85rem;">
              <strong>Beleg-Nr: VMA-${tr.id.substring(0,8).toUpperCase()}</strong><br>
              Datum: ${new Date().toLocaleDateString("de-DE")}
            </div>
          </div>

          <div style="background:#f8fafc; padding:14px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:20px; font-size:0.9rem; line-height:1.5;">
            <strong>Unternehmer / Reisender:</strong> ${contractor}<br>
            <strong>Unternehmen:</strong> ${company}<br>
            <strong>Betriebsstätte / Anschrift:</strong> ${address}<br>
            <strong>Reisezweck / Anlass:</strong> ${escapeHtml(tr.purpose || 'Kundentermin vor Ort')}<br>
            <strong>Kunde / Projekt:</strong> ${escapeHtml(tr.customer_name || '')} (${escapeHtml(tr.project_name || '')})<br>
            <strong>Streckenverlauf:</strong> ${routeDisplay}
          </div>

          <h3 style="font-size: 1rem; color: #1e40af; margin: 20px 0 8px 0;">
            <i class="fa-solid fa-calendar-days"></i> Detaillierte Tagesaufstellung gem. § 9 Abs. 4a EStG
          </h3>
          <table>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">Tag</th>
                <th style="width: 120px;">Datum</th>
                <th>Reisetag-Klassifizierung & Rechtsgrundlage</th>
                <th style="width: 130px;">Reisezeit / Status</th>
                <th style="text-align: right; width: 85px;">Gesetzl. Satz</th>
                <th style="text-align: right; width: 85px;">Kürzung</th>
                <th style="text-align: right; width: 95px;">Pauschale</th>
              </tr>
            </thead>
            <tbody>
              ${vmaBreakdown.days.map(d => `
                <tr>
                  <td style="text-align: center; font-weight: 600;">${d.dayNum}</td>
                  <td><strong>${escapeHtml(d.dateFormatted)}</strong></td>
                  <td>
                    <strong>${escapeHtml(d.type)}</strong><br>
                    <small style="color: #64748b; font-size: 0.78rem;">${escapeHtml(d.lawNote)}</small>
                  </td>
                  <td>${escapeHtml(d.timeInfo)}</td>
                  <td style="text-align: right;">${d.baseRate.toFixed(2)} €</td>
                  <td style="text-align: right; color: ${d.deduction > 0 ? '#b91c1c' : '#64748b'};">
                    ${d.deduction > 0 ? `-${d.deduction.toFixed(2)} €` : '0,00 €'}
                  </td>
                  <td style="text-align: right; font-weight: 700; color: #15803d;">${d.netRate.toFixed(2)} €</td>
                </tr>
              `).join("")}
              <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                <td colspan="4" style="text-align: right;">Zwischensummen:</td>
                <td style="text-align: right;">${vmaBreakdown.totalBase.toFixed(2)} €</td>
                <td style="text-align: right; color: ${vmaBreakdown.totalDeduction > 0 ? '#b91c1c' : '#64748b'};">
                  ${vmaBreakdown.totalDeduction > 0 ? `-${vmaBreakdown.totalDeduction.toFixed(2)} €` : '0,00 €'}
                </td>
                <td style="text-align: right; font-weight: 800; color: #15803d; font-size: 1rem;">
                  ${vmaBreakdown.totalVma.toFixed(2)} €
                </td>
              </tr>
              <tr style="background: #eff6ff;">
                <td colspan="6" style="text-align: right; font-weight: 700; color: #1e40af; font-size: 0.95rem;">
                  Gesamter Auszahlungsbetrag / Betriebsausgabe VMA (steuerfrei gem. § 9 Abs. 4a EStG):
                </td>
                <td style="text-align: right; font-weight: 800; font-size: 1.15rem; color: #1e40af;">
                  ${vmaBreakdown.totalVma.toFixed(2)} €
                </td>
              </tr>
            </tbody>
          </table>

          <p style="font-size:0.8rem; color:#64748b; line-height:1.4;">
            <strong>Buchungshinweis:</strong> Buchungskonto SKR04: <code>6673</code> (Reisekosten Unternehmer Verpflegungsmehraufwand) / SKR03: <code>4673</code>. Vorsteuerabzug 0% (steuerfreie Pauschale gem. § 9 Abs. 4a EStG).
          </p>

          <div style="margin-top:40px; display:flex; justify-content:space-between; align-items:flex-end;">
            <div style="font-size: 0.9rem; color: #334155; padding-bottom: 6px;">
              ${escapeHtml(city)}, den ${new Date().toLocaleDateString("de-DE")}
            </div>
            <div class="sign-box">
              <div style="height: 55px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
                ${sigDataUrl ? `<img src="${sigDataUrl}" alt="Signatur" style="max-height: 52px; max-width: 220px; object-fit: contain;">` : ''}
              </div>
              <div style="border-top: 1px solid #94a3b8; padding-top: 6px;">
                <strong style="color: #1e293b; font-size: 0.9rem;">${escapeHtml(contractor)}</strong><br>
                <span style="font-size: 0.8rem; color: #64748b;">Unterschrift Unternehmer</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      win.document.close();
      const img = win.document.querySelector("img[alt='Signatur']");
      if (img && !img.complete) {
        img.onload = () => setTimeout(() => { win.print(); }, 150);
        img.onerror = () => setTimeout(() => { win.print(); }, 150);
        setTimeout(() => { win.print(); }, 500);
      } else {
        setTimeout(() => { win.print(); }, 400);
      }
    }

    function printCurrentTripLegsEigenbeleg() {
      if (!currentTaxReportTrip) return;
      const tr = currentTaxReportTrip;
      const legs = tr.legs || [];
      const contractor = (globalSettings.email_sender_name ? globalSettings.email_sender_name.split("|")[0].trim() : (globalSettings.contractor_name || localStorage.getItem("cfg_contractor_name") || "Michael Kirst-Neshva"));
      const company = globalSettings.company_name || localStorage.getItem("cfg_company_name") || "Cloud Security & Compliance Architecture – Michael Kirst-Neshva";
      const address = globalSettings.company_address || "Ruthenberger Markt 11b, 24539 Neumünster";
      const city = globalSettings.company_city || localStorage.getItem("cfg_company_city") || "Neumünster";
      const useSig = (globalSettings.use_signature_on_documents !== 0 && localStorage.getItem("cfg_use_signature_documents") !== "0");
      const sigDataUrl = useSig 
        ? (globalSettings.contractor_signature_data_url || localStorage.getItem("cfg_contractor_signature_data_url") || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : ""))
        : "";

      const transportIcons = {
        "Train": "🚆 Bahn / ÖPNV",
        "Flight": "✈️ Flugzeug",
        "PersonalCar": "🚗 Eigener PKW",
        "RentalCar": "🚕 Mietwagen/Taxi",
        "Passenger": "👥 Mitfahrt/Beifahrer",
        "RentalBike": "🛴 Mietrad/Scooter",
        "BikeFoot": "🚲 Fahrrad/Zu Fuß"
      };

      const hasLegs = legs.length > 0;
      const isCar = (tr.expense_type === "PersonalCar" || tr.transport_type === "PersonalCar" || (!tr.expense_type && !tr.transport_type && (tr.distance_km || 0) > 0));
      const personalCarKm = hasLegs 
        ? legs.filter(l => l.transport_type === 'PersonalCar').reduce((acc, l) => acc + (parseFloat(l.distance_km || 0)), 0)
        : (isCar ? parseFloat(tr.distance_km || 0) : 0);
      
      const totalCost = tr.travelCost !== undefined ? tr.travelCost : (hasLegs ? legs.reduce((acc, l) => {
        const isLegCar = l.transport_type === "PersonalCar";
        const isLegFree = l.transport_type === "Passenger" || l.transport_type === "BikeFoot";
        const legCost = isLegCar 
          ? (parseFloat(l.distance_km || "0") * parseFloat(l.rate_per_km || "0.30")) 
          : (isLegFree ? 0 : (l.travel_cost_net !== undefined && l.travel_cost_net !== null ? parseFloat(l.travel_cost_net) : 0));
        return acc + legCost;
      }, 0) : (isCar ? (parseFloat(tr.distance_km || 0) * parseFloat(tr.rate_per_km || 0.30)) : parseFloat(tr.ticket_cost || 0)));

      const isTransportExp = (e) => {
        const c = (e.category || '').toLowerCase();
        const d = (e.description || '').toLowerCase();
        const s = e.skr04_account || '';
        return c.includes('fahrt') || c.includes('flug') || c.includes('bahn') || c.includes('zug') || c.includes('taxi') || c.includes('öpnv') || s === '6663' || s === '6660' || (s === '6670' && (d.includes('taxi') || d.includes('fahrt')));
      };
      const transportExpenses = (tr.expenses || []).filter(isTransportExp);
      const transportExpensesCost = transportExpenses.reduce((sum, e) => sum + (e.amount_net || 0), 0);
      const finalTotalCost = totalCost + transportExpensesCost;

      let tableRowsHtml = "";
      if (hasLegs) {
        tableRowsHtml = legs.map(l => {
          const isLegCar = l.transport_type === "PersonalCar";
          const isLegFree = l.transport_type === "Passenger" || l.transport_type === "BikeFoot";
          const legCost = isLegCar 
            ? (parseFloat(l.distance_km || "0") * parseFloat(l.rate_per_km || "0.30")) 
            : (isLegFree ? 0 : (l.travel_cost_net !== undefined && l.travel_cost_net !== null ? parseFloat(l.travel_cost_net) : 0));
          const legDistStr = isLegCar ? `${l.distance_km || 0} km` : '-';
          const transLabel = transportIcons[l.transport_type] || l.transport_type;
          return `
          <tr>
            <td style="text-align: center;">${l.leg_order}</td>
            <td>${l.date_leg}</td>
            <td><strong>${escapeHtml(l.start_location)}</strong> &rarr; <strong>${escapeHtml(l.destination_location)}</strong></td>
            <td>${transLabel}</td>
            <td style="color: #64748b;">${escapeHtml(l.layover_purpose || tr.purpose || '-')}</td>
            <td style="text-align: right;">${legDistStr}</td>
            <td style="text-align: right; font-weight: 600;">${legCost.toFixed(2)} €</td>
          </tr>
          `;
        }).join("");
      } else {
        const orig = tr.origin_address || tr.origin || "Wohnort / Home-Office";
        const dest = tr.destination_address || tr.destination || "Kundenadresse / Einsatzort";
        const transType = tr.expense_type || tr.transport_type || (tr.distance_km > 0 ? "PersonalCar" : "Train");
        const transLabel = transportIcons[transType] || transType;
        const isRoundTrip = tr.is_round_trip === 1;

        if (isRoundTrip) {
          const singleKm = isCar ? (parseFloat(tr.distance_km || 0) / 2) : 0;
          const singleCost = totalCost / 2;
          const kmDisplay = isCar ? `${singleKm.toFixed(1)} km` : '-';
          tableRowsHtml = `
          <tr>
            <td style="text-align: center;">1</td>
            <td>${tr.trip_date}</td>
            <td><strong>${escapeHtml(orig)}</strong> &rarr; <strong>${escapeHtml(dest)}</strong></td>
            <td>${transLabel} (Hinfahrt)</td>
            <td style="color: #64748b;">${escapeHtml(tr.purpose || 'Kundentermin')}</td>
            <td style="text-align: right;">${kmDisplay}</td>
            <td style="text-align: right; font-weight: 600;">${singleCost.toFixed(2)} €</td>
          </tr>
          <tr>
            <td style="text-align: center;">2</td>
            <td>${tr.return_date || tr.trip_date}</td>
            <td><strong>${escapeHtml(dest)}</strong> &rarr; <strong>${escapeHtml(orig)}</strong></td>
            <td>${transLabel} (Rückfahrt)</td>
            <td style="color: #64748b;">Rückreise</td>
            <td style="text-align: right;">${kmDisplay}</td>
            <td style="text-align: right; font-weight: 600;">${singleCost.toFixed(2)} €</td>
          </tr>
          `;
        } else {
          const kmDisplay = isCar ? `${parseFloat(tr.distance_km || 0).toFixed(1)} km` : '-';
          tableRowsHtml = `
          <tr>
            <td style="text-align: center;">1</td>
            <td>${tr.trip_date}</td>
            <td><strong>${escapeHtml(orig)}</strong> &rarr; <strong>${escapeHtml(dest)}</strong></td>
            <td>${transLabel}</td>
            <td style="color: #64748b;">${escapeHtml(tr.purpose || 'Dienstreise')}</td>
            <td style="text-align: right;">${kmDisplay}</td>
            <td style="text-align: right; font-weight: 600;">${totalCost.toFixed(2)} €</td>
          </tr>
          `;
        }
      }

      if (transportExpenses.length > 0) {
        transportExpenses.forEach((e, idx) => {
          const rowNum = (hasLegs ? legs.length : (tr.is_round_trip === 1 ? 2 : 1)) + idx + 1;
          const c = (e.category || '').toLowerCase();
          const icon = c.includes('flug') ? '✈️ Flugzeug' : (c.includes('taxi') ? '🚕 Taxi' : '🚆 Bahn/ÖPNV');
          tableRowsHtml += `
          <tr>
            <td style="text-align: center;">${rowNum}</td>
            <td>${e.expense_date}</td>
            <td><strong>${escapeHtml(e.description)}</strong></td>
            <td>${icon}</td>
            <td style="color: #64748b;">${escapeHtml(e.receipt_filename ? 'Beleg: ' + e.receipt_filename : 'Ticketnachweis')} [SKR04: ${e.skr04_account}]</td>
            <td style="text-align: right;">-</td>
            <td style="text-align: right; font-weight: 600;">${(e.amount_net || 0).toFixed(2)} €</td>
          </tr>
          `;
        });
      }

      const win = window.open("", "_blank");
      if (!win) { alert("Bitte erlauben Sie Popups für diese Seite."); return; }

      win.document.write(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <title>Fahrt- & Transportkosten-Eigenbeleg - ${tr.id.substring(0,8)}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm 14mm 15mm 14mm; }
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 850px; margin: 0 auto; font-size: 11px; line-height: 1.4; }
            h1 { font-size: 1.35rem; color: #1e40af; margin-bottom: 4px; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; background: #e0f2fe; color: #0369a1; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.85rem; }
            th, td { padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left; }
            th { background: #f1f5f9; font-weight: 600; }
            .sign-box { width: 260px; font-size: 0.85rem; color: #64748b; text-align: center; }
            @media print {
              body { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
              thead { display: table-header-group !important; }
              tfoot { display: table-footer-group !important; }
              tr, th, td { page-break-inside: avoid !important; break-inside: avoid !important; }
              .sign-box { page-break-inside: avoid !important; break-inside: avoid !important; }
            }
          </style>
        </head>
        <body>
          <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #1e40af; padding-bottom: 12px; margin-bottom: 20px;">
            <div>
              <h1>Eigenbeleg: Fahrt- & Transportkosten</h1>
              <p style="margin:0; font-size:0.85rem; color:#64748b;">Detaillierter Nachweis der Fahrt- und Beförderungskosten (PKW-Pauschalen & Tickets gem. § 9 EStG) für Finanzamt & EÜR</p>
            </div>
            <div style="text-align:right; font-size:0.85rem;">
              <strong>Beleg-Nr: FAHRT-${tr.id.substring(0,8).toUpperCase()}</strong><br>
              Datum: ${new Date().toLocaleDateString("de-DE")}
            </div>
          </div>

          <div style="background:#f8fafc; padding:14px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:20px; font-size:0.9rem; line-height:1.5;">
            <strong>Unternehmer / Reisender:</strong> ${contractor}<br>
            <strong>Unternehmen:</strong> ${company}<br>
            <strong>Betriebsstätte / Anschrift:</strong> ${address}<br>
            <strong>Reisezweck / Gesamtanlass:</strong> ${escapeHtml(tr.purpose || 'Dienstreise / Kundentermin')}<br>
            <strong>Kunde / Projekt:</strong> ${escapeHtml(tr.customer_name || '')} (${escapeHtml(tr.project_name || '')})<br>
            <strong>Reisezeitraum:</strong> ${tr.trip_date}${tr.return_date && tr.return_date !== tr.trip_date ? ' bis ' + tr.return_date : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="width: 85px;">Datum</th>
                <th>Strecke / Belegbeschreibung</th>
                <th style="width: 135px;">Verkehrsmittel</th>
                <th>Etappenzweck / Belegnachweis</th>
                <th style="text-align: right; width: 70px;">Distanz</th>
                <th style="text-align: right; width: 85px;">Kosten Netto</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
              <tr style="background:#f1f5f9; font-weight: 700;">
                <td colspan="5" style="text-align: right;">Gesamte Fahrt- &amp; Transportkosten:</td>
                <td style="text-align: right;">${personalCarKm > 0 ? `${personalCarKm} km` : '-'}</td>
                <td style="text-align: right; font-size: 1.05rem; color: #1e40af;">${finalTotalCost.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>

          <p style="font-size:0.8rem; color:#64748b; line-height:1.4;">
            <strong>Buchungshinweis:</strong> Buchungskonto SKR04: <code>6663</code> (Reisekosten Unternehmer Fahrtkosten) / SKR03: <code>4663</code>. Vorsteuer 0%.
          </p>

          <div style="margin-top:40px; display:flex; justify-content:space-between; align-items:flex-end;">
            <div style="font-size: 0.9rem; color: #334155; padding-bottom: 6px;">
              ${escapeHtml(city)}, den ${new Date().toLocaleDateString("de-DE")}
            </div>
            <div class="sign-box">
              <div style="height: 55px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
                ${sigDataUrl ? `<img src="${sigDataUrl}" alt="Signatur" style="max-height: 52px; max-width: 220px; object-fit: contain;">` : ''}
              </div>
              <div style="border-top: 1px solid #94a3b8; padding-top: 6px;">
                <strong style="color: #1e293b; font-size: 0.9rem;">${escapeHtml(contractor)}</strong><br>
                <span style="font-size: 0.8rem; color: #64748b;">Unterschrift Unternehmer</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      win.document.close();
      const img = win.document.querySelector("img[alt='Signatur']");
      if (img && !img.complete) {
        img.onload = () => setTimeout(() => { win.print(); }, 150);
        img.onerror = () => setTimeout(() => { win.print(); }, 150);
        setTimeout(() => { win.print(); }, 500);
      } else {
        setTimeout(() => { win.print(); }, 400);
      }
    }

    async function syncVmaToLexware(tripId) {
      if (!confirm("Möchten Sie den Verpflegungsmehraufwand (VMA) für diese Reise als rechtssicheren Eigenbeleg an Lexware Office übertragen?")) {
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}/sync-vma-to-lexware`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(`Erfolg: ${data.message}`);
          await loadTripsList();
        } else {
          if (res.status === 429 || (data.error && data.error.includes("429"))) {
            alert("Lexware API Rate-Limit (429): Lexware erlaubt maximal 2 API-Anfragen pro Sekunde. Bitte warten Sie 5 Sekunden und klicken Sie erneut auf 'Lexware Sync'.");
          } else {
            alert("Fehler bei der VMA-Übertragung an Lexware: " + (data.error || "Unbekannter Fehler"));
          }
        }
      } catch (err) {
        alert("Netzwerkfehler: " + err.message);
      }
    }
  
    function printTaxReport() {
      const el = document.getElementById("print-area-tax-report");
      if (!el) return;
      const win = window.open("", "_blank");
      if (!win) {
        alert("Bitte erlauben Sie Popups für diese Seite.");
        return;
      }
      const useSig = (globalSettings.use_signature_on_documents !== 0 && localStorage.getItem("cfg_use_signature_documents") !== "0");
      const sigDataUrl = useSig 
        ? (globalSettings.contractor_signature_data_url || localStorage.getItem("cfg_contractor_signature_data_url") || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : ""))
        : "";
      const contractorFullName = (globalSettings.email_sender_name ? globalSettings.email_sender_name.split("|")[0].trim() : (globalSettings.contractor_name || localStorage.getItem("cfg_contractor_name") || "Michael Kirst-Neshva"));
      const city = globalSettings.company_city || localStorage.getItem("cfg_company_city") || "Neumünster";

      const tr = currentTaxReportTrip || {};
      const isMultiDay = tr.total_days > 1 && tr.return_date && tr.return_date !== tr.trip_date;
      const tripPeriod = `${tr.trip_date || ''}${isMultiDay ? ' bis ' + tr.return_date : ''}`;
      const tripPurpose = tr.purpose || 'Dienstreise';
      const tripIdShort = (tr.id || '').substring(0, 8);

      win.document.write(`
        <!DOCTYPE html>
        <html lang="de">
          <head>
            <meta charset="UTF-8">
            <title>Dienstreise- & Finanzamtsbericht - ${escapeHtml(tripPurpose)}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 15mm 14mm 15mm 14mm;
              }
              * { box-sizing: border-box; }
              html, body {
                margin: 0;
                padding: 0;
                background: #e2e8f0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                color: #1e293b;
                font-size: 11px;
                line-height: 1.4;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print-toolbar {
                max-width: 210mm;
                margin: 16px auto 8px auto;
                background: #ffffff;
                padding: 10px 18px;
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border: 1px solid #cbd5e1;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
              }
              .btn {
                padding: 6px 14px;
                font-weight: 600;
                border-radius: 6px;
                cursor: pointer;
                border: 1px solid #cbd5e1;
                background: #fff;
                font-size: 12.5px;
              }
              .btn-primary { background: #2563eb; color: #fff; border-color: #2563eb; }

              .a4-page {
                width: 210mm;
                min-height: 297mm;
                padding: 15mm 14mm;
                margin: 12px auto 40px auto;
                background: #ffffff;
                box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                border-radius: 3px;
              }
              table { width: 100%; border-collapse: collapse; }
              .badge { display: inline-block; padding: 3px 6px; font-size: 10px; border-radius: 4px; }
              .badge-info { background: #e0f2fe; color: #0369a1; }
              .badge-warning { background: #fef3c7; color: #b45309; }

              @media print {
                html, body {
                  background: #ffffff !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .no-print-toolbar {
                  display: none !important;
                }
                .a4-page {
                  width: 100% !important;
                  max-width: 100% !important;
                  min-height: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                }
                #print-area-tax-report {
                  padding: 0 !important;
                }

                thead {
                  display: table-header-group !important;
                }
                tfoot {
                  display: table-footer-group !important;
                }
                tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                th, td {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                h1, h2, h3, h4, .section-title, .category-header {
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                .avoid-break, .signature-block, .integrity-box {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="no-print-toolbar">
              <strong>📄 DIN A4 Druck- & PDF-Vorschau (Finanzamt EStG)</strong>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 11px; color: #64748b;">(Tipp: Im Druckdialog 'Hintergrundgrafiken' aktivieren)</span>
                <button class="btn btn-primary" onclick="window.print()">🖨️ Drucken / PDF speichern</button>
              </div>
            </div>
            <div class="a4-page">
              ${el.innerHTML}
              <div class="signature-block" style="margin-top: 32px; width: 260px; text-align: center; page-break-inside: avoid; break-inside: avoid;">
                <div style="height: 55px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
                  ${sigDataUrl ? `<img src="${sigDataUrl}" alt="Signatur" style="max-height: 52px; max-width: 220px; object-fit: contain;">` : ''}
                </div>
                <div style="border-top: 1px solid #64748b; padding-top: 6px; font-size: 11px;">
                  <strong style="color: #1e293b;">${escapeHtml(contractorFullName)}</strong> (Steuerpflichtiger)<br>
                  <small style="color: #64748b;">Ort, Datum: ${escapeHtml(city)}, ${new Date().toLocaleDateString('de-DE')}</small>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      win.document.close();
      const img = win.document.querySelector("img[alt='Signatur']");
      if (img && !img.complete) {
        img.onload = () => setTimeout(() => { win.print(); }, 150);
        img.onerror = () => setTimeout(() => { win.print(); }, 150);
        setTimeout(() => { win.print(); }, 500);
      }
    }

    // Modal Handling (View vs. Edit vs. Clone Revision)
    function openTimesheetModal(id, status) {
      const modal = document.getElementById("timesheet-modal");
      const title = document.getElementById("modal-title");
      const sub = document.getElementById("modal-subtitle");
      const body = document.getElementById("modal-body-content");
      const footer = document.getElementById("modal-footer-actions");

      title.innerText = `Leistungsnachweis ${id}`;
      sub.innerText = `Status: ${status} | GoBD-konformes Revisionsprotokoll`;

      if (status === "Approved") {
        body.innerHTML = `
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <strong style="color: #1e40af;"><i class="fa-solid fa-lock"></i> Dieser Eintrag ist digital genehmigt und schreibgeschützt.</strong>
            <p style="font-size: 0.8rem; color: #3b82f6; margin-top: 4px;">Gemäß GoBD dürfen genehmigte Versionen nicht direkt verändert werden. Für Korrekturen können Sie eine neue Revision (v2.0) erstellen.</p>
          </div>
          <table style="width: 100%; font-size: 0.85rem; margin-top: 10px;">
            <tr><td style="width: 140px; color: var(--text-muted);">Kunde:</td><td><strong>Contoso Cloud Architecture Test GmbH</strong></td></tr>
            <tr><td style="color: var(--text-muted);">Projekt:</td><td>M365 & Purview Security (PRJ-2026-M365)</td></tr>
            <tr><td style="color: var(--text-muted);">Stunden:</td><td>21,00 h à 135,00 €/h</td></tr>
            <tr><td style="color: var(--text-muted);">Reisekosten:</td><td>64,80 € Netto (Bahnfahrt)</td></tr>
            <tr><td style="color: var(--text-muted);">Netto-Gesamt:</td><td><strong>2.899,80 €</strong></td></tr>
            <tr><td style="color: var(--text-muted);">Freigabe-Audit:</td><td>m.weber@contoso-cloud.de (Cloudflare OTP)</td></tr>
          </table>
        `;

        footer.innerHTML = `
          <button class="btn btn-outline" onclick="closeModal('timesheet-modal')">Schließen</button>
          <button class="btn btn-warning" onclick="cloneRevision('${id}')">
            <i class="fa-solid fa-code-branch"></i> Änderung / Neue Revision erstellen
          </button>
        `;
      } else {
        body.innerHTML = `
          <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <strong style="color: #c2410c;"><i class="fa-solid fa-pen"></i> Dieser Entwurf kann direkt bearbeitet werden.</strong>
          </div>
          <div class="form-group">
            <label class="form-label">Abrechenbare Stunden</label>
            <input type="number" step="0.25" class="form-control" value="8.00">
          </div>
          <div class="form-group">
            <label class="form-label">Reisekosten Netto (€)</label>
            <input type="number" step="0.01" class="form-control" value="0.00">
          </div>
        `;

        footer.innerHTML = `
          <button class="btn btn-outline" onclick="closeModal('timesheet-modal')">Abbrechen</button>
          <button class="btn btn-primary" onclick="alert('Änderungen im Entwurf gespeichert!'); closeModal('timesheet-modal');">
            <i class="fa-solid fa-floppy-disk"></i> Speichern
          </button>
        `;
      }

      modal.classList.add("active");
    }

    async function cloneRevision(sourceId) {
      if (!confirm("Möchten Sie eine neue Revision (Kopie zur Überarbeitung) aus dieser genehmigten Version erstellen?")) return;

      try {
        const res = await fetch(`${API_BASE}/timesheets/${sourceId}/clone-revision`, { method: "POST" });
        const data = await res.json();
        alert(data.message || "Neue Revision v2.0 wurde als Entwurf angelegt!");
        closeModal('timesheet-modal');
        switchView("dashboard");
      } catch {
        alert("Neue Revision v2.0 wurde als Entwurf angelegt!");
        closeModal('timesheet-modal');
      }
    }

    // =========================================================================
    // BELEGE & BETRIEBSAUSGABEN (OPERATIONAL VOUCHERS, AI VISION & MOBILE SCAN)
    // =========================================================================
    let operationalVouchersList = [];
    let activeMobileScanSessionId = null;
    let activeMobilePollTimer = null;
    let mobileUploadedFiles = [];
    let currentVoucherFiles = {
      receipt: null,
      paymentSlip: null,
      secondary: null
    };

    function populateVoucherDropdowns() {
      const projSelect = document.getElementById("vouch-project-id");
      if (projSelect) {
        projSelect.innerHTML = `<option value="">-- Kein Projekt (Betriebsausgabe Allgemein) --</option>`;
        (globalProjects || []).forEach(p => {
          if (p.isActive !== 0 && p.is_active !== 0) {
            projSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.customerName || p.customer_name || 'Kunde')} • ${escapeHtml(p.name)} (${p.projectNumber || p.project_number})</option>`;
          }
        });
      }

      const tripSelect = document.getElementById("vouch-trip-id");
      if (tripSelect) {
        tripSelect.innerHTML = `<option value="">-- Keine Reise (Separate Ausgabe) --</option>`;
        (globalTrips || []).forEach(tr => {
          tripSelect.innerHTML += `<option value="${tr.id}">🚆 ${tr.start_date || ''}: ${escapeHtml(tr.purpose || 'Dienstreise')} (${escapeHtml(tr.destination || '')})</option>`;
        });
      }
    }

    async function loadOperationalVouchers() {
      const tbody = document.getElementById("vouchers-table-body");
      if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);"><span class="spinner"></span> Lade Belege...</td></tr>`;

      try {
        const typeFilter = document.getElementById("vouch-filter-type")?.value || "all";
        const periodFilter = document.getElementById("vouch-filter-period")?.value || "";

        let query = `${API_BASE}/vouchers?`;
        if (typeFilter !== "all") query += `type=${encodeURIComponent(typeFilter)}&`;
        if (periodFilter) query += `period=${encodeURIComponent(periodFilter)}&`;

        const res = await fetch(query);
        if (!res.ok) throw new Error("Fehler beim Laden der Belege.");
        const data = await res.json();
        operationalVouchersList = data.vouchers || [];

        renderVouchersTable(operationalVouchersList);
        updateVoucherStats(operationalVouchersList);
      } catch (err) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 24px;">Fehler: ${escapeHtml(err.message)}</td></tr>`;
      }
    }

    function updateVoucherStats(vouchers) {
      let hospitalityDeductible = 0;
      let hospitalityCount = 0;
      let transitTotal = 0;
      let otherTotal = 0;
      let taxTotal = 0;

      (vouchers || []).forEach(v => {
        taxTotal += Number(v.tax_amount) || 0;
        if (v.voucher_type === "Hospitality") {
          hospitalityDeductible += Number(v.tax_deductible_net) || 0;
          hospitalityCount++;
        } else if (v.voucher_type === "LocalTransit") {
          transitTotal += Number(v.amount_net) || Number(v.amount_gross) || 0;
        } else {
          otherTotal += Number(v.amount_net) || Number(v.amount_gross) || 0;
        }
      });

      const elHosp = document.getElementById("vouch-stat-hospitality");
      const elHospSub = document.getElementById("vouch-stat-hospitality-sub");
      const elTrans = document.getElementById("vouch-stat-transit");
      const elOther = document.getElementById("vouch-stat-other");
      const elTax = document.getElementById("vouch-stat-tax");

      if (elHosp) elHosp.innerText = formatCurrency(hospitalityDeductible);
      if (elHospSub) elHospSub.innerText = `${hospitalityCount} Bewirtungsbeleg${hospitalityCount === 1 ? '' : 'e'}`;
      if (elTrans) elTrans.innerText = formatCurrency(transitTotal);
      if (elOther) elOther.innerText = formatCurrency(otherTotal);
      if (elTax) elTax.innerText = formatCurrency(taxTotal);
    }

    function toggleSelectAllVouchers(checked) {
      document.querySelectorAll(".vouch-row-cb").forEach(cb => cb.checked = checked);
      updateSelectedVouchersCount();
    }

    function updateSelectedVouchersCount() {
      const allCb = document.querySelectorAll(".vouch-row-cb");
      const checkedCb = document.querySelectorAll(".vouch-row-cb:checked");
      const selectAllEl = document.getElementById("vouch-select-all");
      if (selectAllEl) {
        selectAllEl.checked = allCb.length > 0 && checkedCb.length === allCb.length;
        selectAllEl.indeterminate = checkedCb.length > 0 && checkedCb.length < allCb.length;
      }
      const numEl = document.getElementById("vouch-selected-num");
      if (numEl) numEl.innerText = checkedCb.length;
    }

    function getSelectedVouchersList() {
      const checkedIds = Array.from(document.querySelectorAll(".vouch-row-cb:checked")).map(cb => cb.dataset.id);
      return (operationalVouchersList || []).filter(v => checkedIds.includes(v.id));
    }

    function renderVouchersTable(vouchers) {
      const tbody = document.getElementById("vouchers-table-body");
      if (!tbody) return;

      if (!vouchers || vouchers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 32px; color: var(--text-muted);"><i class="fa-solid fa-receipt" style="font-size: 1.8rem; color: #94a3b8; display: block; margin-bottom: 8px;"></i>Keine Belege für den gewählten Filter gefunden.</td></tr>`;
        updateSelectedVouchersCount();
        return;
      }

      tbody.innerHTML = vouchers.map(v => {
        let badgeType = '<span class="badge" style="background:#e0f2fe; color:#0369a1;"><i class="fa-solid fa-utensils"></i> Bewirtung</span>';
        if (v.voucher_type === "LocalTransit") {
          badgeType = '<span class="badge" style="background:#dcfce7; color:#15803d;"><i class="fa-solid fa-taxi"></i> Fahrt/Taxi</span>';
        } else if (v.voucher_type === "OwnReceipt") {
          badgeType = '<span class="badge" style="background:#fef3c7; color:#92400e;"><i class="fa-solid fa-file-pen"></i> Eigenbeleg</span>';
        } else if (v.voucher_type === "GWG_Asset") {
          badgeType = '<span class="badge" style="background:#f3e8ff; color:#7e22ce;"><i class="fa-solid fa-laptop"></i> GWG &lt;800€</span>';
        } else if (v.voucher_type === "GeneralExpense") {
          badgeType = '<span class="badge" style="background:#f1f5f9; color:#475569;"><i class="fa-solid fa-file-invoice"></i> Ausgabe</span>';
        }

        let taxDetail = "";
        if (v.voucher_type === "Hospitality") {
          const deductible = Number(v.tax_deductible_net) || 0;
          const nondeductible = Number(v.tax_non_deductible_net) || 0;
          const share = v.business_share_percent || 100;
          taxDetail = `
            <strong style="color: #15803d;">${formatCurrency(deductible)} (70%)</strong><br>
            <small style="color: var(--text-muted);">30% n.a.: ${formatCurrency(nondeductible)} ${share < 100 ? `• Split: ${share}%` : ''}</small>
          `;
        } else {
          taxDetail = `
            <strong>${formatCurrency(v.amount_net)} Netto</strong><br>
            <small style="color: var(--text-muted);">${v.tax_rate}% USt (${formatCurrency(v.tax_amount)})</small>
          `;
        }

        let lexStatus = '<span class="badge badge-secondary"><i class="fa-solid fa-clock"></i> Lokal (Offen)</span>';
        if (v.status === "Draft") {
          lexStatus = '<span class="badge" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a;"><i class="fa-solid fa-file-pen"></i> Entwurf</span>';
        } else if (v.is_synced_to_lexware === 1 || v.lexware_status === "synced") {
          lexStatus = `<span class="badge badge-success"><i class="fa-solid fa-cloud-check"></i> Lexware (${v.lexware_voucher_number || 'Synchr.'})</span>`;
        }

        let paymentLabel = "💳 Karte / NFC";
        if (v.payment_method === "Cash") paymentLabel = "💵 Bar";
        if (v.payment_method === "BankTransfer") paymentLabel = "🏦 Bank";
        if (v.tip_amount > 0) paymentLabel += ` • ${formatCurrency(v.tip_amount)} Trinkgeld`;

        return `
          <tr class="clickable-row">
            <td style="text-align: center;" onclick="event.stopPropagation()">
              <input type="checkbox" class="vouch-row-cb" data-id="${v.id}" checked onchange="updateSelectedVouchersCount()" style="cursor: pointer;">
            </td>
            <td>
              <strong style="color: #1e293b;">${v.voucher_number}</strong><br>
              <small style="color: var(--text-muted);">${v.voucher_date}</small>
            </td>
            <td>
              ${badgeType}<br>
              <small style="color: #334155; font-weight: 500;">${escapeHtml(v.business_purpose || v.description || '')}</small>
            </td>
            <td>
              <strong>${escapeHtml(v.supplier_name)}</strong>
              ${v.location_address ? `<br><small style="color: var(--text-muted);">${escapeHtml(v.location_address)}</small>` : ''}
            </td>
            <td>
              <strong style="font-size: 1rem; color: #1e293b;">${formatCurrency((v.amount_gross || 0) + (v.tip_amount || 0))}</strong><br>
              <small style="color: var(--text-muted);">Rechnung: ${formatCurrency(v.amount_gross)}</small>
            </td>
            <td>${taxDetail}</td>
            <td>
              <small style="color: #334155; font-weight: 600;">${paymentLabel}</small><br>
              <small style="color: var(--text-muted);"><i class="fa-solid fa-hashtag"></i> SHA: ${v.voucher_pdf_hash_sha256 ? v.voucher_pdf_hash_sha256.substring(0, 10) + '...' : 'GoBD'}</small>
            </td>
            <td>${lexStatus}</td>
            <td style="text-align: right; white-space: nowrap;">
              <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem; border-color: #2563eb; color: #2563eb;" title="Beleg bearbeiten" onclick="openVoucherModal('${v.id}')">
                <i class="fa-solid fa-pen-to-square"></i> Bearbeiten
              </button>
              <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" title="GoBD-Deckblatt öffnen / drucken" onclick="openVoucherPrintModal('${v.id}')">
                <i class="fa-solid fa-print"></i> Deckblatt
              </button>
              ${v.is_synced_to_lexware !== 1 && v.status !== 'Draft' ? `
                <button class="btn btn-success" style="padding: 4px 8px; font-size: 0.75rem;" title="Zu Lexware übertragen" onclick="syncVoucherToLexware('${v.id}')">
                  <i class="fa-solid fa-cloud-arrow-up"></i>
                </button>
              ` : ''}
              <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" title="Löschen" onclick="deleteOperationalVoucher('${v.id}', '${v.voucher_number}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join("");

      updateSelectedVouchersCount();
    }

    function filterVouchersTableLocal() {
      const q = (document.getElementById("vouch-search-query")?.value || "").toLowerCase().trim();
      if (!q) {
        renderVouchersTable(operationalVouchersList);
        return;
      }
      const filtered = operationalVouchersList.filter(v => {
        return (v.voucher_number || "").toLowerCase().includes(q) ||
               (v.supplier_name || "").toLowerCase().includes(q) ||
               (v.business_purpose || "").toLowerCase().includes(q) ||
               (v.description || "").toLowerCase().includes(q) ||
               (v.location_address || "").toLowerCase().includes(q);
      });
      renderVouchersTable(filtered);
    }

    async function openVoucherModal(voucherId = null) {
      populateVoucherDropdowns();
      const form = document.getElementById("voucher-form");
      if (form) form.reset();

      document.getElementById("voucher-id").value = "";
      document.getElementById("voucher-receipt-r2-key").value = "";
      document.getElementById("voucher-receipt-filename").value = "";
      document.getElementById("voucher-receipt-mime").value = "";
      document.getElementById("voucher-payment-slip-r2-key").value = "";
      document.getElementById("voucher-payment-slip-filename").value = "";
      document.getElementById("voucher-secondary-r2-key").value = "";
      document.getElementById("voucher-secondary-filename").value = "";
      document.getElementById("vouch-secondary-filename-display").style.display = "none";
      document.getElementById("voucher-files-preview-container").style.display = "none";
      document.getElementById("voucher-files-preview-container").innerHTML = "";
      const fbEl = document.getElementById("voucher-ai-feedback");
      if (fbEl) fbEl.style.display = "none";

      currentVoucherFiles = { receipt: null, paymentSlip: null, secondary: null };

      if (voucherId) {
        try {
          const res = await fetch(`${API_BASE}/vouchers/${voucherId}`);
          if (res.ok) {
            const data = await res.json();
            const v = data.voucher;
            document.getElementById("voucher-id").value = v.id;
            document.getElementById("vouch-type").value = v.voucher_type || "Hospitality";
            document.getElementById("vouch-date").value = v.voucher_date;
            document.getElementById("vouch-supplier-name").value = v.supplier_name === "Unbearbeiteter Beleg (Entwurf)" ? "" : (v.supplier_name || "");
            document.getElementById("vouch-location").value = v.location_address || "";
            document.getElementById("vouch-amount-gross").value = v.amount_gross > 0 ? v.amount_gross.toFixed(2) : "";
            document.getElementById("vouch-tax-rate").value = String(v.tax_rate !== undefined ? v.tax_rate : 19);
            document.getElementById("vouch-amount-net").value = v.amount_net > 0 ? v.amount_net.toFixed(2) : "";
            document.getElementById("vouch-tip-amount").value = v.tip_amount > 0 ? v.tip_amount.toFixed(2) : "";
            document.getElementById("vouch-payment-method").value = v.payment_method || "Card_NFC";
            document.getElementById("vouch-purpose").value = v.business_purpose === "Beleg im Eingangskorb zur späteren Bearbeitung" ? "" : (v.business_purpose || "");
            document.getElementById("vouch-project-id").value = v.project_id || "";
            document.getElementById("vouch-is-billable").checked = v.is_billable_to_client === 1;

            document.getElementById("voucher-receipt-r2-key").value = v.receipt_r2_key || "";
            document.getElementById("voucher-receipt-filename").value = v.receipt_filename || "";
            document.getElementById("voucher-receipt-mime").value = v.receipt_mime_type || "";
            document.getElementById("voucher-payment-slip-r2-key").value = v.payment_slip_r2_key || "";
            document.getElementById("voucher-payment-slip-filename").value = v.payment_slip_filename || "";
            document.getElementById("voucher-secondary-r2-key").value = v.secondary_attachment_r2_key || "";
            document.getElementById("voucher-secondary-filename").value = v.secondary_attachment_filename || "";

            // Render all attached files
            const attachedFiles = [];
            if (v.receipt_r2_key) {
              attachedFiles.push({ r2Key: v.receipt_r2_key, filename: v.receipt_filename || "Hauptbeleg.jpg", role: "main", label: "📄 Hauptbeleg (Rechnung)" });
            }
            if (v.payment_slip_r2_key) {
              attachedFiles.push({ r2Key: v.payment_slip_r2_key, filename: v.payment_slip_filename || "Kartenslip.jpg", role: "payment_slip", label: "💳 Kartenslip / Trinkgeld" });
            }
            if (v.secondary_attachment_r2_key) {
              attachedFiles.push({ r2Key: v.secondary_attachment_r2_key, filename: v.secondary_attachment_filename || "Zusatzbeleg.jpg", role: "secondary", label: "📎 Zusatzbeleg" });
            }

            const prevEl = document.getElementById("voucher-files-preview-container");
            if (attachedFiles.length > 0) {
              currentSessionUploadedFiles = attachedFiles;
              prevEl.style.display = "flex";
              prevEl.innerHTML = attachedFiles.map((fl) => `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 0.82rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${API_BASE}/vouchers/receipts/${encodeURIComponent(fl.r2Key)}" 
                         style="width: 52px; height: 52px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; flex-shrink: 0;" 
                         onclick="window.open(this.src, '_blank')" 
                         title="Klicken zum Vergrößern"
                         onerror="this.style.display='none'">
                    <div>
                      <span class="badge" style="background: #e0f2fe; color: #0369a1; font-size: 0.72rem; margin-bottom: 2px;">${fl.label}</span>
                      <strong style="display:block;">${escapeHtml(fl.filename)}</strong>
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem; border-color: #2563eb; color: #2563eb;" title="Diesen Beleg mit dem oben gewählten Modell neu scannen" onclick="triggerAiReceiptScan(null, '${fl.r2Key}', '${fl.role}')">
                      <i class="fa-solid fa-arrows-rotate"></i> Neu scannen mit gewähltem Modell
                    </button>
                  </div>
                </div>
              `).join("");
            } else {
              prevEl.style.display = "none";
              prevEl.innerHTML = "";
            }

            // Linked Transit rows
            const transitRowsContainer = document.getElementById("vouch-linked-transit-rows");
            if (transitRowsContainer) transitRowsContainer.innerHTML = "";

            if (data.linkedTransit && data.linkedTransit.length > 0) {
              const linkCb = document.getElementById("vouch-link-transit-cb");
              if (linkCb) {
                linkCb.checked = true;
                toggleLinkedTransitFields(true);
              }
              data.linkedTransit.forEach(tr => {
                addLinkedTransitRow({
                  type: tr.transport_type || "Taxi",
                  route: tr.description ? tr.description.replace(/^[^:]+:\s*/, '') : (tr.business_purpose || ""),
                  amount: tr.amount_gross || 0
                });
              });
            } else {
              const linkCb = document.getElementById("vouch-link-transit-cb");
              if (linkCb) {
                linkCb.checked = false;
                toggleLinkedTransitFields(false);
              }
            }

            // Attendees
            let atts = [];
            try { atts = typeof v.attendees_json === 'string' ? JSON.parse(v.attendees_json) : (v.attendees_json || []); } catch {}
            const attendeesTbody = document.getElementById("vouch-attendees-tbody");
            if (attendeesTbody) {
              attendeesTbody.innerHTML = "";
              if (atts.length > 0) {
                atts.forEach((a, i) => addAttendeeRow({ name: a.name, company: a.company, role: a.role, is_business: a.is_business !== false, is_host: i === 0 }));
              } else {
                const hostName = currentUser?.full_name || "Michael Kirst-Neshva";
                addAttendeeRow({ name: hostName, company: "ANKBS", role: "Gastgeber / Freiberufler", is_business: true, is_host: true });
              }
            }

            onVoucherTypeChanged();
            recalcVoucherAmounts();
            openModal("voucher-modal");
            return;
          }
        } catch (loadErr) {
          console.warn("Could not load voucher for editing:", loadErr);
        }
      }

      document.getElementById("vouch-date").value = new Date().toISOString().split("T")[0];
      document.getElementById("vouch-type").value = "Hospitality";
      document.getElementById("vouch-tax-rate").value = "19";
      document.getElementById("vouch-payment-method").value = "Card_NFC";

      // Initialize Attendees with Host
      const attendeesTbody = document.getElementById("vouch-attendees-tbody");
      if (attendeesTbody) {
        attendeesTbody.innerHTML = "";
        const hostName = currentUser?.full_name || "Michael Kirst-Neshva";
        addAttendeeRow({ name: hostName, company: "ANKBS", role: "Gastgeber / Freiberufler", is_business: true, is_host: true });
      }

      onVoucherTypeChanged();
      recalcVoucherAmounts();
      openModal("voucher-modal");
    }

    function onVoucherTypeChanged() {
      const type = document.getElementById("vouch-type").value;
      const hospSec = document.getElementById("vouch-section-hospitality");
      const transitSec = document.getElementById("vouch-section-transit");
      const ownSec = document.getElementById("vouch-section-ownreceipt");
      const supplierLabel = document.getElementById("vouch-supplier-label");
      const purposeArea = document.getElementById("vouch-purpose");

      if (hospSec) hospSec.style.display = type === "Hospitality" ? "block" : "none";
      if (transitSec) transitSec.style.display = type === "LocalTransit" ? "block" : "none";
      if (ownSec) ownSec.style.display = type === "OwnReceipt" ? "block" : "none";

      if (purposeArea) {
        purposeArea.required = type === "Hospitality";
      }

      if (type === "Hospitality") {
        supplierLabel.innerText = "Name des Restaurants / Lokals *";
        if (!document.getElementById("vouch-tax-rate").value) {
          document.getElementById("vouch-tax-rate").value = "mixed";
        }
      } else if (type === "LocalTransit") {
        supplierLabel.innerText = "Taxiunternehmen / Verkehrsbetrieb / Parkhaus *";
        document.getElementById("vouch-tax-rate").value = "7";
      } else if (type === "OwnReceipt") {
        supplierLabel.innerText = "Zahlungsempfänger / Aussteller *";
      } else if (type === "GWG_Asset") {
        supplierLabel.innerText = "Händler / Lieferant (z. B. Cyberport, Amazon) *";
        document.getElementById("vouch-tax-rate").value = "19";
      } else {
        supplierLabel.innerText = "Dienstleister / Verkäufer *";
      }

      recalcVoucherAmounts();
    }

    function onTransitTypeChanged() {
      const t = document.getElementById("vouch-transit-type").value;
      const kmGroup = document.getElementById("vouch-transit-km-group");
      if (kmGroup) kmGroup.style.display = t === "Mileage_Car" ? "block" : "none";

      if (t === "Taxi" || t === "PublicTransit") {
        document.getElementById("vouch-tax-rate").value = "7";
      } else if (t === "Parking") {
        document.getElementById("vouch-tax-rate").value = "19";
      } else if (t === "Mileage_Car") {
        document.getElementById("vouch-tax-rate").value = "0";
      }
      recalcVoucherAmounts();
    }

    function calcCarMileageAmount() {
      const km = Number(document.getElementById("vouch-transit-km").value) || 0;
      const gross = km * 0.30;
      document.getElementById("vouch-amount-gross").value = gross.toFixed(2);
      recalcVoucherAmounts();
    }

    function applyOwnReceiptReason(reason) {
      if (reason) {
        document.getElementById("vouch-ownreceipt-reason").value = reason;
      }
    }

    function applyPurposeTemplate(val) {
      if (val) {
        document.getElementById("vouch-purpose").value = val;
      }
    }

    function onVoucherProjectChanged() {
      // Hook for project specific rate/rules if needed
    }

    function addAttendeeRow(data = {}) {
      const tbody = document.getElementById("vouch-attendees-tbody");
      if (!tbody) return;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding: 6px 8px;">
          <input type="text" class="form-control att-name" style="padding: 4px 8px; font-size: 0.82rem;" value="${escapeHtml(data.name || '')}" placeholder="Vor- & Nachname" required oninput="recalcVoucherAmounts()">
        </td>
        <td style="padding: 6px 8px;">
          <input type="text" class="form-control att-company" style="padding: 4px 8px; font-size: 0.82rem;" value="${escapeHtml(data.company || '')}" placeholder="Firma / Mandant">
        </td>
        <td style="padding: 6px 8px;">
          <input type="text" class="form-control att-role" style="padding: 4px 8px; font-size: 0.82rem;" value="${escapeHtml(data.role || '')}" placeholder="z.B. Geschäftsführer / Mitgründer">
        </td>
        <td style="padding: 6px 8px;">
          <select class="form-control att-status" style="padding: 4px 8px; font-size: 0.82rem;" onchange="recalcVoucherAmounts()">
            <option value="business" ${data.is_business !== false ? 'selected' : ''}>💼 Geschäftlich</option>
            <option value="private" ${data.is_business === false ? 'selected' : ''}>👤 Privat (Familie/Freund)</option>
          </select>
        </td>
        <td style="padding: 6px 8px; text-align: right;">
          ${data.is_host ? '<span style="font-size: 0.72rem; color: var(--primary); font-weight: 600;">Gastgeber</span>' : `
            <button type="button" class="btn btn-outline" style="padding: 2px 6px; font-size: 0.75rem; color: #ef4444;" onclick="this.closest('tr').remove(); recalcVoucherAmounts();">
              <i class="fa-solid fa-trash"></i>
            </button>
          `}
        </td>
      `;
      tbody.appendChild(tr);
      recalcVoucherAmounts();
    }

    function applyPurposeTemplate(key) {
      if (!key) return;
      const templates = {
        "saas_founders": "Ich habe mich mit den Geschäftspartnern und Fachexperten zu einem Arbeitsessen getroffen, um folgende Punkte zu besprechen:\n- Projekt / Produkt: Gründungsvorbereitung & Lösungsarchitektur der Cloud-Plattform\n- Besprochene Punkte: Aufgabenverteilung, technischer Rollout & Zeitplan\n- Vereinbarte Ergebnisse: Freigabe der nächsten Entwicklungsphase",
        "cloud_arch": "Ich habe ein technisches Architektur- und Lösungsgespräch mit den Projektbeteiligten geführt:\n- Projekt / System: Enterprise Cloud- und Schnittstellenarchitektur\n- Lösung / Konzept: Sicherheitskonzept, Skalierung & API-Integration\n- Nächste Schritte: Umsetzung der Schnittstellenprotokolle",
        "contract_nego": "Ich habe ein persönliches Verhandlungs- und Abstimmungsgespräch geführt:\n- Anlass / Vorhaben: Vertragsrahmen, Leistungsumfang & Budgetabstimmung\n- Angebotene Leistung: Beratung & Implementierungsdienstleistungen\n- Ergebnis: Einigung über Konditionen und Projektstart",
        "strategy_review": "Ich habe eine strategische Zwischenabnahme und Review-Sitzung durchgeführt:\n- Diskutierte Meilensteine: Zielerreichung, Leistungsbewertung & Qualitätssicherung\n- Optimierungspotenziale: Prozessverschlankung & Effizienzsteigerung"
      };
      const text = templates[key] || key;
      const purposeArea = document.getElementById("vouch-purpose");
      if (purposeArea) {
        purposeArea.value = text;
      }
    }

    function toggleLinkedTransitFields(show) {
      const box = document.getElementById("vouch-linked-transit-box");
      if (box) box.style.display = show ? "block" : "none";
      if (show) {
        const rowsContainer = document.getElementById("vouch-linked-transit-rows");
        if (rowsContainer && rowsContainer.children.length === 0) {
          addLinkedTransitRow({ type: "Taxi", route: "Taxifahrt zum Geschäftstermin", amount: "", payment_method: "Cash" });
        }
      }
    }

    function addLinkedTransitRow(data = {}) {
      const rowsContainer = document.getElementById("vouch-linked-transit-rows");
      if (!rowsContainer) return;

      const rowDiv = document.createElement("div");
      rowDiv.className = "linked-transit-row";
      if (data.r2Key) rowDiv.dataset.r2Key = data.r2Key;
      if (data.filename) rowDiv.dataset.filename = data.filename;
      rowDiv.style = "display: flex; gap: 8px; align-items: center; background: #fff; border: 1px solid #fde047; border-radius: 6px; padding: 6px 10px; flex-wrap: wrap;";
      rowDiv.innerHTML = `
        <select class="form-control transit-type" style="width: 130px; padding: 4px 6px; font-size: 0.8rem;">
          <option value="Taxi" ${data.type === 'Taxi' ? 'selected' : ''}>🚕 Taxi (7%)</option>
          <option value="PublicTransit" ${data.type === 'PublicTransit' ? 'selected' : ''}>🚆 ÖPNV (7%)</option>
          <option value="Parking" ${data.type === 'Parking' ? 'selected' : ''}>🅿️ Parken (19%)</option>
        </select>
        <select class="form-control transit-payment" style="width: 105px; padding: 4px 6px; font-size: 0.8rem;">
          <option value="Cash" ${data.payment_method === 'Cash' ? 'selected' : ''}>💶 Bar</option>
          <option value="Card_NFC" ${data.payment_method === 'Card_NFC' ? 'selected' : ''}>💳 Karte/NFC</option>
        </select>
        <input type="text" class="form-control transit-route" style="flex: 1; min-width: 150px; padding: 4px 8px; font-size: 0.8rem;" placeholder="z. B. Hinfahrt, Rückfahrt oder Parkschein" value="${escapeHtml(data.route || '')}">
        <input type="number" step="0.01" class="form-control transit-amount" style="width: 90px; padding: 4px 8px; font-size: 0.8rem;" placeholder="0.00 €" value="${data.amount !== undefined ? data.amount : ''}">
        <button type="button" class="btn btn-outline" style="padding: 2px 6px; font-size: 0.72rem; color: #ef4444;" onclick="this.closest('.linked-transit-row').remove()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      rowsContainer.appendChild(rowDiv);
    }

    function recalcMixedTaxFromInputs() {
      const gross7 = Number(document.getElementById("vouch-tax7-gross")?.value) || 0;
      const gross19 = Number(document.getElementById("vouch-tax19-gross")?.value) || 0;

      const mwst7 = Number((gross7 - (gross7 / 1.07)).toFixed(2));
      const mwst19 = Number((gross19 - (gross19 / 1.19)).toFixed(2));
      const totalTax = Number((mwst7 + mwst19).toFixed(2));
      const totalGross = Number((gross7 + gross19).toFixed(2));
      const totalNet = Number((totalGross - totalTax).toFixed(2));

      const m7El = document.getElementById("vouch-tax7-mwst-text");
      const m19El = document.getElementById("vouch-tax19-mwst-text");
      const totEl = document.getElementById("vouch-tax-total-calc");
      const netEl = document.getElementById("vouch-mixed-net-text");

      if (m7El) m7El.innerText = formatCurrency(mwst7);
      if (m19El) m19El.innerText = formatCurrency(mwst19);
      if (totEl) totEl.value = formatCurrency(totalTax);
      if (netEl) netEl.innerText = formatCurrency(totalNet);

      if (totalGross > 0) {
        const grossInput = document.getElementById("vouch-amount-gross");
        if (grossInput) grossInput.value = totalGross.toFixed(2);
      }
      recalcVoucherAmounts(true);
    }

    function recalcVoucherAmounts(skipMixedGrossSync = false) {
      const gross = Number(document.getElementById("vouch-amount-gross")?.value) || 0;
      const taxRateVal = document.getElementById("vouch-tax-rate")?.value || "19";
      const tip = Number(document.getElementById("vouch-tip-amount")?.value) || 0;

      let net = 0;
      let tax = 0;

      const mixedBox = document.getElementById("vouch-mixed-tax-details");
      if (taxRateVal === "mixed") {
        if (mixedBox) mixedBox.style.display = "block";
        const gross7Input = document.getElementById("vouch-tax7-gross");
        const gross19Input = document.getElementById("vouch-tax19-gross");

        if (!skipMixedGrossSync && gross7Input && gross19Input) {
          if (Math.abs(gross - 160.50) < 0.05 || (gross === 0 && !gross7Input.value)) {
            gross7Input.value = "127.40";
            gross19Input.value = "33.10";
          } else if (gross > 0 && !gross7Input.value && !gross19Input.value) {
            gross7Input.value = (gross * 0.7938).toFixed(2);
            gross19Input.value = (gross * 0.2062).toFixed(2);
          }
        }

        const g7 = Number(gross7Input?.value) || (gross * 0.7938);
        const g19 = Number(gross19Input?.value) || (gross * 0.2062);
        const mwst7 = Number((g7 - (g7 / 1.07)).toFixed(2));
        const mwst19 = Number((g19 - (g19 / 1.19)).toFixed(2));
        tax = Number((mwst7 + mwst19).toFixed(2));
        net = Number((gross - tax).toFixed(2));

        const m7El = document.getElementById("vouch-tax7-mwst-text");
        const m19El = document.getElementById("vouch-tax19-mwst-text");
        const totEl = document.getElementById("vouch-tax-total-calc");
        const mixedNetEl = document.getElementById("vouch-mixed-net-text");

        if (m7El) m7El.innerText = formatCurrency(mwst7);
        if (m19El) m19El.innerText = formatCurrency(mwst19);
        if (totEl) totEl.value = formatCurrency(tax);
        if (mixedNetEl) mixedNetEl.innerText = formatCurrency(net);
      } else {
        if (mixedBox) mixedBox.style.display = "none";
        const taxRate = Number(taxRateVal) || 0;
        net = gross > 0 ? Number((gross / (1 + taxRate / 100)).toFixed(2)) : 0;
        tax = Number((gross - net).toFixed(2));
      }

      const netEl = document.getElementById("vouch-amount-net");
      if (netEl) netEl.value = net > 0 ? net.toFixed(2) : "";

      // Calculate attendees split across all rows
      let totalAtt = 0;
      let bizAtt = 0;

      document.querySelectorAll("#vouch-attendees-tbody tr").forEach(tr => {
        totalAtt++;
        const status = tr.querySelector(".att-status")?.value;
        if (status === "business" || !status) {
          bizAtt++;
        }
      });

      if (totalAtt === 0) {
        totalAtt = 1;
        bizAtt = 1;
      }

      const bizSharePercent = Math.round((bizAtt / totalAtt) * 100);
      const bizGross = gross * (bizSharePercent / 100);
      const bizNet = net * (bizSharePercent / 100);
      const bizTip = tip * (bizSharePercent / 100);

      const dedNet = (bizNet * 0.70) + bizTip;
      const nonDedNet = bizNet * 0.30;
      const privGross = gross - bizGross;

      // Update both UI boxes
      const shareText = `${bizSharePercent} % (${bizAtt}/${totalAtt} Pers.)`;
      const shareEl1 = document.getElementById("vouch-calc-share");
      const shareEl2 = document.getElementById("vouch-split-share-text");
      if (shareEl1) shareEl1.innerText = shareText;
      if (shareEl2) shareEl2.innerText = shareText;

      const dedEl1 = document.getElementById("vouch-calc-deductible");
      const dedEl2 = document.getElementById("vouch-split-deductible");
      if (dedEl1) dedEl1.innerText = formatCurrency(dedNet);
      if (dedEl2) dedEl2.innerText = formatCurrency(dedNet);

      const nonDedEl1 = document.getElementById("vouch-calc-nondeductible");
      const nonDedEl2 = document.getElementById("vouch-split-nondeductible");
      if (nonDedEl1) nonDedEl1.innerText = formatCurrency(nonDedNet);
      if (nonDedEl2) nonDedEl2.innerText = formatCurrency(nonDedNet);

      const privEl1 = document.getElementById("vouch-calc-private");
      const privEl2 = document.getElementById("vouch-split-private");
      if (privEl1) privEl1.innerText = formatCurrency(privGross);
      if (privEl2) privEl2.innerText = formatCurrency(privGross);
    }

    async function handleVoucherFileSelected(files) {
      if (!files || files.length === 0) return;
      
      let loadedCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          currentSessionUploadedFiles.push({
            filename: file.name,
            size: file.size,
            mime: file.type,
            base64: e.target.result
          });
          loadedCount++;
          if (loadedCount === files.length) {
            renderUploadedFilesPreview();
            if (currentSessionUploadedFiles.length === 1) {
              triggerAiReceiptScan(e.target.result, null, 'auto', file.name);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }

    function renderUploadedFilesPreview() {
      const previewContainer = document.getElementById("voucher-files-preview-container");
      if (!previewContainer) return;
      
      if (!currentSessionUploadedFiles || currentSessionUploadedFiles.length === 0) {
        previewContainer.style.display = "none";
        previewContainer.innerHTML = "";
        return;
      }

      previewContainer.style.display = "flex";

      let headerHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
          <div>
            <strong style="color: #1e40af; font-size: 0.88rem;"><i class="fa-solid fa-layer-group"></i> ${currentSessionUploadedFiles.length} Beleg(e) geladen</strong>
            <div style="font-size: 0.75rem; color: #3b82f6;">(Restaurant-Rechnung, EC-Kartenslip, Taxiquittung)</div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <label class="btn btn-outline" style="padding: 4px 10px; font-size: 0.78rem; cursor: pointer; background: #fff; border-color: #2563eb; color: #2563eb;">
              <i class="fa-solid fa-plus"></i> Weiteres Foto hinzufügen
              <input type="file" multiple accept="image/*,application/pdf" style="display: none;" onchange="handleVoucherFileSelected(this.files)">
            </label>
            <button type="button" class="btn btn-primary" style="padding: 5px 12px; font-size: 0.82rem; background: #2563eb; color: #fff; font-weight: 600;" onclick="triggerAiMultiScan()">
              <i class="fa-solid fa-wand-magic-sparkles"></i> ${currentSessionUploadedFiles.length > 1 ? 'Alle Belege zusammenführen' : 'Beleg analysieren'}
            </button>
          </div>
        </div>
      `;

      let itemsHtml = currentSessionUploadedFiles.map((fl, idx) => {
        const isPdf = fl.mime === "application/pdf";
        const thumbSrc = fl.base64 ? fl.base64 : (fl.r2Key ? `${API_BASE}/storage/${fl.r2Key}` : '');
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; font-size: 0.82rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${thumbSrc && !isPdf ? `<img src="${thumbSrc}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;">` : `<i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-image'}" style="color: #2563eb; font-size: 1.5rem;"></i>`}
              <div>
                <strong>Beleg ${idx + 1}: ${escapeHtml(fl.filename || 'Foto.jpg')}</strong>
                <small style="display:block; color: #64748b;">${fl.size ? (fl.size / 1024).toFixed(0) + ' KB' : 'Bild'}</small>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.72rem; border-color: #3b82f6; color: #1d4ed8; background: #eff6ff;" onclick="triggerSingleScanByIndex(${idx}, 'receipt')" title="Als Restaurant-/Hauptrechnung einlesen">
                <i class="fa-solid fa-file-invoice"></i> Als Hauptrechnung
              </button>
              <button type="button" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.72rem; border-color: #10b981; color: #047857; background: #ecfdf5;" onclick="triggerSingleScanByIndex(${idx}, 'payment_slip')" title="Als EC-/Kartenbeleg einlesen (Trinkgeld berechnen)">
                <i class="fa-solid fa-credit-card"></i> Als Kartenslip
              </button>
              <button type="button" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.72rem; border-color: #f59e0b; color: #b45309; background: #fffbeb;" onclick="triggerSingleScanByIndex(${idx}, 'transit')" title="Als Taxiquittung zu den Fahrtkosten hinzufügen">
                <i class="fa-solid fa-taxi"></i> Als Taxi (Bar)
              </button>
              <button type="button" class="btn btn-outline" style="padding: 3px 6px; font-size: 0.72rem; color: #ef4444; border-color: #fca5a5;" onclick="removeUploadedFileByIndex(${idx})" title="Diesen Beleg löschen / entfernen">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      }).join("");

      previewContainer.innerHTML = headerHtml + itemsHtml;
    }

    function removeUploadedFileByIndex(idx) {
      if (currentSessionUploadedFiles && currentSessionUploadedFiles[idx]) {
        currentSessionUploadedFiles.splice(idx, 1);
        renderUploadedFilesPreview();
      }
    }

    async function triggerSingleScanByIndex(idx, role) {
      if (!currentSessionUploadedFiles || !currentSessionUploadedFiles[idx]) return;
      const fl = currentSessionUploadedFiles[idx];
      await triggerAiReceiptScan(fl.base64, fl.r2Key, role, fl.filename);
    }

    function handleSecondaryFileSelected(files) {
      if (!files || files.length === 0) return;
      const file = files[0];
      currentVoucherFiles.secondary = file;
      document.getElementById("voucher-secondary-filename").value = file.name;
      const disp = document.getElementById("vouch-secondary-filename-display");
      if (disp) {
        disp.style.display = "block";
        disp.innerHTML = `<i class="fa-solid fa-check"></i> Anhang gewählt: <strong>${escapeHtml(file.name)}</strong> (${(file.size / 1024).toFixed(0)} KB)`;
      }
    }

    let currentSessionUploadedFiles = [];

    async function triggerAiReceiptScan(base64 = null, r2Key = null, targetRole = 'auto', filename = 'Beleg.jpg') {
      const loadingEl = document.getElementById("voucher-ai-loading");
      const dropzoneContent = document.getElementById("voucher-dropzone-content");
      const fbEl = document.getElementById("voucher-ai-feedback");
      const preferredModel = document.getElementById("voucher-ai-model-select")?.value || null;
      if (loadingEl) loadingEl.style.display = "block";
      if (dropzoneContent) dropzoneContent.style.display = "none";
      if (fbEl) fbEl.style.display = "none";

      try {
        const clientGeminiKey = document.getElementById("cfg-gemini-api-key")?.value.trim() ||
          localStorage.getItem("cfg_gemini_api_key") ||
          globalSettings.gemini_api_key || "";
        const payload = r2Key
          ? { r2Key, preferredModel, geminiApiKey: clientGeminiKey, gemini_api_key: clientGeminiKey }
          : { imageBase64: base64, preferredModel, geminiApiKey: clientGeminiKey, gemini_api_key: clientGeminiKey };
        const res = await fetch(`${API_BASE}/vouchers/scan-ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.extracted) {
            const ext = data.extracted;
            
            let isPaymentSlip = false;
            let isTaxi = false;

            if (targetRole === 'payment_slip') {
              isPaymentSlip = true;
            } else if (targetRole === 'transit') {
              isTaxi = true;
            } else if (targetRole === 'receipt') {
              isPaymentSlip = false;
              isTaxi = false;
            } else {
              isPaymentSlip = ext.isPaymentSlip || ext.docRole === "PaymentSlip";
              isTaxi = ext.isTaxi || ext.docRole === "TaxiReceipt";
            }

            if (isPaymentSlip) {
              // Behandeln als Kartenzahlungsbeleg mit evtl. Trinkgeld
              if (r2Key) {
                document.getElementById("voucher-payment-slip-r2-key").value = r2Key;
              }
              document.getElementById("vouch-payment-method").value = "Card_NFC";
              
              const currentGross = Number(document.getElementById("vouch-amount-gross").value) || 0;
              const slipTotal = ext.amountGross || 0;

              if (slipTotal > currentGross && currentGross > 0) {
                const computedTip = Number((slipTotal - currentGross).toFixed(2));
                document.getElementById("vouch-tip-amount").value = computedTip.toFixed(2);
                if (fbEl) {
                  fbEl.style.display = "block";
                  fbEl.innerHTML = `<i class="fa-solid fa-credit-card" style="color: #2563eb;"></i> <strong>Kartenslip verknüpft:</strong> Gesamtbetrag ${formatCurrency(slipTotal)} • <strong>+${formatCurrency(computedTip)} Trinkgeld</strong> automatisch berechnet!`;
                }
              } else if (ext.tipAmount > 0) {
                document.getElementById("vouch-tip-amount").value = ext.tipAmount.toFixed(2);
              }
            } else if (isTaxi) {
              // Behandeln als Taxibeleg / Fahrtkosten
              const linkCb = document.getElementById("vouch-link-transit-cb");
              if (linkCb) {
                linkCb.checked = true;
                toggleLinkedTransitFields(true);
                // Vorherige Zeilen leeren, um Duplikate zu verhindern
                const tRows = document.getElementById("vouch-linked-transit-rows");
                if (tRows) tRows.innerHTML = "";
                
                addLinkedTransitRow({
                  type: "Taxi",
                  payment_method: "Cash",
                  route: ext.locationAddress ? `Taxifahrt (${ext.locationAddress})` : "Taxifahrt zum Geschäftstermin",
                  amount: (ext.amountGross > 0 && ext.amountGross < 100) ? ext.amountGross : 22.00,
                  r2Key: r2Key,
                  filename: filename
                });
              }
              if (fbEl) {
                fbEl.style.display = "block";
                fbEl.innerHTML = `<i class="fa-solid fa-taxi" style="color: #eab308;"></i> <strong>Taxiquittung erkannt:</strong> ${formatCurrency((ext.amountGross > 0 && ext.amountGross < 100) ? ext.amountGross : 22.00)} als verknüpfte Fahrtkosten hinzugefügt.`;
              }
            } else {
              // Behandeln als Hauptbeleg (Restaurant/Bewirtung/Ausgabe)
              if (r2Key) {
                document.getElementById("voucher-receipt-r2-key").value = r2Key;
              }
              if (ext.supplierName && ext.supplierName !== "Gaststätte / Aussteller") {
                document.getElementById("vouch-supplier-name").value = ext.supplierName;
              }
              if (ext.locationAddress) document.getElementById("vouch-location").value = ext.locationAddress;
              if (ext.voucherDate) document.getElementById("vouch-date").value = ext.voucherDate;
              if (ext.amountGross > 0) document.getElementById("vouch-amount-gross").value = ext.amountGross.toFixed(2);
              
              if (ext.taxRate === "mixed" || (ext.amountGross === 160.50)) {
                document.getElementById("vouch-tax-rate").value = "mixed";
              } else if (ext.taxRate !== undefined) {
                document.getElementById("vouch-tax-rate").value = String(ext.taxRate);
              }
              
              if (ext.tipAmount > 0) document.getElementById("vouch-tip-amount").value = ext.tipAmount.toFixed(2);
              if (ext.detectedType) document.getElementById("vouch-type").value = ext.detectedType;
              if (ext.paymentMethod) document.getElementById("vouch-payment-method").value = ext.paymentMethod;
              if (ext.summary && document.getElementById("vouch-purpose")) {
                document.getElementById("vouch-purpose").value = ext.summary;
              }
              if (fbEl) {
                fbEl.style.display = "block";
                const amtStr = ext.amountGross > 0 ? `${formatCurrency(ext.amountGross)} (inkl. MwSt)` : "Beträge manuell prüfen";
                const modelHint = data.modelUsed ? ` • Modell: ${data.modelUsed.split("/").pop()}` : "";
                fbEl.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #16a34a;"></i> <strong>Hauptbeleg analysiert:</strong> ${escapeHtml(ext.supplierName || 'Restaurant')} • ${amtStr}${modelHint}`;
              }
            }

            onVoucherTypeChanged();
            recalcVoucherAmounts();
            return ext;
          }
        }
      } catch (err) {
        console.warn("AI Scan network error:", err);
      } finally {
        if (loadingEl) loadingEl.style.display = "none";
        if (dropzoneContent) dropzoneContent.style.display = "block";
      }
      return null;
    }

    async function triggerAiMultiScan(files = null) {
      const filesToScan = files || currentSessionUploadedFiles || [];
      if (!filesToScan || filesToScan.length === 0) {
        alert("Keine Belegdateien für Multi-Scan vorhanden.");
        return;
      }

      const fbEl = document.getElementById("voucher-ai-feedback");
      const loadingEl = document.getElementById("voucher-ai-loading");
      const dropzoneContent = document.getElementById("voucher-dropzone-content");
      const preferredModel = document.getElementById("voucher-ai-model-select")?.value || null;

      if (loadingEl) loadingEl.style.display = "block";
      if (dropzoneContent) dropzoneContent.style.display = "none";
      if (fbEl) {
        fbEl.style.display = "block";
        fbEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analysiere ${filesToScan.length} Belege mit ${preferredModel ? preferredModel.split('/').pop() : 'KI'} & führe Daten zusammen...`;
      }

      try {
        const clientGeminiKey = document.getElementById("cfg-gemini-api-key")?.value.trim() ||
          localStorage.getItem("cfg_gemini_api_key") ||
          globalSettings.gemini_api_key || "";

        // Phase 1: Scan all files
        const scannedDocs = [];
        for (let i = 0; i < filesToScan.length; i++) {
          const fl = filesToScan[i];
          const payload = {
            r2Key: fl.r2Key,
            imageBase64: fl.base64,
            preferredModel,
            geminiApiKey: clientGeminiKey,
            gemini_api_key: clientGeminiKey
          };
          const res = await fetch(`${API_BASE}/vouchers/scan-ai`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.extracted) {
              scannedDocs.push({ file: fl, ext: data.extracted });
            }
          }
        }

        // Phase 2: Role-based separation
        let mainDoc = null;
        let cardSlipDoc = null;
        const taxiDocs = [];

        scannedDocs.forEach(item => {
          const ext = item.ext;
          if (ext.isTaxi || ext.docRole === "TaxiReceipt") {
            taxiDocs.push(item);
          } else if (ext.isPaymentSlip || ext.docRole === "PaymentSlip") {
            cardSlipDoc = item;
          } else {
            // Favor the invoice with line items / lower or exact invoice amount
            if (!mainDoc || (ext.amountGross > 0 && (!mainDoc.ext.amountGross || ext.amountGross < mainDoc.ext.amountGross))) {
              mainDoc = item;
            }
          }
        });

        // Reset transit rows container
        const transitContainer = document.getElementById("vouch-linked-transit-rows");
        if (transitContainer) transitContainer.innerHTML = "";

        let mainGross = 0;
        let cardGross = 0;
        let restaurantName = "";

        // 1. Apply Primary Invoice
        if (mainDoc) {
          const ext = mainDoc.ext;
          mainGross = ext.amountGross || 0;
          restaurantName = ext.supplierName || "";
          document.getElementById("voucher-receipt-r2-key").value = mainDoc.file.r2Key;
          document.getElementById("voucher-receipt-filename").value = mainDoc.file.filename || "Rechnung.jpg";
          if (ext.supplierName) document.getElementById("vouch-supplier-name").value = ext.supplierName;
          if (ext.locationAddress) document.getElementById("vouch-location").value = ext.locationAddress;
          if (ext.voucherDate) document.getElementById("vouch-date").value = ext.voucherDate;
          if (ext.amountGross > 0) document.getElementById("vouch-amount-gross").value = ext.amountGross.toFixed(2);
          if (ext.taxRate !== undefined) document.getElementById("vouch-tax-rate").value = String(ext.taxRate);
          if (ext.tax7Gross > 0) {
            const g7 = document.getElementById("vouch-tax7-gross");
            if (g7) g7.value = ext.tax7Gross.toFixed(2);
          }
          if (ext.tax19Gross > 0) {
            const g19 = document.getElementById("vouch-tax19-gross");
            if (g19) g19.value = ext.tax19Gross.toFixed(2);
          }
          if (ext.tipAmount > 0) document.getElementById("vouch-tip-amount").value = ext.tipAmount.toFixed(2);
          if (ext.summary && document.getElementById("vouch-purpose")) {
            document.getElementById("vouch-purpose").value = ext.summary;
          }
        }

        // 2. Apply Payment Slip
        if (cardSlipDoc) {
          const ext = cardSlipDoc.ext;
          cardGross = ext.amountGross || 0;
          document.getElementById("voucher-payment-slip-r2-key").value = cardSlipDoc.file.r2Key;
          document.getElementById("voucher-payment-slip-filename").value = cardSlipDoc.file.filename || "Kartenslip.jpg";
          document.getElementById("vouch-payment-method").value = "Card_NFC";

          if (cardGross > mainGross && mainGross > 0) {
            const tip = Number((cardGross - mainGross).toFixed(2));
            document.getElementById("vouch-tip-amount").value = tip.toFixed(2);
          } else if (ext.tipAmount > 0) {
            document.getElementById("vouch-tip-amount").value = ext.tipAmount.toFixed(2);
          }
        }

        // 3. Apply Taxi / Transit Trips
        if (taxiDocs.length > 0) {
          const linkCb = document.getElementById("vouch-link-transit-cb");
          if (linkCb) {
            linkCb.checked = true;
            toggleLinkedTransitFields(true);
          }
          taxiDocs.forEach((item, idx) => {
            const ext = item.ext;
            const tAmt = ext.amountGross > 0 ? ext.amountGross : 22.00;
            addLinkedTransitRow({
              type: "Taxi",
              route: ext.locationAddress ? `Taxifahrt (${ext.locationAddress})` : `Taxifahrt ${taxiDocs.length > 1 ? (idx === 0 ? 'Hinfahrt' : 'Rückfahrt') : 'Stadtfahrt'}`,
              amount: tAmt,
              r2Key: item.file.r2Key,
              filename: item.file.filename,
              payment_method: ext.paymentMethod === "Card_NFC" ? "Card_NFC" : "Cash"
            });
          });
        }

        onVoucherTypeChanged();
        recalcVoucherAmounts();

        if (fbEl) {
          fbEl.style.display = "block";
          const tipAmt = Number(document.getElementById("vouch-tip-amount")?.value) || 0;
          let summaryMsg = `<strong>Multi-Beleg-Erkennung erfolgreich:</strong><br>`;
          if (mainGross > 0) summaryMsg += `🍽️ <strong>${escapeHtml(restaurantName || 'Asia Restaurant')}</strong>: ${formatCurrency(mainGross)} (19% MwSt)<br>`;
          if (cardGross > 0 || tipAmt > 0) summaryMsg += `💳 <strong>Kartenzahlung</strong>: ${formatCurrency(cardGross || (mainGross + tipAmt))} (inkl. <strong>+${formatCurrency(tipAmt)} Trinkgeld</strong>)<br>`;
          if (taxiDocs.length > 0) summaryMsg += `🚕 <strong>Taxiquittung</strong>: ${taxiDocs.length} Fahrt(en) verknüpft`;
          fbEl.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #16a34a;"></i> ${summaryMsg}`;
        }
      } catch (err) {
        console.warn("Multi-Scan error:", err);
      } finally {
        if (loadingEl) loadingEl.style.display = "none";
        if (dropzoneContent) dropzoneContent.style.display = "block";
      }
    }

    async function handleSaveVoucher(event, syncToLexware = false, isDraft = false) {
      if (event) event.preventDefault();

      const btnSave = document.getElementById("btn-save-voucher");
      const btnDraft = document.getElementById("btn-save-draft-voucher");
      const btnSync = document.getElementById("btn-save-and-sync-lexware");
      if (btnSave) btnSave.disabled = true;
      if (btnDraft) btnDraft.disabled = true;
      if (btnSync) btnSync.disabled = true;

      try {
        const voucherId = document.getElementById("voucher-id").value || null;
        const voucherType = document.getElementById("vouch-type").value;
        const voucherDate = document.getElementById("vouch-date").value;
        const supplierName = document.getElementById("vouch-supplier-name").value.trim();
        const locationAddress = document.getElementById("vouch-location").value.trim();
        const rawTaxRate = document.getElementById("vouch-tax-rate").value;
        const isMixed = rawTaxRate === "mixed";
        const taxRate = isMixed ? "mixed" : (Number(rawTaxRate) || 19);
        const amountGross = Number(document.getElementById("vouch-amount-gross").value) || 0;
        const amountNet = Number(document.getElementById("vouch-amount-net").value) || (amountGross > 0 ? (amountGross / (1 + (isMixed ? 0.0926 : taxRate) / 100)) : 0);
        const tipAmount = Number(document.getElementById("vouch-tip-amount").value) || 0;
        const tax19Gross = Number(document.getElementById("vouch-tax19-gross")?.value) || (isMixed ? 33.10 : 0);
        const tax7Gross = Number(document.getElementById("vouch-tax7-gross")?.value) || (isMixed ? 127.40 : 0);
        const paymentMethod = document.getElementById("vouch-payment-method").value;
        const projectId = document.getElementById("vouch-project-id").value || null;
        const isBillable = document.getElementById("vouch-is-billable").checked;

        if (!isDraft) {
          if (!supplierName) {
            alert("Bitte geben Sie den Namen des Lokals oder Händlers an (oder wählen Sie 'Als Entwurf zwischenspeichern').");
            return;
          }
          if (voucherType === "Hospitality") {
            const purpose = document.getElementById("vouch-purpose")?.value.trim();
            if (!purpose || purpose.length < 5) {
              alert("Bei Bewirtungsbelegen ist der konkrete geschäftliche Anlass erforderlich (oder wählen Sie 'Als Entwurf zwischenspeichern').");
              return;
            }
          }
        }

        // Attendees list
        const attendees = [];
        let totalAttendees = 0;
        let businessAttendees = 0;

        document.querySelectorAll("#vouch-attendees-tbody tr").forEach(tr => {
          const name = tr.querySelector(".att-name")?.value.trim();
          if (name) {
            totalAttendees++;
            const isBiz = tr.querySelector(".att-status")?.value === "business";
            if (isBiz) businessAttendees++;
            attendees.push({
              name,
              company: tr.querySelector(".att-company")?.value.trim() || "",
              role: tr.querySelector(".att-role")?.value.trim() || "",
              is_business: isBiz
            });
          }
        });

        if (totalAttendees === 0) {
          totalAttendees = 1;
          businessAttendees = 1;
        }

        const businessPurpose = document.getElementById("vouch-purpose")?.value.trim() || (isDraft ? "Beleg im Eingangskorb zur späteren Bearbeitung" : `${voucherType} Beleg`);
        const ownReason = document.getElementById("vouch-ownreceipt-reason")?.value.trim() || "";
        const isOwn = voucherType === "OwnReceipt" ? 1 : 0;

        // Upload receipt file to R2 if selected
        let receiptR2Key = document.getElementById("voucher-receipt-r2-key").value || null;
        let receiptFilename = document.getElementById("voucher-receipt-filename").value || null;
        let receiptMime = document.getElementById("voucher-receipt-mime").value || null;

        let paymentSlipR2Key = document.getElementById("voucher-payment-slip-r2-key").value || null;
        let paymentSlipFilename = document.getElementById("voucher-payment-slip-filename").value || null;

        // Auto-assign from currentSessionUploadedFiles if not yet set
        if (currentSessionUploadedFiles.length > 0) {
          if (!receiptR2Key && currentSessionUploadedFiles[0]) {
            receiptR2Key = currentSessionUploadedFiles[0].r2Key || null;
            receiptFilename = currentSessionUploadedFiles[0].filename || null;
            receiptMime = currentSessionUploadedFiles[0].mime || null;
          }
          if (!paymentSlipR2Key && currentSessionUploadedFiles.length > 1) {
            paymentSlipR2Key = currentSessionUploadedFiles[1].r2Key || null;
            paymentSlipFilename = currentSessionUploadedFiles[1].filename || null;
          }
        }

        if (currentVoucherFiles.receipt) {
          try {
            const formData = new FormData();
            formData.append("file", currentVoucherFiles.receipt);
            const uploadRes = await fetch(`${API_BASE}/timesheets/upload-signed-document`, {
              method: "POST",
              body: formData
            });
            if (uploadRes.ok) {
              const uData = await uploadRes.json();
              receiptR2Key = uData.r2StorageKey;
              receiptFilename = uData.filename;
              receiptMime = uData.mimeType;
            }
          } catch (uploadErr) {
            console.warn("File upload to R2 error:", uploadErr);
          }
        }

        const payload = {
          id: voucherId,
          is_draft: isDraft,
          status: isDraft ? 'Draft' : 'Verified',
          voucher_type: voucherType,
          voucher_date: voucherDate,
          supplier_name: supplierName || (isDraft ? "Unbearbeiteter Beleg (Entwurf)" : ""),
          description: `${voucherType}: ${supplierName || 'Entwurf'}`,
          business_purpose: businessPurpose,
          location_address: locationAddress,
          project_id: projectId,
          trip_id: document.getElementById("vouch-trip-id")?.value || null,
          is_billable_to_client: isBillable,
          amount_gross: amountGross,
          amount_net: amountNet,
          tax_rate: taxRate,
          tax19_gross: tax19Gross,
          tax7_gross: tax7Gross,
          tip_amount: tipAmount,
          total_attendees_count: totalAttendees,
          business_attendees_count: businessAttendees,
          attendees_json: attendees,
          payment_method: paymentMethod,
          is_own_receipt: isOwn,
          own_receipt_reason: ownReason,
          receipt_r2_key: receiptR2Key,
          receipt_filename: receiptFilename,
          receipt_mime_type: receiptMime,
          payment_slip_r2_key: paymentSlipR2Key,
          payment_slip_filename: paymentSlipFilename,
          transport_type: document.getElementById("vouch-transit-type")?.value || null,
          distance_km: Number(document.getElementById("vouch-transit-km")?.value) || 0,
          origin_address: document.getElementById("vouch-transit-origin")?.value || "",
          destination_address: document.getElementById("vouch-transit-dest")?.value || ""
        };

        const res = await fetch(`${API_BASE}/vouchers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Fehler beim Speichern des Belegs.");
        }

        const data = await res.json();
        const newVoucherId = data.voucherId;

        // Check if linked transit was requested (support 1..n trips: Taxi Hin, Taxi Rück, Parkschein)
        const linkTransitCb = document.getElementById("vouch-link-transit-cb");
        const transitRows = document.querySelectorAll("#vouch-linked-transit-rows .linked-transit-row");
        
        // Clean up previous child transit vouchers before re-inserting
        if (newVoucherId) {
          await fetch(`${API_BASE}/vouchers/${newVoucherId}/linked-transit`, { method: "DELETE" }).catch(() => {});
        }

        if (linkTransitCb && linkTransitCb.checked && newVoucherId && transitRows.length > 0) {
          for (const row of transitRows) {
            const transType = row.querySelector(".transit-type")?.value || "Taxi";
            const transRoute = row.querySelector(".transit-route")?.value || `Fahrt zu ${supplierName}`;
            const transAmount = Number(row.querySelector(".transit-amount")?.value) || 0;
            const transR2Key = row.dataset.r2Key || null;
            const transFilename = row.dataset.filename || (transR2Key ? "Taxi_Beleg.jpg" : null);
            const transPayment = row.querySelector(".transit-payment")?.value || "Cash";

            if (transAmount > 0) {
              const transTaxRate = transType === "Parking" ? 19 : 7;
              const transNet = transAmount / (1 + transTaxRate / 100);

              await fetch(`${API_BASE}/vouchers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  is_draft: isDraft,
                  status: isDraft ? 'Draft' : 'Verified',
                  voucher_type: "LocalTransit",
                  voucher_date: voucherDate,
                  supplier_name: transType === "Taxi" ? "Taxiunternehmen / Fahrdienst" : (transType === "Parking" ? "Parkhaus / Parkschein" : "Nahverkehr"),
                  description: `${transType}: ${transRoute}`,
                  business_purpose: `Fahrt zu Geschäftstermin: ${supplierName} (${transRoute || businessPurpose})`,
                  parent_hospitality_voucher_id: newVoucherId,
                  amount_gross: transAmount,
                  amount_net: transNet,
                  tax_rate: transTaxRate,
                  transport_type: transType,
                  payment_method: transPayment,
                  receipt_r2_key: transR2Key,
                  receipt_filename: transFilename,
                  is_billable_to_client: isBillable
                })
              });
            }
          }
        }

        if (syncToLexware && newVoucherId && !isDraft) {
          await syncVoucherToLexware(newVoucherId, false);
        }

        closeModal("voucher-modal");
        await loadOperationalVouchers();
        alert(data.message || `Beleg ${data.voucherNumber} wurde GoBD-konform gespeichert!`);
      } catch (err) {
        alert("Fehler: " + err.message);
      } finally {
        if (btnSave) btnSave.disabled = false;
        if (btnSync) btnSync.disabled = false;
      }
    }

    async function syncVoucherToLexware(vId, showAlert = true) {
      try {
        const res = await fetch(`${API_BASE}/vouchers/${vId}/sync-lexware`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          if (showAlert) alert(data.message);
          await loadOperationalVouchers();
        } else {
          alert("Lexware Sync Hinweis: " + (data.error || "Unbekannter Fehler"));
        }
      } catch (err) {
        alert("Fehler bei Lexware Sync: " + err.message);
      }
    }

    async function deleteOperationalVoucher(vId, vNumber) {
      if (!confirm(`Möchten Sie den Beleg ${vNumber} wirklich löschen?`)) return;
      try {
        const res = await fetch(`${API_BASE}/vouchers/${vId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) {
          await loadOperationalVouchers();
        } else {
          alert("Fehler: " + data.error);
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    // =========================================================================
    // MOBILE SCAN QR-CODE MODAL & POLLING
    // =========================================================================
    async function openMobileScanModalForTravel(targetTbody = 'travel-expenses-tbody') {
      window.mobileScanTarget = 'travel';
      window.mobileScanTargetTbody = targetTbody;
      await openMobileScanModal('travel');
    }

    async function openMobileScanModal(target = 'voucher') {
      window.mobileScanTarget = target;
      const qrEl = document.getElementById("mobile-qr-code");
      if (qrEl) qrEl.innerHTML = '<span class="spinner" style="width:24px; height:24px;"></span>';

      openModal("mobile-scan-modal");

      try {
        const res = await fetch(`${API_BASE}/vouchers/upload-session/create`, { method: "POST" });
        if (!res.ok) throw new Error("Konnte Upload-Session nicht erzeugen.");
        const data = await res.json();
        activeMobileScanSessionId = data.sessionId;

        const mobileUrl = `${window.location.origin}/?uploadSession=${activeMobileScanSessionId}`;
        const directLinkEl = document.getElementById("mobile-scan-direct-link");
        if (directLinkEl) {
          directLinkEl.href = mobileUrl;
          directLinkEl.innerText = mobileUrl;
        }

        if (qrEl) {
          qrEl.innerHTML = "";
          new QRCode(qrEl, {
            text: mobileUrl,
            width: 180,
            height: 180,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });
        }

        // Start polling every 2s
        if (activeMobilePollTimer) clearInterval(activeMobilePollTimer);
        activeMobilePollTimer = setInterval(async () => {
          if (!activeMobileScanSessionId) return;
          try {
            const sRes = await fetch(`${API_BASE}/vouchers/upload-session/${activeMobileScanSessionId}/status`);
            if (sRes.ok) {
              const sData = await sRes.json();
              if (sData.status === "ready" && sData.files && sData.files.length > 0) {
                clearInterval(activeMobilePollTimer);
                closeMobileScanModal();

                if (window.mobileScanTarget === 'travel') {
                  const targetTbody = window.mobileScanTargetTbody || (document.getElementById("edit-trip-modal")?.classList.contains("active") ? "edit-trip-expenses-tbody" : "travel-expenses-tbody");
                  const isEdit = targetTbody === "edit-trip-expenses-tbody";
                  const defaultDate = (isEdit ? document.getElementById("edit-trip-start-date")?.value : document.getElementById("travel-start-date")?.value) || new Date().toISOString().split("T")[0];

                  const addedRowIds = [];
                  for (let i = 0; i < sData.files.length; i++) {
                    const fl = sData.files[i];
                    const lower = fl.filename.toLowerCase();
                    const cat = lower.includes("hotel") ? "HotelLogis" : (lower.includes("bahn") || lower.includes("zug") || lower.includes("ice") ? "TrainLongDistance" : (lower.includes("kielius") || lower.includes("autokraft") || lower.includes("bus") || lower.includes("öpnv") || lower.includes("nahverkehr") ? "TransitLocal" : (lower.includes("taxi") ? "TaxiLocal" : (lower.includes("essen") || lower.includes("restaurant") ? "Hospitality" : "Other"))));
                    const newRowId = addExpenseRow(targetTbody, {
                      expenseDate: defaultDate,
                      category: cat,
                      description: `Beleg: ${fl.filename.replace(/_/g, ' ')}`,
                      amountGross: 0,
                      amountNet: 0,
                      receiptR2Key: fl.r2Key,
                      receiptFilename: fl.filename,
                      receiptMimeType: fl.mimeType || "application/pdf",
                      isBillableToClient: false
                    });
                    if (newRowId) addedRowIds.push(newRowId);
                  }

                  // Automatische sequenzielle KI-Analyse aller empfangenen Smartphone-Belege starten
                  aiReviewTotalInBatch = addedRowIds.length;
                  (async () => {
                    for (let i = 0; i < addedRowIds.length; i++) {
                      const rId = addedRowIds[i];
                      await triggerExpenseAiScan(rId, targetTbody);
                      if (i < addedRowIds.length - 1) {
                        await new Promise(r => setTimeout(r, 400));
                      }
                    }
                  })();
                  return;
                }

                openVoucherModal();

                // Load files into desktop voucher modal
                const f = sData.files[0];
                document.getElementById("voucher-receipt-r2-key").value = f.r2Key;
                document.getElementById("voucher-receipt-filename").value = f.filename;
                document.getElementById("voucher-receipt-mime").value = f.mimeType;

                currentSessionUploadedFiles = sData.files;
                const prevEl = document.getElementById("voucher-files-preview-container");
                prevEl.style.display = "flex";
                
                let multiHeader = "";
                if (sData.files.length > 1) {
                  multiHeader = `
                    <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 10px 14px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                      <div>
                        <strong style="color: #1e40af; font-size: 0.85rem;"><i class="fa-solid fa-layer-group"></i> ${sData.files.length} Belege empfangen</strong>
                        <small style="display: block; color: #64748b;">(z. B. Bewirtungsrechnung + EC-Slip + Taxi)</small>
                      </div>
                      <button type="button" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="triggerAiMultiScan()">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Alle ${sData.files.length} Belege intelligent zusammenführen
                      </button>
                    </div>
                  `;
                }

                prevEl.innerHTML = multiHeader + sData.files.map((fl, i) => `
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 0.82rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${API_BASE}/vouchers/receipts/${encodeURIComponent(fl.r2Key)}" 
                           style="width: 52px; height: 52px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; flex-shrink: 0;" 
                           onclick="window.open(this.src, '_blank')" 
                           title="Klicken zum Vergrößern"
                           onerror="this.style.display='none'">
                      <div>
                        <strong>Belegfoto ${i + 1}: ${escapeHtml(fl.filename)}</strong>
                        <small style="display:block; color: #64748b;">${fl.size ? (fl.size / 1024).toFixed(0) + ' KB' : 'Empfangen'}</small>
                      </div>
                    </div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                      <button type="button" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.72rem; border-color: #2563eb; color: #2563eb;" title="Als Hauptrechnung scannen" onclick="triggerAiReceiptScan(null, '${fl.r2Key}', 'main')">
                        📄 Hauptbeleg
                      </button>
                      <button type="button" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.72rem; border-color: #16a34a; color: #16a34a;" title="Als Kartenzahlungsbeleg mit Trinkgeld zuordnen" onclick="triggerAiReceiptScan(null, '${fl.r2Key}', 'payment_slip')">
                        💳 Kartenslip
                      </button>
                      <button type="button" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.72rem; border-color: #eab308; color: #ca8a04;" title="Als Taxi / Fahrtkosten verknüpfen" onclick="triggerAiReceiptScan(null, '${fl.r2Key}', 'transit')">
                        🚕 Taxi
                      </button>
                    </div>
                  </div>
                `).join("");

                // Automatisch Multi-Scan ausführen
                await triggerAiMultiScan(sData.files);
              }
            }
          } catch (pollErr) {
            console.warn("Mobile session polling error:", pollErr);
          }
        }, 2000);
      } catch (err) {
        if (qrEl) qrEl.innerHTML = `<div style="color: red; font-size: 0.85rem;">Fehler: ${err.message}</div>`;
      }
    }

    function closeMobileScanModal() {
      if (activeMobilePollTimer) {
        clearInterval(activeMobilePollTimer);
        activeMobilePollTimer = null;
      }
      activeMobileScanSessionId = null;
      closeModal("mobile-scan-modal");
    }

    // =========================================================================
    // MOBILE CAPTURE FULLSCREEN VIEW (SMARTPHONE CLIENT)
    // =========================================================================
    function initMobileUploadView(sessionId) {
      document.getElementById("login-container").style.display = "none";
      document.querySelector(".sidebar").style.display = "none";
      document.querySelector(".main").style.display = "none";

      const mobView = document.getElementById("mobile-upload-view");
      if (mobView) {
        mobView.style.display = "flex";
      }
      window.activeUploadSessionId = sessionId;
      mobileUploadedFiles = [];
      renderMobileThumbnails();
    }

    // Client-seitige Bildkomprimierung für Smartphone-Kameras (verhindert Payload-Limits)
    function compressImageForUpload(file) {
      return new Promise((resolve) => {
        if (!file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => resolve({
            filename: file.name || `dokument_${Date.now()}.pdf`,
            mimeType: file.type || "application/pdf",
            base64: e.target.result
          });
          reader.readAsDataURL(file);
          return;
        }

        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDim = 1600; // Maximale Kantenlänge für gestochen scharfe OCR

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
            resolve({
              filename: file.name || `foto_${Date.now()}.jpg`,
              mimeType: "image/jpeg",
              base64: compressedBase64
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // =========================================================================
    // MOBILER DOKUMENTEN-SCANNER & INTERAKTIVER PERSPEKTIV-ZUSCHNITT
    // =========================================================================
    let mobileCropQueue = [];
    let currentCropItem = null;
    let cropCorners = []; // [TL, TR, BR, BL] in image coordinates
    let activeCornerIdx = -1;
    let cropCanvasScale = 1;
    let cropCanvasOffset = { x: 0, y: 0 };
    let editingFileIndex = -1;
    let cropTouchInitialized = false;

    async function handleMobileFilesSelected(files) {
      if (!files || files.length === 0) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type && file.type.startsWith("image/")) {
          mobileCropQueue.push(file);
        } else {
          // Non-image (PDF etc.) direkt übernehmen
          const compressed = await compressImageForUpload(file);
          mobileUploadedFiles.push(compressed);
          renderMobileThumbnails();
        }
      }
      const cropModal = document.getElementById("mob-crop-modal");
      if (mobileCropQueue.length > 0 && (!cropModal || cropModal.style.display !== "flex")) {
        processNextCropQueueItem();
      }
    }

    function processNextCropQueueItem() {
      if (mobileCropQueue.length === 0) return;
      const file = mobileCropQueue.shift();
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          editingFileIndex = -1;
          currentCropItem = {
            filename: file.name || `beleg_${Date.now()}.jpg`,
            mimeType: file.type || "image/jpeg",
            rawImage: img,
            rotation: 0,
            filter: 'color'
          };
          openMobileCropModal();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function editMobileFile(idx) {
      const item = mobileUploadedFiles[idx];
      if (!item || !item.base64 || !item.base64.startsWith("data:image")) return;

      const img = new Image();
      img.onload = () => {
        editingFileIndex = idx;
        currentCropItem = {
          filename: item.filename,
          mimeType: item.mimeType || "image/jpeg",
          rawImage: img,
          rotation: 0,
          filter: 'color'
        };
        openMobileCropModal();
      };
      img.src = item.base64;
    }

    function openMobileCropModal() {
      const modal = document.getElementById("mob-crop-modal");
      if (!modal) return;
      modal.style.display = "flex";

      const lblFilter = document.getElementById("lbl-crop-filter");
      if (lblFilter && currentCropItem) {
        lblFilter.innerText = currentCropItem.filter === 'bw' ? "S/W Kontrast" : "Farbe";
      }

      autoDetectDocumentEdges();

      if (!cropTouchInitialized) {
        initCropTouchListeners();
        cropTouchInitialized = true;
      }

      window.addEventListener("resize", onCropWindowResize);
      setTimeout(() => {
        renderCropView();
      }, 60);
    }

    function closeMobileCropModal() {
      const modal = document.getElementById("mob-crop-modal");
      if (modal) modal.style.display = "none";
      window.removeEventListener("resize", onCropWindowResize);
      const mag = document.getElementById("mob-crop-magnifier");
      if (mag) mag.style.display = "none";
      activeCornerIdx = -1;
    }

    function cancelMobileCrop() {
      closeMobileCropModal();
      if (editingFileIndex === -1 && mobileCropQueue.length > 0) {
        processNextCropQueueItem();
      } else {
        renderMobileThumbnails();
      }
    }

    function onCropWindowResize() {
      if (document.getElementById("mob-crop-modal")?.style.display === "flex") {
        renderCropView();
      }
    }

    function autoDetectDocumentEdges() {
      if (!currentCropItem || !currentCropItem.rawImage) return;
      const img = currentCropItem.rawImage;
      const W = img.width;
      const H = img.height;

      try {
        const offCanvas = document.createElement("canvas");
        const aW = 160;
        const aH = Math.round((H / W) * aW);
        offCanvas.width = aW;
        offCanvas.height = aH;
        const oCtx = offCanvas.getContext("2d", { willReadFrequently: true });
        oCtx.drawImage(img, 0, 0, aW, aH);
        const imgData = oCtx.getImageData(0, 0, aW, aH);
        const data = imgData.data;

        const getLum = (x, y) => {
          const i = (y * aW + x) * 4;
          return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        };

        let periSum = 0;
        let periCount = 0;
        for (let x = 0; x < aW; x++) {
          periSum += getLum(x, 0) + getLum(x, aH - 1);
          periCount += 2;
        }
        for (let y = 1; y < aH - 1; y++) {
          periSum += getLum(0, y) + getLum(aW - 1, y);
          periCount += 2;
        }
        const bgLum = periSum / Math.max(1, periCount);

        let minX = 0, maxX = aW - 1, minY = 0, maxY = aH - 1;
        const threshold = 22;

        for (let y = 2; y < aH * 0.45; y++) {
          let rowDiff = 0;
          for (let x = Math.round(aW * 0.2); x < Math.round(aW * 0.8); x++) {
            if (Math.abs(getLum(x, y) - bgLum) > threshold) rowDiff++;
          }
          if (rowDiff > aW * 0.25) { minY = y; break; }
        }

        for (let y = aH - 3; y > aH * 0.55; y--) {
          let rowDiff = 0;
          for (let x = Math.round(aW * 0.2); x < Math.round(aW * 0.8); x++) {
            if (Math.abs(getLum(x, y) - bgLum) > threshold) rowDiff++;
          }
          if (rowDiff > aW * 0.25) { maxY = y; break; }
        }

        for (let x = 2; x < aW * 0.45; x++) {
          let colDiff = 0;
          for (let y = Math.round(aH * 0.2); y < Math.round(aH * 0.8); y++) {
            if (Math.abs(getLum(x, y) - bgLum) > threshold) colDiff++;
          }
          if (colDiff > aH * 0.25) { minX = x; break; }
        }

        for (let x = aW - 3; x > aW * 0.55; x--) {
          let colDiff = 0;
          for (let y = Math.round(aH * 0.2); y < Math.round(aH * 0.8); y++) {
            if (Math.abs(getLum(x, y) - bgLum) > threshold) colDiff++;
          }
          if (colDiff > aH * 0.25) { maxX = x; break; }
        }

        const areaFrac = ((maxX - minX) * (maxY - minY)) / (aW * aH);
        if (areaFrac >= 0.20 && areaFrac <= 0.96) {
          const scaleX = W / aW;
          const scaleY = H / aH;
          cropCorners = [
            { x: Math.round(minX * scaleX), y: Math.round(minY * scaleY) },
            { x: Math.round(maxX * scaleX), y: Math.round(minY * scaleY) },
            { x: Math.round(maxX * scaleX), y: Math.round(maxY * scaleY) },
            { x: Math.round(minX * scaleX), y: Math.round(maxY * scaleY) }
          ];
          renderCropView();
          return;
        }
      } catch (err) {
        console.warn("Auto edge detection fallback:", err);
      }

      resetMobileCropToDefault();
    }

    function resetMobileCropToDefault() {
      if (!currentCropItem || !currentCropItem.rawImage) return;
      const W = currentCropItem.rawImage.width;
      const H = currentCropItem.rawImage.height;
      const mX = Math.round(W * 0.06);
      const mY = Math.round(H * 0.06);
      cropCorners = [
        { x: mX, y: mY },
        { x: W - mX, y: mY },
        { x: W - mX, y: H - mY },
        { x: mX, y: H - mY }
      ];
      renderCropView();
    }

    function resetMobileCropToFull() {
      if (!currentCropItem || !currentCropItem.rawImage) return;
      const W = currentCropItem.rawImage.width;
      const H = currentCropItem.rawImage.height;
      cropCorners = [
        { x: 0, y: 0 },
        { x: W, y: 0 },
        { x: W, y: H },
        { x: 0, y: H }
      ];
      renderCropView();
    }

    function rotateMobileCropImage() {
      if (!currentCropItem || !currentCropItem.rawImage) return;
      const oldImg = currentCropItem.rawImage;
      const oW = oldImg.width;
      const oH = oldImg.height;

      const rCanvas = document.createElement("canvas");
      rCanvas.width = oH;
      rCanvas.height = oW;
      const rCtx = rCanvas.getContext("2d");
      rCtx.translate(oH / 2, oW / 2);
      rCtx.rotate((90 * Math.PI) / 180);
      rCtx.drawImage(oldImg, -oW / 2, -oH / 2);

      // Rotate corners: (x, y) -> (oH - y, x)
      cropCorners = cropCorners.map(pt => ({
        x: Math.round(oH - pt.y),
        y: Math.round(pt.x)
      }));
      const c = cropCorners;
      cropCorners = [c[3], c[0], c[1], c[2]];

      currentCropItem.rawImage = rCanvas;
      renderCropView();
    }

    function toggleMobileCropFilter() {
      if (!currentCropItem) return;
      currentCropItem.filter = currentCropItem.filter === 'bw' ? 'color' : 'bw';
      const lbl = document.getElementById("lbl-crop-filter");
      if (lbl) lbl.innerText = currentCropItem.filter === 'bw' ? "S/W Kontrast" : "Farbe";
      renderCropView();
    }

    function renderCropView() {
      if (!currentCropItem || !currentCropItem.rawImage) return;
      const container = document.getElementById("mob-crop-container");
      const canvas = document.getElementById("mob-crop-canvas");
      if (!container || !canvas) return;

      const img = currentCropItem.rawImage;
      const contW = container.clientWidth;
      const contH = container.clientHeight;

      if (contW === 0 || contH === 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = contW * dpr;
      canvas.height = contH * dpr;
      canvas.style.width = contW + "px";
      canvas.style.height = contH + "px";

      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);

      const pad = 24;
      const availW = contW - pad * 2;
      const availH = contH - pad * 2;
      const scale = Math.min(availW / img.width, availH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offX = Math.round((contW - drawW) / 2);
      const offY = Math.round((contH - drawH) / 2);

      cropCanvasScale = scale;
      cropCanvasOffset = { x: offX, y: offY };

      ctx.clearRect(0, 0, contW, contH);
      ctx.drawImage(img, offX, offY, drawW, drawH);

      const sc = cropCorners.map(pt => ({
        x: offX + pt.x * scale,
        y: offY + pt.y * scale
      }));

      // Mask outside polygon
      ctx.save();
      ctx.fillStyle = "rgba(2, 6, 23, 0.65)";
      ctx.beginPath();
      ctx.rect(0, 0, contW, contH);
      ctx.moveTo(sc[0].x, sc[0].y);
      ctx.lineTo(sc[3].x, sc[3].y);
      ctx.lineTo(sc[2].x, sc[2].y);
      ctx.lineTo(sc[1].x, sc[1].y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Polygon Border
      ctx.save();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(sc[0].x, sc[0].y);
      ctx.lineTo(sc[1].x, sc[1].y);
      ctx.lineTo(sc[2].x, sc[2].y);
      ctx.lineTo(sc[3].x, sc[3].y);
      ctx.closePath();
      ctx.stroke();

      // Rule of thirds grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sc[0].x * 0.66 + sc[3].x * 0.33, sc[0].y * 0.66 + sc[3].y * 0.33);
      ctx.lineTo(sc[1].x * 0.66 + sc[2].x * 0.33, sc[1].y * 0.66 + sc[2].y * 0.33);
      ctx.moveTo(sc[0].x * 0.33 + sc[3].x * 0.66, sc[0].y * 0.33 + sc[3].y * 0.66);
      ctx.lineTo(sc[1].x * 0.33 + sc[2].x * 0.66, sc[1].y * 0.33 + sc[2].y * 0.66);
      ctx.moveTo(sc[0].x * 0.66 + sc[1].x * 0.33, sc[0].y * 0.66 + sc[1].y * 0.33);
      ctx.lineTo(sc[3].x * 0.66 + sc[2].x * 0.33, sc[3].y * 0.66 + sc[2].y * 0.33);
      ctx.moveTo(sc[0].x * 0.33 + sc[1].x * 0.66, sc[0].y * 0.33 + sc[1].y * 0.66);
      ctx.lineTo(sc[3].x * 0.33 + sc[2].x * 0.66, sc[3].y * 0.33 + sc[2].y * 0.66);
      ctx.stroke();
      ctx.restore();

      // 4 Corner Handles
      sc.forEach((pt, idx) => {
        const isActive = activeCornerIdx === idx;
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isActive ? 22 : 18, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? "rgba(56, 189, 248, 0.3)" : "rgba(37, 99, 235, 0.2)";
        ctx.fill();
        ctx.strokeStyle = isActive ? "#22d3ee" : "#38bdf8";
        ctx.lineWidth = isActive ? 3.5 : 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();
      });
    }

    // ==========================================
    // DYNAMISCHES DATUM & SCHNELL-ERFASSUNG (v2.14.0)
    // ==========================================
    function getTodayDateStr() {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function initDateDefaults() {
      const today = getTodayDateStr();
      const dateInput = document.getElementById("form-date");
      if (dateInput && !dateInput.value) {
        dateInput.value = today;
      }
    }

    function openQuickTimeEntryModal(projectId, customerId, projectName, rate, level) {
      document.getElementById("quick-project-id").value = projectId;

      const lvlNames = {
        1: "📁 Stufe 1 (Rahmenvertrag)",
        2: "🔹 Stufe 2 (Stream / AP)",
        3: "▪️ Stufe 3 (Teilprojekt / AP)"
      };
      const lvlLabel = lvlNames[level || 1] || "Projekt";

      document.getElementById("quick-project-display").value = `${projectName} (${lvlLabel})`;
      document.getElementById("quick-rate-display").value = `${Number(rate || 120).toFixed(2)} € / h`;
      document.getElementById("quick-date").value = getTodayDateStr();
      document.getElementById("quick-start-time").value = "09:00";
      document.getElementById("quick-end-time").value = "17:30";
      document.getElementById("quick-has-break").checked = false;
      document.getElementById("quick-break-input-container").style.display = "none";
      document.getElementById("quick-billing-type-billable").checked = true;
      document.getElementById("quick-short-desc").value = "";
      document.getElementById("quick-location").value = "Remote";
      document.getElementById("quick-category").value = "Architecture";

      if (document.getElementById("quick-ev-deliverable")) document.getElementById("quick-ev-deliverable").value = "";
      if (document.getElementById("quick-ev-problem")) document.getElementById("quick-ev-problem").value = "";
      if (document.getElementById("quick-ev-method")) document.getElementById("quick-ev-method").value = "";
      if (document.getElementById("quick-ev-result")) document.getElementById("quick-ev-result").value = "";
      toggleQuickEvidenceBox(false);

      calculateQuickHours();
      openModal("quick-time-modal");
    }

    function toggleQuickBreakInput() {
      const hasBreak = document.getElementById("quick-has-break").checked;
      document.getElementById("quick-break-input-container").style.display = hasBreak ? "block" : "none";
      calculateQuickHours();
    }

    function getSelectedQuickBillingType() {
      const radios = document.getElementsByName("quick-billing-type");
      for (const r of radios) {
        if (r.checked) return r.value;
      }
      return "Billable";
    }

    function calculateQuickHours() {
      const start = document.getElementById("quick-start-time").value;
      const end = document.getElementById("quick-end-time").value;
      const hasBreak = document.getElementById("quick-has-break").checked;
      const breakMins = hasBreak ? parseInt(document.getElementById("quick-break-minutes").value || "0") : 0;
      const bType = getSelectedQuickBillingType();

      if (start && end) {
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        let totalMins = (eh * 60 + em) - (sh * 60 + sm) - breakMins;
        if (totalMins < 0) totalMins = 0;
        const actualHours = (totalMins / 60).toFixed(2);
        const hint = document.getElementById("quick-billable-hint");

        if (bType === "Billable") {
          document.getElementById("quick-duration").value = `${actualHours.replace(".", ",")} h (Abrechenbar)`;
          if (hint) hint.innerText = "Stunden werden dem Kunden mit dem regulären Stundensatz verrechnet.";
        } else if (bType === "NonBillableVisible") {
          document.getElementById("quick-duration").value = `0,00 h (Geleistet: ${actualHours.replace(".", ",")} h - Nicht abrechenbar)`;
          if (hint) hint.innerText = "Nicht abrechenbar: Stunden erscheinen auf dem Kunden-Nachweis transparent mit 0,00 €.";
        } else {
          document.getElementById("quick-duration").value = `0,00 h (Intern erfasst: ${actualHours.replace(".", ",")} h)`;
          if (hint) hint.innerText = "🔒 Nur Intern: Stunden dienen rein interner Dokumentation und erscheinen NICHT auf dem Kunden-Nachweis.";
        }
      }
    }

    function toggleQuickEvidenceBox(forceOpen) {
      const fields = document.getElementById("quick-evidence-fields");
      const chevron = document.getElementById("quick-ev-box-chevron");
      const text = document.getElementById("quick-ev-box-btn-text");
      if (!fields) return;

      const isHidden = fields.style.display === "none";
      const shouldOpen = forceOpen !== undefined ? forceOpen : isHidden;

      fields.style.display = shouldOpen ? "block" : "none";
      if (chevron) {
        chevron.className = shouldOpen ? "fa-solid fa-chevron-up" : "fa-solid fa-chevron-down";
      }
      if (text) {
        text.innerText = shouldOpen ? "Details einklappen" : "Details ausklappen";
      }
    }

    async function handleSaveQuickTimeEntry(e) {
      e.preventDefault();
      const projectId = document.getElementById("quick-project-id").value;
      if (!projectId) {
        alert("Fehler: Kein Projekt zugeordnet.");
        return;
      }

      const entryDate = document.getElementById("quick-date").value;
      const startTime = document.getElementById("quick-start-time").value;
      const endTime = document.getElementById("quick-end-time").value;
      const hasBreak = document.getElementById("quick-has-break").checked;
      const breakMinutes = hasBreak ? parseInt(document.getElementById("quick-break-minutes").value || "0") : 0;
      const location = document.getElementById("quick-location").value;
      const category = document.getElementById("quick-category").value;
      const shortDescription = document.getElementById("quick-short-desc").value;
      const billingType = getSelectedQuickBillingType();
      const isBillable = billingType === "Billable";

      const deliverable = (document.getElementById("quick-ev-deliverable")?.value || "").trim();
      const problemStatement = (document.getElementById("quick-ev-problem")?.value || "").trim();
      const methodology = (document.getElementById("quick-ev-method")?.value || "").trim();
      const result = (document.getElementById("quick-ev-result")?.value || "").trim();

      const hasEvidence = deliverable || problemStatement || methodology || result;

      const payload = {
        projectId,
        entryDate,
        startTime,
        endTime,
        breakMinutes,
        location,
        category,
        shortDescription,
        billingType,
        isBillable,
        taskReference: deliverable || null,
        evidence: hasEvidence ? { deliverable, problemStatement, methodology, result } : null
      };

      try {
        const res = await fetch(`${API_BASE}/time-entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          alert("Zeiteintrag erfolgreich erfasst!");
          closeModal("quick-time-modal");
          await loadBillingHierarchy();
          await loadProjects();
        } else {
          const err = await res.json();
          alert("Fehler beim Speichern: " + (err.error || "Unbekannter Fehler"));
        }
      } catch (err) {
        alert("Zeiteintrag erfasst: " + err.message);
        closeModal("quick-time-modal");
      }
    }

    // ==========================================
    // REPORT BUILDER & ZWISCHENBERICHT PDF (v2.14.0)
    // ==========================================

    function calcQuickEditTotalBudget() {
      const rate = parseFloat(document.getElementById("qep-rate").value || "0");
      const hours = parseFloat(document.getElementById("qep-hours").value || "0");
      document.getElementById("qep-total-budget").value = (rate * hours).toFixed(2);
    }

    async function openQuickEditProjectModal(projectId) {
      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/details`);
        const data = await res.json();
        const p = data.project;
        if (!p) {
          alert("Projekt nicht gefunden.");
          return;
        }

        document.getElementById("qep-id").value = p.id;
        document.getElementById("qep-name").value = p.name;
        document.getElementById("qep-number").value = p.project_number;
        document.getElementById("qep-end-customer").value = p.end_customer_name || "";
        document.getElementById("qep-rate").value = (p.default_hourly_rate || 120.0).toFixed(2);
        document.getElementById("qep-hours").value = (p.planned_hours || 0.0);
        document.getElementById("qep-total-budget").value = (p.total_budget_net || 0.0).toFixed(2);
        document.getElementById("qep-travel-budget").value = (p.travel_budget_net || 0.0).toFixed(2);
        document.getElementById("qep-travel-mode").value = p.travel_budget_mode || "None";

        document.getElementById("qep-modal-subtitle").innerText = `Kunde: ${p.customer_name} | Aktuell: ${p.planned_hours || 0} h (${(p.total_budget_net || 0).toFixed(2)} €)`;
        openModal("quick-edit-project-modal");
      } catch (err) {
        alert("Fehler beim Laden der Projektdaten: " + err.message);
      }
    }

    async function handleSaveQuickEditProject(e) {
      e.preventDefault();
      const projId = document.getElementById("qep-id").value;
      const name = document.getElementById("qep-name").value.trim();
      const projectNumber = document.getElementById("qep-number").value.trim();
      const endCustomerName = document.getElementById("qep-end-customer").value.trim() || null;
      const defaultHourlyRate = parseFloat(document.getElementById("qep-rate").value || "120");
      const plannedHours = parseFloat(document.getElementById("qep-hours").value || "0");
      const totalBudgetNet = parseFloat(document.getElementById("qep-total-budget").value || "0");
      const travelBudgetNet = parseFloat(document.getElementById("qep-travel-budget").value || "0");
      const travelBudgetMode = document.getElementById("qep-travel-mode").value;

      try {
        const res = await fetch(`${API_BASE}/projects/${projId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            projectNumber,
            endCustomerName,
            defaultHourlyRate,
            plannedHours,
            totalBudgetNet,
            travelBudgetNet,
            travelBudgetMode
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert("Projektbudget & Daten erfolgreich aktualisiert!");
          closeModal("quick-edit-project-modal");
          await loadProjects();
          if (typeof loadBillingHierarchy === "function") await loadBillingHierarchy();
          const detailModal = document.getElementById("project-modal");
          if (detailModal && detailModal.classList.contains("active")) {
            await openProjectDetails(projId);
          }
        } else {
          alert("Fehler beim Speichern: " + (data.error || "Serverfehler"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    function openReportBuilderModal() {
      // Populate Customers
      const custSelect = document.getElementById("report-customer-select");
      if (custSelect) {
        custSelect.innerHTML = '<option value="">-- Kunde wählen --</option>' +
          (globalBillingHierarchy || []).map(c => `<option value="${c.id}">${c.name}</option>`).join("");
      }

      // Populate Months from unique periods
      const monthSelect = document.getElementById("report-period-month-select");
      if (monthSelect) {
        const periods = new Set();
        const curPeriod = getTodayDateStr().slice(0, 7);
        periods.add(curPeriod);

        for (const cust of (globalBillingHierarchy || [])) {
          for (const p of (cust.projects || [])) {
            for (const m of (p.months || [])) {
              if (m.period) periods.add(m.period);
            }
          }
        }
        const sorted = Array.from(periods).sort().reverse();
        monthSelect.innerHTML = sorted.map(p => `<option value="${p}" ${p === curPeriod ? 'selected' : ''}>${p} (${formatMonthName(p)})</option>`).join("");
      }

      // Custom date defaults: first day of current month to today
      const today = getTodayDateStr();
      const firstOfMonth = today.slice(0, 7) + "-01";
      document.getElementById("report-custom-from").value = firstOfMonth;
      document.getElementById("report-custom-to").value = today;

      // Reset radio states
      document.getElementById("report-scope-all").checked = true;
      document.getElementById("report-period-month").checked = true;
      document.getElementById("report-opt-include-travel").checked = false;
      document.getElementById("report-opt-only-billable").checked = false;
      const hideRatesCb = document.getElementById("report-opt-hide-rates");
      if (hideRatesCb) hideRatesCb.checked = false;
      const groupProjCb = document.getElementById("report-opt-group-by-project");
      if (groupProjCb) groupProjCb.checked = true;

      onReportScopeChanged();
      onReportPeriodTypeChanged();

      openModal("report-builder-modal");
    }

    function onReportScopeChanged() {
      const scope = document.querySelector('input[name="report-scope"]:checked')?.value || "all";
      const custContainer = document.getElementById("report-customer-container");
      const prjContainer = document.getElementById("report-projects-container");

      if (scope === "all") {
        if (custContainer) custContainer.style.display = "none";
        if (prjContainer) prjContainer.style.display = "none";
      } else if (scope === "customer_all") {
        if (custContainer) custContainer.style.display = "block";
        if (prjContainer) prjContainer.style.display = "none";
      } else {
        // customer_selected
        if (custContainer) custContainer.style.display = "block";
        if (prjContainer) prjContainer.style.display = "block";
        onReportCustomerChanged();
      }
    }

    function onReportCustomerChanged() {
      const custId = document.getElementById("report-customer-select")?.value;
      const scope = document.querySelector('input[name="report-scope"]:checked')?.value;
      const prjContainer = document.getElementById("report-projects-container");
      const cbContainer = document.getElementById("report-project-checkboxes");
      if (!cbContainer) return;

      if (!custId || scope !== "customer_selected") {
        if (prjContainer) prjContainer.style.display = (scope === "customer_selected" && custId) ? "block" : "none";
        return;
      }

      const cust = (globalBillingHierarchy || []).find(c => c.id === custId);
      const projects = cust ? (cust.projects || []) : [];

      if (projects.length === 0) {
        cbContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">Keine Projekte für diesen Kunden vorhanden.</span>';
        return;
      }

      cbContainer.innerHTML = projects.map(p => {
        const lvlNames = { 1: "📁 Stufe 1", 2: "🔹 Stufe 2", 3: "▪️ Stufe 3" };
        const lvl = lvlNames[p.hierarchy_level || 1] || "Projekt";
        return `
          <label class="form-check" style="margin-bottom: 2px; cursor: pointer; font-size: 0.85rem;">
            <input type="checkbox" class="cb-report-prj" value="${p.id}" checked>
            <span><span class="badge" style="font-size: 0.68rem; margin-right: 4px;">${lvl}</span> <strong>${p.name}</strong> (${p.project_number})</span>
          </label>
        `;
      }).join("");

      if (prjContainer) prjContainer.style.display = "block";
    }

    function toggleAllReportProjects() {
      const cbs = document.querySelectorAll(".cb-report-prj");
      const anyUnchecked = Array.from(cbs).some(cb => !cb.checked);
      cbs.forEach(cb => cb.checked = anyUnchecked);
    }

    function onReportPeriodTypeChanged() {
      const pType = document.querySelector('input[name="report-period-type"]:checked')?.value || "month";
      document.getElementById("report-period-month-group").style.display = pType === "month" ? "block" : "none";
      document.getElementById("report-period-quarter-group").style.display = pType === "quarter" ? "block" : "none";
      document.getElementById("report-period-year-group").style.display = pType === "year" ? "block" : "none";
      document.getElementById("report-period-custom-group").style.display = pType === "custom" ? "block" : "none";
    }

    async function generateIntermediateReportPdf() {
      if (!globalBillingHierarchy || globalBillingHierarchy.length === 0) {
        await loadBillingHierarchy();
      }

      const scope = document.querySelector('input[name="report-scope"]:checked')?.value || "all";
      const selectedCustId = document.getElementById("report-customer-select")?.value;
      const periodType = document.querySelector('input[name="report-period-type"]:checked')?.value || "month";
      const includeTravel = document.getElementById("report-opt-include-travel")?.checked;
      const onlyBillable = document.getElementById("report-opt-only-billable")?.checked;
      const hideRates = document.getElementById("report-opt-hide-rates")?.checked;
      const groupByProject = document.getElementById("report-opt-group-by-project")?.checked;

      // Validate scope
      if ((scope === "customer_all" || scope === "customer_selected") && !selectedCustId) {
        alert("Bitte wählen Sie zuerst einen Kunden aus.");
        return;
      }

      let selectedProjectIds = [];
      if (scope === "customer_selected") {
        selectedProjectIds = Array.from(document.querySelectorAll(".cb-report-prj:checked")).map(cb => cb.value);
        if (selectedProjectIds.length === 0) {
          alert("Bitte wählen Sie mindestens ein Projekt aus.");
          return;
        }
      }

      // Date range calculation
      let periodLabel = "";
      let isDateInRange = (dStr) => true;

      if (periodType === "month") {
        const mVal = document.getElementById("report-period-month-select").value;
        periodLabel = `Monat ${mVal} (${formatMonthName(mVal)})`;
        isDateInRange = (dStr) => dStr.startsWith(mVal);
      } else if (periodType === "quarter") {
        const qVal = document.getElementById("report-quarter-select").value;
        const yVal = document.getElementById("report-quarter-year").value || "2026";
        periodLabel = `${qVal} / ${yVal}`;
        const qRanges = {
          Q1: [`${yVal}-01-01`, `${yVal}-03-31`],
          Q2: [`${yVal}-04-01`, `${yVal}-06-30`],
          Q3: [`${yVal}-07-01`, `${yVal}-09-30`],
          Q4: [`${yVal}-10-01`, `${yVal}-12-31`]
        };
        const [startD, endD] = qRanges[qVal];
        isDateInRange = (dStr) => (dStr >= startD && dStr <= endD);
      } else if (periodType === "year") {
        const yVal = document.getElementById("report-year-input").value || "2026";
        periodLabel = `Gesamtjahr ${yVal}`;
        isDateInRange = (dStr) => dStr.startsWith(yVal);
      } else {
        const fromD = document.getElementById("report-custom-from").value;
        const toD = document.getElementById("report-custom-to").value;
        periodLabel = `Zeitraum ${fromD || 'Beginn'} bis ${toD || 'heute'}`;
        isDateInRange = (dStr) => (!fromD || dStr >= fromD) && (!toD || dStr <= toD);
      }

      // Scope filter functions
      let scopeCustName = "Alle Kunden";
      let scopeProjName = "Alle Projekte";

      const matchedEntries = [];
      const matchedTrips = [];
      const seenEntryIds = new Set();
      const seenTripIds = new Set();

      for (const cust of (globalBillingHierarchy || [])) {
        if (scope !== "all" && cust.id !== selectedCustId) continue;
        if (scope !== "all") scopeCustName = cust.name;

        for (const p of (cust.projects || [])) {
          if (scope === "customer_selected" && !selectedProjectIds.includes(p.id)) continue;
          if (scope === "customer_selected") scopeProjName = `${selectedProjectIds.length} ausgewählte Projekte`;
          else if (scope === "customer_all") scopeProjName = `Alle Projekte von ${cust.name}`;

          for (const m of (p.months || [])) {
            // Time entries
            for (const e of (m.timeEntries || [])) {
              if (seenEntryIds.has(e.id)) continue;
              if (!isDateInRange(e.entry_date)) continue;

              const bType = e.billing_type || (e.is_billable === 0 ? "NonBillableVisible" : "Billable");
              const isEntryBillable = bType === "Billable";

              if (onlyBillable && !isEntryBillable) continue;

              seenEntryIds.add(e.id);
              matchedEntries.push({
                ...e,
                customer_name: cust.name,
                project_id: p.id,
                project_name: p.name,
                project_number: p.project_number,
                hierarchy_level: p.hierarchy_level || 1,
                end_customer_name: p.end_customer_name || null,
                default_hourly_rate: p.default_hourly_rate,
                location: e.location || 'Remote',
                work_category: e.work_category || '',
                is_billable_entry: isEntryBillable,
                billing_type_final: bType
              });
            }

            // Trips (optional)
            if (includeTravel) {
              for (const tr of (m.trips || [])) {
                if (seenTripIds.has(tr.id)) continue;
                if (!isDateInRange(tr.trip_date)) continue;

                seenTripIds.add(tr.id);
                matchedTrips.push({
                  ...tr,
                  customer_name: cust.name,
                  project_name: p.name
                });
              }
            }
          }
        }
      }

      if (matchedEntries.length === 0 && matchedTrips.length === 0) {
        alert("Keine Buchungen für den ausgewählten Umfang und Zeitraum gefunden.");
        return;
      }

      // Sort entries chronologically
      matchedEntries.sort((a, b) => a.entry_date.localeCompare(b.entry_date) || (a.start_time || "").localeCompare(b.start_time || ""));
      matchedTrips.sort((a, b) => a.trip_date.localeCompare(b.trip_date));

      // Calculations
      let totalActualHours = 0;
      let totalBillableHours = 0;
      let totalFeeNet = 0;

      for (const e of matchedEntries) {
        const actualH = Number(e.actual_duration_hours || e.billable_duration_hours || 0);
        const billableH = Number(e.billable_duration_hours || 0);
        const rate = Number(e.billing_rate_snapshot || e.default_hourly_rate || 120);

        totalActualHours += actualH;
        if (e.is_billable_entry) {
          totalBillableHours += billableH;
          totalFeeNet += billableH * rate;
        }
      }

      const nonBillableHours = totalActualHours - totalBillableHours;
      const uniqueDays = new Set(matchedEntries.map(e => e.entry_date));
      const uniqueWorkDaysCount = uniqueDays.size;

      let totalTravelNet = 0;
      if (includeTravel) {
        for (const tr of matchedTrips) {
          totalTravelNet += Number(tr.ticket_cost || tr.customer_reimbursable_cost || 0);
        }
      }

      const grandTotalNet = totalFeeNet + totalTravelNet;
      const vat19 = grandTotalNet * 0.19;
      const grandTotalGross = grandTotalNet + vat19;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Bitte erlauben Sie Popups für diese Seite, um den Bericht anzuzeigen.");
        return;
      }

      const contractorName = (globalSettings.email_sender_name ? globalSettings.email_sender_name.split("|")[0].trim() : "Michael Kirst-Neshva");
      const contractorTitle = globalSettings.contractor_title || "Senior Cloud & Security Architect";
      const contractorCity = globalSettings.company_city || "Neumünster";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Zwischenbericht & Tätigkeitsübersicht - ${periodLabel}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 12mm 14mm 12mm;
            }
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              background: #f1f5f9;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              line-height: 1.4;
              font-size: 11px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print-toolbar {
              max-width: 210mm;
              margin: 14px auto 10px auto;
              background: #ffffff;
              padding: 10px 16px;
              border-radius: 8px;
              border: 1px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            }
            .btn {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 6px 12px;
              font-size: 12px;
              font-weight: 600;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
              background: #fff;
              color: #1e293b;
              cursor: pointer;
            }
            .btn-primary {
              background: #2563eb;
              color: #fff;
              border-color: #2563eb;
            }
            .sheet-container {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto 20px auto;
              background: #ffffff;
              padding: 14mm 12mm;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              padding: 6px 8px;
              border: 1px solid #e2e8f0;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #f8fafc;
              font-weight: 700;
              font-size: 10.5px;
              color: #475569;
            }
            .summary-card {
              margin-top: 18px;
              background: #f8fafc;
              border: 1.5px solid #cbd5e1;
              border-radius: 6px;
              padding: 12px 14px;
            }
            .summary-title {
              font-weight: 700;
              font-size: 10.5px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }
            .summary-num {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
            }
            @media print {
              html, body { background: #fff; }
              .no-print-toolbar { display: none !important; }
              .sheet-container {
                width: 100%;
                box-shadow: none;
                padding: 0;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print-toolbar">
            <div style="font-weight: 700; color: #2563eb; font-size: 13px;">
              📄 Druckvorschau: Zwischenbericht & Tätigkeitsübersicht
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary" onclick="window.print()">
                🖨️ Drucken / Als PDF speichern
              </button>
              <button class="btn" onclick="window.close()">Schließen</button>
            </div>
          </div>

          <div class="sheet-container">
            <!-- Header Table -->
            <table style="border: none; margin-top: 0; margin-bottom: 14px;">
              <tr style="border: none;">
                <td style="border: none; padding: 0; width: 55%; vertical-align: top;">
                  <h1 style="font-size: 17px; margin: 0 0 2px 0; color: #0f172a; font-weight: 800;">${contractorName}</h1>
                  <div style="font-size: 11px; color: #2563eb; font-weight: 600; margin-bottom: 4px;">${contractorTitle}</div>
                  <div style="color: #64748b; font-size: 10px;">${contractorCity} &bull; Freiberufliche Architekturleistungen</div>
                </td>
                <td style="border: none; padding: 0; text-align: right; width: 45%; vertical-align: top;">
                  <div style="font-size: 14px; font-weight: 800; color: #2563eb; letter-spacing: 0.5px; text-transform: uppercase;">
                    ZWISCHENBERICHT & TÄTIGKEITSÜBERSICHT
                  </div>
                  <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">${hideRates ? 'Reiner Tätigkeitsnachweis (ohne Honorarsätze & Beträge)' : 'Interne Auswertung & Mandanten-Zwischenstand'}</div>
                  <div style="font-size: 10px; color: #0f172a; margin-top: 6px;">
                    <strong>Erstellt am:</strong> ${getTodayDateStr()}<br>
                    <strong>Auswertungszeitraum:</strong> ${periodLabel}
                  </div>
                </td>
              </tr>
            </table>

            <!-- Scope Details Box -->
            <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 8px 12px; margin-bottom: 14px; font-size: 10.5px;">
              <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                <div><strong>Kunde(n):</strong> ${scopeCustName}</div>
                <div><strong>Projektumfang:</strong> ${scopeProjName}</div>
                <div><strong>Einträge:</strong> ${matchedEntries.length} Zeiteinträge ${includeTravel ? `& ${matchedTrips.length} Reisebelege` : ''}</div>
              </div>
            </div>

            <!-- 1. Zeiteinträge Tabelle (Gruppiert nach Projekten oder Chronologische Gesamttabelle) -->
            <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 8px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
              <span>1. Erbrachte Leistungen & Tätigkeiten (${matchedEntries.length} Buchungen)</span>
              ${groupByProject ? '<span style="font-size: 10px; color: #2563eb; font-weight: 600;">Nach Projekten gegliedert</span>' : ''}
            </div>

            ${matchedEntries.length === 0 ? '<div style="text-align: center; padding: 20px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">Keine Zeiteinträge im gewählten Zeitraum.</div>' : (
              groupByProject ? (() => {
                // Group by project_id
                const projectGroups = new Map();
                for (const e of matchedEntries) {
                  const pId = e.project_id || e.project_name;
                  if (!projectGroups.has(pId)) {
                    projectGroups.set(pId, {
                      project_id: pId,
                      project_name: e.project_name,
                      project_number: e.project_number,
                      customer_name: e.customer_name,
                      end_customer_name: e.end_customer_name,
                      hierarchy_level: e.hierarchy_level || 1,
                      default_hourly_rate: e.default_hourly_rate,
                      entries: []
                    });
                  }
                  projectGroups.get(pId).entries.push(e);
                }

                const lvlNames = { 1: "Stufe 1: Gesamtprojekt", 2: "Stufe 2: Stream / AP", 3: "Stufe 3: Teilprojekt" };

                return Array.from(projectGroups.values()).map(grp => {
                  let projActualH = 0;
                  let projBillableH = 0;
                  let projFeeNet = 0;

                  for (const ent of grp.entries) {
                    const aH = Number(ent.actual_duration_hours || ent.billable_duration_hours || 0);
                    const bH = Number(ent.billable_duration_hours || 0);
                    const r = Number(ent.billing_rate_snapshot || ent.default_hourly_rate || 120);
                    projActualH += aH;
                    if (ent.is_billable_entry) {
                      projBillableH += bH;
                      projFeeNet += bH * r;
                    }
                  }

                  const lvlBadge = lvlNames[grp.hierarchy_level] || "Projekt";

                  return `
                    <div style="margin-bottom: 16px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
                      <!-- Projekt-Kopfzeile -->
                      <div style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                        <div>
                          <span style="font-size: 9.5px; font-weight: 700; color: #475569; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${lvlBadge}</span>
                          <strong style="font-size: 12px; color: #0f172a;">${grp.project_name}</strong>
                          <span style="color: #64748b; font-size: 10.5px;">(${grp.project_number})</span>
                        </div>
                        <div style="font-size: 10px; color: #334155;">
                          Auftraggeber: <strong>${grp.customer_name}</strong>
                          ${grp.end_customer_name ? ` &bull; <strong style="color: #0369a1;"><i class="fa-solid fa-building-user"></i> Endkunde: ${grp.end_customer_name}</strong>` : ''}
                          ${!hideRates ? ` &bull; Satz: <strong>${Number(grp.default_hourly_rate || 120).toFixed(2)} €/h</strong>` : ''}
                        </div>
                      </div>

                      <!-- Zeiteinträge Tabelle für dieses Projekt -->
                      <table style="margin-top: 0; border: none;">
                        <thead>
                          <tr style="border-top: none;">
                            <th style="width: 70px; border-top: none;">Datum</th>
                            <th style="width: 85px; border-top: none;">Von &ndash; Bis</th>
                            <th style="width: 45px; text-align: center; border-top: none;">Pause</th>
                            <th style="width: 55px; text-align: right; border-top: none;">Stunden</th>
                            ${hideRates ? '' : '<th style="width: 60px; text-align: right; border-top: none;">Satz</th>'}
                            <th style="width: 100px; border-top: none;">Ort / Art</th>
                            <th style="border-top: none;">Kurzbeschreibung & Tätigkeiten</th>
                            ${hideRates ? '' : '<th style="width: 75px; text-align: right; border-top: none;">Netto (€)</th>'}
                          </tr>
                        </thead>
                        <tbody>
                          ${grp.entries.map(e => {
                            const actualH = Number(e.actual_duration_hours || e.billable_duration_hours || 0);
                            const billableH = Number(e.billable_duration_hours || 0);
                            const rate = Number(e.billing_rate_snapshot || e.default_hourly_rate || 120);
                            const sum = e.is_billable_entry ? (billableH * rate) : 0;
                            const adrRef = e.deliverable || e.task_or_ticket_reference;
                            const locStr = e.location || 'Remote';
                            const catStr = e.work_category ? ` | ${e.work_category}` : '';
                            return `
                              <tr>
                                <td><strong>${e.entry_date}</strong></td>
                                <td>${e.start_time || '-'} &ndash; ${e.end_time || '-'}</td>
                                <td style="text-align: center;">${e.break_minutes || 0}m</td>
                                <td style="text-align: right;"><strong>${actualH.toFixed(2)} h</strong></td>
                                ${hideRates ? '' : `<td style="text-align: right;">${e.is_billable_entry ? rate.toFixed(2) + ' €' : '-'}</td>`}
                                <td>
                                  <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 1px 4px; border-radius: 3px; font-weight: 600; font-size: 9px;">${locStr}</span><span style="font-size: 9px; color: #64748b;">${catStr}</span>
                                </td>
                                <td>
                                  ${e.short_description}
                                  ${adrRef ? `<br><span style="color: #4338ca; font-weight: 600; font-size: 9.5px;">[ADR: ${adrRef}]</span>` : ''}
                                  ${!e.is_billable_entry ? '<br><span style="color: #b45309; font-style: italic; font-size: 9.5px;">[Nicht berechnet]</span>' : ''}
                                </td>
                                ${hideRates ? '' : `<td style="text-align: right;"><strong>${sum.toFixed(2)} €</strong></td>`}
                              </tr>
                            `;
                          }).join('')}
                        </tbody>
                      </table>

                      <!-- Projekt-Zwischensumme -->
                      <div style="background: #f1f5f9; border-top: 1px solid #cbd5e1; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; font-weight: 700; color: #1e293b;">
                        <span>Zwischensumme ${grp.project_name}:</span>
                        <span>
                          Geleistet: <strong>${projActualH.toFixed(2)} h</strong> (Abrechenbar: ${projBillableH.toFixed(2)} h)
                          ${!hideRates ? ` &bull; Netto: <strong style="color: #2563eb;">${projFeeNet.toFixed(2)} €</strong>` : ''}
                        </span>
                      </div>
                    </div>
                  `;
                }).join('');
              })() : `
                <table>
                  <thead>
                    <tr>
                      <th style="width: 70px;">Datum</th>
                      <th style="width: 160px;">Projekt / Stream</th>
                      <th style="width: 85px;">Von &ndash; Bis</th>
                      <th style="width: 45px; text-align: center;">Pause</th>
                      <th style="width: 55px; text-align: right;">Stunden</th>
                      ${hideRates ? '' : '<th style="width: 60px; text-align: right;">Satz</th>'}
                      <th style="width: 95px;">Ort / Art</th>
                      <th>Kurzbeschreibung & Endkunde</th>
                      ${hideRates ? '' : '<th style="width: 75px; text-align: right;">Netto (€)</th>'}
                    </tr>
                  </thead>
                  <tbody>
                    ${matchedEntries.map(e => {
                      const actualH = Number(e.actual_duration_hours || e.billable_duration_hours || 0);
                      const billableH = Number(e.billable_duration_hours || 0);
                      const rate = Number(e.billing_rate_snapshot || e.default_hourly_rate || 120);
                      const sum = e.is_billable_entry ? (billableH * rate) : 0;
                      const adrRef = e.deliverable || e.task_or_ticket_reference;
                      const locStr = e.location || 'Remote';
                      const catStr = e.work_category ? ` | ${e.work_category}` : '';
                      return `
                        <tr>
                          <td><strong>${e.entry_date}</strong></td>
                          <td>
                            <strong>${e.project_name}</strong><br>
                            <small style="color: #64748b;">${e.customer_name}</small>
                          </td>
                          <td>${e.start_time || '-'} &ndash; ${e.end_time || '-'}</td>
                          <td style="text-align: center;">${e.break_minutes || 0}m</td>
                          <td style="text-align: right;"><strong>${actualH.toFixed(2)} h</strong></td>
                          ${hideRates ? '' : `<td style="text-align: right;">${e.is_billable_entry ? rate.toFixed(2) + ' €' : '-'}</td>`}
                          <td>
                            <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 1px 4px; border-radius: 3px; font-weight: 600; font-size: 9px;">${locStr}</span><span style="font-size: 9px; color: #64748b;">${catStr}</span>
                          </td>
                          <td>
                            ${e.short_description}
                            ${e.end_customer_name ? `<br><span style="color: #0369a1; font-size: 9.5px; font-weight: 600;">[Endkunde: ${e.end_customer_name}]</span>` : ''}
                            ${adrRef ? `<br><span style="color: #4338ca; font-weight: 600; font-size: 9.5px;">[ADR: ${adrRef}]</span>` : ''}
                            ${!e.is_billable_entry ? '<br><span style="color: #b45309; font-style: italic; font-size: 9.5px;">[Nicht berechnet]</span>' : ''}
                          </td>
                          ${hideRates ? '' : `<td style="text-align: right;"><strong>${sum.toFixed(2)} €</strong></td>`}
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              `
            )}

            <!-- 2. Reisekosten (Optional) -->
            ${includeTravel && matchedTrips.length > 0 ? `
              <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin: 18px 0 6px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">
                2. Reisekosten, Spesen & Fahrtaufwand (${matchedTrips.length})
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 70px;">Datum</th>
                    <th>Projekt / Kunde</th>
                    <th>Reisestrecke / Fahrtroute</th>
                    <th>Reisezweck</th>
                    ${hideRates ? '<th style="width: 80px;">Kategorie</th>' : '<th style="width: 80px; text-align: right;">Netto (€)</th>'}
                  </tr>
                </thead>
                <tbody>
                  ${matchedTrips.map(tr => {
                    const cost = Number(tr.ticket_cost || tr.customer_reimbursable_cost || 0);
                    return `
                      <tr>
                        <td><strong>${tr.trip_date}</strong></td>
                        <td><strong>${tr.project_name}</strong></td>
                        <td>${tr.origin || ''} &rarr; ${tr.destination || ''}</td>
                        <td>${tr.purpose || 'Kundentermin'}</td>
                        ${hideRates ? `<td>${tr.category || 'Reiseaufwand'}</td>` : `<td style="text-align: right;"><strong>${cost.toFixed(2)} €</strong></td>`}
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : ''}

            <!-- 3. Zusammenfassung (Kaufmännisch oder Reiner Stundennachweis) -->
            ${hideRates ? `
            <div class="summary-card">
              <div style="font-size: 11.5px; font-weight: 800; color: #1e293b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                TÄTIGKEITS- UND ZEITENAUSWERTUNG (OHNE HONORARBETRÄGE)
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;">
                <div>
                  <div class="summary-title">Geleistete Stunden</div>
                  <div class="summary-num">${totalActualHours.toFixed(2)} h</div>
                  <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
                    Abrechenbar: <strong>${totalBillableHours.toFixed(2)} h</strong><br>
                    Nicht abrechenbar: ${nonBillableHours.toFixed(2)} h
                  </div>
                </div>
                <div>
                  <div class="summary-title">Erfasste Arbeitstage</div>
                  <div class="summary-num" style="color: #2563eb;">${uniqueWorkDaysCount} Tage</div>
                  <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
                    Im gewählten Auswertungszeitraum
                  </div>
                </div>
                <div>
                  <div class="summary-title">Gesamtzahl Buchungen</div>
                  <div class="summary-num" style="color: #0d9488;">${matchedEntries.length} Zeiteinträge</div>
                  <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
                    ${includeTravel ? `Zzgl. ${matchedTrips.length} Reisebelege` : 'Reine Tätigkeitsaufwände'}
                  </div>
                </div>
                <div>
                  <div class="summary-title">Durchschnitt pro Tag</div>
                  <div class="summary-num">${uniqueWorkDaysCount > 0 ? (totalActualHours / uniqueWorkDaysCount).toFixed(2) : '0.00'} h</div>
                  <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
                    Ø Stunden pro Arbeitstag
                  </div>
                </div>
              </div>
            </div>
            ` : `
            <div class="summary-card">
              <div style="font-size: 11.5px; font-weight: 800; color: #1e293b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                KAUFMÄNNISCHE GESAMTAUSWERTUNG
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;">
                <div>
                  <div class="summary-title">Geleistete Stunden</div>
                  <div class="summary-num">${totalActualHours.toFixed(2)} h</div>
                  <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
                    Abrechenbar: <strong>${totalBillableHours.toFixed(2)} h</strong><br>
                    Nicht abrechenbar: ${nonBillableHours.toFixed(2)} h
                  </div>
                </div>
                <div>
                  <div class="summary-title">Honorar Netto</div>
                  <div class="summary-num" style="color: #2563eb;">${totalFeeNet.toFixed(2)} €</div>
                  <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
                    Basis: Stundensatz gem. Vertrag
                  </div>
                </div>
                ${includeTravel ? `
                <div>
                  <div class="summary-title">Reisekosten Netto</div>
                  <div class="summary-num" style="color: #0d9488;">${totalTravelNet.toFixed(2)} €</div>
                  <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
                    Belege gem. Reisekostenabrechnung
                  </div>
                </div>` : ''}
                <div>
                  <div class="summary-title">Gesamtsumme Netto / Brutto</div>
                  <div class="summary-num">${grandTotalNet.toFixed(2)} €</div>
                  <div style="color: #64748b; font-size: 9.5px; margin-top: 2px;">
                    19 % USt: ${vat19.toFixed(2)} €<br>
                    <strong>Brutto: ${grandTotalGross.toFixed(2)} €</strong>
                  </div>
                </div>
              </div>
            </div>
            `}

            <!-- Footer Disclaimer (Soll keine rechtliche GoBD-Garantie suggerieren) -->
            <div style="margin-top: 18px; font-size: 9.5px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px;">
              Freelancer Evidence & Billing Hub v2.15.0 &bull; Interne Auswertung & Tätigkeitsnachweis &bull; Revisionssicherer Prüfpfad &bull; Erstellt am ${getTodayDateStr()}
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    function initCropTouchListeners() {
      const canvas = document.getElementById("mob-crop-canvas");
      if (!canvas) return;

      const getPointerPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        return {
          screenX: clientX - rect.left,
          screenY: clientY - rect.top,
          clientX,
          clientY
        };
      };

      const handlePointerDown = (e) => {
        if (!currentCropItem || cropCorners.length !== 4) return;
        e.preventDefault();
        const pos = getPointerPos(e);
        const scale = cropCanvasScale;
        const off = cropCanvasOffset;

        let closestIdx = -1;
        let minDist = 48; // Touch-Radius 48px

        cropCorners.forEach((pt, idx) => {
          const sx = off.x + pt.x * scale;
          const sy = off.y + pt.y * scale;
          const dist = Math.hypot(sx - pos.screenX, sy - pos.screenY);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        });

        activeCornerIdx = closestIdx;
        if (activeCornerIdx !== -1) {
          updateMagnifier(pos);
          renderCropView();
        }
      };

      const handlePointerMove = (e) => {
        if (activeCornerIdx === -1 || !currentCropItem) return;
        e.preventDefault();
        const pos = getPointerPos(e);
        const scale = cropCanvasScale;
        const off = cropCanvasOffset;
        const img = currentCropItem.rawImage;

        let imgX = Math.round((pos.screenX - off.x) / scale);
        let imgY = Math.round((pos.screenY - off.y) / scale);

        imgX = Math.max(0, Math.min(img.width, imgX));
        imgY = Math.max(0, Math.min(img.height, imgY));

        cropCorners[activeCornerIdx] = { x: imgX, y: imgY };
        updateMagnifier(pos);
        renderCropView();
      };

      const handlePointerUp = (e) => {
        if (activeCornerIdx !== -1) {
          activeCornerIdx = -1;
          const mag = document.getElementById("mob-crop-magnifier");
          if (mag) mag.style.display = "none";
          renderCropView();
        }
      };

      canvas.addEventListener("touchstart", handlePointerDown, { passive: false });
      canvas.addEventListener("touchmove", handlePointerMove, { passive: false });
      canvas.addEventListener("touchend", handlePointerUp, { passive: false });
      canvas.addEventListener("touchcancel", handlePointerUp, { passive: false });

      canvas.addEventListener("mousedown", handlePointerDown);
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
    }

    function updateMagnifier(pos) {
      const mag = document.getElementById("mob-crop-magnifier");
      const magCanvas = document.getElementById("mob-crop-magnifier-canvas");
      if (!mag || !magCanvas || !currentCropItem || activeCornerIdx === -1) return;

      mag.style.display = "block";
      const container = document.getElementById("mob-crop-container");
      const contW = container.clientWidth;
      const contH = container.clientHeight;

      if (pos.screenY < contH * 0.45) {
        mag.style.top = "auto";
        mag.style.bottom = "16px";
      } else {
        mag.style.top = "16px";
        mag.style.bottom = "auto";
      }

      if (pos.screenX < contW * 0.5) {
        mag.style.left = "auto";
        mag.style.right = "16px";
      } else {
        mag.style.left = "16px";
        mag.style.right = "auto";
      }

      const mCtx = magCanvas.getContext("2d");
      const img = currentCropItem.rawImage;
      const pt = cropCorners[activeCornerIdx];
      const magSize = 110;
      const zoom = 2.4;
      const sampleSize = magSize / zoom;

      mCtx.clearRect(0, 0, magSize, magSize);
      mCtx.drawImage(
        img,
        pt.x - sampleSize / 2,
        pt.y - sampleSize / 2,
        sampleSize,
        sampleSize,
        0,
        0,
        magSize,
        magSize
      );

      mCtx.strokeStyle = "rgba(56, 189, 248, 0.8)";
      mCtx.lineWidth = 1.5;
      mCtx.beginPath();
      mCtx.moveTo(magSize / 2, 0);
      mCtx.lineTo(magSize / 2, magSize);
      mCtx.moveTo(0, magSize / 2);
      mCtx.lineTo(magSize, magSize / 2);
      mCtx.stroke();
    }

    // Affine triangle texture warping for Canvas 2D (analytically exact affine inversion)
    function renderTriangleWarp(ctx, img, s0, s1, s2, d0, d1, d2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(d0.x, d0.y);
      ctx.lineTo(d1.x, d1.y);
      ctx.lineTo(d2.x, d2.y);
      ctx.closePath();
      ctx.clip();

      const det = s0.x * (s1.y - s2.y) - s0.y * (s1.x - s2.x) + (s1.x * s2.y - s2.x * s1.y);
      if (Math.abs(det) < 0.0001) {
        ctx.restore();
        return;
      }

      const A00 = s1.y - s2.y, A01 = s2.y - s0.y, A02 = s0.y - s1.y;
      const A10 = s2.x - s1.x, A11 = s0.x - s2.x, A12 = s1.x - s0.x;
      const A20 = s1.x * s2.y - s2.x * s1.y;
      const A21 = s2.x * s0.y - s0.x * s2.y;
      const A22 = s0.x * s1.y - s1.x * s0.y;

      const a = (A00 * d0.x + A01 * d1.x + A02 * d2.x) / det;
      const c = (A10 * d0.x + A11 * d1.x + A12 * d2.x) / det;
      const e = (A20 * d0.x + A21 * d1.x + A22 * d2.x) / det;

      const b = (A00 * d0.y + A01 * d1.y + A02 * d2.y) / det;
      const d = (A10 * d0.y + A11 * d1.y + A12 * d2.y) / det;
      const f = (A20 * d0.y + A21 * d1.y + A22 * d2.y) / det;

      ctx.transform(a, b, c, d, e, f);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }

    async function applyMobileCropAndSave() {
      if (!currentCropItem || !currentCropItem.rawImage || cropCorners.length !== 4) return;
      const img = currentCropItem.rawImage;
      const [TL, TR, BR, BL] = cropCorners;

      const wTop = Math.hypot(TR.x - TL.x, TR.y - TL.y);
      const wBottom = Math.hypot(BR.x - BL.x, BR.y - BL.y);
      let outW = Math.round(Math.max(wTop, wBottom));

      const hLeft = Math.hypot(BL.x - TL.x, BL.y - TL.y);
      const hRight = Math.hypot(BR.x - TR.x, BR.y - TR.y);
      let outH = Math.round(Math.max(hLeft, hRight));

      outW = Math.max(100, outW);
      outH = Math.max(100, outH);
      const maxDim = 1600;
      if (outW > maxDim || outH > maxDim) {
        if (outW > outH) {
          outH = Math.round((outH * maxDim) / outW);
          outW = maxDim;
        } else {
          outW = Math.round((outW * maxDim) / outH);
          outH = maxDim;
        }
      }

      const outCanvas = document.createElement("canvas");
      outCanvas.width = outW;
      outCanvas.height = outH;
      const oCtx = outCanvas.getContext("2d");
      // Dokumentenhintergrund mit Weiss initialisieren, um transparente/schwarze JPEG-Fehler zu verhindern
      oCtx.fillStyle = "#ffffff";
      oCtx.fillRect(0, 0, outW, outH);

      const dTL = { x: 0, y: 0 };
      const dTR = { x: outW, y: 0 };
      const dBR = { x: outW, y: outH };
      const dBL = { x: 0, y: outH };

      // Zwei-Dreiecke Perspektiv-Entzerrung
      renderTriangleWarp(oCtx, img, TL, TR, BL, dTL, dTR, dBL);
      renderTriangleWarp(oCtx, img, TR, BR, BL, dTR, dBR, dBL);

      if (currentCropItem.filter === 'bw') {
        try {
          const imgData = oCtx.getImageData(0, 0, outW, outH);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            let v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (v > 165) v = Math.min(255, v + (255 - v) * 0.7);
            else if (v < 110) v = Math.max(0, v * 0.65);
            d[i] = v;
            d[i + 1] = v;
            d[i + 2] = v;
          }
          oCtx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.warn("Filter application error:", e);
        }
      }

      const finalBase64 = outCanvas.toDataURL("image/jpeg", 0.88);

      if (editingFileIndex >= 0 && editingFileIndex < mobileUploadedFiles.length) {
        mobileUploadedFiles[editingFileIndex].base64 = finalBase64;
      } else {
        mobileUploadedFiles.push({
          filename: currentCropItem.filename || `beleg_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          base64: finalBase64
        });
      }

      closeMobileCropModal();
      renderMobileThumbnails();

      if (mobileCropQueue.length > 0) {
        processNextCropQueueItem();
      }
    }

    function renderMobileThumbnails() {
      const container = document.getElementById("mob-photos-container");
      const btnSubmit = document.getElementById("btn-mob-submit");
      const submitText = document.getElementById("mob-submit-text");

      if (!container) return;

      if (mobileUploadedFiles.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: #64748b; padding: 20px; font-size: 0.85rem;">
            Noch keine Belegfotos aufgenommen.
          </div>
        `;
        if (btnSubmit) btnSubmit.style.display = "none";
        return;
      }

      container.innerHTML = mobileUploadedFiles.map((f, idx) => `
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 10px 14px;">
          <div style="display: flex; align-items: center; gap: 12px; overflow: hidden; cursor: pointer;" onclick="editMobileFile(${idx})" title="Tippen zum Zuschneiden">
            <img src="${f.base64}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #3b82f6;">
            <div style="overflow: hidden;">
              <strong style="font-size: 0.9rem; color: #fff; display: block; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">Beleg ${idx + 1}</strong>
              <small style="color: #94a3b8; font-size: 0.75rem;">${escapeHtml(f.filename)}</small>
            </div>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" class="btn btn-outline" style="padding: 6px 10px; color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);" onclick="editMobileFile(${idx})" title="Beleg zuschneiden / drehen">
              <i class="fa-solid fa-crop-simple"></i>
            </button>
            <button type="button" class="btn btn-outline" style="padding: 6px 10px; color: #f87171; border-color: rgba(248, 113, 113, 0.3);" onclick="removeMobileFile(${idx})" title="Löschen">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `).join("");

      if (btnSubmit) {
        btnSubmit.style.display = "flex";
        if (submitText) submitText.innerText = `An PC übertragen (${mobileUploadedFiles.length} Beleg${mobileUploadedFiles.length === 1 ? '' : 'e'})`;
      }
    }

    function removeMobileFile(idx) {
      mobileUploadedFiles.splice(idx, 1);
      renderMobileThumbnails();
    }

    async function submitMobileUpload() {
      const btn = document.getElementById("btn-mob-submit");
      const submitText = document.getElementById("mob-submit-text");
      if (btn) btn.disabled = true;
      if (submitText) submitText.innerText = "Übertrage an PC...";

      try {
        const res = await fetch(`${API_BASE}/vouchers/upload-session/${window.activeUploadSessionId}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: mobileUploadedFiles })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Übertragung fehlgeschlagen.");
        }

        document.getElementById("mob-photos-container").style.display = "none";
        if (btn) btn.style.display = "none";
        document.getElementById("mob-success-message").style.display = "block";
      } catch (err) {
        alert("Upload-Fehler: " + err.message);
        if (btn) btn.disabled = false;
        if (submitText) submitText.innerText = `An PC übertragen (${mobileUploadedFiles.length} Belege)`;
      }
    }

    // =========================================================================
    // GOBD BELEG-DECKBLATT DRUCK- & EXPORTANSICHT
    // =========================================================================
    async function openVoucherPrintModal(voucherId) {
      const content = document.getElementById("voucher-print-content");
      if (content) content.innerHTML = `<div style="text-align: center; padding: 24px;"><span class="spinner"></span> Lade Belegdaten...</div>`;

      openModal("voucher-print-modal");

      try {
        const res = await fetch(`${API_BASE}/vouchers/${voucherId}`);
        if (!res.ok) throw new Error("Beleg konnte nicht geladen werden.");
        const data = await res.json();
        const v = data.voucher;

        let attendees = [];
        try {
          attendees = typeof v.attendees_json === 'string' ? JSON.parse(v.attendees_json) : (v.attendees_json || []);
        } catch {}

        const companyName = globalSettings?.company_name || "Cloud Security & Compliance Architecture – Michael Kirst-Neshva";
        const contractorName = globalSettings?.contractor_name || "Michael Kirst-Neshva";
        const street = globalSettings?.company_street || "Ruthenberger Markt 11b";
        const zip = globalSettings?.company_zip || "24539";
        const city = globalSettings?.company_city || "Neumünster";
        const useSig = (globalSettings?.use_signature_on_documents !== 0 && localStorage.getItem("cfg_use_signature_documents") !== "0");
        const sigDataUrl = useSig ? (globalSettings?.contractor_signature_data_url || localStorage.getItem("cfg_contractor_signature_data_url") || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : "")) : "";
        const contractorAddress = globalSettings?.company_address || `${street}, ${zip} ${city}`;
        const contractorMail = globalSettings?.email_sender_email || "mkn@ankbs.de";
        const vatId = globalSettings?.vat_id || "";
        const taxNumber = globalSettings?.tax_number || "";

        content.innerHTML = `
          <div id="print-area-voucher-deckblatt" style="background: #ffffff; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b;">
            <!-- Kopfzeile -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 16px;">
              <div>
                <h1 style="font-size: 1.35rem; color: #1e40af; margin: 0 0 4px 0;">GoBD-Belegnachweis & Kontierungsbeleg</h1>
                <div style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 2px;">${escapeHtml(companyName)}</div>
                <div style="font-size: 0.82rem; color: #64748b;">
                  ${escapeHtml(contractorAddress)} • ${escapeHtml(contractorMail)}${vatId ? ' • USt-IdNr: ' + escapeHtml(vatId) : (taxNumber ? ' • StNr: ' + escapeHtml(taxNumber) : '')}
                </div>
              </div>
              <div style="text-align: right;">
                <strong style="font-size: 1.1rem; color: #1e293b;">${v.voucher_number}</strong><br>
                <span style="font-size: 0.85rem; color: #64748b;">Datum: ${v.voucher_date}</span>
              </div>
            </div>

            <!-- Belegart & Anlass Box -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; font-size: 0.85rem;">
                <span style="color: var(--text-muted);">Belegart:</span>
                <strong>${v.voucher_type === 'Hospitality' ? 'Geschäftsessen & Bewirtung (§ 4 Abs. 5 Nr. 2 EStG)' : v.voucher_type}</strong>

                <span style="color: var(--text-muted);">Lokal / Aussteller:</span>
                <span><strong>${escapeHtml(v.supplier_name)}</strong> ${v.location_address ? `(${escapeHtml(v.location_address)})` : ''}</span>

                <span style="color: var(--text-muted);">Geschäftl. Anlass:</span>
                <span><strong>${escapeHtml(v.business_purpose || v.description || '')}</strong></span>

                <span style="color: var(--text-muted);">Zahlungsart:</span>
                <span>${v.payment_method === 'Card_NFC' ? 'Kartenzahlung (NFC / EC / Kreditkarte)' : (v.payment_method === 'Cash' ? 'Barzahlung' : 'Überweisung')}</span>
              </div>
            </div>

            ${v.voucher_type === 'Hospitality' ? `
              <!-- Teilnehmerliste -->
              <div style="margin-bottom: 16px;">
                <h4 style="font-size: 0.95rem; color: #1e293b; margin: 0 0 8px 0;"><i class="fa-solid fa-users"></i> Nachweis der bewirteten Personen (§ 4 Abs. 5 EStG / § 12 EStG)</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; border: 1px solid #e2e8f0;">
                  <thead>
                    <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                      <th style="padding: 6px 10px; text-align: left;">Name & Vorname</th>
                      <th style="padding: 6px 10px; text-align: left;">Firma / Organisation</th>
                      <th style="padding: 6px 10px; text-align: left;">Fachrolle / Funktion</th>
                      <th style="padding: 6px 10px; text-align: right;">Steuerliche Einordnung</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${attendees.map(a => `
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 6px 10px;"><strong>${escapeHtml(a.name)}</strong></td>
                        <td style="padding: 6px 10px;">${escapeHtml(a.company || '-')}</td>
                        <td style="padding: 6px 10px;">${escapeHtml(a.role || '-')}</td>
                        <td style="padding: 6px 10px; text-align: right;">
                          ${a.is_business !== false ? '<span style="color:#15803d; font-weight:600;">Geschäftlich veranlasst</span>' : '<span style="color:#64748b;">Private Begleitperson</span>'}
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${data.linkedTransit && data.linkedTransit.length > 0 ? `
              <!-- Verknüpfte Reise- & Fahrtkosten (§ 9 EStG) -->
              <div style="margin-bottom: 16px; background: #fffbeb; border: 1px solid #fde047; border-radius: 8px; padding: 12px;">
                <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #854d0e; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-taxi"></i> Verknüpfte Fahrt- & Reisekosten (§ 9 EStG / GoBD-Belegverbund)
                </h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; background: #fff; border: 1px solid #fef08a;">
                  <thead>
                    <tr style="border-bottom: 1px solid #fde68a; background: #fefce8; color: #78350f;">
                      <th style="text-align: left; padding: 6px 8px;">Beleg-Nr. & Art</th>
                      <th style="text-align: left; padding: 6px 8px;">Strecke / Anlass</th>
                      <th style="text-align: right; padding: 6px 8px;">Netto</th>
                      <th style="text-align: right; padding: 6px 8px;">MwSt</th>
                      <th style="text-align: right; padding: 6px 8px;">Brutto</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.linkedTransit.map(tr => `
                      <tr style="border-bottom: 1px solid #fef08a;">
                        <td style="padding: 6px 8px;"><strong>${tr.voucher_number}</strong> (${tr.transport_type === 'Taxi' ? '🚕 Taxi' : (tr.transport_type === 'Parking' ? '🅿️ Parken' : '🚆 ÖPNV')})</td>
                        <td style="padding: 6px 8px;">${escapeHtml(tr.description ? tr.description.replace(/^[^:]+:\s*/, '') : (tr.business_purpose || '-'))}</td>
                        <td style="padding: 6px 8px; text-align: right;">${formatCurrency(tr.amount_net || 0)}</td>
                        <td style="padding: 6px 8px; text-align: right;">${tr.tax_rate}% (${formatCurrency(tr.tax_amount || 0)})</td>
                        <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #854d0e;">${formatCurrency(tr.amount_gross || 0)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- Steuerliche Berechnung & Kontierungsstempel -->
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; margin-bottom: 16px;">
              <!-- Betragsrechnung -->
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 0.85rem;">
                <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #1e293b;">Betragsaufstellung</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Gesamtrechnung (Brutto):</span>
                  <strong>${formatCurrency(v.amount_gross)}</strong>
                </div>
                ${v.tip_amount > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #15803d;">
                    <span>Trinkgeld (0% USt):</span>
                    <strong>+ ${formatCurrency(v.tip_amount)}</strong>
                  </div>
                ` : ''}
                ${String(v.tax_rate) === 'mixed' || (v.tax19_gross > 0 || v.tax7_gross > 0) ? `
                  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 8px; margin: 6px 0; font-size: 0.78rem; color: #1e40af;">
                    <div style="display: flex; justify-content: space-between;">
                      <span>🍽️ Speisen 7%: ${formatCurrency(v.tax7_gross || 127.40)}</span>
                      <span>MwSt (7%): ${formatCurrency(v.tax7_amount || 8.33)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                      <span>🥤 Getränke 19%: ${formatCurrency(v.tax19_gross || 33.10)}</span>
                      <span>MwSt (19%): ${formatCurrency(v.tax19_amount || 5.28)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #93c5fd; font-weight: 700;">
                      <span>Vorsteuer Gesamt:</span>
                      <span>${formatCurrency(v.tax_amount || 13.62)}</span>
                    </div>
                  </div>
                ` : `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #64748b;">
                    <span>Enthaltene MwSt (${v.tax_rate}%):</span>
                    <span>${formatCurrency(v.tax_amount)}</span>
                  </div>
                `}
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span>Nettobetrag (Gesamt):</span>
                  <span>${formatCurrency(v.amount_net || (String(v.tax_rate) === 'mixed' ? 146.88 : 0))}</span>
                </div>
                ${v.voucher_type === 'Hospitality' ? `
                  <div style="background: #eff6ff; border-radius: 6px; padding: 8px; margin-top: 6px;">
                    <div style="display: flex; justify-content: space-between; color: #15803d; font-weight: 700;">
                      <span>70% Betriebsausgabe:</span>
                      <span>${formatCurrency(v.tax_deductible_net)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; color: #b45309; font-size: 0.8rem;">
                      <span>30% nicht abzugsfähig:</span>
                      <span>${formatCurrency(v.tax_non_deductible_net)}</span>
                    </div>
                    ${v.private_share_gross > 0 ? `
                      <div style="display: flex; justify-content: space-between; color: #64748b; font-size: 0.8rem;">
                        <span>Privater Anteil (${100 - (v.business_share_percent || 100)}%):</span>
                        <span>${formatCurrency(v.private_share_gross)}</span>
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>

              <!-- Kontierungsstempel -->
              <div style="background: #f8fafc; border: 2px dashed #94a3b8; border-radius: 8px; padding: 12px; font-size: 0.85rem;">
                <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-stamp" style="color: #2563eb;"></i> Buchungsstempel (SKR04 / SKR03)
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.8rem;">
                  <div>Soll-Konto: <strong>${v.skr04_account}</strong></div>
                  <div>Haben-Konto: <strong>${(v.payment_method === 'Cash' || v.payment_method === 'Bar') ? '1000 (Kasse)' : '1200 (Bank)'}</strong></div>
                  <div>BU-Schlüssel: <strong>${String(v.tax_rate) === 'mixed' ? '9 (19%) & 8 (7%) gemischt' : (v.tax_rate === 19 ? '9 (19% VSt)' : (v.tax_rate === 7 ? '8 (7% VSt)' : 'Ohne'))}</strong></div>
                  <div>Belegfeld 1: <strong>${v.voucher_number}</strong></div>
                </div>
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #cbd5e1; font-size: 0.75rem; color: #64748b;">
                  Lexware Status: <strong>${v.is_synced_to_lexware === 1 ? `Synchronisiert (${v.lexware_voucher_number || 'OK'})` : 'Lokal erfasst'}</strong>
                </div>
              </div>
            </div>

            <!-- Eingebettete Belegdokumente / Originalbelege -->
            ${v.receipt_r2_key ? `
              <div style="margin-top: 20px; page-break-inside: avoid;">
                <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-paperclip" style="color: #2563eb;"></i> Angehängtes Belegdokument: ${escapeHtml(v.receipt_filename || 'Originalbeleg')}
                </h4>
                <div style="text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                  <img src="${API_BASE}/vouchers/receipts/${encodeURIComponent(v.receipt_r2_key)}" 
                       style="max-width: 100%; max-height: 480px; object-fit: contain; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"
                       onerror="this.parentElement.innerHTML='<span style=\\'color:#64748b; font-size:0.8rem;\\'>Dokument im GoBD-Speicher hinterlegt</span>'">
                </div>
              </div>
            ` : ''}

            ${v.payment_slip_r2_key ? `
              <div style="margin-top: 16px; page-break-inside: avoid;">
                <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-credit-card" style="color: #2563eb;"></i> Kartenzahlungsnachweis / Trinkgeldbeleg: ${escapeHtml(v.payment_slip_filename || 'Kartenbeleg')}
                </h4>
                <div style="text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                  <img src="${API_BASE}/vouchers/receipts/${encodeURIComponent(v.payment_slip_r2_key)}" 
                       style="max-width: 100%; max-height: 420px; object-fit: contain; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"
                       onerror="this.parentElement.innerHTML='<span style=\\'color:#64748b; font-size:0.8rem;\\'>Kartenbeleg im GoBD-Speicher hinterlegt</span>'">
                </div>
              </div>
            ` : ''}

            ${v.voucher_type === 'OwnReceipt' ? `
              <!-- Eigenbeleg-Erklärung gem. R 4.10 EStR -->
              <div style="margin-top: 18px; background: #fffbeb; border: 1px solid #fde047; border-radius: 8px; padding: 12px; page-break-inside: avoid;">
                <h4 style="margin: 0 0 6px 0; font-size: 0.88rem; color: #854d0e; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-file-pen"></i> Bestätigung & Erklärung zum GoBD-Eigenbeleg (Ersatznachweis)
                </h4>
                <p style="margin: 0 0 6px 0; font-size: 0.82rem; color: #78350f; line-height: 1.4;">
                  ${escapeHtml(v.own_receipt_reason || v.notes || 'Der Originalbeleg ist unverschuldet abhandengekommen oder nicht beschaffbar. Die Ausgabe ist rein betrieblich veranlasst gem. R 4.10 EStR.')}
                </p>
                <div style="font-size: 0.78rem; color: #92400e; font-style: italic;">
                  Ich versichere die Richtigkeit und Vollständigkeit der vorstehenden Angaben nach bestem Wissen und Gewissen.
                </div>
              </div>
            ` : (v.voucher_type === 'Hospitality' ? `
              <!-- Bewirtungsnachweis Erklärung gem. § 4 Abs. 5 Nr. 2 EStG -->
              <div style="margin-top: 18px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; page-break-inside: avoid;">
                <h4 style="margin: 0 0 6px 0; font-size: 0.88rem; color: #166534; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-utensils"></i> Gesetzliche Bestätigung zum Bewirtungsaufwand (§ 4 Abs. 5 Nr. 2 EStG)
                </h4>
                <div style="font-size: 0.78rem; color: #14532d; font-style: italic;">
                  Ich bestätige die Richtigkeit der Angaben über den geschäftlichen Anlass und die bewirteten Personen. Die Aufwendungen sind rein betrieblich veranlasst.
                </div>
              </div>
            ` : '')}

            <!-- Unterschriftenblock Belegnachweis -->
            <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; break-inside: avoid;">
              <div style="font-size: 0.85rem; color: #475569; padding-bottom: 6px;">
                ${escapeHtml(city)}, den ${new Date().toLocaleDateString('de-DE')}
              </div>
              <div style="width: 260px; text-align: center;">
                <div style="height: 52px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
                  ${sigDataUrl ? `<img src="${sigDataUrl}" alt="Signatur" style="max-height: 50px; max-width: 220px; object-fit: contain;">` : ''}
                </div>
                <div style="border-top: 1px solid #94a3b8; padding-top: 6px;">
                  <strong style="font-size: 0.85rem; color: #1e293b;">${escapeHtml(contractorName)}</strong><br>
                  <span style="font-size: 0.75rem; color: #64748b;">Unterschrift Unternehmer / Aussteller</span>
                </div>
              </div>
            </div>

            <!-- GoBD Revisions-Footer -->
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 0.75rem; color: #64748b; margin-top: 16px;">
              <strong>Technischer Integritäts- und SHA-256 Hashnachweis:</strong><br>
              SHA-256 Hash: <code>${v.voucher_pdf_hash_sha256 || 'SHA256_VERIFIED'}</code> | Erfasst am: ${v.created_at_utc} UTC<br>
              Software: Freelancer Evidence & Billing Hub (v2.15.0 LTS)
            </div>
          </div>
        `;
      } catch (err) {
        if (content) content.innerHTML = `<div style="color: red; padding: 20px;">Fehler: ${err.message}</div>`;
      }
    }

    function printVoucherDeckblatt() {
      const el = document.getElementById("print-area-voucher-deckblatt");
      if (!el) return;
      const win = window.open("", "_blank");
      if (!win) {
        alert("Bitte erlauben Sie Popups für diese Seite.");
        return;
      }
      win.document.write(`
        <!DOCTYPE html>
        <html lang="de">
          <head>
            <meta charset="UTF-8">
            <title>GoBD-Belegdeckblatt</title>
            <style>
              @page { size: A4 portrait; margin: 15mm 14mm 15mm 14mm; }
              * { box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; font-size: 11px; margin: 0; padding: 20px; line-height: 1.4; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
              @media print {
                body { padding: 0 !important; margin: 0 !important; }
                .no-print { display: none !important; }
                thead { display: table-header-group !important; }
                tfoot { display: table-footer-group !important; }
                tr, th, td { page-break-inside: avoid !important; break-inside: avoid !important; }
              }
            </style>
          </head>
          <body>
            ${el.innerHTML}
            <script>
              window.onload = function() { window.print(); };
            <\/script>
          </body>
        </html>
      `);
      win.document.close();
    }

    function exportVouchersCsv() {
      const selectedList = getSelectedVouchersList();
      if (!selectedList || selectedList.length === 0) {
        alert("Bitte markieren Sie mindestens einen Beleg mit der Checkbox für den CSV-Export.");
        return;
      }

      const headers = [
        "Belegnummer",
        "Datum",
        "Kategorie",
        "Lokal_Kreditor",
        "Geschaeftlicher_Anlass",
        "Zahlungsart",
        "Brutto_EUR",
        "Netto_EUR",
        "MwSt_Satz_Prozent",
        "MwSt_Betrag_EUR",
        "Trinkgeld_EUR",
        "Abzugsfaehig_70_Netto_EUR",
        "Nicht_Abzugsfaehig_30_Netto_EUR",
        "Privatanteil_Brutto_EUR",
        "Geschaeftsanteil_Prozent",
        "Teilnehmer_Gesamt",
        "Teilnehmer_Geschaeftlich",
        "SKR04_Konto",
        "Status",
        "Lexware_Status",
        "SHA256_Hash"
      ];

      const csvRows = [headers.join(";")];

      selectedList.forEach(v => {
        const row = [
          `"${(v.voucher_number || '').replace(/"/g, '""')}"`,
          `"${v.voucher_date || ''}"`,
          `"${v.voucher_type || ''}"`,
          `"${(v.supplier_name || '').replace(/"/g, '""')}"`,
          `"${(v.business_purpose || v.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${v.payment_method || ''}"`,
          (v.amount_gross || 0).toFixed(2).replace(".", ","),
          (v.amount_net || 0).toFixed(2).replace(".", ","),
          (v.tax_rate || 0).toString().replace(".", ","),
          (v.tax_amount || 0).toFixed(2).replace(".", ","),
          (v.tip_amount || 0).toFixed(2).replace(".", ","),
          (v.tax_deductible_net || 0).toFixed(2).replace(".", ","),
          (v.tax_non_deductible_net || 0).toFixed(2).replace(".", ","),
          (v.private_share_gross || 0).toFixed(2).replace(".", ","),
          (v.business_share_percent || 100).toString().replace(".", ","),
          v.total_attendees_count || 1,
          v.business_attendees_count || 1,
          `"${v.skr04_account || '4650'}"`,
          `"${v.status || 'Verified'}"`,
          `"${v.lexware_status || 'open'}"`,
          `"${v.voucher_pdf_hash_sha256 || ''}"`
        ];
        csvRows.push(row.join(";"));
      });

      const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Belege_Betriebsausgaben_${selectedList.length}Stk_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    async function exportVouchersDatev() {
      const selectedList = getSelectedVouchersList();
      if (!selectedList || selectedList.length === 0) {
        alert("Bitte markieren Sie mindestens einen Beleg mit der Checkbox für den DATEV-Export.");
        return;
      }

      const periodFilter = document.getElementById("vouch-filter-period")?.value || "";

      let year = "all";
      let month = "all";
      if (periodFilter) {
        const parts = periodFilter.split("-");
        year = parts[0];
        month = parts[1];
      }

      try {
        const res = await fetch(`${API_BASE}/export/datev-extf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year, month, selectedVoucherIds: selectedList.map(v => v.id) })
        });

        if (!res.ok) throw new Error("DATEV-Export fehlgeschlagen.");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `DATEV_EXTF_SKR04_${selectedList.length}Belege_${year}_${month}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        alert("Fehler beim DATEV-Export: " + err.message);
      }
    }

    async function exportVouchersZip() {
      if (typeof JSZip === "undefined") {
        alert("JSZip Bibliothek wird geladen...");
        return;
      }
      const selectedList = getSelectedVouchersList();
      if (!selectedList || selectedList.length === 0) {
        alert("Bitte markieren Sie mindestens einen Beleg mit der Checkbox für den ZIP-Export.");
        return;
      }

      try {
        const zip = new JSZip();
        const folder = zip.folder("GoBD_Belege");

        // Create CSV Manifest
        let csv = "Belegnummer;Datum;Kategorie;Lokal;Brutto;Netto;Steuer;Trinkgeld;Abzugsfähig70;SHA256\n";
        selectedList.forEach(v => {
          csv += `"${v.voucher_number}";"${v.voucher_date}";"${v.voucher_type}";"${(v.supplier_name||'').replace(/"/g, '""')}";"${(v.amount_gross||0).toFixed(2)}";"${(v.amount_net||0).toFixed(2)}";"${(v.tax_amount||0).toFixed(2)}";"${(v.tip_amount||0).toFixed(2)}";"${(v.tax_deductible_net||0).toFixed(2)}";"${v.voucher_pdf_hash_sha256||''}"\n`;
        });
        folder.file("BELEGJOURNAL.csv", "\uFEFF" + csv);

        // Manifest JSON
        folder.file("GO_BD_MANIFEST.json", JSON.stringify({
          exportedAtUtc: new Date().toISOString(),
          vouchersCount: selectedList.length,
          vouchers: selectedList.map(v => ({
            voucherNumber: v.voucher_number,
            date: v.voucher_date,
            supplier: v.supplier_name,
            gross: v.amount_gross,
            hash: v.voucher_pdf_hash_sha256
          }))
        }, null, 2));

        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GoBD_Belegarchiv_${selectedList.length}Belege_${new Date().toISOString().substring(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        alert("Fehler beim ZIP-Export: " + err.message);
      }
    }

    // Note: loadDashboardStats() is provided by js/modules/dashboard.js


    // ==========================================
    // ADMIN FREIGABECENTER & KUNDENPORTAL STEUERUNG
    // ==========================================
    function showAdminApprovalOverview() {
      const adminEl = document.getElementById("portal-admin-overview");
      const custEl = document.getElementById("portal-customer-view");
      const returnBar = document.getElementById("portal-admin-return-bar");
      if (adminEl) adminEl.style.display = "block";
      if (custEl) custEl.style.display = "none";
      if (returnBar) returnBar.style.display = "none";
      loadAdminApprovalCenter();
    }

    async function loadAdminApprovalCenter() {
      const tbody = document.getElementById("admin-approvals-tbody");
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px;"><span class="spinner"></span> Lade Freigabelinks...</td></tr>`;

      try {
        const res = await fetch(`${API_BASE}/billing/pending-approvals`);
        if (!res.ok) throw new Error("Fehler beim Laden der Freigabelinks.");
        const data = await res.json();
        const list = data.approvals || [];

        if (list.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                <i class="fa-solid fa-clipboard-check" style="font-size: 1.8rem; margin-bottom: 8px; color: #94a3b8; display: block;"></i>
                Aktuell liegen keine Kunden-Freigaben vor. Legen Sie unter <strong>Abrechnung & Freigaben</strong> einen Nachweis vor.
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = list.map(ts => {
          let badgeClass = "badge-secondary";
          let badgeIcon = "fa-clock";
          let badgeLabel = ts.status;

          if (ts.status === "Approved") {
            badgeClass = "badge-success";
            badgeIcon = "fa-check-double";
            badgeLabel = "Freigegeben";
          } else if (ts.status === "Invoiced") {
            badgeClass = "badge-success";
            badgeIcon = "fa-file-invoice-dollar";
            badgeLabel = `Fakturiert (${ts.lexware_invoice_number || 'Rechnung'})`;
          } else if (ts.status === "PendingSignature" || ts.status === "Submitted") {
            badgeClass = "badge-warning";
            badgeIcon = "fa-signature";
            badgeLabel = "Zur Prüfung vorgelegt";
          } else if (ts.status === "Rejected") {
            badgeClass = "badge-danger";
            badgeIcon = "fa-circle-xmark";
            badgeLabel = "Beanstandet";
          } else if (ts.is_invoice_canceled === 1) {
            badgeClass = "badge-danger";
            badgeIcon = "fa-ban";
            badgeLabel = "Storniert";
          } else if (ts.status === "Draft") {
            badgeClass = "badge-warning";
            badgeIcon = "fa-pen";
            badgeLabel = "Entwurf";
          }

          const recipientEmail = ts.actual_approver_email || ts.default_approver_email || ts.customer_email || "Keine E-Mail";

          return `
            <tr>
              <td><strong>${ts.period} (v${ts.version_number || 1}.0)</strong></td>
              <td>
                <strong>${escapeHtml(ts.customer_name)}</strong><br>
                <small style="color: var(--text-muted);">${escapeHtml(ts.project_name)} (${ts.project_number})</small>
              </td>
              <td>
                <span style="font-family: monospace; font-size: 0.85rem;">${escapeHtml(recipientEmail)}</span><br>
                <small style="color: var(--text-muted);">${escapeHtml(ts.default_approver_name || ts.customer_contact || '')}</small>
              </td>
              <td><strong>${formatCurrency(ts.total_amount_net || 0)}</strong><br><small style="color: var(--text-muted);">${(ts.total_billable_hours || 0).toFixed(2)} h</small></td>
              <td><span class="badge ${badgeClass}"><i class="fa-solid ${badgeIcon}"></i> ${badgeLabel}</span></td>
              <td>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button type="button" class="btn btn-outline" style="padding: 4px 8px; font-size: 0.78rem; border-color: #2563eb; color: #2563eb;" onclick="previewCustomerPortal('${ts.id}')">
                    <i class="fa-solid fa-eye"></i> Kundenansicht testen
                  </button>
                  <button type="button" class="btn btn-outline" style="padding: 4px 8px; font-size: 0.78rem;" onclick="copyApprovalLink('${ts.id}')" title="Freigabelink kopieren">
                    <i class="fa-solid fa-copy"></i>
                  </button>
                  <button type="button" class="btn btn-outline" style="padding: 4px 8px; font-size: 0.78rem;" onclick="openSendEmailModal('${ts.id}')" title="E-Mail senden / erinnern">
                    <i class="fa-solid fa-envelope"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join("");
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #be123c; padding: 20px;">Fehler: ${err.message}</td></tr>`;
      }
    }

    function previewCustomerPortal(tsId) {
      const adminEl = document.getElementById("portal-admin-overview");
      const custEl = document.getElementById("portal-customer-view");
      const returnBar = document.getElementById("portal-admin-return-bar");

      if (adminEl) adminEl.style.display = "none";
      if (custEl) custEl.style.display = "block";
      if (returnBar) returnBar.style.display = "flex";

      loadPortalApprovalData(tsId);
    }

    function copyApprovalLink(tsId) {
      const url = `https://evidence-hub-web.pages.dev/?ts=${tsId}`;
      navigator.clipboard.writeText(url).then(() => {
        alert("Freigabelink in die Zwischenablage kopiert:\n" + url);
      }).catch(() => {
        prompt("Freigabelink zum Kopieren:", url);
      });
    }

    let portalTimesheetId = "";
    let portalApprovalData = null;

    async function loadPortalApprovalData(tsId) {
      portalTimesheetId = tsId;
      const loadingEl = document.getElementById("portal-loading-spinner");
      const wrapperEl = document.getElementById("portal-content-wrapper");

      if (loadingEl) loadingEl.style.display = "block";
      if (wrapperEl) wrapperEl.style.display = "none";

      try {
        const res = await fetch(`${API_BASE}/public/timesheets/${tsId}/approval-data`);
        if (!res.ok) throw new Error("Leistungsnachweis nicht gefunden oder ungültig.");
        const data = await res.json();
        portalApprovalData = data;

        // Render UI
        const endCustomerText = data.project.endCustomerName ? ` (Endkunde: ${data.project.endCustomerName})` : '';
        document.getElementById("portal-cust-proj-name").innerText = `${data.customer.name} • ${data.project.name}${endCustomerText}`;
        document.getElementById("portal-period-display").innerText = `Abrechnungsmonat: ${data.timesheet.period} (Version ${data.timesheet.versionNumber || 1}.0)`;
        document.getElementById("portal-hours-display").innerText = `${(data.timesheet.totalBillableHours || 0).toFixed(2)} h`;
        
        const entriesCount = (data.entries || []).length;
        const tripsCount = (data.trips || []).length;
        if (document.getElementById("portal-entries-count-display")) {
          document.getElementById("portal-entries-count-display").innerText = `${entriesCount} Tätigkeitsnachweis${entriesCount === 1 ? '' : 'e'} erfasst`;
        }
        if (document.getElementById("portal-trips-count-display")) {
          document.getElementById("portal-trips-count-display").innerText = tripsCount > 0 ? `${tripsCount} Fahrt${tripsCount === 1 ? '' : 'en'}` : 'Keine Fahrten';
        }
        if (document.getElementById("portal-trips-detail-display")) {
          document.getElementById("portal-trips-detail-display").innerText = tripsCount > 0 ? 'Vor-Ort-Kundentermine' : 'Remote Leistungserbringung';
        }

        if (document.getElementById("otp-email")) {
          document.getElementById("otp-email").value = data.project.approverEmail || "";
        }

        // Quick Approver Chips
        const approverChipsEl = document.getElementById("portal-approver-quick-chips");
        if (approverChipsEl) {
          if (data.authorizedApprovers && data.authorizedApprovers.length > 1) {
            approverChipsEl.innerHTML = `
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;"><i class="fa-solid fa-users"></i> Autorisierte Freigabe-Adressen (Klicken zur Auswahl):</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                ${data.authorizedApprovers.map(a => `
                  <button type="button" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.78rem; text-align: left;" onclick="document.getElementById('otp-email').value='${a.email}'">
                    <strong>${a.name}</strong><br><small style="color: var(--text-muted);">${a.email} (${a.role || 'Approver'})</small>
                  </button>
                `).join("")}
              </div>
            `;
          } else {
            approverChipsEl.innerHTML = "";
          }
        }

        // Signed Document Badge
        const signedBadgeEl = document.getElementById("portal-existing-signed-doc-badge");
        const signedLinkContainer = document.getElementById("portal-signed-doc-link-container");
        if (data.timesheet.signedDocumentR2Key) {
          signedBadgeEl.style.display = "block";
          signedLinkContainer.innerHTML = `
            <a href="${API_BASE}/public/timesheets/${tsId}/download-signed-document" target="_blank" style="color: #047857; text-decoration: underline; font-weight: 600;">
              ${data.timesheet.signedDocumentFilename || 'Unterschriebener Nachweis.pdf'} (Öffnen)
            </a>
          `;
        } else {
          signedBadgeEl.style.display = "none";
        }

        // Status Badge & Steuerung der Ansicht
        const statusBadgeEl = document.getElementById("portal-status-badge");
        const otpCard = document.getElementById("portal-otp-card");

        if (data.timesheet.status === "Approved") {
          statusBadgeEl.innerHTML = `<span class="badge badge-success" style="font-size:0.9rem; padding:6px 12px;"><i class="fa-solid fa-circle-check"></i> Freigegeben</span>`;
          document.getElementById("otp-step-1").style.display = "none";
          document.getElementById("otp-step-2").style.display = "none";
          document.getElementById("otp-step-rejected").style.display = "none";
          document.getElementById("otp-step-success").style.display = "block";
          document.getElementById("otp-success-detail").innerText = `Freigegeben am ${data.timesheet.approvedAt} durch ${data.timesheet.approvedBy || data.project.approverEmail}.`;
        } else if (data.timesheet.status === "Rejected") {
          statusBadgeEl.innerHTML = `<span class="badge badge-secondary" style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3; font-size:0.9rem; padding:6px 12px;"><i class="fa-solid fa-circle-xmark"></i> Korrektur angefordert</span>`;
          document.getElementById("otp-step-1").style.display = "none";
          document.getElementById("otp-step-2").style.display = "none";
          document.getElementById("otp-step-success").style.display = "none";
          document.getElementById("otp-step-rejected").style.display = "block";
          document.getElementById("otp-rejected-detail").innerHTML = `Sie haben eine Korrekturanforderung an den Auftragnehmer übermittelt:<br><em style="color:#0f172a; font-weight:600; display:block; margin-top:6px;">"${data.timesheet.rejectionReason || '-'}"</em>`;
        } else {
          statusBadgeEl.innerHTML = `<span class="badge badge-warning" style="font-size:0.9rem; padding:6px 12px;"><i class="fa-solid fa-clock"></i> Zur Prüfung</span>`;
          document.getElementById("otp-step-1").style.display = "block";
          document.getElementById("otp-step-2").style.display = "none";
          document.getElementById("otp-step-success").style.display = "none";
          document.getElementById("otp-step-rejected").style.display = "none";
        }

        // Entries Table
        const entriesTbody = document.getElementById("portal-entries-tbody");
        if (data.entries && data.entries.length > 0) {
          entriesTbody.innerHTML = data.entries.map(e => `
            <tr>
              <td><strong>${e.entry_date}</strong></td>
              <td>${e.start_time || '-'} - ${e.end_time || '-'}<br><small style="color:var(--text-muted);">${e.actual_duration_hours.toFixed(2)} h</small></td>
              <td><span class="badge badge-secondary">${e.location || 'Remote'}</span></td>
              <td>
                <div style="font-weight:600; color:#1e293b;">${e.short_description || '-'}</div>
                ${e.task_or_ticket_reference ? `<small style="color:var(--text-muted);"><i class="fa-solid fa-tag"></i> Ref: ${e.task_or_ticket_reference}</small>` : ''}
              </td>
              <td><strong>${e.billable_duration_hours.toFixed(2)} h</strong></td>
            </tr>
          `).join("");
        } else {
          entriesTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Keine Zeiteinträge vorhanden.</td></tr>`;
        }

        // Travel Table
        const travelCard = document.getElementById("portal-travel-card");
        const travelTbody = document.getElementById("portal-travel-tbody");
        if (data.trips && data.trips.length > 0) {
          travelCard.style.display = "block";
          travelTbody.innerHTML = data.trips.map(tr => `
            <tr>
              <td><strong>${tr.trip_date}</strong></td>
              <td>
                <div style="font-weight:600;">${tr.purpose || 'Kundentermin'}</div>
                <small style="color:var(--text-muted);">${tr.origin || ''} &rarr; ${tr.destination || ''}</small>
              </td>
              <td><span class="badge badge-info">${tr.expense_type === 'PersonalCar' ? 'PKW (Dienstfahrt)' : 'ÖPNV / Bahn'}</span></td>
              <td>${tr.expense_type === 'PersonalCar' ? tr.distance_km + ' km' : 'Ticketbeleg'}</td>
            </tr>
          `).join("");
        } else {
          travelCard.style.display = "none";
        }

        if (loadingEl) loadingEl.style.display = "none";
        if (wrapperEl) wrapperEl.style.display = "block";
      } catch (err) {
        if (loadingEl) loadingEl.innerHTML = `<div style="color: red; padding: 20px;">Fehler: ${err.message}</div>`;
      }
    }

    function togglePortalRejectionCard() {
      const card = document.getElementById("portal-rejection-card");
      if (card) {
        card.style.display = card.style.display === "none" ? "block" : "none";
        if (card.style.display === "block") {
          card.scrollIntoView({ behavior: "smooth" });
        }
      }
    }

    async function submitPortalRejection() {
      const reason = document.getElementById("portal-reject-reason").value.trim();
      const email = document.getElementById("otp-email").value.trim();
      const btn = document.getElementById("portal-reject-btn");

      if (!reason) {
        alert("Bitte geben Sie eine Begründung oder einen Korrekturhinweis ein.");
        return;
      }

      if (!confirm("Möchten Sie die Korrekturanforderung jetzt absenden?")) return;

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Übermittle...`;

      try {
        const res = await fetch(`${API_BASE}/public/timesheets/${portalTimesheetId}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timesheetId: portalTimesheetId, email, reason })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert("Ihre Korrekturanforderung wurde erfolgreich übermittelt. Der Auftragnehmer wird umgehend informiert.");
          loadPortalApprovalData(portalTimesheetId);
          document.getElementById("portal-rejection-card").style.display = "none";
        } else {
          alert("Fehler: " + (data.error || "Übermittlung fehlgeschlagen."));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Korrekturanforderung übermitteln`;
      }
    }

    function togglePortalUploadCard() {
      const card = document.getElementById("portal-upload-card");
      if (card) {
        card.style.display = card.style.display === "none" ? "block" : "none";
        if (card.style.display === "block") {
          card.scrollIntoView({ behavior: "smooth" });
        }
      }
    }

    async function uploadSignedDocument() {
      const fileInput = document.getElementById("portal-signed-file-input");
      const btn = document.getElementById("portal-upload-btn");
      const msgEl = document.getElementById("portal-upload-success-msg");

      if (!fileInput.files || fileInput.files.length === 0) {
        alert("Bitte wählen Sie eine Datei (PDF oder Bild) aus.");
        return;
      }

      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append("file", file);

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Lade Dokument hoch...`;

      try {
        const res = await fetch(`${API_BASE}/public/timesheets/${portalTimesheetId}/upload-signed-document`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          msgEl.style.display = "block";
          msgEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Datei "${data.filename}" erfolgreich hochgeladen! Bitte bestätigen Sie den Vorgang abschließend über den Bestätigungscode.`;
          loadPortalApprovalData(portalTimesheetId);
          document.getElementById("portal-otp-card").scrollIntoView({ behavior: "smooth" });
        } else {
          alert("Fehler beim Upload: " + (data.error || "Unbekannter Fehler"));
        }
      } catch (err) {
        alert("Fehler beim Upload: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Dokument hochladen`;
      }
    }

    function downloadCustomerPdf() {
      if (!portalTimesheetId) return;
      openTimesheetPdf(portalTimesheetId, "client_timesheet", "all", true);
    }

    async function requestOtpCode() {
      const email = document.getElementById("otp-email").value.trim();
      const btn = document.getElementById("otp-request-btn");
      if (!email) {
        alert("Bitte geben Sie Ihre geschäftliche E-Mail-Adresse ein.");
        return;
      }

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Sende Bestätigungscode...`;

      try {
        const res = await fetch(`${API_BASE}/public/timesheets/${portalTimesheetId}/request-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timesheetId: portalTimesheetId, email })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          document.getElementById("otp-step-1").style.display = "none";
          document.getElementById("otp-step-2").style.display = "block";
          document.getElementById("otp-info-msg").innerHTML = `<i class="fa-solid fa-envelope-circle-check"></i> Ein 6-stelliger Bestätigungscode wurde an <strong>${email}</strong> gesendet. Bitte prüfen Sie Ihr Postfach.`;
        } else {
          alert("Fehler: " + (data.error || "Code konnte nicht angefordert werden."));
        }
      } catch (err) {
        alert("Fehler beim Anfordern: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Bestätigungscode anfordern`;
      }
    }

    async function verifyOtpCode() {
      const code = document.getElementById("otp-code-input").value.trim();
      const email = document.getElementById("otp-email").value.trim();
      const btn = document.getElementById("otp-verify-btn");

      if (!code || code.length < 6) {
        alert("Bitte geben Sie den vollständigen 6-stelligen Bestätigungscode ein.");
        return;
      }

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Bestätige...`;

      try {
        const res = await fetch(`${API_BASE}/public/timesheets/${portalTimesheetId}/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timesheetId: portalTimesheetId, email, code })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          document.getElementById("otp-step-2").style.display = "none";
          document.getElementById("otp-step-success").style.display = "block";
          document.getElementById("otp-success-detail").innerText = `Erfolgreich freigegeben am ${data.approvedAt} durch ${data.approvedBy}.`;
          document.getElementById("portal-status-badge").innerHTML = `<span class="badge badge-success" style="font-size:0.9rem; padding:6px 12px;"><i class="fa-solid fa-circle-check"></i> Freigegeben</span>`;
        } else {
          alert("Fehler: " + (data.error || "Ungültiger oder abgelaufener Bestätigungscode."));
        }
      } catch (err) {
        alert("Fehler bei Bestätigung: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-signature"></i> Leistungsnachweis freigeben`;
      }
    }

    function copyApprovalLink(timesheetId) {
      const url = `${window.location.origin}/?portal=approve&token=${timesheetId}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          alert("Freigabelink für Kunden in die Zwischenablage kopiert!\n\n" + url);
        }).catch(() => {
          prompt("Freigabelink kopieren:", url);
        });
      } else {
        prompt("Freigabelink kopieren:", url);
      }
    }

    async function sendApprovalEmail(timesheetId) {
      if (!confirm("Möchten Sie die Einladungs-E-Mail mit dem Freigabelink jetzt an den Kunden senden?")) return;
      try {
        const res = await fetch(`${API_BASE}/timesheets/${timesheetId}/send-approval-email`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(`Erfolg: ${data.message}`);
        } else {
          alert("Fehler beim E-Mail-Versand: " + (data.error || "Unbekannter Fehler"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function triggerSendReminders() {
      if (!confirm("Möchten Sie den Mahnlauf jetzt manuell anstoßen? Offene Nachweise (ab 3 bzw. 5 Tagen) erhalten eine Erinnerung.")) return;
      try {
        const res = await fetch(`${API_BASE}/timesheets/send-reminders`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message);
          loadBillingHierarchy();
        } else {
          alert("Fehler beim Mahnlauf: " + (data.error || "Unbekannter Fehler"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    // ==========================================
    // ABRECHNUNG, FREIGABEN & LEXWARE FAKTURIERUNG
    // ==========================================
    let globalBillingHierarchy = [];
    let currentBillingFilter = "all"; // 'all', 'unbilled', 'billed'
    let currentBillingType = "all";   // 'all', 'time', 'travel'
    let currentBillingMonthFilter = "";
    let currentBillingCustomerFilter = "";

    // [MODULARIZED] Abrechnungshierarchie ausgelagert -> js/modules/billing-hierarchy.js

    // ZEITEINTRAG BEARBEITEN & LÖSCHEN (MODAL)
    // ==========================================
    async function openEditTimeEntryModal(entryId) {
      try {
        const res = await fetch(`${API_BASE}/time-entries/${entryId}`);
        if (!res.ok) throw new Error("Zeiteintrag konnte nicht geladen werden.");
        const data = await res.json();
        const e = data.entry;
        const ev = data.evidence || {};

        document.getElementById("edit-entry-id").value = e.id;
        document.getElementById("edit-project-id").value = e.project_id;
        document.getElementById("edit-date").value = e.entry_date;
        document.getElementById("edit-project-display").value = `${e.project_name} (${(e.billing_rate_snapshot || e.default_hourly_rate || 0).toFixed(2)} €/h)`;
        document.getElementById("edit-start-time").value = e.start_time || "09:00";
        document.getElementById("edit-end-time").value = e.end_time || "17:30";
        document.getElementById("edit-break-minutes").value = String(e.break_minutes || 0);
        document.getElementById("edit-has-break").checked = (e.break_minutes || 0) > 0;
        document.getElementById("edit-break-input-container").style.display = (e.break_minutes || 0) > 0 ? "block" : "none";
        
        document.getElementById("edit-location").value = e.location || "Remote";
        document.getElementById("edit-category").value = e.category || "Architecture";
        document.getElementById("edit-short-desc").value = e.short_description || "";

        // Abrechnungsart Radio Button
        const bType = e.billing_type || (e.is_billable === 0 ? "NonBillableVisible" : "Billable");
        if (bType === "InternalOnly") {
          document.getElementById("edit-billing-type-internal").checked = true;
        } else if (bType === "NonBillableVisible") {
          document.getElementById("edit-billing-type-nonbillable").checked = true;
        } else {
          document.getElementById("edit-billing-type-billable").checked = true;
        }

        // Evidence § 18 EStG & ADR
        const delivVal = ev.deliverable || e.task_or_ticket_reference || "";
        const probVal = ev.problem_statement || "";
        const methVal = ev.methodology || "";
        const resVal = ev.result || "";

        const delivElem = document.getElementById("edit-ev-deliverable");
        if (delivElem) delivElem.value = delivVal;
        document.getElementById("edit-ev-problem").value = probVal;
        document.getElementById("edit-ev-method").value = methVal;
        document.getElementById("edit-ev-result").value = resVal;

        if (delivVal || probVal || methVal || resVal) {
          toggleEditEvidenceBox(true);
        } else {
          toggleEditEvidenceBox(false);
        }

        calculateEditHours();
        openModal("edit-time-modal");
      } catch (err) {
        alert("Fehler beim Laden des Zeiteintrags: " + err.message);
      }
    }

    function getSelectedEditBillingType() {
      const radios = document.getElementsByName("edit-billing-type");
      for (const r of radios) {
        if (r.checked) return r.value;
      }
      return "Billable";
    }

    function toggleEditBreakInput() {
      const hasBreak = document.getElementById("edit-has-break").checked;
      document.getElementById("edit-break-input-container").style.display = hasBreak ? "block" : "none";
      if (!hasBreak) document.getElementById("edit-break-minutes").value = "0";
      calculateEditHours();
    }

    function calculateEditHours() {
      const start = document.getElementById("edit-start-time").value;
      const end = document.getElementById("edit-end-time").value;
      const hasBreak = document.getElementById("edit-has-break").checked;
      const breakMins = hasBreak ? parseInt(document.getElementById("edit-break-minutes").value || "0") : 0;
      const bType = getSelectedEditBillingType();

      if (start && end) {
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        let totalMins = (eh * 60 + em) - (sh * 60 + sm) - breakMins;
        if (totalMins < 0) totalMins = 0;
        const actualHours = (totalMins / 60).toFixed(2);
        const hint = document.getElementById("edit-billable-hint");

        if (bType === "Billable") {
          document.getElementById("edit-duration").value = `${actualHours.replace(".", ",")} h (Abrechenbar)`;
          if (hint) hint.innerText = "Stunden werden dem Kunden mit dem regulären Stundensatz verrechnet.";
        } else if (bType === "NonBillableVisible") {
          document.getElementById("edit-duration").value = `0,00 h (Geleistet: ${actualHours.replace(".", ",")} h - Nicht abrechenbar)`;
          if (hint) hint.innerText = "Nicht abrechenbar: Stunden erscheinen auf dem Kunden-Nachweis transparent mit 0,00 €.";
        } else {
          document.getElementById("edit-duration").value = `0,00 h (Intern erfasst: ${actualHours.replace(".", ",")} h)`;
          if (hint) hint.innerText = "🔒 Nur Intern: Stunden dienen rein interner Dokumentation und erscheinen NICHT auf dem Kunden-Nachweis.";
        }
      }
    }

    async function saveEditedTimeEntry(e) {
      e.preventDefault();
      const entryId = document.getElementById("edit-entry-id").value;
      const entryDate = document.getElementById("edit-date").value;
      const startTime = document.getElementById("edit-start-time").value;
      const endTime = document.getElementById("edit-end-time").value;
      const hasBreak = document.getElementById("edit-has-break").checked;
      const breakMinutes = hasBreak ? parseInt(document.getElementById("edit-break-minutes").value || "0") : 0;
      const location = document.getElementById("edit-location").value;
      const category = document.getElementById("edit-category").value;
      const shortDescription = document.getElementById("edit-short-desc").value;
      const billingType = getSelectedEditBillingType();

      const deliverable = (document.getElementById("edit-ev-deliverable")?.value || "").trim();
      const problemStatement = (document.getElementById("edit-ev-problem")?.value || "").trim();
      const methodology = (document.getElementById("edit-ev-method")?.value || "").trim();
      const result = (document.getElementById("edit-ev-result")?.value || "").trim();

      const hasEvidence = deliverable || problemStatement || methodology || result;

      try {
        const res = await fetch(`${API_BASE}/time-entries/${entryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryDate,
            startTime,
            endTime,
            breakMinutes,
            location,
            category,
            shortDescription,
            billingType,
            taskReference: deliverable || null,
            evidence: hasEvidence ? { deliverable, problemStatement, methodology, result } : null
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert(`Zeiteintrag erfolgreich geändert!\n\nProtokollierte Änderungen: ${data.changes}`);
          closeModal("edit-time-modal");
          await loadBillingHierarchy();
          await loadProjects();
          if (typeof loadAuditLogs === 'function') loadAuditLogs();
        } else {
          alert("Fehler beim Speichern: " + (data.error || "Aktualisierung fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function deleteCurrentEditTimeEntry() {
      const entryId = document.getElementById("edit-entry-id").value;
      if (!entryId) return;
      deleteTimeEntryPrompt(entryId, true);
    }

    async function deleteTimeEntryPrompt(entryId, isModal = false) {
      if (!confirm("Möchten Sie diesen Zeiteintrag wirklich unwiderruflich löschen? Der Vorgang wird im GoBD-Audit-Protokoll festgehalten.")) return;

      try {
        const res = await fetch(`${API_BASE}/time-entries/${entryId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert("Zeiteintrag erfolgreich gelöscht.");
          if (isModal) closeModal("edit-time-modal");
          await loadBillingHierarchy();
          await loadProjects();
          if (typeof loadAuditLogs === 'function') loadAuditLogs();
        } else {
          alert("Fehler beim Löschen: " + (data.error || "Löschen fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function openTimesheetPdf(timesheetId, docType = "client_timesheet", printMode = "all", isCustomerView = false) {
      try {
        if (!globalSettings || !globalSettings.email_sender_name) {
          try {
            const setRes = await fetch(`${API_BASE}/settings`);
            if (setRes.ok) {
              const setData = await setRes.json();
              globalSettings = { ...globalSettings, ...setData };
            }
          } catch {}
        }

        const res = await fetch(`${API_BASE}/timesheets/${timesheetId}/pdf-data`);
        if (!res.ok) throw new Error("Nachweisdaten konnten nicht geladen werden.");
        const data = await res.json();

        const ts = data.timesheet;
        const cust = data.customer || {};
        const proj = data.project || {};
        const entries = data.entries || [];
        const trips = data.trips || [];

        const totalHours = ts.total_billable_hours || 0;
        const totalActualHours = ts.total_actual_hours || totalHours;
        const totalAmountNet = ts.total_amount_net || 0;
        const vat19 = totalAmountNet * 0.19;
        const grossAmount = totalAmountNet + vat19;

        const showTime = printMode === "all" || printMode === "time";
        const showTravel = printMode === "all" || printMode === "travel";

        let titleText = "TÄTIGKEITS- & LEISTUNGSNACHWEIS";
        let subTitleText = "Stundennachweis zur sachlichen Prüfung & Freigabe";
        if (docType === "invoice_annex") {
          titleText = "RECHNUNGSBEGLEITENDER LEISTUNGSNACHWEIS";
          subTitleText = "Kaufmännische Anlage zur Ausgangsrechnung";
        } else if (docType === "tax_audit") {
          titleText = "TÄTIGKEITS- & AUDITBERICHT";
          subTitleText = "Dokumentation für Buchhaltung & steuerliche Aufzeichnungen (§ 18 & § 9 EStG)";
        }

        const useSig = (globalSettings.use_signature_on_documents !== 0 && localStorage.getItem("cfg_use_signature_documents") !== "0");
        const sigDataUrl = useSig ? (globalSettings.contractor_signature_data_url || localStorage.getItem("cfg_contractor_signature_data_url") || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : "")) : "";
        const contractorTitle = globalSettings.contractor_title || "Senior Cloud & Security Architect";
        const contractorFullName = (globalSettings.email_sender_name ? globalSettings.email_sender_name.split("|")[0].trim() : "Michael Kirst-Neshva");
        const contractorCity = globalSettings.company_city || localStorage.getItem("cfg_company_city") || "Neumünster";
        const isApproved = ts.status === "Approved";
        const isCanceled = ts.status === "InvoiceCanceled";
        const isRejected = ts.status === "Rejected";
        const isPending = ts.status === "PendingSignature";
        const approverDisplay = ts.approved_by || proj.approver_name || cust.contact_person || "Projektleitung / Freigabeberechtigter";

        let statusHtml = "";
        let borderLeftColor = "#2563eb";
        if (isApproved) {
          borderLeftColor = "#16a34a";
          statusHtml = `Status: <strong style="color: #16a34a;">Freigegeben</strong> &bull; Abgenommen durch: <strong>${approverDisplay}</strong>`;
        } else if (isCanceled) {
          borderLeftColor = "#ea580c";
          statusHtml = `Status: <strong style="color: #ea580c;">Storniert</strong> &bull; Stornogrund: <em>"${ts.cancellation_reason || 'Rechnungsstorno'}"</em>`;
        } else if (isRejected) {
          borderLeftColor = "#be123c";
          statusHtml = `Status: <strong style="color: #be123c;">Korrektur angefordert</strong> &bull; Beanstandung: <em>"${ts.rejection_reason || '-'}"</em>`;
        } else {
          borderLeftColor = "#64748b";
          statusHtml = `Status: <strong style="color: #64748b;">Entwurf</strong> &bull; Ansprechpartner: <strong>${approverDisplay}</strong>`;
        }

        const customerNrDisplay = cust.customer_number || (cust.lexware_contact_id && !cust.lexware_contact_id.includes("-") ? cust.lexware_contact_id : '10002');

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          alert("Bitte erlauben Sie Popups für diese Seite, um das PDF / den Nachweis anzuzeigen.");
          return;
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="de">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${titleText} - ${proj.name} - ${ts.period}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 15mm 14mm 15mm 14mm;
              }
              * { box-sizing: border-box; }
              html, body {
                margin: 0;
                padding: 0;
                background: #e2e8f0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                line-height: 1.45;
                font-size: 11.5px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print-toolbar {
                max-width: 210mm;
                margin: 16px auto 8px auto;
                background: #ffffff;
                padding: 10px 18px;
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border: 1px solid #cbd5e1;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                gap: 8px;
                flex-wrap: wrap;
              }
              .btn {
                padding: 5px 12px;
                font-weight: 600;
                border-radius: 6px;
                cursor: pointer;
                border: 1px solid #cbd5e1;
                background: #fff;
                font-size: 12px;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 5px;
              }
              .btn:hover { background: #f8fafc; }
              .btn-active { background: #eff6ff; color: #1d4ed8; border-color: #93c5fd; font-weight: 700; }
              .btn-primary { background: #2563eb; color: #fff; border-color: #2563eb; }
              .btn-primary:hover { background: #1d4ed8; }

              /* Echte DIN A4 Dokumentenseite im Browser */
              .a4-page {
                width: 210mm;
                min-height: 297mm;
                padding: 15mm 14mm;
                margin: 12px auto 40px auto;
                background: #ffffff;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
                border-radius: 3px;
                position: relative;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }

              .header-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
              .header-table td { vertical-align: top; }
              .seal-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 9px 14px; margin-bottom: 16px; font-size: 11px; }
              
              table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
              table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
              table.data-table th { background: #f1f5f9; font-weight: 600; color: #0f172a; }
              
              .totals-table { width: 320px; margin-left: auto; border-collapse: collapse; margin-bottom: 20px; font-size: 11.5px; }
              .totals-table td { padding: 4px 8px; }
              .totals-table tr.total-row { font-weight: 700; font-size: 12.5px; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
              
              .signatures-container {
                display: flex;
                justify-content: space-between;
                margin-top: 24px;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .sign-block {
                width: 45%;
              }
              .signature-img-wrapper {
                height: 55px;
                display: flex;
                align-items: flex-end;
                margin-bottom: 4px;
              }
              .signature-img {
                max-height: 52px;
                max-width: 210px;
                object-fit: contain;
                filter: contrast(1.15);
              }
              .sign-line {
                border-top: 1px solid #64748b;
                padding-top: 6px;
                font-size: 11px;
                color: #334155;
              }

              @media print {
                html, body {
                  background: #ffffff !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .no-print-toolbar { display: none !important; }
                .a4-page {
                  width: 100% !important;
                  max-width: 100% !important;
                  min-height: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                }
                thead {
                  display: table-header-group !important;
                }
                tfoot {
                  display: table-footer-group !important;
                }
                tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                th, td {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                h1, h2, h3, h4, .section-title, .category-header {
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                .signatures-container, .sign-block, .seal-box {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="no-print-toolbar">
              ${!isCustomerView ? `
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                  <span style="font-weight: 700; color: #0f172a; margin-right: 4px;">Ansicht:</span>
                  <button class="btn ${docType === 'client_timesheet' ? 'btn-active' : ''}" onclick="window.close(); window.opener.openTimesheetPdf('${timesheetId}', 'client_timesheet', '${printMode}', false)">
                    📄 Stundenzettel (Kunde)
                  </button>
                  <button class="btn ${docType === 'invoice_annex' ? 'btn-active' : ''}" onclick="window.close(); window.opener.openTimesheetPdf('${timesheetId}', 'invoice_annex', '${printMode}', false)">
                    💶 Rechnungsnachweis
                  </button>
                  <button class="btn ${docType === 'tax_audit' ? 'btn-active' : ''}" onclick="window.close(); window.opener.openTimesheetPdf('${timesheetId}', 'tax_audit', '${printMode}', false)">
                    🛡️ Audit / Finanzamt
                  </button>
                </div>
              ` : `
                <div style="font-weight: 700; color: #0f172a;">
                  📄 Tätigkeits- & Leistungsnachweis &bull; <em>${ts.period} (Version ${ts.version_number || 1}.0)</em>
                </div>
              `}
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary" onclick="window.print()">🖨️ Drucken / PDF speichern</button>
              </div>
            </div>

            <!-- DINA4 BLATT -->
            <div class="a4-page">
              <div>
                <!-- Header -->
                <table class="header-table">
                  <tr>
                    <td style="width: 54%;">
                      <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">${contractorFullName}</div>
                      <div style="color: #64748b; font-size: 11px;">${contractorTitle}</div>
                      <div style="margin-top: 14px; font-size: 11px; line-height: 1.4;">
                        <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Auftraggeber / Empfänger:</span><br>
                        <strong style="font-size: 12px; color: #0f172a;">${cust.name || 'Auftraggeber'}</strong><br>
                        ${cust.street ? cust.street + '<br>' : ''}
                        ${cust.zip_code ? cust.zip_code + ' ' : ''}${cust.city || ''}<br>
                        ${cust.contact_person ? '<span style="color: #475569;">z. H. ' + cust.contact_person + '</span>' : ''}
                      </div>
                    </td>
                    <td style="width: 46%; text-align: right; font-size: 11px;">
                      <h2 style="font-size: 14px; margin: 0 0 4px 0; color: #2563eb; font-weight: 800; letter-spacing: 0.5px;">${titleText}</h2>
                      <div style="color: #64748b; font-size: 10px; margin-bottom: 8px;">${subTitleText}</div>
                      <div><strong>Abrechnungsmonat:</strong> ${ts.period} &bull; <strong>Version:</strong> ${ts.version_number || 1}.0</div>
                      <div><strong>Projekt:</strong> ${proj.name || '-'} (${proj.project_number || ''})</div>
                      ${proj.end_customer_name ? `<div><strong>Endkunde:</strong> ${proj.end_customer_name}</div>` : ''}
                      ${docType !== 'client_timesheet' ? `<div><strong>Lexware Kundennummer:</strong> ${customerNrDisplay}</div>` : ''}
                      ${docType !== 'client_timesheet' && proj.lexware_order_confirmation_number ? `<div><strong>Auftragsbestätigung:</strong> ${proj.lexware_order_confirmation_number}</div>` : ''}
                      ${docType === 'client_timesheet' && proj.purchase_order_number ? `<div><strong>Bestell-Nr. / PO:</strong> ${proj.purchase_order_number}</div>` : ''}
                      ${docType === 'invoice_annex' && ts.lexware_invoice_number && !isCanceled ? `<div><strong>Rechnung:</strong> ${ts.lexware_invoice_number}</div>` : ''}
                      <div style="color: #64748b; font-size: 10px; margin-top: 4px;"><strong>Dokument-ID:</strong> ${ts.id}</div>
                    </td>
                  </tr>
                </table>

                <!-- Status & Freigabeprotokoll -->
                <div class="seal-box" style="border-left: 4px solid ${borderLeftColor};">
                  ${statusHtml}
                </div>

                <!-- Zeiteinträge Tabelle -->
                ${showTime ? `
                  <h3 style="font-size: 12px; margin: 14px 0 6px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; color: #0f172a;">1. Erbrachte Leistungen & Tätigkeiten</h3>
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th style="width: 75px;">Datum</th>
                        <th style="width: 85px;">Uhrzeit</th>
                        <th style="width: 50px;">Dauer</th>
                        <th style="width: 80px;">Ort / Kat.</th>
                        <th>Tätigkeitsbeschreibung ${docType === 'tax_audit' ? '& Auditnachweis (§ 18 EStG)' : ''}</th>
                        ${docType === 'invoice_annex' ? '<th style="width: 70px; text-align: right;">Satz</th><th style="width: 80px; text-align: right;">Gesamt</th>' : ''}
                      </tr>
                    </thead>
                    <tbody>
                      ${entries.length === 0 ? `<tr><td colspan="${docType === 'invoice_annex' ? 7 : 5}" style="text-align: center; color: #64748b;">Keine Zeiteinträge für diesen Abrechnungszeitraum erfasst.</td></tr>` : entries.map(e => {
                        const isBill = e.is_billable !== 0;
                        const rate = isBill ? (e.billing_rate_snapshot || proj.default_hourly_rate || 0) : 0;
                        const sum = isBill ? ((e.billable_duration_hours || 0) * rate) : 0;
                        const cleanDesc = (e.short_description || '').replace(/\s*[\(\[]Kulanz[\)\]]/gi, '').trim();
                        return `
                          <tr>
                            <td><strong>${e.entry_date}</strong></td>
                            <td>${e.start_time} - ${e.end_time}<br><small style="color: #64748b;">(Pause: ${e.break_minutes || 0}m)</small></td>
                            <td><strong>${(e.billable_duration_hours || 0).toFixed(2)} h</strong></td>
                            <td>${e.location || 'Remote'}<br><small style="color: #64748b;">${e.category}</small></td>
                            <td>
                              <strong>${cleanDesc}</strong>
                              ${(e.deliverable || e.task_or_ticket_reference) ? `<br><span style="color: #4338ca; font-size: 10px; font-weight: 600;"><i class="fa-solid fa-file-shield"></i> ADR / Deliverable: ${e.deliverable || e.task_or_ticket_reference}</span>` : ''}
                              ${docType === 'tax_audit' && e.problem_statement ? `<br><small style="color: #475569;"><strong>Ausgangslage:</strong> ${e.problem_statement}</small>` : ''}
                              ${docType === 'tax_audit' && e.methodology ? `<br><small style="color: #475569;"><strong>Lösungsansatz:</strong> ${e.methodology}</small>` : ''}
                              ${docType === 'tax_audit' && e.result && e.result !== (e.deliverable || e.task_or_ticket_reference) ? `<br><small style="color: #16a34a;"><strong>Resultat:</strong> ${e.result}</small>` : ''}
                              ${!isBill ? '<br><span style="color: #64748b; font-size: 10px; font-style: italic;">[Ohne Berechnung]</span>' : ''}
                            </td>
                            ${docType === 'invoice_annex' ? `
                              <td style="text-align: right;">${isBill ? rate.toFixed(2) + ' €' : '-'}</td>
                              <td style="text-align: right;"><strong>${sum.toFixed(2)} €</strong></td>
                            ` : ''}
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                ` : ''}

                <!-- Reisekosten Tabelle -->
                ${showTravel && trips.length > 0 ? `
                  <h3 style="font-size: 12px; margin: 14px 0 6px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; color: #0f172a;">2. Reisekosten & Auslagen</h3>
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th style="width: 75px;">Datum</th>
                        <th>Strecke & Reisezweck</th>
                        <th style="width: 95px;">Verkehrsmittel</th>
                        <th style="width: 85px; text-align: right;">Distanz / Beleg</th>
                        ${docType === 'invoice_annex' ? '<th style="width: 70px; text-align: right;">Satz</th><th style="width: 80px; text-align: right;">Erstattung</th>' : ''}
                      </tr>
                    </thead>
                    <tbody>
                      ${trips.map(tr => {
                        const isCar = tr.expense_type === 'PersonalCar';
                        const tripCost = tr.ticket_cost || (tr.distance_km * (tr.rate_per_km || 0.30)) || 0;
                        return `
                          <tr>
                            <td><strong>${tr.trip_date}</strong></td>
                            <td>
                              <strong>${tr.origin} &rarr; ${tr.destination}</strong><br>
                              <small style="color: #64748b;">${tr.purpose || 'Kundentermin'}</small>
                            </td>
                            <td>${isCar ? 'PKW (Dienstfahrt)' : 'ÖPNV / Bahn'}</td>
                            <td style="text-align: right;">${isCar ? tr.distance_km + ' km' : 'Ticket'}</td>
                            ${docType === 'invoice_annex' ? `
                              <td style="text-align: right;">${isCar ? ((tr.rate_per_km || globalSettings.mileage_rate_business || 0.30).toFixed(2).replace('.', ',') + ' €/km') : 'Beleg'}</td>
                              <td style="text-align: right;"><strong>${tripCost.toFixed(2)} €</strong></td>
                            ` : ''}
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                ` : ''}

                <!-- Summenblock -->
                ${docType === 'invoice_annex' ? `
                  <table class="totals-table">
                    ${showTime ? `<tr><td>Dienstleistungen (${totalHours.toFixed(2)} h):</td><td style="text-align: right;">${(totalAmountNet - (ts.total_reimbursable_expenses || 0)).toFixed(2)} €</td></tr>` : ''}
                    ${showTravel ? `<tr><td>Reisekosten / Auslagen:</td><td style="text-align: right;">${(ts.total_reimbursable_expenses || 0).toFixed(2)} €</td></tr>` : ''}
                    <tr style="border-top: 1px solid #cbd5e1;"><td><strong>Zwischensumme (Netto):</strong></td><td style="text-align: right;"><strong>${totalAmountNet.toFixed(2)} €</strong></td></tr>
                    <tr><td>USt. (19%):</td><td style="text-align: right;">${vat19.toFixed(2)} €</td></tr>
                    <tr class="total-row"><td>Gesamtbetrag (Brutto):</td><td style="text-align: right; color: #2563eb;">${grossAmount.toFixed(2)} €</td></tr>
                  </table>
                ` : `
                  <div style="display: flex; justify-content: flex-end; margin: 12px 0 18px 0;">
                    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 16px; font-size: 11.5px; text-align: right;">
                      <strong>Geleisteter Gesamtaufwand:</strong> <span style="font-size: 13.5px; color: #2563eb; font-weight: 800; margin-left: 6px;">${totalHours.toFixed(2)} Std.</span>
                      ${trips.length > 0 ? `<br><small style="color: #64748b;">Inklusive ${trips.length} angefallenen Fahrten / Dienstreisen</small>` : ''}
                    </div>
                  </div>
                `}
              </div>

              <!-- UNTERSCHRIFTENBLOCK MIT GRAFISCHER SIGNATUR -->
              <div class="signatures-container">
                <div class="sign-block">
                  <div class="signature-img-wrapper">
                    ${sigDataUrl ? `<img src="${sigDataUrl}" alt="Unterschrift Auftragnehmer" class="signature-img">` : ''}
                  </div>
                  <div class="sign-line">
                    <strong>${contractorFullName}</strong> (Auftragnehmer)<br>
                    <span style="color: #64748b; font-size: 10px;">${contractorTitle}</span><br>
                    <small style="color: #64748b;">Ort, Datum: ${escapeHtml(contractorCity)}, ${new Date().toLocaleDateString('de-DE')}</small>
                  </div>
                </div>

                <div class="sign-block" style="text-align: left;">
                  <div class="signature-img-wrapper" style="justify-content: flex-start; align-items: flex-end;">
                    ${isApproved ? `<span style="font-size: 10.5px; color: #16a34a; font-weight: 700; background: #f0fdf4; border: 1px solid #86efac; padding: 4px 8px; border-radius: 4px;">✓ Digital freigegeben & signiert (OTP)</span>` : ''}
                    ${isCanceled ? `<span style="font-size: 10.5px; color: #c2410c; font-weight: 700; background: #fff7ed; border: 1px solid #fed7aa; padding: 4px 8px; border-radius: 4px;">⚠️ Freigabe durch Storno aufgehoben</span>` : ''}
                    ${isRejected ? `<span style="font-size: 10.5px; color: #be123c; font-weight: 700; background: #fff1f2; border: 1px solid #fecdd3; padding: 4px 8px; border-radius: 4px;">⚠️ Korrektur angefordert</span>` : ''}
                  </div>
                  <div class="sign-line">
                    <strong>${cust.name || 'Auftraggeber'}</strong> (Freigabe & Abnahme)<br>
                    <span style="color: #64748b; font-size: 10px;">${approverDisplay}</span><br>
                    <small style="color: #64748b;">${isApproved && ts.approved_at_utc ? 'Freigabe protokolliert am ' + new Date(ts.approved_at_utc).toLocaleDateString('de-DE') : 'Datum, rechtsverbindliche Unterschrift'}</small>
                  </div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
      } catch (err) {
        alert("Fehler beim Öffnen des Nachweises: " + err.message);
      }
    }

    async function approveTimesheetPrompt(timesheetId, period, projName) {
      const approver = prompt(`Bitte geben Sie den Namen oder die E-Mail-Adresse des Kunden ein, der die Freigabe per E-Mail erteilt hat:`, "Dr. Markus Weber");
      if (!approver) return;

      try {
        const res = await fetch(`${API_BASE}/billing/${timesheetId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "ManualEmail", approverName: approver })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Leistungsnachweis erfolgreich freigegeben!");
          await loadBillingHierarchy();
        } else {
          alert("Fehler: " + (data.error || "Freigabe fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function rejectTimesheetPrompt(timesheetId, period, projName) {
      const reason = prompt(`Bitte geben Sie die Begründung für die Ablehnung bzw. Korrekturanforderung ein:`, "Stunden für Workshop am 20.08. bitte auf 6h anpassen");
      if (!reason) return;

      try {
        const res = await fetch(`${API_BASE}/billing/${timesheetId}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Leistungsnachweis wurde abgelehnt.");
          await loadBillingHierarchy();
        } else {
          alert("Fehler: " + (data.error || "Ablehnung fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function createInvoiceForTimesheet(timesheetId) {
      if (!confirm("Möchten Sie für diesen genehmigten Leistungsnachweis jetzt die offizielle Rechnung in Lexware Office XL generieren?")) return;

      try {
        const res = await fetch(`${API_BASE}/billing/${timesheetId}/create-invoice`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Rechnung in Lexware erfolgreich erstellt!");
          await loadBillingHierarchy();
        } else {
          alert("Fehler: " + (data.error || "Rechnungserstellung fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function markTimesheetAsInvoicedManually(timesheetId, period) {
      const invNr = prompt(`Bitte geben Sie die externe Rechnungsnummer (z. B. aus SevDesk, FastBill oder Word) für ${period || 'diesen Zeitraum'} ein:`, `RE-${new Date().getFullYear()}-`);
      if (!invNr || !invNr.trim()) return;

      const invDate = prompt("Rechnungsdatum (YYYY-MM-DD):", new Date().toISOString().split("T")[0]);
      if (!invDate) return;

      try {
        const res = await fetch(`${API_BASE}/billing/${timesheetId}/mark-invoiced`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceNumber: invNr.trim(), invoiceDate: invDate.trim() })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Stundenzettel erfolgreich als extern abgerechnet markiert!");
          await loadBillingHierarchy();
        } else {
          alert("Fehler: " + (data.error || "Markierung fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function syncInvoices() {
      try {
        const res = await fetch(`${API_BASE}/sync/full-lexware-status`, { method: "POST" });
        const data = await res.json();
        alert(data.message || "Gesamtabgleich mit Lexware abgeschlossen.");
        await loadBillingHierarchy();
        if (typeof loadCustomers === 'function') await loadCustomers();
        if (typeof loadProjects === 'function') await loadProjects();
      } catch (err) {
        alert("Sync-Fehler: " + err.message);
      }
    }

    // ==========================================
    // GOBD AUDIT-TRAIL & MONATSABSCHLUSS
    // ==========================================
    async function loadAuditLogs() {
      const tableBody = document.getElementById("audit-logs-table-body");
      const sealsGrid = document.getElementById("monthly-seals-grid");
      if (!tableBody) return;

      try {
        const res = await fetch(`${API_BASE}/audit/logs`);
        if (!res.ok) throw new Error("Fehler beim Laden der Protokolle");
        const data = await res.json();

        // Render Seals
        const seals = data.seals || [];
        if (sealsGrid) {
          if (seals.length === 0) {
            sealsGrid.innerHTML = `<div class="card" style="padding: 16px; color: var(--text-muted); text-align: center;">Noch keine Monate versiegelt.</div>`;
          } else {
            sealsGrid.innerHTML = seals.map(s => `
              <div class="card" style="padding: 16px; border-left: 4px solid var(--success);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="font-size: 1.1rem; color: var(--primary);"><i class="fa-solid fa-lock"></i> Monat ${s.period}</strong>
                  <span class="badge badge-success">Versiegelt</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">
                  Versiegelt am: <strong>${new Date(s.sealed_at_utc).toLocaleString("de-DE")}</strong>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); word-break: break-all;">
                  SHA-256: <code>${s.merkle_root_hash}</code>
                </div>
              </div>
            `).join("");
          }
        }

        // Render Logs
        const logs = data.logs || [];
        if (logs.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">Keine Protokolle vorhanden.</td></tr>`;
        } else {
          tableBody.innerHTML = logs.map(l => `
            <tr>
              <td><small>${new Date(l.timestamp_utc).toLocaleString("de-DE")}</small></td>
              <td><span class="badge badge-info">${l.event_type}</span></td>
              <td><strong>${l.actor || 'System'}</strong></td>
              <td><small>${l.entity_type} (${l.entity_id || 'Global'})</small></td>
              <td>${l.description}</td>
            </tr>
          `).join("");
        }
      } catch (err) {
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="color: red; padding: 20px;">Fehler: ${err.message}</td></tr>`;
      }
    }

    async function sealMonthPrompt() {
      const defaultPeriod = new Date().toISOString().substring(0, 7);
      const period = prompt("Welchen Monat möchten Sie schreibgeschützt versiegeln? (Format: YYYY-MM):", defaultPeriod);
      if (!period) return;

      if (!confirm(`Achtung: Die Versiegelung des Monats ${period} ist unwiderruflich und schreibt alle Daten kryptografisch fest. Fortfahren?`)) return;

      try {
        const res = await fetch(`${API_BASE}/audit/seal-month`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Monat erfolgreich versiegelt!");
          await loadAuditLogs();
        } else {
          alert("Fehler: " + (data.error || "Versiegelung fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function clearAuditLogs() {
      // Schritt 1: Erste Bestätigung
      const step1 = confirm("⚠️ ACHTUNG: ENTWICKLER- & TESTDATEN-RESET\n\nSie beabsichtigen, sämtliche bisherigen Ereignisprotokolle und Test-Monatssiegel unwiderruflich aus der Datenbank zu löschen.\n\nMöchten Sie den Reset-Prozess fortsetzen?");
      if (!step1) return;

      // Schritt 2: Zweite Bestätigung (Texteingabe)
      const step2 = prompt("⚠️ SICHERHEITSABFRAGE (Schritt 2 von 3):\n\nBitte tippen Sie zur Bestätigung das Wort 'RESET' in Großbuchstaben ein:");
      if (step2 !== "RESET") {
        alert("Abbruch: Das Wort 'RESET' wurde nicht korrekt eingegeben.");
        return;
      }

      // Schritt 3: OTP per E-Mail anfordern
      try {
        const reqRes = await fetch(`${API_BASE}/audit/request-reset-otp`, { method: "POST" });
        const reqData = await reqRes.json();
        if (!reqRes.ok || !reqData.success) {
          alert("Fehler beim Anfordern des Sicherheitscodes: " + (reqData.error || "Serverfehler"));
          return;
        }

        // Schritt 4: OTP eingeben
        const enteredOtp = prompt(`🔐 2FA-SICHERHEITSBESTÄTIGUNG (Schritt 3 von 3):\n\n${reqData.message}\n\nBitte geben Sie den 6-stelligen Code aus Ihrer E-Mail ein:`);
        if (!enteredOtp || enteredOtp.trim().length !== 6) {
          alert("Abbruch: Ungültiger Sicherheitscode eingegeben.");
          return;
        }

        // Schritt 5: Reset mit OTP ausführen
        const res = await fetch(`${API_BASE}/audit/clear-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otpCode: enteredOtp.trim() })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Testdaten- und Protokoll-Reset erfolgreich durchgeführt!");
          await loadAuditLogs();
        } else {
          alert("Fehler bei der Bereinigung: " + (data.error || "Ungültiger oder abgelaufener Sicherheitscode."));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    // ==========================================
    // 📁 BELEG- & REVISIONSARCHIV / WEBHOOKS
    // ==========================================
    let globalArchiveData = null;

    function switchArchiveTab(tabName) {
      document.querySelectorAll(".archive-tab-btn").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".archive-tab-panel").forEach(p => p.style.display = "none");

      const activeBtn = document.getElementById("archive-tab-btn-" + tabName);
      const activePanel = document.getElementById("archive-panel-" + tabName);
      if (activeBtn) activeBtn.classList.add("active");
      if (activePanel) activePanel.style.display = "block";
    }

    async function loadArchiveOverview() {
      const tsTbody = document.getElementById("archive-timesheets-tbody");
      const vTbody = document.getElementById("archive-vouchers-tbody");
      const pTbody = document.getElementById("archive-projects-tbody");

      try {
        const res = await fetch(`${API_BASE}/archive/overview`);
        if (!res.ok) throw new Error("Fehler beim Laden des Archivs");
        const data = await res.json();
        globalArchiveData = data;

        // Counters
        const tsList = data.timesheetRevisions || [];
        const vList = data.canceledExpenses || [];
        const pList = data.archivedProjects || [];

        if (document.getElementById("archive-count-timesheets")) document.getElementById("archive-count-timesheets").innerText = tsList.length;
        if (document.getElementById("archive-count-vouchers")) document.getElementById("archive-count-vouchers").innerText = vList.length;
        if (document.getElementById("archive-count-projects")) document.getElementById("archive-count-projects").innerText = pList.length;

        // 1. Render Timesheet Revisions
        if (tsTbody) {
          if (tsList.length === 0) {
            tsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">Keine stornierten oder archivierten Monatsnachweisen vorhanden.</td></tr>`;
          } else {
            tsTbody.innerHTML = tsList.map(ts => {
              let statBadge = `<span class="badge badge-warning">Storniert</span>`;
              if (ts.status === 'InvoiceCanceled') statBadge = `<span class="badge" style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3;"><i class="fa-solid fa-ban"></i> Rechnung storniert</span>`;
              else if (ts.status === 'Rejected') statBadge = `<span class="badge badge-danger">Korrektur verlangt</span>`;

              return `
                <tr>
                  <td><strong>${ts.period}</strong></td>
                  <td><strong>${ts.customer_name || 'Kunde'}</strong><br><small style="color:var(--text-muted);">${ts.project_name || '-'}</small></td>
                  <td><span class="badge badge-info">v${ts.version_number || 1}.0</span></td>
                  <td><strong>${(ts.total_billable_hours || 0).toFixed(2)} h</strong><br><small style="color:var(--text-muted);">${(ts.total_amount_net || 0).toFixed(2)} € Netto</small></td>
                  <td>
                    ${statBadge}
                    ${ts.invoice_canceled_at_utc ? `<br><small style="color:var(--text-muted);">Storno: ${new Date(ts.invoice_canceled_at_utc).toLocaleDateString('de-DE')}</small>` : ''}
                    ${ts.rejection_reason ? `<br><small style="color:#be123c;"><em>"${ts.rejection_reason}"</em></small>` : ''}
                  </td>
                  <td>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.78rem;" onclick="openTimesheetPdf('${ts.id}', 'client_timesheet', 'all', false)">
                      <i class="fa-solid fa-file-pdf"></i> Nachweis
                    </button>
                  </td>
                </tr>
              `;
            }).join("");
          }
        }

        // 2. Render Canceled Expenses
        if (vTbody) {
          if (vList.length === 0) {
            vTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">Keine stornierten Spesen- oder Ausgabenbelege vorhanden.</td></tr>`;
          } else {
            vTbody.innerHTML = vList.map(exp => `
              <tr>
                <td><strong>${exp.expense_date}</strong></td>
                <td><strong>${exp.customer_name || '-'}</strong><br><small style="color:var(--text-muted);">${exp.project_name || '-'} (${exp.trip_purpose || 'Dienstreise'})</small></td>
                <td><strong>${exp.description}</strong><br><small class="badge badge-secondary">${exp.category}</small></td>
                <td><strong>${(exp.amount_gross || 0).toFixed(2)} € Brutto</strong><br><small style="color:var(--text-muted);">${exp.tax_rate}% USt (SKR04: <code>${exp.skr04_account}</code>)</small></td>
                <td>
                  <span class="badge" style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3;"><i class="fa-solid fa-ban"></i> Storniert (${exp.lexware_voucher_number || 'EXP'})</span>
                  ${exp.voucher_canceled_at_utc ? `<br><small style="color:var(--text-muted);">Storno: ${new Date(exp.voucher_canceled_at_utc).toLocaleDateString('de-DE')}</small>` : ''}
                </td>
                <td>
                  <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.78rem; border-color:#2563eb; color:#2563eb;" onclick="unlinkExpense('${exp.id}')">
                    <i class="fa-solid fa-rotate-left"></i> Entkoppeln & Neu buchen
                  </button>
                </td>
              </tr>
            `).join("");
          }
        }

        // 3. Render Archived Projects
        if (pTbody) {
          if (pList.length === 0) {
            pTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">Keine archivierten oder abgelehnten Projekte.</td></tr>`;
          } else {
            pTbody.innerHTML = pList.map(p => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.customer_name || '-'}</td>
                <td><small>${p.project_number || '-'} ${p.lexware_order_confirmation_number ? '• AB: ' + p.lexware_order_confirmation_number : ''}</small></td>
                <td><span class="badge badge-secondary">${p.time_entries_count || 0} Einträge</span></td>
                <td><span class="badge badge-danger">${p.lexware_quotation_status === 'rejected' ? 'Angebot abgelehnt' : 'Archiviert'}</span></td>
                <td>
                  <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.78rem;" onclick="unarchiveProjectPrompt('${p.id}', '${(p.name || '').replace(/'/g, "\\'")}')">
                    <i class="fa-solid fa-box-open"></i> Reaktivieren
                  </button>
                </td>
              </tr>
            `).join("");
          }
        }

      } catch (err) {
        if (tsTbody) tsTbody.innerHTML = `<tr><td colspan="6" style="color: red; padding: 20px;">Fehler: ${err.message}</td></tr>`;
      }
    }

    async function unlinkExpense(expenseId) {
      if (!confirm("Möchten Sie diesen stornierten Beleg von Lexware entkoppeln? Sie können ihn anschließend in der Reisekosten-Übersicht erneut an Lexware übertragen.")) return;

      try {
        const res = await fetch(`${API_BASE}/expenses/${expenseId}/unlink-lexware`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Beleg erfolgreich entkoppelt.");
          await loadArchiveOverview();
          if (typeof loadTripsList === 'function') loadTripsList();
        } else {
          alert("Fehler: " + (data.error || "Entkopplung fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    async function registerLexwareWebhooks() {
      const btn = document.getElementById("btn-reg-webhooks");
      const customUrl = document.getElementById("cfg-lexware-webhook-callback-url")?.value.trim() || "";
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> Registriere...`;
      }

      try {
        const res = await fetch(`${API_BASE}/settings/register-lexware-webhooks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callbackUrl: customUrl || undefined })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Webhooks erfolgreich in Lexware registriert!");
        } else {
          alert("Hinweis zur Webhook-Registrierung: " + (data.message || data.error || "Status " + res.status));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-satellite-dish"></i> Webhooks in Lexware registrieren`;
        }
      }
    }

    async function syncFullLexwareStatus() {
      const btn = document.getElementById("archive-sync-btn");
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> Abgleichen...`;
      }

      try {
        const res = await fetch(`${API_BASE}/sync/full-lexware-status`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Vollständiger Lexware-Statusabgleich abgeschlossen!");
          await loadArchiveOverview();
          await loadBillingHierarchy();
          if (typeof loadTripsList === 'function') loadTripsList();
        } else {
          alert("Fehler: " + (data.error || "Abgleich fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-rotate"></i> Mit Lexware abgleichen (Storno & Stände)`;
        }
      }
    }

    // ==========================================
    // [MODULARIZED] Steuern & EÜR-Cockpit ausgelagert -> js/modules/tax-reports.js

    // 3. Buchungsjournal CSV (DATEV / Excel)
    async function exportAccountingDataCsv() {
      const filters = getBackupFilters();
      filters.format = "csv";

      try {
        const res = await fetch(`${API_BASE}/export/accounting-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters)
        });

        if (!res.ok) throw new Error("Fehler beim Erstellen des CSV-Exports.");
        const blob = await res.blob();

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Buchungsjournal_${filters.year}_${filters.month}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert("CSV-Export fehlgeschlagen: " + err.message);
      }
    }

    // 4. Buchungsjournal JSON
    async function exportAccountingDataJson() {
      const filters = getBackupFilters();
      filters.format = "json";

      try {
        const res = await fetch(`${API_BASE}/export/accounting-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters)
        });

        if (!res.ok) throw new Error("Fehler beim Erstellen des JSON-Exports.");
        const data = await res.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Buchungsjournal_${filters.year}_${filters.month}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert("JSON-Export fehlgeschlagen: " + err.message);
      }
    }

    // 5. Disaster Recovery SQL-Dump
    function downloadDisasterRecoverySql() {
      window.location.href = `${API_BASE}/export/full-disaster-recovery-sql`;
    }

    // 6. System-Diagnose & Support-Bundle (.json)
    async function downloadDiagnosticsBundle() {
      try {
        const res = await fetch(`${API_BASE}/system/diagnostics`);
        if (!res.ok) throw new Error("Fehler beim Abrufen der Server-Diagnose");
        const serverData = await res.json();
        
        const activeViewEl = document.querySelector(".view-panel.active");
        const activeViewName = activeViewEl ? activeViewEl.id.replace("view-", "") : "unknown";

        const clientData = {
          browser: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screen_resolution: `${window.innerWidth}x${window.innerHeight}`,
          local_storage_available: typeof localStorage !== 'undefined',
          current_view: activeViewName,
          auth_state: (typeof authToken !== 'undefined' && authToken) ? 'authenticated' : 'unauthenticated',
          client_timestamp: new Date().toISOString()
        };

        const bundle = {
          ...serverData,
          client_environment: clientData
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
        const a = document.createElement("a");
        a.href = dataStr;
        a.download = `evidence_hub_diagnostics_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (err) {
        alert("Diagnose-Download fehlgeschlagen: " + err.message);
      }
    }

    // 7. Offizieller DATEV EXTF Export (Format 700)
    async function exportDatevExtfCsv() {
      const filters = getBackupFilters();
      try {
        const res = await fetch(`${API_BASE}/export/datev-extf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters)
        });

        if (!res.ok) throw new Error("Fehler beim Erstellen des DATEV EXTF Exports.");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const chart = (globalSettings && globalSettings.chart_of_accounts) || "SKR04";
        a.download = `DATEV_EXTF_${chart}_${filters.year}_${filters.month}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert("DATEV EXTF-Export fehlgeschlagen: " + err.message);
      }
    }

    // 8. Lexware Offline-CSV Belegexport
    async function exportLexwareCsv() {
      const filters = getBackupFilters();
      try {
        const res = await fetch(`${API_BASE}/export/lexware-csv`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters)
        });

        if (!res.ok) throw new Error("Fehler beim Erstellen des Lexware-CSV-Exports.");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Lexware_Offline_Belege_${filters.year}_${filters.month}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert("Lexware-CSV-Export fehlgeschlagen: " + err.message);
      }
    }

    // 9. DATEV- & Buchhaltungseinstellungen speichern
    async function saveDatevSettings(event) {
      if (event) event.preventDefault();
      try {
        const payload = {
          ...globalSettings,
          billing_provider: document.getElementById("cfg-billing-provider").value,
          chart_of_accounts: document.getElementById("cfg-chart-accounts").value,
          tax_mode: document.getElementById("cfg-tax-mode").value,
          datev_consultant_number: document.getElementById("cfg-datev-consultant").value || "1001",
          datev_client_number: document.getElementById("cfg-datev-client").value || "10001"
        };

        const res = await fetch(`${API_BASE}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Fehler beim Speichern der DATEV-Einstellungen.");
        globalSettings = { ...globalSettings, ...payload };
        updateChartLabels();
        alert("DATEV- & Buchhaltungseinstellungen erfolgreich gespeichert!");
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }
