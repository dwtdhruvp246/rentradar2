(function () {
  const STORAGE_KEY = "mushavo_language";
  const supported = {
    en: "English",
    ms: "Bahasa Melayu",
    zh: "Chinese"
  };

  const dictionary = {
    ms: {
      "Home": "Utama",
      "About": "Tentang",
      "Pricing": "Harga",
      "Contact": "Hubungi",
      "Client Area": "Kawasan Pelanggan",
      "Your property, handled simply.": "Hartanah anda, diurus dengan mudah.",
      "Property management for landlords, tenants, IPMs, and PMCs.": "Pengurusan hartanah untuk tuan rumah, penyewa, IPM dan PMC.",
      "Open Client Area": "Buka Kawasan Pelanggan",
      "Sign up for free": "Daftar percuma",
      "Landlords": "Tuan rumah",
      "Tenants": "Penyewa",
      "IPMs": "IPM",
      "PMCs": "PMC",
      "Payments": "Bayaran",
      "Maintenance": "Penyelenggaraan",
      "Leases": "Pajakan",
      "Finance": "Kewangan",
      "Dashboard": "Papan pemuka",
      "Properties": "Hartanah",
      "Staff": "Kakitangan",
      "Settings": "Tetapan",
      "My Account": "Akaun Saya",
      "Notifications": "Pemberitahuan",
      "Email": "E-mel",
      "Password": "Kata laluan",
      "Full name": "Nama penuh",
      "Phone": "Telefon",
      "Country": "Negara",
      "Message": "Mesej",
      "Submit enquiry": "Hantar pertanyaan",
      "Thank you. Your enquiry has been submitted successfully.": "Terima kasih. Pertanyaan anda berjaya dihantar.",
      "The email or password is incorrect.": "E-mel atau kata laluan tidak betul.",
      "Your account already exists. Please contact Mushavo Support.": "Akaun anda sudah wujud. Sila hubungi Sokongan Mushavo.",
      "Your account does not exist or has been removed. Please contact Mushavo Support.": "Akaun anda tidak wujud atau telah dipadam. Sila hubungi Sokongan Mushavo.",
      "Your Mushavo subscription has expired, and your account access is currently paused. Your data is still safely stored.": "Langganan Mushavo anda telah tamat tempoh dan akses akaun anda sedang dijeda. Data anda masih disimpan dengan selamat.",
      "Please contact support to renew your subscription and restore access.": "Sila hubungi sokongan untuk memperbaharui langganan dan memulihkan akses.",
      "Payment is for": "Bayaran untuk",
      "Rent amount": "Jumlah sewa",
      "Amount": "Jumlah",
      "Other": "Lain-lain",
      "Description": "Penerangan",
      "Based on this month's rent and verified rent payments only.": "Berdasarkan sewa bulan ini dan bayaran sewa yang disahkan sahaja."
    },
    zh: {
      "Home": "首页",
      "About": "关于",
      "Pricing": "价格",
      "Contact": "联系",
      "Client Area": "客户区",
      "Your property, handled simply.": "让您的物业管理更简单。",
      "Property management for landlords, tenants, IPMs, and PMCs.": "面向房东、租户、IPM 和 PMC 的物业管理。",
      "Open Client Area": "打开客户区",
      "Sign up for free": "免费注册",
      "Landlords": "房东",
      "Tenants": "租户",
      "IPMs": "IPM",
      "PMCs": "PMC",
      "Payments": "付款",
      "Maintenance": "维修",
      "Leases": "租约",
      "Finance": "财务",
      "Dashboard": "仪表板",
      "Properties": "物业",
      "Staff": "员工",
      "Settings": "设置",
      "My Account": "我的账户",
      "Notifications": "通知",
      "Email": "电子邮箱",
      "Password": "密码",
      "Full name": "姓名",
      "Phone": "电话",
      "Country": "国家",
      "Message": "留言",
      "Submit enquiry": "提交咨询",
      "Thank you. Your enquiry has been submitted successfully.": "谢谢。您的咨询已成功提交。",
      "The email or password is incorrect.": "电子邮箱或密码不正确。",
      "Your account already exists. Please contact Mushavo Support.": "您的账户已存在。请联系 Mushavo 支持。",
      "Your account does not exist or has been removed. Please contact Mushavo Support.": "您的账户不存在或已被删除。请联系 Mushavo 支持。",
      "Your Mushavo subscription has expired, and your account access is currently paused. Your data is still safely stored.": "您的 Mushavo 订阅已过期，账户访问已暂停。您的数据仍安全保存。",
      "Please contact support to renew your subscription and restore access.": "请联系支持团队续订并恢复访问。",
      "Payment is for": "付款用途",
      "Rent amount": "租金金额",
      "Amount": "金额",
      "Other": "其他",
      "Description": "说明",
      "Based on this month's rent and verified rent payments only.": "仅基于本月租金和已验证租金付款。"
    }
  };

  function currentLanguage() {
    return localStorage.getItem(STORAGE_KEY) || "en";
  }

  function translateText(value, lang) {
    if (!value || lang === "en") return value;
    const trimmed = value.trim();
    if (!trimmed) return value;
    const table = dictionary[lang] || {};
    if (table[trimmed]) return value.replace(trimmed, table[trimmed]);
    const unitMatch = trimmed.match(/^Unit\s+(.+)$/);
    if (unitMatch && lang === "ms") return value.replace(trimmed, `Unit ${unitMatch[1]}`);
    if (unitMatch && lang === "zh") return value.replace(trimmed, `${unitMatch[1]}号单元`);
    return value;
  }

  function shouldSkip(node) {
    if (!node || !node.parentElement) return true;
    return ["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "OPTION"].includes(node.parentElement.tagName);
  }

  function translateElement(root) {
    const lang = currentLanguage();
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!shouldSkip(node)) node.nodeValue = translateText(node.nodeValue, lang);
    });
    document.querySelectorAll("[title],[aria-label]").forEach((el) => {
      ["title", "aria-label"].forEach((attr) => {
        const value = el.getAttribute(attr);
        if (value) el.setAttribute(attr, translateText(value, lang));
      });
    });
  }

  function injectSelector() {
    if (document.querySelector("[data-mushavo-language]")) return;
    const mount = document.querySelector("[data-language-mount]");
    if (!mount) return;
    const select = document.createElement("select");
    select.setAttribute("data-mushavo-language", "true");
    select.className = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700";
    Object.entries(supported).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    select.value = currentLanguage();
    select.addEventListener("change", () => {
      localStorage.setItem(STORAGE_KEY, select.value);
      window.location.reload();
    });
    mount.appendChild(select);
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectSelector();
    translateElement(document.body);
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length)) translateElement(document.body);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
