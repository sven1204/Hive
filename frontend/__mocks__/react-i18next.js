const path = require("path");
const fr = require(path.join(__dirname, "..", "src", "locales", "fr", "translation.json"));

function resolve(obj, keyPath) {
  return keyPath.split(".").reduce(
    (acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined),
    obj
  );
}

function t(key, params) {
  let value = resolve(fr, key);
  if (typeof value !== "string") return key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
    });
  }
  return value;
}

const i18n = {
  language: "fr",
  changeLanguage: jest.fn(),
};

module.exports = {
  useTranslation: () => ({ t, i18n }),
  Trans: ({ children }) => children,
  initReactI18next: { type: "3rdParty", init: jest.fn() },
};
