document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('remoji-version').textContent = 'v' + chrome.runtime.getManifest().version;
    initNavigation();
    loadAllData();
    initSettings();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    const sectionTitle = document.getElementById('section-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;
            
            // Update nav
            navItems.forEach(ni => ni.classList.remove('active'));
            item.classList.add('active');

            // Update sections
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`section-${sectionId}`).classList.add('active');

            // Update title
            sectionTitle.textContent = item.textContent.trim();
        });
    });
}

async function loadAllData() {
    const all = await chrome.storage.local.get(null);
    const settings = all.remoji_settings || { learningEnabled: true, frequentMode: 'site', maxFrequent: 5 };
    
    // Stats
    const globalData = all.remoji_global || {};
    const learnedData = all.remoji_learned || {};
    const siteKeys = Object.keys(all).filter(k => k.startsWith('remoji_site_'));
    const achData = all.remoji_achievements || { unlockedIds: [], uniqueThemedSites: [], totalThemedOpens: 0 };

    const totalUsed = Object.values(globalData).reduce((a, b) => a + b, 0);
    document.getElementById('stat-total-used').textContent = totalUsed.toLocaleString();
    document.getElementById('stat-learned-count').textContent = Object.keys(learnedData).length;
    document.getElementById('stat-domain-count').textContent = siteKeys.length;
    document.getElementById('stat-secrets-count').textContent = achData.unlockedIds.length;

    // Status Tag
    const statusTag = document.getElementById('status-tag');
    if (settings.learningEnabled) {
        statusTag.textContent = '● Learning Enabled';
        statusTag.style.color = '#16a34a';
        statusTag.style.background = '#f0fdf4';
    } else {
        statusTag.textContent = '● Learning Disabled';
        statusTag.style.color = '#dc2626';
        statusTag.style.background = '#fef2f2';
    }

    renderGlobalTop(globalData);
    renderDomainBreakdown(all, siteKeys);
    renderLearnedData(learnedData);
    renderAchievements(achData);
}

function renderAchievements(achData) {
    const container = document.getElementById('achievements-grid');
    const definitions = [
        { id: 'visited_5_secrets', name: 'Secret Collector', desc: 'Find 5 secret stylings', icon: '🕵️' },
        { id: 'hatsune_remoji', name: 'Miku Remoji', desc: 'Visited r/hatsune', icon: '🌐', secret: true },
        { id: 'teto_remoji', name: 'Teto Remoji', desc: 'Visited r/KasaneTeto', icon: '🥖', secret: true },
        { id: 'luka_remoji', name: 'Luka Remoji', desc: 'Visited r/megurineluka', icon: '🐙', secret: true },
        { id: 'neru_remoji', name: 'Neru Remoji', desc: 'Visited r/akitaneru', icon: '📱', secret: true },
        { id: 'linux_remoji', name: 'Linux Remoji', desc: 'Visited r/linux', icon: '🐧', secret: true },
        { id: 'sekai_remoji', name: 'Sekai Remoji', desc: 'Visited r/projectsekai', icon: '🎹', secret: true },
        { id: 'zundamon_remoji', name: 'Zundamon Remoji', desc: 'Visited 4chan or r/zundamon', icon: '🫛', secret: true }
    ];

    container.innerHTML = definitions.map(ach => {
        const isUnlocked = achData.unlockedIds.includes(ach.id);
        if (ach.secret && !isUnlocked) {
            return `
                <div class="stat-card" style="opacity: 0.4; filter: grayscale(1); border-style: dashed;">
                    <div style="font-size: 24px; margin-bottom: 8px;">❓</div>
                    <div class="label">Hidden Achievement</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Explore more to unlock</div>
                </div>
            `;
        }

        return `
            <div class="stat-card" style="${isUnlocked ? 'border-color: var(--primary); background: rgba(37,99,235,0.05);' : 'opacity: 0.6;'}">
                <div style="font-size: 24px; margin-bottom: 8px;">${isUnlocked ? ach.icon : '🔒'}</div>
                <div class="label" style="font-weight: 700; color: var(--text-main);">${ach.name} ${isUnlocked ? '✅' : ''}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${ach.desc}</div>
            </div>
        `;
    }).join('');
}

function renderGlobalTop(globalData) {
    const container = document.getElementById('global-top-list');
    const sorted = Object.entries(globalData).sort((a, b) => b[1] - a[1]).slice(0, 10);

    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state">No usage data yet.</div>';
        return;
    }

    container.innerHTML = sorted.map(([emoji, count]) => `
        <div class="emoji-tag">
            <span>${emoji}</span>
            <small>${count}</small>
        </div>
    `).join('');
}

