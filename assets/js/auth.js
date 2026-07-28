import { APP_CONFIG, sitePath } from "./config.js";
import { friendlyError } from "./errors.js";
import { setStateIdentity } from "./state.js";
import { supabase } from "./supabaseClient.js";

export async function getCurrentIdentity() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, country_id, account_status, suspended_at, preferred_locale")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) throw error;
  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id,status,trial_ends_at,current_period_ends_at,pricing_plans(name,currency_code)")
    .eq("profile_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;
  const identity = { user: session.user, profile, subscription };
  setStateIdentity(profile?.id || session.user.id, profile?.role || "unknown");
  return identity;
}

export async function requireAuth({ admin = false } = {}) {
  try {
    const identity = await getCurrentIdentity();
    if (!identity) {
      window.location.replace(`${APP_CONFIG.loginPath}?next=${encodeURIComponent(location.pathname + location.hash)}`);
      return null;
    }

    const status = identity.profile?.account_status;
    if (identity.profile?.suspended_at || status === "suspended") {
      window.location.replace(sitePath("account-suspended.html"));
      return null;
    }

    if (hasExpiredSubscription(identity) && !["tenant", "staff", "super_admin", "admin_staff"].includes(identity.profile?.role)) {
      window.location.replace(sitePath("subscription-expired.html"));
      return null;
    }

    const isAdmin = ["super_admin", "admin_staff"].includes(identity.profile?.role);
    if (admin && !isAdmin) {
      window.location.replace(APP_CONFIG.appPath);
      return null;
    }
    return identity;
  } catch (error) {
    console.error("Auth guard failed", error);
    window.location.replace(`${APP_CONFIG.loginPath}?error=${encodeURIComponent(friendlyError(error))}`);
    return null;
  }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp({ email, password, fullName, countryId, requestedRole }) {
  if (!["landlord", "tenant"].includes(requestedRole)) throw new Error("This account type is available by invitation only.");
  if (!countryId) throw new Error("Choose your country to continue.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, country_id: countryId, requested_role: requestedRole },
      emailRedirectTo: `${location.origin}${APP_CONFIG.loginPath}`,
    },
  });
  if (error) throw error;
  return data;
}

export function hasExpiredSubscription(identity) {
  const subscription = identity?.subscription;
  if (!subscription) return false;
  if (["expired", "cancelled"].includes(subscription.status)) return true;
  const end = subscription.status === "trial" ? subscription.trial_ends_at : subscription.current_period_ends_at;
  return Boolean(end && new Date(end).getTime() < Date.now());
}

export function planStatusLabel(identity) {
  if (["super_admin", "admin_staff"].includes(identity?.profile?.role)) return "Platform - Active";
  if (["tenant", "staff"].includes(identity?.profile?.role)) return "Account - Active";
  const plan = identity?.subscription?.pricing_plans?.name || "Free";
  const status = hasExpiredSubscription(identity) ? "Expired" : (identity?.subscription?.status || identity?.profile?.account_status || "active");
  return `${plan} - ${status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}`;
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${sitePath("reset-password.html")}` });
  if (error) throw error;
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut({ scope: "local" });
  window.location.replace(APP_CONFIG.loginPath);
}

export function routeForRole(role) {
  return ["super_admin", "admin_staff"].includes(role) ? APP_CONFIG.adminPath : APP_CONFIG.appPath;
}
