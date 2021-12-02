// Check if any Twitch Pages are opened and manually inject twitch-clicker.js if needed
setTimeout(function () {
    console.log('Checking content script status');
    // Gets all twitch tabs
    chrome.tabs.query({
        url: '*://*.twitch.tv/*',
    }, function (tabs) {
        console.log(tabs);
        // If no Twitch tabs exist, stop the precheck.
        if (!Array.isArray(tabs) || !tabs.length) {
            console.log('No matching tabs found.');
            return null;
        }
        tabs.forEach(function (tab) {
            // Initializes handshake with potential twitch-clicker.js script inside the tab
            chrome.tabs.sendMessage(tab.id, { text: 'check' }, function (msg) {
                if (chrome.runtime.lastError) { msg = {}; }
                else { msg = msg || {}; }
                // If handshake fails (twitch-clicker.js doesn't exist in the tab) - inject the main script and its reverse dependency
                if (msg.status != 'confirmed') {
                    chrome.tabs.executeScript(tab.id, { file: 'filter.js' }, function () {
                        console.log('injected.');
                    });
                }
            });
        });
    })
}, 1000);

function syncTabsFilterList() {
    chrome.tabs.query({
        url: '*://*.twitch.tv/*',
    }, function (tabs) {
        console.log(tabs);
        // If no Twitch tabs exist, stop the precheck.
        if (!Array.isArray(tabs) || !tabs.length) {
            console.log('No matching tabs found.');
            return null;
        }
        var filterList = JSON.parse(localStorage.getItem('filterList'));
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, {
                filterList: filterList
            });
        })
    })
}
function syncPinManager() {
    chrome.tabs.query({
        url: '*://*.twitch.tv/*',
    }, function (tabs) {
        console.log(tabs);
        // If no Twitch tabs exist, stop the precheck.
        if (!Array.isArray(tabs) || !tabs.length) {
            console.log('No matching tabs found.');
            return null;
        }
        var pinManager = localStorage.getItem('PinManager');
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, {
                pinManager: pinManager
            });
        })
    })
}
function syncPinVIP() {
    chrome.tabs.query({
        url: '*://*.twitch.tv/*',
    }, function (tabs) {
        console.log(tabs);
        // If no Twitch tabs exist, stop the precheck.
        if (!Array.isArray(tabs) || !tabs.length) {
            console.log('No matching tabs found.');
            return null;
        }
        var pinVIP = localStorage.getItem('PinVIP');
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, {
                pinVIP: pinVIP
            });
        })
    })
}

// Handle URL change for Twitch Tabs to prevent bonus points detection from breaking
chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    if (details.frameId === 0) { // indicates the navigation happens in the tab content window, not in a subframe
        if (!(details.url.toUpperCase().indexOf('twitch.tv'.toUpperCase()) !== -1)) {
            // Not a Twitch.tv tab, ignoring
            return
        }
        chrome.tabs.sendMessage(details.tabId, {
            urlChanged: 1
        }, function (msg) {
            if (chrome.runtime.lastError) { msg = {}; } else { msg = msg || {}; }
        });
        console.log("onHistoryStateUpdated");
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.method == "getFilterList") {
        var filterList = JSON.parse(localStorage.getItem('filterList'));
        if (filterList) {
            syncTabsFilterList();
            sendResponse({ data: "getFilterList Done" });
        }
    }
    else if (request.method == "setFilterList") {
        localStorage.removeItem('filterList');
        localStorage.setItem('filterList', JSON.stringify(request.filterList));
        sendResponse({ data: "setFilterList Done" });
        syncTabsFilterList();
    }
    else if (request.method == 'getPinManager') {
        syncPinManager();
        sendResponse({ data: "getPinManager Done. " + localStorage.getItem('PinManager') });
    }
    else if (request.method == "setPinManager") {
        localStorage.removeItem('PinManager');
        localStorage.setItem('PinManager', request.buttonState);
        sendResponse({ data: "Set manager button: " + request.buttonState });
        syncPinManager();
    }
    else if (request.method == 'getPinVIP') {
        syncPinVIP();
        sendResponse({ data: "getPinVIP Done. " + localStorage.getItem('PinVIP') });
    }
    else if (request.method == "setPinVIP") {
        localStorage.removeItem('PinVIP');
        localStorage.setItem('PinVIP', request.buttonState);
        sendResponse({ data: "Set VIP button: " + request.buttonState });
        syncPinVIP();
    }
    else {
        sendResponse({ data: "no method" });
    }
});

// Create popup for the extension button
chrome.browserAction.setPopup({ popup: 'popup.html' })