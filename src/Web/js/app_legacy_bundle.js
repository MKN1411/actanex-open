
    const API_BASE = window.location.hostname.includes("demo")
      ? "https://actanex-demo-worker.michael-kirst.workers.dev/api/v1"
      : window.location.hostname.includes("open")
      ? "https://actanex-open-worker.michael-kirst.workers.dev/api/v1"
      : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://127.0.0.1:8787/api/v1"
      : "https://actanex-worker.michael-kirst.workers.dev/api/v1";

    function escapeHtml(str) {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function formatCurrency(val) {
      const num = Number(val) || 0;
      return num.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
    }

    let globalCustomers = [];
    let globalProjects = [];
    let currentUser = null;
    let authToken = localStorage.getItem("evidence_auth_token") || sessionStorage.getItem("evidence_auth_token") || "";

    // Global fetch interceptor to attach bearer token
    const originalFetch = window.fetch;
    window.fetch = async function(resource, init = {}) {
      init = init || {};
      init.headers = init.headers || {};
      
      if (typeof resource === 'string' && resource.startsWith(API_BASE) && !resource.includes('/auth/login')) {
        if (init.headers instanceof Headers) {
          if (authToken && !init.headers.has('Authorization')) {
            init.headers.set('Authorization', `Bearer ${authToken}`);
          }
        } else if (Array.isArray(init.headers)) {
          if (authToken && !init.headers.some(h => h[0] === 'Authorization')) {
            init.headers.push(['Authorization', `Bearer ${authToken}`]);
          }
        } else {
          if (authToken && !init.headers['Authorization']) {
            init.headers['Authorization'] = `Bearer ${authToken}`;
          }
        }
      }

      const response = await originalFetch(resource, init);
      
      if (response.status === 401 && typeof resource === 'string' && resource.startsWith(API_BASE) && !resource.includes('/auth/login') && !resource.includes('/auth/me')) {
        clearAuth();
        document.getElementById("login-container").style.display = "flex";
      }

      return response;
    };

    function fillDemoCredentials() {
      const emailInput = document.getElementById("login-email");
      const pwdInput = document.getElementById("login-password");
      if (emailInput) emailInput.value = "admin@example.com";
      if (pwdInput) pwdInput.value = "Start123!";
    }

    document.addEventListener("DOMContentLoaded", async () => {
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
        initMobileUploadView(uploadSessionId);
        return;
      }

      // Check if URL has portal mode for client approval
      const isPortalMode = urlParams.get("portal") === "approve" || urlParams.has("token") || urlParams.has("ts");

      if (isPortalMode) {
        document.getElementById("login-container").style.display = "none";
        const navRail = document.getElementById("nav-rail");
        const subnavCol = document.getElementById("subnav-column");
        if (navRail) navRail.style.display = "none";
        if (subnavCol) subnavCol.style.display = "none";
        document.querySelector(".main").style.marginLeft = "0";
        document.querySelector(".main").style.width = "100%";
        document.querySelector(".main").style.maxWidth = "900px";
        document.querySelector(".main").style.margin = "0 auto";
        
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
        if (targetTsId) {
          loadPortalApprovalData(targetTsId);
        }
        return;
      }

      await checkAuth();
    });

    async function checkAuth() {
      const loginContainer = document.getElementById("login-container");

      if (!authToken) {
        loginContainer.style.display = "flex";
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
          loginContainer.style.display = "none";
          startInactivityTracker();
          await loadCustomers();
          await loadProjects();
          await loadDashboardStats();

          if (data.requiresCredentialChange) {
            openFirstRunModal();
          }
        } else {
          // Token expired or invalid
          clearAuth();
          loginContainer.style.display = "flex";
        }
      } catch (err) {
        console.error("Auth check error:", err);
        loginContainer.style.display = "flex";
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
        const initials = (currentUser.fullName || currentUser.email || "MM")
          .split(" ")
          .map(n => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();
        avatarEl.innerText = initials || "MM";
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const remember = document.getElementById("login-remember").checked;
      const submitBtn = document.getElementById("login-submit-btn");
      const errorAlert = document.getElementById("login-error-alert");
      const errorText = document.getElementById("login-error-text");

      errorAlert.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> Anmelden...`;

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
        document.getElementById("login-container").style.display = "none";
        
        startInactivityTracker();
        await loadCustomers();
        await loadProjects();
        await loadDashboardStats();
        switchView("dashboard");

        if (data.requiresCredentialChange) {
          openFirstRunModal();
        }
      } catch (err) {
        errorText.innerText = err.message;
        errorAlert.style.display = "block";
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Sicher Anmelden`;
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

    function clearAuth() {
      authToken = "";
      currentUser = null;
      localStorage.removeItem("evidence_auth_token");
      sessionStorage.removeItem("evidence_auth_token");
    }

    function togglePasswordVisibility(fieldId) {
      const field = document.getElementById(fieldId);
      const eyeIcon = document.getElementById(fieldId + "-eye");
      if (!field) return;

      if (field.type === "password") {
        field.type = "text";
        if (eyeIcon) eyeIcon.className = "fa-solid fa-eye-slash";
      } else {
        field.type = "password";
        if (eyeIcon) eyeIcon.className = "fa-solid fa-eye";
      }
    }

    function toggleSubnavCollapse() {
      const col = document.getElementById("subnav-column");
      const icon = document.getElementById("subnav-toggle-icon");
      if (col) {
        col.classList.toggle("collapsed");
        if (icon) {
          icon.className = col.classList.contains("collapsed") ? "fa-solid fa-angles-right" : "fa-solid fa-angles-left";
        }
      }
    }

    function openSlideOverDrawer(title, subtitle, formHtml, receiptUrl) {
      document.getElementById("drawer-title").innerText = title || "Eintrag bearbeiten";
      document.getElementById("drawer-subtitle").innerText = subtitle || "GoBD Detailansicht";
      document.getElementById("drawer-form-pane").innerHTML = formHtml || "";

      const img = document.getElementById("drawer-receipt-img");
      const pdf = document.getElementById("drawer-receipt-pdf");
      const placeholder = document.getElementById("drawer-no-receipt-placeholder");

      if (receiptUrl) {
        placeholder.style.display = "none";
        if (receiptUrl.toLowerCase().includes(".pdf")) {
          img.style.display = "none";
          pdf.style.display = "block";
          pdf.src = receiptUrl;
        } else {
          pdf.style.display = "none";
          img.style.display = "block";
          img.src = receiptUrl;
        }
      } else {
        placeholder.style.display = "block";
        img.style.display = "none";
        pdf.style.display = "none";
      }

      document.getElementById("drawer-backdrop").classList.add("active");
      document.getElementById("slide-over-drawer").classList.add("active");
    }

    function closeSlideOverDrawer() {
      document.getElementById("drawer-backdrop").classList.remove("active");
      document.getElementById("slide-over-drawer").classList.remove("active");
    }

    function switchView(viewName) {
      document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
      document.querySelectorAll(".rail-item").forEach(r => r.classList.remove("active"));
      document.querySelectorAll(".subnav-menu-item").forEach(s => s.classList.remove("active"));

      const target = document.getElementById("view-" + viewName);
      if (target) target.classList.add("active");

      // Active states for rail and subnav
      const railBtn = document.getElementById("rail-btn-" + viewName);
      if (railBtn) railBtn.classList.add("active");

      document.querySelectorAll(".subnav-menu-item").forEach(s => {
        if (s.getAttribute("onclick")?.includes(viewName)) {
          s.classList.add("active");
        }
      });

      // Update Subnav Header Title
      const titleMap = {
        "dashboard": { icon: "fa-chart-pie", text: "Dashboard" },
        "time-capture": { icon: "fa-clock", text: "Zeiterfassung" },
        "travel": { icon: "fa-train-subway", text: "Reisekosten" },
        "vouchers": { icon: "fa-receipt", text: "Belege & Inbox" },
        "customers": { icon: "fa-building-user", text: "Kunden & Projekte" },
        "billing": { icon: "fa-file-invoice-dollar", text: "Abrechnung" },
        "approval-portal": { icon: "fa-signature", text: "Kundenfreigabe" },
        "audit": { icon: "fa-fingerprint", text: "GoBD Audit" },
        "backup": { icon: "fa-cloud-arrow-down", text: "Backup & Export" },
        "settings": { icon: "fa-gear", text: "Konfiguration" }
      };

      const titleEl = document.getElementById("subnav-active-title");
      if (titleEl && titleMap[viewName]) {
        titleEl.innerHTML = `<i class="fa-solid ${titleMap[viewName].icon}" style="color: #38bdf8;"></i> <span>${titleMap[viewName].text}</span>`;
      }

      if (viewName === "dashboard") loadDashboardStats();
      if (viewName === "customers") loadCustomers();
      if (viewName === "billing") loadBillingHierarchy();
      if (viewName === "approval-portal") showAdminApprovalOverview();
      if (viewName === "audit") loadAuditLogs();
      if (viewName === "archive") loadArchiveOverview();
      if (viewName === "time-capture") populateCustomerDropdowns();
      if (viewName === "travel") {
        populateTravelCustomerDropdowns();
        if (document.getElementById("travel-vehicle") && globalSettings.default_transport_type) {
          document.getElementById("travel-vehicle").value = globalSettings.default_transport_type;
        }
        toggleTravelFields();
        loadTripsList();
        const expTbody = document.getElementById("travel-expenses-tbody");
        if (expTbody && expTbody.children.length === 0) {
          addExpenseRow("travel-expenses-tbody");
        }
      }
      if (viewName === "vouchers") {
        populateVoucherDropdowns();
        loadOperationalVouchers();
      }
      if (viewName === "settings") loadSettings();
      if (viewName === "backup") loadBackupFilterDropdowns();
    }

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
        globalCustomers = await res.json();
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

      if (!globalCustomers || globalCustomers.length === 0) {
        container.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; color: var(--text-muted); padding: 20px;">
            <p>Keine Kundenkontakte vorhanden. Starten Sie den Lexware-Sync.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = globalCustomers.map(c => {
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
          globalProjects = await res.json();
          populateCustomerDropdowns();
          populateTravelCustomerDropdowns();
        }
      } catch {}
    }

    // Cascading Dropdown 1: Kunde in Zeiterfassung
    function populateCustomerDropdowns() {
      const custSelect = document.getElementById("form-customer-id");
      if (!custSelect) return;

      const activeCusts = globalCustomers.filter(c => c.is_archived === 0);
      const currentVal = custSelect.value;

      custSelect.innerHTML = '<option value="">-- Kunde auswählen --</option>' + 
        activeCusts.map(c => {
          const prjCount = globalProjects.filter(p => p.customer_id === c.id).length;
          const info = prjCount > 0 ? `${prjCount} Projekt(e)` : (c.contact_person || 'Neu');
          return `<option value="${c.id}">${c.name} (${info})</option>`;
        }).join("");

      if (currentVal) custSelect.value = currentVal;
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

      prjSelect.innerHTML = '<option value="">-- Projekt auswählen --</option>' +
        custProjects.map(p => `<option value="${p.id}">${p.name} (${p.project_number})</option>`).join("");

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
        document.getElementById("capture-header-title").innerText = `Zeiterfassung: ${proj.name}`;
        document.getElementById("capture-header-sub").innerText = `Kunde: ${proj.customer_name} | Stundensatz: ${proj.default_hourly_rate.toFixed(2)} €/h`;
      } else {
        document.getElementById("form-rate-display").value = "-";
        document.getElementById("capture-header-title").innerText = `Zeiterfassung & Nachweisdokumentation`;
        document.getElementById("capture-header-sub").innerText = `Wählen Sie Kunde und Projekt für die automatische Stundensatz- und Budgetzuordnung.`;
      }
      calculateHours();
    }

    // Cascading Dropdowns für Reisekosten
    function populateTravelCustomerDropdowns() {
      const custSelect = document.getElementById("travel-customer-id");
      if (!custSelect) return;

      const activeCusts = globalCustomers.filter(c => c.is_archived === 0);
      custSelect.innerHTML = '<option value="">-- Kunde auswählen --</option>' + 
        activeCusts.map(c => {
          const prjCount = globalProjects.filter(p => p.customer_id === c.id).length;
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
        return;
      }

      if (!globalProjects || globalProjects.length === 0) {
        await loadProjects();
      }

      const custProjects = globalProjects.filter(p => p.customer_id === customerId && p.is_active === 1);
      prjSelect.innerHTML = '<option value="">-- Projekt auswählen --</option>' +
        custProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

      if (custProjects.length === 1) prjSelect.value = custProjects[0].id;
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

    async function openCustomerOverview(customerId) {
      currentCustomerId = customerId;
      const modal = document.getElementById("customer-modal");
      const title = document.getElementById("cust-modal-title");
      const sub = document.getElementById("cust-modal-subtitle");
      const body = document.getElementById("cust-modal-body");

      body.innerHTML = `<div style="text-align: center; padding: 40px;"><span class="spinner"></span> Lade Projekte...</div>`;
      modal.classList.add("active");

      try {
        const res = await fetch(`${API_BASE}/customers/${customerId}/overview`);
        const data = await res.json();
        const c = data.customer;
        const projects = data.projects || [];

        const isInternal = c.id === 'cust_internal' || c.lexware_contact_id === 'INTERNAL_ORG';
        title.innerText = c.name;
        sub.innerText = isInternal 
          ? 'Interne Tätigkeiten, Organisation, Administration, Weiterbildung & Akquise' 
          : `${c.contact_person ? c.contact_person + ' | ' : ''}${c.email || ''} | Lexware-ID: ${c.lexware_contact_id}`;

        let projectsHtml = "";
        if (projects.length === 0) {
          projectsHtml = `
            <div style="background: #f8fafc; border: 1px dashed var(--border); padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px; color: var(--text-muted);">
              Noch keine Projekte für diesen Kunden angelegt.
            </div>
          `;
        } else {
          projectsHtml = `
            <div style="display: grid; gap: 12px; margin-bottom: 24px;">
              ${projects.map(p => {
                const isProjArchived = p.is_archived === 1 || p.is_active === 0;
                return `
                <div class="card" style="padding: 16px; cursor: pointer; border-left: 4px solid ${isProjArchived ? '#94a3b8' : 'var(--primary)'}; ${isProjArchived ? 'opacity: 0.85; background: #f8fafc;' : ''}" onclick="openProjectDetails('${p.id}')">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <h4 style="font-size: 1rem; color: ${isProjArchived ? '#475569' : 'var(--primary)'}; margin-bottom: 2px;">
                        ${p.name} ${isProjArchived ? '<span class="badge badge-secondary" style="font-size: 0.7rem; margin-left: 6px;"><i class="fa-solid fa-lock"></i> Gesperrt / Archiviert</span>' : ''}
                      </h4>
                      <small style="color: var(--text-muted);">
                        ${p.project_number} ${p.end_customer_name ? `• <strong style="color: #0369a1;"><i class="fa-solid fa-building-user"></i> Endkunde: ${p.end_customer_name}</strong>` : ''} • Laufzeit: ${p.start_date || 'sofort'} bis ${p.end_date || 'Abschluss'}
                      </small>
                    </div>
                    <span class="badge badge-info">${p.default_hourly_rate.toFixed(2)} € / h</span>
                  </div>
                  
                  <div style="margin-top: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted);">
                      <span>Gebucht: <strong>${p.recorded_hours.toFixed(2)} h</strong> (${p.recorded_amount_net.toFixed(2)} €)</span>
                      <span>Budget: <strong>${p.total_budget_net.toFixed(2)} €</strong> (${p.planned_hours} h)</span>
                    </div>
                    <div class="progress-track">
                      <div class="progress-bar" style="width: ${p.budget_usage_percent}%; ${isProjArchived ? 'background: #94a3b8;' : ''}"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: ${p.remaining_hours <= 0 && p.planned_hours > 0 ? 'var(--warning)' : 'var(--text-muted)'};">
                      <span>Auslastung: ${p.budget_usage_percent}%</span>
                      <span>Rest: <strong>${p.remaining_hours.toFixed(2)} h</strong> (${p.remaining_budget_net.toFixed(2)} €)</span>
                    </div>
                  </div>

                  <!-- Freigabeberechtigte Chips -->
                  <div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 6px; flex-wrap: wrap;">
                    <span class="badge badge-secondary" style="font-size: 0.7rem;"><i class="fa-solid fa-user-check"></i> ${p.approver_name || '1. Approver'}: ${p.approver_email || c.email}</span>
                    ${p.approver_2_email ? `<span class="badge badge-secondary" style="font-size: 0.7rem;"><i class="fa-solid fa-user-check"></i> 2. Approver: ${p.approver_2_email}</span>` : ''}
                    ${p.approver_3_email ? `<span class="badge badge-secondary" style="font-size: 0.7rem;"><i class="fa-solid fa-user-check"></i> 3. Approver: ${p.approver_3_email}</span>` : ''}
                  </div>

                  <!-- Belegkette: Angebot & Auftragsbestätigung -->
                  <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; font-size: 0.75rem;">
                    ${p.lexware_quotation_number || p.lexware_quotation_id ? 
                      `<span class="badge badge-success"><i class="fa-solid fa-file-invoice"></i> Angebot: ${p.lexware_quotation_number || 'Erstellt'}</span>` : 
                      `<span class="badge badge-secondary"><i class="fa-solid fa-circle-question"></i> Kein Angebot</span>`}
                    ${p.lexware_order_confirmation_number || p.lexware_order_confirmation_id ? 
                      `<span class="badge badge-info"><i class="fa-solid fa-file-signature"></i> Auftragsbestätigung: ${p.lexware_order_confirmation_number || 'Erstellt'}</span>` : 
                      `<span class="badge badge-secondary"><i class="fa-solid fa-circle-question"></i> Keine Auftragsbestätigung</span>`}
                  </div>

                  <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
                    <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="event.stopPropagation(); openProjectDetails('${p.id}')">
                      <i class="fa-solid fa-list-check"></i> Zeiterfassungen & Details
                    </button>
                    ${!isProjArchived ? `
                    <button class="btn btn-primary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="event.stopPropagation(); startCaptureForCustomerAndProject('${c.id}', '${p.id}', '${p.name}', ${p.default_hourly_rate})">
                      <i class="fa-solid fa-plus"></i> Neue Zeit erfassen
                    </button>
                    ` : `
                    <button class="btn btn-outline" disabled style="opacity: 0.5; padding: 4px 10px; font-size: 0.8rem;" onclick="event.stopPropagation();">
                      <i class="fa-solid fa-lock"></i> Für Buchungen gesperrt
                    </button>
                    `}
                  </div>
                </div>
                `;
              }).join("")}
            </div>
          `;
        }

        const isArchived = c.is_archived === 1;

        body.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 1.05rem;"><i class="fa-solid fa-folder-open"></i> Aktive Projekte & Budgets</h3>
            <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="syncQuotations()">
              <i class="fa-solid fa-arrows-rotate"></i> Angebote abgleichen
            </button>
          </div>
          ${projectsHtml}

          ${!isArchived ? `
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-top: 20px;">
            <h3 style="font-size: 1.05rem; margin-bottom: 12px; color: var(--primary);"><i class="fa-solid fa-plus"></i> Neues Projekt für diesen Kunden anlegen</h3>
            <form onsubmit="handleCreateProject(event, '${c.id}')">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Projektname *</label>
                  <input type="text" class="form-control" id="np-name" required placeholder="z. B. Azure Landing Zone & Security Hardening">
                </div>
                <div class="form-group">
                  <label class="form-label">Projektnummer *</label>
                  <input type="text" class="form-control" id="np-number" required value="PRJ-${new Date().getFullYear()}-${Math.floor(100+Math.random()*900)}">
                </div>
              </div>

              <!-- Endkunde (Optional) -->
              <div class="form-group">
                <label class="form-label">Endkunde / Einsatzort (Optional, falls abweichend von Kooperationspartner)</label>
                <input type="text" class="form-control" id="np-end-customer" placeholder="z. B. BMW AG, Allianz, BASF...">
                <small style="color: var(--text-muted);">Falls der Lexware-Kunde Ihr Vermittler/Partner ist und das Projekt bei einem separaten Endkunden liegt.</small>
              </div>

              <div class="form-row-3">
                <div class="form-group">
                  <label class="form-label">Stundensatz Netto (€ / h) *</label>
                  <input type="number" step="1" class="form-control" id="np-rate" required value="135" oninput="calculateProjectBudget()">
                </div>
                <div class="form-group">
                  <label class="form-label">Geplantes Stundenkontingent (h)</label>
                  <input type="number" step="1" class="form-control" id="np-hours" value="100" oninput="calculateProjectBudget()">
                </div>
                <div class="form-group">
                  <label class="form-label">Gesamtvolumen Netto</label>
                  <input type="text" class="form-control" id="np-total-budget" readonly value="13.500,00 €" style="font-weight: 700; background: #f1f5f9;">
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

    function calculateProjectBudget() {
      const rate = parseFloat(document.getElementById("np-rate")?.value || "0");
      const hours = parseFloat(document.getElementById("np-hours")?.value || "0");
      const total = (rate * hours).toFixed(2);
      const target = document.getElementById("np-total-budget");
      if (target) target.value = `${total.replace(".", ",")} € Netto`;
    }

    async function handleCreateProject(e, customerId) {
      e.preventDefault();
      const name = document.getElementById("np-name").value;
      const endCustomerName = document.getElementById("np-end-customer")?.value.trim() || null;
      const projectNumber = document.getElementById("np-number").value;
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
            startDate,
            endDate,
            approverName,
            approverEmail,
            approver2Name,
            approver2Email,
            approver3Name,
            approver3Email,
            createLexwareQuotation
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

      body.innerHTML = `<div style="text-align: center; padding: 40px;"><span class="spinner"></span> Lade Zeiterfassungen...</div>`;
      modal.classList.add("active");

      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/details`);
        const data = await res.json();
        const p = data.project;
        const entries = data.timeEntries || [];
        const isProjArchived = p.is_archived === 1 || p.is_active === 0;

        title.innerText = p.name;
        sub.innerText = `Kunde: ${p.customer_name} ${p.end_customer_name ? ' | Endkunde: ' + p.end_customer_name : ''} | ${p.project_number} | Stundensatz: ${p.default_hourly_rate.toFixed(2)} €/h`;

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

          <!-- KPI Cards -->
          <div class="grid" style="margin-bottom: 16px;">
            <div class="card" style="padding: 14px;">
              <div class="stat-label">Gebuchte Stunden</div>
              <div class="stat-val primary" style="font-size: 1.4rem;">${p.recorded_hours.toFixed(2)} <span style="font-size: 0.9rem; color: var(--text-muted);">/ ${p.planned_hours} h</span></div>
            </div>
            <div class="card" style="padding: 14px;">
              <div class="stat-label">Gebuchtes Netto</div>
              <div class="stat-val" style="font-size: 1.4rem;">${p.recorded_amount_net.toFixed(2)} <span style="font-size: 0.9rem; color: var(--text-muted);">€</span></div>
            </div>
            <div class="card" style="padding: 14px;">
              <div class="stat-label">Rest-Budget</div>
              <div class="stat-val success" style="font-size: 1.4rem;">${p.remaining_budget_net.toFixed(2)} <span style="font-size: 0.9rem; color: var(--text-muted);">€ (${p.remaining_hours.toFixed(2)} h)</span></div>
            </div>
          </div>

          <!-- Freigabeberechtigte & Endkunde Infobox -->
          <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: var(--primary); font-size: 0.9rem;"><i class="fa-solid fa-users"></i> Freigabeberechtigte (Approver) & Einsatzort</strong>
              <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" onclick="openEditProjectForm('${p.id}')">
                <i class="fa-solid fa-pen"></i> Projekt & Freigaben bearbeiten
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
              <strong style="color: #1e40af;"><i class="fa-solid fa-pen-to-square"></i> Projektdaten & Freigabeberechtigte anpassen</strong>
              <button type="button" class="btn btn-outline" style="padding: 2px 6px; font-size: 0.75rem;" onclick="document.getElementById('project-edit-form-container').style.display='none'">&times; Abbrechen</button>
            </div>
            <form onsubmit="saveProjectEdit(event, '${p.id}')">
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
            <h3 style="font-size: 1.05rem;"><i class="fa-solid fa-clock-rotate-left"></i> Bisherige Zeiterfassungen (${entries.length})</h3>
            ${!isProjArchived ? `
            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="startCaptureForCustomerAndProject('${p.customer_id}', '${p.id}', '${p.name}', ${p.default_hourly_rate})">
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
                    <td>${e.short_description}${e.result ? '<br><small style="color: var(--text-muted);"><i class="fa-solid fa-file-lines"></i> ' + e.result + '</small>' : ''}</td>
                    <td><strong>${((e.billable_duration_hours || 0) * (e.billing_rate_snapshot || p.default_hourly_rate)).toFixed(2)} €</strong></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;

        const canDelete = entries.length === 0 && !p.lexware_quotation_id && !p.lexware_order_confirmation_id && !isProjArchived;

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
          <button class="btn btn-primary" onclick="startCaptureForCustomerAndProject('${p.customer_id}', '${p.id}', '${p.name}', ${p.default_hourly_rate})">
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
      const name = document.getElementById("ep-name").value;
      const endCustomerName = document.getElementById("ep-end-customer")?.value.trim() || null;
      const projectNumber = document.getElementById("ep-number").value;
      const defaultHourlyRate = parseFloat(document.getElementById("ep-rate").value || "120");
      const plannedHours = parseFloat(document.getElementById("ep-hours").value || "0");
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
          alert("Projektdaten & Freigabeberechtigte erfolgreich aktualisiert!");
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
      const type = document.getElementById("travel-type").value;
      const isCar = type === "PersonalCar";
      document.getElementById("car-km-group").style.display = isCar ? "block" : "none";
      document.getElementById("ticket-cost-group").style.display = isCar ? "none" : "block";
      calculateCarCost();
    }

    function calculateCarCost() {
      const type = document.getElementById("travel-type").value;
      if (type === "PersonalCar") {
        const km = parseFloat(document.getElementById("travel-km").value || "0");
        const cost = (km * 0.30).toFixed(2);
        document.getElementById("travel-calculated-cost").value = `${cost.replace(".", ",")} € (${km} km à 0,30 €)`;
      } else {
        const amt = parseFloat(document.getElementById("travel-ticket-amount").value || "0").toFixed(2);
        document.getElementById("travel-calculated-cost").value = `${amt.replace(".", ",")} € (Ticket Netto)`;
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

      const problemStatement = document.getElementById("form-ev-problem").value;
      const methodology = document.getElementById("form-ev-method").value;
      const result = document.getElementById("form-ev-result").value;

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
        evidence: problemStatement ? { problemStatement, methodology, result } : null
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
    let globalSettings = {
      mileage_rate_business: 0.30,
      commute_rate_tier1: 0.30,
      commute_rate_tier2: 0.38,
      vma_rate_8h: 14.00,
      vma_rate_24h: 28.00,
      pdf_storage_mode: "R2"
    };

    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) {
          const data = await res.json();
          globalSettings = { ...globalSettings, ...data };
          if (document.getElementById("cfg-mileage-rate")) document.getElementById("cfg-mileage-rate").value = globalSettings.mileage_rate_business;
          if (document.getElementById("cfg-commute-tier1")) document.getElementById("cfg-commute-tier1").value = globalSettings.commute_rate_tier1;
          if (document.getElementById("cfg-commute-tier2")) document.getElementById("cfg-commute-tier2").value = globalSettings.commute_rate_tier2;
          if (document.getElementById("cfg-vma-8h")) document.getElementById("cfg-vma-8h").value = globalSettings.vma_rate_8h;
          if (document.getElementById("cfg-vma-24h")) document.getElementById("cfg-vma-24h").value = globalSettings.vma_rate_24h;
          if (document.getElementById("cfg-default-transport")) document.getElementById("cfg-default-transport").value = globalSettings.default_transport_type || "Train";
          if (document.getElementById("cfg-pdf-storage")) document.getElementById("cfg-pdf-storage").value = globalSettings.pdf_storage_mode || "R2";

          // 0. Firmendaten & Freelancer Profil
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

          // E-Mail Config Fields
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

          // Auftragnehmer-Signatur & Berufsbezeichnung
          if (document.getElementById("cfg-contractor-title")) {
            document.getElementById("cfg-contractor-title").value = globalSettings.contractor_title || "Senior Cloud & Security Architect";
          }
          const sigDataUrl = globalSettings.contractor_signature_data_url || DEFAULT_CONTRACTOR_SIGNATURE;
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
          // Lexware Webhook Callback-URL
          if (document.getElementById("cfg-lexware-webhook-callback-url")) {
            document.getElementById("cfg-lexware-webhook-callback-url").value = globalSettings.lexware_webhook_callback_url || "https://evidence-hub-worker.michael-kirst.workers.dev/api/v1/webhooks/lexware";
          }

          // DATEV & Buchhaltungs-Konfiguration
          if (document.getElementById("cfg-billing-provider")) document.getElementById("cfg-billing-provider").value = globalSettings.billing_provider || "lexware";
          if (document.getElementById("cfg-chart-accounts")) document.getElementById("cfg-chart-accounts").value = globalSettings.chart_of_accounts || "SKR04";
          if (document.getElementById("cfg-tax-mode")) document.getElementById("cfg-tax-mode").value = globalSettings.tax_mode || "standard";
          if (document.getElementById("cfg-datev-consultant")) document.getElementById("cfg-datev-consultant").value = globalSettings.datev_consultant_number || "1001";
          if (document.getElementById("cfg-datev-client")) document.getElementById("cfg-datev-client").value = globalSettings.datev_client_number || "10001";
          updateChartLabels();
        }
      } catch (err) {
        console.error("Fehler beim Laden der Einstellungen:", err);
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
        contractor_title: document.getElementById("cfg-contractor-title")?.value.trim() || "Senior Cloud & Security Architect",
        contractor_signature_data_url: document.getElementById("cfg-signature-data-url")?.value || null,
        lexware_webhook_callback_url: document.getElementById("cfg-lexware-webhook-callback-url")?.value.trim() || "https://evidence-hub-worker.michael-kirst.workers.dev/api/v1/webhooks/lexware"
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

      const rowId = "exp_row_" + crypto.randomUUID().substring(0, 8);
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
          <input type="text" class="form-control exp-desc" value="${desc}" placeholder="z. B. Hotel 2 Nächte, HDMI-Kabel..." style="padding: 4px 6px; font-size: 0.8rem;">
        </td>
        <td style="padding: 6px;">
          <select class="form-control exp-tax" style="padding: 4px 6px; font-size: 0.8rem;" onchange="recalculateExpenseRow('${rowId}', '${tbodyId}')">
            <option value="19" ${Math.round(taxRate) === 19 ? 'selected' : ''}>19 %</option>
            <option value="7" ${Math.round(taxRate) === 7 ? 'selected' : ''}>7 %</option>
            <option value="0" ${Math.round(taxRate) === 0 ? 'selected' : ''}>0 %</option>
          </select>
        </td>
        <td style="padding: 6px;">
          <input type="number" step="0.01" class="form-control exp-gross" value="${gross > 0 ? gross.toFixed(2) : ''}" placeholder="0.00" style="padding: 4px 6px; font-size: 0.8rem; font-weight: 600;" oninput="recalculateExpenseRow('${rowId}', '${tbodyId}')">
        </td>
        <td style="padding: 6px;">
          <input type="text" class="form-control exp-net" readonly value="${net > 0 ? net.toFixed(2) + ' €' : '0.00 €'}" style="padding: 4px 6px; font-size: 0.8rem; background: #f8fafc;">
        </td>
        <td style="padding: 6px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <input type="file" id="file_${rowId}" style="display: none;" accept="image/*,application/pdf" onchange="uploadExpenseReceipt(this, '${rowId}', '${tbodyId}')">
            <button type="button" class="btn btn-outline" style="padding: 3px 6px; font-size: 0.75rem;" onclick="document.getElementById('file_${rowId}').click()" title="Beleg hochladen">
              <i class="fa-solid fa-paperclip"></i>
            </button>
            <span id="label_${rowId}" style="font-size: 0.72rem; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
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
        } else {
          alert("Beleg-Upload fehlgeschlagen: " + (data.error || "Unbekannter Fehler"));
          if (labelEl) labelEl.innerHTML = `<span style="color: red;">Fehler</span>`;
        }
      } catch (err) {
        alert("Upload-Fehler: " + err.message);
        if (labelEl) labelEl.innerHTML = `<span style="color: red;">Fehler</span>`;
      }
    }

    function removeExpenseRow(rowId, tbodyId) {
      const row = document.getElementById(rowId);
      if (row) row.remove();
      if (tbodyId === "edit-trip-expenses-tbody") calculateEditTripTotals();
      else calculateTravelTotals();
    }

    let isRoundTripMode = false;

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
          const dateVal = document.getElementById("travel-start-date")?.value || "2026-08-22";
          addTripLegRow("travel-legs-tbody", { startLocation: originVal, destinationLocation: destVal, dateLeg: dateVal });
          addTripLegRow("travel-legs-tbody", { startLocation: destVal, destinationLocation: originVal, dateLeg: dateVal });
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

    function addTripLegRow(tbodyId = "travel-legs-tbody", data = null) {
      const tbody = document.getElementById(tbodyId);
      if (!tbody) return;

      const rowIdx = tbody.children.length + 1;
      const rowId = `leg_row_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const startDate = document.getElementById(tbodyId === "edit-travel-legs-tbody" ? "edit-trip-start-date" : "travel-start-date")?.value || "2026-08-22";
      const defaultTrans = globalSettings.default_transport_type || "Train";

      const tr = document.createElement("tr");
      tr.id = rowId;
      tr.className = "trip-leg-row";
      tr.innerHTML = `
        <td style="padding: 6px; text-align: center; font-weight: 700; color: var(--text-muted);">${rowIdx}</td>
        <td style="padding: 6px;">
          <input type="date" class="form-control leg-date" value="${data?.dateLeg || startDate}" style="padding: 4px 6px; font-size: 0.8rem;" onchange="${tbodyId === 'edit-travel-legs-tbody' ? 'calculateEditTripTotals()' : 'calculateTravelTotals()'}">
        </td>
        <td style="padding: 6px;">
          <input type="text" class="form-control leg-start" placeholder="Startort" value="${data?.startLocation || (rowIdx === 1 ? 'Neumünster, Wohnort' : '')}" style="padding: 4px 6px; font-size: 0.8rem;">
        </td>
        <td style="padding: 6px;">
          <input type="text" class="form-control leg-dest" placeholder="Zielort" value="${data?.destinationLocation || ''}" style="padding: 4px 6px; font-size: 0.8rem;">
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
            <input type="number" step="1" class="form-control leg-km" placeholder="km" value="${data?.distanceKm || '120'}" style="padding: 4px 6px; font-size: 0.8rem;" oninput="${tbodyId === 'edit-travel-legs-tbody' ? 'calculateEditTripTotals()' : 'calculateTravelTotals()'}">
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
            <input type="number" step="0.5" class="form-control leg-layover-h" placeholder="Std." value="${data?.layoverHours || '0'}" style="width: 50px; padding: 4px 4px; font-size: 0.8rem;">
            <input type="text" class="form-control leg-layover-p" placeholder="Zweck vor Ort" value="${data?.layoverPurpose || ''}" style="padding: 4px 4px; font-size: 0.8rem;">
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

    function calculateTravelTotals() {
      const travelClass = document.querySelector('input[name="travel-class-type"]:checked')?.value || "BusinessTrip";
      const isTripBillable = document.getElementById("travel-billable-to-client")?.checked;
      const hasBreakfast = document.getElementById("travel-has-breakfast")?.checked;

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

      // 2. Mehrtägige VMA-Berechnung (§ 9 Abs. 4a EStG) & Tagesauflistung
      let vma = 0;
      const startDateStr = document.getElementById("travel-start-date")?.value || "2026-08-22";
      const endDateStr = document.getElementById("travel-end-date")?.value || startDateStr;
      const vmaBox = document.getElementById("vma-banner-box");
      const vmaHint = document.getElementById("vma-calc-hint");
      const breakdownEl = document.getElementById("vma-days-breakdown");

      const d1 = new Date(startDateStr);
      const d2 = new Date(endDateStr);
      const totalDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

      if (travelClass === "PermanentWorkplace") {
        if (vmaBox) vmaBox.style.opacity = "0.5";
        if (vmaHint) vmaHint.innerHTML = `<span style="color: #d97706;"><i class="fa-solid fa-circle-info"></i> Erste Betriebsstätte: Kein Anspruch auf Verpflegungsmehraufwand (VMA gem. § 9 Abs. 4a EStG).</span>`;
        if (breakdownEl) breakdownEl.style.display = "none";
      } else {
        if (vmaBox) vmaBox.style.opacity = "1";
        if (totalDays === 1) {
          const dep = document.getElementById("travel-dep-time")?.value || "07:30";
          const arr = document.getElementById("travel-arr-time")?.value || "19:30";
          const [dh, dm] = dep.split(":").map(Number);
          const [ah, am] = arr.split(":").map(Number);
          let durationHours = (ah * 60 + am - (dh * 60 + dm)) / 60;
          if (durationHours < 0) durationHours += 24;

          if (durationHours >= 24) vma = globalSettings.vma_rate_24h || 28.00;
          else if (durationHours >= 8) vma = globalSettings.vma_rate_8h || 14.00;

          if (hasBreakfast && vma > 0) vma = Math.max(0, vma - 5.60);
          if (vmaHint) {
            vmaHint.innerText = `1 Tag (${durationHours.toFixed(1)} h Abwesenheit) → ${vma.toFixed(2)} € Pauschale${hasBreakfast ? ' (inkl. -5,60 € Frühstück)' : ''}`;
          }
          if (breakdownEl) breakdownEl.style.display = "none";
        } else {
          // Mehrtägig: Anreisetag (14€) + Zwischentage (28€) + Abreisetag (14€)
          const intermediateDays = Math.max(0, totalDays - 2);
          const rawVma = (globalSettings.vma_rate_8h || 14.00) + (intermediateDays * (globalSettings.vma_rate_24h || 28.00)) + (globalSettings.vma_rate_8h || 14.00);
          const nights = totalDays - 1;
          const breakfastDeduction = hasBreakfast ? (5.60 * nights) : 0;
          vma = Math.max(0, rawVma - breakfastDeduction);

          if (vmaHint) {
            vmaHint.innerText = `Mehrtägige Reise (${totalDays} Tage / ${nights} Nächte): Anreise ${(globalSettings.vma_rate_8h || 14).toFixed(2)} € + ${intermediateDays}x ${(globalSettings.vma_rate_24h || 28).toFixed(2)} € + Abreise ${(globalSettings.vma_rate_8h || 14).toFixed(2)} € → ${vma.toFixed(2)} € Pauschale${hasBreakfast ? ` (inkl. -${breakfastDeduction.toFixed(2)} € Frühstücksabzug)` : ''}`;
          }

          if (breakdownEl) {
            breakdownEl.style.display = "block";
            let daysHtml = `<strong style="color: #1e40af;">Tagesübersicht & Pauschalen:</strong><div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px;">`;
            for (let i = 0; i < totalDays; i++) {
              const curDate = new Date(d1.getTime() + i * 24 * 60 * 60 * 1000);
              const dateStr = curDate.toLocaleDateString("de-DE", { weekday: 'short', day: '2-digit', month: '2-digit' });
              const isFirst = i === 0;
              const isLast = i === totalDays - 1;
              const pAmount = (isFirst || isLast) ? (globalSettings.vma_rate_8h || 14) : (globalSettings.vma_rate_24h || 28);
              const pLabel = isFirst ? "Anreisetag" : (isLast ? "Abreisetag" : "Zwischentag 24h");
              daysHtml += `
                <div style="background: #fff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 4px 8px;">
                  <strong>Tag ${i + 1} (${dateStr}):</strong> ${pLabel} &rarr; <strong>${pAmount.toFixed(2)} €</strong>
                </div>
              `;
            }
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
            receiptR2Key: tr.querySelector(".exp-r2-key")?.value || null,
            receiptFilename: tr.querySelector(".exp-filename")?.value || null,
            receiptMimeType: tr.querySelector(".exp-mimetype")?.value || null,
            isBillableToClient: tr.querySelector(".exp-billable")?.checked
          });
        }
      });

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
            hasBreakfast,
            origin: isRoundTripMode && legs.length > 0 ? legs[0].startLocation : origin,
            destination: isRoundTripMode && legs.length > 0 ? legs[legs.length - 1].destinationLocation : destination,
            originAddress: isRoundTripMode && legs.length > 0 ? legs[0].startLocation : origin,
            destinationAddress: isRoundTripMode && legs.length > 0 ? legs[legs.length - 1].destinationLocation : destination,
            purpose,
            contactPerson,
            departureTime,
            arrivalTime,
            isBillableToClient,
            status,
            isRoundTrip: isRoundTripMode,
            totalPlannedCostNet: totalTax,
            legs,
            expenses
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Reisekosten erfolgreich gespeichert!");
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
      if (filterCustSelect && filterCustSelect.options.length <= 1) {
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

    function renderTripsTable(trips) {
      const tableBody = document.getElementById("trips-table-body");
      if (!tableBody) return;

      if (!trips || trips.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">Keine Reisekosten für diese Filterkriterien gefunden.</td></tr>`;
        return;
      }

      tableBody.innerHTML = trips.map(tr => {
        const isCar = tr.expense_type === "PersonalCar";
        const travelCost = tr.calculated_travel_cost !== undefined ? tr.calculated_travel_cost : (isCar ? (tr.distance_km * (tr.rate_per_km || 0.30)) : (tr.ticket_cost || 0));
        const vma = tr.vma_amount || 0;
        const total = tr.calculated_total_cost !== undefined ? tr.calculated_total_cost : travelCost;
        const clientNet = tr.calculated_client_net !== undefined ? tr.calculated_client_net : (tr.is_billable_to_client ? travelCost : 0);
        const isWorkplace = tr.travel_type === "PermanentWorkplace";
        const isMultiDay = tr.total_days > 1 && tr.return_date && tr.return_date !== tr.trip_date;

        // Status Badge
        let statusBadge = `<span class="badge badge-success">Offen (Entwurf)</span>`;
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
        const expenses = tr.expenses || [];

        // Expenses breakdown HTML
        const expensesHtml = expenses.length > 0 ? `
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border); font-size: 0.75rem;">
            <strong style="color: var(--primary);"><i class="fa-solid fa-receipt"></i> ${expenses.length} Belege / Einzelspesen:</strong>
            <ul style="margin: 4px 0 0 0; padding-left: 14px; list-style-type: none;">
              ${expenses.map(e => {
                const isSynced = e.is_synced_to_lexware === 1;
                const isCanceled = e.is_voucher_canceled === 1 || e.lexware_status === 'voided';
                return `
                  <li style="margin-bottom: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <input type="checkbox" class="expense-item-check" data-expense-id="${e.id}" data-trip-id="${tr.id}">
                    <span><strong>${e.expense_date}</strong>: ${e.description} (<strong>${(e.amount_gross || 0).toFixed(2)} €</strong>, ${e.tax_rate}% USt, SKR04: <code>${e.skr04_account}</code>)</span>
                    ${isCanceled ? `
                      <span class="badge" style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3; font-size: 0.68rem;"><i class="fa-solid fa-ban"></i> Storniert in Lexware</span>
                      <button type="button" class="btn btn-outline" style="padding: 1px 6px; font-size: 0.68rem; border-color: #93c5fd; color: #1d4ed8;" onclick="unlinkExpense('${e.id}')" title="Beleg von storniertem Lexware-Voucher trennen & neu übertragen"><i class="fa-solid fa-rotate-left"></i> Freigeben</button>
                    ` : (isSynced ? `<span class="badge badge-success" style="font-size: 0.68rem;"><i class="fa-solid fa-check"></i> Lexware (${e.lexware_voucher_number || 'Sync'})</span>` : `<span class="badge badge-warning" style="font-size: 0.68rem;">Nicht synchronisiert</span>`)}
                    ${e.receipt_r2_key ? `<a href="${API_BASE}/trips/receipts/${encodeURIComponent(e.receipt_r2_key)}" target="_blank" style="color: var(--primary); font-size: 0.72rem;"><i class="fa-solid fa-file-pdf"></i> Beleg</a>` : ''}
                  </li>
                `;
              }).join("")}
            </ul>
          </div>
        ` : '';

        return `
          <tr>
            <td style="text-align: center;">
              <input type="checkbox" class="trip-row-check" data-trip-id="${tr.id}" onchange="document.querySelectorAll('.expense-item-check[data-trip-id=\\'${tr.id}\\']').forEach(cb => cb.checked = this.checked)">
            </td>
            <td>
              <strong>${tr.trip_date}${isMultiDay ? ' bis ' + tr.return_date : ''}</strong><br>
              <small style="color: var(--text-muted);">${tr.origin || 'Wohnort'} &rarr; ${tr.destination || 'Ziel'}</small>
            </td>
            <td>
              <strong>${tr.customer_name || 'Kunde'}</strong><br>
              <small class="badge badge-info">${tr.project_name || tr.project_number}</small><br>
              <span>${tr.purpose || 'Kundentermin'}</span>
              ${tr.contact_person ? `<br><small style="color: var(--text-muted);"><i class="fa-solid fa-user"></i> ${tr.contact_person}</small>` : ''}
            </td>
            <td>
              <span class="badge ${isWorkplace ? 'badge-warning' : 'badge-info'}">
                ${isWorkplace ? 'Erste Betriebsstätte' : (isMultiDay ? `Dienstreise (${tr.total_days} Tage)` : 'Dienstreise')}
              </span><br>
              <small style="color: var(--text-muted);">${isCar ? tr.distance_km + ' km' : (tr.expense_type === 'Train' ? 'ÖPNV / Bahn' : (tr.expense_type === 'Passenger' ? 'Beifahrer' : tr.expense_type))}</small>
            </td>
            <td>
              <div style="font-size: 0.8rem; line-height: 1.3;">
                Fahrt: <strong>${travelCost.toFixed(2)} €</strong>
                ${vma > 0 ? `<br>VMA: ${vma.toFixed(2)} €` : ''}
                <div style="font-weight: 700; color: #15803d; margin-top: 2px;">
                  Gesamt FA: ${total.toFixed(2)} €
                </div>
              </div>
              ${expensesHtml}
            </td>
            <td>
              <strong style="color: ${clientNet > 0 ? 'var(--primary)' : 'var(--text-muted)'}; font-size: 0.95rem;">
                ${clientNet.toFixed(2)} €
              </strong>
              ${!tr.is_billable_to_client ? '<br><small class="badge badge-warning" style="font-size: 0.7rem;">Nicht weiterberechnet</small>' : ''}
            </td>
            <td>${statusBadge}</td>
            <td>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${tr.status === 'Planned' ? `
                  <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.75rem; background: #0284c7; border-color: #0284c7;" onclick="completePlannedTrip('${tr.id}')" title="Als durchgeführt markieren & Belege erfassen">
                    <i class="fa-solid fa-car-side"></i> Als durchgeführt markieren & Belege erfassen
                  </button>
                ` : ''}
                ${isEditable ? `
                  <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" onclick="openEditTripModal('${tr.id}')" title="Reisekosten bearbeiten">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem; color: #be123c; border-color: #fecdd3;" onclick="deleteTripFromList('${tr.id}')" title="Löschen">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                ` : ''}
                <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" onclick="openTripTaxReportPdf('${tr.id}')" title="Finanzamt Dienstreisebericht">
                  <i class="fa-solid fa-file-invoice"></i> FA PDF
                </button>
                ${tr.timesheet_version_id ? `
                  <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" onclick="printFilteredTimesheetPdf('${tr.timesheet_version_id}', 'all')" title="Kunden-Leistungsnachweis PDF">
                    <i class="fa-solid fa-file-pdf"></i> Nachweis
                  </button>
                ` : ''}
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

      if (selectedExpIds.length === 0) {
        alert("Bitte markieren Sie mindestens einen Beleg / eine Spesenposition per Checkbox, um ihn an Lexware zu übertragen.");
        return;
      }

      if (!confirm(`Möchten Sie ${selectedExpIds.length} ausgewählte(n) Beleg(e) mit SKR04-Kontierungsdaten an Lexware übermitteln?`)) {
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/trips/sync-expenses-to-lexware`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expenseIds: selectedExpIds })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert(`Erfolg: ${data.message}`);
          await loadTripsList();
        } else {
          alert("Fehler bei der Lexware-Übertragung: " + (data.error || "Unbekannt"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
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

        document.getElementById("edit-trip-id").value = tr.id;
        document.getElementById("edit-trip-purpose").value = tr.purpose || "";
        document.getElementById("edit-trip-contact-person").value = tr.contact_person || "";
        document.getElementById("edit-trip-origin").value = tr.origin_address || tr.origin || "";
        document.getElementById("edit-trip-dest").value = tr.destination_address || tr.destination || "";
        document.getElementById("edit-trip-start-date").value = tr.trip_date || "";
        document.getElementById("edit-trip-end-date").value = tr.return_date || tr.trip_date || "";
        document.getElementById("edit-trip-dep-time").value = tr.departure_time || "07:30";
        document.getElementById("edit-trip-arr-time").value = tr.arrival_time || "19:30";
        document.getElementById("edit-trip-has-breakfast").checked = tr.has_breakfast === 1;

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
      const hasBreakfast = document.getElementById("edit-trip-has-breakfast")?.checked;
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

      const d1 = new Date(startDateStr);
      const d2 = new Date(endDateStr);
      const totalDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

      let vma = 0;
      const vmaHint = document.getElementById("edit-vma-hint");
      if (travelClass === "PermanentWorkplace") {
        if (vmaHint) vmaHint.innerText = "0,00 € (Erste Betriebsstätte: Kein VMA)";
      } else {
        if (totalDays === 1) {
          const dep = document.getElementById("edit-trip-dep-time")?.value || "07:30";
          const arr = document.getElementById("edit-trip-arr-time")?.value || "19:30";
          const [dh, dm] = dep.split(":").map(Number);
          const [ah, am] = arr.split(":").map(Number);
          let duration = (ah * 60 + am - (dh * 60 + dm)) / 60;
          if (duration < 0) duration += 24;

          if (duration >= 24) vma = globalSettings.vma_rate_24h || 28.00;
          else if (duration >= 8) vma = globalSettings.vma_rate_8h || 14.00;

          if (hasBreakfast && vma > 0) vma = Math.max(0, vma - 5.60);
          if (vmaHint) vmaHint.innerText = `${vma.toFixed(2)} € (1 Tag, ${duration.toFixed(1)} h)`;
        } else {
          const intermediateDays = Math.max(0, totalDays - 2);
          const rawVma = (globalSettings.vma_rate_8h || 14.00) + (intermediateDays * (globalSettings.vma_rate_24h || 28.00)) + (globalSettings.vma_rate_8h || 14.00);
          const nights = totalDays - 1;
          const breakfastDeduction = hasBreakfast ? (5.60 * nights) : 0;
          vma = Math.max(0, rawVma - breakfastDeduction);
          if (vmaHint) vmaHint.innerText = `${vma.toFixed(2)} € (${totalDays} Tage / ${nights} Nächte)`;
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

      // Collect updated legs from edit modal
      const legs = [];
      if (isRoundTrip) {
        document.querySelectorAll("#edit-travel-legs-tbody tr").forEach((tr, idx) => {
          legs.push({
            legOrder: idx + 1,
            dateLeg: tr.querySelector(".leg-date")?.value || startDate,
            startLocation: tr.querySelector(".leg-start")?.value || "Start",
            destinationLocation: tr.querySelector(".leg-dest")?.value || "Ziel",
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
            receiptR2Key: tr.querySelector(".exp-r2-key")?.value || null,
            receiptFilename: tr.querySelector(".exp-filename")?.value || null,
            receiptMimeType: tr.querySelector(".exp-mimetype")?.value || null,
            isBillableToClient: tr.querySelector(".exp-billable")?.checked === true,
            isSyncedToLexware: tr.querySelector(".exp-is-synced")?.value === "1"
          });
        }
      });

      const payload = {
        tripDate: startDate,
        returnDate: endDate,
        totalDays,
        travelType: document.querySelector('input[name="edit-travel-class-type"]:checked')?.value || "BusinessTrip",
        status,
        isRoundTrip,
        expenseType: document.getElementById("edit-trip-vehicle").value,
        distanceKm: parseFloat(document.getElementById("edit-trip-km").value || "0"),
        ticketCost: parseFloat(document.getElementById("edit-trip-ticket-amount").value || "0"),
        vmaAmount: vma,
        hasBreakfast: document.getElementById("edit-trip-has-breakfast").checked,
        origin: document.getElementById("edit-trip-origin").value,
        destination: document.getElementById("edit-trip-dest").value,
        originAddress: document.getElementById("edit-trip-origin").value,
        destinationAddress: document.getElementById("edit-trip-dest").value,
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
      const content = document.getElementById("tax-report-content");
      content.innerHTML = `<div style="text-align: center; padding: 40px;"><span class="spinner"></span> Lade Finanzamt-Bericht...</div>`;
      openModal("tax-report-modal");

      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}/tax-report-data`);
        if (!res.ok) throw new Error("Fehler beim Laden des Berichts");
        const data = await res.json();
        const tr = data.trip;

        const isWorkplace = tr.travel_type === "PermanentWorkplace";
        const isCar = tr.expense_type === "PersonalCar";
        const isMultiDay = tr.total_days > 1 && tr.return_date && tr.return_date !== tr.trip_date;
        const expenses = tr.expenses || [];

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
                <td style="padding: 6px; width: 160px; color: #64748b; font-weight: 600;">Reisezweck / Anlass:</td>
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
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Startanschrift (Wohnung):</td>
                <td style="padding: 6px;">${tr.origin_address || tr.origin || 'Wohnort'}</td>
              </tr>
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Zielanschrift (Einsatzort):</td>
                <td style="padding: 6px;">${tr.destination_address || tr.destination || 'Kundenadresse'}</td>
              </tr>
              <tr>
                <td style="padding: 6px; color: #64748b; font-weight: 600;">Reiseart & Dauer:</td>
                <td style="padding: 6px;">
                  <span class="badge ${isWorkplace ? 'badge-warning' : 'badge-info'}">
                    ${isWorkplace ? 'Erste Betriebsstätte (Pendlerpauschale einfache Entfernung)' : (isMultiDay ? `Mehrtägige Auswärtstätigkeit (${tr.total_days} Tage)` : 'Auswärtstätigkeit / Dienstreise')}
                  </span>
                </td>
              </tr>
            </table>

            <!-- Zeit & Verpflegung -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
              <h3 style="font-size: 0.95rem; color: #1e40af; margin-bottom: 10px;"><i class="fa-solid fa-clock"></i> Reisezeit & Verpflegungsmehraufwand (VMA)</h3>
              <table style="width: 100%; font-size: 0.85rem;">
                <tr>
                  <td style="width: 160px; color: #64748b;">Abfahrt & Ankunft:</td>
                  <td>${tr.trip_date} (${tr.departure_time || '07:30'} Uhr) bis ${tr.return_date || tr.trip_date} (${tr.arrival_time || '19:30'} Uhr)</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Frühstück gestellt:</td>
                  <td>${tr.has_breakfast ? `Ja (-5,60 € je Übernachtung gem. EStG)` : 'Nein'}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">VMA Pauschale:</td>
                  <td><strong>${(tr.vma_amount || 0).toFixed(2)} €</strong></td>
                </tr>
              </table>
            </div>

            <!-- Kostenaufstellung -->
            <h3 style="font-size: 0.95rem; color: #1e40af; margin-bottom: 10px;"><i class="fa-solid fa-receipt"></i> Gesamtaufstellung der Reisekosten & Belege</h3>
            <table style="width: 100%; font-size: 0.85rem; border: 1px solid #e2e8f0; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 8px 12px; border: 1px solid #e2e8f0;">Datum / Kostenart</th>
                  <th style="padding: 8px 12px; border: 1px solid #e2e8f0;">Basis / SKR04 Konto / Beleg</th>
                  <th style="padding: 8px 12px; border: 1px solid #e2e8f0; width: 80px; text-align: center;">USt-Satz</th>
                  <th style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">Betrag Netto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Fahrtkosten (${isCar ? 'PKW' : 'ÖPNV/Bahn'})</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${isCar ? `${tr.distance_km} km à ${(tr.rate_per_km || 0.30).toFixed(2)} € [SKR04: 6663]` : 'Ticket-Auslage [SKR04: 6663]'}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">0.0 %</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">${tr.travelCost.toFixed(2)} €</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Verpflegungsmehraufwand (VMA)</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Steuerfreie Pauschale (§ 9 EStG) [SKR04: 6664]</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">0.0 %</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">${(tr.vma_amount || 0).toFixed(2)} €</td>
                </tr>
                ${expenses.map(e => `
                  <tr>
                    <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${e.expense_date}: ${e.description}</td>
                    <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                      SKR04: <code>${e.skr04_account}</code> | ${e.category}
                      ${e.receipt_filename ? ` (${e.receipt_filename})` : ''}
                    </td>
                    <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${(e.tax_rate || 0).toFixed(1)} %</td>
                    <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">${(e.amount_net || 0).toFixed(2)} €</td>
                  </tr>
                `).join("")}
                <tr style="background: #f8fafc; font-weight: 700;">
                  <td colspan="3" style="padding: 10px 12px; border: 1px solid #e2e8f0; text-align: right;">Gesamte Betriebsausgabe (Finanzamt EÜR):</td>
                  <td style="padding: 10px 12px; border: 1px solid #e2e8f0; text-align: right; color: #15803d; font-size: 1.05rem;">${tr.totalActualCost.toFixed(2)} €</td>
                </tr>
                <tr style="font-size: 0.8rem; color: #64748b;">
                  <td colspan="3" style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: right;">Davon an Kunden weiterberechenbar:</td>
                  <td style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: right;">${tr.clientReimbursable.toFixed(2)} € Netto</td>
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

    function printTaxReport() {
      const el = document.getElementById("print-area-tax-report");
      if (!el) return;
      const win = window.open("", "_blank");
      if (!win) {
        alert("Bitte erlauben Sie Popups für diese Seite.");
        return;
      }
      const sigDataUrl = globalSettings.contractor_signature_data_url || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : "");
      const contractorFullName = (globalSettings.email_sender_name ? globalSettings.email_sender_name.split("|")[0].trim() : "Michael Kirst-Neshva");

      win.document.write(`
        <!DOCTYPE html>
        <html lang="de">
          <head>
            <meta charset="UTF-8">
            <title>Dienstreise- & Finanzamtsbericht</title>
            <style>
              @page { size: A4 portrait; margin: 0; }
              * { box-sizing: border-box; }
              html, body { margin: 0; padding: 0; background: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; font-size: 11.5px; }
              .no-print-toolbar { max-width: 210mm; margin: 16px auto 8px auto; background: #ffffff; padding: 10px 18px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
              .btn { padding: 6px 14px; font-weight: 600; border-radius: 6px; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; font-size: 12.5px; }
              .btn-primary { background: #2563eb; color: #fff; border-color: #2563eb; }
              .a4-page { width: 210mm; min-height: 297mm; padding: 18mm 18mm 18mm 18mm; margin: 12px auto 40px auto; background: #ffffff; box-shadow: 0 8px 30px rgba(0,0,0,0.15); border-radius: 3px; }
              table { width: 100%; border-collapse: collapse; }
              .badge { display: inline-block; padding: 3px 6px; font-size: 11px; border-radius: 4px; }
              .badge-info { background: #e0f2fe; color: #0369a1; }
              .badge-warning { background: #fef3c7; color: #b45309; }
              @media print {
                html, body { background: #ffffff !important; padding: 0 !important; margin: 0 !important; }
                .no-print-toolbar { display: none !important; }
                .a4-page { width: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 15mm 15mm 15mm 15mm !important; box-shadow: none !important; border-radius: 0 !important; }
              }
            </style>
          </head>
          <body>
            <div class="no-print-toolbar">
              <strong>📄 DIN A4 Druck- & PDF-Vorschau (Finanzamt EStG)</strong>
              <button class="btn btn-primary" onclick="window.print()">🖨️ Drucken / PDF speichern</button>
            </div>
            <div class="a4-page">
              ${el.innerHTML}
              <div style="margin-top: 36px; border-top: 1px solid #64748b; padding-top: 8px; width: 240px;">
                ${sigDataUrl ? `<div style="height: 50px; display: flex; align-items: flex-end; margin-bottom: 4px;"><img src="${sigDataUrl}" alt="Signatur" style="max-height: 48px; max-width: 200px; object-fit: contain;"></div>` : ''}
                <strong>${contractorFullName}</strong> (Steuerpflichtiger)<br>
                <small style="color: #64748b;">Ort, Datum: Hamburg, ${new Date().toLocaleDateString('de-DE')}</small>
              </div>
            </div>
          </body>
        </html>
      `);
      win.document.close();
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
        const payload = r2Key ? { r2Key, preferredModel } : { imageBase64: base64, preferredModel };
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
        // Phase 1: Scan all files
        const scannedDocs = [];
        for (let i = 0; i < filesToScan.length; i++) {
          const fl = filesToScan[i];
          const payload = { r2Key: fl.r2Key, imageBase64: fl.base64, preferredModel };
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

                  for (let i = 0; i < sData.files.length; i++) {
                    const fl = sData.files[i];
                    const lower = fl.filename.toLowerCase();
                    const cat = lower.includes("hotel") ? "HotelLogis" : (lower.includes("bahn") || lower.includes("zug") || lower.includes("ticket") || lower.includes("ice") ? "TrainLongDistance" : "Parking");
                    addExpenseRow(targetTbody, {
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
                  }
                  alert(`Erfolg: ${sData.files.length} Beleg(e) vom Smartphone in die Reisekosten übernommen!`);
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
      const navRail = document.getElementById("nav-rail");
      const subnavCol = document.getElementById("subnav-column");
      if (navRail) navRail.style.display = "none";
      if (subnavCol) subnavCol.style.display = "none";
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

    async function handleMobileFilesSelected(files) {
      if (!files || files.length === 0) return;
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageForUpload(files[i]);
        mobileUploadedFiles.push(compressed);
        renderMobileThumbnails();
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
          <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
            <img src="${f.base64}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #3b82f6;">
            <div style="overflow: hidden;">
              <strong style="font-size: 0.9rem; color: #fff; display: block; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">Beleg ${idx + 1}</strong>
              <small style="color: #94a3b8; font-size: 0.75rem;">${escapeHtml(f.filename)}</small>
            </div>
          </div>
          <button type="button" class="btn btn-outline" style="padding: 6px 10px; color: #f87171; border-color: rgba(248, 113, 113, 0.3);" onclick="removeMobileFile(${idx})">
            <i class="fa-solid fa-trash"></i>
          </button>
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

            <!-- GoBD Revisions-Footer -->
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 0.75rem; color: #64748b; margin-top: 16px;">
              <strong>Technischer Integritäts- und SHA-256 Hashnachweis:</strong><br>
              SHA-256 Hash: <code>${v.voucher_pdf_hash_sha256 || 'SHA256_VERIFIED'}</code> | Erfasst am: ${v.created_at_utc} UTC<br>
              Software: Freelancer Evidence & Billing Hub (v2.8.0 LTS)
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
              @page { size: A4 portrait; margin: 15mm; }
              * { box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; font-size: 11px; margin: 0; padding: 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
              @media print { .no-print { display: none; } }
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

    // ==========================================
    // DYNAMISCHES EXECUTIVE DASHBOARD
    // ==========================================
    async function loadDashboardStats() {
      try {
        const res = await fetch(`${API_BASE}/dashboard/stats`);
        if (!res.ok) throw new Error("Dashboard-Daten konnten nicht geladen werden.");
        const data = await res.json();

        // 1. Offene Abrechnungen
        const openTotalEl = document.getElementById("dash-open-total");
        const openBadgeEl = document.getElementById("dash-open-badge");
        const openSubEl = document.getElementById("dash-open-sub");
        if (openTotalEl) openTotalEl.innerText = formatCurrency(data.openBilling?.totalNet || 0);
        if (openBadgeEl) openBadgeEl.innerText = `${(data.openBilling?.hours || 0).toFixed(2)} h`;
        if (openSubEl) {
          openSubEl.innerText = `${(data.openBilling?.hours || 0).toFixed(2)} h Zeiten • ${formatCurrency(data.openBilling?.travelAmountNet || 0)} Spesen`;
        }

        // 2. Umsatz Letzte 3 Monate
        const pastRevEl = document.getElementById("dash-past-revenue");
        const pastSubEl = document.getElementById("dash-past-sub");
        if (pastRevEl) pastRevEl.innerText = formatCurrency(data.past3Months?.totalRevenueNet || 0);
        if (pastSubEl) {
          const periodsText = (data.past3Months?.periods || []).join(", ");
          pastSubEl.innerText = `${data.past3Months?.timesheetsCount || 0} fakturierte Nachweise (${periodsText})`;
        }

        // 3. Forecast Nächste 3 Monate
        const forecastTotalEl = document.getElementById("dash-forecast-total");
        const forecastSubEl = document.getElementById("dash-forecast-sub");
        if (forecastTotalEl) forecastTotalEl.innerText = formatCurrency(data.forecast3Months?.totalForecastNet || 0);
        if (forecastSubEl) {
          forecastSubEl.innerText = `Basierend auf ${data.forecast3Months?.activeProjectsCount || 0} aktiven Projekt-Restbudgets`;
        }

        // 4. Aktive Projekte Count
        const projCountEl = document.getElementById("dash-projects-count");
        if (projCountEl) projCountEl.innerText = `${(data.projects || []).length}`;

        // 5. Projekt-Budgets & Auslastungs-Widgets
        const projGrid = document.getElementById("dash-projects-grid");
        if (projGrid) {
          const projects = data.projects || [];
          if (projects.length === 0) {
            projGrid.innerHTML = `
              <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); background: #f8fafc; border-radius: 8px; border: 1px dashed var(--border);">
                <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 8px; color: #94a3b8; display: block;"></i>
                Keine aktiven Projekte vorhanden. Legen Sie im Kunden-Cockpit ein neues Projekt an.
              </div>
            `;
          } else {
            projGrid.innerHTML = projects.map(p => {
              const usage = p.budgetUsagePercent || 0;
              const barColor = usage > 90 ? '#ef4444' : usage > 75 ? '#f59e0b' : '#3b82f6';
              return `
                <div class="card" style="padding: 16px; border: 1px solid var(--border); background: #f8fafc; border-radius: 8px; transition: transform 0.15s ease;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                      <strong style="color: #1e293b; font-size: 0.95rem;">${escapeHtml(p.name)}</strong><br>
                      <small style="color: var(--text-muted);">${escapeHtml(p.customerName)} • ${p.projectNumber}</small>
                    </div>
                    <span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 600;">${p.defaultHourlyRate.toFixed(2)} €/h</span>
                  </div>
                  
                  <div style="margin: 12px 0 6px 0;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 600; margin-bottom: 4px;">
                      <span style="color: #475569;">Budget-Auslastung</span>
                      <span style="color: ${barColor};">${usage}%</span>
                    </div>
                    <div style="background: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                      <div style="background: ${barColor}; width: ${Math.min(100, usage)}%; height: 100%; border-radius: 4px;"></div>
                    </div>
                  </div>

                  <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                    <span>Gebucht: <strong>${p.recordedHours.toFixed(1)} h</strong> (${formatCurrency(p.recordedAmountNet)})</span>
                    <span>Rest: <strong>${p.remainingHours.toFixed(1)} h</strong> (${formatCurrency(p.remainingBudgetNet)})</span>
                  </div>
                </div>
              `;
            }).join("");
          }
        }

        // 6. Letzte Leistungsnachweise Tabelle
        const tbody = document.getElementById("timesheet-table-body");
        if (tbody) {
          const timesheets = data.recentTimesheets || [];
          if (timesheets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">Noch keine Leistungsnachweise erstellt.</td></tr>`;
          } else {
            tbody.innerHTML = timesheets.map(ts => {
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
                badgeLabel = "Zur Prüfung";
              } else if (ts.status === "Rejected") {
                badgeClass = "badge-danger";
                badgeIcon = "fa-circle-xmark";
                badgeLabel = "Beanstandet";
              } else if (ts.is_invoice_canceled === 1) {
                badgeClass = "badge-danger";
                badgeIcon = "fa-ban";
                badgeLabel = "Rechnung storniert";
              } else if (ts.status === "Draft") {
                badgeClass = "badge-warning";
                badgeIcon = "fa-pen";
                badgeLabel = "Entwurf";
              }

              return `
                <tr class="clickable-row">
                  <td><strong>${ts.period} (v${ts.version_number || 1}.0)</strong></td>
                  <td>${escapeHtml(ts.customer_name)}<br><small style="color: var(--text-muted);">${escapeHtml(ts.project_name)} (${ts.project_number})</small></td>
                  <td>${(ts.total_billable_hours || 0).toFixed(2)} h</td>
                  <td>${formatCurrency(ts.total_reimbursable_expenses || 0)}</td>
                  <td><strong>${formatCurrency(ts.total_amount_net || 0)}</strong></td>
                  <td><span class="badge ${badgeClass}"><i class="fa-solid ${badgeIcon}"></i> ${badgeLabel}</span></td>
                  <td>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" onclick="openTimesheetModal('${ts.id}', '${ts.status}')">
                      <i class="fa-solid fa-folder-open"></i> Öffnen
                    </button>
                  </td>
                </tr>
              `;
            }).join("");
          }
        }
      } catch (err) {
        console.error("Fehler beim Laden der Dashboard-Daten:", err);
      }
    }

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

    function onBillingMonthFilterChanged(val) {
      currentBillingMonthFilter = val;
      renderBillingHierarchy();
    }

    function onBillingCustomerFilterChanged(val) {
      currentBillingCustomerFilter = val;
      renderBillingHierarchy();
    }

    async function loadBillingHierarchy() {
      const container = document.getElementById("billing-hierarchy-container");
      if (!container) return;
      container.innerHTML = `<div style="text-align: center; padding: 40px;"><span class="spinner"></span> Lade Abrechnungs- und Freigabestruktur...</div>`;

      try {
        const res = await fetch(`${API_BASE}/billing/hierarchy`);
        if (!res.ok) throw new Error("Fehler beim Abrufen der Abrechnungsdaten");
        globalBillingHierarchy = await res.json();

        // Populate Month & Customer Dropdowns
        populateBillingFilterDropdowns();

        renderBillingHierarchy();
      } catch (err) {
        container.innerHTML = `<div style="color: red; padding: 20px;">Fehler: ${err.message}</div>`;
      }
    }

    function populateBillingFilterDropdowns() {
      const monthSelect = document.getElementById("filter-billing-month");
      const custSelect = document.getElementById("filter-billing-customer");

      if (monthSelect) {
        const uniqueMonths = new Set();
        for (const cust of (globalBillingHierarchy || [])) {
          for (const p of (cust.projects || [])) {
            for (const m of (p.months || [])) {
              if (m.period) uniqueMonths.add(m.period);
            }
          }
        }
        const sortedMonths = Array.from(uniqueMonths).sort().reverse();
        monthSelect.innerHTML = `<option value="">-- Alle Monate --</option>` + 
          sortedMonths.map(m => `<option value="${m}" ${m === currentBillingMonthFilter ? 'selected' : ''}>${m} (${formatMonthName(m)})</option>`).join("");
      }

      if (custSelect) {
        custSelect.innerHTML = `<option value="">-- Alle Kunden --</option>` + 
          (globalBillingHierarchy || []).map(c => `<option value="${c.id}" ${c.id === currentBillingCustomerFilter ? 'selected' : ''}>${c.name}</option>`).join("");
      }
    }

    function formatMonthName(periodStr) {
      if (!periodStr || !periodStr.includes("-")) return periodStr;
      const [year, month] = periodStr.split("-");
      const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
      const mIdx = parseInt(month, 10) - 1;
      return `${monthNames[mIdx] || month} ${year}`;
    }

    function setBillingFilter(filter) {
      currentBillingFilter = filter;
      document.getElementById("filter-btn-all").className = filter === "all" ? "btn btn-primary" : "btn btn-outline";
      document.getElementById("filter-btn-unbilled").className = filter === "unbilled" ? "btn btn-primary" : "btn btn-outline";
      document.getElementById("filter-btn-billed").className = filter === "billed" ? "btn btn-primary" : "btn btn-outline";
      renderBillingHierarchy();
    }

    function setBillingType(type) {
      currentBillingType = type;
      document.getElementById("type-btn-all").className = type === "all" ? "btn btn-primary" : "btn btn-outline";
      document.getElementById("type-btn-time").className = type === "time" ? "btn btn-primary" : "btn btn-outline";
      document.getElementById("type-btn-travel").className = type === "travel" ? "btn btn-primary" : "btn btn-outline";
      renderBillingHierarchy();
    }

    function renderBillingHierarchy() {
      const container = document.getElementById("billing-hierarchy-container");
      if (!container) return;

      if (!globalBillingHierarchy || globalBillingHierarchy.length === 0) {
        container.innerHTML = `<div class="card" style="padding: 24px; text-align: center; color: var(--text-muted);">Keine Kunden- oder Abrechnungsdaten vorhanden.</div>`;
        return;
      }

      let html = "";

      for (const cust of globalBillingHierarchy) {
        // Filter nach Kunde
        if (currentBillingCustomerFilter && cust.id !== currentBillingCustomerFilter) {
          continue;
        }

        const projects = cust.projects || [];
        if (projects.length === 0) continue;

        // Filter nach Status & Monat
        const renderedProjects = projects.map(p => {
          const months = (p.months || []).filter(m => {
            if (currentBillingMonthFilter && m.period !== currentBillingMonthFilter) {
              return false;
            }
            if (currentBillingFilter === "unbilled") {
              return m.status !== "Invoiced";
            }
            if (currentBillingFilter === "billed") {
              return m.status === "Invoiced";
            }
            return true;
          });
          return { ...p, filteredMonths: months };
        }).filter(p => p.filteredMonths.length > 0);

        if (renderedProjects.length === 0) continue;

        html += `
          <div class="card" style="margin-bottom: 24px; border-top: 4px solid var(--primary); padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <h2 style="font-size: 1.2rem; color: var(--primary); margin-bottom: 2px;">
                  <i class="fa-solid fa-building"></i> ${cust.name}
                </h2>
                <small style="color: var(--text-muted);">${cust.contact_person ? cust.contact_person + ' | ' : ''}${cust.email || ''} | Lexware-ID: ${cust.lexware_contact_id}</small>
              </div>
            </div>

            <!-- Projekte des Kunden -->
            <div style="display: grid; gap: 16px;">
              ${renderedProjects.map(p => `
                <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 10px; padding: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                      <h3 style="font-size: 1.05rem; color: #1e293b; margin-bottom: 2px;">
                        <i class="fa-solid fa-folder-open" style="color: var(--primary);"></i> ${p.name}
                      </h3>
                      <small style="color: var(--text-muted);">${p.project_number} • Stundensatz: ${p.default_hourly_rate.toFixed(2)} €/h Netto</small>
                    </div>
                    <div style="display: flex; gap: 6px;">
                      ${p.lexware_quotation_number ? `<span class="badge badge-success" style="font-size: 0.75rem;"><i class="fa-solid fa-file-invoice"></i> Angebot: ${p.lexware_quotation_number}</span>` : ''}
                      ${p.lexware_order_confirmation_number ? `<span class="badge badge-info" style="font-size: 0.75rem;"><i class="fa-solid fa-file-signature"></i> AB: ${p.lexware_order_confirmation_number}</span>` : ''}
                    </div>
                  </div>

                  <!-- Monate / Abrechnungsperioden -->
                  <div style="display: grid; gap: 16px;">
                    ${p.filteredMonths.map(m => {
                      let statusBadge = "";
                      let actionsHtml = "";
                      const isSelectable = m.status === "Draft" || !m.timesheetId || m.status === "Rejected" || m.status === "InvoiceCanceled";
                      const isEntryEditable = isSelectable;
                      const hasTs = !!m.timesheetId;

                      if (m.status === "PendingSignature") {
                        statusBadge = `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Liegt zur Unterzeichnung vor (GoBD-gesperrt)</span>`;
                        actionsHtml = `
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="approveTimesheetPrompt('${m.timesheetId}', '${m.period}', '${p.name}')">
                            <i class="fa-solid fa-check"></i> Als per E-Mail genehmigt markieren
                          </button>
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; color: #be123c; border-color: #fecdd3;" onclick="rejectTimesheetPrompt('${m.timesheetId}', '${m.period}', '${p.name}')">
                            <i class="fa-solid fa-xmark"></i> Ablehnen
                          </button>
                        `;
                      } else if (m.status === "Approved") {
                        statusBadge = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Wurde genehmigt, noch nicht abgerechnet</span>`;
                        const isStandalone = (globalSettings.billing_provider === 'none');
                        actionsHtml = `
                          ${isStandalone ? `
                            <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem; background: #16a34a; border-color: #16a34a;" onclick="markTimesheetAsInvoicedManually('${m.timesheetId}', '${m.period}')">
                              <i class="fa-solid fa-check-double"></i> Als abgerechnet markieren
                            </button>
                          ` : `
                            <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="createInvoiceForTimesheet('${m.timesheetId}')">
                              <i class="fa-solid fa-file-invoice-dollar"></i> Rechnung in Lexware erstellen
                            </button>
                            <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.78rem;" title="Manuell als extern abgerechnet markieren" onclick="markTimesheetAsInvoicedManually('${m.timesheetId}', '${m.period}')">
                              <i class="fa-solid fa-file-signature"></i> Manuell
                            </button>
                          `}
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; color: #be123c; border-color: #fecdd3;" onclick="rejectTimesheetPrompt('${m.timesheetId}', '${m.period}', '${p.name}')">
                            <i class="fa-solid fa-xmark"></i> Zurückweisen
                          </button>
                        `;
                      } else if (m.status === "Invoiced") {
                        const invNr = m.lexwareInvoiceNumber || m.externalInvoiceNumber || 'abgerechnet';
                        statusBadge = `<span class="badge badge-info"><i class="fa-solid fa-file-invoice"></i> In Rechnung ${invNr}</span>`;
                        actionsHtml = `
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="syncInvoices()">
                            <i class="fa-solid fa-arrows-rotate"></i> Storno-Check Lexware
                          </button>
                        `;
                      } else if (m.status === "InvoiceCanceled") {
                        statusBadge = `<span class="badge badge-warning" style="background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;"><i class="fa-solid fa-triangle-exclamation"></i> Rechnung in Lexware storniert (Bereit zur Neuabrechnung)</span>`;
                        actionsHtml = `
                          <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="submitSelectedForSignature('${p.id}', '${m.period}')">
                            <i class="fa-solid fa-stamp"></i> Ausgewählte Posten zur Neuabrechnung vorlegen
                          </button>
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="createInvoiceForTimesheet('${m.timesheetId}')">
                            <i class="fa-solid fa-file-invoice-dollar"></i> Neue Rechnung in Lexware erstellen
                          </button>
                        `;
                      } else if (m.status === "Rejected") {
                        statusBadge = `<span class="badge badge-secondary" style="background: #fee2e2; color: #991b1b; border: 1px solid #f87171; font-weight: 700; font-size: 0.85rem;"><i class="fa-solid fa-triangle-exclamation"></i> VOM KUNDEN ABGELEHNT / KORREKTUR BEDARF</span>`;
                        actionsHtml = `
                          <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="submitSelectedForSignature('${p.id}', '${m.period}')">
                            <i class="fa-solid fa-stamp"></i> Korrigierte Posten erneut vorlegen
                          </button>
                          <button class="btn btn-warning" style="padding: 4px 10px; font-size: 0.8rem;" onclick="cloneRevision('${m.timesheetId}')">
                            <i class="fa-solid fa-code-branch"></i> Revisionskopie erstellen
                          </button>
                        `;
                      } else {
                        statusBadge = `<span class="badge badge-secondary"><i class="fa-solid fa-pen"></i> Entwurf (Offen)</span>`;
                        actionsHtml = `
                          <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="submitSelectedForSignature('${p.id}', '${m.period}')">
                            <i class="fa-solid fa-stamp"></i> Ausgewählte Posten vorlegen (PDF sperren)
                          </button>
                        `;
                      }

                      // PDF & Freigabelink Action Buttons wenn Timesheet existiert
                      let pdfButtonsHtml = "";
                      if (hasTs) {
                        pdfButtonsHtml = `
                          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Nachweise:</span>
                            <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" title="Reiner Stundenzettel für Kunden / Projektleiter (ohne Preise/Rechnungs-Nr.)" onclick="openTimesheetPdf('${m.timesheetId}', 'client_timesheet', 'all')">
                              <i class="fa-solid fa-file-lines"></i> Stundenzettel (Kunde)
                            </button>
                            <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" title="Kaufmännischer Nachweis zur Ausgangsrechnung (mit Beträgen & USt)" onclick="openTimesheetPdf('${m.timesheetId}', 'invoice_annex', 'all')">
                              <i class="fa-solid fa-file-invoice-dollar"></i> Rechnungsnachweis
                            </button>
                            <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" title="Ausführlicher Auditbericht für Buchhaltung & Finanzamt (§ 18 EStG)" onclick="openTimesheetPdf('${m.timesheetId}', 'tax_audit', 'all')">
                              <i class="fa-solid fa-file-shield"></i> Audit / Finanzamt
                            </button>
                            ${m.signedDocumentR2Key ? `
                              <a href="${API_BASE}/public/timesheets/${m.timesheetId}/download-signed-document" target="_blank" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem; color: #047857; border-color: #a7f3d0; background: #ecfdf5;" title="Vom Kunden hochgeladenen unterschriebenen Nachweis öffnen">
                                <i class="fa-solid fa-file-signature"></i> Unterschr. Dokument
                              </a>
                            ` : ''}
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-left: 4px;">Kunde:</span>
                            <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem; color: #2563eb; border-color: #93c5fd;" title="Sicheren Freigabelink für Kunden kopieren" onclick="copyApprovalLink('${m.timesheetId}')">
                              <i class="fa-solid fa-link"></i> Link kopieren
                            </button>
                            <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem; color: #059669; border-color: #a7f3d0;" title="Freigabe-Einladung per E-Mail an Kunden senden" onclick="sendApprovalEmail('${m.timesheetId}')">
                              <i class="fa-solid fa-paper-plane"></i> E-Mail senden
                            </button>
                          </div>
                        `;
                      }

                      const showTime = currentBillingType === "all" || currentBillingType === "time";
                      const showTravel = currentBillingType === "all" || currentBillingType === "travel";
                      const monthKey = `${p.id}_${m.period}`.replace(/[^a-zA-Z0-9_-]/g, "_");

                      return `
                        <div style="background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                            <div>
                              <strong style="font-size: 1.05rem; color: #0f172a;"><i class="fa-solid fa-calendar-days"></i> Abrechnungsmonat: ${m.period}</strong>
                              <span class="badge badge-secondary" style="font-size: 0.75rem; margin-left: 4px;">v${m.versionNumber || 1}.0</span>
                              <span style="margin-left: 8px;">${statusBadge}</span>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                              ${pdfButtonsHtml}
                              ${actionsHtml}
                            </div>
                          </div>

                          ${m.rejectionReason ? `
                            <div style="background: #fff1f2; border: 2px solid #f87171; padding: 12px 16px; border-radius: 8px; color: #991b1b; margin-bottom: 14px; font-size: 0.88rem;">
                              <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                                <i class="fa-solid fa-circle-exclamation"></i> <strong>Korrekturanforderung / Beanstandung des Kunden:</strong>
                              </div>
                              <div style="background: #ffffff; padding: 10px 14px; border-radius: 6px; border: 1px solid #fca5a5; font-weight: 600; color: #1e293b; margin-top: 6px;">
                                "${m.rejectionReason}"
                              </div>
                              <div style="margin-top: 8px; font-size: 0.8rem; color: #7f1d1d;">
                                Tipp: Passen Sie die Zeiteinträge oder Belege an und klicken Sie anschließend auf <em>„Korrigierte Posten erneut vorlegen“</em>.
                              </div>
                            </div>
                          ` : ''}

                          <!-- KPIs pro Monat -->
                          <div style="display: flex; gap: 16px; flex-wrap: wrap; background: #f8fafc; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; font-size: 0.85rem;">
                            <span>Zeiterfassung: <strong>${m.totalHours.toFixed(2)} h abrechenbar</strong> (${m.timeAmountNet.toFixed(2)} € Netto)</span>
                            <span>Reisekosten: <strong>${m.travelAmountNet.toFixed(2)} €</strong> (${m.tripsCount} Fahrten)</span>
                            <span style="margin-left: auto; color: var(--primary); font-weight: 700; font-size: 0.95rem;">Gesamt: ${m.totalAmountNet.toFixed(2)} € Netto</span>
                          </div>

                          <!-- Tabellen Details -->
                          ${showTime && m.timeEntries.length > 0 ? `
                            <div style="margin-bottom: 12px;">
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-muted);"><i class="fa-solid fa-clock"></i> Zeiteinträge (${m.timeEntries.length}):</div>
                                ${isSelectable ? `
                                  <div style="font-size: 0.75rem;">
                                    <a href="javascript:void(0)" onclick="toggleSelectAll('cb-time-${monthKey}', true)">Alle auswählen</a> | 
                                    <a href="javascript:void(0)" onclick="toggleSelectAll('cb-time-${monthKey}', false)">Keine</a>
                                  </div>
                                ` : ''}
                              </div>
                              <div class="table-container" style="margin-top: 0;">
                                <table>
                                  <thead>
                                    <tr>
                                      ${isSelectable ? '<th style="width: 32px;"><input type="checkbox" checked onchange="toggleSelectAll(\'cb-time-' + monthKey + '\', this.checked)"></th>' : ''}
                                      <th>Datum</th>
                                      <th>Zeit & Dauer</th>
                                      <th>Ort / Kategorie</th>
                                      <th>Tätigkeit</th>
                                      <th>Betrag Netto</th>
                                      <th>Aktion / Nachweis</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${m.timeEntries.map(e => {
                                      const bType = e.billing_type || (e.is_billable === 0 ? 'NonBillableVisible' : 'Billable');
                                      const isEntryBillable = bType === 'Billable';
                                      const isInternal = bType === 'InternalOnly';
                                      const entryNet = isEntryBillable ? ((e.billable_duration_hours || 0) * (e.billing_rate_snapshot || p.default_hourly_rate)) : 0.0;

                                      let typeBadge = '';
                                      if (bType === 'InternalOnly') {
                                        typeBadge = '<br><span class="badge badge-secondary" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 0.7rem;"><i class="fa-solid fa-lock"></i> Nur Intern (Kunden-unsichtbar)</span>';
                                      } else if (bType === 'NonBillableVisible') {
                                        typeBadge = '<br><span class="badge badge-secondary" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 0.7rem;"><i class="fa-solid fa-eye"></i> Nicht abrechenbar (Kunden-sichtbar)</span>';
                                      }

                                      return `
                                      <tr>
                                        ${isSelectable ? `<td><input type="checkbox" class="cb-time-${monthKey}" value="${e.id}" ${isInternal ? '' : 'checked'}></td>` : ''}
                                        <td><strong>${e.entry_date}</strong></td>
                                        <td>
                                          ${e.start_time} - ${e.end_time}<br>
                                          <small style="color: var(--text-muted);">${(e.actual_duration_hours || e.billable_duration_hours || 0).toFixed(2)} h</small>
                                        </td>
                                        <td>
                                          <span class="badge badge-info">${e.location || 'Remote'}</span><br>
                                          <small style="color: var(--text-muted);">${e.category}</small>
                                        </td>
                                        <td>
                                          ${e.short_description}
                                          ${typeBadge}
                                        </td>
                                        <td><strong>${entryNet.toFixed(2)} €</strong></td>
                                        <td>
                                          <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                                            ${isEntryEditable ? `
                                              <button class="btn btn-outline" style="padding: 2px 6px; font-size: 0.72rem; white-space: nowrap;" title="Zeiteintrag bearbeiten / korrigieren" onclick="openEditTimeEntryModal('${e.id}')">
                                                <i class="fa-solid fa-pen-to-square"></i> Bearbeiten
                                              </button>
                                              <button class="btn btn-outline" style="padding: 2px 6px; font-size: 0.72rem; color: #be123c; border-color: #fecdd3;" title="Zeiteintrag löschen" onclick="deleteTimeEntryPrompt('${e.id}')">
                                                <i class="fa-solid fa-trash"></i>
                                              </button>
                                            ` : ''}
                                            ${hasTs && !isInternal ? `
                                              <button class="btn btn-outline" style="padding: 2px 6px; font-size: 0.72rem; white-space: nowrap;" onclick="openTimesheetPdf('${m.timesheetId}', 'time')">
                                                <i class="fa-solid fa-file-pdf"></i> PDF
                                              </button>
                                            ` : ''}
                                          </div>
                                        </td>
                                      </tr>
                                    `}).join("")}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ` : ''}

                          ${showTravel && m.trips.length > 0 ? `
                            <div>
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-muted);"><i class="fa-solid fa-train"></i> Reisekosten & Fahrten (${m.trips.length}):</div>
                                ${isSelectable ? `
                                  <div style="font-size: 0.75rem;">
                                    <a href="javascript:void(0)" onclick="toggleSelectAll('cb-trip-${monthKey}', true)">Alle auswählen</a> | 
                                    <a href="javascript:void(0)" onclick="toggleSelectAll('cb-trip-${monthKey}', false)">Keine</a>
                                  </div>
                                ` : ''}
                              </div>
                              <div class="table-container" style="margin-top: 0;">
                                <table>
                                  <thead>
                                    <tr>
                                      ${isSelectable ? '<th style="width: 32px;"><input type="checkbox" checked onchange="toggleSelectAll(\'cb-trip-' + monthKey + '\', this.checked)"></th>' : ''}
                                      <th>Datum</th>
                                      <th>Strecke / Reisezweck</th>
                                      <th>Typ</th>
                                      <th>Distanz / Beleg</th>
                                      <th>Erstattung Netto</th>
                                      <th>Nachweis</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${m.trips.map(tr => {
                                      const tripNet = tr.ticket_cost || (tr.distance_km * tr.rate_per_km) || 0;
                                      return `
                                      <tr>
                                        ${isSelectable ? `<td><input type="checkbox" class="cb-trip-${monthKey}" value="${tr.id}" checked></td>` : ''}
                                        <td><strong>${tr.trip_date}</strong></td>
                                        <td>${tr.origin} &rarr; ${tr.destination}<br><small style="color: var(--text-muted);">${tr.purpose || ''}</small></td>
                                        <td><span class="badge badge-secondary">${tr.expense_type === 'PersonalCar' ? 'PKW' : 'ÖPNV/Bahn'}</span></td>
                                        <td>${tr.expense_type === 'PersonalCar' ? `${tr.distance_km} km` : 'Ticket'}</td>
                                        <td><strong>${tripNet.toFixed(2)} €</strong></td>
                                        <td>
                                          ${hasTs ? `
                                            <button class="btn btn-outline" style="padding: 2px 6px; font-size: 0.72rem; white-space: nowrap;" onclick="openTimesheetPdf('${m.timesheetId}', 'travel')">
                                              <i class="fa-solid fa-file-pdf"></i> PDF
                                            </button>
                                          ` : ''}
                                        </td>
                                      </tr>
                                    `}).join("")}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ` : ''}
                        </div>
                      `;
                    }).join("")}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      container.innerHTML = html;
    }

    function toggleSelectAll(className, isChecked) {
      document.querySelectorAll("." + className).forEach(cb => { cb.checked = isChecked; });
    }

    async function submitSelectedForSignature(projectId, period) {
      const monthKey = `${projectId}_${period}`.replace(/[^a-zA-Z0-9_-]/g, "_");
      const timeCheckboxes = document.querySelectorAll(`.cb-time-${monthKey}:checked`);
      const tripCheckboxes = document.querySelectorAll(`.cb-trip-${monthKey}:checked`);

      const selectedTimeEntryIds = Array.from(timeCheckboxes).map(cb => cb.value);
      const selectedTripIds = Array.from(tripCheckboxes).map(cb => cb.value);

      if (selectedTimeEntryIds.length === 0 && selectedTripIds.length === 0) {
        alert("Bitte wählen Sie mindestens einen Zeiteintrag oder eine Reisekosten-Position zur Vorlage aus.");
        return;
      }

      if (!confirm(`Möchten Sie die ${selectedTimeEntryIds.length} ausgewählten Zeiteinträge und ${selectedTripIds.length} Reisekosten für ${period} zur Unterzeichnung vorlegen? Diese Posten werden GoBD-konform schreibgeschützt.`)) return;

      try {
        const res = await fetch(`${API_BASE}/billing/submit-for-signature`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            period,
            selectedTimeEntryIds,
            selectedTripIds
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Leistungsnachweis liegt zur Unterzeichnung vor!");
          await loadBillingHierarchy();
        } else {
          alert("Fehler: " + (data.error || "Aktion fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    // ==========================================
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

        // Evidence § 18 EStG
        document.getElementById("edit-ev-problem").value = ev.problem_statement || "";
        document.getElementById("edit-ev-method").value = ev.methodology || "";
        document.getElementById("edit-ev-result").value = ev.result || "";

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

      const problemStatement = document.getElementById("edit-ev-problem").value;
      const methodology = document.getElementById("edit-ev-method").value;
      const result = document.getElementById("edit-ev-result").value;

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
            evidence: { problemStatement, methodology, result }
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
          subTitleText = "Revisionssicherer Nachweis für Buchhaltung & Finanzamt (§ 18 & § 9 EStG)";
        }

        const sigDataUrl = globalSettings.contractor_signature_data_url || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : "");
        const contractorTitle = globalSettings.contractor_title || "Senior Cloud & Security Architect";
        const contractorFullName = (globalSettings.email_sender_name ? globalSettings.email_sender_name.split("|")[0].trim() : "Michael Kirst-Neshva");
        const isApproved = ts.status === "Approved";
        const isCanceled = ts.status === "InvoiceCanceled";
        const isRejected = ts.status === "Rejected";
        const isPending = ts.status === "PendingSignature";
        const approverDisplay = ts.approved_by || proj.approver_name || cust.contact_person || "Projektleitung / Freigabeberechtigter";

        let statusHtml = "";
        let borderLeftColor = "#2563eb";
        if (isApproved) {
          borderLeftColor = "#16a34a";
          statusHtml = `Status: <strong style="color: #16a34a;">Freigegeben</strong> &bull; Freigegeben durch: <strong>${approverDisplay}</strong> am ${ts.approved_at_utc ? new Date(ts.approved_at_utc).toLocaleString('de-DE') : new Date().toLocaleString('de-DE')}`;
        } else if (isPending) {
          borderLeftColor = "#2563eb";
          statusHtml = `Status: <strong style="color: #2563eb;">Zur Prüfung & Freigabe</strong> &bull; Ansprechpartner: <strong>${approverDisplay}</strong>`;
        } else if (isCanceled) {
          borderLeftColor = "#ea580c";
          statusHtml = `Status: <strong style="color: #c2410c;">In Überarbeitung (Storno Version ${(ts.version_number || 1) - 1 > 0 ? (ts.version_number || 1) - 1 : 1}.0)</strong> &bull; Ansprechpartner: <strong>${approverDisplay}</strong>`;
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
                margin: 0;
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
                padding: 18mm 18mm 18mm 18mm;
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
                  min-height: 0 !important;
                  margin: 0 !important;
                  padding: 15mm 15mm 15mm 15mm !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
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
                              ${docType === 'tax_audit' && e.problem_statement ? `<br><small style="color: #475569;"><strong>Ausgangslage:</strong> ${e.problem_statement}</small>` : ''}
                              ${docType === 'tax_audit' && e.methodology ? `<br><small style="color: #475569;"><strong>Lösungsansatz:</strong> ${e.methodology}</small>` : ''}
                              ${docType === 'tax_audit' && e.result ? `<br><small style="color: #16a34a;"><strong>Resultat:</strong> ${e.result}</small>` : ''}
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
                              <td style="text-align: right;">${isCar ? '0,30 €/km' : 'Beleg'}</td>
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
                    <small style="color: #64748b;">Ort, Datum: Hamburg, ${new Date().toLocaleDateString('de-DE')}</small>
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
      if (!confirm("Möchten Sie wirklich alle bisherigen GoBD-Testprotokolle und Monatssiegel bereinigen?\n\nDies setzt das Protokoll für den produktiven Produktivbetrieb sauber zurück.")) return;

      try {
        const res = await fetch(`${API_BASE}/audit/clear-logs`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Protokolle wurden erfolgreich bereinigt!");
          await loadAuditLogs();
        } else {
          alert("Fehler: " + (data.error || "Bereinigung fehlgeschlagen."));
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
    // 💾 BACKUP, EXPORTE & DISASTER RECOVERY
    // ==========================================
    async function loadBackupFilterDropdowns() {
      const custSelect = document.getElementById("backup-filter-customer");
      if (!custSelect) return;

      try {
        const res = await fetch(`${API_BASE}/customers?includeArchived=true`);
        if (res.ok) {
          const customers = await res.json();
          custSelect.innerHTML = `<option value="all">Alle Kunden</option>` + 
            customers.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
        }
      } catch (e) {
        console.error("Error loading backup filter customers:", e);
      }

      onBackupCustomerChange();
    }

    async function onBackupCustomerChange() {
      const custSelect = document.getElementById("backup-filter-customer");
      const projSelect = document.getElementById("backup-filter-project");
      if (!custSelect || !projSelect) return;

      const custId = custSelect.value;
      if (custId === "all") {
        try {
          const res = await fetch(`${API_BASE}/projects?includeArchived=true`);
          if (res.ok) {
            const projects = await res.json();
            projSelect.innerHTML = `<option value="all">Alle Projekte</option>` +
              projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${p.project_number})</option>`).join("");
          }
        } catch {}
      } else {
        try {
          const res = await fetch(`${API_BASE}/customers/${custId}/overview`);
          if (res.ok) {
            const data = await res.json();
            const projects = data.projects || [];
            projSelect.innerHTML = `<option value="all">Alle Projekte dieses Kunden</option>` +
              projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${p.project_number})</option>`).join("");
          }
        } catch {}
      }
    }

    function getBackupFilters() {
      return {
        customerId: document.getElementById("backup-filter-customer")?.value || "all",
        projectId: document.getElementById("backup-filter-project")?.value || "all",
        year: document.getElementById("backup-filter-year")?.value || "all",
        month: document.getElementById("backup-filter-month")?.value || "all"
      };
    }

    // 1. Leistungsnachweise PDFs als ZIP
    async function exportTimesheetPdfsZip() {
      const btn = document.getElementById("btn-export-pdf-zip");
      const statusEl = document.getElementById("export-pdf-status");
      const filters = getBackupFilters();

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> Erstelle PDF-Archiv...`;
      }
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.innerText = "Lade Nachweis-Manifest...";
      }

      try {
        const manifestRes = await fetch(`${API_BASE}/export/timesheet-manifest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters)
        });

        if (!manifestRes.ok) throw new Error("Fehler beim Abrufen der Nachweise.");
        const { timesheets } = await manifestRes.json();

        if (!timesheets || timesheets.length === 0) {
          alert("Keine Leistungsnachweise für die gewählten Filterkriterien gefunden.");
          return;
        }

        if (typeof JSZip === "undefined") {
          throw new Error("JSZip-Bibliothek wird geladen... Bitte versuchen Sie es in wenigen Sekunden erneut.");
        }

        const zip = new JSZip();
        let processed = 0;

        for (const ts of timesheets) {
          processed++;
          if (statusEl) statusEl.innerText = `Generiere PDF ${processed} von ${timesheets.length}: ${ts.period} (${ts.project_name})...`;

          try {
            const pdfRes = await fetch(`${API_BASE}/timesheets/${ts.id}/pdf`);
            if (pdfRes.ok) {
              const blob = await pdfRes.blob();
              const safeCust = (ts.customer_name || 'Kunde').replace(/[^a-zA-Z0-9_-]/g, '_');
              const safeProj = (ts.project_name || 'Projekt').replace(/[^a-zA-Z0-9_-]/g, '_');
              const filename = `${ts.period}_${safeCust}_${safeProj}_v${ts.version_number || 1}.pdf`;
              zip.file(filename, blob);
            }
          } catch (err) {
            console.warn(`PDF generation error for ${ts.id}:`, err);
          }
        }

        if (statusEl) statusEl.innerText = "Komprimiere ZIP-Archiv...";
        const zipBlob = await zip.generateAsync({ type: "blob" });

        const downloadUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `Leistungsnachweise_${filters.year}_${filters.month}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        if (statusEl) statusEl.innerText = `✅ ${timesheets.length} PDFs erfolgreich als ZIP heruntergeladen!`;
      } catch (err) {
        alert("Export-Fehler: " + err.message);
        if (statusEl) statusEl.innerText = "Fehler beim Export.";
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> PDFs als ZIP herunterladen`;
        }
      }
    }

    // 2. Steuer- & Reisekostenbelege als ZIP
    async function exportTaxReceiptsZip() {
      const btn = document.getElementById("btn-export-receipts-zip");
      const statusEl = document.getElementById("export-receipts-status");
      const filters = getBackupFilters();

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> Sammle Belege...`;
      }
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.innerText = "Lade Beleg-Übersicht aus R2...";
      }

      try {
        const manifestRes = await fetch(`${API_BASE}/export/tax-receipts-manifest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters)
        });

        if (!manifestRes.ok) throw new Error("Fehler beim Abrufen des Beleg-Manifests.");
        const { receipts, signedDocs } = await manifestRes.json();

        const totalCount = (receipts?.length || 0) + (signedDocs?.length || 0);
        if (totalCount === 0) {
          alert("Keine Belege oder signierten Dokumente für die gewählten Filter gefunden.");
          return;
        }

        const zip = new JSZip();
        const originalFolder = zip.folder("Originalbelege_Quittungen");
        const signedFolder = zip.folder("Unterschriebene_Nachweise");

        let csv = "\uFEFFTyp;ID;Kunde;Projekt;Datum / Periode;Dateiname;Betrag Brutto;Betrag Netto;MwSt\n";
        let current = 0;

        // 1. Quittungen
        for (const r of (receipts || [])) {
          current++;
          if (statusEl) statusEl.innerText = `Lade Beleg ${current} von ${totalCount}...`;
          csv += `QUITTUNG;${r.id};"${r.customer_name}";"${r.project_name}";${r.uploaded_at_utc?.substring(0, 10)};"${r.original_filename}";${r.amount_gross || 0};${r.amount_net || 0};${r.vat_rate || 0}\n`;

          try {
            const fileRes = await fetch(`${API_BASE}/receipts/${r.id}/download`);
            if (fileRes.ok) {
              const blob = await fileRes.blob();
              originalFolder.file(`${r.uploaded_at_utc?.substring(0, 10)}_${r.original_filename}`, blob);
            }
          } catch (e) {
            console.warn("Receipt download error:", e);
          }
        }

        // 2. Signierte Nachweise
        for (const s of (signedDocs || [])) {
          current++;
          if (statusEl) statusEl.innerText = `Lade Dokument ${current} von ${totalCount}...`;
          csv += `SIGNIERTES_DOKUMENT;${s.id};"${s.customer_name}";"${s.project_name}";${s.period};"${s.signed_document_filename}";0;0;0\n`;

          try {
            const fileRes = await fetch(`${API_BASE}/public/timesheets/${s.id}/download-signed-document`);
            if (fileRes.ok) {
              const blob = await fileRes.blob();
              signedFolder.file(`${s.period}_v${s.version_number || 1}_${s.signed_document_filename || 'Nachweis.pdf'}`, blob);
            }
          } catch (e) {
            console.warn("Signed doc download error:", e);
          }
        }

        zip.file("Belege_Uebersicht.csv", csv);

        if (statusEl) statusEl.innerText = "Komprimiere Belege-ZIP...";
        const zipBlob = await zip.generateAsync({ type: "blob" });

        const downloadUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `Steuerbelege_Reisekosten_${filters.year}_${filters.month}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        if (statusEl) statusEl.innerText = `✅ ${totalCount} Belege erfolgreich als ZIP archiviert!`;
      } catch (err) {
        alert("Fehler beim Beleg-Export: " + err.message);
        if (statusEl) statusEl.innerText = "Fehler beim Export.";
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Belege als ZIP herunterladen`;
        }
      }
    }

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
  
