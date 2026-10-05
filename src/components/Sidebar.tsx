import React, { useState } from 'react';
import {
  Bookmark,
  Clock,
  Inbox,
  Folder,
  FolderOpen,
  Copy,
  Link2Off,
  FolderX,
  Sparkles,
  Database,
  Globe,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
  Cpu,
  Code,
  Palette,
  Search,
  Megaphone,
  Briefcase,
  GraduationCap,
  Newspaper,
  Coins,
  ShoppingBag,
  Share2,
  Tv,
  CheckSquare,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { ActiveView, BookmarkFolder } from '../types/bookmark';

interface SidebarProps {
  activeView: ActiveView;
  selectedCategory?: string;
  selectedFolderId?: string;
  onSelectView: (view: ActiveView, category?: string, folderId?: string) => void;
  totalBookmarks: number;
  recentCount: number;
  unsortedCount: number;
  duplicateCount: number;
  emptyFolderCount: number;
  folders: BookmarkFolder[];
}

const CATEGORIES = [
  { name: 'AI', icon: Cpu },
  { name: 'Development', icon: Code },
  { name: 'Design', icon: Palette },
  { name: 'SEO', icon: Search },
  { name: 'Marketing', icon: Megaphone },
  { name: 'Business', icon: Briefcase },
  { name: 'Education', icon: GraduationCap },
  { name: 'News', icon: Newspaper },
  { name: 'Finance', icon: Coins },
  { name: 'Shopping', icon: ShoppingBag },
  { name: 'Social', icon: Share2 },
  { name: 'Entertainment', icon: Tv },
  { name: 'Productivity', icon: CheckSquare },
  { name: 'Reference', icon: BookOpen },
  { name: 'Other', icon: HelpCircle }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  selectedCategory,
  selectedFolderId,
  onSelectView,
  totalBookmarks,
  recentCount,
  unsortedCount,
  duplicateCount,
  emptyFolderCount,
  folders
}) => {
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [foldersOpen, setFoldersOpen] = useState(true);

  return (
    <aside style={styles.sidebar}>
      <div style={styles.scrollArea}>
        {/* Section: Library */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>LIBRARY</div>
          
          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'all' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('all')}
          >
            <Bookmark size={15} style={styles.itemIcon} />
            <span style={styles.itemLabel}>All Bookmarks</span>
            <span style={styles.itemBadge}>{totalBookmarks}</span>
          </button>

          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'recent' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('recent')}
          >
            <Clock size={15} style={styles.itemIcon} />
            <span style={styles.itemLabel}>Recently Added</span>
            <span style={styles.itemBadge}>{recentCount}</span>
          </button>

          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'unsorted' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('unsorted')}
          >
            <Inbox size={15} style={styles.itemIcon} />
            <span style={styles.itemLabel}>Unsorted</span>
            <span style={styles.itemBadge}>{unsortedCount}</span>
          </button>
        </div>

        {/* Section: Smart Categories */}
        <div style={styles.section}>
          <button
            style={styles.sectionHeaderCollapsible}
            onClick={() => setCategoriesOpen(!categoriesOpen)}
          >
            <span>SMART CATEGORIES</span>
            {categoriesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {categoriesOpen && (
            <div style={styles.categoryList}>
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = activeView === 'category' && selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    style={{
                      ...styles.itemBtn,
                      ...(isSelected ? styles.itemBtnActive : {})
                    }}
                    onClick={() => onSelectView('category', cat.name)}
                  >
                    <IconComponent size={14} style={styles.itemIcon} />
                    <span style={styles.itemLabel}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Folders Tree */}
        <div style={styles.section}>
          <button
            style={styles.sectionHeaderCollapsible}
            onClick={() => setFoldersOpen(!foldersOpen)}
          >
            <span>FOLDERS ({folders.length})</span>
            {foldersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {foldersOpen && (
            <div style={styles.folderList}>
              {folders.map((f) => {
                const isSelected = activeView === 'folder' && selectedFolderId === f.id;
                const indent = Math.min(f.path.length * 10, 30);
                return (
                  <button
                    key={f.id}
                    style={{
                      ...styles.itemBtn,
                      paddingLeft: 10 + indent,
                      ...(isSelected ? styles.itemBtnActive : {})
                    }}
                    onClick={() => onSelectView('folder', undefined, f.id)}
                    title={`${f.path.join(' / ')} / ${f.title}`}
                  >
                    {isSelected ? (
                      <FolderOpen size={14} style={styles.itemIcon} />
                    ) : (
                      <Folder size={14} style={styles.itemIcon} />
                    )}
                    <span style={styles.itemLabel}>{f.title}</span>
                    {f.childrenCount > 0 && (
                      <span style={styles.folderCount}>{f.childrenCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Maintenance */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>MAINTENANCE</div>

          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'organizer' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('organizer')}
          >
            <Sparkles size={15} style={{ ...styles.itemIcon, color: 'var(--accent)' }} />
            <span style={styles.itemLabel}>Smart Organizer</span>
          </button>

          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'duplicates' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('duplicates')}
          >
            <Copy size={15} style={styles.itemIcon} />
            <span style={styles.itemLabel}>Duplicates</span>
            {duplicateCount > 0 && (
              <span style={{ ...styles.itemBadge, backgroundColor: 'var(--warning-light)', color: 'var(--warning-text)' }}>
                {duplicateCount}
              </span>
            )}
          </button>

          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'broken-links' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('broken-links')}
          >
            <Link2Off size={15} style={styles.itemIcon} />
            <span style={styles.itemLabel}>Broken Links</span>
          </button>

          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'empty-folders' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('empty-folders')}
          >
            <FolderX size={15} style={styles.itemIcon} />
            <span style={styles.itemLabel}>Empty Folders</span>
            {emptyFolderCount > 0 && (
              <span style={styles.itemBadge}>{emptyFolderCount}</span>
            )}
          </button>
        </div>

        {/* Section: System */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>SYSTEM</div>

          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'backups' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('backups')}
          >
            <Database size={15} style={styles.itemIcon} />
            <span style={styles.itemLabel}>Backups & Restore</span>
          </button>

          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'domains' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('domains')}
          >
            <Globe size={15} style={styles.itemIcon} />
            <span style={styles.itemLabel}>Top Domains</span>
          </button>

          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'analytics' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('analytics')}
          >
            <BarChart3 size={15} style={styles.itemIcon} />
            <span style={styles.itemLabel}>Statistics</span>
          </button>

          <button
            style={{
              ...styles.itemBtn,
              ...(activeView === 'settings' ? styles.itemBtnActive : {})
            }}
            onClick={() => onSelectView('settings')}
          >
            <Settings size={15} style={styles.itemIcon} />
            <span style={styles.itemLabel}>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 60px)',
    userSelect: 'none'
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    padding: '4px 10px',
    marginBottom: 2
  },
  sectionHeaderCollapsible: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    padding: '4px 10px',
    marginBottom: 2
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1
  },
  folderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    maxHeight: 220,
    overflowY: 'auto'
  },
  itemBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    color: 'var(--text-secondary)',
    transition: 'all 0.1s ease',
    textAlign: 'left',
    width: '100%',
    gap: 8
  },
  itemBtnActive: {
    backgroundColor: 'var(--accent-light)',
    color: 'var(--accent-text)',
    fontWeight: 600
  },
  itemIcon: {
    color: 'inherit',
    flexShrink: 0
  },
  itemLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  itemBadge: {
    fontSize: 11,
    padding: '1px 6px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--badge-bg)',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  folderCount: {
    fontSize: 10,
    color: 'var(--text-muted)',
    marginLeft: 'auto'
  }
};
