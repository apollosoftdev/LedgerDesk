# LedgerDesk Mobile

Android port of [LedgerDesk](../README.md) — a personal / business transaction ledger.
Built with **React Native + Expo SDK 52** and targets **Android APK** via EAS Build.

## Features (parity with desktop, minus KeyGen)

- Password login (single-user, offline, SHA-256 hashed)
- Dashboard with balance / income / expense / record count
- Transaction CRUD with multi-image attachments (gallery + camera)
- Real-time filter (title, category, description, amount range, date range, type)
- Customizable categories
- English / Chinese (Simplified) localization
- Fashion dark theme (default) + Light + System modes
- 100 % offline — data stored in on-device SQLite

## Prerequisites (one-time)

1. **Node.js 20+** — <https://nodejs.org>
2. **Expo account** (free) — <https://expo.dev/signup>
3. **EAS CLI** — `npm install -g eas-cli`

You do **not** need Android Studio or the Android SDK. EAS Build compiles the APK in the cloud.

## First-time setup

```bash
cd LedgerDeskMobile
npm install
eas login          # use your Expo account
eas build:configure
```

## Build the APK (cloud, via EAS)

```bash
# Preview APK — installable directly on any Android phone
npm run build:preview

# Production AAB — for Play Store submission
npm run build:production
```

EAS queues the build, runs it on their servers (10–20 min), and gives you a download link.
Free tier includes 30 builds/month.

## Run locally during development (no APK build needed)

```bash
npm start
# Scan the QR code in Expo Go on your Android phone
```

> For SQLite + expo-image-picker to work reliably, prefer an **EAS development build** over Expo Go:
> `eas build --profile development -p android` — this gives you a one-time APK that supports live-reload.

## Project structure

```
LedgerDeskMobile/
├── app/                           # Expo Router file-based routes
│   ├── _layout.tsx                # Auth gate, theme provider, i18n init
│   ├── index.tsx                  # Redirect → /login
│   ├── login.tsx                  # Password login / first-run setup
│   └── (app)/                     # Authenticated routes
│       ├── dashboard.tsx
│       ├── settings.tsx
│       └── records/
│           ├── index.tsx          # List + filters
│           ├── new.tsx
│           ├── edit.tsx
│           ├── [id].tsx           # Detail view
│           └── _form.tsx          # Shared form (new + edit)
├── src/
│   ├── theme/                     # Fashion dark theme + tokens
│   ├── services/                  # db, records, categories, auth, images, currency, settings
│   ├── i18n/                      # i18next + en / zh-CN locale JSON
│   ├── components/                # Button, Input, Card, Screen, Header, RecordRow
│   ├── hooks/                     # Zustand auth store
│   └── types/                     # TypeScript data types
├── app.json                       # Expo config (package id, icon, permissions)
├── eas.json                       # EAS build profiles (preview / production)
└── package.json
```

## Data storage

- **SQLite database:** `expo-sqlite`, stored in app sandbox at `ledgerdesk.db`
- **Images:** files in `FileSystem.documentDirectory/record-images/`, paths stored in DB (no BLOBs)
- **Settings / password hash:** `AppSettings` table

## Tech stack

| Component          | Version             |
|--------------------|---------------------|
| React Native       | 0.76                |
| Expo SDK           | 52                  |
| expo-sqlite        | 15                  |
| expo-image-picker  | 16                  |
| expo-router        | 4 (file-based)      |
| i18next            | 23                  |
| TypeScript         | 5.3                 |
| zustand            | 5 (auth state)      |

## What changed from the Windows version

- **KeyGen / hardware license** — removed. No activation step.
- **Images** — now stored as files (`FileSystem`) + URIs in DB, not as SQLite BLOBs.
- **Drag-drop image upload** — replaced with tap-to-pick (gallery) and tap-to-capture (camera).
- **Localized UI** — `en.json` / `zh-CN.json` ported, minus the activation/license keys.
- **Theme** — dark mode is now the default and has been restyled with a luxury gold accent.

## License

Same as the parent LedgerDesk project.
