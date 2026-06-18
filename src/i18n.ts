import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/lib/i18n/en.json';
import de from '@/lib/i18n/de.json';
import fr from '@/lib/i18n/fr.json';

export const resources = {
  en,
  de,
  fr,
};

const savedLng =
  typeof window !== 'undefined' ? (localStorage.getItem('i18n-lang') ?? 'en') : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: savedLng,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
