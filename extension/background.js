// Tab metadata cache to beat the Chrome onRemoved race condition
const tabCache = {};

// Whitelist configuration to safeguard vital developer, system, and authentication tabs
const WHITELIST_PROTOCOLS = [
  "chrome://",
  "chrome-extension://",
  "edge://",
  "brave://",
  "opera://",
  "devtools://",
  "about:",
  "view-source:",
  "blob:",
  "data:"
];

const WHITELIST_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "accounts.google.com",
  "login.microsoftonline.com",
  "appleid.apple.com",
  "auth0.com"
];

const WHITELIST_PATTERNS = [
  /courtroom\.html/i,
  /^https?:\/\/github\.com\/login/i,
  /^https?:\/\/([^/]+\.)?auth0\.com/i,
  /^https?:\/\/id\.atlassian\.com/i
];

/**
 * Fast evaluation helper to check if a URL belongs to the whitelist.
 * @param {string} rawUrl 
 * @returns {boolean}
 */
function isWhitelisted(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return true;

  const urlStr = rawUrl.trim();
  if (!urlStr || urlStr === "about:blank") return true;

  // 1. Check protocol prefixes
  for (const proto of WHITELIST_PROTOCOLS) {
    if (urlStr.startsWith(proto)) return true;
  }

  // 2. Check regex patterns (courtroom page, specific login endpoints)
  for (const pattern of WHITELIST_PATTERNS) {
    if (pattern.test(urlStr)) return true;
  }

  // 3. Check domain hostnames
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    for (const whitelistedHost of WHITELIST_HOSTS) {
      if (hostname === whitelistedHost || hostname.endsWith("." + whitelistedHost)) {
        return true;
      }
    }
  } catch {
    if (urlStr.includes("courtroom.html") || urlStr.includes("localhost") || urlStr.includes("127.0.0.1")) {
      return true;
    }
  }

  return false;
}

/**
 * Persistent Court Session Manager (Survives MV3 Service Worker restarts)
 */
async function getCourtSession() {
  try {
    const data = await chrome.storage.local.get([
      'isCourtActive',
      'courtStatus',
      'activeCourtTabId',
      'activeCourtWindowId',
      'activeCourtUrl'
    ]);
    return {
      isCourtActive: Boolean(data.isCourtActive),
      courtStatus: data.courtStatus || "IDLE", // "IDLE" | "IN_SESSION" | "ADJOURNED"
      activeCourtTabId: data.activeCourtTabId || null,
      activeCourtWindowId: data.activeCourtWindowId || null,
      activeCourtUrl: data.activeCourtUrl || null
    };
  } catch (err) {
    return {
      isCourtActive: false,
      courtStatus: "IDLE",
      activeCourtTabId: null,
      activeCourtWindowId: null,
      activeCourtUrl: null
    };
  }
}

async function setCourtSession(session) {
  try {
    await chrome.storage.local.set({
      isCourtActive: Boolean(session.isCourtActive),
      courtStatus: session.courtStatus || "IN_SESSION",
      activeCourtTabId: session.activeCourtTabId || null,
      activeCourtWindowId: session.activeCourtWindowId || null,
      activeCourtUrl: session.activeCourtUrl || null
    });
  } catch (err) {}
}

// In-memory clean adjournment tracking to eliminate race conditions between storage and tab removal
const adjournedTabIds = new Set();
let isAdjourning = false;

async function clearCourtSession() {
  isAdjourning = true;
  try {
    await chrome.storage.local.set({
      isCourtActive: false,
      courtStatus: "ADJOURNED",
      activeCourtTabId: null,
      activeCourtWindowId: null,
      activeCourtUrl: null
    });
  } catch (err) {}
}

/**
 * Universal Fail-Safe Adjournment: Closes all courtroom tabs across Chrome
 * and restores browser windows back to normal.
 */
async function executeAdjournAndCloseAll(targetWinId = null) {
  console.log("[Tab Courtroom] Executing universal courtroom adjournment & tab closure...");
  isAdjourning = true;

  // 1. Disarm persistent court session state
  await clearCourtSession();

  // 2. Clear pending auto-close alarms
  if (chrome.alarms && chrome.alarms.clear) {
    chrome.alarms.clear("COURT_AUTO_CLOSE").catch(() => {});
  }

  // 3. Query all tabs running courtroom.html across all windows and close them
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({}, (tabs) => {
      if (tabs) {
        for (const t of tabs) {
          if (t.id && t.url && t.url.includes("courtroom.html")) {
            adjournedTabIds.add(t.id);
            chrome.tabs.remove(t.id).catch((e) => {
              console.warn(`[Tab Courtroom] tabs.remove on tab ${t.id} note:`, e);
            });
          }
        }
      }
    });
  }

  // 4. Restore window state from fullscreen to normal
  setTimeout(() => {
    if (targetWinId && chrome.windows?.update) {
      chrome.windows.update(targetWinId, { state: "normal" }).catch(() => {});
    } else if (chrome.windows?.getAll) {
      chrome.windows.getAll({ windowTypes: ['normal'] }, (wins) => {
        if (wins) {
          for (const w of wins) {
            if (w.state === "fullscreen") {
              chrome.windows.update(w.id, { state: "normal" }).catch(() => {});
            }
          }
        }
      });
    }
    // Hold isAdjourning true for 5 seconds to absorb all tab close events safely
    setTimeout(() => {
      isAdjourning = false;
    }, 5000);
  }, 400);
}

