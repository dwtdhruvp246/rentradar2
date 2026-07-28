import { supabase } from "../supabaseClient.js";
import { enableTableSorting, escapeHtml, formatCurrency, formatDate, hydrateIcons, icon, setBusy, showError, showToast, skeletonLines } from "../ui.js";
import { getWorkspaceContext, setActiveLandlord } from "../workspace.js";
import { downloadPaymentReceipt } from "../receipts.js";
import { getState, setState } from "../state.js";

const viewMeta = {
  dashboard: ["Dashboard", "A live view of your property operations."],
  properties: ["Properties", "Manage owned and delegated properties."],
  units: ["Units", "Track occupancy, rent, and assigned staff."],
  tenants: ["Tenants", "Request and manage tenant-approved landlord links."],
  leases: ["Leases", "Keep active agreements and historical records."],
  payments: ["Payments", "Record rent, deposits, and other payments separately."],
  finance: ["Finance", "Review rent revenue, deposits, arrears, and expenses."],
  maintenance: ["Maintenance", "Track requests, assignments, costs, and progress."],
  inspections: ["Inspections", "Schedule property and unit inspections."],
  documents: ["Documents", "Keep private leases, receipts, and property records."],
  tasks: ["Tasks", "Coordinate personal and assigned work."],
  staff: ["Staff", "Manage valid staff relationships and permission scopes."],
  landlords: ["Landlords", "Change delegated landlord context for this account only."],
};

const modules = {
  properties: { table: "properties", fields: [
    ["name", "Property name", "text", true], ["address_line_1", "Street address", "text", true],
    ["city", "City", "text", true], ["property_type", "Property type", "select", true, ["Apartment building","House","Commercial","Mixed use","Other"]],
  ], columns: ["name","city","property_type","created_at"] },
  units: { table: "units", fields: [
    ["property_id", "Property", "relation", true, "properties"], ["name", "Unit name", "text", true],
    ["occupancy_status", "Occupancy", "select", true, ["vacant","occupied","unavailable"]], ["monthly_rent", "Monthly rent", "number", true], ["currency", "Currency", "select", true, ["USD","ZAR","MYR"]],
  ], columns: ["name","occupancy_status","monthly_rent","currency"] },
  leases: { table: "leases", fields: [
    ["unit_id", "Unit", "relation", true, "units"], ["tenant_id", "Accepted tenant", "tenant", true], ["status", "Status", "select", true, ["draft","pending","active","ended","cancelled"]],
    ["starts_on", "Start date", "date", true], ["ends_on", "End date", "date"], ["rent_amount", "Rent amount", "number", true], ["deposit_amount", "Deposit", "number"], ["currency", "Currency", "select", true, ["USD","ZAR","MYR"]],
  ], columns: ["status","starts_on","ends_on","rent_amount","currency"] },
  payments: { table: "payments", fields: [
    ["lease_id", "Lease", "lease", false], ["payment_type", "Purpose", "select", true, ["rent","deposit","maintenance","other"]], ["amount", "Amount", "number", true],
    ["currency", "Currency", "select", true, ["USD","ZAR","MYR"]], ["paid_at", "Paid at", "datetime-local", true], ["rental_period_start", "Rent period start", "date"], ["rental_period_end", "Rent period end", "date"], ["reference", "Reference", "text"], ["notes", "Notes", "textarea"],
  ], columns: ["payment_type","amount","currency","paid_at","reference"] },
  maintenance: { table: "maintenance_requests", fields: [
    ["property_id", "Property", "relation", true, "properties"], ["unit_id", "Unit", "relation", false, "units"], ["title", "Issue", "text", true], ["description", "Description", "textarea"],
    ["priority", "Priority", "select", true, ["low","normal","high","urgent"]], ["status", "Status", "select", true, ["new","assigned","in_progress","waiting","completed","cancelled"]], ["estimated_cost", "Estimated cost", "number"],
  ], columns: ["title","priority","status","estimated_cost","created_at"] },
  inspections: { table: "inspections", fields: [
    ["property_id", "Property", "relation", true, "properties"], ["unit_id", "Unit", "relation", false, "units"], ["inspection_type", "Type", "select", true, ["move_in","routine","move_out","safety","other"]],
    ["scheduled_at", "Schedule", "datetime-local", true], ["status", "Status", "select", true, ["scheduled","in_progress","completed","cancelled"]], ["notes", "Notes", "textarea"],
  ], columns: ["inspection_type","scheduled_at","status","notes"] },
  tasks: { table: "workspace_tasks", fields: [
    ["title", "Task", "text", true], ["description", "Description", "textarea"], ["priority", "Priority", "select", true, ["low","normal","high"]], ["due_at", "Due", "datetime-local"],
  ], columns: ["title","priority","due_at","completed_at"] },
};

