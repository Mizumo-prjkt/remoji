# Security Policy for Submitting Issues and Disclaimers

## Submitting Issues

If you find a security issue, please submit a detailed report of the issue, including:

1. A description of the vulnerability.
2. Steps to reproduce the vulnerability.
3. Any relevant information about the vulnerability. (NIST's CVE reports, screenshots, logs, etc.)
4. Proof of concept (if applicable).
5. Any suggestions on how to fix the vulnerability. (Optional)

## Disclaimers & Privacy Guarantees

### 🤖 AI-Assisted Development Transparency
This extension was developed in partnership with advanced Artificial Intelligence coding models. As the developer and publisher:
* I act as a rigorous auditor, reviewing and verifying every single line of code to ensure it meets strict security standards and does **not** contain any suspicious, malicious, or unsafe instructions.
* If any unexpected security edge cases or issues are identified, I pledge to address, patch, and release a fix as quickly as possible. Please submit a detailed report!

---

### ⚠️ Context-Aware Learning Features
Remoji features a smart local learning engine designed to customize suggestions based on where and what you are typing.
* **100% Local execution**: All processing, keyword matching, and frequency learning happen purely in memory or local storage inside your browser sandbox.
* **No external servers**: Unlike contemporary LLM chatbots, our context-aware logic is a tiny, highly specialized, deterministic pattern-matching engine hardcoded inside the extension. It has **no connection** to external servers and makes no network requests.
* **Full user control**: You can review the underlying files at any time (`services/learning.js` and `services/fuzzy.js`) or disable all learning engines entirely via the Settings console.

---

### 📊 Local Data Boundaries

To provide its context-aware features, the extension records the following data, stored **exclusively** inside your browser's private local storage:
1. **Emoji usage counts**: The frequency of each selected emoji.
2. **Website hostnames**: Domains where emojis are typed (to provide per-website suggestions).
3. **Subreddit names**: Specific subreddits (to unlock unique styles/themes).
4. **Search queries**: Words typed into the picker's search bar to refine the fuzzy engine.

#### 🔒 What Remoji WILL NEVER Do:
1. **Send data to external servers**: The extension has zero tracking or telemetry. There are no tracking scripts, analytics, or external API endpoints.
2. **Access sensitive information**: Remoji actively guards your security. The extension is hardcoded to automatically identify sensitive inputs (like password inputs, credit card/CVC textboxes, and banking fields via our `isSensitiveElement` secure parser). The activation shortcut and toolbar triggers are immediately blocked whenever a secure field is focused, ensuring Remoji never operates in sensitive fields or has the opportunity to record credentials.

