# Deployment Guide

This guide covers deploying the Rentverse application for mobile app integration.

---

## 🎯 Deployment Overview

| Component | Platform | URL After Deploy |
|-----------|----------|------------------|
| **Frontend** | Vercel | `https://your-app.vercel.app` |
| **Backend** | Railway/Render | `https://your-backend.railway.app` |
| **Database** | Railway/Supabase | Managed PostgreSQL |

---

## 📦 Step 1: Deploy Backend (Express.js + Prisma)

### Option A: Railway (Recommended - Easy + Database Included)

1. **Go to Railway**: https://railway.app
2. **Sign up with GitHub**
3. **Create New Project** → **Deploy from GitHub repo**
4. **Select your repository** and choose `rentverse-backend` folder:
   - Set **Root Directory**: `rentverse-backend`

5. **Add PostgreSQL Database**:
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**
   - Railway auto-creates `DATABASE_URL` for you

6. **Set Environment Variables** (Settings → Variables):
   ```
   DATABASE_URL          → (auto-set by Railway if using their PostgreSQL)
   JWT_SECRET            → your-super-secret-jwt-key-min-32-chars
   JWT_EXPIRES_IN        → 7d
   CORS_ORIGIN           → https://your-frontend.vercel.app
   PORT                  → 3000
   NODE_ENV              → production
   
   # Email (optional)
   EMAIL_HOST            → smtp.gmail.com
   EMAIL_PORT            → 587
   EMAIL_USER            → your-email@gmail.com
   EMAIL_PASS            → your-app-password
   
   # Cloudinary (optional)
   CLOUDINARY_CLOUD_NAME → your-cloud-name
   CLOUDINARY_API_KEY    → your-api-key
   CLOUDINARY_API_SECRET → your-api-secret
   ```

7. **Deploy**: Railway auto-deploys on push

8. **Run Migrations** (Railway Console):
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Option B: Render (Also Easy)

1. Go to https://render.com
2. Create **Web Service** from GitHub
3. Set Root Directory: `rentverse-backend`
4. Build Command: `npm install && npx prisma generate`
5. Start Command: `npm start`
6. Add environment variables as above

---

## 🌐 Step 2: Deploy Frontend (Next.js to Vercel)

### Prerequisites
- Push your code to GitHub first (if not already)
- Have a Vercel account (sign up at vercel.com with GitHub)

### Deploy Steps

1. **Go to Vercel**: https://vercel.com/new

2. **Import Git Repository**:
   - Select your GitHub repo
   - Vercel auto-detects Next.js

3. **Configure Project**:
   - **Root Directory**: `rentverse-frontend`
   - **Framework Preset**: Next.js (auto-detected)

4. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL           → https://your-backend.railway.app
   NEXT_PUBLIC_MAPTILER_API_KEY  → your-maptiler-api-key
   ```

5. **Click Deploy** 🚀

6. **After deployment**, copy your Vercel URL (e.g., `https://rentverse-xyz.vercel.app`)

7. **Update Backend CORS**: Go back to Railway/Render and update:
   ```
   CORS_ORIGIN → https://rentverse-xyz.vercel.app
   ```

---

## 📱 Step 3: Configure Capacitor for Live URL

After both are deployed, update `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rentverse.app',
  appName: 'Rentverse',
  webDir: 'out', // Not used when using server URL
  server: {
    // Point to your deployed Vercel URL
    url: 'https://your-app.vercel.app',
    cleartext: false, // Use HTTPS
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
```

Then build the APK:
```bash
npx cap sync android
npx cap open android
# Build → Build APK in Android Studio
```

---

## 🔧 Quick Reference: Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.vercel.app
PORT=3000
NODE_ENV=production
```

### Frontend (Vercel Environment Variables)
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_MAPTILER_API_KEY=your-key
```

---

## ✅ Deployment Checklist

- [ ] Push code to GitHub
- [ ] Deploy backend to Railway/Render
- [ ] Set up PostgreSQL database
- [ ] Run Prisma migrations
- [ ] Set backend environment variables
- [ ] Deploy frontend to Vercel  
- [ ] Set frontend environment variables
- [ ] Update backend CORS with Vercel URL
- [ ] Test the deployed app
- [ ] Update Capacitor config with Vercel URL
- [ ] Build APK

---

*Last updated: December 2025 By ClaRity*