function pageHeader(view, allowAdd = false, context = null) {
  const [title, description] = viewMeta[view];
  const selector = context?.landlords?.length ? `<label class="context-select"><span>Landlord</span><select data-landlord-context>${context.landlords.map((item) => `<option value="${item.id}"${item.id === context.landlordId ? " selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label>` : "";
  return `<header class="page-header"><div><h1>${title}</h1><p>${description}</p></div><div class="toolbar">${selector}<button class="btn btn-secondary" type="button" data-refresh>${icon("refresh-cw")}Refresh</button>${allowAdd ? `<button class="btn btn-primary" type="button" data-dialog-open="record-dialog">${icon("plus")}Add ${title.replace(/s$/, "")}</button>` : ""}</div></header>`;
}

async function optionData(context) {
  const filter = (query) => context.landlordId ? query.eq("landlord_id", context.landlordId) : query;
  const [properties, units, links, leases] = await Promise.all([
    filter(supabase.from("properties").select("id,name")).is("archived_at", null),
    filter(supabase.from("units").select("id,name")).is("archived_at", null),
    filter(supabase.from("tenant_links").select("tenant_id,profiles!tenant_links_tenant_id_fkey(full_name)")).eq("status", "accepted"),
    filter(supabase.from("leases").select("id,tenant_id,unit_id,status")).in("status", ["pending","active"]),
  ]);
  return { properties: properties.data || [], units: units.data || [], tenants: (links.data || []).map((x) => ({ id: x.tenant_id, name: x.profiles?.full_name || "Tenant" })), leases: leases.data || [] };
}

function inputField(field, options) {
  const [name, label, type, required, source] = field;
  const req = required ? " required" : "";
  if (type === "textarea") return `<div class="field"><label for="field-${name}">${label}</label><textarea id="field-${name}" name="${name}"${req}></textarea></div>`;
  const list = type === "select" ? source : type === "relation" ? options[source]?.map((item) => [item.id, item.name]) : type === "tenant" ? options.tenants?.map((item) => [item.id, item.name]) : type === "lease" ? options.leases?.map((item) => [item.id, `${item.status} lease - ${item.id.slice(0,8)}`]) : null;
  if (list) return `<div class="field"><label for="field-${name}">${label}</label><select id="field-${name}" name="${name}"${req}><option value="">Choose ${label.toLowerCase()}</option>${list.map((item) => { const pair = Array.isArray(item) ? item : [item, String(item).replaceAll("_", " ")]; return `<option value="${escapeHtml(pair[0])}">${escapeHtml(pair[1])}</option>`; }).join("")}</select></div>`;
  return `<div class="field"><label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" type="${type}"${type === "number" ? ' min="0" step="0.01"' : ""}${req}></div>`;
}

function recordDialog(view, options = {}) {
  const title = viewMeta[view][0].replace(/s$/, "");
  return `<dialog class="dialog" id="record-dialog"><form class="dialog-layout" data-record-form><div class="dialog-header"><h2>Add ${title}</h2><button class="icon-button" type="button" aria-label="Close" data-dialog-close>${icon("x")}</button></div><div class="dialog-content"><div class="form-grid">${modules[view].fields.map((field) => inputField(field, options)).join("")}</div></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary" type="submit">Save ${title.toLowerCase()}</button></div></form></dialog>`;
}

export async function renderView(view, root, { quiet = false, identity } = {}) {
  if (!viewMeta[view]) view = "dashboard";
  const context = await getWorkspaceContext(identity);
  if (view === "dashboard") return renderDashboard(root, quiet, context, identity);
  if (view === "properties" || view === "units") return renderPropertyWorkspace(root, quiet, context, identity);
  if (view === "tenants") return renderTenants(root, context, identity);
  if (view === "finance") return renderFinance(root, context, identity);
  if (view === "documents") return renderDocuments(root, context, identity);
  if (view === "staff") return renderStaff(root, context, identity);
  if (view === "landlords") return renderLandlords(root, context);
  return renderModule(view, root, quiet, context, identity);
}

function canCreate(view, identity, context) {
  if (identity.profile.role === "landlord") return true;
  if (identity.profile.role === "tenant") return view === "maintenance" && Boolean(context.landlordId);
  const permission = view === "finance" ? "expenses.create" : `${view}.create`;
  return context.permissions?.[permission] === true;
}

function wireContext(root) {
  root.querySelector("[data-landlord-context]")?.addEventListener("change", (event) => { setActiveLandlord(event.target.value); window.dispatchEvent(new HashChangeEvent("hashchange")); });
}

async function renderDashboard(root, quiet, context) {
  if (!quiet || !root.querySelector(".dashboard-grid")) root.innerHTML = `${pageHeader("dashboard", false, context)}<section class="dashboard-grid">${["Properties","Occupied units","Rent collected","Open maintenance"].map((label) => `<article class="panel kpi"><span class="kpi-label">${label}</span><div class="kpi-value skeleton" style="height:36px;width:55%;margin-top:14px"></div><div class="kpi-note">Current account context</div></article>`).join("")}<article class="panel panel-span-3"><div class="panel-header"><h2>Recent rent payments</h2></div><div class="panel-body">${skeletonLines(5)}</div></article><article class="panel"><div class="panel-header"><h2>Attention needed</h2></div><div class="panel-body">${skeletonLines(5)}</div></article></section>`;
  hydrateIcons(root); wireContext(root); setBusy(root, true);
  const scope = (query) => context.landlordId ? query.eq("landlord_id", context.landlordId) : query;
  try {
    const [properties, occupied, payments, maintenance] = await Promise.all([
      scope(supabase.from("properties").select("id", { count: "exact", head: true })).is("archived_at", null),
      scope(supabase.from("units").select("id", { count: "exact", head: true })).eq("occupancy_status", "occupied").is("archived_at", null),
      scope(supabase.from("payments").select("id,landlord_id,tenant_id,amount,currency,paid_at,payment_type,rental_period_start,rental_period_end,reference,notes")).eq("payment_type", "rent").order("paid_at", { ascending: false }).limit(6),
      scope(supabase.from("maintenance_requests").select("id", { count: "exact", head: true })).in("status", ["new","assigned","in_progress"]),
    ]);
    const total = (payments.data || []).reduce((sum, item) => sum + Number(item.amount), 0);
    [properties.count || 0, occupied.count || 0, formatCurrency(total, payments.data?.[0]?.currency || "USD"), maintenance.count || 0].forEach((value, index) => { const node = root.querySelectorAll(".kpi-value")[index]; node.className = "kpi-value"; node.textContent = value; });
    const recentBody = root.querySelector(".panel-span-3 .panel-body");
    recentBody.innerHTML = payments.data?.length ? tableMarkup(payments.data, ["paid_at","payment_type","amount","currency"], true) : empty("No rent payments yet", "Structured rent payments will appear here.");
    wireReceipts(recentBody, payments.data || []);
    root.querySelector(".dashboard-grid > .panel:last-child .panel-body").innerHTML = maintenance.count ? `<strong>${maintenance.count} open maintenance request${maintenance.count === 1 ? "" : "s"}</strong><p>Review assignment and progress.</p>` : empty("All clear", "No maintenance items need attention.");
  } catch (error) { showError(error, "Dashboard data could not be loaded."); } finally { setBusy(root, false); }
}

async function renderPropertyWorkspace(root, quiet, context, identity) {
  const canAddProperty = identity.profile.role === "landlord" || context.permissions?.["properties.create"] === true;
  const canAddUnit = identity.profile.role === "landlord" || context.permissions?.["units.create"] === true;
  if (!quiet || !root.querySelector("[data-property-workspace]")) {
    root.innerHTML = `${pageHeader("properties", false, context)}<section class="dashboard-grid" data-property-workspace><article class="panel kpi"><span class="kpi-label">Properties</span><div class="kpi-value" data-property-count>...</div><div class="kpi-note">Current landlord scope</div></article><article class="panel kpi"><span class="kpi-label">Units</span><div class="kpi-value" data-unit-count>...</div><div class="kpi-note">Across selected portfolio</div></article><article class="panel kpi"><span class="kpi-label">Occupied</span><div class="kpi-value" data-occupied-count>...</div><div class="kpi-note">Active occupancy</div></article><article class="panel kpi"><span class="kpi-label">Vacant</span><div class="kpi-value" data-vacant-count>...</div><div class="kpi-note">Ready to assign</div></article><article class="panel panel-span-2"><div class="panel-header"><h2>Properties</h2><div class="toolbar"><input class="toolbar-search" data-property-search placeholder="Search portfolio">${canAddProperty ? `<button class="btn btn-primary" data-dialog-open="property-dialog">${icon("plus")}Add property</button>` : ""}</div></div><div class="panel-body">${skeletonLines(7)}</div></article><article class="panel panel-span-2"><div class="panel-header"><h2>Units in selected property</h2><div class="toolbar">${canAddUnit ? `<button class="btn btn-primary" data-dialog-open="unit-dialog">${icon("plus")}Add unit</button>` : ""}</div></div><div class="panel-body" data-unit-panel>${skeletonLines(7)}</div></article></section>${canAddProperty ? propertyDialog() : ""}${canAddUnit ? unitDialog() : ""}`;
  }
  hydrateIcons(root);
  wireContext(root);
  const scope = (query) => context.landlordId ? query.eq("landlord_id", context.landlordId) : query;
  const [propertiesResult, unitsResult] = await Promise.all([
    scope(supabase.from("properties").select("id,name,address_line_1,city,property_type,country_id,created_at").is("archived_at", null).order("created_at", { ascending: false })),
    scope(supabase.from("units").select("id,property_id,name,occupancy_status,monthly_rent,currency,created_at").is("archived_at", null).order("created_at", { ascending: false })),
  ]);
  if (propertiesResult.error || unitsResult.error) return showError(propertiesResult.error || unitsResult.error, "Portfolio data could not be loaded.");
  const properties = propertiesResult.data || [];
  const units = unitsResult.data || [];
  const selectedKey = `selectedProperty:${context.landlordId || identity.profile.id}`;
  let selectedPropertyId = getState(selectedKey, properties[0]?.id || "");
  if (!properties.some((property) => property.id === selectedPropertyId)) selectedPropertyId = properties[0]?.id || "";
  setState(selectedKey, selectedPropertyId);
  root.querySelector("[data-property-count]").textContent = properties.length;
  root.querySelector("[data-unit-count]").textContent = units.length;
  root.querySelector("[data-occupied-count]").textContent = units.filter((unit) => unit.occupancy_status === "occupied").length;
  root.querySelector("[data-vacant-count]").textContent = units.filter((unit) => unit.occupancy_status === "vacant").length;

  const renderLists = () => {
    const search = root.querySelector("[data-property-search]")?.value.toLowerCase() || "";
    const filtered = search ? properties.filter((property) => [property.name, property.address_line_1, property.city, property.property_type].some((value) => String(value || "").toLowerCase().includes(search))) : properties;
    root.querySelector(".panel-span-2 .panel-body").innerHTML = filtered.length ? `<div class="record-list">${filtered.map((property) => {
      const propertyUnits = units.filter((unit) => unit.property_id === property.id);
      return `<button class="record-row record-button" type="button" data-property-id="${property.id}"><div><strong>${escapeHtml(property.name)}</strong><span>${escapeHtml(property.address_line_1)}, ${escapeHtml(property.city)} - ${propertyUnits.length} unit${propertyUnits.length === 1 ? "" : "s"}</span></div>${property.id === selectedPropertyId ? '<span class="status-chip">Selected</span>' : icon("chevron-right")}</button>`;
    }).join("")}</div>` : empty("No matching properties", "Add a property or change the search.");
    const selectedProperty = properties.find((property) => property.id === selectedPropertyId);
    const selectedUnits = units.filter((unit) => unit.property_id === selectedPropertyId);
    root.querySelector("[data-unit-panel]").innerHTML = selectedProperty ? `${selectedUnits.length ? tableMarkup(selectedUnits, ["name","occupancy_status","monthly_rent","currency","created_at"]) : empty("No units in this property", "Add units before linking tenants and leases.")}` : empty("No property selected", "Choose a property to see its units.");
    root.querySelector("[data-unit-property-id]")?.setAttribute("value", selectedPropertyId || "");
    root.querySelectorAll("[data-property-id]").forEach((button) => button.addEventListener("click", () => {
      selectedPropertyId = button.dataset.propertyId;
      setState(selectedKey, selectedPropertyId);
      renderLists();
    }));
    enableTableSorting(root);
    hydrateIcons(root);
  };

  root.querySelector("[data-property-search]")?.addEventListener("input", renderLists);
  root.querySelector("[data-property-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    Object.assign(values, { landlord_id: context.landlordId || identity.profile.id, country_id: context.countryId || identity.profile.country_id });
    const { error } = await supabase.from("properties").insert(values);
    if (error) return showError(error);
    showToast("Property added.", "success");
    event.currentTarget.closest("dialog")?.close();
    renderPropertyWorkspace(root, true, context, identity);
  });
  root.querySelector("[data-unit-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.property_id = values.property_id || selectedPropertyId;
    if (!values.property_id) return showError(new Error("Choose a property first."), "Choose a property before adding a unit.");
    Object.assign(values, { landlord_id: context.landlordId || identity.profile.id, monthly_rent: Number(values.monthly_rent || 0), currency: values.currency.toUpperCase() });
    const { error } = await supabase.from("units").insert(values);
    if (error) return showError(error);
    showToast("Unit added.", "success");
    event.currentTarget.closest("dialog")?.close();
    renderPropertyWorkspace(root, true, context, identity);
  });
  renderLists();
}

