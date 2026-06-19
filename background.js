// DiffLens service worker — right-click capture of selected text into A or B.
// No network, no host permissions: contextMenus provides selectionText directly.

const MENU = {
  a: "cleardiff-set-a",
  b: "cleardiff-set-b",
  open: "cleardiff-open",
};

function buildMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU.a,
      title: 'DiffLens: set as Text A (original)',
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: MENU.b,
      title: 'DiffLens: set as Text B (changed)',
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: MENU.open,
      title: 'Open DiffLens (full page)',
      contexts: ["page", "selection", "action"],
    });
  });
}

// Open the full-page compare tool. To avoid piling up duplicate tabs we remember
// the tab id we opened and focus it if it's still alive — WITHOUT the "tabs"
// permission (querying by URL would require it and scare users on install).
let openTabId = null;

function createTool() {
  chrome.tabs.create({ url: chrome.runtime.getURL("compare.html") }, (tab) => {
    openTabId = tab ? tab.id : null;
  });
}
function openFullPage() {
  if (chrome.action && chrome.action.setBadgeText) chrome.action.setBadgeText({ text: "" });
  if (openTabId == null) { createTool(); return; }
  chrome.tabs.update(openTabId, { active: true }, (tab) => {
    if (chrome.runtime.lastError || !tab) { openTabId = null; createTool(); return; }
    if (tab.windowId != null) chrome.windows.update(tab.windowId, { focused: true });
  });
}
chrome.tabs.onRemoved.addListener((id) => { if (id === openTabId) openTabId = null; });

// No popup → clicking the toolbar icon fires this and opens the tool.
chrome.action.onClicked.addListener(openFullPage);

chrome.runtime.onInstalled.addListener(buildMenus);
chrome.runtime.onStartup.addListener(buildMenus);

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === MENU.open) { openFullPage(); return; }
  const text = info.selectionText || "";
  if (!text) return;
  if (info.menuItemId === MENU.a) {
    chrome.storage.local.set({ textA: text });
    flash("A");
  } else if (info.menuItemId === MENU.b) {
    chrome.storage.local.set({ textB: text });
    flash("B");
  }
});

// Badge the toolbar icon so the user knows a capture landed; cleared when the
// popup opens. openPopup() isn't reliably allowed from a context-menu gesture,
// so we signal instead of forcing the popup open.
function flash(label) {
  if (!chrome.action || !chrome.action.setBadgeText) return;
  chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
  chrome.action.setBadgeText({ text: label });
}
