import { planStatusLabel, requireAuth } from "./auth.js";
import { renderAppLayout } from "./layout.js";
import { supabase } from "./supabaseClient.js";
import { escapeHtml, formatCurrency, formatDate, hydrateIcons, icon, showError, showToast, skeletonLines } from "./ui.js";

async function init() {
  const identity = await requireAuth();
  if (!identity) return;
  const page = document.body.dataset.page || "account";
  renderAppLayout(identity);
  const root = document.querySelector("[data-page-root]");
  if (page === "reports") await renderReports(root);
  if (page === "account") renderAccount(root, identity);
  if (page === "settings") await renderSettings(root, identity);
  hydrateIcons(root);
}

async function renderReports(root) {
  root.innerHTML = `<header class="page-header"><div><h1>Reports</h1><p>Operational and financial summaries with rent kept separate from deposits and other payments.</p></div><div class="toolbar"><button class="btn btn-secondary" type="button" data-export-csv>${icon("file-spreadsheet")}Export CSV</button><button class="btn btn-primary" type="button" data-print>${icon("file-down")}Save as PDF</button></div></header><section class="dashboard-grid"><article class="panel panel-span-2"><div class="panel-header"><h2>Payment purpose summary</h2></div><div class="panel-body">${skeletonLines(6)}</div></article><article class="panel panel-span-2"><div class="panel-header"><h2>Property operations</h2></div><div class="panel-body">${skeletonLines(6)}</div></article></section>`;
  try {
    const [payments, properties, units, maintenance] = await Promise.all([
      supabase.from("payments").select("payment_type,amount,currency,paid_at,reference").order("paid_at", { ascending: false }),
      supabase.from("properties").select("id", { count: "exact", head: true }).is("archived_at", null),
      supabase.from("units").select("id,occupancy_status"),
      supabase.from("maintenance_requests").select("id,status"),
    ]);
    if (payments.error || properties.error || units.error || maintenance.error) throw payments.error || properties.error || units.error || maintenance.error;
    const currency = payments.data?.[0]?.currency || "USD"; const totals = Object.groupBy ? Object.groupBy(payments.data || [], (row) => row.payment_type) : (payments.data || []).reduce((result,row) => ((result[row.payment_type] ||= []).push(row), result), {});
    root.querySelector(".panel-span-2 .panel-body").innerHTML = `<div class="record-list">${["rent","deposit","maintenance","other"].map((type) => `<div class="record-row"><div><strong>${type[0].toUpperCase() + type.slice(1)}</strong><span>${totals[type]?.length || 0} records</span></div><strong>${formatCurrency((totals[type] || []).reduce((sum,row) => sum + Number(row.amount), 0), currency)}</strong></div>`).join("")}</div>`;
    root.querySelectorAll(".panel-span-2")[1].querySelector(".panel-body").innerHTML = `<div class="record-list"><div class="record-row"><span>Active properties</span><strong>${properties.count || 0}</strong></div><div class="record-row"><span>Occupied units</span><strong>${(units.data || []).filter((row) => row.occupancy_status === "occupied").length}</strong></div><div class="record-row"><span>Open maintenance</span><strong>${(maintenance.data || []).filter((row) => !["completed","cancelled"].includes(row.status)).length}</strong></div></div>`;
    root.querySelector("[data-export-csv]").addEventListener("click", () => downloadCsv(payments.data || []));
    root.querySelector("[data-print]").addEventListener("click", () => window.print());
  } catch (error) { showError(error); }
}

function renderAccount(root, identity) {
  const profile = identity.profile || {};
  root.innerHTML = `<header class="page-header"><div><h1>Account</h1><p>Identity, subscription, and account status.</p></div></header><section class="dashboard-grid"><article class="panel panel-span-2"><div class="panel-header"><h2>Profile</h2></div><div class="panel-body"><form class="form-stack" data-profile-form><div class="field"><label for="full-name">Full name</label><input id="full-name" name="full_name" value="${escapeHtml(profile.full_name)}" required></div><div class="field"><label for="email">Email</label><input id="email" value="${escapeHtml(identity.user.email)}" readonly></div><button class="btn btn-primary" type="submit">Save changes</button></form></div></article><article class="panel panel-span-2"><div class="panel-header"><h2>Plan / Status</h2></div><div class="panel-body"><span class="status-chip"><span class="status-dot"></span>${escapeHtml(planStatusLabel(identity))}</span><p>Administrative suspension and subscription expiry are handled independently, so your plan and records remain intact.</p>${identity.subscription?.current_period_ends_at ? `<p class="field-hint">Current period ends ${formatDate(identity.subscription.current_period_ends_at)}.</p>` : ""}</div></article></section>`;
  root.querySelector("[data-profile-form]").addEventListener("submit", async (event) => { event.preventDefault(); const full_name = new FormData(event.currentTarget).get("full_name"); try { const { error } = await supabase.from("profiles").update({ full_name }).eq("id", profile.id); if (error) throw error; showToast("Profile updated.", "success"); } catch (error) { showError(error); } });
}

async function renderSettings(root, identity) {
  const { data, error } = await supabase.from("account_preferences").select("*").eq("profile_id", identity.profile.id).maybeSingle(); if (error) showError(error);
  const preferences = data || { default_currency: "USD", email_notifications: true, realtime_notifications: true };
  root.innerHTML = `<header class="page-header"><div><h1>Settings</h1><p>Control language, notifications, and workspace preferences.</p></div></header><section class="panel"><div class="panel-body"><form class="form-stack settings-form" data-settings-form><div class="field"><label for="currency">Default currency</label><select id="currency" name="default_currency">${["USD","ZAR","MYR"].map((code) => `<option${code === preferences.default_currency ? " selected" : ""}>${code}</option>`).join("")}</select></div><label class="toggle-row"><span><strong>Email notifications</strong><small>Receive account and workflow updates by email.</small></span><input type="checkbox" name="email_notifications"${preferences.email_notifications ? " checked" : ""}></label><label class="toggle-row"><span><strong>Realtime notifications</strong><small>Show relevant changes while you work.</small></span><input type="checkbox" name="realtime_notifications"${preferences.realtime_notifications ? " checked" : ""}></label><button class="btn btn-primary" type="submit">Save preferences</button></form></div></section>`;
  root.querySelector("[data-settings-form]").addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const values = { profile_id: identity.profile.id, default_currency: form.get("default_currency"), email_notifications: form.has("email_notifications"), realtime_notifications: form.has("realtime_notifications"), updated_at: new Date().toISOString() }; try { const { error: saveError } = await supabase.from("account_preferences").upsert(values); if (saveError) throw saveError; showToast("Preferences saved.", "success"); } catch (saveError) { showError(saveError); } });
}

function downloadCsv(rows) {
  const columns = ["payment_type","amount","currency","paid_at","reference"]; const csv = [columns.join(","), ...rows.map((row) => columns.map((key) => `"${String(row[key] ?? "").replaceAll('"','""')}"`).join(","))].join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = `mushavo-payments-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
}

init();
