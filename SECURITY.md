# Bookmarky — Security Policy & Guidelines

Security and user trust are fundamental requirements for Bookmarky. This document explains the threat model and defense mechanisms built into the extension.

---

## 1. Threat Model & Untrusted Inputs

Bookmark collections are treated as **untrusted external data**:
- A user may import a corrupted or malicious HTML bookmark export.
- Bookmarks synced from public links could contain `javascript:` URIs, malicious fragments, or HTML injection strings in titles.
- Malformed URLs could cause regex denial-of-service (ReDoS) or crashes.

---

## 2. Defensive Controls

### A. Scheme & Protocol Sanitization

- **No Execution of Script Schemes**: Bookmark URLs starting with `javascript:` or `data:text/html` are never executed in the extension context.
- When opening URLs from Bookmarky, tabs are spawned with `chrome.tabs.create` or opened via safe `<a>` tags with `rel="noopener noreferrer"`.
- The dead link scanner explicitly verifies that URLs begin with `http://` or `https://` before dispatching network requests.

### B. Safe Rendering & Zero `dangerouslySetInnerHTML`

- All titles, breadcrumbs, domains, and folder labels are rendered strictly as text nodes using standard React JSX bindings.
- Zero instances of `dangerouslySetInnerHTML` or `eval` exist in the entire codebase.
- Exported HTML files properly escape HTML entities (`&`, `<`, `>`, `"`, `'`) using explicit character entity conversion.

### C. Import Validation

- When parsing imported JSON or HTML files:
  - Format identifiers (`Bookmarky`, `BookmarkOS`, `NETSCAPE-Bookmark-file-1`) are validated before any data traversal.
  - JSON structures must strictly include a valid `bookmarksTree` array.
  - Parsing errors trigger a clear error alert rather than silently crashing or modifying existing bookmarks.

### D. Strict Manifest V3 Content Security Policy (CSP)

- By virtue of Manifest V3, no remote scripts (`eval`, remote CDN scripts) can be loaded into the extension.
- All code runs exclusively from the extension's local package bundle.

---

## 3. Reporting Vulnerabilities

If you discover a potential security vulnerability in Bookmarky, please open a private security advisory or contact the maintainers directly.
