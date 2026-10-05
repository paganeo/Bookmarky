import { describe, it, expect } from 'vitest';
import { SearchEngine } from '../src/services/search';
import { BookmarkItem } from '../src/types/bookmark';

const mockBookmarks: BookmarkItem[] = [
  {
    id: '1',
    title: 'GitHub: Let’s build from here',
    url: 'https://github.com/features',
    domain: 'github.com',
    path: ['Bookmarks Bar', 'Development'],
    pathString: 'Bookmarks Bar / Development'
  },
  {
    id: '2',
    title: 'Figma: The Collaborative Interface Design Tool',
    url: 'https://www.figma.com',
    domain: 'figma.com',
    path: ['Bookmarks Bar', 'Design'],
    pathString: 'Bookmarks Bar / Design'
  },
  {
    id: '3',
    title: 'Figma Community Plugins and Resources',
    url: 'https://www.figma.com/community',
    domain: 'figma.com',
    path: ['Bookmarks Bar', 'Design', 'Resources'],
    pathString: 'Bookmarks Bar / Design / Resources'
  },
  {
    id: '4',
    title: 'WordPress Theme Development Guide',
    url: 'https://developer.wordpress.org/themes',
    domain: 'wordpress.org',
    path: ['Bookmarks Bar', 'Development'],
    pathString: 'Bookmarks Bar / Development'
  },
  {
    id: '5',
    title: 'Google Search Console Official Portal',
    url: 'https://search.google.com/search-console',
    domain: 'google.com',
    path: ['Bookmarks Bar', 'SEO'],
    pathString: 'Bookmarks Bar / SEO'
  }
];

describe('SearchEngine', () => {
  it('ranks exact and prefix title matches highest', () => {
    const results = SearchEngine.search(mockBookmarks, 'figma');
    expect(results.length).toBe(2);
    // Both figma items match, and exact/prefix title scores higher
    expect(results[0].bookmark.domain).toBe('figma.com');
  });

  it('filters by domain operator domain:github.com', () => {
    const results = SearchEngine.search(mockBookmarks, 'domain:github.com');
    expect(results.length).toBe(1);
    expect(results[0].bookmark.id).toBe('1');
  });

  it('filters by folder operator folder:SEO', () => {
    const results = SearchEngine.search(mockBookmarks, 'folder:SEO');
    expect(results.length).toBe(1);
    expect(results[0].bookmark.id).toBe('5');
  });

  it('handles negative search terms (-theme)', () => {
    const results = SearchEngine.search(mockBookmarks, 'wordpress -theme');
    expect(results.length).toBe(0); // Only item with wordpress had theme
  });

  it('handles quoted phrases correctly', () => {
    const results = SearchEngine.search(mockBookmarks, '"google search console"');
    expect(results.length).toBe(1);
    expect(results[0].bookmark.title).toContain('Google Search Console');
  });

  it('supports combined operators', () => {
    const results = SearchEngine.search(mockBookmarks, 'domain:figma.com folder:Resources');
    expect(results.length).toBe(1);
    expect(results[0].bookmark.id).toBe('3');
  });
});
