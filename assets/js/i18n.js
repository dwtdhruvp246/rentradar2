import { APP_CONFIG } from "./config.js";

const dictionary = {
  en: { dashboard: "Dashboard", properties: "Properties", tenants: "Tenants", payments: "Payments", maintenance: "Maintenance", reports: "Reports", account: "Account", settings: "Settings", signOut: "Sign out" },
  ms: { dashboard: "Papan pemuka", properties: "Hartanah", tenants: "Penyewa", payments: "Pembayaran", maintenance: "Penyelenggaraan", reports: "Laporan", account: "Akaun", settings: "Tetapan", signOut: "Log keluar" },
  zh: { dashboard: "仪表板", properties: "房产", tenants: "租户", payments: "付款", maintenance: "维修", reports: "报告", account: "账户", settings: "设置", signOut: "退出登录" },
};

export function getLocale() {
  return localStorage.getItem(`${APP_CONFIG.statePrefix}:locale`) || APP_CONFIG.defaultLocale;
}

export function setLocale(locale) {
  if (!APP_CONFIG.supportedLocales.includes(locale)) return;
  localStorage.setItem(`${APP_CONFIG.statePrefix}:locale`, locale);
  document.documentElement.lang = locale;
  translatePage();
}

export function t(key) {
  const locale = getLocale();
  return dictionary[locale]?.[key] || dictionary.en[key] || key;
}

export function translatePage(root = document) {
  document.documentElement.lang = getLocale();
  root.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
}
