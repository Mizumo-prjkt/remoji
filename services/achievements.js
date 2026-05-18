// achievements.js — Logic for tracking Easter Egg visits and unlocking achievements
console.log("Remoji: Achievements Engine Loaded");

const SPECIAL_SITES = {
    'youtube.com': 'youtube',
    'facebook.com': 'facebook',
    'x.com': 'twitter',
    'twitter.com': 'twitter',
    'bsky.app': 'bluesky',
    'discord.com': 'discord',
    'messenger.com': 'messenger',
    'itch.io': 'itch',
    'steampowered.com': 'steam',
    'steamcommunity.com': 'steam',
    'deviantart.com': 'deviantart',
    'archiveofourown.org': 'ao3',
    'instagram.com': 'instagram',
    '4chan.org': 'zundamon',
    '4channel.org': 'zundamon'
};

const SPECIAL_SUBREDDITS = [
    { pattern: /\/r\/hatsune/i, theme: 'miku', id: 'hatsune_remoji', name: 'Hatsune Remoji' },
    { pattern: /\/r\/kasaneteto/i, theme: 'teto', id: 'teto_remoji', name: 'Kasane Teto Remoji' },
    { pattern: /\/r\/megurineluka/i, theme: 'luka', id: 'luka_remoji', name: 'Megurine Luka Remoji' },
    { pattern: /\/r\/akitaneru/i, theme: 'neru', id: 'neru_remoji', name: 'Akita Neru Remoji' },
    { pattern: /\/r\/linux/i, theme: 'linux', id: 'linux_remoji', name: 'Linux Remoji' },
    { pattern: /\/r\/linuxmasterrace/i, theme: 'linux', id: 'linux_remoji', name: 'Linux Remoji' },
    { pattern: /\/r\/projectsekai/i, theme: 'sekai', id: 'sekai_remoji', name: 'Project Sekai Remoji' },
    { pattern: /\/r\/zundamon/i, theme: 'zundamon', id: 'zundamon_remoji', name: 'Zundamon Remoji' }
];

window.EmojiAchievements = {
    async getSubredditContext() {
        const hostname = window.location.hostname.replace('www.', '');
        const pathname = window.location.pathname;

        if (hostname === 'reddit.com') {
            const subMatch = pathname.match(/^\/(r|u|user)\/([^\/\?]+)/i);
            if (subMatch) {
                return subMatch[0].toLowerCase(); // e.g. /r/linux
            }
        }
        return null;
    },
    async getThemeContext() {
        const hostname = window.location.hostname.replace('www.', '');
        const pathname = window.location.pathname;

        // 1. Check Subreddits
        if (hostname === 'reddit.com') {
            for (const sub of SPECIAL_SUBREDDITS) {
                if (sub.pattern.test(pathname)) {
                    return { theme: sub.theme, id: sub.id };
                }
            }
            return { theme: 'reddit', id: 'reddit_standard' };
        }

        // 2. Check General Sites
        for (const [domain, theme] of Object.entries(SPECIAL_SITES)) {
            if (hostname === domain || hostname.endsWith('.' + domain)) {
                return { theme: theme, id: `site_${theme}` };
            }
        }

        return null;
    },

    async recordVisit() {
        const context = await this.getThemeContext();
        if (!context) return null;

        const result = await chrome.storage.local.get('remoji_achievements');
        const data = result.remoji_achievements || {
            unlockedIds: [],
            uniqueThemedSites: [],
            totalThemedOpens: 0,
            uniqueSpecialSubs: []
        };

        const oldUnlockedCount = data.unlockedIds.length;
        data.totalThemedOpens++;

        // Track unique themes (for the "5 secret stylings" achievement)
        if (!data.uniqueThemedSites.includes(context.theme)) {
            data.uniqueThemedSites.push(context.theme);
        }

        // Handle specific subreddit achievement tracking
        if (context.id.endsWith('_remoji') && !data.unlockedIds.includes(context.id)) {
            data.unlockedIds.push(context.id);
            if (!data.uniqueSpecialSubs.includes(context.id)) {
                data.uniqueSpecialSubs.push(context.id);
            }
        }

        // Handle general milestone achievements
        if (data.uniqueThemedSites.length >= 5 && !data.unlockedIds.includes('visited_5_secrets')) {
            data.unlockedIds.push('visited_5_secrets');
        }

        const newlyUnlocked = data.unlockedIds.length > oldUnlockedCount 
            ? data.unlockedIds[data.unlockedIds.length - 1] 
            : null;

        await chrome.storage.local.set({ remoji_achievements: data });

        // Get achievement info for notification
        let achievementInfo = null;
        if (newlyUnlocked) {
            if (newlyUnlocked === 'visited_5_secrets') {
                achievementInfo = { title: 'Secret Collector', desc: 'Visited 5 secret stylings!' };
            } else {
                const sub = SPECIAL_SUBREDDITS.find(s => s.id === newlyUnlocked);
                if (sub) achievementInfo = { title: 'Secret Unlocked!', desc: sub.name };
            }
        }

        return { theme: context.theme, achievement: achievementInfo };
    },

    async getStats() {
        const result = await chrome.storage.local.get('remoji_achievements');
        return result.remoji_achievements || {
            unlockedIds: [],
            uniqueThemedSites: [],
            totalThemedOpens: 0,
            uniqueSpecialSubs: []
        };
    }
};
