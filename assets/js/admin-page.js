import { requireAuth } from "./auth.js";
import { renderAdminLayout } from "./layout.js";
import { adminCanAccessCountry, adminCountryIds, isAdminPageAllowed, restrictRowsToAdminCountries } from "./role-state.js";
import { supabase } from "./supabaseClient.js";
import { enableTableSorting, escapeHtml, formatCurrency, formatDate, hydrateIcons, icon, showError, showToast, skeletonLines } from "./ui.js";

let identity;
let countries = [];
let selectedAdminCountry = "all";

const pageMeta = {
  dashboard: ["Admin dashboard", "Landlords, markets, enquiries, subscriptions, platform finance, and internal notes."],
  users: ["Users", "Invite managed roles and review active, pending, suspended, and archived accounts."],
  countries: ["Countries", "Control market availability, currency, and default language."],
  pricing: ["Pricing", "Publish country-specific plans and enforce the same limits used by account workflows."],
  subscriptions: ["Subscriptions", "Separate plan state, trial, expiry, and suspension from the underlying account."],
  enquiries: ["Enquiries", "Route public enquiries by country and keep follow-up status visible."],
  "platform-finance": ["Platform finance", "Record subscription payments and review platform revenue by market."],
  settings: ["Admin settings", "Operational controls that protect country scope, history, documents, and permissions."],
};

async function init() {
  identity = await requireAuth({ admin: true });
  if (!identity) return;
  const page = document.body.dataset.page || "dashboard";
  const safePage = isAdminPageAllowed(page, identity) ? page : "dashboard";
  renderAdminLayout(identity, safePage);
  const root = document.querySelector("[data-page-root]");
  root.innerHTML = skeletonPage(safePage);
  await loadCountries();
  await renderPage(root, safePage);
  hydrateIcons(root);
  enableTableSorting(root);
}

async function loadCountries() {
  const { data, error } = await supabase.from("countries").select("id,name,code,currency_code,locale,is_active").order("name");
  if (error) {
    countries = [];
    showError(error, "Countries could not be loaded.");
    return;
  }
  countries = identity.profile.role === "admin_staff" ? restrictRowsToAdminCountries(data || [], identity) : (data || []);
}

async function renderPage(root, page) {
  if (page === "dashboard") return renderDashboard(root);
  if (page === "users") return renderUsers(root);
  if (page === "countries") return renderCountries(root);
  if (page === "pricing") return renderPricing(root);
  if (page === "subscriptions") return renderSubscriptions(root);
  if (page === "enquiries") return renderEnquiries(root);
  if (page === "platform-finance") return renderPlatformFinance(root);
  return renderSettings(root);
}

function pageHeader(page, actions = "") {
  const [title, description] = pageMeta[page] || pageMeta.dashboard;
  const countryFilter = countries.length ? `<label class="context-select"><span>Country</span><select data-country-filter><option value="all"${selectedAdminCountry === "all" ? " selected" : ""}>All assigned</option>${countries.map((country) => `<option value="${country.id}"${selectedAdminCountry === country.id ? " selected" : ""}>${escapeHtml(country.name)}</option>`).join("")}</select></label>` : "";
  return `<header class="page-header"><div><h1>${title}</h1><p>${description}</p></div><div class="toolbar">${countryFilter}${actions}</div></header>`;
}

function skeletonPage(page) {
  return `${pageHeader(page)}<section class="panel"><div class="panel-body">${skeletonLines(8)}</div></section>`;
}

function selectedCountryId(root) {
  return root.querySelector("[data-country-filter]")?.value || selectedAdminCountry || "all";
}

function countryName(id) {
  return countries.find((country) => country.id === id)?.name || "Unassigned";
}

function countryCurrency(id) {
  return countries.find((country) => country.id === id)?.currency_code || "USD";
}

function scopeBySelectedCountry(rows, root, getCountryId = (row) => row.country_id) {
  const selected = selectedCountryId(root);
  if (selected === "all") return rows;
  return rows.filter((row) => getCountryId(row) === selected);
}

