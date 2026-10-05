# Bookmarky — Testing & Quality Assurance Guide

This document describes the testing strategy, test suites, and manual verification procedures for Bookmarky.

---

## 1. Automated Test Suite (Vitest)

Bookmarky uses **Vitest** for fast unit and integration testing.

To run all automated tests:

```bash
npm test
```

### Covered Test Modules

- `tests/search.test.ts`:
  - Exact, prefix, and substring title matches
  - Operator filters (`domain:`, `folder:`)
  - Quoted phrases (`"google search console"`)
  - Negation exclusions (`-term`)
  - Combined multi-operator ranking
- `tests/duplicates.test.ts`:
  - URL normalization (stripping tracking query parameters, trailing slashes, default ports)
  - Exact URL match grouping
  - Normalized URL variant detection
  - Batch resolution helper functions (`getIdsToRemoveKeepingFirst`, `getIdsToRemoveKeepingNewest`)
- `tests/organizer.test.ts`:
  - Local domain classification rules
  - Keyword and path pattern matching
  - Confidence scoring calculation
  - Organization preview plan generation
- `tests/backup.test.ts`:
  - Bookmarky JSON export & import validation
  - Netscape Bookmark HTML RFC-compliant serialization and regex-based deserialization
  - Malformed file rejection

---

## 2. Type Checking & Code Quality

Run TypeScript compiler validation:

```bash
npm run lint
```

This enforces strict typing across all React components, services, and Chromium API signatures with zero warnings or errors.

---

## 3. Production Build Verification

```bash
npm run build
```

Verify that the output directory `dist/` contains:
- `manifest.json` (Valid Manifest V3)
- `dashboard.html` & `popup.html` (Using relative `./assets/` links)
- `service-worker.js` (Root-level background worker)
- `icons/` (16, 32, 48, 128px PNGs + SVG)

---

## 4. Manual QA Verification Checklist

Before shipping to the Chrome Web Store or Edge Add-ons:

- [x] Load unpacked extension in Google Chrome (`chrome://extensions`)
- [x] Load unpacked extension in Microsoft Edge (`edge://extensions`)
- [x] Verify extension icon appears crisp in both dark and light browser toolbars
- [x] Open Quick Popup: Test search, recent bookmarks, and "Full Manager" navigation
- [x] Open Full Dashboard in tab
- [x] Test instant search with operators: `domain:github.com`, `folder:Development`, `title:Figma`
- [x] Trigger Command Palette with `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac), navigate with arrows and press Enter
- [x] Run Duplicate Scanner: Detects duplicate URLs and tracking variants; confirm resolution
- [x] Run Dead Link Scanner: Verify non-blocking async batch inspection with live progress bar
- [x] Run Smart Organizer: Review proposed changes in visual diff modal before applying
- [x] Verify Automatic Pre-Operation Safety Backup is created before any structural changes
- [x] Export JSON Backup and download file
- [x] Export Netscape HTML Backup and download file
- [x] Import Backup file: Validate preview and test "Merge" vs "Replace" modes
- [x] Test Theme Switcher: Toggle between Dark, Light, and System modes
- [x] Stress Test: In Settings, load 1,000 and 10,000 test bookmarks to confirm UI remains fluid at 60fps
