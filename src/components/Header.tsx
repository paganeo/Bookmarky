import React from 'react';
import { Search, Plus, FolderPlus, Moon, Sun, Settings, Sparkles, X } from 'lucide-react';
import { SearchOperatorFilter } from '../types/bookmark';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  parsedFilter: SearchOperatorFilter;
  onOpenCommandPalette: () => void;
  onOpenAddBookmark: () => void;
  onOpenAddFolder: () => void;
  onOpenOrganizer: () => void;
  onOpenSettings: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  parsedFilter,
  onOpenCommandPalette,
  onOpenAddBookmark,
  onOpenAddFolder,
  onOpenOrganizer,
  onOpenSettings,
  theme,
  onToggleTheme
}) => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const hasOperators =
    Boolean(parsedFilter.domain) ||
    Boolean(parsedFilter.folder) ||
    Boolean(parsedFilter.title) ||
    Boolean(parsedFilter.url) ||
    parsedFilter.phrases.length > 0 ||
    parsedFilter.excludedTerms.length > 0;

  const removeOperator = (prefix: string) => {
    const regex = new RegExp(`\\b${prefix}:[^\\s]+\\s*`, 'gi');
    onSearchChange(searchQuery.replace(regex, '').trim());
  };

  const removePhrase = (phrase: string) => {
    const regex = new RegExp(`"${phrase}"\\s*`, 'gi');
    onSearchChange(searchQuery.replace(regex, '').trim());
  };

  const removeExcluded = (term: string) => {
    const regex = new RegExp(`-${term}\\s*`, 'gi');
    onSearchChange(searchQuery.replace(regex, '').trim());
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <div style={styles.logoBadge}>
          {/* Tabler Bookmarks Icon (Transparent background + white/accent stroke) */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
            <path d="M15 10v11l-5 -3l-5 3v-11a3 3 0 0 1 3 -3h4a3 3 0 0 1 3 3z" />
            <path d="M11 3h5a3 3 0 0 1 3 3v11" />
          </svg>
          <span style={styles.logoText}>Bookmarky</span>
        </div>
      </div>

      <div style={styles.searchContainer}>
        <div style={styles.searchBox}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            id="global-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bookmarks, folders, or domains (e.g. domain:github.com, folder:AI)..."
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              title="Clear search"
              style={styles.clearBtn}
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={onOpenCommandPalette}
            style={styles.kbdButton}
            title="Open Command Palette"
          >
            <span className="kbd">{isMac ? '⌘K' : 'Ctrl+K'}</span>
          </button>
        </div>

        {/* Search Operator Pills */}
        {hasOperators && (
          <div style={styles.filterPillsRow}>
            {parsedFilter.domain && (
              <span style={styles.filterPill}>
                domain: <strong>{parsedFilter.domain}</strong>
                <button onClick={() => removeOperator('domain')} style={styles.pillClose}><X size={11} /></button>
              </span>
            )}
            {parsedFilter.folder && (
              <span style={styles.filterPill}>
                folder: <strong>{parsedFilter.folder}</strong>
                <button onClick={() => removeOperator('folder')} style={styles.pillClose}><X size={11} /></button>
              </span>
            )}
            {parsedFilter.title && (
              <span style={styles.filterPill}>
                title: <strong>{parsedFilter.title}</strong>
                <button onClick={() => removeOperator('title')} style={styles.pillClose}><X size={11} /></button>
              </span>
            )}
            {parsedFilter.url && (
              <span style={styles.filterPill}>
                url: <strong>{parsedFilter.url}</strong>
                <button onClick={() => removeOperator('url')} style={styles.pillClose}><X size={11} /></button>
              </span>
            )}
            {parsedFilter.phrases.map((phrase, idx) => (
              <span key={idx} style={styles.filterPill}>
                "{phrase}"
                <button onClick={() => removePhrase(phrase)} style={styles.pillClose}><X size={11} /></button>
              </span>
            ))}
            {parsedFilter.excludedTerms.map((term, idx) => (
              <span key={idx} style={{ ...styles.filterPill, borderColor: 'var(--danger-text)' }}>
                -{term}
                <button onClick={() => removeExcluded(term)} style={styles.pillClose}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button
          onClick={onOpenOrganizer}
          style={styles.organizeBtn}
          title="Automatic Smart Organizer"
        >
          <Sparkles size={14} style={{ marginRight: 6 }} />
          <span>Organize</span>
        </button>

        <button
          onClick={onOpenAddBookmark}
          style={styles.iconBtn}
          title="New Bookmark"
        >
          <Plus size={16} />
        </button>

        <button
          onClick={onOpenAddFolder}
          style={styles.iconBtn}
          title="New Folder"
        >
          <FolderPlus size={16} />
        </button>

        <button
          onClick={onToggleTheme}
          style={styles.iconBtn}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={onOpenSettings}
          style={styles.iconBtn}
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-surface)',
    gap: 16,
    zIndex: 10
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 160
  },
  logoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    userSelect: 'none'
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)'
  },
  searchContainer: {
    flex: 1,
    maxWidth: 680,
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '0 12px',
    height: 38,
    gap: 8,
    transition: 'border-color 0.15s ease'
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: 13,
    color: 'var(--text-primary)'
  },
  clearBtn: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    padding: 2,
    borderRadius: 4
  },
  kbdButton: {
    display: 'flex',
    alignItems: 'center'
  },
  filterPillsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  filterPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--accent-light)',
    color: 'var(--accent-text)',
    border: '1px solid var(--border-color)'
  },
  pillClose: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    color: 'inherit',
    opacity: 0.8
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  organizeBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)'
  },
  iconBtn: {
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-color)'
  }
};
