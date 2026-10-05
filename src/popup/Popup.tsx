import React, { useState, useEffect } from 'react';
import {
  Search,
  ExternalLink,
  Sparkles,
  Copy,
  Link2Off,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { BookmarkItem } from '../types/bookmark';
import { BookmarkService } from '../services/bookmarks';
import { SearchEngine } from '../services/search';

export const Popup: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    BookmarkService.getFlatBookmarks().then((items) => {
      setBookmarks(items);
    });
  }, []);

  const openManager = (action?: string) => {
    const url = chrome?.runtime?.getURL
      ? chrome.runtime.getURL('dashboard.html' + (action ? `#view=${action}` : ''))
      : '/dashboard.html';

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  const openBookmark = (url: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  const filteredBookmarks = query.trim()
    ? SearchEngine.search(bookmarks, query).slice(0, 5).map((r) => r.bookmark)
    : bookmarks.slice(0, 5);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoRow}>
          {/* Tabler Bookmarks Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
            <path d="M15 10v11l-5 -3l-5 3v-11a3 3 0 0 1 3 -3h4a3 3 0 0 1 3 3z" />
            <path d="M11 3h5a3 3 0 0 1 3 3v11" />
          </svg>
          <span style={styles.logoText}>Bookmarky</span>
        </div>
        <button onClick={() => openManager()} style={styles.openDashboardLink}>
          Full Manager <ArrowUpRight size={13} style={{ marginLeft: 2 }} />
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchBox}>
        <Search size={14} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks..."
          style={styles.searchInput}
          autoFocus
        />
      </div>

      {/* Bookmarks List */}
      <div style={styles.sectionHeader}>
        {query ? 'SEARCH RESULTS' : 'RECENT BOOKMARKS'}
      </div>

      <div style={styles.list}>
        {filteredBookmarks.map((bm) => (
          <div
            key={bm.id}
            style={styles.item}
            onClick={() => openBookmark(bm.url)}
          >
            <div style={styles.faviconBox}>
              <img
                src={bm.favicon}
                alt=""
                style={styles.favicon}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div style={styles.itemInfo}>
              <span style={styles.itemTitle}>{bm.title}</span>
              <span style={styles.itemSub}>{bm.domain}</span>
            </div>
            <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={styles.sectionHeader}>QUICK ACTIONS</div>
      <div style={styles.actionsGrid}>
        <button onClick={() => openManager('organizer')} style={styles.actionBtn}>
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <span>Organize</span>
        </button>
        <button onClick={() => openManager('duplicates')} style={styles.actionBtn}>
          <Copy size={14} style={{ color: 'var(--warning-text)' }} />
          <span>Duplicates</span>
        </button>
        <button onClick={() => openManager('broken-links')} style={styles.actionBtn}>
          <Link2Off size={14} style={{ color: 'var(--danger-text)' }} />
          <span>Broken</span>
        </button>
        <button onClick={() => openManager('backups')} style={styles.actionBtn}>
          <Database size={14} style={{ color: 'var(--success-text)' }} />
          <span>Backup</span>
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 360,
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-primary)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-sans)',
    userSelect: 'none'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  logoText: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)'
  },
  openDashboardLink: {
    fontSize: 11,
    color: 'var(--accent-text)',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 600
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '0 10px',
    height: 34,
    gap: 8,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: 12,
    color: 'var(--text-primary)'
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    marginBottom: 6,
    marginTop: 4
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginBottom: 12
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 8px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-surface)',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease'
  },
  faviconBox: {
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  favicon: {
    width: 14,
    height: 14,
    objectFit: 'contain'
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  itemSub: {
    fontSize: 10,
    color: 'var(--text-muted)'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6
  },
  actionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '8px 4px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-primary)'
  }
};
