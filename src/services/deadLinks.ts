import { BookmarkItem, BrokenLinkItem, LinkCheckStatus } from '../types/bookmark';

export class DeadLinkScanner {
  private static isCancelled = false;

  /**
   * Cancel ongoing scan
   */
  static cancelScan() {
    this.isCancelled = true;
  }

  /**
   * Check a single URL with timeout and fallback
   */
  static async checkUrl(item: BookmarkItem, signal?: AbortSignal): Promise<BrokenLinkItem> {
    const baseResult: BrokenLinkItem = {
      id: `check_${item.id}`,
      bookmarkId: item.id,
      title: item.title,
      url: item.url,
      domain: item.domain,
      folderPath: item.pathString,
      status: 'checking',
      lastChecked: Date.now()
    };

    // Exclude invalid/internal schemes
    if (!item.url.startsWith('http://') && !item.url.startsWith('https://')) {
      return {
        ...baseResult,
        status: 'working',
        statusText: 'Internal browser scheme'
      };
    }

    const timeoutMs = 8000;
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), timeoutMs);

    const abortHandler = () => timeoutController.abort();
    if (signal) {
      signal.addEventListener('abort', abortHandler);
    }

    try {
      // First try a HEAD request (lighter on bandwidth)
      let response: Response;
      try {
        response = await fetch(item.url, {
          method: 'HEAD',
          signal: timeoutController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
      } catch (headErr: any) {
        if (headErr.name === 'AbortError') {
          throw headErr;
        }
        // If HEAD is rejected by server (405 or CORS), fallback to GET with range
        response = await fetch(item.url, {
          method: 'GET',
          signal: timeoutController.signal,
          headers: {
            Range: 'bytes=0-10'
          }
        });
      }

      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', abortHandler);

      const statusCode = response.status;
      let status: LinkCheckStatus = 'working';

      if (statusCode >= 200 && statusCode < 300) {
        status = 'working';
      } else if (statusCode >= 300 && statusCode < 400) {
        status = 'redirect';
      } else if (statusCode === 404) {
        status = '404';
      } else if (statusCode === 403) {
        status = '403';
      } else if (statusCode >= 500) {
        status = '500';
      } else {
        status = 'unknown';
      }

      return {
        ...baseResult,
        status,
        statusCode,
        statusText: response.statusText || String(statusCode),
        redirectUrl: response.redirected ? response.url : undefined
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', abortHandler);

      if (err.name === 'AbortError') {
        return {
          ...baseResult,
          status: 'timeout',
          statusText: 'Connection timed out (8s)'
        };
      }

      // Check for network/DNS failures
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('ENOTFOUND') || msg.includes('NetworkError')) {
        return {
          ...baseResult,
          status: 'dns_error',
          statusText: 'Host unreachable or DNS error'
        };
      }

      return {
        ...baseResult,
        status: 'unknown',
        statusText: msg.slice(0, 50) || 'Unknown network error'
      };
    }
  }

  /**
   * Scan bookmarks with controlled concurrency (default: 4 concurrent requests)
   */
  static async scanBatch(
    items: BookmarkItem[],
    onProgress: (scanned: number, total: number, latest: BrokenLinkItem) => void,
    concurrency = 4
  ): Promise<BrokenLinkItem[]> {
    this.isCancelled = false;
    const results: BrokenLinkItem[] = [];
    const total = items.length;
    let scanned = 0;
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < total && !this.isCancelled) {
        const index = currentIndex++;
        const item = items[index];
        const res = await this.checkUrl(item);
        results.push(res);
        scanned++;
        onProgress(scanned, total, res);
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);

    return results;
  }
}
