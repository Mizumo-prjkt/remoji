// data.js — Persistent storage layer for emoji analytics
// Uses chrome.storage.local for all persistence

var EmojiData = {
    // Default settings
    _defaults: {
        frequentMode: 'site', // 'site' or 'global'
        maxFrequent: 5,
        learningEnabled: true,
        subredditTracking: true
    },

    // Get settings
    async getSettings() {
        const result = await chrome.storage.local.get('remoji_settings');
        return { ...this._defaults, ...(result.remoji_settings || {}) };
    },

    // Save settings
    async saveSettings(settings) {
        const current = await this.getSettings();
        await chrome.storage.local.set({
            remoji_settings: { ...current, ...settings }
        });
    },

    // Record an emoji usage for a specific hostname
    async recordUsage(emoji, hostname) {
        const settings = await this.getSettings();
        const key_global = 'remoji_global';
        const key_site = `remoji_site_${hostname}`;

        const storageKeys = [key_global];
        if (settings.learningEnabled) {
            storageKeys.push(key_site);
        }

        const result = await chrome.storage.local.get(storageKeys);

        // Global counts (always recorded)
        const globalData = result[key_global] || {};
        globalData[emoji] = (globalData[emoji] || 0) + 1;

        const updateData = { [key_global]: globalData };

        // Per-site counts (only if learning is enabled)
        if (settings.learningEnabled) {
            const siteData = result[key_site] || {};
            siteData[emoji] = (siteData[emoji] || 0) + 1;
            updateData[key_site] = siteData;
        }

        await chrome.storage.local.set(updateData);
    },

    // Get top N emojis for a hostname
    async getTopForSite(hostname, n = 5) {
        const key = `remoji_site_${hostname}`;
        const result = await chrome.storage.local.get(key);
        const data = result[key] || {};
        return this._topN(data, n);
    },

    // Get top N emojis globally
    async getTopGlobal(n = 5) {
        const result = await chrome.storage.local.get('remoji_global');
        const data = result.remoji_global || {};
        return this._topN(data, n);
    },

    // Get top N emojis based on current settings
    async getTopEmojis(hostname, n = 5) {
        const settings = await this.getSettings();
        // If learning is disabled, we only have global data to show
        if (!settings.learningEnabled || settings.frequentMode === 'global') {
            return await this.getTopGlobal(n);
        }
        
        const siteTop = await this.getTopForSite(hostname, n);
        // Fall back to global if site has no history
        if (siteTop.length === 0) {
            return await this.getTopGlobal(n);
        }
        return siteTop;
    },

    // Record a learned keyword association
    async recordLearnedKeyword(keyword, emoji) {
        const settings = await this.getSettings();
        if (!settings.learningEnabled) return;

        const result = await chrome.storage.local.get('remoji_learned');
        const learned = result.remoji_learned || {};

        if (!learned[keyword]) {
            learned[keyword] = {};
        }
        learned[keyword][emoji] = (learned[keyword][emoji] || 0) + 1;

        await chrome.storage.local.set({ remoji_learned: learned });
    },

    // Get all learned keyword associations
    async getLearnedKeywords() {
        const result = await chrome.storage.local.get('remoji_learned');
        return result.remoji_learned || {};
    },

    // Clear all analytics data
    async clearAllData() {
        const allKeys = await chrome.storage.local.get(null);
        const remojiKeys = Object.keys(allKeys).filter(k => k.startsWith('remoji_'));
        await chrome.storage.local.remove(remojiKeys);
    },

    // Helper: sort and return top N from a frequency map
    _topN(freqMap, n) {
        return Object.entries(freqMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([emoji]) => emoji);
    }
};
