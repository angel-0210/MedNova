# MedNova Mobile Platform: Engineering Documentation & Deployment Guide

This guide describes the configuration, developer setup, structural architecture, secure token systems, and deployment mechanisms for the MedNova Expo React Native application.

---

## 1. Expo Setup Guide
To start developing the mobile client, ensure you have:
* **Node.js** (>= 22.11.0)
* **NPM** (>= 10.x)
* **Expo Go** app installed on your physical test device (Android or iOS).

First, clean and install monorepo dependencies from the workspace root:
```bash
# Clean root lock files and run a fresh workspace install
npm install
```

---

## 2. Development Guide
To configure your code editor (e.g. VS Code):
* Install the **Expo Tools** extension.
* Install **ESLint** and **Prettier** extensions to guarantee code formatting conformity.
* Enable strict type-checking in your editor configuration.

For Android Emulators, ensure the Android SDK is configured in your system paths. For iOS Simulators, Xcode command-line tools must be active.

---

## 3. Folder Structure Documentation
The mobile client is structured as follows:
```text
apps/mobile/
├── app/                  # File-based routes (Expo Router)
│   ├── _layout.tsx       # Root layout provider configuration
│   ├── login.tsx         # Unprotected login form screen
│   └── (app)/            # Authenticated route group
│       ├── _layout.tsx   # Auth guard and stack layouts
│       ├── dashboard.tsx # Bento-style live monitoring telemetry
│       ├── patients.tsx  # Scrollable patient lists
│       ├── patient/[id].tsx # Individual telemetry detail graphs
│       ├── devices.tsx   # Bluetooth and Wifi gateway settings
│       ├── alerts.tsx    # Incident log manager
│       ├── analytics.tsx # Compliance trend analysis
│       ├── profile.tsx   # Clinician settings
│       └── settings.tsx  # Alert notifications toggle switches
├── assets/               # Splash screen and app icons
├── components/           # Reusable atomic UI components
├── contexts/             # Session authorization context providers
└── services/             # Notification, Websocket, and SecureStore services
```

---

## 4. Environment Configuration
Create a `.env` or configuration file inside `apps/mobile/` to store your environment endpoints.

Variables required:
* `EXPO_PUBLIC_API_URL`: Root URL of the FastAPI backend (e.g. `http://localhost:8000` or Android emulator address `http://10.0.2.2:8000`).
* `EXPO_PUBLIC_SUPABASE_URL`: Supabase project database domain.
* `EXPO_PUBLIC_SUPABASE_KEY`: Supabase anon publishable authorization key.

Example:
```env
EXPO_PUBLIC_API_URL="http://localhost:8000"
EXPO_PUBLIC_SUPABASE_URL="https://your-supabase.supabase.co"
EXPO_PUBLIC_SUPABASE_KEY="your-anon-publishable-key"
```

---

## 5. Running Locally
Run the following scripts from the workspace root:
```bash
# Run web client
npm run web

# Start Expo bundler
npm run mobile
```
Press `a` in the Expo Metro terminal to launch on the Android emulator, or `i` for iOS simulator.

---

## 6. Building Android
To compile the release APK/AAB bundle locally using Expo Prebuild:
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```
Alternatively, build in the cloud via EAS (see Section 8).

---

## 7. Building iOS
To generate an IPA release archive:
* Configure cocoapods and run:
```bash
npx expo prebuild --platform ios
cd ios && pod install
```
* Open the `.xcworkspace` in Xcode to configure your development team certificate.
* Archive and export the release package.

---

## 8. EAS Deployment Guide
We use **Expo Application Services (EAS)** for production builds:
1. Install EAS CLI globally: `npm install -g eas-cli`
2. Authenticate: `eas login`
3. Configure the project: `eas build:configure`
4. Trigger cloud builds:
```bash
# Build for Android (generates link to APK/AAB)
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

## 9. Notification Setup
The app registers for push tokens via `expo-notifications`:
1. On start, `registerForPushNotificationsAsync` verifies user permissions.
2. The retrieved Expo push token is saved to the FastAPI backend associated with the User ID.
3. The backend transmits remote payloads to the device when critical ventilator incidents (high pressure, battery warnings) occur.
4. Incoming notifications in the foreground trigger system alerts.

---

## 10. Secure Authentication Guide
* JWT auth tokens are fetched during the authentication process.
* Access and refresh tokens are saved in Secure Storage using `expo-secure-store` (never `AsyncStorage`).
* The Axios interceptors automatically request a token renewal from `/api/v1/auth/refresh` on `401 Unauthorized` responses.
* If token refresh fails, the session is cleared and the routing redirects to `/login`.
