import { planStatusLabel, signOut } from "./auth.js";
import { getLocale, setLocale, translatePage } from "./i18n.js";
import { escapeHtml, formatDate, hydrateIcons, icon, setupDialogTriggers, showError } from "./ui.js";
import { supabase } from "./supabaseClient.js";
import { sitePath } from "./config.js";

const appNav = [
  ["dashboard", "layout-dashboard", "Dashboard", "dashboard.view"],
  ["properties", "building-2", "Properties", "properties.view"],
  ["units", "door-open", "Units", "units.view"],
  ["tenants", "users", "Tenants", "tenants.view"],
  ["leases", "file-signature", "Leases", "leases.view"],
  ["payments", "credit-card", "Payments", "payments.view"],
  ["finance", "landmark", "Finance", "payments.view"],
  ["maintenance", "wrench", "Maintenance", "maintenance.view"],
  ["inspections", "clipboard-check", "Inspections", "inspections.view"],
  ["documents", "folder-lock", "Documents", "documents.view"],
  ["tasks", "list-checks", "Tasks", "tasks.view"],
  ["staff", "contact-round", "Staff", "staff.view"],
  ["landlords", "briefcase-business", "Landlords", "landlords.view"],
];

const adminNav = [
  [sitePath("admin/index.html"), "layout-dashboard", "Dashboard"],
  [sitePath("admin/users.html"), "users", "Users"],
  [sitePath("admin/countries.html"), "globe-2", "Countries"],
  [sitePath("admin/pricing.html"), "badge-dollar-sign", "Pricing"],
  [sitePath("admin/subscriptions.html"), "receipt-text", "Subscriptions"],
  [sitePath("admin/enquiries.html"), "inbox", "Enquiries"],
  [sitePath("admin/platform-finance.html"), "chart-no-axes-combined", "Platform finance"],
  [sitePath("admin/settings.html"), "settings", "Settings"],
];

function brand() {
  return `<a class="brand" href="${sitePath("index.html")}" aria-label="Mushavo home"><img src="${sitePath("assets/img/mushavo-mark.png")}" alt="" style="width:38px;height:38px;object-fit:contain"><span>Mushavo</span></a>`;
}

function shell(sideLinks, identity, title) {
  const role = identity.profile?.role || "User";
  const name = identity.profile?.full_name || identity.user?.email || "Mushavo user";
  return `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <div class="scrim" data-nav-scrim></div>
    <aside class="sidebar" id="app-sidebar" aria-label="Primary navigation">
      <div class="sidebar-head">${brand()}</div>
      <nav class="sidebar-nav">${sideLinks}</nav>
      <div class="sidebar-foot">
        <div class="mobile-plan-status"><span class="status-chip"><span class="status-dot"></span>${planStatusLabel(identity)}</span></div>
        <a class="side-link" href="${sitePath("app/account.html")}">${icon("circle-user-round")}<span data-i18n="account">Account</span></a>
        <a class="side-link" href="${sitePath("app/settings.html")}">${icon("settings")}<span data-i18n="settings">Settings</span></a>
        <button class="side-link" type="button" data-sign-out style="width:100%;border:0;background:transparent;text-align:left">${icon("log-out")}<span data-i18n="signOut">Sign out</span></button>
      </div>
    </aside>
    <header class="app-header">
      <div style="display:flex;align-items:center;gap:10px;min-width:0">
        <button class="icon-button mobile-nav-toggle" type="button" aria-label="Open navigation" aria-controls="app-sidebar" aria-expanded="false" data-nav-toggle>${icon("menu")}</button>
        <div class="header-context"><strong>${title}</strong><span>${name} · ${role.replaceAll("_", " ")}</span></div>
      </div>
      <div class="header-actions">
        <span class="status-chip"><span class="status-dot"></span>${planStatusLabel(identity)}</span>
        <label class="sr-only" for="locale-select">Language</label>
        <select id="locale-select" class="btn btn-secondary" aria-label="Language" data-locale-select>
          <option value="en">EN</option><option value="ms">BM</option><option value="zh">中文</option>
        </select>
        <button class="icon-button" type="button" aria-label="Notifications" data-notifications-open>${icon("bell")}</button>
      </div>
    </header>
    <main class="app-main" id="main-content" tabindex="-1"><div class="page-shell" data-page-root></div></main>
    <dialog class="dialog notification-dialog" id="notifications-dialog"><div class="dialog-layout"><div class="dialog-header"><h2>Notifications</h2><button class="icon-button" type="button" aria-label="Close" data-dialog-close>${icon("x")}</button></div><div class="dialog-content" data-notifications-list></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-mark-notifications-read>Mark all read</button></div></div></dialog>
    <div class="toast-region" data-toast-region aria-live="polite"></div>`;
}