function wireCountryFilter(root, page) {
  root.querySelector("[data-country-filter]")?.addEventListener("change", (event) => {
    selectedAdminCountry = event.target.value;
    renderPage(root, page);
  });
}

async function renderDashboard(root) {
  root.innerHTML = `${pageHeader("dashboard", `<button class="btn btn-primary" data-dialog-open="note-dialog">${icon("plus")}Add note</button>`)}<section class="dashboard-grid">${["Landlords","Managed markets","Open enquiries","Platform revenue"].map((label) => `<article class="panel kpi"><span class="kpi-label">${label}</span><div class="kpi-value skeleton" style="height:36px;width:55%;margin-top:12px"></div></article>`).join("")}<article class="panel panel-span-2"><div class="panel-header"><h2>Internal notes</h2></div><div class="panel-body">${skeletonLines(6)}</div></article><article class="panel panel-span-2"><div class="panel-header"><h2>Recent enquiries</h2></div><div class="panel-body">${skeletonLines(6)}</div></article></section>${noteDialog()}`;
  hydrateIcons(root);
  wireCountryFilter(root, "dashboard");
  const [profiles, enquiries, payments, notes] = await Promise.all([
    supabase.from("profiles").select("id,role,country_id,account_status,archived_at"),
    supabase.from("enquiries").select("id,name,email,country_id,enquiry_type,status,created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("platform_payments").select("amount,currency,country_id"),
    supabase.from("admin_notes").select("id,title,body,country_id,due_at,completed_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const failed = [profiles, enquiries, payments, notes].find((result) => result.error);
  if (failed) return showError(failed.error);
  const scopedProfiles = scopeBySelectedCountry(restrictRowsToAdminCountries(profiles.data || [], identity), root);
  const scopedEnquiries = scopeBySelectedCountry(restrictRowsToAdminCountries(enquiries.data || [], identity), root);
  const scopedPayments = scopeBySelectedCountry(restrictRowsToAdminCountries(payments.data || [], identity), root);
  const revenue = scopedPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  [scopedProfiles.filter((row) => row.role === "landlord" && !row.archived_at).length, countries.filter((row) => row.is_active).length, scopedEnquiries.filter((row) => ["new","assigned"].includes(row.status)).length, formatCurrency(revenue, scopedPayments[0]?.currency || "USD")].forEach((value, index) => {
    const node = root.querySelectorAll(".kpi-value")[index];
    node.className = "kpi-value";
    node.textContent = value;
  });
  root.querySelector(".panel-span-2 .panel-body").innerHTML = notes.data?.length ? recordList(notes.data, (note) => `<article class="record-row"><div><strong>${escapeHtml(note.title)}</strong><span>${escapeHtml(note.body || "No details")}${note.due_at ? ` - Due ${formatDate(note.due_at)}` : ""}</span></div><button class="btn ${note.completed_at ? "btn-secondary" : "btn-primary"}" data-note-id="${note.id}" data-note-complete="${note.completed_at ? "false" : "true"}">${note.completed_at ? "Reopen" : "Mark done"}</button></article>`) : empty("No internal notes", "Create personal or assigned notes for operating follow-up.");
  root.querySelectorAll("[data-note-id]").forEach((button) => button.addEventListener("click", async () => {
    const completed_at = button.dataset.noteComplete === "true" ? new Date().toISOString() : null;
    const { error } = await supabase.from("admin_notes").update({ completed_at }).eq("id", button.dataset.noteId);
    if (error) return showError(error);
    renderDashboard(root);
  }));
  root.querySelectorAll(".panel-span-2")[1].querySelector(".panel-body").innerHTML = scopedEnquiries.length ? recordList(scopedEnquiries, (enquiry) => `<article class="record-row"><div><strong>${escapeHtml(enquiry.name)}</strong><span>${escapeHtml(enquiry.enquiry_type)} - ${escapeHtml(countryName(enquiry.country_id))} - ${formatDate(enquiry.created_at)}</span></div><span class="status-chip">${escapeHtml(enquiry.status)}</span></article>`) : empty("No open enquiries", "New public enquiries will appear here.");
  wireNoteForm(root);
}

function noteDialog() {
  return `<dialog class="dialog" id="note-dialog"><form class="dialog-layout" data-note-form><div class="dialog-header"><h2>Add internal note</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><div class="form-grid"><div class="field"><label for="note-title">Title</label><input id="note-title" name="title" required></div><div class="field"><label for="note-assignee">Assignee profile ID</label><input id="note-assignee" name="assignee_id" placeholder="Defaults to you"></div><div class="field"><label for="note-country">Country</label><select id="note-country" name="country_id"><option value="">All / personal</option>${countries.map((country) => `<option value="${country.id}">${escapeHtml(country.name)}</option>`).join("")}</select></div><div class="field"><label for="note-due">Due</label><input id="note-due" name="due_at" type="datetime-local"></div><div class="field"><label for="note-body">Details</label><textarea id="note-body" name="body"></textarea></div></div></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary">Create note</button></div></form></dialog>`;
}

function wireNoteForm(root) {
  root.querySelector("[data-note-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.country_id && !adminCanAccessCountry(identity, values.country_id)) return showError(new Error("Country not assigned."), "You can only create notes for assigned countries.");
    Object.assign(values, { author_id: identity.profile.id, assignee_id: values.assignee_id || identity.profile.id, country_id: values.country_id || null, due_at: values.due_at || null });
    const { error } = await supabase.from("admin_notes").insert(values);
    if (error) return showError(error);
    showToast("Note created.", "success");
    event.currentTarget.closest("dialog")?.close();
    renderDashboard(root);
  });
}

async function renderUsers(root) {
  root.innerHTML = `${pageHeader("users", `<label class="context-select"><span>Role</span><select data-role-filter><option value="all">All roles</option><option value="landlord">Landlords</option><option value="tenant">Tenants</option><option value="ipm">IPM</option><option value="pmc">PMC</option><option value="staff">Staff</option><option value="admin_staff">Admin staff</option></select></label><input class="toolbar-search" data-user-search placeholder="Search users"><button class="btn btn-primary" data-dialog-open="user-dialog">${icon("plus")}Invite managed user</button>`)}<section class="panel"><div class="panel-header"><h2>Accepted accounts</h2><span class="status-chip">History preserved</span></div><div class="panel-body">${skeletonLines(8)}</div></section>${userDialog()}`;
  hydrateIcons(root);
  wireCountryFilter(root, "users");
  const { data, error } = await supabase.from("profiles").select("id,full_name,role,country_id,account_status,suspended_at,archived_at,created_at").order("created_at", { ascending: false }).limit(200);
  if (error) return showError(error);
  const render = () => {
    let rows = scopeBySelectedCountry(restrictRowsToAdminCountries(data || [], identity), root);
    const role = root.querySelector("[data-role-filter]").value;
    const search = root.querySelector("[data-user-search]").value.toLowerCase();
    if (role !== "all") rows = rows.filter((row) => row.role === role);
    if (search) rows = rows.filter((row) => [row.full_name, row.role, row.account_status, countryName(row.country_id)].some((value) => String(value || "").toLowerCase().includes(search)));
    root.querySelector(".panel-body").innerHTML = rows.length ? dataTable(rows, ["full_name","role","country","plan_status","created_at"], userActions) : empty("No matching users", "Change the filters or invite a managed role.");
    hydrateIcons(root);
    enableTableSorting(root);
    wireUserActions(root);
  };
  root.querySelector("[data-role-filter]").addEventListener("change", render);
  root.querySelector("[data-user-search]").addEventListener("input", render);
  wireInviteUser(root);
  render();
}

function userDialog() {
  return `<dialog class="dialog" id="user-dialog"><form class="dialog-layout" data-user-invite-form><div class="dialog-header"><h2>Invite managed user</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><div class="form-grid"><div class="field"><label for="invite-email">Email address</label><input id="invite-email" name="email" type="email" required></div><div class="field"><label for="invite-role">Role</label><select id="invite-role" name="role" required><option value="admin_staff">Admin staff</option><option value="ipm">IPM</option><option value="pmc">PMC</option></select></div><div class="field"><label for="invite-country">Country</label><select id="invite-country" name="country_id" required>${countries.map((country) => `<option value="${country.id}">${escapeHtml(country.name)}</option>`).join("")}</select></div></div><p class="field-hint">Landlords and tenants can sign up directly. Managed roles join through secure invitations.</p></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary">Send invite</button></div></form></dialog>`;
}

function wireInviteUser(root) {
  root.querySelector("[data-user-invite-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!adminCanAccessCountry(identity, values.country_id)) return showError(new Error("Country not assigned."), "You can only invite users for assigned countries.");
    const { data, error } = await supabase.functions.invoke("invite-user", { body: { email: values.email, role: values.role, countryId: values.country_id } });
    if (error || data?.error) return showError(error || new Error(data.error));
    showToast(data.message || "Invitation created.", "success");
    event.currentTarget.closest("dialog")?.close();
  });
}

function wireUserActions(root) {
  root.querySelectorAll("[data-user-action]").forEach((button) => button.addEventListener("click", async () => {
    const action = button.dataset.userAction;
    const updates = action === "suspend"
      ? { account_status: "suspended", suspended_at: new Date().toISOString(), suspension_reason: "Suspended by admin" }
      : action === "restore"
        ? { account_status: "active", suspended_at: null, suspension_reason: null }
        : { account_status: "archived", archived_at: new Date().toISOString(), suspended_at: null, suspension_reason: null };
    const { error } = await supabase.from("profiles").update(updates).eq("id", button.dataset.id);
    if (error) return showError(error);
    showToast("Account status updated.", "success");
    renderUsers(root);
  }));
}

function userActions(row) {
  return `<div class="table-actions">${row.account_status === "suspended" ? `<button class="btn btn-secondary" data-user-action="restore" data-id="${row.id}">Restore</button>` : `<button class="btn btn-secondary" data-user-action="suspend" data-id="${row.id}">Suspend</button>`}<button class="icon-button" type="button" aria-label="Archive user" title="Archive user" data-user-action="archive" data-id="${row.id}">${icon("archive")}</button></div>`;
}

async function renderCountries(root) {
  root.innerHTML = `${pageHeader("countries", identity.profile.role === "super_admin" ? `<button class="btn btn-primary" data-dialog-open="country-dialog">${icon("plus")}Add country</button>` : "")}<section class="panel"><div class="panel-header"><h2>Markets</h2><span class="status-chip">${countries.length} available</span></div><div class="panel-body">${dataTable(countries, ["name","code","currency_code","locale","is_active"])}</div></section>${countryDialog()}`;
  hydrateIcons(root);
  enableTableSorting(root);
  root.querySelector("[data-country-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.code = values.code.toUpperCase();
    values.currency_code = values.currency_code.toUpperCase();
    values.is_active = true;
    const { error } = await supabase.from("countries").insert(values);
    if (error) return showError(error);
    showToast("Country added.", "success");
    event.currentTarget.closest("dialog")?.close();
    await loadCountries();
    renderCountries(root);
  });
}

function countryDialog() {
  return `<dialog class="dialog" id="country-dialog"><form class="dialog-layout" data-country-form><div class="dialog-header"><h2>Add country</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><div class="form-grid"><div class="field"><label>Name</label><input name="name" required></div><div class="field"><label>ISO code</label><input name="code" maxlength="2" required></div><div class="field"><label>Currency code</label><input name="currency_code" maxlength="3" required></div><div class="field"><label>Default language</label><select name="locale"><option value="en">English</option><option value="ms">Bahasa Melayu</option><option value="zh">Chinese</option></select></div></div></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary">Add country</button></div></form></dialog>`;
}

async function renderPricing(root) {
  root.innerHTML = `${pageHeader("pricing", `<label class="context-select"><span>Type</span><select data-account-type-filter><option value="all">All types</option><option value="landlord">Landlord</option><option value="ipm">IPM</option><option value="pmc">PMC</option></select></label><button class="btn btn-primary" data-dialog-open="pricing-dialog">${icon("plus")}Add plan</button>`)}<section class="panel"><div class="panel-header"><h2>Published plans</h2><span class="status-chip">Admin controlled</span></div><div class="panel-body">${skeletonLines(8)}</div></section>${pricingDialog()}`;
  hydrateIcons(root);
  wireCountryFilter(root, "pricing");
  const { data, error } = await supabase.from("pricing_plans").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return showError(error);
  const render = () => {
    let rows = scopeBySelectedCountry(restrictRowsToAdminCountries(data || [], identity), root);
    const type = root.querySelector("[data-account-type-filter]").value;
    if (type !== "all") rows = rows.filter((row) => row.account_type === type);
    root.querySelector(".panel-body").innerHTML = rows.length ? dataTable(rows, ["name","account_type","country","monthly_price","yearly_price","currency_code","limits","is_public"]) : empty("No plans published", "Create country-specific landlord, IPM, and PMC plans.");
    enableTableSorting(root);
  };
  root.querySelector("[data-account-type-filter]").addEventListener("change", render);
  root.querySelector("[data-pricing-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!adminCanAccessCountry(identity, values.country_id)) return showError(new Error("Country not assigned."), "You can only create plans for assigned countries.");
    const limits = {
      properties: Number(values.properties_limit || 0),
      units: Number(values.units_limit || 0),
      staff: Number(values.staff_limit || 0),
      landlords: Number(values.landlord_limit || 0),
    };
    const payload = {
      country_id: values.country_id,
      account_type: values.account_type,
      name: values.name,
      monthly_price: Number(values.monthly_price || 0),
      yearly_price: Number(values.yearly_price || 0),
      currency_code: values.currency_code.toUpperCase(),
      limits,
      is_public: values.is_public === "on",
      is_active: true,
    };
    const { error: insertError } = await supabase.from("pricing_plans").insert(payload);
    if (insertError) return showError(insertError);
    showToast("Plan created.", "success");
    event.currentTarget.closest("dialog")?.close();
    renderPricing(root);
  });
  render();
}

