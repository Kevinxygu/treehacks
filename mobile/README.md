# Bloom Mobile (React Native / Expo)

The elderly-facing companion app. Records voice, facilitates conversations,
and sends audio to the FastAPI backend for cognitive analysis.

---

## Prerequisites

| Tool | Install |
|------|---------|
| **Node.js 18+** | `brew install node` or [nodejs.org](https://nodejs.org) |
| **Expo CLI** | Comes with `npx` — no global install needed |
| **Expo Go app** | Install on your **phone** from the App Store / Play Store |
| **Watchman** (macOS, optional) | `brew install watchman` |

> For iOS simulator testing you also need **Xcode** (Mac App Store).
> For Android emulator you need **Android Studio**.

---

## Quick Start

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Start the dev server
npx expo start
```

This opens the **Expo Dev Tools** in your terminal. You'll see a QR code.

### Run on your phone (easiest)

1. Open **Expo Go** on your iPhone or Android.
2. Scan the QR code from the terminal.
3. The app loads on your phone over your local network.

> **Both your phone and computer must be on the same Wi-Fi network.**

### Run on iOS Simulator

```bash
npx expo start --ios
```

### Run on Android Emulator

```bash
npx expo start --android
```

---

## Connecting to the Backend

The mobile app talks to the same **FastAPI backend** that powers the dashboard.

### 1. Start the backend

```bash
cd backend
source .venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

> `--host 0.0.0.0` is critical — it makes the server reachable from your phone,
> not just localhost.

### 2. Point the mobile app to your machine

Edit `mobile/src/services/api.ts` and replace the `API_BASE` with your
computer's local IP:

```ts
const API_BASE = __DEV__
  ? "http://192.168.x.x:8000"   // ← your machine's IP
  : "https://your-production-api.com";
```

Find your IP:
```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# or
ipconfig getifaddr en0
```

### 3. Data flow

```
┌──────────────┐     audio file      ┌──────────────────┐
│  Mobile App  │ ──────────────────→  │  FastAPI Backend  │
│  (Expo/RN)   │                      │  (port 8000)      │
│              │ ←────────────────── │                    │
│              │   analysis JSON     │  /analyze-*        │
└──────────────┘                      └────────┬─────────┘
                                               │
                                               │ stores results
                                               ▼
                                      ┌──────────────────┐
                                      │    Supabase DB    │
                                      └────────┬─────────┘
                                               │
                                               │ reads results
                                               ▼
                                      ┌──────────────────┐
                                      │  Next.js Dashboard │
                                      │  (Caretaker view) │
                                      └──────────────────┘
```

---

## Agent Workflow (what the mobile user can do)

The elderly user talks to CareCompanion. Behind the scenes, MCP servers and
agents handle tasks:

| Feature | How it works |
|---------|-------------|
| **Medications** | Log stored in Supabase. Reminders pushed via the companion. |
| **Contacts** | Emergency contacts stored in Supabase, quick-dial from app. |
| **Emails** | Agent checks for bills, appointments, scam detection. |
| **Appointments** | Agent books via voice request. |
| **Rides** | Booked via Browserbase automation. |
| **Groceries** | Ordered via Browserbase automation. |
| **Cognitive Screening** | Every conversation is analyzed (lexical diversity, anomia, disfluency, repetition). Results shown on the caretaker dashboard. |
| **WHOOP Data** | Sleep, exercise, recovery pulled from WHOOP API and correlated with cognitive markers. |

---

## Project Structure

```
mobile/
├── App.tsx                     # Entry point
├── app.json                    # Expo config
├── package.json
├── babel.config.js
├── tsconfig.json
└── src/
    ├── constants/
    │   └── colors.ts           # Shared color palette
    ├── navigation/
    │   └── AppNavigator.tsx     # Stack navigator
    ├── screens/
    │   ├── HomeScreen.tsx       # Big mic button, greeting
    │   ├── ConversationScreen.tsx  # Chat + live recording
    │   └── ConfirmationScreen.tsx  # Post-session summary
    └── services/
        └── api.ts              # Backend API calls
```

---

## Building for Testing on a Real Device (without Expo Go)

For a standalone build you can install directly:

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Build for iOS (ad-hoc or simulator)
eas build --platform ios --profile preview

# Build for Android (APK)
eas build --platform android --profile preview
```

Add this to your `app.json` under `"expo"`:
```json
"extra": {
  "eas": { "projectId": "your-project-id" }
}
```

You can also run a **development build** for faster iteration:
```bash
npx expo run:ios   # requires Xcode
npx expo run:android  # requires Android Studio
```

---

## Environment Variables

For production, create an `app.config.js` to inject env vars:

```js
export default {
  expo: {
    ...require("./app.json").expo,
    extra: {
      apiUrl: process.env.API_URL || "http://localhost:8000",
    },
  },
};
```

Then access via `expo-constants`:
```ts
import Constants from "expo-constants";
const API_BASE = Constants.expoConfig?.extra?.apiUrl;
```
