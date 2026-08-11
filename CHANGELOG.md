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

### Added

- Phone validation for the registered person's WhatsApp field: requires a
  valid DDD (area code) plus an 8-digit landline or 9-digit mobile number,
  surfaced as an inline error on save.
