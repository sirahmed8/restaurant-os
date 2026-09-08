# Agreements Index — Restaurant OS

Single place that ties every customer-facing agreement together.

| Document | Applies to | Summary |
|---|---|---|
| [`EULA.md`](EULA.md) | Everyone installing/launching the app | License grant, restrictions, warranty, liability |
| [`TERMS_OF_SERVICE.md`](TERMS_OF_SERVICE.md) | Merchants operating the business | Service scope, merchant duties (tax/PINs/backups), SLA limits |
| [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) | Merchants + end customers | Offline-first data model, third parties, rights, retention |
| [`COOKIE_POLICY.md`](COOKIE_POLICY.md) | Web-app visitors | No desktop cookies; necessary-only browser storage |

## Acceptance flow

1. **Desktop installer:** EULA presented at install; continuing = acceptance.
2. **First launch (Setup Wizard):** merchant confirms business details → Terms accepted.
3. **Customer portals (QR / kiosk / online store):** ordering = acceptance of
   Privacy + Cookie terms for that session; no account required.
4. **Updates:** material legal changes are flagged in `CHANGELOG.md`; continued use
   after update = acceptance.

## Precedence

EULA (license) → Terms (service) → Privacy/Cookie (data). If translated, the
English text prevails unless local law requires otherwise.

## Versions

All documents versioned by `Effective` date + `CHANGELOG.md` entries.
Current bundle effective: **2026-09-08**.