export function renderAppLayout(identity) {
  const links = appNav.map(([view, iconName, label, permission]) => `<a class="side-link" href="${sitePath(`app/index.html#${view}`)}" data-view-link="${view}" data-permission="${permission}">${icon(iconName)}<span>${label}</span></a>`).join("");
  document.body.innerHTML = `<div class="app-layout">${shell(`<p class="nav-group-label">Workspace</p>${links}<p class="nav-group-label">Analysis</p><a class="side-link" href="${sitePath("app/reports.html")}">${icon("chart-column")}<span data-i18n="reports">Reports</span></a>`, identity, "Workspace")}</div>`;
  setupShell();
}

export function renderAdminLayout(identity, pageKey = "dashboard") {
  const links = adminNav.map(([href, iconName, label]) => `<a class="side-link" href="${href}"${href.endsWith(pageKey === "dashboard" ? "index.html" : `${pageKey}.html`) ? " aria-current=\"page\"" : ""}>${icon(iconName)}<span>${label}</span></a>`).join("");
  document.body.innerHTML = `<div class="app-layout">${shell(`<p class="nav-group-label">Administration</p>${links}`, identity, "Administration")}</div>`;
  setupShell();
}

function setupShell() {
  hydrateIcons();
  setupDialogTriggers();
  translatePage();
  const sidebar = document.querySelector(".sidebar");
  const scrim = document.querySelector("[data-nav-scrim]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const closeNav = () => { sidebar?.classList.remove("is-open"); scrim?.classList.remove("is-open"); document.body.classList.remove("nav-open"); toggle?.setAttribute("aria-expanded", "false"); };
  toggle?.addEventListener("click", () => {
    const open = !sidebar.classList.contains("is-open");
    sidebar.classList.toggle("is-open", open); scrim.classList.toggle("is-open", open); document.body.classList.toggle("nav-open", open); toggle.setAttribute("aria-expanded", String(open));
  });
  scrim?.addEventListener("click", closeNav);
  document.querySelector("[data-sign-out]")?.addEventListener("click", signOut);
  document.querySelector("[data-notifications-open]")?.addEventListener("click", openNotifications);
  document.querySelector("[data-mark-notifications-read]")?.addEventListener("click", async () => {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    if (error) showError(error); else openNotifications();
  });
  const locale = document.querySelector("[data-locale-select]");
  if (locale) { locale.value = getLocale(); locale.addEventListener("change", () => setLocale(locale.value)); }
}

async function openNotifications() {
  const dialog = document.getElementById("notifications-dialog");
  const list = dialog?.querySelector("[data-notifications-list]");
  if (!dialog || !list) return;
  list.innerHTML = '<div class="skeleton skeleton-line wide"></div><div class="skeleton skeleton-line short"></div>';
  if (!dialog.open) dialog.showModal();
  const { data, error } = await supabase.from("notifications").select("id,title,body,action_url,read_at,created_at").order("created_at", { ascending: false }).limit(30);
  if (error) { list.innerHTML = '<div class="empty-state"><div><strong>Notifications unavailable</strong>Please try again.</div></div>'; showError(error); return; }
  list.innerHTML = data?.length ? `<div class="record-list">${data.map((item) => `<a class="record-row" href="${escapeHtml(item.action_url ? sitePath(item.action_url) : "#")}"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body || "")} · ${formatDate(item.created_at)}</span></div>${item.read_at ? "" : '<span class="unread-dot" aria-label="Unread"></span>'}</a>`).join("")}</div>` : '<div class="empty-state"><div><strong>You are up to date</strong>Relevant requests and changes will appear here.</div></div>';
}
