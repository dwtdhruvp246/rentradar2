import { requireAuth } from "./auth.js";
import { renderAppLayout } from "./layout.js";
import { buildPermissionSet, applyPermissionUI } from "./permissions.js";
import { startRealtime } from "./realtime.js";
import { getState, preserveScroll, restoreScroll, setState } from "./state.js";
import { renderView } from "./pages/views.js";

const supportedViews = new Set(["dashboard", "properties", "units", "tenants", "leases", "payments", "finance", "maintenance", "inspections", "documents", "tasks", "staff", "landlords"]);
let currentView = "dashboard";
let pageRoot;
let currentIdentity;

function hashView() {
  const candidate = location.hash.slice(1).split("?")[0];
  return supportedViews.has(candidate) ? candidate : getState("currentView", "dashboard");
}

async function navigate({ quiet = false } = {}) {
  preserveScroll(currentView);
  currentView = hashView();
  setState("currentView", currentView);
  document.querySelectorAll("[data-view-link]").forEach((link) => link.setAttribute("aria-current", link.dataset.viewLink === currentView ? "page" : "false"));
  await renderView(currentView, pageRoot, { quiet, identity: currentIdentity });
  if (!quiet) { restoreScroll(currentView); pageRoot.focus({ preventScroll: true }); }
}

async function init() {
  const identity = await requireAuth();
  if (!identity) return;
  currentIdentity = identity;
  renderAppLayout(identity);
  pageRoot = document.querySelector("[data-page-root]");
  pageRoot.setAttribute("tabindex", "-1");
  const permissions = buildPermissionSet(identity.profile?.role, identity.profile?.permissions || []);
  applyPermissionUI(document, permissions);
  document.addEventListener("click", (event) => { if (event.target.closest("[data-refresh]")) navigate({ quiet: true }); });
  window.addEventListener("hashchange", () => navigate());
  if (!location.hash) history.replaceState(null, "", `#${hashView()}`);
  await navigate();
  startRealtime({ profileId: identity.profile?.id || identity.user.id, getCurrentView: () => currentView, refreshView: (_, options) => navigate(options) });
}

init();
