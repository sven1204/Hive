const path = require("path");
const fr = require(path.join(__dirname, "..", "locales", "fr", "translation.json"));

function resolve(obj, keyPath) {
  return keyPath.split(".").reduce(
    (acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined),
    obj
  );
}

function t(key, params) {
  // Gestion des pluriels i18next (result_one / result_other)
  let resolvedKey = key;
  if (params && typeof params.count === "number") {
    const pluralKey = params.count === 1 ? `${key}_one` : `${key}_other`;
    if (resolve(fr, pluralKey) !== undefined) {
      resolvedKey = pluralKey;
    }
  }

  let value = resolve(fr, resolvedKey);
  if (typeof value !== "string") return key;

  // Interpolation des variables {{param}}
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