function propertyDialog() {
  return `<dialog class="dialog" id="property-dialog"><form class="dialog-layout" data-property-form><div class="dialog-header"><h2>Add property</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><div class="form-grid"><div class="field"><label for="property-name">Property name</label><input id="property-name" name="name" required></div><div class="field"><label for="property-type">Property type</label><select id="property-type" name="property_type"><option>Apartment building</option><option>House</option><option>Commercial</option><option>Mixed use</option><option>Other</option></select></div><div class="field"><label for="property-address">Street address</label><input id="property-address" name="address_line_1" required></div><div class="field"><label for="property-city">City</label><input id="property-city" name="city" required></div><div class="field"><label for="property-postal">Postal code</label><input id="property-postal" name="postal_code"></div></div></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary">Save property</button></div></form></dialog>`;
}

function unitDialog() {
  return `<dialog class="dialog" id="unit-dialog"><form class="dialog-layout" data-unit-form><div class="dialog-header"><h2>Add unit</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><div class="form-grid"><input type="hidden" name="property_id" data-unit-property-id><div class="field"><label for="unit-name">Unit name</label><input id="unit-name" name="name" required></div><div class="field"><label for="unit-status">Occupancy</label><select id="unit-status" name="occupancy_status"><option value="vacant">Vacant</option><option value="occupied">Occupied</option><option value="unavailable">Unavailable</option></select></div><div class="field"><label for="unit-rent">Monthly rent</label><input id="unit-rent" name="monthly_rent" type="number" min="0" step="0.01" required></div><div class="field"><label for="unit-currency">Currency</label><input id="unit-currency" name="currency" maxlength="3" value="USD" required></div></div><p class="field-hint">Tenant assignment and lease creation stay separate so historical records remain clear.</p></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary">Save unit</button></div></form></dialog>`;
}

