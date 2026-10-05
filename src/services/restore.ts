import { BookmarkService } from './bookmarks';
import { BackupService } from './backup';

export interface ParsedBookmarkImport {
  type: 'Bookmarky_JSON' | 'BookmarkOS_JSON' | 'Netscape_HTML';
  version: number;
  totalBookmarks: number;
  totalFolders: number;
  tree: chrome.bookmarks.BookmarkTreeNode[];
}

export class RestoreService {
  /**
   * Parse and validate a raw backup string (either JSON or HTML)
   */
  static parseBackupFile(content: string): ParsedBookmarkImport {
    const trimmed = content.trim();

    // 1. Try Bookmarky / BookmarkOS JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const json = JSON.parse(trimmed);
        if ((json.format === 'Bookmarky' || json.format === 'BookmarkOS') && Array.isArray(json.bookmarksTree)) {
          return {
            type: json.format === 'Bookmarky' ? 'Bookmarky_JSON' : 'BookmarkOS_JSON',
            version: json.version || 1,
            totalBookmarks: json.totalBookmarks || 0,
            totalFolders: json.totalFolders || 0,
            tree: json.bookmarksTree
          };
        }
      } catch (e) {
        throw new Error('Invalid JSON format: Failed to parse backup payload');
      }
    }

    // 2. Try Netscape Bookmark HTML
    if (
      trimmed.includes('NETSCAPE-Bookmark-file-1') ||
      trimmed.includes('<H1>Bookmarks</H1>') ||
      trimmed.includes('<DL>') ||
      trimmed.includes('<H3>') ||
      trimmed.includes('<DT>')
    ) {
      return this.parseNetscapeHtml(trimmed);
    }

    throw new Error('Unsupported backup format. File must be Bookmarky JSON or Netscape HTML.');
  }

  /**
   * Robust parser for Netscape Bookmark HTML file compatible with both
   * Browser DOM, MV3 Service Worker (no DOMParser), and Node.js
   */
  static parseNetscapeHtml(html: string): ParsedBookmarkImport {
    let totalBookmarks = 0;
    let totalFolders = 0;

    // Use pure regex line parsing so it runs in browser, service workers, and node tests
    const lines = html.split(/\r?\n/);
    
    interface FolderStackItem {
      node: chrome.bookmarks.BookmarkTreeNode;
    }

    const rootFolder: chrome.bookmarks.BookmarkTreeNode = {
      id: '1',
      title: 'Bookmarks Bar',
      parentId: '0',
      children: []
    };

    const stack: FolderStackItem[] = [{ node: rootFolder }];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Check folder header <H3 ...>Folder Name</H3>
      const h3Match = line.match(/<H3[^>]*>(.*?)<\/H3>/i);
      if (h3Match) {
        totalFolders++;
        const folderTitle = unescapeHtml(h3Match[1].trim()) || 'Imported Folder';
        const folderId = `imp_f_${Date.now()}_${totalFolders}`;
        const newFolder: chrome.bookmarks.BookmarkTreeNode = {
          id: folderId,
          parentId: stack[stack.length - 1].node.id,
          title: folderTitle,
          children: []
        };
        stack[stack.length - 1].node.children!.push(newFolder);
        // We push to stack when we hit <DL> or on folder
        stack.push({ node: newFolder });
        continue;
      }

      // Check link <A HREF="url" ...>Title</A>
      const aMatch = line.match(/<A\s+[^>]*HREF="([^"]*)"[^>]*>(.*?)<\/A>/i);
      if (aMatch) {
        totalBookmarks++;
        const url = aMatch[1].trim();
        const title = unescapeHtml(aMatch[2].trim()) || url;

        // Check date added
        const dateMatch = line.match(/ADD_DATE="(\d+)"/i);
        const dateAdded = dateMatch ? parseInt(dateMatch[1], 10) * 1000 : Date.now();

        const currentParent = stack[stack.length - 1].node;
        currentParent.children!.push({
          id: `imp_bm_${Date.now()}_${totalBookmarks}`,
          parentId: currentParent.id,
          title,
          url,
          dateAdded
        });
        continue;
      }

      // Check closing folder </DL>
      if (line.toUpperCase().includes('</DL>')) {
        if (stack.length > 1) {
          stack.pop();
        }
      }
    }

    return {
      type: 'Netscape_HTML',
      version: 1,
      totalBookmarks,
      totalFolders,
      tree: [
        {
          id: '0',
          title: 'root',
          children: [rootFolder]
        }
      ]
    };
  }

  /**
   * Restore a backup tree into the browser
   */
  static async restore(
    tree: chrome.bookmarks.BookmarkTreeNode[],
    mode: 'replace' | 'merge' = 'merge'
  ): Promise<{
    restoredBookmarks: number;
    restoredFolders: number;
    safetyBackupId: string;
  }> {
    // 1. Create an automatic safety backup first!
    const safetySnapshot = await BackupService.createBackup('Pre-Restore Automatic Safety Snapshot', true);

    let restoredBookmarks = 0;
    let restoredFolders = 0;

    // 2. If 'replace' mode, safely clear existing bookmarks inside Bookmarks Bar and Other Bookmarks
    if (mode === 'replace') {
      const currentTree = await BookmarkService.getTree();
      for (const root of currentTree) {
        if (root.children) {
          for (const mainFolder of root.children) {
            if (mainFolder.children) {
              for (const child of [...mainFolder.children]) {
                try {
                  if (child.url) {
                    await BookmarkService.remove(child.id);
                  } else {
                    await BookmarkService.removeTree(child.id);
                  }
                } catch (e) {
                  console.warn('Could not remove existing item during replace', e);
                }
              }
            }
          }
        }
      }
    }

    // 3. Recursive bookmark restoration
    async function restoreNodes(nodes: chrome.bookmarks.BookmarkTreeNode[], parentId: string) {
      for (const node of nodes) {
        if (node.url) {
          try {
            await BookmarkService.createBookmark(parentId, node.title || 'Untitled', node.url);
            restoredBookmarks++;
          } catch (e) {
            console.error('Failed to restore bookmark', node.title, e);
          }
        } else if (node.children) {
          if (node.id === '0') {
            await restoreNodes(node.children, '1');
          } else if (node.id === '1' || node.id === '2') {
            await restoreNodes(node.children, node.id);
          } else {
            try {
              const createdFolder = await BookmarkService.createFolder(parentId, node.title || 'Folder');
              restoredFolders++;
              await restoreNodes(node.children, createdFolder.id);
            } catch (e) {
              console.error('Failed creating folder during restore', node.title, e);
            }
          }
        }
      }
    }

    await restoreNodes(tree, '1');

    return {
      restoredBookmarks,
      restoredFolders,
      safetyBackupId: safetySnapshot.id
    };
  }
}

function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}
