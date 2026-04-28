var panel = null;
var searchInput = null;
var tabsContainer = null;
var contentContainer = null;
var selectedIndex = -1;
var currentButtons = [];
var isSearching = false;
window.lastSelectionStart = 0;
window.lastSelectionEnd = 0;

function createPanel() {
    panel = document.createElement('div');
    panel.id = 'my-custom-emoji-picker';

    // Search Input
    searchInput = document.createElement('input');
    searchInput.id = 'my-custom-emoji-search';
    searchInput.placeholder = 'Search emojis or slang (e.g., sus)...';
    searchInput.type = 'text';
    searchInput.autocomplete = 'off';

    // Tabs Container
    tabsContainer = document.createElement('div');
    tabsContainer.id = 'my-custom-emoji-tabs';

    // Content Container (Scrollable)
    contentContainer = document.createElement('div');
    contentContainer.id = 'my-custom-emoji-content';

    panel.appendChild(searchInput);
    panel.appendChild(tabsContainer);
    panel.appendChild(contentContainer);

    // Footer
    const footer = document.createElement('div');
    footer.id = 'my-custom-emoji-footer';
    const manifest = chrome.runtime.getManifest();
    footer.innerHTML = `
        <span class="footer-brand">Remoji v${manifest.version}</span>
        <div class="footer-actions">
            <button id="remoji-pin-btn" class="footer-icon-btn" title="Pin: Keep open after selecting emoji">📌</button>
            <button id="remoji-settings-btn" class="footer-icon-btn" title="Open Settings">⚙️</button>
        </div>
        <span class="footer-license">GPL-3.0</span>
    `;
    panel.appendChild(footer);

    // Initialize Pin state
    chrome.storage.local.get('remoji_pin_state', (res) => {
        const pinBtn = footer.querySelector('#remoji-pin-btn');
        if (pinBtn && res.remoji_pin_state) {
            pinBtn.classList.add('active');
            window.isRemojiPinned = true;
        }
    });

    // Event Listeners
    const pinBtn = footer.querySelector('#remoji-pin-btn');
    pinBtn.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const isActive = btn.classList.toggle('active');
        window.isRemojiPinned = isActive;
        chrome.storage.local.set({ remoji_pin_state: isActive });
        e.stopPropagation();
    });

    const settingsBtn = footer.querySelector('#remoji-settings-btn');
    settingsBtn.onclick = (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ action: "open_settings" });
    };

    document.body.appendChild(panel);

    // Event Listeners
    searchInput.oninput = (e) => {
        EmojiLearner.setSearchQuery(e.target.value);
        handleSearch(e.target.value);
    };
    searchInput.onkeydown = handleKeyDown;
    contentContainer.addEventListener('scroll', handleScrollSpy);

    // Dragging Logic
    let isDragging = false;
    let startX, startY;
    let initialX, initialY;

    panel.addEventListener('mousedown', (e) => {
        // Only allow dragging from the search area or top padding
        const isSearch = e.target.id === 'my-custom-emoji-search';
        const isPanel = e.target.id === 'my-custom-emoji-picker';
        
        if (isSearch || isPanel) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // Get current computed style for positioning
            const rect = panel.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            // Prevent transition during drag
            panel.style.transition = 'none';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const newX = initialX + dx;
        const newY = initialY + dy;
        
        // Update position (remove transform-translate so it uses direct coords)
        panel.style.transform = 'scale(1)';
        panel.style.left = `${newX}px`;
        panel.style.top = `${newY}px`;
        panel.style.margin = '0';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            panel.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
            document.body.style.userSelect = '';
        }
    });

    // Close on click outside (but allow clicking in the target element)
    document.addEventListener('mousedown', (e) => {
        if (panel && !panel.contains(e.target) && panel.classList.contains('visible')) {
            // If user clicks back into their text field, update saved cursor position
            const target = window.lastActiveElement;
            if (target && (target === e.target || target.contains(e.target))) {
                // Let the click happen naturally, then capture new cursor position
                setTimeout(() => {
                    if (target.setSelectionRange) {
                        window.lastSelectionStart = target.selectionStart;
                        window.lastSelectionEnd = target.selectionEnd;
                    }
                    // Always save the Selection Range (works for all contenteditable)
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                        window.lastSavedRange = sel.getRangeAt(0).cloneRange();
                    }
                    // Refocus the search input so the user can keep searching
                    searchInput.focus();
                }, 10);
                return; // Don't close the panel
            }
            togglePanel();
        }
    });
}

