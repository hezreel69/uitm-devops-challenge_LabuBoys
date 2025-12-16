# 🚀 Quick Start Guide - Rentverse (After Debug Fix)

## What Was Fixed

**Problem**: Login redirected to homepage without authenticating  
**Root Cause**: Port mismatch (Backend on 3000, Frontend expecting 3001)  
**Solution**: Synchronized both to use port 3000

---

## 🏃 Starting the Application

### Step 1: Start Backend
```bash
cd c:\Users\alifh\Desktop\labuboys\rentverse-backend
node index.js
```

**Expected Output**:
```
🚀 Server is running on port 3000
✅ Database connected successfully
```

### Step 2: Start Frontend (New Terminal)
```bash
cd c:\Users\alifh\Desktop\labuboys\rentverse-frontend
npm run dev
```

**Expected Output**:
```
  ▲ Next.js 16.0.10
  - Local:        http://localhost:3001
```

---

## ✅ Testing Login

### Option 1: Test with Existing Account
1. Open http://localhost:3001
2. Click "Login" or navigate to `/auth`
3. Enter your email
4. Enter your password
5. Should now successfully log in!

### Option 2: Create New Test Account
1. Open http://localhost:3001
2. Click "Sign Up"
3. Fill in registration form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Phone: +60123456789
   - Date of Birth: 1990-01-01
   - Password: password123
4. Submit → Check backend console for OTP code
5. Login with the new credentials

---

## 🔍 Verify Everything Works

### Check Backend Health
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "success": true,
  "message": "API is running",
  "database": "connected"
}
```

### Check Frontend API Connection
Open browser DevTools (F12) → Network tab → Try login → Should see:
- `POST /api/auth/login` → Status 200
- Response has `token` and `user` data

---

## 🐛 If Login Still Fails

### Check 1: Are Both Servers Running?
```bash
netstat -ano | findstr "3000 3001"
```

Should show both ports LISTENING.

### Check 2: Browser Console Errors?
Press F12 → Console tab → Look for errors

### Check 3: Backend Logs?
Check terminal running backend for error messages

### Check 4: Database Connected?
Backend logs should show: `✅ Database connected successfully`

If not, check PostgreSQL is running:
```bash
# Check if PostgreSQL service is running
sc query postgresql-x64-15
```

---

## 📁 Files Modified

1. `rentverse-backend/.env` → PORT=3000
2. `rentverse-frontend/.env.local` → NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

---

## 🎯 What Should Work Now

✅ User registration  
✅ Email/password login  
✅ MFA/OTP flow (code appears in backend console)  
✅ Token storage  
✅ Authenticated routes  
✅ Logout  

❌ **Not Working Yet** (requires additional config):
- Email sending (OTP shown in console only)
- File uploads (need Cloudinary)

---

## 💡 Quick Troubleshooting Commands

```bash
# Kill all Node processes (if stuck)
taskkill /F /IM node.exe

# Check what's using port 3000
netstat -ano | findstr :3000

# Test backend directly
curl -X POST http://localhost:3000/api/auth/check-email -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\"}"
```

---

## 📖 Full Debug Report

See `DEBUG_REPORT.md` for complete analysis of all issues found and fixed.

---

**Last Updated**: 2025-12-16 09:16 UTC  
**Status**: ✅ READY TO USE