function pricingDialog() {
  return `<dialog class="dialog" id="pricing-dialog"><form class="dialog-layout" data-pricing-form><div class="dialog-header"><h2>Add pricing plan</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><div class="form-grid"><div class="field"><label>Country</label><select name="country_id" required>${countries.map((country) => `<option value="${country.id}">${escapeHtml(country.name)}</option>`).join("")}</select></div><div class="field"><label>Account type</label><select name="account_type"><option value="landlord">Landlord</option><option value="ipm">IPM</option><option value="pmc">PMC</option></select></div><div class="field"><label>Plan name</label><input name="name" required></div><div class="field"><label>Currency code</label><input name="currency_code" maxlength="3" value="${escapeHtml(countries[0]?.currency_code || "USD")}" required></div><div class="field"><label>Monthly price</label><input name="monthly_price" type="number" min="0" step="0.01" required></div><div class="field"><label>Yearly price</label><input name="yearly_price" type="number" min="0" step="0.01" required></div><div class="field"><label>Property limit</label><input name="properties_limit" type="number" min="0"></div><div class="field"><label>Unit limit</label><input name="units_limit" type="number" min="0"></div><div class="field"><label>Staff limit</label><input name="staff_limit" type="number" min="0"></div><div class="field"><label>Landlord connection limit</label><input name="landlord_limit" type="number" min="0"></div><label class="toggle-row"><span><strong>Show publicly</strong><small>Published plans appear on the pricing page.</small></span><input name="is_public" type="checkbox" checked></label></div></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancel</button><button class="btn btn-primary">Create plan</button></div></form></dialog>`;
}