// Listen for auto-close timer alarms (e.g. 15s pardon, 30m guilty)
chrome.alarms?.onAlarm?.addListener((alarm) => {
  if (alarm.name === "COURT_AUTO_CLOSE") {
    console.log("⏰ [Tab Courtroom] Auto-close alarm fired. Adjourning court now!");
    executeAdjournAndCloseAll();
  }
});

// 1. Initialize tab cache on startup so already-open tabs can be evicted
function initTabCache() {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({}, (tabs) => {
      if (tabs) {
        for (const tab of tabs) {
          if (tab.id && tab.url && !isWhitelisted(tab.url)) {
            tabCache[tab.id] = {
              url: tab.url,
              title: tab.title || tab.url
            };
          }
        }
      }
    });
  }
}

initTabCache();
chrome.runtime.onInstalled.addListener(initTabCache);
chrome.runtime.onStartup.addListener(initTabCache);

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id && tab.url && !isWhitelisted(tab.url)) {
    tabCache[tab.id] = {
      url: tab.url,
      title: tab.title || tab.url
    };
  }
});

// 2. Continuously cache tab title & URL while active, skipping whitelisted tabs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // If ANY tab opens or navigates to courtroom.html, immediately track it and enforce fullscreen
  if (tab.url && tab.url.includes("courtroom.html")) {
    const session = await getCourtSession();
    // Do not re-lock if the court is already marked ADJOURNED
    if (session.courtStatus !== "ADJOURNED") {
      await setCourtSession({
        isCourtActive: true,
        courtStatus: "IN_SESSION",
        activeCourtTabId: tabId,
        activeCourtWindowId: tab.windowId,
        activeCourtUrl: tab.url
      });

      if (tab.windowId) {
        chrome.windows.update(tab.windowId, { state: "fullscreen", focused: true }).catch(() => {});
      }
    }
  }

  if (!tab.url || isWhitelisted(tab.url)) {
    delete tabCache[tabId];
    return;
  }
  tabCache[tabId] = {
    url: tab.url,
    title: tab.title || tab.url
  };
});

// 3. Clean up cache when tab is replaced (e.g. prerendering)
chrome.tabs.onReplaced?.addListener((addedTabId, removedTabId) => {
  delete tabCache[removedTabId];
});

