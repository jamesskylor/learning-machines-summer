// Learning Machines OS — background service worker.
//
// Chrome handles `chrome_url_overrides.newtab` (defined in manifest.json) for
// the standard new-tab shortcut. This listener catches the edge case where a
// new tab is opened that briefly points at chrome://startpageshared/ (some
// Chromium builds use this) and redirects it to our override page.
//
// Mirrors the buildspace-os pattern but scoped to LM OS.

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url) return;

  const listener = (tabId, changeInfo) => {
    if (tabId !== tab.id || !changeInfo.url) return;
    if (changeInfo.url.startsWith("chrome://startpageshared/")) {
      chrome.tabs.update(tab.id, { url: "tab_override.html" });
      chrome.tabs.onUpdated.removeListener(listener);
    }
  };

  chrome.tabs.onUpdated.addListener(listener);
});
