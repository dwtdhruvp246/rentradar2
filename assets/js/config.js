export const SUPABASE_URL = "https://rmbvgtaadkvbsasbvdmb.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYnZndGFhZGt2YnNhc2J2ZG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTQ1NjIsImV4cCI6MjA5ODIzMDU2Mn0.kMhXDI85TVAsw_Mb-PO5iaSHipG3vLFmM7DF3TUnf00";

const PROJECT_BASE_URL = new URL("../../", import.meta.url);

export function sitePath(path = "") {
  const url = new URL(String(path).replace(/^\/+/, ""), PROJECT_BASE_URL);
  return `${url.pathname}${url.search}${url.hash}`;
}

export const APP_CONFIG = Object.freeze({
  name: "Mushavo",
  statePrefix: "mushavo:v2",
  defaultLocale: "en",
  supportedLocales: ["en", "ms", "zh"],
  loginPath: sitePath("login.html"),
  appPath: sitePath("app/index.html"),
  adminPath: sitePath("admin/index.html"),
});
