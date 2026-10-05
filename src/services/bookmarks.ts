import { BookmarkItem, BookmarkFolder } from '../types/bookmark';

export function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return 'unknown';
  }
}

export function getFaviconUrl(urlStr: string): string {
  try {
    const domain = extractDomain(urlStr);
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(urlStr)}&size=32`;
    }
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

// In-memory mock tree for development or testing outside Chrome runtime
let devMockTree: chrome.bookmarks.BookmarkTreeNode[] = [
  {
    id: '0',
    title: 'root',
    children: [
      {
        id: '1',
        title: 'Bookmarks Bar',
        parentId: '0',
        children: [
          {
            id: '101',
            title: 'GitHub: Let’s build from here',
            url: 'https://github.com',
            parentId: '1',
            dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 5
          },
          {
            id: '102',
            title: 'Figma: The Collaborative Interface Design Tool',
            url: 'https://www.figma.com',
            parentId: '1',
            dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 2
          },
          {
            id: '103',
            parentId: '1',
            title: 'Development Tools',
            children: [
              {
                id: '104',
                title: 'TypeScript Official Documentation',
                url: 'https://www.typescriptlang.org/docs/',
                parentId: '103',
                dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 10
              },
              {
                id: '105',
                title: 'Vite | Next Generation Frontend Tooling',
                url: 'https://vitejs.dev',
                parentId: '103',
                dateAdded: Date.now() - 1000 * 60 * 60 * 2
              },
              {
                id: '106',
                title: 'React Documentation',
                url: 'https://react.dev',
                parentId: '103',
                dateAdded: Date.now() - 1000 * 60 * 60 * 30
              }
            ]
          },
          {
            id: '107',
            parentId: '1',
            title: 'Artificial Intelligence',
            children: [
              {
                id: '108',
                title: 'OpenAI ChatGPT',
                url: 'https://chatgpt.com',
                parentId: '107',
                dateAdded: Date.now() - 1000 * 60 * 60 * 12
              },
              {
                id: '109',
                title: 'Anthropic Claude',
                url: 'https://claude.ai',
                parentId: '107',
                dateAdded: Date.now() - 1000 * 60 * 60 * 4
              },
              {
                id: '110',
                title: 'Hugging Face – The AI community',
                url: 'https://huggingface.co',
                parentId: '107',
                dateAdded: Date.now() - 1000 * 60 * 60 * 48
              }
            ]
          },
          {
            id: '111',
            parentId: '1',
            title: 'Empty Folder Test',
            children: []
          }
        ]
      },
      {
        id: '2',
        title: 'Other Bookmarks',
        parentId: '0',
        children: [
          {
            id: '201',
            title: 'Ahrefs: SEO Tools & Resources to Grow Your Search Traffic',
            url: 'https://ahrefs.com',
            parentId: '2',
            dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 8
          },
          {
            id: '202',
            title: 'GitHub: Where the world builds software (duplicate)',
            url: 'https://github.com?utm_source=bookmark',
            parentId: '2',
            dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 1
          }
        ]
      }
    ]
  }
];

export class BookmarkService {
  private static listeners: Set<() => void> = new Set();
  private static isListening = false;

  private static isChromeBookmarksAvailable(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.bookmarks && !!chrome.bookmarks.getTree;
  }

  /**
   * Set custom mock tree (for tests)
   */
  static setMockTree(tree: chrome.bookmarks.BookmarkTreeNode[]) {
    devMockTree = tree;
  }

  /**
   * Fetch complete bookmark tree
   */
  static async getTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    if (this.isChromeBookmarksAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.getTree((tree) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(tree);
          }
        });
      });
    }
    // Return cloned mock tree
    return JSON.parse(JSON.stringify(devMockTree));
  }

  /**
   * Recursively extract flattened bookmarks list with full breadcrumb paths
   */
  static async getFlatBookmarks(): Promise<BookmarkItem[]> {
    const tree = await this.getTree();
    const items: BookmarkItem[] = [];

    function traverse(nodes: chrome.bookmarks.BookmarkTreeNode[], currentPath: string[]) {
      for (const node of nodes) {
        if (node.url) {
          // It's a bookmark
          const domain = extractDomain(node.url);
          const pathString = currentPath.length > 0 ? currentPath.join(' / ') : 'Root';
          items.push({
            id: node.id,
            parentId: node.parentId,
            index: node.index,
            url: node.url,
            title: node.title || domain || 'Untitled',
            dateAdded: node.dateAdded,
            dateGroupModified: node.dateGroupModified,
            path: [...currentPath],
            pathString,
            domain,
            favicon: getFaviconUrl(node.url)
          });
        }

        if (node.children && node.children.length > 0) {
          const nextPath = node.title && node.parentId ? [...currentPath, node.title] : currentPath;
          traverse(node.children, nextPath);
        }
      }
    }

    traverse(tree, []);
    return items;
  }

  /**
   * Recursively extract all folders
   */
  static async getFolders(): Promise<BookmarkFolder[]> {
    const tree = await this.getTree();
    const folders: BookmarkFolder[] = [];

    function traverse(nodes: chrome.bookmarks.BookmarkTreeNode[], currentPath: string[]) {
      for (const node of nodes) {
        if (!node.url && node.id !== '0') {
          // Folder
          const folderTitle = node.title || (node.id === '1' ? 'Bookmarks Bar' : node.id === '2' ? 'Other Bookmarks' : 'Folder');
          const nextPath = [...currentPath, folderTitle];
          
          folders.push({
            id: node.id,
            parentId: node.parentId,
            title: folderTitle,
            dateAdded: node.dateAdded,
            dateGroupModified: node.dateGroupModified,
            path: currentPath,
            childrenCount: node.children ? node.children.length : 0
          });

          if (node.children) {
            traverse(node.children, nextPath);
          }
        } else if (node.children) {
          traverse(node.children, currentPath);
        }
      }
    }

    traverse(tree, []);
    return folders;
  }

  /**
   * Find empty folders
   */
  static async findEmptyFolders(): Promise<BookmarkFolder[]> {
    const tree = await this.getTree();
    const emptyList: BookmarkFolder[] = [];

    function traverse(nodes: chrome.bookmarks.BookmarkTreeNode[], currentPath: string[]) {
      for (const node of nodes) {
        if (!node.url && node.id !== '0' && node.id !== '1' && node.id !== '2') {
          const folderTitle = node.title || 'Untitled Folder';
          const nextPath = [...currentPath, folderTitle];

          if (!node.children || node.children.length === 0) {
            emptyList.push({
              id: node.id,
              parentId: node.parentId,
              title: folderTitle,
              dateAdded: node.dateAdded,
              dateGroupModified: node.dateGroupModified,
              path: currentPath,
              childrenCount: 0
            });
          } else {
            traverse(node.children, nextPath);
          }
        } else if (node.children) {
          const nextPath = node.title ? [...currentPath, node.title] : currentPath;
          traverse(node.children, nextPath);
        }
      }
    }

    traverse(tree, []);
    return emptyList;
  }

  /**
   * Create Bookmark
   */
  static async createBookmark(parentId: string, title: string, url: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
    if (this.isChromeBookmarksAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.create({ parentId, title, url }, (result) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(result);
        });
      });
    }

    // Dev fallback
    const newItem: chrome.bookmarks.BookmarkTreeNode = {
      id: String(Date.now()),
      parentId,
      title,
      url,
      dateAdded: Date.now()
    };
    return newItem;
  }

  /**
   * Create Folder
   */
  static async createFolder(parentId: string, title: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
    if (this.isChromeBookmarksAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.create({ parentId, title }, (result) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(result);
        });
      });
    }

    const newFolder: chrome.bookmarks.BookmarkTreeNode = {
      id: String(Date.now()),
      parentId,
      title,
      children: [],
      dateAdded: Date.now()
    };
    return newFolder;
  }

  /**
   * Update Bookmark / Folder
   */
  static async update(id: string, changes: { title?: string; url?: string }): Promise<void> {
    if (this.isChromeBookmarksAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.update(id, changes, () => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        });
      });
    }
  }

  /**
   * Get single Bookmark or Folder Node by ID
   */
  static async get(id: string): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
    if (this.isChromeBookmarksAvailable()) {
      return new Promise((resolve) => {
        chrome.bookmarks.get(id, (results) => {
          if (chrome.runtime.lastError || !results || results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0]);
          }
        });
      });
    }
    return null;
  }

  /**
   * Move Bookmark or Folder
   */
  static async move(id: string, destination: { parentId?: string; index?: number }): Promise<void> {
    if (this.isChromeBookmarksAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.move(id, destination, () => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        });
      });
    }
  }

  /**
   * Remove a single bookmark
   */
  static async remove(id: string): Promise<void> {
    if (this.isChromeBookmarksAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.remove(id, () => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        });
      });
    }
  }

  /**
   * Remove folder and children recursively
   */
  static async removeTree(id: string): Promise<void> {
    if (this.isChromeBookmarksAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.removeTree(id, () => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        });
      });
    }
  }

  /**
   * Register tree mutation event listeners for reactive UI
   */
  static subscribeToChanges(callback: () => void): () => void {
    this.listeners.add(callback);

    if (!this.isListening && this.isChromeBookmarksAvailable()) {
      this.isListening = true;
      const notify = () => {
        this.listeners.forEach((fn) => fn());
      };

      chrome.bookmarks.onCreated.addListener(notify);
      chrome.bookmarks.onRemoved.addListener(notify);
      chrome.bookmarks.onChanged.addListener(notify);
      chrome.bookmarks.onMoved.addListener(notify);
      chrome.bookmarks.onChildrenReordered.addListener(notify);
      chrome.bookmarks.onImportEnded.addListener(notify);
    }

    return () => {
      this.listeners.delete(callback);
    };
  }
}
