# Privacy Policy — Restaurant OS

**Effective:** 2026-09-08 · **App:** Restaurant OS 2026 (`com.restaurantos.app`) ·
**Contact:** privacy@restaurantos.app

## 1. What this app is

Restaurant OS is an **offline-first** point-of-sale and restaurant management system.
Daily operations (orders, tables, inventory, shifts) are stored **on the terminal itself**
(IndexedDB / localStorage). Cloud sync to Firebase happens only when the merchant
configures it, to enable multi-branch and backup features.

## 2. Data we process

| Category | Examples | Where it lives |
|---|---|---|
| Business operations | Orders, menu, inventory, suppliers, shifts, Z-reports | Terminal first; Firebase RTDB only if configured |
| Staff | Names, roles, PIN hashes, attendance | Terminal; synced only if configured |
| Customers | Names, phones, loyalty points, order history | Terminal; synced only if configured |
| Diagnostics | Crash logs, sync-queue health | Terminal; never sold or shared |

We do **not** collect biometric data. Staff PINs unlock the local terminal only.

## 3. Third parties (only when the merchant enables them)

- **Firebase (Google):** Realtime Database / Auth / Storage sync and backup.
- **Google Fonts / Unsplash:** menu imagery and fonts loaded from CDNs.
- **AI providers (Google AI / OpenRouter):** only content the merchant submits
  (e.g. invoice OCR, demand forecasts). No automatic customer-data upload.

## 4. Your rights

Merchants are the data controllers for their customer data. End customers may ask the
merchant to view, correct, or delete their records (customer profile, loyalty ledger).
In-app deletion removes local records; synced copies are removed on next sync.

## 5. Retention & security

- Local data persists until the merchant clears it or uninstalls the app.
- Sync transport is TLS-encrypted; terminal lock + PIN throttle protect walk-up access.
- No advertising SDKs, no data brokerage, no cross-app tracking.

## 6. Children

The customer ordering portals are not directed at children under 13 and collect no
age-gated data beyond standard order details.

## 7. Changes

Material changes will be noted in `CHANGELOG.md` and take effect on update.
Continued use after an update constitutes acceptance.
