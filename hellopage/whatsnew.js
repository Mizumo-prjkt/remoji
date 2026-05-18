// whatsnew.js — Listens for extension install or update events and opens the Remoji Hello/Update page.
// Imported into services/background.js.

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Open the hello page with 'install' reason to display the user guide
        chrome.tabs.create({
            url: chrome.runtime.getURL('hellopage/hellopage.html?reason=install')
        });
    } else if (details.reason === 'update') {
        const currentVersion = chrome.runtime.getManifest().version;
        const prevVersion = details.previousVersion || '1.0.3';
        
        // Only open the page if the version actually changed to prevent duplicate triggers
        if (prevVersion !== currentVersion) {
            chrome.tabs.create({
                url: chrome.runtime.getURL(`hellopage/hellopage.html?reason=update&prev=${prevVersion}&current=${currentVersion}`)
            });
        }
    }
});
