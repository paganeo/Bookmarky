import { describe, it, expect } from 'vitest';
import { extractMetadataFromHtml, decodeHtmlEntities } from '../src/services/metadataFetcher';
import { BookmarkOrganizer } from '../src/services/organizer';
import { BookmarkItem, PageMetadata } from '../src/types/bookmark';

describe('MetadataFetcher & HTML Extraction', () => {
  it('decodes HTML entities properly', () => {
    const raw = 'Learn Python &amp; JavaScript &quot;Fullstack&quot; &#39;Fast&#39;';
    expect(decodeHtmlEntities(raw)).toBe("Learn Python & JavaScript \"Fullstack\" 'Fast'");
  });

  it('extracts title, meta description, and opengraph data from html snippet', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Curso Completo de Python y Machine Learning en Español</title>
        <meta name="description" content="Aprende inteligencia artificial, redes neuronales y data science desde cero con ejercicios prácticos." />
        <meta property="og:title" content="Aprende Python y ML" />
        <meta property="og:description" content="Plataforma de cursos interactivos y diplomas certificados." />
        <meta name="keywords" content="python, machine learning, cursos, educacion" />
      </head>
      <body>
        <h1>Bienvenido</h1>
      </body>
      </html>
    `;

    const meta = extractMetadataFromHtml(html);
    expect(meta.title).toBe('Curso Completo de Python y Machine Learning en Español');
    expect(meta.description).toContain('Aprende inteligencia artificial');
    expect(meta.ogTitle).toBe('Aprende Python y ML');
    expect(meta.ogDescription).toContain('Plataforma de cursos');
    expect(meta.keywords).toEqual(['python', 'machine learning', 'cursos', 'educacion']);
  });

  it('classifies a previously unclassified bookmark into Education / AI using live metadata', () => {
    // A bookmark with cryptic/generic title that would normally fail static rules
    const crypticBookmark: BookmarkItem = {
      id: 'cryptic-1',
      title: 'Portal de Inicio',
      url: 'https://generic-link-portal.xyz/p/9941',
      domain: 'generic-link-portal.xyz',
      path: ['Bookmarks Bar'],
      pathString: 'Bookmarks Bar'
    };

    // Without metadata it falls back to Reference (no more Other)
    const beforeResult = BookmarkOrganizer.classifyBookmark(crypticBookmark);
    expect(beforeResult.category).toBe('Reference');

    // With live metadata extracted from head:
    const liveMetadata: PageMetadata = {
      title: 'Certificación Profesional en Machine Learning y Redes Neuronales',
      description: 'Aprende los fundamentos de inteligencia artificial con Stanford y proyectos en deep learning.',
      keywords: ['machine learning', 'curso', 'inteligencia artificial']
    };

    const afterResult = BookmarkOrganizer.classifyBookmark(crypticBookmark, liveMetadata);
    expect(['AI', 'Education']).toContain(afterResult.category);
    expect(afterResult.confidence).toBeGreaterThanOrEqual(90);
  });

  it('classifies URLs with specific slugs like /docs or /shop accurately', () => {
    const docItem: BookmarkItem = {
      id: 'doc-1',
      title: 'API Reference Guide',
      url: 'https://miserver.io/docs/v2/authentication',
      domain: 'miserver.io',
      path: ['Bookmarks Bar'],
      pathString: 'Bookmarks Bar'
    };

    const shopItem: BookmarkItem = {
      id: 'shop-1',
      title: 'Cool Sneakers',
      url: 'https://tiendaurbana.com/tienda/calzado-deportivo',
      domain: 'tiendaurbana.com',
      path: ['Bookmarks Bar'],
      pathString: 'Bookmarks Bar'
    };

    const docResult = BookmarkOrganizer.classifyBookmark(docItem);
    expect(docResult.category).toBe('Development');

    const shopResult = BookmarkOrganizer.classifyBookmark(shopItem);
    expect(shopResult.category).toBe('Shopping');
  });
});