async function buildCategories() {
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';
    currentButtons = [];

    // ⭐ Frequently Used tab (dynamic)
    const frequentEmojis = await EmojiLearner.getFrequentEmojis();

    if (frequentEmojis.length > 0) {
        // Create ⭐ tab
        const freqTab = document.createElement('button');
        freqTab.className = 'category-tab active';
        freqTab.innerText = '⭐';
        freqTab.title = 'Frequently Used';
        freqTab.dataset.id = 'frequent';
        freqTab.onclick = () => scrollToCategory('frequent');
        tabsContainer.appendChild(freqTab);

        // Create ⭐ section
        const freqSection = document.createElement('div');
        freqSection.className = 'category-section';
        freqSection.id = 'category-frequent';

        const freqHeader = document.createElement('div');
        freqHeader.className = 'category-header';
        freqHeader.innerText = 'Frequently Used';
        freqSection.appendChild(freqHeader);

        const freqGrid = document.createElement('div');
        freqGrid.className = 'emoji-grid-inner';

        frequentEmojis.forEach(emoji => {
            const btn = createEmojiButton(emoji);
            freqGrid.appendChild(btn);
            currentButtons.push(btn);
        });

        freqSection.appendChild(freqGrid);
        contentContainer.appendChild(freqSection);
    }

    // Regular category tabs
    EMOJI_CATEGORIES.forEach((category, index) => {
        // Create Tab
        const tab = document.createElement('button');
        tab.className = 'category-tab';
        tab.innerText = category.icon;
        tab.title = category.name;
        tab.dataset.id = category.id;
        // If no frequent emojis, first category is active
        if (frequentEmojis.length === 0 && index === 0) tab.classList.add('active');

        tab.onclick = () => scrollToCategory(category.id);
        tabsContainer.appendChild(tab);

        // Create Section
        const section = document.createElement('div');
        section.className = 'category-section';
        section.id = `category-${category.id}`;

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerText = category.name;
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'emoji-grid-inner';

        Object.keys(category.emojis).forEach(emoji => {
            const btn = createEmojiButton(emoji);
            grid.appendChild(btn);
            currentButtons.push(btn);
        });

        section.appendChild(grid);
        contentContainer.appendChild(section);
    });
}

function createEmojiButton(emoji) {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.innerText = emoji;
    btn.onclick = () => insertSymbol(emoji);
    btn.onmouseenter = () => updateSelectionByButton(btn);
    return btn;
}

