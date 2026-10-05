import React, { useState, useMemo } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { BookmarkItem } from '../types/bookmark';
import { DuplicateScanner } from '../services/duplicates';

interface DomainAnalyticsViewProps {
  bookmarks: BookmarkItem[];
  onFilterDomain: (domain: string) => void;
}

interface DomainStat {
  domain: string;
  count: number;
  folders: Set<string>;
  duplicateCount: number;
  sampleFavicon?: string;
}

export const DomainAnalyticsView: React.FC<DomainAnalyticsViewProps> = ({
  bookmarks,
  onFilterDomain
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  const domainStats = useMemo(() => {
    const map = new Map<string, DomainStat>();

    // Pre-calculate duplicates for domains
    const duplicates = DuplicateScanner.findDuplicates(bookmarks);
    const domainDupMap = new Map<string, number>();
    for (const dup of duplicates) {
      domainDupMap.set(dup.domain, (domainDupMap.get(dup.domain) || 0) + (dup.items.length - 1));
    }

    for (const b of bookmarks) {
      const d = b.domain || 'unknown';
      let stat = map.get(d);
      if (!stat) {
        stat = {
          domain: d,
          count: 0,
          folders: new Set(),
          duplicateCount: domainDupMap.get(d) || 0,
          sampleFavicon: b.favicon
        };
        map.set(d, stat);
      }
      stat.count++;
      if (b.pathString) stat.folders.add(b.pathString);
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [bookmarks]);

  const filteredStats = useMemo(() => {
    if (!searchFilter.trim()) return domainStats;
    const q = searchFilter.toLowerCase();
    return domainStats.filter((d) => d.domain.includes(q));
  }, [domainStats, searchFilter]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Top Domains & Sites</h2>
          <p style={styles.subtitle}>
            Analyzing {domainStats.length} unique domains across {bookmarks.length} bookmarks
          </p>
        </div>

        <div style={styles.searchBox}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter domains..."
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.grid}>
        {filteredStats.map((item, idx) => (
          <div
            key={item.domain}
            style={styles.card}
            onClick={() => onFilterDomain(item.domain)}
            title={`View all bookmarks from ${item.domain}`}
          >
            <div style={styles.cardHeader}>
              <div style={styles.domainInfo}>
                <span style={styles.rank}>#{idx + 1}</span>
                <span style={styles.domainName}>{item.domain}</span>
              </div>
              <span style={styles.countBadge}>{item.count} items</span>
            </div>

            <div style={styles.cardDetails}>
              <div style={styles.metaRow}>
                <span style={styles.metaLabel}>Folders:</span>
                <span style={styles.metaValue}>{item.folders.size} locations</span>
              </div>

              {item.duplicateCount > 0 && (
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Duplicates:</span>
                  <span style={{ ...styles.metaValue, color: 'var(--warning-text)', fontWeight: 600 }}>
                    {item.duplicateCount} redundant
                  </span>
                </div>
              )}
            </div>

            <div style={styles.cardFooter}>
              <span style={styles.viewLink}>
                Filter Bookmarks <ArrowRight size={12} style={{ marginLeft: 4 }} />
              </span>
            </div>
          </div>
        ))}
      </div>
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
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '0 10px',
    height: 34,
    gap: 8,
    width: 220
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: 12,
    color: 'var(--text-primary)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12
  },
  card: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, background-color 0.15s ease'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  domainInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0
  },
  rank: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)'
  },
  domainName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  countBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--accent-light)',
    color: 'var(--accent-text)'
  },
  cardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-secondary)'
  },
  metaLabel: {
    color: 'var(--text-muted)'
  },
  metaValue: {
    color: 'var(--text-secondary)'
  },
  cardFooter: {
    borderTop: '1px solid var(--border-subtle)',
    paddingTop: 8,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  viewLink: {
    fontSize: 11,
    color: 'var(--accent-text)',
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 500
  }
};
