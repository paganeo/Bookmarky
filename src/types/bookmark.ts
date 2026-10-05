export interface BookmarkItem {
  id: string;
  parentId?: string;
  index?: number;
  url: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  path: string[];
  pathString: string;
  domain: string;
  favicon?: string;
  category?: string;
}

export interface BookmarkFolder {
  id: string;
  parentId?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  path: string[];
  childrenCount: number;
}

export interface SearchOperatorFilter {
  domain?: string;
  folder?: string;
  title?: string;
  url?: string;
  category?: string;
  excludedTerms: string[];
  phrases: string[];
  keywords: string[];
  rawQuery: string;
}

export interface SearchResultItem {
  bookmark: BookmarkItem;
  score: number;
  matches: {
    field: 'title' | 'url' | 'domain' | 'folder';
    matchType: 'exact' | 'prefix' | 'substring';
  }[];
}

export interface DuplicateGroup {
  id: string;
  normalizedUrl: string;
  displayUrl: string;
  domain: string;
  title: string;
  items: BookmarkItem[];
  type: 'exact' | 'normalized';
}

export type LinkCheckStatus =
  | 'idle'
  | 'checking'
  | 'working'
  | 'redirect'
  | '404'
  | '403'
  | '500'
  | 'timeout'
  | 'dns_error'
  | 'unknown';

export interface BrokenLinkItem {
  id: string;
  bookmarkId: string;
  title: string;
  url: string;
  domain: string;
  folderPath: string;
  status: LinkCheckStatus;
  statusCode?: number;
  statusText?: string;
  redirectUrl?: string;
  lastChecked: number;
}

export interface OrganizationChange {
  bookmarkId: string;
  title: string;
  url: string;
  currentPath: string;
  targetCategory: string;
  suggestedFolder: string;
  confidence: number;
  matchedRule: string;
}

export interface OrganizationPlan {
  totalAnalyzed: number;
  willMoveCount: number;
  duplicateCount: number;
  brokenCount: number;
  categoryCounts: Record<string, number>;
  changes: OrganizationChange[];
}

export interface BackupRecord {
  id: string;
  format: 'Bookmarky' | 'BookmarkOS';
  version: number;
  createdAt: string;
  browser: 'chrome' | 'edge' | 'browser';
  label?: string;
  isAutoSafety?: boolean;
  totalBookmarks: number;
  totalFolders: number;
  bookmarksTree: chrome.bookmarks.BookmarkTreeNode[];
}

export interface AppSettings {
  theme: 'system' | 'dark' | 'light';
  backupRetentionCount: number;
  autoBackupBeforeChanges: boolean;
  minConfidencePercent: number;
  preserveExistingStructuredFolders: boolean;
  searchFields: {
    title: boolean;
    url: boolean;
    domain: boolean;
    folder: boolean;
  };
  autoMaintenance: {
    enabled: boolean;
    frequency: 'weekly' | 'monthly' | 'never';
    lastChecked?: number;
  };
}

export type ActiveView =
  | 'all'
  | 'recent'
  | 'unsorted'
  | 'category'
  | 'folder'
  | 'duplicates'
  | 'broken-links'
  | 'empty-folders'
  | 'organizer'
  | 'backups'
  | 'domains'
  | 'analytics'
  | 'settings';

export interface PageMetadata {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  keywords?: string[];
}

export interface LiveInspectionResult {
  bookmarkId: string;
  url: string;
  isOnline: boolean;
  statusCode?: number;
  statusText?: string;
  metadata?: PageMetadata;
  error?: string;
  suggestedCategory?: string;
  suggestedFolder?: string;
  confidence?: number;
  matchedReason?: string;
}
