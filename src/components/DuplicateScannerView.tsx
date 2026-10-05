import React, { useState, useMemo } from 'react';
import { Trash2, CheckCircle, ExternalLink, ShieldCheck, Check } from 'lucide-react';
import { BookmarkItem, DuplicateGroup } from '../types/bookmark';
import { DuplicateScanner } from '../services/duplicates';
import { BookmarkService } from '../services/bookmarks';
import { BackupService } from '../services/backup';

interface DuplicateScannerViewProps {
  bookmarks: BookmarkItem[];
  onRefresh: () => void;
}

export const DuplicateScannerView: React.FC<DuplicateScannerViewProps> = ({
  bookmarks,
  onRefresh
}) => {
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const duplicateGroups = useMemo<DuplicateGroup[]>(() => {
    return DuplicateScanner.findDuplicates(bookmarks);
  }, [bookmarks]);

  const totalDuplicatesCount = useMemo(() => {
    return duplicateGroups.reduce((acc, g) => acc + (g.items.length - 1), 0);
  }, [duplicateGroups]);

  const toggleSelectToDelete = (id: string) => {
    const next = new Set(selectedToDelete);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedToDelete(next);
  };

  const handleKeepFirstInGroup = async (group: DuplicateGroup) => {
    const idsToRemove = DuplicateScanner.getIdsToRemoveKeepingFirst(group);
    await removeBookmarkIds(idsToRemove, `Removed ${idsToRemove.length} duplicate copy`);
  };

  const handleKeepNewestInGroup = async (group: DuplicateGroup) => {
    const idsToRemove = DuplicateScanner.getIdsToRemoveKeepingNewest(group);
    await removeBookmarkIds(idsToRemove, `Removed ${idsToRemove.length} duplicate copy`);
  };

  const handleResolveAllKeepFirst = async () => {
    const allIdsToRemove: string[] = [];
    for (const group of duplicateGroups) {
      allIdsToRemove.push(...DuplicateScanner.getIdsToRemoveKeepingFirst(group));
    }
    if (allIdsToRemove.length === 0) return;

    await removeBookmarkIds(allIdsToRemove, `Cleaned ${allIdsToRemove.length} duplicate bookmarks`);
  };

  const handleDeleteSelected = async () => {
    if (selectedToDelete.size === 0) return;
    await removeBookmarkIds(Array.from(selectedToDelete), `Deleted ${selectedToDelete.size} selected duplicates`);
    setSelectedToDelete(new Set());
  };

  const removeBookmarkIds = async (ids: string[], message: string) => {
    setIsProcessing(true);
    try {
      // Create automatic safety backup first!
      await BackupService.createBackup('Pre-Duplicate Cleanup Safety Backup', true);

      for (const id of ids) {
        await BookmarkService.remove(id);
      }
      setSuccessMessage(`${message}. Automatic safety backup created.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      onRefresh();
    } catch (e: any) {
      console.error('Error removing duplicates', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Duplicate Bookmarks</h2>
          <p style={styles.subtitle}>
            {duplicateGroups.length > 0
              ? `Found ${duplicateGroups.length} duplicate groups (${totalDuplicatesCount} redundant bookmarks)`
              : 'Detect and eliminate duplicate URLs and tracking variants'}
          </p>
        </div>

        {duplicateGroups.length > 0 && (
          <div style={styles.topActions}>
            {selectedToDelete.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isProcessing}
                style={styles.dangerBtn}
              >
                <Trash2 size={14} style={{ marginRight: 6 }} />
                Delete Selected ({selectedToDelete.size})
              </button>
            )}

            <button
              onClick={handleResolveAllKeepFirst}
              disabled={isProcessing}
              style={styles.primaryBtn}
            >
              <Check size={14} style={{ marginRight: 6 }} />
              Auto-Clean All (Keep Oldest)
            </button>
          </div>
        )}
      </div>

      {successMessage && (
        <div style={styles.successBanner}>
          <ShieldCheck size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {duplicateGroups.length === 0 ? (
        <div style={styles.emptyState}>
          <CheckCircle size={48} style={{ color: 'var(--success-text)', marginBottom: 12 }} />
          <h3 style={styles.emptyTitle}>No duplicates found!</h3>
          <p style={styles.emptyText}>
            Your bookmark collection is clean. No exact or tracking parameter duplicates were detected.
          </p>
        </div>
      ) : (
        <div style={styles.groupList}>
          {duplicateGroups.map((group) => (
            <div key={group.id} style={styles.groupCard}>
              <div style={styles.groupHeader}>
                <div style={styles.groupInfo}>
                  <div style={styles.groupTitleRow}>
                    <span style={styles.groupTitle}>{group.title}</span>
                    <span style={styles.typeBadge}>
                      {group.type === 'exact' ? 'Exact Match' : 'Normalized Match'}
                    </span>
                    <span style={styles.countBadge}>{group.items.length} copies</span>
                  </div>
                  <span style={styles.groupUrl}>{group.displayUrl}</span>
                </div>

                <div style={styles.groupActions}>
                  <button
                    onClick={() => handleKeepFirstInGroup(group)}
                    style={styles.actionBtn}
                    title="Keep oldest and delete other copies"
                  >
                    Keep Oldest
                  </button>
                  <button
                    onClick={() => handleKeepNewestInGroup(group)}
                    style={styles.actionBtn}
                    title="Keep newest and delete other copies"
                  >
                    Keep Newest
                  </button>
                </div>
              </div>

              <div style={styles.itemsList}>
                {group.items.map((item, idx) => {
                  const isChecked = selectedToDelete.has(item.id);
                  const dateStr = item.dateAdded
                    ? new Date(item.dateAdded).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Unknown date';

                  return (
                    <div
                      key={item.id}
                      style={{
                        ...styles.itemRow,
                        ...(isChecked ? styles.itemRowChecked : {})
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectToDelete(item.id)}
                        style={styles.checkbox}
                      />
                      <span style={styles.itemIndex}>#{idx + 1}</span>
                      <div style={styles.itemMeta}>
                        <span style={styles.itemPath}>Location: {item.pathString}</span>
                        <span style={styles.itemSubUrl}>{item.url}</span>
                      </div>
                      <span style={styles.itemDate}>{dateStr}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.iconLink}
                        title="Open in new tab"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  );
                })}
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
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600
  },
  dangerBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--danger-light)',
    border: '1px solid var(--danger)',
    color: 'var(--danger-text)',
    fontSize: 13,
    fontWeight: 600
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--success-light)',
    border: '1px solid var(--success)',
    color: 'var(--success-text)',
    fontSize: 13,
    marginBottom: 16
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
  },
  groupList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },
  groupCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden'
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-surface-elevated)'
  },
  groupInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    minWidth: 0
  },
  groupTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  typeBadge: {
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--badge-bg)',
    color: 'var(--text-secondary)'
  },
  countBadge: {
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--warning-light)',
    color: 'var(--warning-text)',
    fontWeight: 600
  },
  groupUrl: {
    fontSize: 11,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  groupActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  actionBtn: {
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 500
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column'
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    gap: 12,
    fontSize: 12
  },
  itemRowChecked: {
    backgroundColor: 'var(--danger-light)'
  },
  checkbox: {
    accentColor: 'var(--danger)',
    cursor: 'pointer'
  },
  itemIndex: {
    color: 'var(--text-muted)',
    fontWeight: 600,
    width: 20
  },
  itemMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0
  },
  itemPath: {
    color: 'var(--text-primary)',
    fontWeight: 500
  },
  itemSubUrl: {
    color: 'var(--text-muted)',
    fontSize: 11,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  itemDate: {
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap'
  },
  iconLink: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center'
  }
};
