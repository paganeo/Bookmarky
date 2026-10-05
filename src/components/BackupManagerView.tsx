import React, { useState, useEffect } from 'react';
import {
  Database,
  RotateCcw,
  Trash2,
  Upload,
  Plus,
  ShieldCheck,
  FileCode,
  FileText,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';
import { BackupRecord } from '../types/bookmark';
import { StorageService } from '../services/storage';
import { BackupService } from '../services/backup';
import { RestoreService, ParsedBookmarkImport } from '../services/restore';

interface BackupManagerViewProps {
  onRefresh: () => void;
}

export const BackupManagerView: React.FC<BackupManagerViewProps> = ({ onRefresh }) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Restore Modal State
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);

  // Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importParsed, setImportParsed] = useState<ParsedBookmarkImport | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const loadBackups = async () => {
    try {
      const list = await StorageService.getAllBackups();
      setBackups(list);
    } catch (e) {
      console.error('Failed loading backups', e);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsProcessing(true);
    try {
      await BackupService.createBackup('Manual User Backup', false);
      setSuccessMessage('New backup snapshot created successfully.');
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadBackups();
    } catch (e) {
      console.error('Failed creating backup', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    try {
      await StorageService.deleteBackup(id);
      await loadBackups();
    } catch (e) {
      console.error('Failed deleting backup', e);
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreTarget) return;
    setIsProcessing(true);
    try {
      const res = await RestoreService.restore(restoreTarget.bookmarksTree, 'replace');
      setSuccessMessage(
        `Successfully restored ${res.restoredBookmarks} bookmarks and ${res.restoredFolders} folders. Safety snapshot created.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      setRestoreTarget(null);
      await loadBackups();
      onRefresh();
    } catch (e: any) {
      console.error('Restore failed', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);
    setImportParsed(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = RestoreService.parseBackupFile(text);
        setImportParsed(parsed);
      } catch (err: any) {
        setImportError(err.message || 'Failed parsing file');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importParsed) return;
    setIsProcessing(true);
    try {
      const res = await RestoreService.restore(importParsed.tree, importMode);
      setSuccessMessage(
        `Import complete! Restored ${res.restoredBookmarks} bookmarks in ${importMode} mode.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsImportOpen(false);
      setImportParsed(null);
      await loadBackups();
      onRefresh();
    } catch (err: any) {
      setImportError(`Import failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Backups & Restore</h2>
          <p style={styles.subtitle}>
            Local snapshots, standard Netscape HTML exports, and zero-data-loss rollback safety
          </p>
        </div>

        <div style={styles.topActions}>
          <button
            onClick={() => setIsImportOpen(true)}
            style={styles.secondaryBtn}
            disabled={isProcessing}
          >
            <Upload size={14} style={{ marginRight: 6 }} />
            Import Backup
          </button>

          <button
            onClick={handleCreateBackup}
            style={styles.primaryBtn}
            disabled={isProcessing}
          >
            <Plus size={14} style={{ marginRight: 6 }} />
            Create Backup
          </button>
        </div>
      </div>

      {successMessage && (
        <div style={styles.successBanner}>
          <ShieldCheck size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Backups List */}
      <div style={styles.list}>
        {backups.length === 0 ? (
          <div style={styles.emptyState}>
            <Database size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3 style={styles.emptyTitle}>No backups recorded yet</h3>
            <p style={styles.emptyText}>
              Click "Create Backup" above to save your first snapshot. Automated backups will also be saved prior to reorganizations or cleanups.
            </p>
          </div>
        ) : (
          backups.map((b) => {
            const date = new Date(b.createdAt);
            const dateFormatted = date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={b.id} style={styles.backupCard}>
                <div style={styles.cardLeft}>
                  <div style={styles.cardTitleRow}>
                    <span style={styles.cardTitle}>{b.label || 'Snapshot'}</span>
                    {b.isAutoSafety && (
                      <span style={styles.safetyTag}>
                        <ShieldCheck size={11} style={{ marginRight: 3 }} />
                        Safety Snapshot
                      </span>
                    )}
                  </div>

                  <div style={styles.cardMeta}>
                    <span>{dateFormatted}</span>
                    <span>•</span>
                    <span><strong>{b.totalBookmarks}</strong> bookmarks</span>
                    <span>•</span>
                    <span><strong>{b.totalFolders}</strong> folders</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{b.browser}</span>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <button
                    onClick={() => BackupService.downloadJson(b)}
                    style={styles.actionBtn}
                    title="Download Bookmarky JSON"
                  >
                    <FileCode size={13} style={{ marginRight: 4 }} />
                    JSON
                  </button>

                  <button
                    onClick={() => BackupService.downloadHtml(b)}
                    style={styles.actionBtn}
                    title="Download Netscape HTML"
                  >
                    <FileText size={13} style={{ marginRight: 4 }} />
                    HTML
                  </button>

                  <button
                    onClick={() => setRestoreTarget(b)}
                    style={styles.restoreBtn}
                    title="Restore this snapshot"
                  >
                    <RotateCcw size={13} style={{ marginRight: 4 }} />
                    Restore
                  </button>

                  <button
                    onClick={() => handleDeleteBackup(b.id)}
                    style={styles.deleteBtn}
                    title="Delete backup"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Restore */}
      {restoreTarget && (
        <div style={styles.modalOverlay} onClick={() => setRestoreTarget(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleRow}>
                <AlertTriangle size={18} style={{ color: 'var(--warning-text)' }} />
                <h3 style={styles.modalTitle}>Restore Backup?</h3>
              </div>
              <button onClick={() => setRestoreTarget(null)} style={styles.closeBtn}>
                <X size={16} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                You are about to restore the snapshot from <strong>{new Date(restoreTarget.createdAt).toLocaleString()}</strong>.
              </p>
              <div style={styles.modalDetails}>
                <div>Backup contains: <strong>{restoreTarget.totalBookmarks}</strong> bookmarks</div>
                <div>Folders: <strong>{restoreTarget.totalFolders}</strong> folders</div>
              </div>
              <div style={styles.safetyCallout}>
                <ShieldCheck size={16} style={{ color: 'var(--success-text)', flexShrink: 0 }} />
                <span>Bookmarky will automatically take a fresh safety snapshot of your current state first. You can always roll back.</span>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setRestoreTarget(null)}
                style={styles.secondaryBtn}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                style={styles.primaryBtn}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 size={14} className="spin" /> : 'Create Safety Backup & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsImportOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Import Bookmarks File</h3>
              <button onClick={() => setIsImportOpen(false)} style={styles.closeBtn}>
                <X size={16} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Select a <strong>Bookmarky JSON</strong> or standard <strong>Netscape HTML</strong> bookmark export from Chrome, Edge, Safari, or Firefox.
              </p>

              <div style={styles.filePickerBox}>
                <input
                  type="file"
                  accept=".json,.html,.htm"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                  id="backup-file-input"
                />
                <label htmlFor="backup-file-input" style={styles.fileLabel}>
                  <Upload size={20} style={{ color: 'var(--accent)' }} />
                  <span>{importFileName || 'Choose a .json or .html backup file'}</span>
                </label>
              </div>

              {importError && (
                <div style={styles.errorAlert}>
                  <AlertTriangle size={15} />
                  <span>{importError}</span>
                </div>
              )}

              {importParsed && (
                <div style={styles.previewBox}>
                  <div style={styles.previewTitle}>Validation Successful:</div>
                  <div style={styles.previewDetails}>
                    <span>Type: <strong>{importParsed.type}</strong></span>
                    <span>Total Bookmarks: <strong>{importParsed.totalBookmarks}</strong></span>
                    <span>Total Folders: <strong>{importParsed.totalFolders}</strong></span>
                  </div>

                  <div style={styles.importModeRow}>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                      />
                      <span><strong>Merge:</strong> Add into existing hierarchy</span>
                    </label>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                      />
                      <span><strong>Replace:</strong> Overwrite current bookmarks</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setIsImportOpen(false)}
                style={styles.secondaryBtn}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={!importParsed || isProcessing}
                style={{
                  ...styles.primaryBtn,
                  opacity: !importParsed ? 0.5 : 1
                }}
              >
                {isProcessing ? <Loader2 size={14} className="spin" /> : 'Confirm Import'}
              </button>
            </div>
          </div>
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
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 500
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
    gap: 8
  },
  backupCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    gap: 16
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  safetyTag: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--accent-light)',
    color: 'var(--accent-text)',
    fontWeight: 600
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-muted)'
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 500
  },
  restoreBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--accent-light)',
    border: '1px solid var(--accent)',
    color: 'var(--accent-text)',
    fontSize: 12,
    fontWeight: 600
  },
  deleteBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--danger-text)',
    backgroundColor: 'transparent'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modalContent: {
    width: 520,
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)'
  },
  modalTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  closeBtn: {
    color: 'var(--text-muted)'
  },
  modalBody: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },
  modalText: {
    fontSize: 13,
    color: 'var(--text-secondary)'
  },
  modalDetails: {
    fontSize: 13,
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    backgroundColor: 'var(--bg-surface)',
    padding: 12,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)'
  },
  safetyCallout: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 12,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--success-light)',
    border: '1px solid var(--success)',
    padding: 10,
    borderRadius: 'var(--radius-md)'
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '14px 20px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-surface)'
  },
  filePickerBox: {
    border: '2px dashed var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 20,
    textAlign: 'center',
    backgroundColor: 'var(--bg-surface)',
    cursor: 'pointer'
  },
  fileInput: {
    display: 'none'
  },
  fileLabel: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--text-secondary)'
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--danger-light)',
    border: '1px solid var(--danger)',
    color: 'var(--danger-text)',
    fontSize: 12
  },
  previewBox: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--success-text)'
  },
  previewDetails: {
    display: 'flex',
    gap: 14,
    fontSize: 12,
    color: 'var(--text-secondary)'
  },
  importModeRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingTop: 8,
    borderTop: '1px solid var(--border-subtle)'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-primary)',
    cursor: 'pointer'
  }
};