async function renderModule(view, root, quiet, context, identity) {
  const config = modules[view];
  if (!config) return;
  const options = await optionData(context);
  const allowCreate = canCreate(view, identity, context);
  if (!quiet || !root.querySelector("[data-record-panel]")) root.innerHTML = `${pageHeader(view, allowCreate, context)}<section class="panel" data-record-panel><div class="panel-header"><h2>All ${view}</h2><span class="status-chip">Current context</span></div><div class="panel-body">${skeletonLines(6)}</div></section>${allowCreate ? recordDialog(view, options) : ""}`;
  hydrateIcons(root); wireContext(root);
  root.querySelector("[data-record-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
    Object.keys(values).forEach((key) => { if (values[key] === "") values[key] = null; });
    values.landlord_id = context.landlordId || identity.profile.id;
    if (view === "properties") values.country_id = context.countryId || identity.profile.country_id;
    if (["payments","maintenance","inspections","tasks"].includes(view)) values[view === "tasks" ? "author_id" : view === "maintenance" ? "requested_by" : "created_by"] = identity.profile.id;
    if (view === "payments" && values.lease_id) { const lease = options.leases.find((x) => x.id === values.lease_id); values.tenant_id = lease?.tenant_id || null; }
    if (view === "payments" && values.payment_type === "rent" && !values.lease_id) { showError(new Error("Rent payments must be linked to a lease."), "Choose a lease for a rent payment."); return; }
    try { const { error } = await supabase.from(config.table).insert(values); if (error) throw error; event.currentTarget.closest("dialog").close(); showToast("Record saved.", "success"); await renderModule(view, root, true, context, identity); } catch (error) { showError(error); }
  });
  const body = root.querySelector("[data-record-panel] .panel-body");
  try { let query = supabase.from(config.table).select("*").order("created_at", { ascending: false }).limit(50); if (context.landlordId) query = query.eq("landlord_id", context.landlordId); const { data, error } = await query; if (error) throw error; body.innerHTML = data?.length ? tableMarkup(data, config.columns, view === "payments") : empty(`No ${view} yet`, "Use Add when you are ready to create the first record."); if (view === "payments") wireReceipts(body, data || []); } catch (error) { body.innerHTML = empty(`Could not load ${view}`, "Please try again."); showError(error); }
}

