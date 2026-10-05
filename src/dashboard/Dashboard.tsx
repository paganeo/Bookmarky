import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Globe } from 'lucide-react';
import {
  ActiveView,
  BookmarkItem,
  BookmarkFolder,
  AppSettings
} from '../types/bookmark';
import { BookmarkService } from '../services/bookmarks';
import { StorageService, DEFAULT_SETTINGS } from '../services/storage';
import { SearchEngine } from '../services/search';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { BookmarkList } from '../components/BookmarkList';
import { CommandPalette } from '../components/CommandPalette';
import { OrganizerModal } from '../components/OrganizerModal';
import { DuplicateScannerView } from '../components/DuplicateScannerView';
import { DeadLinkScannerView } from '../components/DeadLinkScannerView';
import { EmptyFolderView } from '../components/EmptyFolderView';
import { BackupManagerView } from '../components/BackupManagerView';
import { DomainAnalyticsView } from '../components/DomainAnalyticsView';
import { StatisticsView } from '../components/StatisticsView';
import { SettingsView } from '../components/SettingsView';
import {
  EditBookmarkModal,
  CreateBookmarkModal,
  CreateFolderModal,
  BatchMoveModal
} from '../components/BookmarkModals';
import { DuplicateScanner } from '../services/duplicates';
import { BookmarkOrganizer } from '../services/organizer';

