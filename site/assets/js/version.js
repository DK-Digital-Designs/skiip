export const SITE_VERSION = '0.24.0';
export const SITE_VERSION_LABEL = `Version v${SITE_VERSION}`;

document.querySelectorAll('[data-app-version]').forEach((element) => {
  element.textContent = SITE_VERSION_LABEL;
});
