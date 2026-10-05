import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle2, ShieldCheck, Folder } from 'lucide-react';
import { BookmarkFolder } from '../types/bookmark';
import { BookmarkService } from '../services/bookmarks';
import { BackupService } from '../services/backup';

interface EmptyFolderViewProps {
  onRefresh: () => void;
}

export const EmptyFolderView: React.FC<EmptyFolderViewProps> = ({ onRefresh }) => {
  const [emptyFolders, setEmptyFolders] = useState<BookmarkFolder[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadEmptyFolders = async () => {
    try {
      const list = await BookmarkService.findEmptyFolders();
      setEmptyFolders(list);
      setSelectedFolderIds(new Set());
    } catch (e) {
      console.error('Failed loading empty folders', e);
    }
  };

  useEffect(() => {
    loadEmptyFolders();
  }, []);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedFolderIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFolderIds(next);
  };

  const deleteFolders = async (ids: string[]) => {
    if (ids.length === 0) return;
    setIsProcessing(true);
    try {
      await BackupService.createBackup('Pre-Empty Folder Cleanup Safety Backup', true);
      for (const id of ids) {
        await BookmarkService.remove(id);
      }
      setSuccessMessage(`Successfully removed ${ids.length} empty folder(s). Safety backup saved.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadEmptyFolders();
      onRefresh();
    } catch (e) {
      console.error('Failed deleting empty folders', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Empty Folders</h2>
          <p style={styles.subtitle}>
            Detect and remove lingering empty folders to keep your hierarchy lean
          </p>
        </div>

        {emptyFolders.length > 0 && (
          <div style={styles.topActions}>
            {selectedFolderIds.size > 0 && (
              <button
                onClick={() => deleteFolders(Array.from(selectedFolderIds))}
                disabled={isProcessing}
                style={styles.dangerBtn}
              >
                <Trash2 size={14} style={{ marginRight: 6 }} />
                Delete Selected ({selectedFolderIds.size})
              </button>
            )}

            <button
              onClick={() => deleteFolders(emptyFolders.map((f) => f.id))}
              disabled={isProcessing}
              style={styles.primaryBtn}
            >
              <Trash2 size={14} style={{ marginRight: 6 }} />
              Delete All Empty Folders ({emptyFolders.length})
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

      {emptyFolders.length === 0 ? (
        <div style={styles.emptyState}>
          <CheckCircle2 size={48} style={{ color: 'var(--success-text)', marginBottom: 12 }} />
          <h3 style={styles.emptyTitle}>No empty folders found!</h3>
          <p style={styles.emptyText}>All of your bookmark folders currently contain bookmarks or active subfolders.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {emptyFolders.map((f) => {
            const isChecked = selectedFolderIds.has(f.id);
            return (
              <div
                key={f.id}
                style={{ ...styles.row, ...(isChecked ? styles.rowChecked : {}) }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelect(f.id)}
                  style={styles.checkbox}
                />
                <Folder size={16} style={{ color: 'var(--text-muted)' }} />
                <div style={styles.folderInfo}>
                  <span style={styles.folderTitle}>{f.title}</span>
                  <span style={styles.folderPath}>Path: {f.path.join(' / ') || 'Root'}</span>
                </div>
                <button
                  onClick={() => deleteFolders([f.id])}
                  style={styles.deleteBtn}
                  title="Delete this empty folder"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    gap: 12
  },
  rowChecked: {
    backgroundColor: 'var(--danger-light)'
  },
  checkbox: {
    accentColor: 'var(--danger)',
    cursor: 'pointer'
  },
  folderInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  folderTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  folderPath: {
    fontSize: 11,
    color: 'var(--text-muted)'
  },
  deleteBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--danger-text)',
    backgroundColor: 'var(--bg-surface-elevated)'
  }
};
