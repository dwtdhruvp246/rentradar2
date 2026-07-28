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

export function enableTableSorting(root = document) {
  root.querySelectorAll("table.data-table").forEach((table) => {
    table.querySelectorAll("thead th").forEach((header, index) => {
      if (header.dataset.sortReady) return;
      header.dataset.sortReady = "true";
      header.tabIndex = 0;
      header.setAttribute("role", "button");
      header.addEventListener("click", () => sortTable(table, index, header));
      header.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          sortTable(table, index, header);
        }
      });
    });
  });
}

function sortTable(table, index, header) {
  const tbody = table.tBodies?.[0];
  if (!tbody) return;
  const direction = header.dataset.sortDirection === "asc" ? "desc" : "asc";
  table.querySelectorAll("thead th").forEach((cell) => cell.removeAttribute("data-sort-direction"));
  header.dataset.sortDirection = direction;
  const rows = Array.from(tbody.rows).filter((row) => row.cells.length > index && !row.querySelector("[colspan]"));
  rows
    .sort((a, b) => compareValues(a.cells[index]?.textContent || "", b.cells[index]?.textContent || "", direction))
    .forEach((row) => tbody.append(row));
}

function compareValues(a, b, direction) {
  const cleanA = String(a || "").trim();
  const cleanB = String(b || "").trim();
  const numberA = parseSortableNumber(cleanA);
  const numberB = parseSortableNumber(cleanB);
  const dateA = Date.parse(cleanA);
  const dateB = Date.parse(cleanB);
  let result;
  if (Number.isFinite(numberA) && Number.isFinite(numberB)) result = numberA - numberB;
  else if (Number.isFinite(dateA) && Number.isFinite(dateB)) result = dateA - dateB;
  else result = cleanA.localeCompare(cleanB, undefined, { numeric: true, sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

function parseSortableNumber(value) {
  const normalized = value.replace(/^(usd|myr|zar|rm)\s*/i, "").replace(/[$,]/g, "").trim();
  return /^[+-]?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}
