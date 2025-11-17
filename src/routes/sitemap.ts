import { Router } from 'express';
import PhotoModel from '../models/photo';
import ConfigModel from '../models/config';

const router = Router();

const SITE_URL = (process.env.SITE_URL || `http://closjarjart.fr`).replace(/\/$/, '');

const escapeXml = (value: string) =>
  value.replace(/[<>&'\"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case '\'':
        return '&apos;';
      default:
        return char;
    }
  });

const formatUrl = (pathname = '/') => pathname.startsWith('http') ? pathname : `${SITE_URL}${pathname === '/' ? '' : pathname}`;

// Page HTML
router.get('/', async (_req, res, next) => {
  try {
    const [latestConfig, latestPhoto, photos] = await Promise.all([
      ConfigModel.findOne().sort({ createdAt: -1 }).lean(),
      PhotoModel.findOne().sort({ createdAt: -1 }).lean(),
      PhotoModel.find({}).sort({ createdAt: -1 }).limit(50).lean()
    ]);

    const timestamps = [latestConfig?.createdAt, latestPhoto?.createdAt]
      .filter(Boolean)
      .map((date) => new Date(date as Date).getTime());
    const lastModDate = timestamps.length ? new Date(Math.max(...timestamps)) : new Date();

    const imageNodes = photos
      .map((photo) => {
        const loc = escapeXml(formatUrl(photo.url));
        const title = photo.originalName ? `<image:title>${escapeXml(photo.originalName)}</image:title>` : '';
        return `<image:image><image:loc>${loc}</image:loc>${title}</image:image>`;
      })
      .join('');

    const urlEntries = [
      `<url>\n` +
        `  <loc>${escapeXml(formatUrl('/'))}</loc>\n` +
        `  <lastmod>${lastModDate.toISOString()}</lastmod>\n` +
        `  <changefreq>monthly</changefreq>\n` +
        `  <priority>1.0</priority>\n` +
        `  ${imageNodes}\n` +
      `</url>`
    ];

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
      ...urlEntries,
      '</urlset>'
    ].join('\n');

    res.type('application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    console.log(error)
    next(error);
  }
});

export default router;