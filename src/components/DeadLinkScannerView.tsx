import React, { useState } from 'react';
import {
  Link2Off,
  Play,
  Square,
  Trash2,
  ExternalLink,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { BookmarkItem, BrokenLinkItem, LinkCheckStatus } from '../types/bookmark';
import { DeadLinkScanner } from '../services/deadLinks';
import { BookmarkService } from '../services/bookmarks';
import { BackupService } from '../services/backup';

interface DeadLinkScannerViewProps {
  bookmarks: BookmarkItem[];
  onRefresh: () => void;
}

export const DeadLinkScannerView: React.FC<DeadLinkScannerViewProps> = ({
  bookmarks,
  onRefresh
}) => {
  const [results, setResults] = useState<BrokenLinkItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'broken' | 'redirects' | 'working'>('broken');

  const startScan = async () => {
    setIsScanning(true);
    setScannedCount(0);
    setResults([]);

    try {
      await DeadLinkScanner.scanBatch(
        bookmarks,
        (scanned, _total, latest) => {
          setScannedCount(scanned);
          setResults((prev) => [latest, ...prev]);
        },
        4 // Concurrency limit
      );
    } catch (err) {
      console.error('Scan failed', err);
    } finally {
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    DeadLinkScanner.cancelScan();
    setIsScanning(false);
  };

  const handleDelete = async (item: BrokenLinkItem) => {
    try {
      await BackupService.createBackup('Pre-Dead Link Removal Safety Backup', true);
      await BookmarkService.remove(item.bookmarkId);
      setResults((prev) => prev.filter((r) => r.id !== item.id));
      onRefresh();
    } catch (e) {
      console.error('Failed to delete dead bookmark', e);
    }
  };

  const handleRecheck = async (item: BrokenLinkItem) => {
    const originalBm = bookmarks.find((b) => b.id === item.bookmarkId);
    if (!originalBm) return;

    const updated = await DeadLinkScanner.checkUrl(originalBm);
    setResults((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
  };

  const filteredResults = results.filter((r) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'broken') {
      return (
        r.status === '404' ||
        r.status === '500' ||
        r.status === 'timeout' ||
        r.status === 'dns_error'
      );
    }
    if (filterStatus === 'redirects') return r.status === 'redirect';
    if (filterStatus === 'working') return r.status === 'working';
    return true;
  });

  const brokenCount = results.filter(
    (r) => r.status === '404' || r.status === '500' || r.status === 'timeout' || r.status === 'dns_error'
  ).length;

  const progressPercent = bookmarks.length > 0 ? Math.round((scannedCount / bookmarks.length) * 100) : 0;

  const getStatusBadge = (status: LinkCheckStatus, code?: number, text?: string) => {
    switch (status) {
      case 'working':
        return <span style={styles.badgeWorking}>200 OK</span>;
      case 'redirect':
        return <span style={styles.badgeRedirect}>Redirect {code || 301}</span>;
      case '404':
        return <span style={styles.badgeDanger}>404 Not Found</span>;
      case '403':
        return <span style={styles.badgeWarning}>403 Forbidden (Blocked)</span>;
      case '500':
        return <span style={styles.badgeDanger}>500 Server Error</span>;
      case 'timeout':
        return <span style={styles.badgeWarning}>Timed Out (8s)</span>;
      case 'dns_error':
        return <span style={styles.badgeDanger}>Unreachable / DNS</span>;
      default:
        return <span style={styles.badgeMuted}>{text || 'Unknown'}</span>;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Broken Link Scanner</h2>
          <p style={styles.subtitle}>
            Asynchronously inspect bookmarks for dead URLs, 404s, timeouts, and broken domains
          </p>
        </div>

        <div style={styles.actions}>
          {isScanning ? (
            <button onClick={stopScan} style={styles.stopBtn}>
              <Square size={14} style={{ marginRight: 6 }} />
              Stop Scan
            </button>
          ) : (
            <button onClick={startScan} style={styles.startBtn}>
              <Play size={14} style={{ marginRight: 6 }} />
              {results.length > 0 ? 'Scan Again' : 'Start Full Scan'}
            </button>
          )}
        </div>
      </div>

      {/* Progress Section */}
      {isScanning && (
        <div style={styles.progressCard}>
          <div style={styles.progressTop}>
            <span>
              Scanning links... ({scannedCount} of {bookmarks.length})
            </span>
            <span style={styles.progressPercent}>{progressPercent}%</span>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {/* Filters bar */}
      {results.length > 0 && (
        <div style={styles.filtersBar}>
          <div style={styles.tabButtons}>
            <button
              style={{ ...styles.tabBtn, ...(filterStatus === 'broken' ? styles.tabBtnActive : {}) }}
              onClick={() => setFilterStatus('broken')}
            >
              Broken Links ({brokenCount})
            </button>
            <button
              style={{ ...styles.tabBtn, ...(filterStatus === 'redirects' ? styles.tabBtnActive : {}) }}
              onClick={() => setFilterStatus('redirects')}
            >
              Redirects ({results.filter((r) => r.status === 'redirect').length})
            </button>
            <button
              style={{ ...styles.tabBtn, ...(filterStatus === 'working' ? styles.tabBtnActive : {}) }}
              onClick={() => setFilterStatus('working')}
            >
              Working ({results.filter((r) => r.status === 'working').length})
            </button>
            <button
              style={{ ...styles.tabBtn, ...(filterStatus === 'all' ? styles.tabBtnActive : {}) }}
              onClick={() => setFilterStatus('all')}
            >
              All Scanned ({results.length})
            </button>
          </div>
        </div>
      )}

      {/* Results List */}
      {results.length === 0 && !isScanning ? (
        <div style={styles.emptyState}>
          <Link2Off size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3 style={styles.emptyTitle}>Scanner Ready</h3>
          <p style={styles.emptyText}>
            Click "Start Full Scan" to inspect all {bookmarks.length} bookmarks. The scanner runs asynchronously in batches to preserve network and browser performance.
          </p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div style={styles.emptyState}>
          <CheckCircle size={48} style={{ color: 'var(--success-text)', marginBottom: 12 }} />
          <h3 style={styles.emptyTitle}>No matching issues found</h3>
          <p style={styles.emptyText}>All checked bookmarks in this category are responding normally.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredResults.map((item) => (
            <div key={item.id} style={styles.row}>
              <div style={styles.rowMain}>
                <div style={styles.rowTitleRow}>
                  <span style={styles.rowTitle}>{item.title}</span>
                  {getStatusBadge(item.status, item.statusCode, item.statusText)}
                </div>

                <div style={styles.rowMeta}>
                  <span style={styles.urlText}>{item.url}</span>
                  {item.redirectUrl && (
                    <span style={styles.redirectText}>↳ Redirects to: {item.redirectUrl}</span>
                  )}
                  <span style={styles.pathText}>Folder: {item.folderPath}</span>
                </div>
              </div>

              <div style={styles.rowActions}>
                <button
                  onClick={() => handleRecheck(item)}
                  style={styles.actionBtn}
                  title="Recheck URL"
                >
                  <RotateCcw size={14} />
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.actionBtn}
                  title="Open URL in new tab"
                >
                  <ExternalLink size={14} />
                </a>

                <button
                  onClick={() => handleDelete(item)}
                  style={{ ...styles.actionBtn, color: 'var(--danger-text)' }}
                  title="Delete bookmark"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    backgroundColor: 'var(--bg-app)',
    padding: '24px 32px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginTop: 2
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  startBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600
  },
  stopBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--danger)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600
  },
  progressCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  progressTop: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-primary)'
  },
  progressPercent: {
    color: 'var(--accent-text)',
    fontWeight: 600
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'var(--border-color)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'var(--accent)',
    transition: 'width 0.2s ease'
  },
  filtersBar: {
    marginBottom: 14
  },
  tabButtons: {
    display: 'flex',
    gap: 6
  },
  tabBtn: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 12,
    fontWeight: 500,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)'
  },
  tabBtnActive: {
    backgroundColor: 'var(--accent-light)',
    borderColor: 'var(--accent)',
    color: 'var(--accent-text)',
    fontWeight: 600
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    gap: 16
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  rowTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  rowMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 11
  },
  urlText: {
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  redirectText: {
    color: 'var(--accent-text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  pathText: {
    color: 'var(--text-secondary)'
  },
  rowActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  actionBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-subtle)'
  },
  badgeWorking: {
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 4,
    backgroundColor: 'var(--success-light)',
    color: 'var(--success-text)',
    fontWeight: 600
  },
  badgeRedirect: {
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 4,
    backgroundColor: 'var(--accent-light)',
    color: 'var(--accent-text)',
    fontWeight: 600
  },
  badgeDanger: {
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 4,
    backgroundColor: 'var(--danger-light)',
    color: 'var(--danger-text)',
    fontWeight: 600
  },
  badgeWarning: {
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 4,
    backgroundColor: 'var(--warning-light)',
    color: 'var(--warning-text)',
    fontWeight: 600
  },
  badgeMuted: {
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 4,
    backgroundColor: 'var(--badge-bg)',
    color: 'var(--text-muted)'
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center'
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6
  },
  emptyText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    maxWidth: 420
  }
};
