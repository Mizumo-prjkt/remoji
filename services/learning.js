// learning.js — Emoji usage learning engine
// Tracks selections and infers keyword associations

var EmojiLearner = {
    // The last search query before an emoji was selected
    _lastSearchQuery: '',

    // Set the current search query (called by content.js on input)
    setSearchQuery(query) {
        this._lastSearchQuery = query.toLowerCase().trim();
    },

    // Get the current context ID (hostname or subreddit path)
    async getContextId() {
        const hostname = window.location.hostname;
        const settings = await EmojiData.getSettings();
        
        if (settings.subredditTracking && typeof window.EmojiAchievements !== 'undefined') {
            const sub = await window.EmojiAchievements.getSubredditContext();
            if (sub) {
                // Returns "reddit.com/r/linux" etc.
                return `${hostname}${sub}`;
            }
        }
        return hostname;
    },

    // Record an emoji selection — called when user picks an emoji
    async recordSelection(emoji) {
        const contextId = await this.getContextId();

        // 1. Record usage frequency
        await EmojiData.recordUsage(emoji, contextId);

        // 2. Learn keyword association if there was a search query
        if (this._lastSearchQuery && this._lastSearchQuery.length >= 2) {
            await EmojiData.recordLearnedKeyword(this._lastSearchQuery, emoji);
        }

        // Reset query after recording
        this._lastSearchQuery = '';
    },

    // Get frequently used emojis for the current site/subreddit
    async getFrequentEmojis() {
        const contextId = await this.getContextId();
        const settings = await EmojiData.getSettings();
        return await EmojiData.getTopEmojis(contextId, settings.maxFrequent);
    },

    // Get learned keyword results — returns sorted emoji array for a query
    async getLearnedResults(query) {
        const q = query.toLowerCase().trim();
        if (!q || q.length < 2) return [];

        const learned = await EmojiData.getLearnedKeywords();
        const results = [];

        for (const [keyword, emojiCounts] of Object.entries(learned)) {
            // Check if the stored keyword matches the query
            if (keyword.includes(q) || q.includes(keyword)) {
                for (const [emoji, count] of Object.entries(emojiCounts)) {
                    const existing = results.find(r => r.emoji === emoji);
                    if (existing) {
                        existing.score += count;
                    } else {
                        results.push({ emoji, score: count });
                    }
                }
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .map(r => r.emoji);
    }
};