async function renderTenants(root, context, identity) {
  const allowRequest = identity.profile.role === "landlord" || context.permissions?.["tenants.create"] === true;
  root.innerHTML = `${pageHeader("tenants", identity.profile.role !== "tenant", context)}<section class="panel"><div class="panel-header"><h2>${identity.profile.role === "tenant" ? "Landlord requests" : "Tenant relationships"}</h2></div><div class="panel-body">${skeletonLines(5)}</div></section>${identity.profile.role !== "tenant" ? `<dialog class="dialog" id="record-dialog"><form class="dialog-layout" data-tenant-request><div class="dialog-header"><h2>Request tenant link</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><div class="field"><label for="tenant-email">Tenant account email</label><input id="tenant-email" name="email" type="email" required><p class="field-hint">The tenant decides whether to accept this relationship.</p></div></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary" type="submit">Send request</button></div></form></dialog>` : ""}`;
  if (!allowRequest) { root.querySelector('[data-dialog-open="record-dialog"]')?.remove(); root.querySelector("#record-dialog")?.remove(); }
  hydrateIcons(root); wireContext(root);
  root.querySelector("[data-tenant-request]")?.addEventListener("submit", async (event) => { event.preventDefault(); try { const email = new FormData(event.currentTarget).get("email"); const { error } = await supabase.rpc("request_tenant_link", { tenant_email: email, target_landlord: context.landlordId }); if (error) throw error; event.currentTarget.closest("dialog").close(); showToast("Tenant request sent.", "success"); renderTenants(root, context, identity); } catch (error) { showError(error); } });
  const filter = identity.profile.role === "tenant" ? supabase.from("tenant_links").select("id,status,requested_at,landlord_id,profiles!tenant_links_landlord_id_fkey(full_name)").eq("tenant_id", identity.profile.id) : supabase.from("tenant_links").select("id,status,requested_at,tenant_id,profiles!tenant_links_tenant_id_fkey(full_name)").eq("landlord_id", context.landlordId);
  const { data, error } = await filter.order("requested_at", { ascending: false }); const body = root.querySelector(".panel-body"); if (error) { showError(error); body.innerHTML = empty("Could not load tenant links", "Please try again."); return; }
  body.innerHTML = data?.length ? `<div class="record-list">${data.map((item) => `<article class="record-row"><div><strong>${escapeHtml(item.profiles?.full_name || "Mushavo user")}</strong><span>${formatDate(item.requested_at)} - ${escapeHtml(item.status)}</span></div>${identity.profile.role === "tenant" && item.status === "pending" ? `<div class="toolbar"><button class="btn btn-primary" data-link-decision="accepted" data-link-id="${item.id}">Accept</button><button class="btn btn-secondary" data-link-decision="rejected" data-link-id="${item.id}">Reject</button></div>` : `<span class="status-chip">${escapeHtml(item.status)}</span>`}</article>`).join("")}</div>` : empty("No tenant relationships", "Requests and accepted links will appear here.");
  body.querySelectorAll("[data-link-decision]").forEach((button) => button.addEventListener("click", async () => { try { const { error: rpcError } = await supabase.rpc("respond_tenant_link", { link_id: button.dataset.linkId, decision: button.dataset.linkDecision }); if (rpcError) throw rpcError; showToast(`Request ${button.dataset.linkDecision}.`, "success"); renderTenants(root, context, identity); } catch (rpcError) { showError(rpcError); } }));
}

