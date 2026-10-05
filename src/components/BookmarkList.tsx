import React, { useState, useMemo } from 'react';
import { ExternalLink, Copy, Check, Trash2, Edit3, Folder, Globe } from 'lucide-react';
import { BookmarkItem } from '../types/bookmark';

interface BookmarkListProps {
  items: BookmarkItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpen: (item: BookmarkItem, newTab?: boolean) => void;
  onEdit: (item: BookmarkItem) => void;
  onDelete: (item: BookmarkItem) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchMove: (ids: string[]) => void;
  title?: string;
  subtitle?: string;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
  items,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onOpen,
  onEdit,
  onDelete,
  onBatchDelete,
  onBatchMove,
  title,
  subtitle
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState(150);

  const displayedItems = useMemo(() => {
    return items.slice(0, pageLimit);
  }, [items, pageLimit]);

  const handleCopy = (item: BookmarkItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <div style={styles.headerBar}>
        <div>
          <h2 style={styles.title}>{title || 'Bookmarks'}</h2>
          <p style={styles.subtitle}>
            {subtitle || `${items.length} bookmarks found`}
          </p>
        </div>

        {selectedIds.size > 0 && (
          <div style={styles.batchActions}>
            <span style={styles.batchCount}>{selectedIds.size} selected</span>
            <button
              onClick={() => onBatchMove(Array.from(selectedIds))}
              style={styles.batchBtn}
            >
              Move
            </button>
            <button
              onClick={() => onBatchDelete(Array.from(selectedIds))}
              style={{ ...styles.batchBtn, color: 'var(--danger-text)' }}
            >
              Delete
            </button>
            <button onClick={onClearSelection} style={styles.batchBtnClear}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Select All Row */}
      {items.length > 0 && (
        <div style={styles.listSubheader}>
          <label style={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => (allSelected ? onClearSelection() : onSelectAll())}
              style={styles.checkbox}
            />
            <span style={styles.selectAllText}>Select all in this view</span>
          </label>
        </div>
      )}

      {/* List Items */}
      {items.length === 0 ? (
        <div style={styles.emptyState}>
          <Globe size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3 style={styles.emptyTitle}>No bookmarks found</h3>
          <p style={styles.emptyText}>
            Try modifying your search query or selecting a different folder or category from the sidebar.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {displayedItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  ...styles.row,
                  ...(isSelected ? styles.rowSelected : {})
                }}
                onClick={() => onOpen(item, false)}
              >
                <div style={styles.rowLeft} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    style={styles.checkbox}
                  />
                  <div style={styles.faviconWrapper}>
                    <img
                      src={item.favicon}
                      alt=""
                      style={styles.favicon}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                <div style={styles.rowContent}>
                  <div style={styles.rowTitleRow}>
                    <span style={styles.itemTitle}>{item.title}</span>
                    <span style={styles.domainBadge}>{item.domain}</span>
                  </div>

                  <div style={styles.metaRow}>
                    <span style={styles.pathBadge}>
                      <Folder size={11} style={{ marginRight: 4 }} />
                      {item.pathString}
                    </span>
                    <span style={styles.urlText} title={item.url}>
                      {item.url}
                    </span>
                    {item.dateAdded && (
                      <span style={styles.dateText}>{formatDate(item.dateAdded)}</span>
                    )}
                  </div>
                </div>

                <div style={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleCopy(item, e)}
                    style={styles.actionBtn}
                    title="Copy URL"
                  >
                    {isCopied ? <Check size={14} style={{ color: 'var(--success-text)' }} /> : <Copy size={14} />}
                  </button>

                  <button
                    onClick={() => onOpen(item, true)}
                    style={styles.actionBtn}
                    title="Open in new tab"
                  >
                    <ExternalLink size={14} />
                  </button>

                  <button
                    onClick={() => onEdit(item)}
                    style={styles.actionBtn}
                    title="Edit bookmark"
                  >
                    <Edit3 size={14} />
                  </button>

                  <button
                    onClick={() => onDelete(item)}
                    style={{ ...styles.actionBtn, color: 'var(--danger-text)' }}
                    title="Delete bookmark"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {items.length > pageLimit && (
            <div style={styles.loadMoreContainer}>
              <button
                onClick={() => setPageLimit((prev) => prev + 150)}
                style={styles.loadMoreBtn}
              >
                Load more bookmarks ({items.length - pageLimit} remaining)
              </button>
            </div>
          )}
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
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginTop: 2
  },
  batchActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-color)',
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)'
  },
  batchCount: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginRight: 6
  },
  batchBtn: {
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)'
  },
  batchBtnClear: {
    fontSize: 12,
    color: 'var(--text-muted)',
    padding: '4px 6px'
  },
  listSubheader: {
    padding: '6px 12px',
    borderBottom: '1px solid var(--border-subtle)',
    marginBottom: 6
  },
  selectAllLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer'
  },
  selectAllText: {
    fontSize: 12,
    color: 'var(--text-muted)'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    gap: 14,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease, border-color 0.1s ease'
  },
  rowSelected: {
    backgroundColor: 'var(--accent-light)',
    borderColor: 'var(--accent)'
  },
  rowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  checkbox: {
    cursor: 'pointer',
    accentColor: 'var(--accent)'
  },
  faviconWrapper: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: 'var(--bg-app)',
    overflow: 'hidden'
  },
  favicon: {
    width: 16,
    height: 16,
    objectFit: 'contain'
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  rowTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  domainBadge: {
    fontSize: 11,
    padding: '1px 6px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--badge-bg)',
    color: 'var(--text-secondary)'
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 12,
    color: 'var(--text-muted)',
    minWidth: 0
  },
  pathBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap'
  },
  urlText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 320
  },
  dateText: {
    marginLeft: 'auto',
    whiteSpace: 'nowrap'
  },
  rowActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  actionBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent'
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center'
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 6
  },
  emptyText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    maxWidth: 400
  },
  loadMoreContainer: {
    padding: '16px 0',
    display: 'flex',
    justifyContent: 'center'
  },
  loadMoreBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-color)',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-primary)'
  }
};
