import { friendlyError } from "./errors.js";

export function icon(name, label = "") {
  return `<i data-lucide="${name}" class="icon"${label ? ` aria-label="${label}"` : " aria-hidden=\"true\""}></i>`;
}

export function hydrateIcons(root = document) {
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 }, root });
}

export function showToast(message, kind = "info") {
  const region = document.querySelector("[data-toast-region]");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.kind = kind;
  toast.setAttribute("role", kind === "error" ? "alert" : "status");
  toast.textContent = message;
  region.append(toast);
  setTimeout(() => toast.remove(), 4500);
}

export function showError(error, fallback) {
  showToast(friendlyError(error, fallback), "error");
}

export function skeletonLines(count = 4) {
  return Array.from({ length: count }, (_, index) => `<div class="skeleton skeleton-line ${index % 3 === 2 ? "short" : "wide"}"></div>`).join("");
}

export function setBusy(container, isBusy) {
  container?.setAttribute("aria-busy", String(isBusy));
}

export function formatCurrency(value, currency = "USD", locale = document.documentElement.lang || "en") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
}

export function formatDate(value, locale = document.documentElement.lang || "en") {
  return value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value)) : "-";
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

export function setupDialogTriggers() {
  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-dialog-open]");
    const closer = event.target.closest("[data-dialog-close]");
    if (opener) document.getElementById(opener.dataset.dialogOpen)?.showModal();
    if (closer) closer.closest("dialog")?.close();
  });
}
