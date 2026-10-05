import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  Globe,
  Wifi,
  WifiOff,
  Filter,
  RefreshCw,
  Trash2,
  FolderMinus
} from 'lucide-react';
import { BookmarkItem, OrganizationPlan, LiveInspectionResult } from '../types/bookmark';
import { BookmarkOrganizer } from '../services/organizer';
import { MetadataFetcher } from '../services/metadataFetcher';

interface OrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  minConfidence: number;
  initialFilterCategory?: string;
  onApplied: () => void;
}

export const OrganizerModal: React.FC<OrganizerModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  minConfidence,
  initialFilterCategory,
  onApplied
}) => {
  const [scope, setScope] = useState<'all' | 'other'>('all');
  
  // Options requested by user
  const [updateTitles, setUpdateTitles] = useState(true);
  const [delete404s, setDelete404s] = useState(true);
  const [reorganizeExisting, setReorganizeExisting] = useState(true);
  const [deleteEmptyFolders, setDeleteEmptyFolders] = useState(true);
  
  // Live scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    completed: number;
    total: number;
    onlineCount: number;
    offlineCount: number;
    currentUrl?: string;
  }>({
    completed: 0,
    total: 0,
    onlineCount: 0,
    offlineCount: 0
  });

  const [liveResultsMap, setLiveResultsMap] = useState<Map<string, LiveInspectionResult>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{
    success: boolean;
    count: number;
    deleted404Count: number;
    deletedEmptyFoldersCount: number;
    backupId?: string;
    errors: string[];
  } | null>(null);

  // Sync scope when modal opens (defaults to all bookmarks so bar & existing folders are categorized)
  useEffect(() => {
    if (isOpen) {
      setScope('all');
      setReorganizeExisting(true);
      setLiveResultsMap(new Map());
      setApplyResult(null);
      setIsScanning(false);
    }
  }, [isOpen, initialFilterCategory]);

  // Cancel any running scan on close
  useEffect(() => {
    if (!isOpen && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [isOpen]);

  // Filter items based on chosen scope
  const targetBookmarks = useMemo(() => {
    if (scope === 'other') {
      return bookmarks.filter((b) => {
        const c = BookmarkOrganizer.classifyBookmark(b);
        return c.category.toLowerCase() === 'reference' || c.category.toLowerCase() === 'other';
      });
    }
    return bookmarks;
  }, [bookmarks, scope]);

  // Collect offline / 404 bookmark IDs
  const offlineIds = useMemo(() => {
    const ids: string[] = [];
    liveResultsMap.forEach((res, id) => {
      if (!res.isOnline) {
        ids.push(id);
      }
    });
    return ids;
  }, [liveResultsMap]);

  // Compute organization plan
  const plan = useMemo<OrganizationPlan>(() => {
    if (!isOpen || targetBookmarks.length === 0) {
      return {
        totalAnalyzed: 0,
        willMoveCount: 0,
        duplicateCount: 0,
        brokenCount: 0,
        categoryCounts: {},
        changes: []
      };
    }

    // Exclude 404s from movement plan if user chose to delete them
    const excludeSet = delete404s && offlineIds.length > 0 ? new Set(offlineIds) : undefined;

    return BookmarkOrganizer.generatePreview(targetBookmarks, {
      minConfidence,
      reorganizeExisting,
      liveResultsMap: liveResultsMap.size > 0 ? liveResultsMap : undefined,
      exclude404Ids: excludeSet
    });
  }, [isOpen, targetBookmarks, minConfidence, liveResultsMap, reorganizeExisting, delete404s, offlineIds]);

  // Trigger live batch inspection
  const handleStartLiveScan = async () => {
    if (targetBookmarks.length === 0) return;

    abortControllerRef.current = new AbortController();
    setIsScanning(true);

    const resultMap = new Map<string, LiveInspectionResult>();
    let online = 0;
    let offline = 0;

    setScanProgress({
      completed: 0,
      total: targetBookmarks.length,
      onlineCount: 0,
      offlineCount: 0,
      currentUrl: targetBookmarks[0]?.url
    });

    try {
      await MetadataFetcher.batchInspect(targetBookmarks, {
        concurrency: 6,
        timeoutMs: 6500,
        signal: abortControllerRef.current.signal,
        onProgress: (completed, total, latest) => {
          resultMap.set(latest.bookmarkId, latest);
          if (latest.isOnline) {
            online++;
          } else {
            offline++;
          }

          setScanProgress({
            completed,
            total,
            onlineCount: online,
            offlineCount: offline,
            currentUrl: latest.url
          });

          // Incremental UI update every 10 items or on completion
          if (completed % 10 === 0 || completed === total) {
            setLiveResultsMap(new Map(resultMap));
          }
        }
      });

      setLiveResultsMap(new Map(resultMap));
    } catch (e) {
      console.warn('Scan stopped or encountered error', e);
    } finally {
      setIsScanning(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopLiveScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    MetadataFetcher.cancel();
    setIsScanning(false);
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const result = await BookmarkOrganizer.applyOrganization(plan, {
        updateTitles,
        delete404Ids: delete404s ? offlineIds : undefined,
        deleteEmptyFolders
      });

      setApplyResult({
        success: result.success,
        count: result.movedCount,
        deleted404Count: result.deleted404Count,
        deletedEmptyFoldersCount: result.deletedEmptyFoldersCount,
        backupId: result.backupId,
        errors: result.errors
      });
      onApplied();
    } catch (err) {
      console.error('Failed applying organization', err);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  const otherCount = bookmarks.filter(
    (b) => BookmarkOrganizer.classifyBookmark(b).category.toLowerCase() === 'reference' || BookmarkOrganizer.classifyBookmark(b).category.toLowerCase() === 'other'
  ).length;

  const percentComplete =
    scanProgress.total > 0
      ? Math.round((scanProgress.completed / scanProgress.total) * 100)
      : 0;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitleRow}>
            <div style={styles.iconBadge}>
              <Sparkles size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h3 style={styles.title}>Smart Bookmark Organizer & Live Web Inspector</h3>
              <p style={styles.subtitle}>
                Single consolidated folders (Development, Social Media), 404 cleanup, and empty folder removal
              </p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Close modal">
            <X size={18} />
          </button>
        </div>

        {applyResult ? (
          <div style={styles.resultBody}>
            <CheckCircle2 size={52} style={{ color: 'var(--success-text)', marginBottom: 16 }} />
            <h4 style={styles.resultTitle}>Organization Completed!</h4>
            
            <div style={styles.summaryBadgesList}>
              <div style={styles.summaryBadgeItem}>
                <span style={styles.summaryNum}>{applyResult.count}</span>
                <span style={styles.summaryLabel}>Bookmarks organized into clean folders</span>
              </div>
              {applyResult.deleted404Count > 0 && (
                <div style={{ ...styles.summaryBadgeItem, borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                  <span style={{ ...styles.summaryNum, color: '#ef4444' }}>{applyResult.deleted404Count}</span>
                  <span style={styles.summaryLabel}>Broken / 404 links deleted</span>
                </div>
              )}
              {applyResult.deletedEmptyFoldersCount > 0 && (
                <div style={{ ...styles.summaryBadgeItem, borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                  <span style={{ ...styles.summaryNum, color: '#10b981' }}>{applyResult.deletedEmptyFoldersCount}</span>
                  <span style={styles.summaryLabel}>Empty folders cleaned</span>
                </div>
              )}
            </div>

            {applyResult.errors && applyResult.errors.length > 0 && (
              <div style={{ ...styles.safetyCard, borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, width: '100%' }}>
                <strong style={{ color: '#ef4444' }}>
                  {applyResult.errors.length} Notice(s) during execution:
                </strong>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)' }}>
                  {applyResult.errors.slice(0, 5).map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                  {applyResult.errors.length > 5 && (
                    <li>...and {applyResult.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            <div style={styles.safetyCard}>
              <ShieldCheck size={18} style={{ color: 'var(--success-text)' }} />
              <span>
                Safety snapshot created in local storage. You can undo anytime from the <strong>Backups</strong> tab.
              </span>
            </div>
            <button onClick={onClose} style={styles.primaryBtn}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={styles.body}>
              {/* Scope Selector */}
              <div style={styles.scopeBar}>
                <div style={styles.scopeLabels}>
                  <Filter size={15} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Scope:</span>
                </div>
                <div style={styles.scopeBtns}>
                  <button
                    style={{
                      ...styles.scopeBtn,
                      ...(scope === 'all' ? styles.scopeBtnActive : {})
                    }}
                    onClick={() => setScope('all')}
                  >
                    All Bookmarks ({bookmarks.length} in bar & folders)
                  </button>
                  <button
                    style={{
                      ...styles.scopeBtn,
                      ...(scope === 'other' ? styles.scopeBtnActive : {})
                    }}
                    onClick={() => setScope('other')}
                  >
                    Only "Other" / Uncategorized ({otherCount})
                  </button>
                </div>
              </div>

              {/* Live Web Inspection Card */}
              <div style={styles.liveCard}>
                <div style={styles.liveCardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={styles.globeBadge}>
                      <Globe size={18} style={{ color: '#0ea5e9' }} />
                    </div>
                    <div>
                      <h4 style={styles.liveCardTitle}>Live URL Inspection & Meta-Analysis</h4>
                      <p style={styles.liveCardDesc}>
                        Visits each URL to check if it's online, extract real page titles & meta-descriptions, and identify 404 links for cleanup.
                      </p>
                    </div>
                  </div>

                  {!isScanning ? (
                    <button
                      onClick={handleStartLiveScan}
                      disabled={targetBookmarks.length === 0}
                      style={styles.liveScanBtn}
                    >
                      <RefreshCw size={14} />
                      {liveResultsMap.size > 0 ? 'Re-scan Live' : 'Start Live Scan'}
                    </button>
                  ) : (
                    <button onClick={handleStopLiveScan} style={styles.stopScanBtn}>
                      <X size={14} />
                      Stop Scan
                    </button>
                  )}
                </div>

                {/* Progress Bar & Status */}
                {isScanning && (
                  <div style={styles.scanStatusBox}>
                    <div style={styles.progressBarWrap}>
                      <div
                        style={{
                          ...styles.progressBarFill,
                          width: `${percentComplete}%`
                        }}
                      />
                    </div>
                    <div style={styles.scanStatsRow}>
                      <span style={styles.scanProgressText}>
                        <Loader2 size={13} className="spin" style={{ display: 'inline', marginRight: 6 }} />
                        Inspecting: <strong>{scanProgress.completed}</strong> / {scanProgress.total} ({percentComplete}%)
                      </span>
                      <div style={styles.scanPillsRow}>
                        <span style={styles.onlinePill}>
                          <Wifi size={12} /> {scanProgress.onlineCount} Online
                        </span>
                        <span style={styles.offlinePill}>
                          <WifiOff size={12} /> {scanProgress.offlineCount} Offline / 404
                        </span>
                      </div>
                    </div>
                    {scanProgress.currentUrl && (
                      <div style={styles.currentUrlPreview}>
                        Current: {scanProgress.currentUrl}
                      </div>
                    )}
                  </div>
                )}

                {/* Scan Completed Summary */}
                {!isScanning && liveResultsMap.size > 0 && (
                  <div style={styles.scanSummaryRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={styles.onlinePill}>
                        <Wifi size={12} /> {scanProgress.onlineCount} Verified Online
                      </span>
                      {scanProgress.offlineCount > 0 && (
                        <span style={styles.offlinePill}>
                          <WifiOff size={12} /> {scanProgress.offlineCount} Broken / 404 Links
                        </span>
                      )}
                    </div>
                    <span style={styles.metadataVerifiedBadge}>
                      ✓ Live page metadata injected for high-precision categorization
                    </span>
                  </div>
                )}
              </div>

              {/* Options Section */}
              <div style={styles.optionsContainer}>
                <div style={styles.optionsHeader}>ORGANIZATION & CLEANUP OPTIONS</div>
                
                {/* 1. Single Folder Guarantee Notice */}
                <div style={styles.consolidateNotice}>
                  <FolderMinus size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span>
                    <strong>Clean Structure:</strong> Exactly one folder per category (<code>Development</code>, <code>Social Media</code>, <code>Design</code>, etc.) without nested subfolders.
                  </span>
                </div>

                {/* 2. Delete 404s Toggle */}
                <label style={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={delete404s}
                    onChange={(e) => setDelete404s(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Trash2 size={14} style={{ color: '#ef4444' }} />
                    <span style={{ fontWeight: 600 }}>Bulk delete broken / 404 links</span>
                    {offlineIds.length > 0 && (
                      <span style={styles.redCountBadge}>
                        {offlineIds.length} detected for deletion
                      </span>
                    )}
                  </div>
                </label>

                {/* 3. Reorganize Existing Folders Toggle */}
                <label style={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={reorganizeExisting}
                    onChange={(e) => setReorganizeExisting(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <div>
                    <span style={{ fontWeight: 600 }}>Reorganize bookmarks already in other folders</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                      When enabled, evaluates old bookmarks and moves them into their proper consolidated categories.
                    </span>
                  </div>
                </label>

                {/* 4. Delete Empty Folders Toggle */}
                <label style={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={deleteEmptyFolders}
                    onChange={(e) => setDeleteEmptyFolders(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <div>
                    <span style={{ fontWeight: 600 }}>Delete folders left empty after moving bookmarks</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                      Removes orphan or obsolete folders to keep your bookmarks bar clean.
                    </span>
                  </div>
                </label>

                {/* 5. Update Titles with Real Web Titles */}
                <label style={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={updateTitles}
                    onChange={(e) => setUpdateTitles(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <div>
                    <span style={{ fontWeight: 600 }}>Update bookmark titles with real verified page titles from the web</span>
                  </div>
                </label>
              </div>

              {/* Statistics Grid */}
              <div style={styles.statGrid}>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{plan.totalAnalyzed}</span>
                  <span style={styles.statLabel}>Bookmarks Analyzed</span>
                </div>
                <div style={styles.statCard}>
                  <span style={{ ...styles.statValue, color: 'var(--accent)' }}>
                    {plan.willMoveCount}
                  </span>
                  <span style={styles.statLabel}>To Move to Clean Folders</span>
                </div>
                <div style={styles.statCard}>
                  <span style={{ ...styles.statValue, color: delete404s && offlineIds.length > 0 ? '#ef4444' : '#10b981' }}>
                    {delete404s ? offlineIds.length : 0}
                  </span>
                  <span style={styles.statLabel}>404 Links to Delete</span>
                </div>
              </div>

              {/* Category Pills */}
              <div style={styles.categoriesWrap}>
                {Object.entries(plan.categoryCounts).map(([cat, count]) => {
                  const isOther = cat.toLowerCase() === 'other';
                  return (
                    <span
                      key={cat}
                      style={{
                        ...styles.categoryBadge,
                        borderColor: isOther ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)',
                        backgroundColor: isOther ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface)'
                      }}
                    >
                      <strong style={{ color: isOther ? '#ef4444' : 'var(--text-primary)' }}>{cat}</strong>: {count}
                    </span>
                  );
                })}
              </div>

              {/* Proposed Changes Preview */}
              <div style={styles.changesSection}>
                <div style={styles.changesHeader}>
                  PROPOSED CHANGES ({plan.changes.length})
                </div>

                <div style={styles.changesList}>
                  {plan.changes.slice(0, 60).map((change) => {
                    const isLiveVerified = change.matchedRule.includes('Live metadata') || change.matchedRule.includes('Live Scan');

                    return (
                      <div key={change.bookmarkId} style={styles.changeItem}>
                        <div style={styles.changeMain}>
                          <div style={styles.titleRow}>
                            <span style={styles.changeTitle}>{change.title}</span>
                            {isLiveVerified && (
                              <span style={styles.liveTag}>
                                <Globe size={10} /> Live Verified
                              </span>
                            )}
                          </div>
                          <div style={styles.pathCompare}>
                            <span style={styles.pathFrom}>{change.currentPath}</span>
                            <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ ...styles.pathTo, color: 'var(--accent)' }}>
                              📁 {change.suggestedFolder}
                            </span>
                          </div>
                        </div>
                        <div style={styles.confidenceTag}>
                          {change.confidence}% match
                        </div>
                      </div>
                    );
                  })}

                  {plan.changes.length > 60 && (
                    <div style={styles.moreChanges}>
                      + {plan.changes.length - 60} more bookmarks will be moved into their single clean folders
                    </div>
                  )}

                  {plan.changes.length === 0 && (
                    <div style={styles.cleanState}>
                      No bookmarks pending move with the current options.
                    </div>
                  )}
                </div>
              </div>

              {/* Safety notice banner */}
              <div style={styles.safetyNotice}>
                <ShieldCheck size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={styles.safetyText}>
                  <strong>Zero Risk Guarantee:</strong> An automatic safety snapshot will be stored in IndexedDB before applying any changes or deletions. You can revert everything with a single click in Backups.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
              <button onClick={onClose} style={styles.secondaryBtn} disabled={isApplying || isScanning}>
                Cancel
              </button>

              <button
                onClick={handleApply}
                disabled={isApplying || isScanning || (plan.changes.length === 0 && (!delete404s || offlineIds.length === 0))}
                style={{
                  ...styles.primaryBtn,
                  opacity: (plan.changes.length === 0 && (!delete404s || offlineIds.length === 0)) || isScanning ? 0.5 : 1
                }}
              >
                {isApplying ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ marginRight: 8 }} />
                    Applying organization & cleanup...
                  </>
                ) : (
                  `Apply Changes (${plan.willMoveCount} to move${delete404s && offlineIds.length > 0 ? `, ${offlineIds.length} to delete` : ''})`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 20
  },
  modal: {
    width: 760,
    maxHeight: '92vh',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 22px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-surface)'
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0
  },
  subtitle: {
    fontSize: 12,
    color: 'var(--text-muted)',
    margin: '3px 0 0 0'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: 6,
    borderRadius: 6
  },
  body: {
    padding: 22,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  scopeBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)'
  },
  scopeLabels: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-secondary)'
  },
  scopeBtns: {
    display: 'flex',
    gap: 6
  },
  scopeBtn: {
    padding: '5px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-secondary)'
  },
  scopeBtnActive: {
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
    fontWeight: 600
  },
  liveCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid rgba(14, 165, 233, 0.3)',
    borderRadius: 'var(--radius-md)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  liveCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14
  },
  globeBadge: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  liveCardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0
  },
  liveCardDesc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    margin: '3px 0 0 0',
    lineHeight: 1.4
  },
  liveScanBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: '#0ea5e9',
    color: '#ffffff',
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0
  },
  stopScanBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0
  },
  scanStatusBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    backgroundColor: 'var(--bg-app)',
    padding: 12,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)'
  },
  progressBarWrap: {
    height: 6,
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    transition: 'width 0.2s ease'
  },
  scanStatsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12
  },
  scanProgressText: {
    color: 'var(--text-primary)'
  },
  scanPillsRow: {
    display: 'flex',
    gap: 8
  },
  onlinePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: '2px 8px',
    borderRadius: 10
  },
  offlinePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: '2px 8px',
    borderRadius: 10
  },
  currentUrlPreview: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  scanSummaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-app)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)'
  },
  metadataVerifiedBadge: {
    fontSize: 11,
    color: '#0ea5e9',
    fontWeight: 600
  },
  optionsContainer: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  optionsHeader: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    marginBottom: 2
  },
  consolidateNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-secondary)',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)'
  },
  checkboxOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 12,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '4px 0'
  },
  checkbox: {
    marginTop: 2,
    cursor: 'pointer'
  },
  redCountBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: '2px 6px',
    borderRadius: 8
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12
  },
  statCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statValue: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--text-primary)'
  },
  statLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 2
  },
  categoriesWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    maxHeight: 84,
    overflowY: 'auto'
  },
  categoryBadge: {
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: 20,
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)'
  },
  changesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  changesHeader: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: 'var(--text-muted)'
  },
  changesList: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    maxHeight: 200,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  changeItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border-color)',
    gap: 12
  },
  changeMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
    flex: 1
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  changeTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  liveTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10,
    fontWeight: 600,
    color: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    padding: '1px 6px',
    borderRadius: 10,
    flexShrink: 0
  },
  pathCompare: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11
  },
  pathFrom: {
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 220
  },
  pathTo: {
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  confidenceTag: {
    fontSize: 11,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-app)',
    padding: '3px 8px',
    borderRadius: 4,
    flexShrink: 0
  },
  moreChanges: {
    padding: '10px 0',
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--text-muted)'
  },
  cleanState: {
    padding: '30px 0',
    textAlign: 'center',
    fontSize: 13,
    color: 'var(--text-muted)'
  },
  safetyNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px'
  },
  safetyText: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.4
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '14px 22px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-surface)'
  },
  secondaryBtn: {
    padding: '8px 18px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer'
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 20px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  },
  resultBody: {
    padding: '40px 30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 16
  },
  summaryBadgesList: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  summaryBadgeItem: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  summaryNum: {
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--text-primary)'
  },
  summaryLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 2
  },
  safetyCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    marginBottom: 24
  }
};
