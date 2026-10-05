import { describe, it, expect } from 'vitest';
import { BackupService } from '../src/services/backup';
import { RestoreService } from '../src/services/restore';
import { BackupRecord } from '../src/types/bookmark';

describe('Backup and Restore Services', () => {
  const sampleTree: chrome.bookmarks.BookmarkTreeNode[] = [
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
              title: 'GitHub',
              url: 'https://github.com',
              parentId: '1',
              dateAdded: 1700000000000
            }
          ]
        }
      ]
    }
  ];

  it('exports valid JSON format conforming to Bookmarky specification', () => {
    const backup: BackupRecord = {
      id: 'test_backup_1',
      format: 'Bookmarky',
      version: 1,
      createdAt: '2026-10-04T12:00:00.000Z',
      browser: 'chrome',
      totalBookmarks: 1,
      totalFolders: 1,
      bookmarksTree: sampleTree
    };

    const jsonStr = BackupService.exportToJson(backup);
    expect(jsonStr).toContain('"format": "Bookmarky"');
    expect(jsonStr).toContain('"version": 1');

    const parsed = RestoreService.parseBackupFile(jsonStr);
    expect(parsed.type).toBe('Bookmarky_JSON');
    expect(parsed.totalBookmarks).toBe(1);
  });

  it('exports standard Netscape Bookmark HTML and parses it correctly', () => {
    const html = BackupService.exportToNetscapeHtml(sampleTree);
    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
    expect(html).toContain('<H1>Bookmarks</H1>');
    expect(html).toContain('HREF="https://github.com"');

    // RestoreService parses Netscape HTML
    const parsed = RestoreService.parseBackupFile(html);
    expect(parsed.type).toBe('Netscape_HTML');
    expect(parsed.tree.length).toBeGreaterThan(0);
  });

  it('rejects malformed or unrecognised backup files', () => {
    expect(() => {
      RestoreService.parseBackupFile('random invalid file content');
    }).toThrow();
  });
});
