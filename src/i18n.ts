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
      translation: {
        ...ru,
        common: {
          ...ru.common,
          partners: "Партнеры",
        },
        partnersPage: {
          title: "Партнеры",
          subtitle: "Следите за партнерскими брендами и их текущим статусом.",
          totalPartners: "Всего партнеров",
          activePartners: "Активные партнеры",
          pendingPartners: "Ожидают подключения",
          listTitle: "Список партнеров",
          listSubtitle: "Основные партнеры, их статус и количество филиалов.",
          updatedToday: "Обновлено сегодня",
          statusActive: "Активен",
          statusPending: "Ожидает",
          branches: "{{count}} филиала",
        },
      },
    },
    uz: {
      translation: {
        ...uz,
        common: {
          ...uz.common,
          partners: "Hamkorlar",
        },
        partnersPage: {
          title: "Hamkorlar",
          subtitle: "Hamkor brendlar va ularning joriy holatini kuzatib boring.",
          totalPartners: "Jami hamkorlar",
          activePartners: "Faol hamkorlar",
          pendingPartners: "Kutilayotgan hamkorlar",
          listTitle: "Hamkorlar ro'yxati",
          listSubtitle: "Asosiy hamkorlar holati va filiallar soni.",
          updatedToday: "Bugun yangilandi",
          statusActive: "Faol",
          statusPending: "Kutilmoqda",
          branches: "{{count}} ta filial",
        },
      },
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
