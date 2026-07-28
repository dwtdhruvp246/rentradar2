import { requireAuth } from "./auth.js";
import { renderAppLayout } from "./layout.js";
import { buildPermissionSet, applyPermissionUI } from "./permissions.js";
import { appViewsForRole, defaultAppView, routeView, storeAppView } from "./role-state.js";
import { startRealtime } from "./realtime.js";
import { preserveScroll, restoreScroll } from "./state.js";
import { renderView } from "./pages/views.js";

let currentView = "dashboard";
let pageRoot;
let currentIdentity;

function hashView() {
  const candidate = location.hash.slice(1).split("?")[0];
  return routeView(candidate, currentIdentity);
}

async function navigate({ quiet = false } = {}) {
  preserveScroll(currentView);
  currentView = hashView();
  storeAppView(currentView, currentIdentity);
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
  if (!location.hash) history.replaceState(null, "", `#${defaultAppView(identity)}`);
  const allowedViews = new Set(appViewsForRole(identity.profile?.role));
  document.querySelectorAll("[data-view-link]").forEach((link) => { if (!allowedViews.has(link.dataset.viewLink)) link.remove(); });
  await navigate();
  startRealtime({ profileId: identity.profile?.id || identity.user.id, getCurrentView: () => currentView, refreshView: (_, options) => navigate(options) });
}

init();