async function renderSubscriptions(root) {
  root.innerHTML = `${pageHeader("subscriptions", `<input class="toolbar-search" data-subscription-search placeholder="Search profile or status">`)}<section class="panel"><div class="panel-header"><h2>Plan / status</h2><span class="status-chip">Expiry separate from suspension</span></div><div class="panel-body">${skeletonLines(8)}</div></section>`;
  wireCountryFilter(root, "subscriptions");
  const { data, error } = await supabase.from("subscriptions").select("id,status,trial_ends_at,current_period_ends_at,created_at,profiles!subscriptions_profile_id_fkey(id,full_name,role,country_id,account_status),pricing_plans(name,currency_code)").order("created_at", { ascending: false }).limit(200);
  if (error) return showError(error);
  const render = () => {
    let rows = restrictRowsToAdminCountries(data || [], identity, (row) => row.profiles?.country_id);
    rows = scopeBySelectedCountry(rows, root, (row) => row.profiles?.country_id);
    const search = root.querySelector("[data-subscription-search]").value.toLowerCase();
    if (search) rows = rows.filter((row) => [row.profiles?.full_name, row.status, row.pricing_plans?.name, row.profiles?.account_status].some((value) => String(value || "").toLowerCase().includes(search)));
    root.querySelector(".panel-body").innerHTML = rows.length ? dataTable(rows.map((row) => ({ ...row, profile: row.profiles?.full_name, role: row.profiles?.role, country: countryName(row.profiles?.country_id), plan_status: `${row.pricing_plans?.name || "Free"} - ${expired(row) ? "Expired" : row.status}` })), ["profile","role","country","plan_status","trial_ends_at","current_period_ends_at"]) : empty("No subscriptions", "Landlord, IPM, and PMC plan records will appear here.");
    enableTableSorting(root);
  };
  root.querySelector("[data-subscription-search]").addEventListener("input", render);
  render();
}