// 4. Intercept tab close with whitelist protection & anti-escape annoyance
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // If this tab was adjourned or marked for clean removal, NEVER resurrect it!
  if (adjournedTabIds.has(tabId) || isAdjourning) {
    adjournedTabIds.delete(tabId);
    console.log(`[Tab Courtroom] Tab ${tabId} closed cleanly during court adjournment. No resurrection.`);
    delete tabCache[tabId];
    return;
  }

  const session = await getCourtSession();

  // If court session is marked ADJOURNED or not active, allow normal closure
  if (session.courtStatus === "ADJOURNED" || !session.isCourtActive) {
    delete tabCache[tabId];
    return;
  }

  // Annoyance: Only resurrect IF court is actively IN_SESSION!
  // If the court is ADJOURNED, allow the tab to close cleanly without resurrection!
  if (session.courtStatus === "IN_SESSION" && session.isCourtActive && tabId === session.activeCourtTabId && session.activeCourtUrl) {
    console.warn("[Tab Courtroom] Contempt of court! Escape attempt blocked. Re-opening courtroom!");
    const baseCourtUrl = session.activeCourtUrl;
    const sep = baseCourtUrl.includes("?") ? "&" : "?";
    const contemptUrl = baseCourtUrl.includes("contempt=1") ? baseCourtUrl : `${baseCourtUrl}${sep}contempt=1`;

    chrome.tabs.create({ url: contemptUrl, active: true }, async (newTab) => {
      if (newTab && newTab.id) {
        const fullUrl = `${contemptUrl}&courtTabId=${newTab.id}&courtWinId=${newTab.windowId}`;
        chrome.tabs.update(newTab.id, { url: fullUrl }).catch(() => {});
        await setCourtSession({
          isCourtActive: true,
          courtStatus: "IN_SESSION",
          activeCourtTabId: newTab.id,
          activeCourtWindowId: newTab.windowId,
          activeCourtUrl: fullUrl
        });
        if (newTab.windowId) {
          chrome.windows.update(newTab.windowId, { state: "fullscreen", focused: true }).catch(() => {});
        }
      }
    });
    return;
  }

  const closedTab = tabCache[tabId];
  delete tabCache[tabId];

  if (!closedTab || !closedTab.url) return;

  // Loop guard & whitelist check: skip eviction if whitelisted
  if (isWhitelisted(closedTab.url)) {
    return;
  }

  // Launch Courtroom Tab passing metadata via URL parameters
  const baseCourtUrl = chrome.runtime.getURL(
    `courtroom.html?url=${encodeURIComponent(closedTab.url)}&title=${encodeURIComponent(closedTab.title || closedTab.url)}`
  );

  chrome.tabs.create({ url: baseCourtUrl, active: true }, async (tab) => {
    if (chrome.runtime.lastError) {
      console.warn("[Tab Courtroom] Failed to open courtroom tab:", chrome.runtime.lastError.message);
      return;
    }
    if (tab && tab.id) {
      const fullCourtUrl = `${baseCourtUrl}&courtTabId=${tab.id}&courtWinId=${tab.windowId}`;
      chrome.tabs.update(tab.id, { url: fullCourtUrl }).catch(() => {});
      await setCourtSession({
        isCourtActive: true,
        courtStatus: "IN_SESSION",
        activeCourtTabId: tab.id,
        activeCourtWindowId: tab.windowId,
        activeCourtUrl: fullCourtUrl
      });

      // Automatically make courtroom window full screen!
      if (tab.windowId) {
        chrome.windows.update(tab.windowId, { state: "fullscreen", focused: true }).catch(() => {});
      }
    }
  });
});

// 5. ANNOYANCE ENGINE: Prevent switching away from the courtroom tab until trial finishes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (isAdjourning) return;
  const session = await getCourtSession();
  if (session.courtStatus === "IN_SESSION" && session.isCourtActive && session.activeCourtTabId && activeInfo.tabId !== session.activeCourtTabId) {
    chrome.tabs.update(session.activeCourtTabId, { active: true }).catch(() => {});
    if (session.activeCourtWindowId) {
      chrome.windows.update(session.activeCourtWindowId, { focused: true }).catch(() => {});
    }
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE || isAdjourning) return;
  const session = await getCourtSession();
  if (session.courtStatus === "IN_SESSION" && session.isCourtActive && session.activeCourtWindowId && windowId !== session.activeCourtWindowId) {
    chrome.windows.update(session.activeCourtWindowId, { focused: true }).catch(() => {});
    if (session.activeCourtTabId) {
      chrome.tabs.update(session.activeCourtTabId, { active: true }).catch(() => {});
    }
  }
});

// 6. Toolbar action button click launches courtroom in fullscreen
chrome.action?.onClicked?.addListener((tab) => {
  const baseCourtUrl = chrome.runtime.getURL("courtroom.html");
  chrome.tabs.create({ url: baseCourtUrl, active: true }, async (newTab) => {
    if (newTab && newTab.id) {
      const fullCourtUrl = `${baseCourtUrl}?courtTabId=${newTab.id}&courtWinId=${newTab.windowId}`;
      chrome.tabs.update(newTab.id, { url: fullCourtUrl }).catch(() => {});
      await setCourtSession({
        isCourtActive: true,
        courtStatus: "IN_SESSION",
        activeCourtTabId: newTab.id,
        activeCourtWindowId: newTab.windowId,
        activeCourtUrl: fullCourtUrl
      });
      if (newTab.windowId) {
        chrome.windows.update(newTab.windowId, { state: "fullscreen", focused: true }).catch(() => {});
      }
    }
  });
});

// 7. Listen for courtroom actions & state updates with robust error handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleRuntimeMessage(message, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ status: "error", message: err.message }));
  return true; // Keep message channel open for asynchronous sendResponse
});

