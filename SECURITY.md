# Security Policy for Submitting Issues and Disclaimers

## Submitting Issues

If you find a security issue, please submit a detailed report of the issue, including:

1. A description of the vulnerability.
2. Steps to reproduce the vulnerability.
3. Any relevant information about the vulnerability. (NIST's CVE reports, screenshots, logs, etc.)
4. Proof of concept (if applicable).
5. Any suggestions on how to fix the vulnerability. (Optional)

## Disclaimers

This extension was made with artificial intelligence. I, the developer, am simply the middleman between the AI and the user. I verify the code did not contain any suspicious instructions. However, if there's any security issues, submit a report and i'll try to fix it.


## ⚠️ Context-Aware Features

The extension has features that allow it to track your emoji usage on different websites and subreddits. It uses this data to provide you with relevant emoji suggestions based on your current context.

However, this data is only stored **locally** and is **NOT shared with anyone**. You can disable these features in the settings if you are not comfortable with them.

You can also check the source code to verify this.

- The files regarding the "AI" features: `services/learning.js`, `services/fuzzy.js`

The AI Used on the Context-Aware features is not exactly like the LLMs you know today, it is a lightweight model that is hard-coded in the extension and does not have any connection to any external servers. It only checks for keyword patterns and emoji usage, and nothing else. To be exact, it only checks for patterns that are related to your interactions with the extension itself. No Gemini nor Claude is inserted in the codebase.

### ⚠️ Data Collection

The extension collects the following data and stores it locally in the browser.:
1. Your emoji usage patterns
2. Your website visits
3. Your subreddit visits
4. Your search queries

What it can't do:

1. Submit to a server. Check source code
2. Harvest secret info like passwords, credit card numbers, etc.
