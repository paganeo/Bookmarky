import { BookmarkItem, DuplicateGroup } from '../types/bookmark';

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'msclkid',
  'mc_eid',
  'ref',
  'ref_src',
  'ref_url',
  'source',
  'yclid',
  '_ga',
  '_hsenc',
  '_hsmi'
]);

export class DuplicateScanner {
  /**
   * Normalize URL by removing common tracking parameters, standardizing protocol,
   * trailing slashes, and lowercase hostname.
   */
  static normalizeUrl(rawUrl: string): { normalized: string; isStrictUrl: boolean } {
    try {
      const url = new URL(rawUrl.trim());
      // Lowercase hostname
      url.hostname = url.hostname.toLowerCase();

      // Normalize protocol to https for comparison
      url.protocol = 'https:';

      // Remove default ports
      if (url.port === '80' || url.port === '443') {
        url.port = '';
      }

      // Remove tracking query params
      const searchParams = new URLSearchParams(url.search);
      const keysToDelete: string[] = [];

      searchParams.forEach((_, key) => {
        if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach((key) => searchParams.delete(key));

      // Sort search parameters for deterministic comparison
      searchParams.sort();
      url.search = searchParams.toString();

      // Remove trailing slash if path is just "/"
      let pathname = url.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      url.pathname = pathname;

      // Clean common bookmark anchor fragments if not SPA router
      if (url.hash && !url.hash.startsWith('#/')) {
        const hashLower = url.hash.toLowerCase();
        if (
          hashLower === '#top' ||
          hashLower === '#' ||
          hashLower === '#content' ||
          hashLower === '#main'
        ) {
          url.hash = '';
        }
      }

      return {
        normalized: url.toString(),
        isStrictUrl: true
      };
    } catch {
      // Fallback for non-standard schemes or invalid URLs
      const cleaned = rawUrl
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');
      return {
        normalized: cleaned,
        isStrictUrl: false
      };
    }
  }

  /**
   * Scan list of bookmarks and return grouped duplicates
   */
  static findDuplicates(items: BookmarkItem[]): DuplicateGroup[] {
    const exactMap = new Map<string, BookmarkItem[]>();
    const normalizedMap = new Map<string, BookmarkItem[]>();

    for (const item of items) {
      if (!item.url) continue;

      // 1. Exact raw URL
      const raw = item.url.trim();
      const existingExact = exactMap.get(raw) || [];
      existingExact.push(item);
      exactMap.set(raw, existingExact);

      // 2. Normalized URL
      const { normalized } = this.normalizeUrl(item.url);
      const existingNorm = normalizedMap.get(normalized) || [];
      existingNorm.push(item);
      normalizedMap.set(normalized, existingNorm);
    }

    const groups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();

    // Process exact duplicates first
    for (const [rawUrl, groupItems] of exactMap.entries()) {
      if (groupItems.length > 1) {
        const first = groupItems[0];
        const group: DuplicateGroup = {
          id: `exact_${encodeURIComponent(rawUrl).slice(0, 40)}_${groupItems.length}`,
          normalizedUrl: rawUrl,
          displayUrl: rawUrl,
          domain: first.domain,
          title: first.title,
          items: groupItems,
          type: 'exact'
        };
        groups.push(group);
        groupItems.forEach((b) => processedIds.add(b.id));
      }
    }

    // Process normalized duplicates (that were not already in an identical exact group)
    for (const [normUrl, groupItems] of normalizedMap.entries()) {
      if (groupItems.length > 1) {
        // Filter out if all items are already part of an exact group
        const unassigned = groupItems.filter((b) => !processedIds.has(b.id));
        if (groupItems.length > 1 && (unassigned.length > 0 || groupItems.length > unassigned.length)) {
          // Check if this normalized group is different from exact groups
          const distinctRawUrls = new Set(groupItems.map((b) => b.url.trim()));
          if (distinctRawUrls.size > 1) {
            const first = groupItems[0];
            const group: DuplicateGroup = {
              id: `norm_${encodeURIComponent(normUrl).slice(0, 40)}_${groupItems.length}`,
              normalizedUrl: normUrl,
              displayUrl: first.url,
              domain: first.domain,
              title: first.title,
              items: groupItems,
              type: 'normalized'
            };
            // Only add if not already covered
            if (!groups.some((g) => g.items.map((i) => i.id).sort().join(',') === groupItems.map((i) => i.id).sort().join(','))) {
              groups.push(group);
            }
          }
        }
      }
    }

    return groups;
  }

  /**
   * Determine bookmark IDs to remove keeping the first (oldest by index/date)
   */
  static getIdsToRemoveKeepingFirst(group: DuplicateGroup): string[] {
    if (group.items.length <= 1) return [];
    // Sort oldest first
    const sorted = [...group.items].sort((a, b) => {
      const dateA = a.dateAdded || 0;
      const dateB = b.dateAdded || 0;
      return dateA - dateB;
    });
    // Keep first, delete the rest
    return sorted.slice(1).map((b) => b.id);
  }

  /**
   * Determine bookmark IDs to remove keeping the newest (by dateAdded)
   */
  static getIdsToRemoveKeepingNewest(group: DuplicateGroup): string[] {
    if (group.items.length <= 1) return [];
    // Sort newest first
    const sorted = [...group.items].sort((a, b) => {
      const dateA = a.dateAdded || 0;
      const dateB = b.dateAdded || 0;
      return dateB - dateA;
    });
    // Keep newest, delete the rest
    return sorted.slice(1).map((b) => b.id);
  }
}
