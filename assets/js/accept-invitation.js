import { routeForRole } from "./auth.js";
import { friendlyError } from "./errors.js";
import { supabase } from "./supabaseClient.js";

const status = document.querySelector("[data-invitation-status]");
const action = document.querySelector("[data-invitation-action]");

async function complete() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Open the invitation link from your email to continue.");
  const { data: role, error } = await supabase.rpc("complete_invitation");
  if (error) throw error;
  status.textContent = "Invitation accepted. Opening your Mushavo workspace...";
  setTimeout(() => window.location.replace(routeForRole(role)), 900);
}

complete().catch((error) => {
  status.textContent = friendlyError(error, "This invitation is invalid, expired, or has already been used.");
  action.classList.remove("hidden");
});