function scrollToCategory(id) {
    const section = document.getElementById(`category-${id}`);
    if (section) {
        contentContainer.removeEventListener('scroll', handleScrollSpy);

        // Update active tab manually
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.category-tab[data-id="${id}"]`).classList.add('active');

        section.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Re-enable scroll spy after scrolling finishes
        setTimeout(() => {
            contentContainer.addEventListener('scroll', handleScrollSpy);
        }, 500);
    }
}

function handleScrollSpy() {
    if (isSearching) return;

    const sections = contentContainer.querySelectorAll('.category-section');
    let currentId = '';

    for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const containerRect = contentContainer.getBoundingClientRect();

        if (rect.top <= containerRect.top + 50) {
            currentId = section.id.replace('category-', '');
        } else {
            break;
        }
    }

    if (!currentId && sections.length > 0) {
        currentId = sections[0].id.replace('category-', '');
    }

    if (currentId) {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.category-tab[data-id="${currentId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
}

async function handleSearch(query) {
    const q = query.trim();

    if (!q) {
        isSearching = false;
        panel.classList.remove('is-searching');
        await buildCategories(); // Reset to category view
        return;
    }

    isSearching = true;
    panel.classList.add('is-searching');
    contentContainer.innerHTML = '';
    currentButtons = [];

    // Use enhanced search with learned keywords
    const results = await emojiSearcher.searchWithLearning(q);

    if (results.length === 0) {
        contentContainer.innerHTML = '<div class="no-results"><div style="font-size: 24px;">😢</div><div>No emojis found</div></div>';
        selectedIndex = -1;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'emoji-grid-inner';

    results.forEach((emoji, index) => {
        const btn = createEmojiButton(emoji);
        grid.appendChild(btn);
        currentButtons.push(btn);
    });

    contentContainer.appendChild(grid);
    setSelectedIndex(0);
}

function updateSelectionByButton(btn) {
    const index = currentButtons.indexOf(btn);
    if (index !== -1) {
        setSelectedIndex(index);
    }
}

function setSelectedIndex(index) {
    if (selectedIndex >= 0 && currentButtons[selectedIndex]) {
        currentButtons[selectedIndex].classList.remove('selected');
    }

    selectedIndex = index;

    if (selectedIndex >= 0 && currentButtons[selectedIndex]) {
        currentButtons[selectedIndex].classList.add('selected');
        if (isSearching) {
            currentButtons[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }
}

function handleKeyDown(e) {
    if (currentButtons.length === 0) return;

    const columns = 6;

    if (e.key === 'ArrowRight') {
        setSelectedIndex(Math.min(selectedIndex + 1, currentButtons.length - 1));
        e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
        e.preventDefault();
    } else if (e.key === 'ArrowDown') {
        setSelectedIndex(Math.min(selectedIndex + columns, currentButtons.length - 1));
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        setSelectedIndex(Math.max(selectedIndex - columns, 0));
        e.preventDefault();
    } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && currentButtons[selectedIndex]) {
            currentButtons[selectedIndex].click();
        }
        e.preventDefault();
    } else if (e.key === 'Escape') {
        togglePanel();
        e.preventDefault();
    }
}

function getDeepActiveElement() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) {
        el = el.shadowRoot.activeElement;
    }
    return el;
}

function showAchievementToast(ach) {
    let toast = document.getElementById('remoji-achievement-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'remoji-achievement-toast';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `
        <div class="icon">🏆</div>
        <div>
            <div class="title">${ach.title}</div>
            <div class="desc">${ach.desc}</div>
        </div>
    `;

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

async function insertSymbol(symbol) {
    // Record usage via learning engine
    await EmojiLearner.recordSelection(symbol);

    const activeEl = window.lastActiveElement || getDeepActiveElement();
    if (!activeEl) {
        togglePanel();
        return;
    }

    // Always focus back to the target element first
    activeEl.focus();

    const start = window.lastSelectionStart || 0;
    const end = window.lastSelectionEnd || 0;

    // For standard inputs/textareas, use direct value manipulation (most reliable)
    if (activeEl.value !== undefined && activeEl.setSelectionRange) {
        try {
            activeEl.setSelectionRange(start, end);
            const val = activeEl.value;
            activeEl.value = val.slice(0, start) + symbol + val.slice(end);

            const newPos = start + symbol.length;
            activeEl.setSelectionRange(newPos, newPos);

            // Trigger events so frameworks know the value changed
            activeEl.dispatchEvent(new Event('input', { bubbles: true }));
            activeEl.dispatchEvent(new Event('change', { bubbles: true }));

            // Update saved position
            window.lastSelectionStart = newPos;
            window.lastSelectionEnd = newPos;
        } catch (e) {
            console.error("Direct insertion failed:", e);
        }
    } else {
        // For contenteditable elements (YouTube, Twitter, Discord, Messenger, etc.)
        try {
            // Restore saved selection range before inserting
            if (window.lastSavedRange) {
                // Find the actual contenteditable element from the saved range
                let editableEl = window.lastSavedRange.startContainer;
                if (editableEl.nodeType === Node.TEXT_NODE) editableEl = editableEl.parentElement;
                while (editableEl && !editableEl.isContentEditable) {
                    editableEl = editableEl.parentElement;
                }
                if (editableEl) editableEl.focus();

                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(window.lastSavedRange);
            }

            document.execCommand('insertText', false, symbol);

            // Update saved range to the new cursor position
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                window.lastSavedRange = sel.getRangeAt(0).cloneRange();
            }
        } catch (e) {
            console.warn("Contenteditable insertion failed:", e);
        }
    }

    if (!window.isRemojiPinned) {
        togglePanel();
    }
}

async function togglePanel() {
    if (!panel) createPanel();

    const isVisible = panel.classList.contains('visible');

    if (!isVisible) {
        const activeEl = getDeepActiveElement();
        window.lastActiveElement = activeEl;
        
        // Capture selection for input/textarea
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            window.lastSelectionStart = activeEl.selectionStart;
            window.lastSelectionEnd = activeEl.selectionEnd;
        }

        // Always save the browser Selection Range as a fallback.
        // This catches ALL contenteditable scenarios (YouTube, Twitter, Discord, etc.)
        // even when the activeElement itself doesn't report isContentEditable.
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            window.lastSavedRange = sel.getRangeAt(0).cloneRange();
        } else {
            window.lastSavedRange = null;
        }
        
        // Handle themes and achievements
        let result = null;
        if (typeof window.EmojiAchievements !== 'undefined') {
            try {
                result = await window.EmojiAchievements.recordVisit();
            } catch (e) {
                console.warn("Remoji: Achievement recording failed (Extension context might be invalidated)", e);
            }
        }
        
        const theme = result ? result.theme : null;
        const ach = result ? result.achievement : null;

        // Remove existing theme classes
        Array.from(panel.classList).forEach(cls => {
            if (cls.startsWith('theme-')) panel.classList.remove(cls);
        });
        if (theme) panel.classList.add(`theme-${theme}`);
        
        if (ach) showAchievementToast(ach);

        panel.classList.add('visible');
        searchInput.value = '';
        isSearching = false;
        panel.classList.remove('is-searching');
        await buildCategories(); // Rebuild with fresh frequent data
        setTimeout(() => searchInput.focus(), 50);
    } else {
        panel.classList.remove('visible');
        if (window.lastActiveElement) {
            window.lastActiveElement.focus();
        }
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "toggle_picker") {
        togglePanel();
        sendResponse({ success: true });
    }
});