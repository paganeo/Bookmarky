import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { BookmarkItem, BookmarkFolder } from '../types/bookmark';
import { BookmarkService } from '../services/bookmarks';

// 1. Edit Bookmark Modal
interface EditBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmark: BookmarkItem | null;
  folders: BookmarkFolder[];
  onSaved: () => void;
  onDeleted: () => void;
}

export const EditBookmarkModal: React.FC<EditBookmarkModalProps> = ({
  isOpen,
  onClose,
  bookmark,
  folders,
  onSaved,
  onDeleted
}) => {
  const [title, setTitle] = useState(bookmark?.title || '');
  const [url, setUrl] = useState(bookmark?.url || '');
  const [parentId, setParentId] = useState(bookmark?.parentId || '1');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setParentId(bookmark.parentId || '1');
    }
  }, [bookmark]);

  if (!isOpen || !bookmark) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await BookmarkService.update(bookmark.id, { title, url });
      if (parentId !== bookmark.parentId) {
        await BookmarkService.move(bookmark.id, { parentId });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to update bookmark', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await BookmarkService.remove(bookmark.id);
      onDeleted();
      onClose();
    } catch (err) {
      console.error('Failed to delete bookmark', err);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Edit Bookmark</h3>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={16} /></button>
        </div>

        <form onSubmit={handleSave} style={modalStyles.body}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>URL Address</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Folder Location</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              style={modalStyles.select}
            >
              <option value="1">Bookmarks Bar</option>
              <option value="2">Other Bookmarks</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path.join(' / ')} / {f.title}
                </option>
              ))}
            </select>
          </div>

          <div style={modalStyles.footer}>
            <button
              type="button"
              onClick={handleDelete}
              style={modalStyles.dangerBtn}
            >
              <Trash2 size={13} style={{ marginRight: 4 }} />
              Delete
            </button>

            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button type="button" onClick={onClose} style={modalStyles.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" disabled={isSaving} style={modalStyles.primaryBtn}>
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. Create Bookmark Modal
interface CreateBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: BookmarkFolder[];
  onCreated: () => void;
}

export const CreateBookmarkModal: React.FC<CreateBookmarkModalProps> = ({
  isOpen,
  onClose,
  folders,
  onCreated
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('https://');
  const [parentId, setParentId] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await BookmarkService.createBookmark(parentId, title, url);
      onCreated();
      onClose();
      setTitle('');
      setUrl('https://');
    } catch (err) {
      console.error('Failed to create bookmark', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>New Bookmark</h3>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={modalStyles.body}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Title</label>
            <input
              type="text"
              placeholder="e.g. GitHub Repository"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={modalStyles.input}
              autoFocus
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>URL Address</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Destination Folder</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              style={modalStyles.select}
            >
              <option value="1">Bookmarks Bar</option>
              <option value="2">Other Bookmarks</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path.join(' / ')} / {f.title}
                </option>
              ))}
            </select>
          </div>

          <div style={modalStyles.footerRight}>
            <button type="button" onClick={onClose} style={modalStyles.secondaryBtn}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} style={modalStyles.primaryBtn}>
              Add Bookmark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. Create Folder Modal
interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: BookmarkFolder[];
  onCreated: () => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  folders,
  onCreated
}) => {
  const [title, setTitle] = useState('');
  const [parentId, setParentId] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await BookmarkService.createFolder(parentId, title.trim());
      onCreated();
      onClose();
      setTitle('');
    } catch (err) {
      console.error('Failed to create folder', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Create New Folder</h3>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={modalStyles.body}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Folder Name</label>
            <input
              type="text"
              placeholder="e.g. Design Inspiration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={modalStyles.input}
              autoFocus
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Parent Folder</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              style={modalStyles.select}
            >
              <option value="1">Bookmarks Bar (Root)</option>
              <option value="2">Other Bookmarks</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path.join(' / ')} / {f.title}
                </option>
              ))}
            </select>
          </div>

          <div style={modalStyles.footerRight}>
            <button type="button" onClick={onClose} style={modalStyles.secondaryBtn}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} style={modalStyles.primaryBtn}>
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. Batch Move Modal
interface BatchMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  folders: BookmarkFolder[];
  onMoved: () => void;
}

export const BatchMoveModal: React.FC<BatchMoveModalProps> = ({
  isOpen,
  onClose,
  selectedIds,
  folders,
  onMoved
}) => {
  const [destinationFolderId, setDestinationFolderId] = useState('1');
  const [isMoving, setIsMoving] = useState(false);

  if (!isOpen) return null;

  const handleMove = async () => {
    setIsMoving(true);
    try {
      for (const id of selectedIds) {
        await BookmarkService.move(id, { parentId: destinationFolderId });
      }
      onMoved();
      onClose();
    } catch (e) {
      console.error('Batch move failed', e);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Move {selectedIds.length} Bookmarks</h3>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={16} /></button>
        </div>

        <div style={modalStyles.body}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Select Destination Folder</label>
            <select
              value={destinationFolderId}
              onChange={(e) => setDestinationFolderId(e.target.value)}
              style={modalStyles.select}
            >
              <option value="1">Bookmarks Bar</option>
              <option value="2">Other Bookmarks</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path.join(' / ')} / {f.title}
                </option>
              ))}
            </select>
          </div>

          <div style={modalStyles.footerRight}>
            <button type="button" onClick={onClose} style={modalStyles.secondaryBtn}>
              Cancel
            </button>
            <button type="button" onClick={handleMove} disabled={isMoving} style={modalStyles.primaryBtn}>
              Move Bookmarks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
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
  modal: {
    width: 480,
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
    padding: '14px 18px',
    borderBottom: '1px solid var(--border-color)'
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  closeBtn: {
    color: 'var(--text-muted)'
  },
  body: {
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)'
  },
  input: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none'
  },
  select: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none'
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 6
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6
  },
  secondaryBtn: {
    padding: '7px 14px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 500
  },
  primaryBtn: {
    padding: '7px 16px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 600
  },
  dangerBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '7px 12px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--danger-light)',
    border: '1px solid var(--danger)',
    color: 'var(--danger-text)',
    fontSize: 12,
    fontWeight: 600
  }
};
