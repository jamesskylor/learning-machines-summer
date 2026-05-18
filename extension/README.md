# Learning Machines OS — Chrome extension

Turns your new tab page into Learning Machines OS (`learningmachines.xyz/os`).
Built for LM Summer Camp '26 campers.

Modeled on [buildspace/buildspace-os](https://github.com/buildspace/buildspace-os).

## What it does

Every time you open a new tab in Chrome (or any Chromium browser — Brave, Arc, Edge), you land on the LM OS home instead of Google's default new tab page. Your current week, lectures, and weekly update form are one keystroke away.

## Install (2 minutes, no coding)

### 1. Download

Click the green **Code** button on this repo → **Download ZIP**. Unzip it somewhere safe (e.g. `~/Documents/lm-os`). **Don't delete the folder later** — the extension reads from it.

### 2. Open Chrome's Extensions page

Paste this into your address bar and hit enter:

```
chrome://extensions
```

Or: Chrome menu → More Tools → Extensions.

### 3. Turn on Developer mode

Toggle **Developer mode** on (top-right corner).

### 4. Load the extension

Click **Load unpacked** → select the `extension` folder (the one containing `manifest.json`).

You should see "Learning Machines OS" appear in your extension list.

### 5. Open a new tab

Press `Cmd+T` (Mac) or `Ctrl+T` (Windows/Linux). You should see LM OS load.

Chrome may prompt: *"Did you mean to change your new tab page?"* Click **Keep it**, or the extension won't work.

## Uninstall

`chrome://extensions` → find Learning Machines OS → **Remove**.

## Files

```
manifest.json       — extension config (Manifest V3)
tab_override.html   — the page that loads in place of the new tab
background.js       — service worker that handles edge cases
assets/             — icons (16, 48, 128)
build_icons.py      — regenerates the icons from the pixel-art logo (devs only)
```

## For maintainers

### Regenerating icons

The icons are generated from the LM pixel-art logo defined in `build_icons.py`.
To regenerate:

```bash
cd extension
python3 build_icons.py
```

No external dependencies — pure stdlib.

### Changing the destination URL

`tab_override.html` iframes `https://learningmachines.xyz/os`. If you ever
move the OS to a different URL, edit the `src` attribute on the `<iframe>` and
re-zip.

### Publishing to the Chrome Web Store (later)

Once cohort 1 is settled and the OS is stable, publish to the Chrome Web Store so campers don't need to enable Developer mode:

1. Sign up at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) ($5 one-time fee).
2. Zip the `extension/` folder (must include `manifest.json` at the root of the zip).
3. Upload, fill in screenshots + description, submit for review.
4. Update the README install steps to point at the store listing.

## Questions

Email `hi@learningmachines.xyz`.