async function renderFinance(root, context, identity) {
  root.innerHTML = `${pageHeader("finance", true, context)}<section class="dashboard-grid"><article class="panel kpi"><span class="kpi-label">Rent revenue</span><div class="kpi-value" data-rent-total>...</div></article><article class="panel kpi"><span class="kpi-label">Deposits held</span><div class="kpi-value" data-deposit-total>...</div></article><article class="panel kpi"><span class="kpi-label">Other income</span><div class="kpi-value" data-other-total>...</div></article><article class="panel kpi"><span class="kpi-label">Expenses</span><div class="kpi-value" data-expense-total>...</div></article><article class="panel panel-span-4"><div class="panel-header"><h2>Expenses</h2></div><div class="panel-body">${skeletonLines(5)}</div></article></section><dialog class="dialog" id="record-dialog"><form class="dialog-layout" data-expense-form><div class="dialog-header"><h2>Add expense</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><div class="form-grid">${[["category","Category","text",true],["description","Description","textarea"],["amount","Amount","number",true],["currency","Currency","select",true,["USD","ZAR","MYR"]],["incurred_on","Date","date",true]].map((f) => inputField(f, {})).join("")}</div></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary">Save expense</button></div></form></dialog>`;
  hydrateIcons(root); wireContext(root); const scope = (q) => context.landlordId ? q.eq("landlord_id", context.landlordId) : q;
  const [payments, expenses, balances] = await Promise.all([scope(supabase.from("payments").select("payment_type,amount,currency")), scope(supabase.from("expenses").select("*").is("archived_at", null).order("incurred_on", { ascending: false })), scope(supabase.from("lease_rent_balances").select("outstanding_rent,currency"))]);
  if (payments.error || expenses.error || balances.error) { showError(payments.error || expenses.error || balances.error); return; } const currency = payments.data?.[0]?.currency || expenses.data?.[0]?.currency || balances.data?.[0]?.currency || "USD";
  const sum = (type) => (payments.data || []).filter((p) => p.payment_type === type).reduce((n,p) => n + Number(p.amount), 0); root.querySelector("[data-rent-total]").textContent = formatCurrency(sum("rent"), currency); root.querySelector("[data-deposit-total]").textContent = formatCurrency(sum("deposit"), currency); root.querySelector("[data-other-total]").textContent = formatCurrency(sum("other") + sum("maintenance"), currency); root.querySelector("[data-expense-total]").textContent = formatCurrency((expenses.data || []).reduce((n,e) => n + Number(e.amount), 0), currency); root.querySelector(".panel-span-4 .panel-body").innerHTML = expenses.data?.length ? tableMarkup(expenses.data, ["incurred_on","category","description","amount","currency"]) : empty("No expenses yet", "Record costs without mixing them into rent payments.");
  const outstanding = (balances.data || []).reduce((total, item) => total + Number(item.outstanding_rent), 0); root.querySelector(".panel-span-4 .panel-header").insertAdjacentHTML("beforeend", `<span class="status-chip">Rent outstanding: ${escapeHtml(formatCurrency(outstanding, currency))}</span>`);
  root.querySelector("[data-expense-form]").addEventListener("submit", async (event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); Object.assign(values, { landlord_id: context.landlordId || identity.profile.id, created_by: identity.profile.id }); try { const { error } = await supabase.from("expenses").insert(values); if (error) throw error; showToast("Expense saved.", "success"); renderFinance(root, context, identity); } catch (error) { showError(error); } });
}

