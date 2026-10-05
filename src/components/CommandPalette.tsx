import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Copy,
  Link2Off,
  FolderX,
  Database,
  Settings,
  Plus,
  FolderPlus,
  ExternalLink,
  Bookmark,
  X,
  LucideIcon
} from 'lucide-react';
import { BookmarkItem } from '../types/bookmark';
import { SearchEngine } from '../services/search';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  onSelectAction: (actionKey: string) => void;
  onOpenBookmark: (bookmark: BookmarkItem) => void;
}

interface PaletteCommand {
  id: string;
  title: string;
  category: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onSelectAction,
  onOpenBookmark
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const defaultCommands: PaletteCommand[] = [
    {
      id: 'cmd_organize',
      title: 'Organize Bookmarks (Smart Auto-Categorizer)',
      category: 'Actions',
      icon: Sparkles,
      shortcut: '⌘⇧O',
      action: () => {
        onClose();
        onSelectAction('organizer');
      }
    },
    {
      id: 'cmd_duplicates',
      title: 'Find & Resolve Duplicate Bookmarks',
      category: 'Maintenance',
      icon: Copy,
      shortcut: '⌘⇧D',
      action: () => {
        onClose();
        onSelectAction('duplicates');
      }
    },
    {
      id: 'cmd_broken',
      title: 'Scan for Broken / Dead Links',
      category: 'Maintenance',
      icon: Link2Off,
      shortcut: '⌘⇧L',
      action: () => {
        onClose();
        onSelectAction('broken-links');
      }
    },
    {
      id: 'cmd_empty',
      title: 'Find & Clean Empty Folders',
      category: 'Maintenance',
      icon: FolderX,
      action: () => {
        onClose();
        onSelectAction('empty-folders');
      }
    },
    {
      id: 'cmd_backup',
      title: 'Create Backup Snapshot',
      category: 'System',
      icon: Database,
      shortcut: '⌘⇧S',
      action: () => {
        onClose();
        onSelectAction('backups');
      }
    },
    {
      id: 'cmd_new_bm',
      title: 'Create New Bookmark',
      category: 'Actions',
      icon: Plus,
      action: () => {
        onClose();
        onSelectAction('new_bookmark');
      }
    },
    {
      id: 'cmd_new_folder',
      title: 'Create New Folder',
      category: 'Actions',
      icon: FolderPlus,
      action: () => {
        onClose();
        onSelectAction('new_folder');
      }
    },
    {
      id: 'cmd_settings',
      title: 'Open Settings & Privacy',
      category: 'System',
      icon: Settings,
      action: () => {
        onClose();
        onSelectAction('settings');
      }
    }
  ];

  // Filter commands and bookmarks
  const filteredCommands = query.trim()
    ? defaultCommands.filter((c) =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : defaultCommands;

  const bookmarkResults = query.trim()
    ? SearchEngine.search(bookmarks, query).slice(0, 10).map((r) => r.bookmark)
    : [];

  const totalItemsCount = filteredCommands.length + bookmarkResults.length;

  useEffect(() => {
    if (selectedIndex >= totalItemsCount && totalItemsCount > 0) {
      setSelectedIndex(0);
    }
  }, [totalItemsCount, selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(totalItemsCount, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItemsCount) % Math.max(totalItemsCount, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredCommands.length) {
        filteredCommands[selectedIndex].action();
      } else {
        const bmIndex = selectedIndex - filteredCommands.length;
        if (bookmarkResults[bmIndex]) {
          onClose();
          onOpenBookmark(bookmarkResults[bmIndex]);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.palette} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div style={styles.inputRow}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search bookmarks directly..."
            style={styles.input}
          />
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div style={styles.resultsList}>
          {filteredCommands.length > 0 && (
            <div style={styles.sectionHeader}>ACTIONS & TOOLS</div>
          )}

          {filteredCommands.map((cmd, idx) => {
            const isSelected = selectedIndex === idx;
            const Icon = cmd.icon;
            return (
              <div
                key={cmd.id}
                style={{
                  ...styles.item,
                  ...(isSelected ? styles.itemSelected : {})
                }}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <Icon size={16} style={{ color: isSelected ? 'var(--accent-text)' : 'var(--text-muted)' }} />
                <span style={styles.itemTitle}>{cmd.title}</span>
                {cmd.shortcut && <span className="kbd">{cmd.shortcut}</span>}
              </div>
            );
          })}

          {bookmarkResults.length > 0 && (
            <>
              <div style={styles.sectionHeader}>MATCHING BOOKMARKS</div>
              {bookmarkResults.map((bm, bIdx) => {
                const globalIndex = filteredCommands.length + bIdx;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <div
                    key={bm.id}
                    style={{
                      ...styles.item,
                      ...(isSelected ? styles.itemSelected : {})
                    }}
                    onClick={() => {
                      onClose();
                      onOpenBookmark(bm);
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <Bookmark size={15} style={{ color: 'var(--accent-text)' }} />
                    <div style={styles.bmInfo}>
                      <span style={styles.itemTitle}>{bm.title}</span>
                      <span style={styles.bmPath}>{bm.pathString} • {bm.domain}</span>
                    </div>
                    <ExternalLink size={13} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
                  </div>
                );
              })}
            </>
          )}

          {totalItemsCount === 0 && (
            <div style={styles.noResults}>
              No commands or bookmarks matching "{query}"
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <span style={styles.hint}>
            <span className="kbd">↑</span> <span className="kbd">↓</span> to navigate
          </span>
          <span style={styles.hint}>
            <span className="kbd">↵</span> to select
          </span>
          <span style={styles.hint}>
            <span className="kbd">esc</span> to close
          </span>
        </div>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '12vh',
    zIndex: 9999
  },
  palette: {
    width: 620,
    maxHeight: '75vh',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 18px',
    borderBottom: '1px solid var(--border-color)'
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: 15,
    color: 'var(--text-primary)'
  },
  closeBtn: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center'
  },
  resultsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    padding: '6px 12px 4px 12px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'background 0.1s ease'
  },
  itemSelected: {
    backgroundColor: 'var(--accent-light)',
    color: 'var(--accent-text)'
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 500,
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  bmInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    minWidth: 0
  },
  bmPath: {
    fontSize: 11,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  noResults: {
    padding: '30px 20px',
    textAlign: 'center',
    fontSize: 13,
    color: 'var(--text-muted)'
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '10px 18px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-surface)'
  },
  hint: {
    fontSize: 11,
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  }
};
