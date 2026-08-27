/**
 * ActaNex - Slide-Over Drawer Manager with Split Receipt Viewer
 * Version 3.0.0
 */

let currentReceiptZoom = 1.0;
let drawerSaveCallback = null;

function openSlideOverDrawer(options = {}) {
  const title = options.title || "Eintrag bearbeiten";
  const subtitle = options.subtitle || "GoBD Detailansicht";
  const formHtml = options.formHtml || "";
  const receiptUrl = options.receiptUrl || "";
  drawerSaveCallback = options.onSave || null;

  document.getElementById("drawer-title").innerText = title;
  document.getElementById("drawer-subtitle").innerText = subtitle;
  document.getElementById("drawer-form-pane").innerHTML = formHtml;

  const img = document.getElementById("drawer-receipt-img");
  const pdf = document.getElementById("drawer-receipt-pdf");
  const placeholder = document.getElementById("drawer-no-receipt-placeholder");
  const saveBtn = document.getElementById("drawer-save-btn");

  if (saveBtn) {
    saveBtn.style.display = drawerSaveCallback ? "inline-flex" : "none";
  }

  currentReceiptZoom = 1.0;
  if (img) img.style.transform = `scale(1)`;

  if (receiptUrl) {
    if (placeholder) placeholder.style.display = "none";
    if (receiptUrl.toLowerCase().includes(".pdf")) {
      if (img) img.style.display = "none";
      if (pdf) {
        pdf.style.display = "block";
        pdf.src = receiptUrl;
      }
    } else {
      if (pdf) pdf.style.display = "none";
      if (img) {
        img.style.display = "block";
        img.src = receiptUrl;
      }
    }
  } else {
    if (placeholder) placeholder.style.display = "block";
    if (img) img.style.display = "none";
    if (pdf) pdf.style.display = "none";
  }

  document.getElementById("drawer-backdrop").classList.add("active");
  document.getElementById("slide-over-drawer").classList.add("active");
}

function closeSlideOverDrawer() {
  document.getElementById("drawer-backdrop").classList.remove("active");
  document.getElementById("slide-over-drawer").classList.remove("active");
  drawerSaveCallback = null;
}

function zoomDrawerReceipt(delta) {
  const img = document.getElementById("drawer-receipt-img");
  if (!img || img.style.display === "none") return;
  currentReceiptZoom = Math.max(0.5, Math.min(3.0, currentReceiptZoom * delta));
  img.style.transform = `scale(${currentReceiptZoom})`;
}

async function handleDrawerSave() {
  if (typeof drawerSaveCallback === "function") {
    const success = await drawerSaveCallback();
    if (success !== false) {
      closeSlideOverDrawer();
    }
  }
}