async function renderEnquiries(root) {
  root.innerHTML = `${pageHeader("enquiries", `<label class="context-select"><span>Status</span><select data-status-filter><option value="all">All statuses</option><option value="new">New</option><option value="assigned">Assigned</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label><input class="toolbar-search" data-enquiry-search placeholder="Search enquiries">`)}<section class="panel"><div class="panel-header"><h2>Public enquiries</h2><span class="status-chip">Country routed</span></div><div class="panel-body">${skeletonLines(8)}</div></section>`;
  hydrateIcons(root);
  wireCountryFilter(root, "enquiries");
  const { data, error } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return showError(error);
  const render = () => {
    let rows = scopeBySelectedCountry(restrictRowsToAdminCountries(data || [], identity), root);
    const status = root.querySelector("[data-status-filter]").value;
    const search = root.querySelector("[data-enquiry-search]").value.toLowerCase();
    if (status !== "all") rows = rows.filter((row) => row.status === status);
    if (search) rows = rows.filter((row) => [row.name, row.email, row.message, row.enquiry_type, row.account_type, countryName(row.country_id)].some((value) => String(value || "").toLowerCase().includes(search)));
    root.querySelector(".panel-body").innerHTML = rows.length ? dataTable(rows, ["name","email","country","enquiry_type","account_type","status","created_at"], enquiryActions) : empty("No enquiries", "Contact page submissions will appear here.");
    hydrateIcons(root);
    enableTableSorting(root);
    root.querySelectorAll("[data-enquiry-status]").forEach((select) => select.addEventListener("change", async () => {
      const { error: updateError } = await supabase.from("enquiries").update({ status: select.value }).eq("id", select.dataset.id);
      if (updateError) return showError(updateError);
      showToast("Enquiry updated.", "success");
    }));
  };
  root.querySelector("[data-status-filter]").addEventListener("change", render);
  root.querySelector("[data-enquiry-search]").addEventListener("input", render);
  render();
}

