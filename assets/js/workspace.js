import { getState, setState } from "./state.js";
import { supabase } from "./supabaseClient.js";

export async function getWorkspaceContext(identity) {
  const role = identity.profile?.role;
  if (role === "landlord") return { landlordId: identity.profile.id, landlords: [], permissions: { "*": true } };
  let request;
  if (role === "tenant") {
    request = supabase.from("tenant_links").select("landlord_id,profiles!tenant_links_landlord_id_fkey(full_name,country_id)").eq("tenant_id", identity.profile.id).eq("status", "accepted");
  } else if (role === "staff") {
    request = supabase.from("staff_relationships").select("landlord_id,permissions,profiles!staff_relationships_landlord_id_fkey(full_name,country_id)").eq("staff_id", identity.profile.id).eq("status", "active");
  } else {
    request = supabase.from("management_relationships").select("landlord_id,permissions,profiles!management_relationships_landlord_id_fkey(full_name,country_id)").eq("manager_id", identity.profile.id).eq("status", "active");
  }
  const { data, error } = await request;
  if (error) throw error;
  const landlords = (data || []).map((row) => ({ id: row.landlord_id, name: row.profiles?.full_name || "Landlord", countryId: row.profiles?.country_id || null, permissions: row.permissions || {} }));
  const saved = getState("activeLandlordId");
  const landlordId = landlords.some((item) => item.id === saved) ? saved : landlords[0]?.id || null;
  if (landlordId !== saved) setState("activeLandlordId", landlordId);
  const selected = landlords.find((item) => item.id === landlordId);
  return { landlordId, landlords, countryId: selected?.countryId || null, permissions: selected?.permissions || {} };
}

export function setActiveLandlord(id) {
  return setState("activeLandlordId", id);
}
