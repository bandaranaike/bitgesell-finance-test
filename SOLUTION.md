# Solution Overview

This document outlines the key changes made, the rationale behind each choice, and the trade‑offing encountered during implementation.

---

## Backend

### 1. Non‑blocking I/O

* **Change:** Replaced any synchronous `fs.readFileSync` calls in `src/routes/items.js` with `fs.promises.readFile` and `async/await`.
* **Rationale:** Avoid blocking the event loop during file reads to keep the API responsive under load.
* **Trade‑offs:**

    * Slightly more complex error propagation (need `try/catch`).
    * Introduces asynchronous flow, but callback depth remains shallow since we use `async/await`.

### 2. Stats Caching

* **Change:** In `GET /api/stats`, results are cached along with the file’s `mtimeMs`. Recompute only when the data file changes.
* **Rationale:** Avoid expensive JSON parsing and reduction on every request.
* **Trade‑offs:**

    * Cache invalidation complexity must watch the timestamp correctly.
    * Memory overhead for storing the last result, though minimal.

### 3. Unit Tests (Jest)

* **Change:** Added `stats.test.js` and `items.test.js` covering:

    * Happy paths (stat calculation, item listing, filtering, pagination).
    * Error cases (`fs.stat` failure, missing item ID).
    * Cache behavior (ensuring no re‑reads when a file is unchanged).
* **Rationale:** Ensure correctness and catch regressions early.
* **Trade‑offs:**

    * Requires mocking `fs.promises`, adding test dependencies (`supertest`, `jest`).
    * Slightly increased CI run time but provides confidence in core functionality.

---

## Frontend

### 1. Memory Leak Fix

* **Change:** In `Items.js`, tracked a `cancelled` flag (or used `useRef`) to ignore late responses when unmounted.
* **Rationale:** Prevent state updates on unmounted components, avoiding console warnings and potential memory leaks.
* **Trade‑offs:**

    * Adds a bit of boilerplate around cleanup.

### 2. Pagination & Search

* **Change:** Updated backend to accept `limit`, `page`, and `q`, returning `{ data, meta }`. On the frontend, `DataContext` exposes `fetchItems({ page, q })`.
* **Rationale:** Offload filtering and paging to the server, reducing payload size and improving UX for large datasets.
* **Trade‑offs:**

    * Backend must maintain accurate metadata (`totalPages`).
    * Client complexity increases slightly (needs to handle `meta`).

### 3. Virtualization

* **Change:** Integrated `react-window` in `Items.js` to only render visible list items.
* **Rationale:** Keeps UI responsive even as total items grow to thousands.
* **Trade‑offs:**

    * Added dependency (`react-window`).
    * Slightly more complex rendering logic (custom `Row` renderer).

### 4. UI/UX Polish

* **Change:** Introduced loading skeletons, accessible labels (`aria-*`), and styled controls with inline styles.
* **Rationale:** Improves perceived performance and accessibility.
* **Trade‑offs:**

    * Inline styles can be verbose; consider migrating to a CSS framework.

---

## Tailwind CSS Integration

### CDN vs. NPM

* **Current:** Tailwind via Play CDN in `public/index.html` for rapid prototyping.
* **Pros:** Zero build‑config changes, quick feedback loop.
* **Cons:** No CSS purging → larger bundle; limited to client‑side config in HTML.

### Future NPM Setup

* **Approach:** Install `tailwindcss@^4.1`, `postcss`, `autoprefixer`, configure `tailwind.config.js`, add `@tailwind` directives in `index.css`.
* **Rationale:** Enables PurgeCSS to remove unused styles, shrinks final CSS, supports advanced theming.
* **Trade‑offs:**

    * Upfront build pipeline changes; \~15 min setup and incremental migration of classes.

---

## Debounced Fetching

* **Optimization:** Can wrap fetchItems with a 600 ms debounced using `lodash.debounce` in `DataContext`.
* **Rationale:** Reduce redundant network calls as the user types, improving performance and reducing server load.
* **Trade‑offs:**

    * Slight delay in first character response; acceptable UX trade‑off for fewer requests.

---


This layered approach ensures functionality and performance gains first, then focuses on developer experience and maintainability.
