export const BRAND = {
  productName: "Calculator",
  productNameFull: "Calculator ~ by Ganit Technology",
  parentOrg: "Dhurta Organisation",
  tagline: "Every calculation. Anywhere. Anytime. Offline.",
  taglineAlt: "Calculate without limits.",
  description:
    "A universal calculator platform — 45+ tools, offline-first, " +
    "privacy-respecting, built by Ganit Technology.",

  colors: {
    primary:   "#4F46E5",
    accent:    "#F59E0B",
    secondary: "#0D9488",
    dark:      "#0F172A",
    light:     "#F8FAFC",
  },

  links: {
    website: "https://ganit.dhurta.com",
    parent:  "https://dhurta.org",
    github:  "https://github.com/prashantkeshr/Ganit-Calculator",
    docs:    "https://ganit.dhurta.com/llms.txt",
    support: "mailto:hello@dhurta.org",
  },

  copyright: "© 2025 Dhurta Organisation",
  license:   "MIT License",
  version:   "0.1.0-beta",

  social: {
    twitter: "@dhurta_org",
    github:  "dhurta-org",
  },
};

export function injectFooter(container) {
  const el = document.createElement("footer");
  el.className = "ganit-footer";
  el.innerHTML = `
    <div class="footer-brand">
      <svg class="footer-logo" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" stroke="var(--color-primary)" stroke-width="2"/>
        <text x="20" y="26" text-anchor="middle" font-size="18" fill="var(--color-primary)" font-family="serif">π</text>
      </svg>
      <span class="footer-name">Calculator ~ by Ganit Technology</span>
    </div>
    <div class="footer-links">
      <a href="${BRAND.links.website}" target="_blank" rel="noopener">Ganit</a>
      <a href="${BRAND.links.parent}" target="_blank" rel="noopener">Dhurta Organisation</a>
      <a href="/docs">Docs</a>
      <a href="#/privacy">Privacy</a>
      <a href="#/about">About</a>
    </div>
    <div class="footer-legal">
      <p>Powered by Dhurta Organisation</p>
      <p>${BRAND.copyright} · ${BRAND.license} · Made with ❤ for the world</p>
    </div>
  `;
  if (container) container.appendChild(el);
  return el;
}
