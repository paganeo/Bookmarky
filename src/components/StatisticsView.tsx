import React, { useMemo } from 'react';
import { Bookmark, Folder, Copy, Globe, Clock, Sparkles } from 'lucide-react';
import { BookmarkItem, BookmarkFolder } from '../types/bookmark';
import { BookmarkOrganizer } from '../services/organizer';
import { DuplicateScanner } from '../services/duplicates';

interface StatisticsViewProps {
  bookmarks: BookmarkItem[];
  folders: BookmarkFolder[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ bookmarks, folders }) => {
  const stats = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 1000 * 60 * 60 * 24 * 30;

    let addedThisMonth = 0;
    const domainSet = new Set<string>();
    let unsortedCount = 0;

    const categoryCounts: Record<string, number> = {};

    for (const b of bookmarks) {
      if (b.domain) domainSet.add(b.domain);
      if (b.dateAdded && b.dateAdded >= thirtyDaysAgo) addedThisMonth++;
      if (b.path.length <= 1) unsortedCount++;

      const classification = BookmarkOrganizer.classifyBookmark(b);
      categoryCounts[classification.category] = (categoryCounts[classification.category] || 0) + 1;
    }

    const duplicates = DuplicateScanner.findDuplicates(bookmarks);
    const duplicateCount = duplicates.reduce((acc, g) => acc + (g.items.length - 1), 0);

    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

    return {
      totalBookmarks: bookmarks.length,
      totalFolders: folders.length,
      duplicateCount,
      uniqueDomains: domainSet.size,
      unsortedCount,
      addedThisMonth,
      categories: sortedCategories
    };
  }, [bookmarks, folders]);

  const maxCategoryCount = stats.categories.length > 0 ? stats.categories[0][1] : 1;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Bookmark Statistics & Insights</h2>
        <p style={styles.subtitle}>High-level breakdown of your library structure and growth</p>
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIconWrap}>
            <Bookmark size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <span style={styles.metricVal}>{stats.totalBookmarks}</span>
          <span style={styles.metricLabel}>Total Bookmarks</span>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconWrap}>
            <Folder size={18} style={{ color: 'var(--accent-text)' }} />
          </div>
          <span style={styles.metricVal}>{stats.totalFolders}</span>
          <span style={styles.metricLabel}>Folders</span>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconWrap}>
            <Copy size={18} style={{ color: 'var(--warning-text)' }} />
          </div>
          <span style={{ ...styles.metricVal, color: stats.duplicateCount > 0 ? 'var(--warning-text)' : 'inherit' }}>
            {stats.duplicateCount}
          </span>
          <span style={styles.metricLabel}>Duplicates</span>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconWrap}>
            <Globe size={18} style={{ color: '#38bdf8' }} />
          </div>
          <span style={styles.metricVal}>{stats.uniqueDomains}</span>
          <span style={styles.metricLabel}>Unique Domains</span>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconWrap}>
            <Clock size={18} style={{ color: 'var(--success-text)' }} />
          </div>
          <span style={styles.metricVal}>{stats.addedThisMonth}</span>
          <span style={styles.metricLabel}>Added Last 30 Days</span>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIconWrap}>
            <Sparkles size={18} style={{ color: '#ec4899' }} />
          </div>
          <span style={styles.metricVal}>{stats.unsortedCount}</span>
          <span style={styles.metricLabel}>Unsorted in Root</span>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Category Distribution</h3>
        <div style={styles.categoryBars}>
          {stats.categories.map(([category, count]) => {
            const percent = Math.round((count / (stats.totalBookmarks || 1)) * 100);
            const barWidth = Math.round((count / maxCategoryCount) * 100);

            return (
              <div key={category} style={styles.barRow}>
                <div style={styles.barLabelRow}>
                  <span style={styles.barName}>{category}</span>
                  <span style={styles.barCount}>
                    {count} bookmarks ({percent}%)
                  </span>
                </div>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: `${barWidth}%` }} />
                </div>
              </div>
            );
          })}
        </div>
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
    marginBottom: 24
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 28
  },
  metricCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  metricIconWrap: {
    marginBottom: 2
  },
  metricVal: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  metricLabel: {
    fontSize: 12,
    color: 'var(--text-muted)'
  },
  section: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 16
  },
  categoryBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  barRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  barLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12
  },
  barName: {
    fontWeight: 500,
    color: 'var(--text-primary)'
  },
  barCount: {
    color: 'var(--text-muted)'
  },
  barTrack: {
    height: 8,
    backgroundColor: 'var(--bg-app)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    backgroundColor: 'var(--accent)',
    borderRadius: 4,
    transition: 'width 0.3s ease'
  }
};
