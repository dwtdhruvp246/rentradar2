import { friendlyError } from "./errors.js";
import { supabase } from "./supabaseClient.js";
import { hydrateIcons } from "./ui.js";

const menuButton = document.querySelector("[data-public-menu]");
const navigationPanel = document.querySelector("[data-public-links]");

function setNavigationOpen(open) {
  if (!menuButton || !navigationPanel) return;
  navigationPanel.classList.toggle("is-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  document.body.classList.toggle("nav-open", open);
}

menuButton?.addEventListener("click", () => setNavigationOpen(!navigationPanel.classList.contains("is-open")));
navigationPanel?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setNavigationOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setNavigationOpen(false);
});

document.querySelectorAll("[data-current-year]").forEach((node) => node.replaceChildren(String(new Date().getFullYear())));
hydrateIcons();

let countriesPromise;

function loadCountries() {
  if (!countriesPromise) {
    countriesPromise = supabase
      .from("countries")
      .select("id, code, name, currency_code")
      .eq("is_active", true)
      .order("name")
      .then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      });
  }
  return countriesPromise;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function labelFromKey(key) {
  const labels = {
    properties: "Properties",
    units: "Units",
    staff: "Staff accounts",
    landlords: "Managed landlords",
    documents: "Document storage",
  };
  return labels[key] || key.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function describePlan(accountType, planName) {
  const descriptions = {
    landlord: "For property owners managing their own portfolio, tenant relationships, leases, payments, and maintenance.",
    ipm: "For independent managers operating approved landlord portfolios while keeping each owner context separate.",
    pmc: "For property companies coordinating landlord portfolios, staff permissions, reporting, and operational work.",
  };
  return `${descriptions[accountType] || "For organised property operations."} ${planName ? `${planName} defines the published capacity for this market.` : ""}`;
}

function formatPlanPrice(value, country) {
  if (Number(value) === 0) return "Free";
  return new Intl.NumberFormat(country.locale || "en", {
    style: "currency",
    currency: country.currency_code,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

async function initPricing() {
  const countrySelect = document.querySelector("[data-pricing-country]");
  const grid = document.querySelector("[data-pricing-grid]");
  const status = document.querySelector("[data-pricing-status]");
  if (!countrySelect || !grid || !status) return;

  let accountType = "landlord";
  let billing = "monthly";
  let countries = [];
  let plans = [];

  function renderPlans() {
    const country = countries.find((item) => item.id === countrySelect.value);
    const filtered = plans
      .filter((plan) => plan.country_id === countrySelect.value && plan.account_type === accountType)
      .sort((a, b) => Number(a.monthly_price) - Number(b.monthly_price));

    if (!country || !filtered.length) {
      status.textContent = country ? `No ${accountType.toUpperCase()} plans are currently published for ${country.name}.` : "Choose a country to view published plans.";
      grid.innerHTML = `<div class="pricing-empty"><div><i data-lucide="map-pinned" class="icon"></i><h2>Plan details are not published for this selection.</h2><p>Contact Mushavo with your country, account type, and portfolio needs so the team can help.</p><a class="public-button public-button-primary" href="/contact.html">Contact Mushavo</a></div></div>`;
      hydrateIcons(grid);
      return;
    }

    status.textContent = `Showing ${filtered.length} published ${accountType.toUpperCase()} plan${filtered.length === 1 ? "" : "s"} for ${country.name}.`;
    grid.innerHTML = filtered.map((plan) => {
      const price = billing === "yearly" ? plan.yearly_price : plan.monthly_price;
      const limits = Object.entries(plan.limits || {}).filter(([, value]) => value !== false && value !== null);
      const limitItems = limits.length
        ? limits.map(([key, value]) => `<li><i data-lucide="check"></i><span>${escapeHtml(labelFromKey(key))}: <strong>${escapeHtml(value === true ? "Included" : value)}</strong></span></li>`).join("")
        : `<li><i data-lucide="check"></i><span>Core Mushavo property operations</span></li>`;
      return `<article class="live-price-card"><h2>${escapeHtml(plan.name)}</h2><div class="price-value">${escapeHtml(formatPlanPrice(price, country))}</div><div class="price-period">${Number(price) === 0 ? "No subscription charge" : `per ${billing === "yearly" ? "year" : "month"}`}</div><p class="price-description">${escapeHtml(describePlan(accountType, plan.name))}</p><ul class="price-features">${limitItems}</ul><a class="public-button ${Number(price) === 0 ? "public-button-light" : "public-button-primary"}" href="/signup.html">Choose ${escapeHtml(plan.name)}</a></article>`;
    }).join("");
    hydrateIcons(grid);
  }

  try {
    countries = await loadCountries();
    const { data, error } = await supabase
      .from("pricing_plans")
      .select("id, country_id, account_type, name, monthly_price, yearly_price, currency_code, limits")
      .eq("is_public", true)
      .eq("is_active", true);
    if (error) throw error;
    plans = data || [];

    if (!countries.length) throw new Error("No active countries are currently published.");
    countrySelect.innerHTML = countries.map((country) => `<option value="${escapeHtml(country.id)}">${escapeHtml(country.name)} (${escapeHtml(country.currency_code)})</option>`).join("");
    renderPlans();
  } catch (error) {
    status.textContent = friendlyError(error, "Published pricing could not be loaded.");
    countrySelect.innerHTML = '<option value="">Pricing unavailable</option>';
    countrySelect.disabled = true;
    document.querySelectorAll("[data-account-type], [data-billing]").forEach((button) => { button.disabled = true; });
    grid.innerHTML = `<div class="pricing-empty"><div><i data-lucide="circle-alert" class="icon"></i><h2>Pricing is temporarily unavailable.</h2><p>Contact Mushavo for current plan information in your country.</p><a class="public-button public-button-primary" href="/contact.html">Ask about pricing</a></div></div>`;
    hydrateIcons(grid);
    return;
  }

  countrySelect.addEventListener("change", renderPlans);
  document.querySelectorAll("[data-account-type]").forEach((button) => button.addEventListener("click", () => {
    accountType = button.dataset.accountType;
    document.querySelectorAll("[data-account-type]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    renderPlans();
  }));
  document.querySelectorAll("[data-billing]").forEach((button) => button.addEventListener("click", () => {
    billing = button.dataset.billing;
    document.querySelectorAll("[data-billing]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    renderPlans();
  }));
}

async function initContactForm() {
  const form = document.querySelector("[data-enquiry-form]");
  if (!form) return;
  const countrySelect = form.querySelector("[data-contact-country]");

  try {
    const countries = await loadCountries();
    countrySelect.innerHTML = `<option value="">Other / not listed</option>${countries.map((country) => `<option value="${escapeHtml(country.id)}">${escapeHtml(country.name)}</option>`).join("")}`;
  } catch {
    countrySelect.innerHTML = '<option value="">Other / not listed</option>';
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("[type=submit]");
    const message = form.querySelector("[data-form-message]");
    const values = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    submit.innerHTML = '<span class="skeleton" style="width:16px;height:16px;border-radius:50%"></span> Sending enquiry';
    message.textContent = "";

    try {
      let { error } = await supabase.from("enquiries").insert({
        name: values.name,
        email: values.email,
        country_id: values.countryId || null,
        enquiry_type: values.enquiryType,
        account_type: values.accountType || null,
        message: values.message,
      });
      if (error && /enquiry_type|account_type|schema cache/i.test([error.message, error.details].filter(Boolean).join(" "))) {
        const legacyMessage = `Topic: ${values.enquiryType}\nAccount type: ${values.accountType || "Not specified"}\n\n${values.message}`;
        ({ error } = await supabase.from("enquiries").insert({
          name: values.name,
          email: values.email,
          country_id: values.countryId || null,
          message: legacyMessage,
        }));
        if (error && /country_id|schema cache/i.test([error.message, error.details].filter(Boolean).join(" "))) {
          ({ error } = await supabase.from("enquiries").insert({ name: values.name, email: values.email, message: legacyMessage }));
        }
      }
      if (error) throw error;
      message.textContent = "Your enquiry has been sent. Mushavo now has the context you provided.";
      message.dataset.kind = "success";
      form.reset();
    } catch (error) {
      message.textContent = friendlyError(error, "Your enquiry could not be sent. Check the form and try again.");
      message.dataset.kind = "error";
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'Send enquiry <i data-lucide="send"></i>';
      hydrateIcons(submit);
    }
  });
}

initPricing();
initContactForm();
