# Restaurant OS 2026

Offline-first, cloud-synced operating system for restaurants, cafés, and multi-branch franchises.
Point of sale (POS), kitchen display (KDS), floor plan, delivery hub, inventory, procurement,
staff, CRM, marketing, ZATCA e-invoicing, and an AI copilot — in one bilingual (AR/EN, RTL/LTR)
desktop + web app.

## Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, Framer Motion, Zustand, TanStack Query
- **Data:** Offline-first IndexedDB engine (`src/db`, 35 tables) + Firebase Realtime Database sync
- **Desktop:** Electron 34 (sandboxed renderer, signed installer via electron-builder)
- **Compliance:** ZATCA Phase 2 (FATOORA TLV QR, hash chain, CSID onboarding)
- **Tests:** Vitest — 17 files, 214 tests

## Project structure

```
src/
  components/   layout (AppShell, Header, Sidebar) · auth · ui · modules (24 lazy views)
  stores/       14 Zustand stores (pos, kds, inventory, shift, staff, …)
  services/     firebase, sync gateway, printer/ESC-POS, AI router, ZATCA, delivery, …
  db/           schema (35 tables) · IndexedDB engine · seed data
  lib/          ids · money (14% VAT) · logger · storage · onlineSync · debounce
  i18n/         AR/EN translations          types/  shared domain types
electron/       main (sandboxed) · preload (contextBridge API)
dist/           web build output (Firebase Hosting root)
```

## Quick start

```bash
npm install
cp .env.example .env        # fill VITE_FIREBASE_* — app runs offline without them
npm run dev                 # http://localhost:5177
```

## Scripts

| Command              | What it does                              |
|----------------------|-------------------------------------------|
| `npm run dev`        | Vite dev server                           |
| `npm run build`      | `tsc` + production web build → `dist/`    |
| `npm run typecheck`  | `tsc --noEmit`                            |
| `npm test`           | Vitest (must stay 214/214 green)          |
| `npm run dist:win`   | Web build + Electron + Windows installer  |
| `npm run electron:dev` | Desktop dev shell                       |

## Deploy (web)

```bash
npm run build
firebase deploy --only hosting --project restaurantai1
```

Live URL after deploy: `https://restaurantai1.web.app`

## Desktop installer

```bash
npm run dist:win   # → release/Restaurant OS-Setup-1.0.0.exe
```

Branding: `build/icon.ico` (amber-flame mark) ships in the installer, taskbar,
and window. Regenerate it with the script notes in `build/` if the brand changes.

## Release signing (removes the SmartScreen warning)

Why unsigned builds warn: Windows SmartScreen flags any installer it cannot tie to
a verified publisher. The only real fix is signing with a purchased **OV code-signing
certificate** (Sectigo/SSL.com/DigiCert, ~$70–400/yr, requires business-identity
validation taking a few days). Self-signed certs do **not** remove the warning.

The repo is already wired for it — no code change needed later:

```powershell
$env:CSC_LINK="C:\certs\restaurant-os.pfx"
$env:CSC_KEY_PASSWORD="..."
npm run dist:win
```

electron-builder picks up `CSC_LINK`/`CSC_KEY_PASSWORD` automatically and signs the
`.exe`, the uninstaller, and the NSIS installer. After signing, SmartScreen
reputation still needs a few dozen installs to go fully silent — expected.

## Key architecture decisions

- **Offline-first:** every write hits IndexedDB + memory cache synchronously; `syncQueue`
  (capped at 2,000) replays to Firebase with exponential backoff (`syncGateway`).
- **Lean boot:** 26 routes/components lazy-loaded; vendors split
  (`react / motion / query / firebase / media`); initial JS 525 KB (154 KB gzip),
  down from a 3.4 MB single chunk.
- **No secret fallbacks:** cloud features degrade to local mode when env is missing
  (`src/services/config.ts`); `.env` is git-ignored.
- **POS correctness:** single VAT source (14%), crash-safe storage, serialized
  thermal-printer queue, brute-force-throttled terminal lock.

## Legal

- [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) · [`TERMS_OF_SERVICE.md`](TERMS_OF_SERVICE.md)
- [`COOKIE_POLICY.md`](COOKIE_POLICY.md) · [`EULA.md`](EULA.md) · [`AGREEMENTS.md`](AGREEMENTS.md)

See [`CHANGELOG.md`](CHANGELOG.md) for release history.
