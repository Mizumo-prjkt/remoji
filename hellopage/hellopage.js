// hellopage.js — Orchestrates UI transitions, version injection, and action buttons on the Remoji welcome/update guide.

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason') || 'install';
    const prevVersion = params.get('prev');
    const currentVersion = params.get('current') || chrome.runtime.getManifest().version;

    // Display correct section based on trigger reason
    const welcomeSection = document.getElementById('welcome-section');
    const upgradeSection = document.getElementById('upgrade-section');

    if (reason === 'update') {
        upgradeSection.classList.add('active');
        // Update current version string
        const currentVersionSpan = document.querySelector('.current-version');
        if (currentVersionSpan) {
            currentVersionSpan.textContent = `v${currentVersion}`;
        }
    } else {
        welcomeSection.classList.add('active');
    }

    // Dynamic OS Hotkey Customization
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKbd = document.getElementById('ctrl-kbd');
    if (isMac && ctrlKbd) {
        ctrlKbd.textContent = 'Cmd ⌘';
    }

    // Button Event Listeners
    const openSettingsBtns = ['open-settings-btn-1', 'open-settings-btn-2'];
    const closeTabBtns = ['close-tab-btn-1', 'close-tab-btn-2'];

    openSettingsBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                chrome.runtime.sendMessage({ action: "open_settings" });
            });
        }
    });

    closeTabBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                // Safely close the tab
                window.close();
            });
        }
    });
});
