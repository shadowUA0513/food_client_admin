import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";

const LANGUAGE_STORAGE_KEY = "food-admin-language";
const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
const fallbackLanguage = savedLanguage === "ru" || savedLanguage === "uz" ? savedLanguage : "ru";

void i18n.use(initReactI18next).init({
  resources: {
    ru: {
      translation: ru,
    },
    uz: {
      translation: uz,
    },
  },
  lng: fallbackLanguage,
  fallbackLng: "ru",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
});

export default i18n;
