import { getCurrentIdentity, routeForRole, sendPasswordReset, signIn, signUp, updatePassword } from "./auth.js";
import { friendlyError } from "./errors.js";
import { hydrateIcons } from "./ui.js";
import { supabase } from "./supabaseClient.js";
import { sitePath } from "./config.js";

hydrateIcons();
const form = document.querySelector("[data-auth-form]");
const message = document.querySelector("[data-form-message]");

function setMessage(text, kind = "error") {
  if (!message) return;
  message.textContent = text;
  message.dataset.kind = kind;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadCountries() {
  const select = document.querySelector("[data-country-select]");
  if (!select) return;
  const { data, error } = await supabase.from("countries").select("id,name,code").eq("is_active", true).order("name");
  if (error) {
    select.innerHTML = '<option value="">Countries are temporarily unavailable</option>';
    select.disabled = true;
    setMessage(friendlyError(error, "Countries could not be loaded. Please try again shortly."));
    return;
  }
  if (!data?.length) {
    select.innerHTML = '<option value="">Countries have not been added yet</option>';
    select.disabled = true;
    setMessage("Countries need to be added in Supabase before signup can continue.");
    return;
  }
  select.innerHTML = '<option value="">Choose a country</option>' + data.map((country) => `<option value="${escapeHtml(country.id)}">${escapeHtml(country.name)} (${escapeHtml(country.code)})</option>`).join("");
}

document.querySelectorAll("[data-password-toggle]").forEach((button) => button.addEventListener("click", () => {
  const input = document.getElementById(button.dataset.passwordToggle);
  if (!input) return;
  const reveal = input.type === "password";
  input.type = reveal ? "text" : "password";
  button.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
  button.innerHTML = `<i data-lucide="${reveal ? "eye-off" : "eye"}" aria-hidden="true"></i>`;
  hydrateIcons(button);
}));

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("[type=submit]");
  const values = Object.fromEntries(new FormData(form));
  submit.disabled = true;
  submit.textContent = { signup: "Creating account...", login: "Signing in...", forgot: "Sending link...", reset: "Updating password..." }[form.dataset.mode] || "Working...";
  try {
    if (form.dataset.mode === "signup") {
      if (values.password !== values.confirmPassword) throw new Error("Passwords do not match.");
      await signUp({ email: values.email, password: values.password, fullName: values.fullName, countryId: values.countryId || null, requestedRole: values.requestedRole });
      setMessage("Account created. Check your email to confirm your address.", "success");
      form.reset();
    } else if (form.dataset.mode === "login") {
      await signIn(values.email, values.password);
      const identity = await getCurrentIdentity();
      const next = new URLSearchParams(location.search).get("next");
      window.location.replace(next || routeForRole(identity?.profile?.role));
    } else if (form.dataset.mode === "forgot") {
      await sendPasswordReset(values.email);
      setMessage("Check your email for a secure password reset link.", "success");
      form.reset();
    } else if (form.dataset.mode === "reset") {
      if (values.password !== values.confirmPassword) throw new Error("Passwords do not match.");
      await updatePassword(values.password);
      setMessage("Password updated. You can now sign in.", "success");
      setTimeout(() => window.location.replace(sitePath("login.html")), 1200);
    }
  } catch (error) {
    setMessage(friendlyError(error, error.message));
  } finally {
    submit.disabled = false;
    submit.textContent = { signup: "Create account", login: "Sign in", forgot: "Send reset link", reset: "Update password" }[form.dataset.mode] || "Continue";
  }
});

const queryError = new URLSearchParams(location.search).get("error");
if (queryError) setMessage(queryError);
loadCountries();
