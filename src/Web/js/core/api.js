/**
 * ActaNex - Central API Client & Auth Manager
 * Version 3.0.0
 */

const API_BASE = window.location.hostname.includes("demo")
  ? "https://actanex-demo-worker.michael-kirst.workers.dev/api/v1"
  : window.location.hostname.includes("open")
  ? "https://actanex-open-worker.michael-kirst.workers.dev/api/v1"
  : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://127.0.0.1:8787/api/v1"
  : "https://actanex-worker.michael-kirst.workers.dev/api/v1";

let authToken = localStorage.getItem("evidence_auth_token") || sessionStorage.getItem("evidence_auth_token") || "";
let currentUser = null;
let globalCustomers = [];
let globalProjects = [];
let globalSettings = {};

function formatCurrency(val) {
  const num = Number(val) || 0;
  return num.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function apiRequest(endpoint, options = {}) {
  options.headers = options.headers || {};
  
  if (authToken && !options.headers["Authorization"]) {
    options.headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const response = await fetch(url, options);

  if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/me")) {
    clearAuth();
    showLoginModal();
    throw new Error("Sitzung abgelaufen. Bitte erneut anmelden.");
  }

  return response;
}

function clearAuth() {
  authToken = "";
  currentUser = null;
  localStorage.removeItem("evidence_auth_token");
  sessionStorage.removeItem("evidence_auth_token");
}

function showLoginModal() {
  const loginEl = document.getElementById("login-container");
  if (loginEl) loginEl.style.display = "flex";
}

function hideLoginModal() {
  const loginEl = document.getElementById("login-container");
  if (loginEl) loginEl.style.display = "none";
}
