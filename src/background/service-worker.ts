/**
 * Bookmarky Service Worker (Manifest V3)
 */

chrome.runtime.onInstalled.addListener(() => {
  // Setup Context Menus
  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: 'bookmarky_save_page',
      title: 'Save to Bookmarky',
      contexts: ['page', 'link']
    });

    chrome.contextMenus.create({
      id: 'bookmarky_open_dashboard',
      title: 'Open Bookmarky Dashboard',
      contexts: ['action']
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'bookmarky_save_page') {
    const url = info.linkUrl || info.pageUrl || tab?.url;
    const title = tab?.title || 'Saved Bookmark';

    if (url) {
      chrome.bookmarks.create(
        {
          parentId: '1', // Bookmarks Bar
          title,
          url
        },
        () => {
          if (chrome.notifications) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'Bookmarky',
              message: `Saved "${title.slice(0, 40)}" to Bookmarks Bar.`
            });
          }
        }
      );
    }
  } else if (info.menuItemId === 'bookmarky_open_dashboard') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html')
    });
  }
});

// Handle Keyboard Commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open_dashboard') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html')
    });
  }
});
