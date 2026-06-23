import { createFileRoute, notFound } from '@tanstack/react-router';
import { LandingPage } from '#/components/landing/LandingPage';
import i18n from '#/i18n';

const SUPPORTED_LANGS = new Set(['en', 'de', 'fr', 'ch']);

const LANG_ALIASES: Record<string, string> = { ch: 'de' };

const TITLES: Record<string, string> = {
  en: 'Hairspring — The logbook for hobbyist watchmakers',
  de: 'Hairspring — Das Logbuch für Uhrmacher-Hobbyisten',
  fr: 'Hairspring — Le carnet de bord pour horlogers amateurs',
  ch: 'Hairspring — Das Logbuch für Uhrmacher-Hobbyisten',
};

export const Route = createFileRoute('/$lang')({
  beforeLoad: async ({ params }) => {
    if (!SUPPORTED_LANGS.has(params.lang)) throw notFound();
    await i18n.changeLanguage(LANG_ALIASES[params.lang] ?? params.lang);
    return { lang: params.lang };
  },
  head: ({ params }) => ({
    meta: [{ title: TITLES[params.lang] ?? TITLES.en }],
    links: [
      { rel: 'canonical', href: `https://hairspring.app/${params.lang}` },
      { rel: 'alternate', hreflang: 'en', href: 'https://hairspring.app/en' },
      { rel: 'alternate', hreflang: 'de', href: 'https://hairspring.app/de' },
      { rel: 'alternate', hreflang: 'fr', href: 'https://hairspring.app/fr' },
      { rel: 'alternate', hreflang: 'x-default', href: 'https://hairspring.app/en' },
    ],
  }),
  component: LandingPage,
});
