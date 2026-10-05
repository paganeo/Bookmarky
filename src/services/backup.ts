import { BackupRecord } from '../types/bookmark';
import { BookmarkService } from './bookmarks';
import { StorageService } from './storage';

export class BackupService {
  /**
   * Create a local backup record and store in IndexedDB
   */
  static async createBackup(label?: string, isAutoSafety = false): Promise<BackupRecord> {
    const tree = await BookmarkService.getTree();
    const flat = await BookmarkService.getFlatBookmarks();
    const folders = await BookmarkService.getFolders();

    const isEdge = typeof navigator !== 'undefined' && navigator.userAgent.includes('Edg/');
    const browser = isEdge ? 'edge' : 'chrome';

    const backup: BackupRecord = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      format: 'Bookmarky',
      version: 1,
      createdAt: new Date().toISOString(),
      browser,
      label: label || (isAutoSafety ? 'Automatic Safety Backup' : 'Manual Backup'),
      isAutoSafety,
      totalBookmarks: flat.length,
      totalFolders: folders.length,
      bookmarksTree: tree
    };

    await StorageService.saveBackup(backup);
    return backup;
  }

  /**
   * Export Backup to JSON string
   */
  static exportToJson(backup: BackupRecord): string {
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Convert bookmark tree to Netscape Bookmark HTML string
   */
  static exportToNetscapeHtml(tree: chrome.bookmarks.BookmarkTreeNode[]): string {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    function buildNodeHtml(nodes: chrome.bookmarks.BookmarkTreeNode[], indentLevel = 1): string {
      const indent = '    '.repeat(indentLevel);
      let out = '';

      for (const node of nodes) {
        if (node.url) {
          const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : '';
          out += `${indent}<DT><A HREF="${escapeHtml(node.url)}" ADD_DATE="${addDate}">${escapeHtml(node.title || 'Untitled')}</A>\n`;
        } else if (node.children) {
          if (node.id === '0') {
            // Root node - just traverse children
            out += buildNodeHtml(node.children, indentLevel);
          } else {
            const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : '';
            const modDate = node.dateGroupModified ? Math.floor(node.dateGroupModified / 1000) : '';
            const title = node.title || (node.id === '1' ? 'Bookmarks Bar' : 'Folder');
            out += `${indent}<DT><H3 ADD_DATE="${addDate}" LAST_MODIFIED="${modDate}">${escapeHtml(title)}</H3>\n`;
            out += `${indent}<DL><p>\n`;
            out += buildNodeHtml(node.children, indentLevel + 1);
            out += `${indent}</DL><p>\n`;
          }
        }
      }
      return out;
    }

    html += buildNodeHtml(tree);
    html += `</DL><p>\n`;
    return html;
  }

  /**
   * Trigger browser file download
   */
  static triggerDownload(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Download JSON file
   */
  static downloadJson(backup: BackupRecord) {
    const dateStr = new Date(backup.createdAt).toISOString().slice(0, 10);
    const filename = `Bookmarky_Backup_${dateStr}.json`;
    const json = this.exportToJson(backup);
    this.triggerDownload(json, filename, 'application/json');
  }

  /**
   * Download Netscape HTML file
   */
  static downloadHtml(backup: BackupRecord) {
    const dateStr = new Date(backup.createdAt).toISOString().slice(0, 10);
    const filename = `Bookmarky_Netscape_${dateStr}.html`;
    const html = this.exportToNetscapeHtml(backup.bookmarksTree);
    this.triggerDownload(html, filename, 'text/html');
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
