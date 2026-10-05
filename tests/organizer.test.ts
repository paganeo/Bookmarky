import { describe, it, expect } from 'vitest';
import { BookmarkOrganizer } from '../src/services/organizer';
import { BookmarkItem } from '../src/types/bookmark';

describe('BookmarkOrganizer', () => {
  it('classifies known domains with high confidence and single unified folder', () => {
    const item: BookmarkItem = {
      id: '1',
      title: 'GitHub: Let’s build from here',
      url: 'https://github.com',
      domain: 'github.com',
      path: ['Bookmarks Bar'],
      pathString: 'Bookmarks Bar'
    };

    const result = BookmarkOrganizer.classifyBookmark(item);
    expect(result.category).toBe('Development');
    expect(result.suggestedFolder).toBe('Development'); // Exactly single folder
    expect(result.confidence).toBeGreaterThanOrEqual(95);
  });

  it('classifies social domains like reddit/twitter into single "Social Media" folder', () => {
    const twitterItem: BookmarkItem = {
      id: 'soc-1',
      title: 'X / Twitter Feed',
      url: 'https://twitter.com/home',
      domain: 'twitter.com',
      path: ['Bookmarks Bar'],
      pathString: 'Bookmarks Bar'
    };

    const redditItem: BookmarkItem = {
      id: 'soc-2',
      title: 'Reddit: The front page of the internet',
      url: 'https://reddit.com/r/programming',
      domain: 'reddit.com',
      path: ['Bookmarks Bar'],
      pathString: 'Bookmarks Bar'
    };

    const res1 = BookmarkOrganizer.classifyBookmark(twitterItem);
    expect(res1.category).toBe('Social');
    expect(res1.suggestedFolder).toBe('Social Media'); // Single unified folder, no subfolder

    const res2 = BookmarkOrganizer.classifyBookmark(redditItem);
    expect(res2.category).toBe('Social');
    expect(res2.suggestedFolder).toBe('Social Media'); // Single unified folder
  });

  it('classifies design domains such as figma into single "Design" folder', () => {
    const item: BookmarkItem = {
      id: '2',
      title: 'Figma UI Kits',
      url: 'https://figma.com/community',
      domain: 'figma.com',
      path: ['Bookmarks Bar'],
      pathString: 'Bookmarks Bar'
    };

    const result = BookmarkOrganizer.classifyBookmark(item);
    expect(result.category).toBe('Design');
    expect(result.suggestedFolder).toBe('Design');
  });

  it('classifies AI domains and keywords accurately into single "AI" folder', () => {
    const item: BookmarkItem = {
      id: '3',
      title: 'ChatGPT - Prompt Engineering',
      url: 'https://chatgpt.com',
      domain: 'chatgpt.com',
      path: ['Bookmarks Bar'],
      pathString: 'Bookmarks Bar'
    };

    const result = BookmarkOrganizer.classifyBookmark(item);
    expect(result.category).toBe('AI');
    expect(result.suggestedFolder).toBe('AI');
    expect(result.confidence).toBeGreaterThanOrEqual(98);
  });

  it('supports reorganizeExisting to re-classify bookmarks that were already inside folders', () => {
    const itemInOldFolder: BookmarkItem = {
      id: 'old-1',
      title: 'GitHub',
      url: 'https://github.com',
      domain: 'github.com',
      path: ['Bookmarks Bar', 'Random Old Stuff'],
      pathString: 'Bookmarks Bar / Random Old Stuff'
    };

    // By default (preserveExisting=true), it won't move items already in a subfolder
    const previewPreserve = BookmarkOrganizer.generatePreview([itemInOldFolder], {
      reorganizeExisting: false
    });
    expect(previewPreserve.willMoveCount).toBe(0);

    // When reorganizeExisting=true, it re-evaluates and plans the move to "Development"
    const previewReorganize = BookmarkOrganizer.generatePreview([itemInOldFolder], {
      reorganizeExisting: true
    });
    expect(previewReorganize.willMoveCount).toBe(1);
    expect(previewReorganize.changes[0].suggestedFolder).toBe('Development');
  });

  it('excludes 404 bookmarks when exclude404Ids is passed', () => {
    const items: BookmarkItem[] = [
      { id: '1', title: 'GitHub', url: 'https://github.com', domain: 'github.com', path: ['Bookmarks Bar'], pathString: 'Bookmarks Bar' },
      { id: '2', title: 'Figma', url: 'https://figma.com', domain: 'figma.com', path: ['Bookmarks Bar'], pathString: 'Bookmarks Bar' }
    ];

    const preview = BookmarkOrganizer.generatePreview(items, {
      exclude404Ids: new Set(['2'])
    });
    expect(preview.willMoveCount).toBe(1);
    expect(preview.changes[0].bookmarkId).toBe('1');
  });

  it('moves loose bookmarks sitting on the Bookmarks Bar into proper folders', () => {
    const looseBookmarks: BookmarkItem[] = [
      {
        id: 'loose-1',
        title: 'OpenAI ChatGPT',
        url: 'https://chatgpt.com',
        domain: 'chatgpt.com',
        path: ['Bookmarks Bar'],
        pathString: 'Bookmarks Bar'
      },
      {
        id: 'loose-2',
        title: 'Random Unknown Personal Site',
        url: 'https://mysite.example.com',
        domain: 'mysite.example.com',
        path: ['Bookmarks Bar'],
        pathString: 'Bookmarks Bar'
      }
    ];

    const preview = BookmarkOrganizer.generatePreview(looseBookmarks);
    // Both loose items must be planned to move (none left behind on the bar)
    expect(preview.willMoveCount).toBe(2);
    expect(preview.changes[0].suggestedFolder).toBe('AI');
    expect(preview.changes[1].suggestedFolder).toBe('Reference');
  });

  it('keeps items already directly in the target consolidated folder and does not move them', () => {
    const alreadyOrganized: BookmarkItem = {
      id: 'already-1',
      title: 'GitHub',
      url: 'https://github.com',
      domain: 'github.com',
      path: ['Bookmarks Bar', 'Development'],
      pathString: 'Bookmarks Bar / Development'
    };

    const preview = BookmarkOrganizer.generatePreview([alreadyOrganized], {
      reorganizeExisting: true
    });
    // Already in ['Bookmarks Bar', 'Development'], so move count is 0
    expect(preview.willMoveCount).toBe(0);
  });
});
