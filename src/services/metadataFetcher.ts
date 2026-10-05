import { BookmarkItem, PageMetadata, LiveInspectionResult } from '../types/bookmark';

/**
 * Decode common HTML entities from title/meta tags
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Parses head section HTML using regex for maximum speed and safe execution without DOM parsing
 */
export function extractMetadataFromHtml(html: string): PageMetadata {
  const metadata: PageMetadata = {};
  if (!html) return metadata;

  // 1. Extract <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    metadata.title = decodeHtmlEntities(titleMatch[1].replace(/\s+/g, ' '));
  }

  // Helper to extract meta tag content
  const extractMeta = (pattern: RegExp): string | undefined => {
    const match = html.match(pattern);
    if (match) {
      const val = match[1] || match[2];
      return val ? decodeHtmlEntities(val.replace(/\s+/g, ' ')) : undefined;
    }
    return undefined;
  };

  // 2. Meta description (matches both name="..." content="..." and content="..." name="...")
  metadata.description =
    extractMeta(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
    extractMeta(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);

  // 3. OpenGraph title
  metadata.ogTitle =
    extractMeta(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
    extractMeta(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);

  // 4. OpenGraph description
  metadata.ogDescription =
    extractMeta(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
    extractMeta(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);

  // 5. Meta keywords
  const keywordsStr =
    extractMeta(/<meta\s+[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i) ||
    extractMeta(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']keywords["']/i);

  if (keywordsStr) {
    metadata.keywords = keywordsStr
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  return metadata;
}

export class MetadataFetcher {
  private static isCancelled = false;

  static cancel() {
    this.isCancelled = true;
  }

  /**
   * Fetches the head portion of a URL and extracts metadata
   */
  static async fetchLiveMetadata(
    url: string,
    timeoutMs = 7000,
    signal?: AbortSignal
  ): Promise<{
    isOnline: boolean;
    statusCode?: number;
    statusText?: string;
    metadata?: PageMetadata;
    error?: string;
  }> {
    // Only inspect HTTP / HTTPS URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return {
        isOnline: false,
        error: 'Unsupported scheme (internal browser page)'
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const abortListener = () => controller.abort();
    if (signal) {
      signal.addEventListener('abort', abortListener);
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      });

      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', abortListener);

      const statusCode = response.status;
      const isOnline = statusCode >= 200 && statusCode < 400;

      if (!isOnline) {
        return {
          isOnline: false,
          statusCode,
          statusText: response.statusText || String(statusCode),
          error: `HTTP ${statusCode} ${response.statusText}`
        };
      }

      // Read initial chunk (up to ~45 KB) to parse <head> without downloading full body
      let html = '';
      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let totalBytes = 0;
        const MAX_BYTES = 45000;

        try {
          while (totalBytes < MAX_BYTES) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              totalBytes += value.length;
              html += decoder.decode(value, { stream: true });
              if (html.toLowerCase().includes('</head>')) {
                break;
              }
            }
          }
        } finally {
          try {
            reader.cancel();
          } catch {
            // Reader cancel fallback
          }
        }
      } else {
        // Fallback if ReadableStream is not accessible
        const text = await response.text();
        const headEnd = text.toLowerCase().indexOf('</head>');
        html = headEnd !== -1 ? text.substring(0, headEnd + 7) : text.substring(0, 45000);
      }

      const metadata = extractMetadataFromHtml(html);

      return {
        isOnline: true,
        statusCode,
        statusText: response.statusText,
        metadata
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', abortListener);

      if (err.name === 'AbortError') {
        return {
          isOnline: false,
          error: `Connection timed out (${timeoutMs / 1000}s)`
        };
      }

      const msg = err.message || '';
      return {
        isOnline: false,
        error: msg.includes('Failed to fetch') ? 'Host unreachable or blocked' : msg
      };
    }
  }

  /**
   * Batch inspect bookmarks with controlled concurrency (default: 6 concurrent requests)
   */
  static async batchInspect(
    items: BookmarkItem[],
    options: {
      concurrency?: number;
      timeoutMs?: number;
      onProgress?: (completed: number, total: number, latest: LiveInspectionResult) => void;
      signal?: AbortSignal;
    } = {}
  ): Promise<LiveInspectionResult[]> {
    this.isCancelled = false;
    const concurrency = Math.max(1, options.concurrency ?? 6);
    const timeoutMs = options.timeoutMs ?? 7000;
    const results: LiveInspectionResult[] = [];
    let completed = 0;
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < items.length) {
        if (this.isCancelled || options.signal?.aborted) break;

        const currentIndex = nextIndex++;
        const item = items[currentIndex];

        const inspection = await this.fetchLiveMetadata(item.url, timeoutMs, options.signal);

        const result: LiveInspectionResult = {
          bookmarkId: item.id,
          url: item.url,
          isOnline: inspection.isOnline,
          statusCode: inspection.statusCode,
          statusText: inspection.statusText,
          metadata: inspection.metadata,
          error: inspection.error
        };

        results[currentIndex] = result;
        completed++;

        if (options.onProgress) {
          options.onProgress(completed, items.length, result);
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
    await Promise.all(workers);

    return results;
  }
}
