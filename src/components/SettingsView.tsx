import React, { useState } from 'react';
import {
  Shield,
  Palette,
  Sparkles,
  Search,
  Database,
  Check,
  FlaskConical
} from 'lucide-react';
import { AppSettings, BookmarkItem } from '../types/bookmark';
import { StorageService } from '../services/storage';
import { TestDataGenerator } from '../services/testData';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onLoadTestData: (testItems: BookmarkItem[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onLoadTestData
}) => {
  const [savedNotice, setSavedNotice] = useState(false);
  const [testDataCount, setTestDataCount] = useState<number | null>(null);

  const update = async (changes: Partial<AppSettings>) => {
    const updated = await StorageService.saveSettings(changes);
    onUpdateSettings(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleGenerateTestData = (count: number) => {
    const generated = TestDataGenerator.generateBookmarks(count);
    onLoadTestData(generated);
    setTestDataCount(count);
    setTimeout(() => setTestDataCount(null), 3000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Settings & Configuration</h2>
        <p style={styles.subtitle}>Customize behavior, backup retention, and review privacy guarantees</p>
      </div>

      {savedNotice && (
        <div style={styles.saveAlert}>
          <Check size={14} />
          <span>Settings saved successfully</span>
        </div>
      )}

      {testDataCount && (
        <div style={styles.testAlert}>
          <FlaskConical size={14} />
          <span>Loaded {testDataCount.toLocaleString()} performance test bookmarks into workspace!</span>
        </div>
      )}

      <div style={styles.sectionsList}>
        {/* Appearance */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Palette size={16} style={{ color: 'var(--accent)' }} />
            <h3 style={styles.cardTitle}>Appearance & Theme</h3>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.settingRow}>
              <div>
                <div style={styles.settingLabel}>Color Theme</div>
                <div style={styles.settingDesc}>Select your preferred visual style</div>
              </div>
              <div style={styles.btnGroup}>
                <button
                  style={{ ...styles.choiceBtn, ...(settings.theme === 'system' ? styles.choiceBtnActive : {}) }}
                  onClick={() => update({ theme: 'system' })}
                >
                  System
                </button>
                <button
                  style={{ ...styles.choiceBtn, ...(settings.theme === 'dark' ? styles.choiceBtnActive : {}) }}
                  onClick={() => update({ theme: 'dark' })}
                >
                  Dark
                </button>
                <button
                  style={{ ...styles.choiceBtn, ...(settings.theme === 'light' ? styles.choiceBtnActive : {}) }}
                  onClick={() => update({ theme: 'light' })}
                >
                  Light
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Backups */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Database size={16} style={{ color: 'var(--accent)' }} />
            <h3 style={styles.cardTitle}>Backups & Safety Policies</h3>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.settingRow}>
              <div>
                <div style={styles.settingLabel}>Pre-Operation Safety Backups</div>
                <div style={styles.settingDesc}>
                  Automatically create a snapshot before applying auto-organizations or bulk deletions
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoBackupBeforeChanges}
                onChange={(e) => update({ autoBackupBeforeChanges: e.target.checked })}
                style={styles.checkbox}
              />
            </div>

            <div style={styles.settingRow}>
              <div>
                <div style={styles.settingLabel}>Backup Retention Limit</div>
                <div style={styles.settingDesc}>
                  Number of snapshots retained in IndexedDB before pruning oldest
                </div>
              </div>
              <select
                value={settings.backupRetentionCount}
                onChange={(e) => update({ backupRetentionCount: parseInt(e.target.value, 10) })}
                style={styles.select}
              >
                <option value={5}>5 Backups</option>
                <option value={10}>10 Backups (Default)</option>
                <option value={20}>20 Backups</option>
                <option value={50}>50 Backups</option>
                <option value={0}>Unlimited</option>
              </select>
            </div>
          </div>
        </div>

        {/* Organization */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <h3 style={styles.cardTitle}>Automatic Organization Rules</h3>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.settingRow}>
              <div>
                <div style={styles.settingLabel}>Minimum Rule Confidence</div>
                <div style={styles.settingDesc}>
                  Only propose category moves if classification confidence meets or exceeds this threshold ({settings.minConfidencePercent}%)
                </div>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={settings.minConfidencePercent}
                onChange={(e) => update({ minConfidencePercent: parseInt(e.target.value, 10) })}
                style={styles.slider}
              />
            </div>

            <div style={styles.settingRow}>
              <div>
                <div style={styles.settingLabel}>Preserve Deep Structured Folders</div>
                <div style={styles.settingDesc}>
                  Do not move bookmarks that are already nested 3+ levels deep inside custom user folders
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.preserveExistingStructuredFolders}
                onChange={(e) => update({ preserveExistingStructuredFolders: e.target.checked })}
                style={styles.checkbox}
              />
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Search size={16} style={{ color: 'var(--accent)' }} />
            <h3 style={styles.cardTitle}>Search Indexing Fields</h3>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.checkboxGrid}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.searchFields.title}
                  onChange={(e) =>
                    update({ searchFields: { ...settings.searchFields, title: e.target.checked } })
                  }
                  style={styles.checkbox}
                />
                <span>Bookmark Title</span>
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.searchFields.url}
                  onChange={(e) =>
                    update({ searchFields: { ...settings.searchFields, url: e.target.checked } })
                  }
                  style={styles.checkbox}
                />
                <span>URL Address</span>
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.searchFields.domain}
                  onChange={(e) =>
                    update({ searchFields: { ...settings.searchFields, domain: e.target.checked } })
                  }
                  style={styles.checkbox}
                />
                <span>Domain Hostname</span>
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.searchFields.folder}
                  onChange={(e) =>
                    update({ searchFields: { ...settings.searchFields, folder: e.target.checked } })
                  }
                  style={styles.checkbox}
                />
                <span>Folder Name</span>
              </label>
            </div>
          </div>
        </div>

        {/* Test Data Generator */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <FlaskConical size={16} style={{ color: 'var(--warning-text)' }} />
            <h3 style={styles.cardTitle}>Performance Benchmarking & Test Data</h3>
          </div>
          <div style={styles.cardBody}>
            <p style={styles.cardDesc}>
              Generate realistic mock bookmarks in-memory with intentional duplicates and category distributions to test search speed and scalability.
            </p>
            <div style={styles.btnGroup}>
              <button onClick={() => handleGenerateTestData(100)} style={styles.testBtn}>
                Load 100 Test Bookmarks
              </button>
              <button onClick={() => handleGenerateTestData(1000)} style={styles.testBtn}>
                Load 1,000 Test Bookmarks
              </button>
              <button onClick={() => handleGenerateTestData(10000)} style={styles.testBtn}>
                Load 10,000 Test Bookmarks
              </button>
            </div>
          </div>
        </div>

        {/* Local Privacy Pledge */}
        <div style={{ ...styles.card, borderColor: 'var(--accent)' }}>
          <div style={styles.cardHeader}>
            <Shield size={16} style={{ color: 'var(--success-text)' }} />
            <h3 style={styles.cardTitle}>Privacy & Security Model</h3>
          </div>
          <div style={styles.cardBody}>
            <p style={styles.privacyText}>
              <strong>Bookmarky is 100% local-first:</strong>
            </p>
            <ul style={styles.privacyList}>
              <li>Your bookmarks and search queries never leave your computer.</li>
              <li>No user account or cloud database required.</li>
              <li>No analytics or telemetry trackers are embedded.</li>
              <li>All backups and settings are stored locally in Chrome/Edge local storage & IndexedDB.</li>
              <li>Requested permissions: <code>bookmarks</code>, <code>storage</code>, <code>contextMenus</code>, and <code>notifications</code>.</li>
            </ul>
          </div>
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
  saveAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--success-light)',
    border: '1px solid var(--success)',
    color: 'var(--success-text)',
    fontSize: 12,
    marginBottom: 16
  },
  testAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-light)',
    border: '1px solid var(--accent)',
    color: 'var(--accent-text)',
    fontSize: 12,
    marginBottom: 16
  },
  sectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxWidth: 720
  },
  card: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 18px',
    borderBottom: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-surface-elevated)'
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  cardBody: {
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  cardDesc: {
    fontSize: 13,
    color: 'var(--text-secondary)'
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-primary)'
  },
  settingDesc: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 2
  },
  btnGroup: {
    display: 'flex',
    gap: 6
  },
  choiceBtn: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 12,
    fontWeight: 500,
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)'
  },
  choiceBtnActive: {
    backgroundColor: 'var(--accent-light)',
    borderColor: 'var(--accent)',
    color: 'var(--accent-text)',
    fontWeight: 600
  },
  testBtn: {
    padding: '7px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 12,
    fontWeight: 500,
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)'
  },
  select: {
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: 12,
    outline: 'none'
  },
  slider: {
    width: 140,
    accentColor: 'var(--accent)',
    cursor: 'pointer'
  },
  checkbox: {
    accentColor: 'var(--accent)',
    width: 16,
    height: 16,
    cursor: 'pointer'
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  privacyText: {
    fontSize: 13,
    color: 'var(--text-primary)'
  },
  privacyList: {
    paddingLeft: 20,
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.8
  }
};
