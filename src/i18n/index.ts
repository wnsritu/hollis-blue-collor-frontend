import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import es from "./es.json";
import ru from "./ru.json";
import pt from "./pt.json";
import fr from "./fr.json";
import sw from "./sw.json";
import ht from "./ht.json";

const resources = {
  English: { translation: en },
  Spanish: { translation: es },
  Russian: { translation: ru },
  Portuguese: { translation: pt },
  French: { translation: fr },
  Swahili: { translation: sw },
  "Haitian Creole": { translation: ht },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "English",
  fallbackLng: "English",
  interpolation: { escapeValue: false },
});

export default i18n;
