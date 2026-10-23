import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://brazilfacialcare.com',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'pt',
    locales: ['pt', 'en', 'es'],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
});