function renderDomainBreakdown(all, siteKeys) {
    const container = document.getElementById('domain-list');
    
    if (siteKeys.length === 0) {
        container.innerHTML = '<div class="empty-state">No domain-specific data found.</div>';
        return;
    }

    // Sort site keys by total usage in that site
    const siteData = siteKeys.map(key => {
        const domain = key.replace('remoji_site_', '');
        const emojis = all[key];
        const total = Object.values(emojis).reduce((a, b) => a + b, 0);
        return { domain, emojis, total };
    }).sort((a, b) => b.total - a.total);

    container.innerHTML = siteData.map(site => {
        const sortedEmojis = Object.entries(site.emojis).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const emojisHtml = sortedEmojis.map(([emoji, count]) => `
            <div class="emoji-tag">
                <span>${emoji}</span>
                <small>${count}</small>
            </div>
        `).join('');

        return `
            <div class="domain-row">
                <div class="domain-name">${site.domain}</div>
                <div class="domain-emojis">${emojisHtml}</div>
            </div>
        `;
    }).join('');
}

function renderLearnedData(learned) {
    const list = document.getElementById('learned-list');
    const keywords = Object.keys(learned);

    if (keywords.length === 0) {
        list.innerHTML = '<div class="empty-state">Start searching and picking emojis to build associations.</div>';
        return;
    }

    list.innerHTML = keywords.sort().map(keyword => {
        const emojis = learned[keyword];
        const sorted = Object.entries(emojis).sort((a, b) => b[1] - a[1]);
        const emojisHtml = sorted.map(([emoji, count]) => `
            <div class="emoji-tag">
                <span>${emoji}</span>
                <small>${count}</small>
            </div>
        `).join('');

        return `
            <div class="domain-row">
                <div class="domain-name">"${keyword}"</div>
                <div class="domain-emojis">${emojisHtml}</div>
            </div>
        `;
    }).join('');
}

async function initSettings() {
    const toggleLearning = document.getElementById('toggle-learning');
    const toggleContext = document.getElementById('toggle-context');
    const toggleSubreddit = document.getElementById('toggle-subreddit');
    const sliderMax = document.getElementById('slider-max');
    const sliderVal = document.getElementById('slider-val');
    const btnWipe = document.getElementById('btn-wipe');

    const result = await chrome.storage.local.get('remoji_settings');
    const settings = result.remoji_settings || { 
        learningEnabled: true, 
        frequentMode: 'site', 
        maxFrequent: 5, 
        subredditTracking: true 
    };

    // Set initial UI
    toggleLearning.checked = settings.learningEnabled;
    toggleContext.checked = settings.frequentMode === 'site';
    toggleSubreddit.checked = settings.subredditTracking !== false;
    sliderMax.value = settings.maxFrequent;
    sliderVal.textContent = settings.maxFrequent;

    // Listeners
    toggleSubreddit.addEventListener('change', async () => {
        const enabled = toggleSubreddit.checked;
        if (!enabled) {
            if (confirm("Disabling this will wipe all learned data for specific subreddits. Continue?")) {
                await wipeSubredditData();
                settings.subredditTracking = false;
                await chrome.storage.local.set({ remoji_settings: settings });
                showToast('Subreddit Data Reset');
                loadAllData();
            } else {
                toggleSubreddit.checked = true;
            }
        } else {
            settings.subredditTracking = true;
            await chrome.storage.local.set({ remoji_settings: settings });
            showToast('Subreddit Tracking Enabled');
            loadAllData();
        }
    });

    toggleLearning.addEventListener('change', async () => {
        const enabled = toggleLearning.checked;
        const msg = enabled 
            ? "Enabling learning will reset your current data for a fresh start. Continue?" 
            : "Disabling learning will wipe your current learned patterns. Continue?";
        
        if (confirm(msg)) {
            await wipeData(false); // Wipe data but keep settings
            settings.learningEnabled = enabled;
            await chrome.storage.local.set({ remoji_settings: settings });
            showToast(`Learning ${enabled ? 'Enabled' : 'Disabled'} & Data Reset`);
            loadAllData();
        } else {
            toggleLearning.checked = !enabled;
        }
    });

    toggleContext.addEventListener('change', async () => {
        settings.frequentMode = toggleContext.checked ? 'site' : 'global';
        await chrome.storage.local.set({ remoji_settings: settings });
        showToast('Preference Updated');
        loadAllData();
    });

    sliderMax.addEventListener('input', () => {
        sliderVal.textContent = sliderMax.value;
    });

    sliderMax.addEventListener('change', async () => {
        settings.maxFrequent = parseInt(sliderMax.value);
        await chrome.storage.local.set({ remoji_settings: settings });
        showToast('Display Limit Updated');
        loadAllData();
    });

    btnWipe.addEventListener('click', async () => {
        if (confirm("Are you absolutely sure? This will wipe EVERYTHING including your preferences.")) {
            await chrome.storage.local.clear();
            showToast('All Data Wiped');
            location.reload();
        }
    });
}

async function wipeSubredditData() {
    const all = await chrome.storage.local.get(null);
    // Subreddit keys look like remoji_site_reddit.com/r/...
    const keysToRemove = Object.keys(all).filter(k => k.startsWith('remoji_site_reddit.com/'));
    await chrome.storage.local.remove(keysToRemove);
}

async function wipeData(wipeSettings = true) {
    const all = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(all).filter(k => k.startsWith('remoji_') && (wipeSettings || k !== 'remoji_settings'));
    await chrome.storage.local.remove(keysToRemove);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
