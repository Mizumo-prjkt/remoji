// discord.js — Integration helper for Discord's custom emoji and rich text input system

window.DiscordEmojiHelper = {
    // Check if the current page is Discord
    isDiscord() {
        return window.location.hostname.includes('discord.com');
    },

    // Look up the primary shortcode name for a raw emoji character
    getShortcode(emoji) {
        if (typeof EMOJI_CATEGORIES !== 'undefined') {
            for (const category of EMOJI_CATEGORIES) {
                if (category.emojis && category.emojis[emoji]) {
                    // The first keyword is the primary shortcode name (e.g. "grinning" for 😀)
                    return category.emojis[emoji][0];
                }
            }
        }
        return null;
    },

    // Convert raw emoji to Discord's colon shortcode format (e.g., "🙃" -> ":upside_down: ")
    getDiscordSymbol(emoji) {
        if (!this.isDiscord()) return emoji;
        
        const shortcode = this.getShortcode(emoji);
        if (shortcode) {
            // Adding a trailing space so Discord's editor triggers markdown parsing/autocomplete
            return `:${shortcode}: `;
        }
        return emoji;
    }
};
