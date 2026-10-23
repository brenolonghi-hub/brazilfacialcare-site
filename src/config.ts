// Brand settings live here so the name can be swapped in one place.
export const brand = {
  name: 'Brazil Facial Care',
  email: 'contato@brazilfacialcare.com',
};

export type Lang = 'pt' | 'en' | 'es';

export const languages: Record<Lang, { label: string; home: string }> = {
  pt: { label: 'Português', home: '/pt/' },
  en: { label: 'English', home: '/en/' },
  es: { label: 'Español', home: '/es/' },
};
