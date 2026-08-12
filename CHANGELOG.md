# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Registered person's WhatsApp phone field: the `(31) 99999-9999` mask is now
  display-only — the underlying value stays plain digits (DDD + number), so
  the mask no longer forces a country code prefix or corrupts what the user
  is actively typing. The DDI (`55`) is still added automatically wherever
  the number is used (`wa.me` links), so the user never has to type it.
- Migrated Google authentication from Google Identity Services' implicit
  OAuth2 flow to the shared `lealtek-api` backend (Authorization Code +
  PKCE). Silent renewal now calls `POST /api/auth/refresh` on
  `api.lealtek.com` instead of `requestAccessToken({ prompt: 'none' })`,
  which depended on Google's own third-party session cookie and broke under
  cookie partitioning / installed PWAs. Interactive sign-in is now a
  full-page redirect to `lealtek-api`'s login endpoint instead of a GIS
  popup; `clearAccessToken()` is renamed `signOut()` since it now also
  revokes the session server-side.

### Added

- Phone validation for the registered person's WhatsApp field: requires a
  valid DDD (area code) plus an 8-digit landline or 9-digit mobile number,
  surfaced as an inline error on save.
- In-app-browser detection (`src/services/inAppBrowser.ts`) shows an "open
  in your browser" prompt instead of the sign-in button when the app is
  opened inside Instagram/Facebook/LinkedIn/etc. — Google rejects OAuth
  inside these webviews regardless of backend architecture, so this is a
  client-side mirror of the same check `lealtek-api` enforces authoritatively
  server-side.

### Removed

- `VITE_GOOGLE_CLIENT_ID` — no longer needed client-side; the OAuth Client
  ID now only lives server-side in `lealtek-api`. Replaced by
  `VITE_LEALTEK_API_URL`.
