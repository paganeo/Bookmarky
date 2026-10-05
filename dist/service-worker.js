chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus && (chrome.contextMenus.create({
    id: "bookmarky_save_page",
    title: "Save to Bookmarky",
    contexts: ["page", "link"]
  }), chrome.contextMenus.create({
    id: "bookmarky_open_dashboard",
    title: "Open Bookmarky Dashboard",
    contexts: ["action"]
  }));
});
chrome.contextMenus.onClicked.addListener((e, o) => {
  if (e.menuItemId === "bookmarky_save_page") {
    const r = e.linkUrl || e.pageUrl || (o == null ? void 0 : o.url), t = (o == null ? void 0 : o.title) || "Saved Bookmark";
    r && chrome.bookmarks.create(
      {
        parentId: "1",
        // Bookmarks Bar
        title: t,
        url: r
      },
      () => {
        chrome.notifications && chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Bookmarky",
          message: `Saved "${t.slice(0, 40)}" to Bookmarks Bar.`
        });
      }
    );
  } else e.menuItemId === "bookmarky_open_dashboard" && chrome.tabs.create({
    url: chrome.runtime.getURL("dashboard.html")
  });
});
chrome.commands.onCommand.addListener((e) => {
  e === "open_dashboard" && chrome.tabs.create({
    url: chrome.runtime.getURL("dashboard.html")
  });
});
