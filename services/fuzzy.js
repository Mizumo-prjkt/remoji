// Define custom slang and aliases here
// This allows updating search trends without modifying core emoji data
var CUSTOM_ALIASES = {
    "sus": ["🤨", "😳", "👀"],
    "cap": ["🧢", "🤥"],
    "no cap": ["💯", "🙅‍♂️"],
    "fire": ["🔥", "💯"],
    "bruh": ["🤦", "💀", "😐"],
    "bet": ["🤝", "👍"],
    "goat": ["🐐", "👑"],
    "rip": ["💀", "🪦", "🕊️"],
    "vibes": ["✨", "😌", "🎶"],
    "chill": ["🧊", "😎", "🛋️"],
    "lit": ["🔥", "🎉"],
    "lol": ["😂", "🤣", "💀"],
    "sadge": ["😔", "😢", "☹️"],
    "pog": ["😮", "😲"],
    "based": ["😎", "🗿", "💯"],
    "cringe": ["😬", "😖", "🤢"],
    "phallic": ["🍆"],
    "bs": ["🚫", "🧢", "🤥"],
    "stupid": ["🤡", "🤥", "🤨"],
    "aight": ["🤝", "👍"],
    "paid": ["👑", "💰", "🤑"],
    "ratio": ["🐀", "📉"],
    "chad": ["🗿", "😎", "👑", "💪"],
    "miku": ["🩵", "🦋", "🎤", "🌸", "🎵"],
    "hatsune miku": ["🩵", "🦋", "🎤", "🌸", "🎵"],
    "kasane teto": ["❤️", "👯", "💗", "🥖", "🎵", "🥖"],
    "teto": ["❤️", "👯", "💗", "🥖", "🎵", "🥖"],
    "megurine luka": ["🩷", "🎺", "💕", "🎵"],
    "luka": ["🩷", "🎺", "💕", "🎵"],
    "kagamine": ["💛", "🧡", "🍌", "🎸", "🥁", "🎵"],
    "kagamine rin": ["🧡", "🎸", "🥭", "🎵"],
    "kagamine len": ["💛", "🍌", "🎸", "🥁", "🎵"],
    "meiko": ["❤️", "💄", "🍸", "🎵"],
    "kaito": ["💙", "🔷", "💎", "❄️", "🧣", "🎵"],
    "vocaloid": ["🎤", "🤖", "🌸", "🎺", "🎵"],
    "neru": ["📳", "💢", "🗯️", "🎵"]
};

class FuzzySearch {
    constructor(categoriesData, aliases) {
        this.aliases = aliases || {};
        this.flatData = [];

        // Flatten categories into a single array for easier searching
        categoriesData.forEach(category => {
            Object.entries(category.emojis).forEach(([emoji, keywords]) => {
                this.flatData.push({ emoji, keywords });
            });
        });
    }

    search(query) {
        if (!query) return [];

        const q = query.toLowerCase().trim();
        const results = [];

        // First, check for exact alias matches (highest priority)
        if (this.aliases[q]) {
            this.aliases[q].forEach(emoji => {
                results.push({ emoji, score: 100 });
            });
        }

        // Then, fuzzy match against all emojis
        this.flatData.forEach(({ emoji, keywords }) => {
            let maxScore = 0;

            keywords.forEach(keyword => {
                const kw = keyword.toLowerCase();

                // Exact match
                if (kw === q) {
                    maxScore = Math.max(maxScore, 50);
                }
                // Starts with
                else if (kw.startsWith(q)) {
                    maxScore = Math.max(maxScore, 30);
                }
                // Contains
                else if (kw.includes(q)) {
                    maxScore = Math.max(maxScore, 10);
                }
            });

            if (maxScore > 0) {
                // Only add if it's not already added from aliases
                const existingIndex = results.findIndex(r => r.emoji === emoji);
                if (existingIndex !== -1) {
                    results[existingIndex].score = Math.max(results[existingIndex].score, maxScore);
                } else {
                    results.push({ emoji, score: maxScore });
                }
            }
        });

        // Sort by score (descending)
        return results.sort((a, b) => b.score - a.score).map(r => r.emoji);
    }

    // Enhanced search that also checks learned keyword associations
    async searchWithLearning(query) {
        const staticResults = this.search(query);

        // Get learned results from EmojiLearner
        const learnedEmojis = await EmojiLearner.getLearnedResults(query);

        if (learnedEmojis.length === 0) return staticResults;

        // Merge: learned emojis go first (deduplicated), then static results
        const seen = new Set();
        const merged = [];

        // Learned results get top priority
        for (const emoji of learnedEmojis) {
            if (!seen.has(emoji)) {
                seen.add(emoji);
                merged.push(emoji);
            }
        }

        // Then static results
        for (const emoji of staticResults) {
            if (!seen.has(emoji)) {
                seen.add(emoji);
                merged.push(emoji);
            }
        }

        return merged;
    }
}

// Instantiate globally for content.js to use
var emojiSearcher = new FuzzySearch(EMOJI_CATEGORIES, CUSTOM_ALIASES);