async function renderDocuments(root, context, identity) {
  root.innerHTML = `${pageHeader("documents", true, context)}<section class="panel"><div class="panel-header"><h2>Private documents</h2><span class="status-chip">Signed access only</span></div><div class="panel-body">${skeletonLines(5)}</div></section><dialog class="dialog" id="record-dialog"><form class="dialog-layout" data-document-form><div class="dialog-header"><h2>Upload document</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><div class="form-stack"><div class="field"><label for="document-category">Category</label><select id="document-category" name="category"><option>lease</option><option>receipt</option><option>inspection</option><option>identity</option><option>property</option><option>other</option></select></div><div class="field"><label for="document-file">File</label><input id="document-file" name="file" type="file" required></div></div></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary">Upload securely</button></div></form></dialog>`;
  hydrateIcons(root); wireContext(root); const query = context.landlordId ? supabase.from("documents").select("*").eq("landlord_id", context.landlordId).is("archived_at", null) : supabase.from("documents").select("*").is("archived_at", null); const { data, error } = await query.order("created_at", { ascending: false }); const body = root.querySelector(".panel-body"); if (error) { showError(error); return; } body.innerHTML = data?.length ? `<div class="record-list">${data.map((doc) => `<article class="record-row"><div><strong>${escapeHtml(doc.name)}</strong><span>${escapeHtml(doc.category)} - ${formatDate(doc.created_at)}</span></div><button class="btn btn-secondary" data-document-path="${escapeHtml(doc.storage_path)}">${icon("download")}Download</button></article>`).join("")}</div>` : empty("No private documents", "Uploaded files remain private and use time-limited download links."); hydrateIcons(body);
  body.querySelectorAll("[data-document-path]").forEach((button) => button.addEventListener("click", async () => { const { data: signed, error: signedError } = await supabase.storage.from("mushavo-private").createSignedUrl(button.dataset.documentPath, 60); if (signedError) return showError(signedError); window.open(signed.signedUrl, "_blank", "noopener"); }));
  root.querySelector("[data-document-form]").addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const file = form.get("file"); const path = `${identity.profile.id}/${crypto.randomUUID()}/${file.name}`; try { const { error: uploadError } = await supabase.storage.from("mushavo-private").upload(path, file, { upsert: false }); if (uploadError) throw uploadError; const { error: rowError } = await supabase.from("documents").insert({ landlord_id: context.landlordId || identity.profile.id, category: form.get("category"), name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size, uploaded_by: identity.profile.id }); if (rowError) { await supabase.storage.from("mushavo-private").remove([path]); throw rowError; } showToast("Document uploaded securely.", "success"); renderDocuments(root, context, identity); } catch (uploadError) { showError(uploadError); } });
}

