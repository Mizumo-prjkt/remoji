v1.0.4

- Features:
  - Added Discord-native emoji shortcode support (replaces raw emojis with `:`-wrapped shortcodes on discord.com). (It is still buggy, but do report at the Issues Tab)
- Fixes:
  - Fixed the Discord "phantom box" text editor bug by dispatching standard input events to sync the Slate.js editor state.
- Security Additions:
  - Enhanced security by adding a robust check to prevent the picker from activating on sensitive input fields such as passwords, credit card forms, and banking fields. The extension will now refuse to launch if it detects a sensitive element in focus.

v1.0.3

- Features:
  - Addded wilted flower, and also added 3 slang keywords: son, wallahi, sonion


v1.0.2

- Fixes:

  - Security Fix: Addressess issues about URL injection to prevent attacks from injecting any URL. https://github.com/Mizumo-prjkt/remoji/security/code-scanning/1



v1.0.1

- Fixes:

  - Fix some websites that can't insert emoji properly. (YouTube, and Twitter/X having this issue. )

v1.0.0

- Features:

  - 🎉 Launching Remoji Browser Extension!
