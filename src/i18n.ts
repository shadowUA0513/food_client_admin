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
          addPartner: "Добавить партнера",
          editPartner: "Редактировать партнера",
          deletePartner: "Удалить партнера",
          deleteConfirmation: "Вы уверены, что хотите удалить партнера",
          search: "Поиск",
          searchPlaceholder: "Поиск партнеров",
          nameUz: "Название (UZ)",
          nameRu: "Название (RU)",
          latitude: "Широта",
          longitude: "Долгота",
          address: "Адрес",
          coordinates: "Координаты",
          active: "Активен",
          empty: "Партнеры не найдены.",
          loading: "Загрузка партнеров...",
          loadError: "Не удалось загрузить партнеров.",
          createSuccess: "Партнер успешно создан.",
          createError: "Не удалось создать партнера.",
          updateSuccess: "Партнер успешно обновлен.",
          updateError: "Не удалось обновить партнера.",
          deleteSuccess: "Партнер успешно удален.",
          deleteError: "Не удалось удалить партнера.",
          nameUzRequired: "Название на узбекском обязательно",
          nameRuRequired: "Название на русском обязательно",
          latitudeRequired: "Широта обязательна",
          longitudeRequired: "Долгота обязательна",
          addressRequired: "Адрес обязателен",
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
          addPartner: "Hamkor qo'shish",
          editPartner: "Hamkorni tahrirlash",
          deletePartner: "Hamkorni o'chirish",
          deleteConfirmation: "Haqiqatan ham hamkorni o'chirmoqchimisiz",
          search: "Qidiruv",
          searchPlaceholder: "Hamkorlarni qidiring",
          nameUz: "Nomi (UZ)",
          nameRu: "Nomi (RU)",
          latitude: "Latitude",
          longitude: "Longitude",
          address: "Manzil",
          coordinates: "Koordinatalar",
          active: "Faol",
          empty: "Hamkorlar topilmadi.",
          loading: "Hamkorlar yuklanmoqda...",
          loadError: "Hamkorlarni yuklab bo'lmadi.",
          createSuccess: "Hamkor muvaffaqiyatli yaratildi.",
          createError: "Hamkorni yaratib bo'lmadi.",
          updateSuccess: "Hamkor muvaffaqiyatli yangilandi.",
          updateError: "Hamkorni yangilab bo'lmadi.",
          deleteSuccess: "Hamkor muvaffaqiyatli o'chirildi.",
          deleteError: "Hamkorni o'chirib bo'lmadi.",
          nameUzRequired: "O'zbekcha nom kiritilishi shart",
          nameRuRequired: "Ruscha nom kiritilishi shart",
          latitudeRequired: "Latitude kiritilishi shart",
          longitudeRequired: "Longitude kiritilishi shart",
          addressRequired: "Manzil kiritilishi shart",
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
