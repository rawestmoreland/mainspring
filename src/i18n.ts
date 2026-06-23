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

function detectInitialLang(): string {
  if (typeof window === 'undefined') return 'en';
  const m = /^\/(en|de|fr|ch)(?:\/|$)/.exec(window.location.pathname);
  if (m) return m[1] === 'ch' ? 'de' : m[1];
  return localStorage.getItem('i18n-lang') ?? 'en';
}

const savedLng = detectInitialLang();

i18n.use(initReactI18next).init({
  resources,
  lng: savedLng,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
