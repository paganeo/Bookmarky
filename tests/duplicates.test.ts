import { describe, it, expect } from 'vitest';
import { DuplicateScanner } from '../src/services/duplicates';
import { BookmarkItem } from '../src/types/bookmark';

describe('DuplicateScanner', () => {
  it('normalizes URLs by stripping trailing slashes, protocol, and UTM parameters', () => {
    const raw1 = 'https://example.com/blog/?utm_source=twitter&utm_medium=social#top';
    const raw2 = 'http://example.com/blog?utm_medium=social&utm_source=twitter';

    const norm1 = DuplicateScanner.normalizeUrl(raw1);
    const norm2 = DuplicateScanner.normalizeUrl(raw2);

    expect(norm1.normalized).toBe(norm2.normalized);
    expect(norm1.normalized).toBe('https://example.com/blog');
  });

  it('detects exact duplicates correctly', () => {
    const items: BookmarkItem[] = [
      { id: '1', title: 'Example 1', url: 'https://example.com', domain: 'example.com', path: [], pathString: '' },
      { id: '2', title: 'Example 2', url: 'https://example.com', domain: 'example.com', path: [], pathString: '' }
    ];

    const dupes = DuplicateScanner.findDuplicates(items);
    expect(dupes.length).toBe(1);
    expect(dupes[0].type).toBe('exact');
    expect(dupes[0].items.length).toBe(2);
  });

  it('detects normalized duplicates with tracking parameters', () => {
    const items: BookmarkItem[] = [
      { id: '1', title: 'GitHub', url: 'https://github.com', domain: 'github.com', path: [], pathString: '' },
      { id: '2', title: 'GitHub Campaign', url: 'https://github.com/?utm_source=email&ref=newsletter', domain: 'github.com', path: [], pathString: '' }
    ];

    const dupes = DuplicateScanner.findDuplicates(items);
    expect(dupes.length).toBe(1);
    expect(dupes[0].items.length).toBe(2);
  });

  it('provides helper to keep first item and remove subsequent copies', () => {
    const items: BookmarkItem[] = [
      { id: '1', title: 'GitHub', url: 'https://github.com', domain: 'github.com', path: [], pathString: '', dateAdded: 100 },
      { id: '2', title: 'GitHub Dup', url: 'https://github.com', domain: 'github.com', path: [], pathString: '', dateAdded: 200 },
      { id: '3', title: 'GitHub Dup 2', url: 'https://github.com', domain: 'github.com', path: [], pathString: '', dateAdded: 300 }
    ];

    const dupes = DuplicateScanner.findDuplicates(items);
    const idsToRemove = DuplicateScanner.getIdsToRemoveKeepingFirst(dupes[0]);
    expect(idsToRemove).toEqual(['2', '3']);
  });
});
