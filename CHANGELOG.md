# Changelog — Restaurant OS

All notable changes. Format follows Keep a Changelog. Current version: **1.5.1**.

## [1.5.1] — 2026-09-09 — Branded icon + signing support

- Branded app icon: generated `build/icon.ico` (16–256 px, amber flame on dark),
  wired into the Windows installer (`win.icon`) and taskbar; new `favicon.svg`
  for the web app (replaces default Vite icon).
- Code signing: installer declares `signAndEditExecutable`; signing activates
  automatically when `CSC_LINK` + `CSC_KEY_PASSWORD` are set on the build machine
  (see README “Release signing”). Unsigned builds still work for internal testing.

## [1.5.0] — 2026-09-08 — Ship prep + wave-5 perf

- Dynamic `import('canvas-confetti')` in Kiosk, Online Store, Waiter, Table Guest
  Portal, and Interactive Tour (static import now only nowhere; chunk-local).
- Added `firebase.json` hosting config (`dist/` + SPA rewrites + asset caching).
- Docs pack: README, CHANGELOG, Privacy Policy, Terms of Service, Cookie Policy,
  EULA, AGREEMENTS index.
- Verified: `tsc` 0 errors, 214/214 tests, production build green.

## [1.4.0] — 2026-09-08 — Boot-weight + lock-screen security (wave 4)

- Lazy auth gates: `WelcomeLandingScreen` and `LockScreen` load on demand.
- Sidebar active pill: Framer `layoutId` → CSS (sidebar now motion-free).
- `TenantAuthModal` lazy in Header, mounts on first open only.
- LockScreen: removed universal `1234` backdoor and its UI hint; owner unlock honors
  stored master PIN (`9999` kept as documented recovery); 5-fail → 30 s keypad
  lockout with countdown (StrictMode-safe counter).
- Removed unused `howler` / `@types/howler` deps; CSS overscroll containment.
- Initial JS: 644 KB → **525 KB** (−18% this wave, −85% total).

## [1.3.0] — 2026-09-08 — Shell diet + hardening (wave 3)

- AppShell: Framer `AnimatePresence` → CSS transition; Quick Search, Tour, and
  Owner Bar lazy and mount-on-open; Cmd/Ctrl+K handled in shell.
- `Card` and POS dish grid/modals converted from motion to CSS
  (dishes are now real `<button>`s — keyboard accessible).
- POS checkout: confetti on-demand; empty-cart guard; search debounced (180 ms).
- Quick Search: debounced, memoized, capped (8 dishes / 5 stock), `role=dialog`,
  backdrop-click close.
- `useAppStore` boots from crash-safe storage (`lib/storage.ts`); online/offline +
  tab-visibility auto-flush sync without bundling the gateway (`lib/onlineSync.ts`).
- Printer: serialized ESC/POS queue (no more overlapping iframe jobs).
- DB: additive `getByIndex()` over v2 indexes with memory fallback.
- Initial JS: 716 KB → **644 KB**.

## [1.2.0] — 2026-09-08 — Correctness + UX pass (wave 2)

- New `lib/`: `ids` (crypto-first), `money` (single 14% VAT source), `logger`,
  `SmartImage` (offline-safe), `Feedback` (EmptyState/Skeleton).
- POS catalog boots populated (was `[]` until onboarding); cart keys stable
  (no per-render `JSON.stringify`); qty clamped; history capped at 100.
- `Button` de-framered; Header clock isolated (no more 1 s full-header renders);
  Sidebar memoized with count-only selectors + `aria-current`.
- Global a11y CSS: input selection, focus rings, reduced-motion, skip link, landmarks.
- DB v1 → v2 with hot-path indexes; `syncQueue` capped at 2,000.

## [1.1.0] — 2026-09-08 — Security + bundle split (wave 1)

- Removed hardcoded Firebase secrets; env-only config with offline graceful mode.
- `.gitignore` (secrets/build output), Electron `sandbox: true`, CI workflow.
- 26 views lazy-loaded; vendor `manualChunks`; `ErrorBoundary` + skeletons.
- DB transaction-per-table fix; singleton QueryClient.
- Initial JS: 3,415 KB (702 KB gzip) → **714 KB** (190 KB gzip).

## [1.0.0] — baseline

- 24 modules, 14 stores, 26 services, 35-table offline DB, ZATCA Phase 2,
  214-test suite green.
