# Bookmarky — Privacy Policy

**Effective Date:** October 2026  
**Commitment:** *Your bookmarks stay in your browser.*

---

## 1. Core Principle: Zero Data Collection

Bookmarky is built from the ground up as a **local-first application**. We believe personal bookmarks reflect a user's intellectual history, private interests, and personal workflows. 

- **No Remote Servers**: Bookmarky does not maintain a backend, API server, or cloud database.
- **No User Accounts**: You do not need to create an account, log in, or provide an email address.
- **No Telemetry or Tracking**: There are no Google Analytics, Mixpanel, Sentry, or third-party tracking scripts embedded in Bookmarky.
- **No Network Transmission of Bookmarks**: Your bookmarks, folder names, search queries, and URLs are never transmitted across the network to any third-party server.

---

## 2. Permissions Justification

Bookmarky declares the following browser permissions in `manifest.json`:

| Permission | Purpose & Justification |
| :--- | :--- |
| `bookmarks` | Required to read, traverse, search, categorize, clean, and restore your browser's bookmarks. |
| `storage` | Used exclusively to save local preferences (such as your preferred color theme, confidence thresholds, and search filters) on your local computer. |
| `contextMenus` | Adds convenient browser right-click options ("Save to Bookmarky", "Open Bookmarky Dashboard"). |
| `notifications` | Displays brief, non-intrusive notifications when a backup is saved or a bookmark is added. |

---

## 3. Data Storage

All data processed by Bookmarky (including manual and automated safety backups) is stored locally on your device using:
1. `chrome.storage.local`
2. Local browser `IndexedDB` (under the database name `Bookmarky_DB`)

Uninstalling the extension or clearing extension site data will permanently remove all locally stored snapshots and preferences.