function enquiryActions(row) {
  return `<select data-enquiry-status data-id="${row.id}" aria-label="Enquiry status">${["new","assigned","resolved","closed"].map((status) => `<option value="${status}"${status === row.status ? " selected" : ""}>${status}</option>`).join("")}</select>`;
}

async function renderPlatformFinance(root) {
  root.innerHTML = `${pageHeader("platform-finance", `<button class="btn btn-primary" data-dialog-open="finance-dialog">${icon("plus")}Record payment</button>`)}<section class="dashboard-grid"><article class="panel kpi"><span class="kpi-label">Revenue</span><div class="kpi-value" data-revenue>...</div></article><article class="panel kpi"><span class="kpi-label">Payments</span><div class="kpi-value" data-count>...</div></article><article class="panel panel-span-4"><div class="panel-header"><h2>Payment records</h2></div><div class="panel-body">${skeletonLines(8)}</div></article></section>${financeDialog()}`;
  hydrateIcons(root);
  wireCountryFilter(root, "platform-finance");
  const { data, error } = await supabase.from("platform_payments").select("*").order("paid_at", { ascending: false }).limit(200);
  if (error) return showError(error);
  const rows = scopeBySelectedCountry(restrictRowsToAdminCountries(data || [], identity), root);
  const currency = rows[0]?.currency || countryCurrency(selectedCountryId(root));
  root.querySelector("[data-revenue]").textContent = formatCurrency(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0), currency);
  root.querySelector("[data-count]").textContent = rows.length;
  root.querySelector(".panel-span-4 .panel-body").innerHTML = rows.length ? dataTable(rows, ["paid_at","country","amount","currency","provider_reference","notes"]) : empty("No platform payments", "Record subscription payments by market.");
  enableTableSorting(root);
}

