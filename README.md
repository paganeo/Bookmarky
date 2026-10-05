# Bookmarky — Advanced Bookmark Manager for Chrome & Microsoft Edge

> A powerful, local-first bookmark management system that allows users to search, organize, clean, analyze, back up, restore, and maintain their browser bookmarks.

Built with **Manifest V3**, **TypeScript**, **React**, **Vite**, and Chromium Bookmarks APIs.

---

## 🌟 Key Highlights

- **100% Local-First Privacy**: Your bookmarks stay strictly on your device. No user accounts, no backend, no telemetry, and zero remote transmission of personal data.
- **Raycast / Linear-Inspired Aesthetic**: High information density, modern dark/light mode tokens, typography-first hierarchy, and keyboard-first navigation.
- **Lightning-Fast Global Search**: In-memory indexing with multi-tier ranking (exact title, prefix, domain, URL, and folder matching) capable of querying 50,000+ bookmarks in milliseconds.
- **Search Operators & Boolean Filters**: Full support for `domain:github.com`, `folder:SEO`, `title:api`, `url:doc`, quoted phrases `"google search console"`, and negative exclusion terms `-theme`.
- **Global Command Palette**: Instant modal triggered via `Ctrl/Cmd + Shift + K` (or `⌘K`) to jump directly to bookmarks or execute actions without a mouse.
- **Automatic Smart Organizer**: Rule-based categorization engine (AI, Development, Design, SEO, Marketing, Finance, Productivity, etc.) with confidence scoring, live visual diff preview, and automated pre-operation safety snapshots.
- **Duplicate Detection**: Identifies both exact URL duplicates and normalized duplicates (strips tracking parameters like `utm_source`, `fbclid`, trailing slashes, and protocol variances) with 1-click batch cleanup.
- **Asynchronous Dead Link Scanner**: Concurrency-controlled live inspection classifying HTTP 200, 301/302 redirects, 404 Not Found, 403 Forbidden, 500 Server Errors, and DNS/timeout failures.
- **Empty Folder Cleaner**: Detects and purges empty folders to keep your bookmark hierarchy organized.
- **Robust Backup & Restore**: Full JSON snapshot backups with IndexedDB retention policies, alongside standard Netscape Bookmark HTML export/import compatible with all major browsers.
- **Domain Analytics & Statistics**: Interactive top-domains breakdown with folder distribution, duplicate metrics, and library health charts.

---

## 🚀 Quick Start & Development

### Prerequisites

- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+ (tested on npm 11)
- **Browser**: Google Chrome or Microsoft Edge

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Extension Icons

Generate transparent-background Tabler bookmarks icons (16px, 32px, 48px, 128px PNGs + SVG):

```bash
node scripts/generate-icons.js
```

### 3. Run Unit & Integration Tests

```bash
npm test
```

### 4. Run TypeScript Checks

```bash
npm run lint
```

### 5. Build Production Extension

```bash
npm run build
```

This compiles popup and dashboard pages into `dist/` and bundles the Manifest V3 background service worker into `dist/service-worker.js`.

---

## 📦 Browser Installation (Unpacked Extension)

### Google Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked** in the top-left toolbar.
4. Select the `dist` folder located in this project directory:
   ```text
   Bookmarky\dist
   ```
5. Bookmarky will now appear in your extension toolbar. Click the puzzle icon to pin Bookmarky.

### Microsoft Edge

1. Open Edge and navigate to `edge://extensions`.
2. Enable **Developer mode** toggle in the bottom-left sidebar.
3. Click **Load unpacked** in the top toolbar.
4. Select the `dist` folder.
5. Bookmarky is ready for use on Edge.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Ctrl/Cmd + Shift + K` | Open Global Command Palette & Quick Launcher |
| `Ctrl/Cmd + B` | Focus Search Input |
| `Ctrl/Cmd + Shift + O` | Open Smart Auto-Organizer Preview |
| `Ctrl/Cmd + Shift + D` | Open Duplicates Scanner |
| `Ctrl/Cmd + Shift + L` | Open Dead Link Scanner |
| `Ctrl/Cmd + Shift + S` | Open Backups & Snapshots View |
| `Ctrl/Cmd + Shift + Y` | Open Quick Popup Extension Bar |
| `Escape` | Close any open modal or command palette |

---

## 🛡️ Permissions & Security

Bookmarky requests only the minimum permissions necessary:

- `bookmarks`: Read, search, create, move, and edit browser bookmarks and folders.
- `storage`: Store local application settings and lightweight configuration.
- `contextMenus`: Provide "Save to Bookmarky" and "Open Bookmarky" right-click actions.
- `notifications`: Sparingly notify user upon backup creation or bookmark saving.

No host permissions (`<all_urls>`) are requested globally. Dead link inspection uses standard non-intrusive `fetch` requests with configurable timeouts.

---

## 📁 Project Architecture

```text
Bookmarky/
├── public/
│   ├── icons/             # 16, 32, 48, 128px PNGs & Tabler SVG
│   └── manifest.json      # Manifest V3 specification
│
├── src/
│   ├── background/        # Service worker (context menus, shortcut routing)
│   ├── popup/             # Compact quick-access popup (360px)
│   ├── dashboard/         # Full desktop management dashboard
│   ├── components/        # UI components (Header, Sidebar, Lists, Modals, Views)
│   ├── services/          # Core business logic:
│   │   ├── bookmarks.ts   # Tree traversal, CRUD, and mutation sync
│   │   ├── search.ts      # Query parser, operators, ranking engine
│   │   ├── organizer.ts   # Categorization engine, preview, and safe apply
│   │   ├── duplicates.ts  # URL normalizer & duplicate grouping
│   │   ├── deadLinks.ts   # Asynchronous link checker & classifier
│   │   ├── backup.ts      # JSON and Netscape HTML export
│   │   ├── restore.ts     # Safe restoration and import parser
│   │   ├── storage.ts     # Settings and IndexedDB backup persistence
│   │   └── testData.ts    # In-memory realistic test data generator
│   ├── styles/            # CSS tokens, light/dark themes
│   └── types/             # TypeScript definitions
│
├── tests/                 # Unit and integration test suites
├── scripts/               # Icon generator script (sharp)
├── vite.config.ts         # Multi-page build config
└── vite.worker.config.ts  # Background service worker build config
```

---

## 📜 License

MIT License. Tabler Icons licensed under MIT.