async function handleRuntimeMessage(message, sender) {
  if (message.action === "COURT_OPENED") {
    const session = await getCourtSession();
    const tabId = message.tabId || sender?.tab?.id || session.activeCourtTabId;
    const winId = message.windowId || sender?.tab?.windowId || session.activeCourtWindowId;
    const url = message.url || sender?.tab?.url || session.activeCourtUrl;

    await setCourtSession({
      isCourtActive: true,
      courtStatus: "IN_SESSION",
      activeCourtTabId: tabId,
      activeCourtWindowId: winId,
      activeCourtUrl: url
    });

    if (winId) {
      chrome.windows.update(winId, { state: "fullscreen", focused: true }).catch(() => {});
    } else {
      chrome.windows.getLastFocused((lastWin) => {
        if (lastWin && lastWin.id) {
          chrome.windows.update(lastWin.id, { state: "fullscreen", focused: true }).catch(() => {});
        }
      });
    }

    return { status: "court_locked", courtTabId: tabId };
  }

  if (message.action === "REQUEST_FULLSCREEN") {
    const session = await getCourtSession();
    const winId = message.windowId || sender?.tab?.windowId || session.activeCourtWindowId;
    if (winId) {
      chrome.windows.update(winId, { state: "fullscreen", focused: true }).catch(() => {});
    } else {
      chrome.windows.getLastFocused((currWin) => {
        if (currWin && currWin.id) {
          chrome.windows.update(currWin.id, { state: "fullscreen", focused: true }).catch(() => {});
        }
      });
    }
    return { status: "fullscreen_enforced" };
  }

  if (message.action === "RETAIN_COURT_FOCUS") {
    const session = await getCourtSession();
    if (session.courtStatus === "IN_SESSION" && session.isCourtActive && session.activeCourtTabId) {
      chrome.tabs.update(session.activeCourtTabId, { active: true }).catch(() => {});
      if (session.activeCourtWindowId) {
        chrome.windows.update(session.activeCourtWindowId, { focused: true }).catch(() => {});
      }
    }
    return { status: "focus_retained" };
  }

  if (message.action === "SCHEDULE_AUTO_CLOSE") {
    const seconds = message.delaySeconds || 15;
    const targetWinId = message.windowId || sender?.tab?.windowId;
    console.log(`[Tab Courtroom] Scheduling background auto-close in ${seconds}s (winId: ${targetWinId})...`);

    // 1. Alarm for persistent background execution even if Service Worker sleeps
    if (chrome.alarms && chrome.alarms.create) {
      chrome.alarms.create("COURT_AUTO_CLOSE", { delayInMinutes: Math.max(0.1, seconds / 60) });
    }

    // 2. Direct setTimeout backup if process stays awake
    setTimeout(() => {
      executeAdjournAndCloseAll(targetWinId);
    }, seconds * 1000);

    return { status: "auto_close_scheduled", seconds };
  }

  if (message.action === "ADJOURN_AND_CLOSE" || message.action === "CLOSE_COURT_TAB" || message.action === "TRIAL_FINISHED" || message.action === "COURT_ADJOURNED") {
    const session = await getCourtSession();
    const targetWinId = message.windowId || sender?.tab?.windowId || session.activeCourtWindowId;
    const targetTabId = message.tabId || sender?.tab?.id || session.activeCourtTabId;

    if (targetTabId) adjournedTabIds.add(targetTabId);
    if (session.activeCourtTabId) adjournedTabIds.add(session.activeCourtTabId);

    await executeAdjournAndCloseAll(targetWinId);
    return { status: "court_unlocked_and_closed", closedTabId: targetTabId };
  }

  if (message.action === "REVIVE_TAB" && message.url) {
    const session = await getCourtSession();
    const courtTabId = message.courtTabId || sender?.tab?.id || session.activeCourtTabId;
    const courtWindowId = message.courtWindowId || sender?.tab?.windowId || session.activeCourtWindowId;

    return new Promise((resolve) => {
      chrome.windows.getAll({ populate: false, windowTypes: ['normal'] }, (allWindows) => {
        let targetWindowId = null;
        if (allWindows && allWindows.length > 0) {
          const otherWin = allWindows.find(w => w.id !== courtWindowId);
          targetWindowId = otherWin ? otherWin.id : (courtWindowId || allWindows[0].id);
        }

        const createOptions = {
          url: message.url,
          pinned: true,
          active: false
        };
        if (targetWindowId !== null) {
          createOptions.windowId = targetWindowId;
        }

        chrome.tabs.create(createOptions, (newTab) => {
          if (chrome.runtime.lastError) {
            console.warn("[Tab Courtroom] Tab revival failed:", chrome.runtime.lastError.message);
            resolve({ status: "error", error: chrome.runtime.lastError.message });
            return;
          }

          if (newTab && newTab.id) {
            chrome.tabs.update(newTab.id, { active: false }).catch(() => {});
          }

          // Lock focus firmly back on the courtroom tab and window
          const retainCourtFocus = () => {
            if (courtTabId) {
              chrome.tabs.update(courtTabId, { active: true }).catch(() => {});
            }
            if (courtWindowId) {
              chrome.windows.update(courtWindowId, { focused: true }).catch(() => {});
            }
          };

          retainCourtFocus();
          setTimeout(retainCourtFocus, 50);
          setTimeout(retainCourtFocus, 250);

          resolve({ status: "tab_resurrected", tabId: newTab ? newTab.id : null });
        });
      });
    });
  }

  return { status: "unknown_action" };
}