function financeDialog() {
  return `<dialog class="dialog" id="finance-dialog"><form class="dialog-layout"><div class="dialog-header"><h2>Record payment</h2><button class="icon-button" type="button" data-dialog-close aria-label="Close">${icon("x")}</button></div><div class="dialog-content"><p class="field-hint">Detailed payment recording needs the subscriber profile ID from the user page. This keeps historical records attached to the correct account.</p></div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Close</button></div></form></dialog>`;
}

function renderSettings(root) {
  root.innerHTML = `${pageHeader("settings")}<section class="panel"><div class="panel-header"><h2>Enforced controls</h2></div><div class="panel-body"><div class="record-list">${[
    ["Country access", identity.profile.role === "admin_staff" ? `Assigned countries: ${adminCountryIds(identity).map(countryName).join(", ") || "none"}` : "Super admin can operate every market."],
    ["Historical retention", "Archive and relationship-ending flows remove visibility without deleting finance, lease, receipt, or maintenance history."],
    ["Separate status", "Suspended accounts and expired subscriptions remain different business states."],
    ["Pricing source", "Public pricing comes from admin-managed pricing_plans, not hard-coded page values."],
  ].map(([title, text]) => `<article class="record-row"><div><strong>${title}</strong><span>${escapeHtml(text)}</span></div><span class="status-chip">Active</span></article>`).join("")}</div></div></section>`;
}

function dataTable(rows, columns, actions) {
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${columns.map((column) => `<th>${escapeHtml(column.replaceAll("_", " "))}</th>`).join("")}${actions ? "<th>Actions</th>" : ""}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td>${formatCell(row, column)}</td>`).join("")}${actions ? `<td>${actions(row)}</td>` : ""}</tr>`).join("")}</tbody></table></div>`;
}

function formatCell(row, key) {
  const value = key === "country" ? countryName(row.country_id) : key === "plan_status" ? planStatus(row) : row[key];
  if (value == null || value === "") return "-";
  if (key.endsWith("_at") || key.endsWith("_on")) return formatDate(value);
  if (key.includes("price") || key === "amount") return escapeHtml(formatCurrency(value, row.currency_code || row.currency || countryCurrency(row.country_id)));
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return escapeHtml(Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(", "));
  return escapeHtml(value);
}

function planStatus(row) {
  const status = row.account_status || row.status || "active";
  return `${row.name || row.pricing_plans?.name || "Free"} - ${String(status).replaceAll("_", " ")}`;
}

function expired(row) {
  const end = row.status === "trial" ? row.trial_ends_at : row.current_period_ends_at;
  return Boolean(end && new Date(end).getTime() < Date.now());
}

function recordList(rows, render) {
  return `<div class="record-list">${rows.map(render).join("")}</div>`;
}

function empty(title, text) {
  return `<div class="empty-state"><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div></div>`;
}

init();
