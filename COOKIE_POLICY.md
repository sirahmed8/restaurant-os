# Cookie Policy — Restaurant OS

**Effective:** 2026-09-08 · **Contact:** privacy@restaurantos.app

## 1. Desktop app

The installed Electron app uses **no cookies**. It stores operational data locally
(IndexedDB / localStorage on your own terminal) as described in
[`PRIVACY_POLICY.md`](PRIVACY_POLICY.md).

## 2. Hosted web app

The browser version (`restaurantai1.web.app`) uses the following storage:

| Name | Purpose | Type | Expiry |
|---|---|---|---|
| `restaurant_os_*` | Theme, language, session, PIN-lock state, AI consent | Strictly necessary localStorage | Until cleared / uninstall |
| Firebase Auth session | Keeps merchants signed in for sync | Strictly necessary | Session / configurable |
| Google Analytics (if enabled) | Aggregated usage measurement | Analytics | Per Google defaults |

## 3. No advertising

No advertising cookies, no cross-site trackers, no data sale. Analytics, where
enabled, is aggregated and never used for ads.

## 4. Your choices

- Clear site data in the browser to remove local state (you will be signed out).
- Block third-party requests (fonts/avatars) at the network level; the POS keeps
  working offline with placeholder imagery.
- Cookie consent, where required by local law, is collected on first launch of the
  hosted app; necessary storage cannot be disabled without breaking login.

## 5. Updates

Changes are logged in `CHANGELOG.md`.