export const Dashboard: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeView, setActiveView] = useState<ActiveView>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);
  const [isCreateBookmarkOpen, setIsCreateBookmarkOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isBatchMoveOpen, setIsBatchMoveOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [bms, flds, sets] = await Promise.all([
        BookmarkService.getFlatBookmarks(),
        BookmarkService.getFolders(),
        StorageService.getSettings()
      ]);
      setBookmarks(bms);
      setFolders(flds);
      setSettings(sets);
      document.documentElement.setAttribute('data-theme', sets.theme);
    } catch (e) {
      console.error('Failed loading dashboard data', e);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Subscribe to bookmark tree mutations
    const unsubscribe = BookmarkService.subscribeToChanges(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Apply Theme Attribute
  useEffect(() => {
    if (settings.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings.theme]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + Shift + K: Command Palette
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Cmd/Ctrl + B: Focus search input
      else if (isMod && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
      // Cmd/Ctrl + Shift + O: Open Organizer
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsOrganizerOpen(true);
      }
      // Cmd/Ctrl + Shift + D: Duplicates View
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setActiveView('duplicates');
      }
      // Cmd/Ctrl + Shift + L: Dead links View
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setActiveView('broken-links');
      }
      // Cmd/Ctrl + Shift + S: Backups View
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setActiveView('backups');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute filtered bookmarks based on active view, folder, category, and search query
  const parsedFilter = useMemo(() => {
    return SearchEngine.parseQuery(searchQuery);
  }, [searchQuery]);

  const viewFilteredBookmarks = useMemo(() => {
    let list = bookmarks;

    if (activeView === 'recent') {
      const sevenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
      list = list.filter((b) => (b.dateAdded || 0) >= sevenDaysAgo);
    } else if (activeView === 'unsorted') {
      list = list.filter((b) => b.path.length <= 1);
    } else if (activeView === 'category' && selectedCategory) {
      list = list.filter((b) => {
        const c = BookmarkOrganizer.classifyBookmark(b);
        return c.category.toLowerCase() === selectedCategory.toLowerCase();
      });
    } else if (activeView === 'folder' && selectedFolderId) {
      list = list.filter((b) => b.parentId === selectedFolderId);
    }

    if (searchQuery.trim()) {
      const searchResults = SearchEngine.search(list, searchQuery);
      list = searchResults.map((r) => r.bookmark);
    }

    return list;
  }, [bookmarks, activeView, selectedCategory, selectedFolderId, searchQuery]);

  // Counts for sidebar badges
  const recentCount = useMemo(() => {
    const sevenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
    return bookmarks.filter((b) => (b.dateAdded || 0) >= sevenDaysAgo).length;
  }, [bookmarks]);

  const unsortedCount = useMemo(() => {
    return bookmarks.filter((b) => b.path.length <= 1).length;
  }, [bookmarks]);

  const duplicateCount = useMemo(() => {
    const dupes = DuplicateScanner.findDuplicates(bookmarks);
    return dupes.reduce((acc, g) => acc + (g.items.length - 1), 0);
  }, [bookmarks]);

  // Actions
  const handleOpenBookmark = (item: BookmarkItem, newTab = true) => {
    if (newTab) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = item.url;
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(viewFilteredBookmarks.map((b) => b.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteBookmark = async (item: BookmarkItem) => {
    try {
      await BookmarkService.remove(item.id);
      loadData();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const handleBatchDelete = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await BookmarkService.remove(id);
      }
      setSelectedIds(new Set());
      loadData();
    } catch (e) {
      console.error('Batch delete failed', e);
    }
  };

  const handleSelectView = (view: ActiveView, category?: string, folderId?: string) => {
    setActiveView(view);
    setSelectedCategory(category);
    setSelectedFolderId(folderId);
    setSelectedIds(new Set());
  };

  const handleFilterDomain = (domain: string) => {
    setSearchQuery(`domain:${domain}`);
    setActiveView('all');
  };

  const toggleTheme = () => {
    const newTheme: 'dark' | 'light' = settings.theme === 'dark' ? 'light' : 'dark';
    const updated: AppSettings = { ...settings, theme: newTheme };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  return (
    <div style={styles.appRoot}>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        parsedFilter={parsedFilter}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAddBookmark={() => setIsCreateBookmarkOpen(true)}
        onOpenAddFolder={() => setIsCreateFolderOpen(true)}
        onOpenOrganizer={() => setIsOrganizerOpen(true)}
        onOpenSettings={() => setActiveView('settings')}
        theme={settings.theme === 'light' ? 'light' : 'dark'}
        onToggleTheme={toggleTheme}
      />

      <div style={styles.mainLayout}>
        <Sidebar
          activeView={activeView}
          selectedCategory={selectedCategory}
          selectedFolderId={selectedFolderId}
          onSelectView={handleSelectView}
          totalBookmarks={bookmarks.length}
          recentCount={recentCount}
          unsortedCount={unsortedCount}
          duplicateCount={duplicateCount}
          emptyFolderCount={0}
          folders={folders}
        />

        <main style={styles.contentArea}>
          {activeView === 'all' && (
            <BookmarkList
              items={viewFilteredBookmarks}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onOpen={handleOpenBookmark}
              onEdit={(item) => setEditingBookmark(item)}
              onDelete={handleDeleteBookmark}
              onBatchDelete={handleBatchDelete}
              onBatchMove={() => setIsBatchMoveOpen(true)}
              title="All Bookmarks"
              subtitle={`${viewFilteredBookmarks.length} bookmarks indexed`}
            />
          )}

          {activeView === 'recent' && (
            <BookmarkList
              items={viewFilteredBookmarks}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onOpen={handleOpenBookmark}
              onEdit={(item) => setEditingBookmark(item)}
              onDelete={handleDeleteBookmark}
              onBatchDelete={handleBatchDelete}
              onBatchMove={() => setIsBatchMoveOpen(true)}
              title="Recently Added"
              subtitle="Bookmarks saved in the last 7 days"
            />
          )}

          {activeView === 'unsorted' && (
            <BookmarkList
              items={viewFilteredBookmarks}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onOpen={handleOpenBookmark}
              onEdit={(item) => setEditingBookmark(item)}
              onDelete={handleDeleteBookmark}
              onBatchDelete={handleBatchDelete}
              onBatchMove={() => setIsBatchMoveOpen(true)}
              title="Unsorted Bookmarks"
              subtitle="Bookmarks in the root directory without a subfolder"
            />
          )}

          {activeView === 'category' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {selectedCategory?.toLowerCase() === 'other' && viewFilteredBookmarks.length > 0 && (
                <div style={styles.otherHeroBanner}>
                  <div style={styles.otherHeroContent}>
                    <div style={styles.otherHeroIconWrap}>
                      <Globe size={20} style={{ color: '#0ea5e9' }} />
                    </div>
                    <div>
                      <h4 style={styles.otherHeroTitle}>
                        {viewFilteredBookmarks.length} Uncategorized Bookmarks in "Other"
                      </h4>
                      <p style={styles.otherHeroDesc}>
                        Inspect these links in real time to verify if they are still online, extract their real page titles and meta-descriptions, and organize them automatically.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOrganizerOpen(true)}
                    style={styles.otherHeroBtn}
                  >
                    <Sparkles size={15} />
                    Inspect & Organize Live
                  </button>
                </div>
              )}
              <BookmarkList
                items={viewFilteredBookmarks}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onOpen={handleOpenBookmark}
                onEdit={(item) => setEditingBookmark(item)}
                onDelete={handleDeleteBookmark}
                onBatchDelete={handleBatchDelete}
                onBatchMove={() => setIsBatchMoveOpen(true)}
                title={`Category: ${selectedCategory}`}
                subtitle={`${viewFilteredBookmarks.length} bookmarks identified in this category`}
              />
            </div>
          )}

          {activeView === 'folder' && (
            <BookmarkList
              items={viewFilteredBookmarks}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onOpen={handleOpenBookmark}
              onEdit={(item) => setEditingBookmark(item)}
              onDelete={handleDeleteBookmark}
              onBatchDelete={handleBatchDelete}
              onBatchMove={() => setIsBatchMoveOpen(true)}
              title={folders.find((f) => f.id === selectedFolderId)?.title || 'Folder'}
              subtitle={`${viewFilteredBookmarks.length} bookmarks in this folder`}
            />
          )}

          {activeView === 'duplicates' && (
            <DuplicateScannerView bookmarks={bookmarks} onRefresh={loadData} />
          )}

          {activeView === 'broken-links' && (
            <DeadLinkScannerView bookmarks={bookmarks} onRefresh={loadData} />
          )}

          {activeView === 'empty-folders' && (
            <EmptyFolderView onRefresh={loadData} />
          )}

          {activeView === 'organizer' && (
            <BookmarkList
              items={bookmarks}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onOpen={handleOpenBookmark}
              onEdit={(item) => setEditingBookmark(item)}
              onDelete={handleDeleteBookmark}
              onBatchDelete={handleBatchDelete}
              onBatchMove={() => setIsBatchMoveOpen(true)}
              title="Smart Organizer Preview"
            />
          )}

          {activeView === 'backups' && (
            <BackupManagerView onRefresh={loadData} />
          )}

          {activeView === 'domains' && (
            <DomainAnalyticsView bookmarks={bookmarks} onFilterDomain={handleFilterDomain} />
          )}

          {activeView === 'analytics' && (
            <StatisticsView bookmarks={bookmarks} folders={folders} />
          )}

          {activeView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              onLoadTestData={(testBms) => setBookmarks(testBms)}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        bookmarks={bookmarks}
        onSelectAction={(actionKey) => {
          if (actionKey === 'organizer') setIsOrganizerOpen(true);
          else if (actionKey === 'new_bookmark') setIsCreateBookmarkOpen(true);
          else if (actionKey === 'new_folder') setIsCreateFolderOpen(true);
          else if (actionKey === 'duplicates') setActiveView('duplicates');
          else if (actionKey === 'broken-links') setActiveView('broken-links');
          else if (actionKey === 'empty-folders') setActiveView('empty-folders');
          else if (actionKey === 'backups') setActiveView('backups');
          else if (actionKey === 'settings') setActiveView('settings');
        }}
        onOpenBookmark={(bm) => handleOpenBookmark(bm, true)}
      />

      {/* Smart Organizer Modal */}
      <OrganizerModal
        isOpen={isOrganizerOpen}
        onClose={() => setIsOrganizerOpen(false)}
        bookmarks={bookmarks}
        minConfidence={settings.minConfidencePercent}
        initialFilterCategory={selectedCategory}
        onApplied={() => {
          loadData();
        }}
      />

      {/* Edit Bookmark Modal */}
      <EditBookmarkModal
        isOpen={Boolean(editingBookmark)}
        onClose={() => setEditingBookmark(null)}
        bookmark={editingBookmark}
        folders={folders}
        onSaved={loadData}
        onDeleted={loadData}
      />

      {/* Create Bookmark Modal */}
      <CreateBookmarkModal
        isOpen={isCreateBookmarkOpen}
        onClose={() => setIsCreateBookmarkOpen(false)}
        folders={folders}
        onCreated={loadData}
      />

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        folders={folders}
        onCreated={loadData}
      />

      {/* Batch Move Modal */}
      <BatchMoveModal
        isOpen={isBatchMoveOpen}
        onClose={() => setIsBatchMoveOpen(false)}
        selectedIds={Array.from(selectedIds)}
        folders={folders}
        onMoved={() => {
          setSelectedIds(new Set());
          loadData();
        }}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appRoot: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-app)'
  },
  mainLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  otherHeroBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid rgba(14, 165, 233, 0.3)',
    borderRadius: 'var(--radius-md)',
    margin: '16px 20px 0 20px',
    padding: '14px 18px',
    gap: 16
  },
  otherHeroContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 14
  },
  otherHeroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  otherHeroTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0
  },
  otherHeroDesc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    margin: '3px 0 0 0',
    lineHeight: 1.4
  },
  otherHeroBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: '#0ea5e9',
    color: '#ffffff',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.25)'
  }
};
