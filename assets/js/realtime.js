import { supabase } from "./supabaseClient.js";

const tableViews = Object.freeze({
  properties: ["dashboard", "properties", "units"],
  units: ["dashboard", "properties", "units"],
  tenant_links: ["dashboard", "tenants", "notifications"],
  leases: ["dashboard", "leases", "tenants", "reports"],
  payments: ["dashboard", "payments", "finance", "reports"],
  maintenance_requests: ["dashboard", "maintenance"],
  subscriptions: ["account", "dashboard"],
  notifications: ["notifications"],
  expenses: ["dashboard", "finance", "reports"],
  inspections: ["dashboard", "inspections"],
  documents: ["documents"],
  workspace_tasks: ["dashboard", "tasks"],
  staff_relationships: ["staff", "maintenance"],
  admin_notes: ["dashboard", "tasks"],
});

let activeChannel;

export function startRealtime({ profileId, getCurrentView, refreshView }) {
  stopRealtime();
  activeChannel = supabase.channel(`mushavo:${profileId}`);

  Object.keys(tableViews).forEach((table) => {
    activeChannel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
      const view = getCurrentView();
      if (!tableViews[table].includes(view)) return;
      refreshView(view, { quiet: true, source: "realtime", table, payload });
    });
  });

  activeChannel.subscribe();
  return activeChannel;
}

export function stopRealtime() {
  if (activeChannel) supabase.removeChannel(activeChannel);
  activeChannel = null;
}
