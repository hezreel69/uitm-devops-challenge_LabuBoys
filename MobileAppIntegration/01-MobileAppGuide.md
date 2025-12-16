# Mobile App Integration Guide

## Overview

This guide explains how to convert the Rentverse Next.js web application into a mobile app (.APK for Android).

---

## 🎯 Recommended Approach: **Capacitor**

**Capacitor** by Ionic is the simplest way to wrap your existing Next.js web app into a native mobile app. It creates a WebView container that runs your web app as a native application.

### Why Capacitor?

| Feature | Capacitor | PWA | React Native |
|---------|-----------|-----|--------------|
| Code reuse | ✅ 100% | ✅ 100% | ❌ Rewrite |
| Real APK | ✅ Yes | ⚠️ Limited | ✅ Yes |
| Native features | ✅ Yes | ⚠️ Limited | ✅ Yes |
| Complexity | 🟢 Low | 🟢 Very Low | 🔴 High |
| App Store ready | ✅ Yes | ⚠️ PWA only | ✅ Yes |

---

## 📱 Quick Start with Capacitor

### Prerequisites

1. **Node.js** (already installed)
2. **Android Studio** - [Download here](https://developer.android.com/studio)
3. **Java JDK 17+** - Usually included with Android Studio

### Step 1: Install Capacitor

```bash
cd rentverse-frontend

# Install Capacitor core and CLI
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init "Rentverse" "com.rentverse.app"
```

### Step 2: Configure for Static Export

Update `next.config.ts` to enable static export:

```typescript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // ... other config
}
```

### Step 3: Build and Add Android

```bash
# Build the Next.js app
npm run build

# Add Android platform
npm install @capacitor/android
npx cap add android

# Copy web assets to Android
npx cap copy android

# Open in Android Studio
npx cap open android
```

### Step 4: Build APK in Android Studio

1. Open Android Studio (automatically opened by `cap open android`)
2. Wait for Gradle sync to complete
3. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. Find APK in `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔧 Configuration Files

### `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rentverse.app',
  appName: 'Rentverse',
  webDir: 'out',
  server: {
    // For development, use your local server
    // url: 'http://YOUR_IP:3001',
    // cleartext: true,
    
    // For production, leave commented (uses bundled assets)
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
    },
  },
};

export default config;
```

---

## 🎨 App Icon and Splash Screen

### Generate Icons

1. Create a 1024x1024 PNG icon
2. Use [capacitor-assets](https://github.com/ionic-team/capacitor-assets):

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --android
```

Or manually place icons in:
- `android/app/src/main/res/mipmap-*` folders

---

## 🔐 Security Considerations for Mobile

### 1. API URL Configuration

Create environment-specific configs:

```typescript
// utils/config.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-production-api.com';
```

### 2. Secure Storage

For sensitive data, use Capacitor's Secure Storage:

```bash
npm install @capacitor/preferences
```

```typescript
import { Preferences } from '@capacitor/preferences';

// Store token securely
await Preferences.set({ key: 'authToken', value: token });

// Retrieve token
const { value } = await Preferences.get({ key: 'authToken' });
```

### 3. Certificate Pinning (Optional)

For added security, implement certificate pinning in `capacitor.config.ts`.

---

## 🚀 Development Workflow

### Live Reload (Development)

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://YOUR_COMPUTER_IP:3001',
     cleartext: true,
   }
   ```

3. Run on device:
   ```bash
   npx cap run android
   ```

### Production Build

```bash
# 1. Build Next.js
npm run build

# 2. Sync with Android
npx cap sync android

# 3. Build APK in Android Studio
npx cap open android
# Then: Build → Build APK
```

---

## 📋 Checklist

- [ ] Install Android Studio
- [ ] Install Java JDK 17+
- [ ] Configure `next.config.ts` for static export
- [ ] Initialize Capacitor
- [ ] Add Android platform
- [ ] Configure API URLs for production
- [ ] Add app icons
- [ ] Test on emulator
- [ ] Build debug APK
- [ ] Test on physical device
- [ ] Build release APK (signed)

---

## 🐛 Common Issues

### Issue: White screen on app launch
**Solution:** Ensure `webDir` in capacitor.config.ts points to `out` (Next.js export folder)

### Issue: API calls fail
**Solution:** 
- Check if using HTTPS for production API
- For HTTP in development, add `android:usesCleartextTraffic="true"` to AndroidManifest.xml

### Issue: Images not loading
**Solution:** Add `images: { unoptimized: true }` to next.config.ts

### Issue: Route navigation not working
**Solution:** Make sure to use `output: 'export'` in next.config.ts

---

## 📚 Alternative: PWA to APK

If you want an even simpler approach (but less native features):

1. **Make your app a PWA** (add manifest.json, service worker)
2. **Use PWABuilder** - https://www.pwabuilder.com/
3. **Upload your URL** and generate APK

This creates a "Trusted Web Activity" (TWA) that wraps your PWA.

---

## 🔗 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Android Studio](https://developer.android.com/studio)
- [PWABuilder](https://www.pwabuilder.com/)

---

*Last updated: December 2025 By ClaRity*
