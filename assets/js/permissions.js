const dependencies = Object.freeze({
  "properties.create": "properties.view",
  "properties.edit": "properties.view",
  "properties.archive": "properties.view",
  "units.create": "units.view",
  "units.edit": "units.view",
  "maintenance.assign": "maintenance.view",
  "maintenance.edit": "maintenance.view",
  "payments.create": "payments.view",
  "payments.edit": "payments.view",
});

const roleDefaults = Object.freeze({
  super_admin: ["*"],
  admin_staff: ["admin.dashboard.view", "admin.notes.view"],
  landlord: ["dashboard.view", "properties.view", "properties.create", "properties.edit", "units.view", "units.create", "tenants.view", "leases.view", "payments.view", "payments.create", "maintenance.view", "reports.view"],
  ipm: ["dashboard.view", "properties.view", "units.view", "tenants.view", "leases.view", "payments.view", "maintenance.view", "reports.view", "landlords.view"],
  pmc: ["dashboard.view", "properties.view", "units.view", "tenants.view", "leases.view", "payments.view", "maintenance.view", "reports.view", "staff.view", "landlords.view"],
  tenant: ["dashboard.view", "leases.view", "payments.view", "maintenance.view", "account.view"],
  staff: ["dashboard.view", "maintenance.view"],
});

export function buildPermissionSet(role, explicit = []) {
  return new Set([...(roleDefaults[role] || []), ...explicit]);
}

export function can(permission, permissionSet) {
  if (permissionSet.has("*")) return true;
  const required = dependencies[permission];
  return permissionSet.has(permission) && (!required || permissionSet.has(required));
}

export function applyPermissionUI(root, permissionSet) {
  root.querySelectorAll("[data-permission]").forEach((element) => {
    const allowed = can(element.dataset.permission, permissionSet);
    element.hidden = !allowed;
    element.setAttribute("aria-hidden", String(!allowed));
  });
}
