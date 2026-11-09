import type { APIRoute } from 'astro';
import { locales, pages, pagePath, site, siteCopy } from '../lib/site';

export const GET: APIRoute = () => {
  const entries = locales.flatMap((locale) => pages.map((page) => {
    const alternate = locales.map((language) =>
      '<xhtml:link rel="alternate" hreflang="' + siteCopy[language].lang
      + '" href="' + site.origin + pagePath(language, page) + '"/>'
    ).join('');
    return '<url><loc>' + site.origin + pagePath(locale, page) + '</loc>' + alternate + '</url>';
  }));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + entries.join('\n') + '\n</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
