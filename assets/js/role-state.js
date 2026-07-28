import { getState, setState } from "./state.js";

const appViewsByRole = Object.freeze({
  landlord: ["dashboard", "properties", "tenants", "leases", "payments", "finance", "maintenance", "inspections", "documents", "tasks", "staff"],
  ipm: ["dashboard", "landlords", "properties", "tenants", "leases", "payments", "finance", "maintenance", "documents", "tasks"],
  pmc: ["dashboard", "landlords", "properties", "tenants", "leases", "payments", "finance", "maintenance", "documents", "tasks", "staff"],
  tenant: ["dashboard", "tenants", "leases", "payments", "maintenance", "documents", "tasks"],
  staff: ["dashboard", "properties", "maintenance", "documents", "tasks"],
});

const adminPagesByRole = Object.freeze({
  super_admin: ["dashboard", "users", "countries", "pricing", "subscriptions", "enquiries", "platform-finance", "settings"],
  admin_staff: ["dashboard", "users", "enquiries", "platform-finance", "settings"],
});

export function appViewsForRole(role) {
  return appViewsByRole[role] || ["dashboard"];
}

export function adminPagesForRole(role) {
  return adminPagesByRole[role] || ["dashboard"];
}

export function isAppViewAllowed(view, identity) {
  return appViewsForRole(identity?.profile?.role).includes(view);
}

export function isAdminPageAllowed(page, identity) {
  return adminPagesForRole(identity?.profile?.role).includes(page);
}

export function defaultAppView(identity) {
  const role = identity?.profile?.role;
  if (role === "tenant") return "payments";
  if (role === "ipm" || role === "pmc") return "landlords";
  return "dashboard";
}

export function readStoredAppView(identity) {
  const stored = getState("currentView", "");
  return isAppViewAllowed(stored, identity) ? stored : defaultAppView(identity);
}

export function storeAppView(view, identity) {
  if (!isAppViewAllowed(view, identity)) return defaultAppView(identity);
  return setState("currentView", view);
}

export function routeView(candidate, identity) {
  return isAppViewAllowed(candidate, identity) ? candidate : readStoredAppView(identity);
}

export function normalizeCountryIds(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return Array.from(new Set(values.map((item) => String(item || "").trim()).filter(Boolean)));
}

export function adminCountryIds(identity) {
  const profile = identity?.profile || {};
  return normalizeCountryIds(profile.country_ids || (profile.country_id ? [profile.country_id] : []));
}

export function adminCanAccessCountry(identity, countryId) {
  if (identity?.profile?.role !== "admin_staff") return true;
  if (!countryId) return false;
  return adminCountryIds(identity).includes(countryId);
}

export function restrictRowsToAdminCountries(rows, identity, getCountryId = (row) => row.country_id) {
  if (identity?.profile?.role !== "admin_staff") return rows;
  const allowed = new Set(adminCountryIds(identity));
  return rows.filter((row) => allowed.has(getCountryId(row)));
}