async function renderStaff(root, context, identity) {
  const canInvite = identity.profile.role === "landlord";
  root.innerHTML = `${pageHeader("staff", canInvite, context)}<section class="panel"><div class="panel-header"><h2>Approved staff</h2></div><div class="panel-body">${skeletonLines(5)}</div></section>${canInvite ? `<dialog class="dialog" id="record-dialog"><form class="dialog-layout" data-staff-invite><div class="dialog-header"><h2>Invite staff member</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><div class="form-stack"><div class="field"><label for="staff-email">Email address</label><input id="staff-email" name="email" type="email" required></div><fieldset class="permission-fieldset"><legend>Permissions</legend>${["properties.view","units.view","maintenance.view","maintenance.edit","tasks.view"].map((permission) => `<label><input type="checkbox" name="permission" value="${permission}"> ${permission.replaceAll(".", " ")}</label>`).join("")}</fieldset></div></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary">Send 48-hour invite</button></div></form></dialog>` : ""}`;
  hydrateIcons(root); wireContext(root);
  const { data, error } = await supabase.from("staff_relationships").select("status,permissions,staff_id,profiles!staff_relationships_staff_id_fkey(full_name)").eq("landlord_id", context.landlordId).eq("status", "active");
  if (error) return showError(error);
  root.querySelector(".panel-body").innerHTML = data?.length ? `<div class="record-list">${data.map((item) => `<article class="record-row"><div><strong>${escapeHtml(item.profiles?.full_name || "Staff member")}</strong><span>Approved assignment - ${Object.keys(item.permissions || {}).length} permission settings</span></div><span class="status-chip">Active</span></article>`).join("")}</div>` : empty("No approved staff", "Staff invited and attached to this account will appear here.");
  root.querySelector("[data-staff-invite]")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const permissions = Object.fromEntries(form.getAll("permission").map((key) => [key, true])); try { const { data: inviteData, error: inviteError } = await supabase.functions.invoke("invite-user", { body: { email: form.get("email"), role: "staff", countryId: identity.profile.country_id, permissions } }); if (inviteError || inviteData?.error) throw inviteError || new Error(inviteData.error); event.currentTarget.closest("dialog").close(); showToast(inviteData.message, "success"); } catch (inviteError) { showError(inviteError); } });
}

function renderLandlords(root, context) {
  root.innerHTML = `${pageHeader("landlords", false, context)}<section class="panel"><div class="panel-header"><h2>Delegated accounts</h2></div><div class="panel-body">${context.landlords.length ? `<div class="record-list">${context.landlords.map((item) => `<button class="record-row record-button" data-select-landlord="${item.id}"><div><strong>${escapeHtml(item.name)}</strong><span>${item.id === context.landlordId ? "Current workspace" : "Open workspace"}</span></div>${item.id === context.landlordId ? '<span class="status-chip">Selected</span>' : icon("chevron-right")}</button>`).join("")}</div>` : empty("No delegated landlords", "Approved landlord relationships will appear here.")}</div></section>`; hydrateIcons(root); wireContext(root); root.querySelectorAll("[data-select-landlord]").forEach((button) => button.addEventListener("click", () => { setActiveLandlord(button.dataset.selectLandlord); location.hash = "dashboard"; }));
}

function tableMarkup(rows, columns, receipts = false) {
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${columns.map((key) => `<th>${escapeHtml(key.replaceAll("_", " "))}</th>`).join("")}${receipts ? "<th>Receipt</th>" : ""}</tr></thead><tbody>${rows.map((row, index) => `<tr>${columns.map((key) => `<td>${key.endsWith("_at") || key.endsWith("_on") ? formatDate(row[key]) : key === "amount" || key.endsWith("_rent") ? escapeHtml(row[key]) : escapeHtml(row[key] ?? "-")}</td>`).join("")}${receipts ? `<td><button class="icon-button" type="button" aria-label="Download receipt" title="Download receipt" data-receipt-index="${index}">${icon("download")}</button></td>` : ""}</tr>`).join("")}</tbody></table></div>`;
}

function wireReceipts(root, payments) {
  hydrateIcons(root);
  root.querySelectorAll("[data-receipt-index]").forEach((button) => button.addEventListener("click", async () => { button.disabled = true; try { await downloadPaymentReceipt(payments[Number(button.dataset.receiptIndex)]); } catch (error) { showError(error, "The receipt could not be generated."); } finally { button.disabled = false; } }));
}

function empty(title, text) { return `<div class="empty-state"><div><strong>${escapeHtml(title)}</strong>${escapeHtml(text)}</div></div>`; }
