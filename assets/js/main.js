const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navPanel = document.querySelector("[data-nav-panel]");
const form = document.querySelector(".contact-form");
const formNote = document.querySelector("[data-form-note]");
const translations = window.JIRNAS_TRANSLATIONS || {};
const languageStorageKey = "jirnas-language";
const originalDocumentTitle = document.title;
const originalTextNodes = new WeakMap();

const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

function getCurrentLanguage() {
  const saved = localStorage.getItem(languageStorageKey);
  return translations[saved] ? saved : "en";
}

const translate = (value, language = getCurrentLanguage()) => {
  const key = normalizeText(String(value || ""));
  if (!key || language === "en") return key;
  return translations[language]?.strings?.[key] || key;
};

const translateWithSpacing = (original, language) => {
  const key = normalizeText(original);
  if (!key || language === "en") return original;
  const translated = translations[language]?.strings?.[key];
  if (!translated) return original;
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
};

const translateTextNodes = (language) => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!normalizeText(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      if (!parent || parent.closest("[data-i18n-skip]")) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    if (!originalTextNodes.has(node)) {
      originalTextNodes.set(node, node.nodeValue);
    }
    node.nodeValue = translateWithSpacing(originalTextNodes.get(node), language);
  });
};

const SOCIAL_ICON_SVGS = {
  instagram:
    '<svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>',
  whatsapp:
    '<svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  mail:
    '<svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  phone:
    '<svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
};

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/jirnas_tech", label: "Instagram", icon: "instagram", external: true },
  { href: "https://wa.me/9647506808384", label: "WhatsApp", icon: "whatsapp", external: true },
  { href: "mailto:jirnastech@gmail.com", label: "Email", icon: "mail", external: false },
  { href: "tel:07506808384", label: "Phone", icon: "phone", external: false },
];

const renderSocialLinks = (language = getCurrentLanguage()) => {
  document.querySelectorAll(".social-links").forEach((container) => {
    container.innerHTML = SOCIAL_LINKS.map((link) => {
      const externalAttrs = link.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      const label = translate(link.label, language);
      return `<a href="${link.href}"${externalAttrs} aria-label="${label}">${SOCIAL_ICON_SVGS[link.icon]}</a>`;
    }).join("");
  });
};

const translateAttribute = (element, attribute, language) => {
  if (element.closest("[data-i18n-skip]")) return;
  const originalKey = `i18nOriginal${attribute.replace(/(^|-)([a-z])/g, (_, __, letter) => letter.toUpperCase())}`;
  if (!element.dataset[originalKey]) {
    element.dataset[originalKey] = element.getAttribute(attribute) || "";
  }
  const original = element.dataset[originalKey];
  if (!original) return;
  element.setAttribute(attribute, language === "en" ? original : translate(original, language));
};

const applyLanguage = (language) => {
  const config = translations[language] || translations.en;
  document.documentElement.lang = config.lang;
  document.documentElement.dir = config.dir;
  document.body.classList.toggle("is-rtl", config.dir === "rtl");
  document.body.classList.toggle("is-ltr", config.dir !== "rtl");
  document.title = language === "en" ? originalDocumentTitle : translate(originalDocumentTitle, language);

  translateTextNodes(language);
  document.querySelectorAll("[placeholder]").forEach((element) => translateAttribute(element, "placeholder", language));
  document.querySelectorAll("[aria-label]").forEach((element) => translateAttribute(element, "aria-label", language));
  document.querySelectorAll("img[alt]").forEach((element) => translateAttribute(element, "alt", language));
  document.querySelectorAll('meta[name="description"]').forEach((element) => translateAttribute(element, "content", language));

  document.querySelectorAll("[data-lang-option]").forEach((button) => {
    const isActive = button.dataset.langOption === language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderSocialLinks(language);
};

const setLanguage = (language) => {
  if (!translations[language]) return;
  localStorage.setItem(languageStorageKey, language);
  applyLanguage(language);
};

document.querySelectorAll("[data-lang-option]").forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.langOption);
    navPanel?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    const icon = menuToggle?.querySelector("svg");
    if (icon) {
      icon.outerHTML = '<i data-lucide="menu"></i>';
      window.lucide?.createIcons();
    }
  });
});

const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
if (translations[requestedLanguage]) {
  localStorage.setItem(languageStorageKey, requestedLanguage);
}

applyLanguage(getCurrentLanguage());

if (window.lucide) {
  window.lucide.createIcons();
}

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

if (menuToggle && navPanel) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navPanel.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    const icon = menuToggle.querySelector("svg");
    if (icon) {
      icon.outerHTML = isOpen ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
      window.lucide?.createIcons();
    }
  });

  navPanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navPanel.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      const icon = menuToggle.querySelector("svg");
      if (icon) {
        icon.outerHTML = '<i data-lucide="menu"></i>';
        window.lucide?.createIcons();
      }
    });
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
}

const CONTACT_EMAIL = "jirnastech@gmail.com";
const FORMSUBMIT_TOKEN = "91c6f919a44ec0644570da89a43fdfc9";

const buildSubmissionFields = (data, language) => ({
  name: data.get("name") || "",
  email: data.get("email") || "",
  phone: data.get("phone") || "",
  service: data.get("service") || "",
  message: data.get("message") || "",
  _subject: `${translate("Project request from", language)} ${
    data.get("name") || translate("Jirnas website", language)
  }`,
  _replyto: data.get("email") || "",
  _template: "table",
  _captcha: "false",
});

const submitViaFormPost = (fields) => {
  const postForm = document.createElement("form");
  postForm.action = `https://formsubmit.co/${FORMSUBMIT_TOKEN}`;
  postForm.method = "POST";
  postForm.acceptCharset = "UTF-8";

  if (window.location.protocol !== "file:") {
    const returnUrl = new URL(window.location.href);
    returnUrl.searchParams.set("sent", "1");
    const nextField = document.createElement("input");
    nextField.type = "hidden";
    nextField.name = "_next";
    nextField.value = returnUrl.toString();
    postForm.appendChild(nextField);
  }

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    postForm.appendChild(input);
  });

  document.body.appendChild(postForm);
  postForm.submit();
};

if (form && formNote) {
  const url = new URL(window.location.href);
  if (url.searchParams.get("sent") === "1") {
    formNote.textContent = translate("Your message has been sent. We'll get back to you soon!", getCurrentLanguage());
    url.searchParams.delete("sent");
    window.history.replaceState({}, "", url.toString());
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const language = getCurrentLanguage();
    const submitButton = form.querySelector('button[type="submit"]');
    const fields = buildSubmissionFields(data, language);

    if (submitButton) submitButton.disabled = true;
    formNote.textContent = translate("Sending your message...", language);

    if (window.location.protocol === "file:") {
      formNote.textContent = translate("Redirecting to send your message...", language);
      submitViaFormPost(fields);
      return;
    }

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${FORMSUBMIT_TOKEN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(fields),
      });

      const result = await response.json();
      const isSuccess = result.success === true || result.success === "true";

      if (isSuccess) {
        formNote.textContent = translate("Your message has been sent. We'll get back to you soon!", language);
        form.reset();
        if (submitButton) submitButton.disabled = false;
        return;
      }

      if (result.message) {
        formNote.textContent = result.message;
        if (submitButton) submitButton.disabled = false;
        return;
      }

      throw new Error("Form submission failed");
    } catch {
      formNote.textContent = translate("Redirecting to send your message...", language);
      submitViaFormPost(fields);
    }
  });
}
