chrome.commands.onCommand.addListener((command) => {
    if (command === "open-picker") {
        togglePicker();
    }
});

chrome.action.onClicked.addListener((tab) => {
    togglePicker();
});

function isRestrictedUrl(url) {
    if (!url) return true;
    return /^(chrome|chrome-extension|chrome-search|edge|about|brave|opera|vivaldi):/i.test(url)
        || url.startsWith('https://chrome.google.com/webstore')
        || url.startsWith('https://chromewebstore.google.com');
}

async function togglePicker() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    // Bail out early on restricted pages
    if (isRestrictedUrl(tab.url)) return;

    try {
        await chrome.tabs.sendMessage(tab.id, { action: "toggle_picker" });
    } catch {
        // Content script not loaded yet — inject it, then retry
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: [
                    "services/data.js",
                    "services/learning.js",
                    "services/emoji-data.js",
                    "services/fuzzy.js",
                    "services/content.js"
                ]
            });
            await chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                files: ["styling/style.css"]
            });
            await chrome.tabs.sendMessage(tab.id, { action: "toggle_picker" });
        } catch {
            // Silently ignore
        }
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "open_settings") {
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
    }
});