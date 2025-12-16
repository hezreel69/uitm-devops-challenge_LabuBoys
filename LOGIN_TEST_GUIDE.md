# Login Test Script

## Test Users Available
1. **landlord3@rentverse.com** - USER (MFA Enabled)
2. **admin@rentverse.com** - ADMIN (MFA Enabled)
3. **tenant@rentverse.com** - USER (MFA Enabled)
4. **superadmin@rentverse.com** - ADMIN (MFA Enabled)
5. **alifhezreel@gmail.com** - USER (MFA Enabled)

## Problem: Backend keeps stopping

The backend process needs to stay running. Use `pnpm run dev` instead of `node index.js` for auto-restart.

## Steps to Test Login:

### 1. Start Backend (Keep Terminal Open)
```bash
cd c:\Users\alifh\Desktop\labuboys\rentverse-backend
pnpm run dev
```

### 2. Start Frontend (New Terminal, Keep Open)
```bash
cd c:\Users\alifh\Desktop\labuboys\rentverse-frontend
npm run dev
```

### 3. Test Login Flow
1. Open http://localhost:3001
2. Click Login or go to http://localhost:3001/auth
3. Enter email: **admin@rentverse.com**
4. Click "Continue"
5. Should redirect to /auth/login
6. Enter password (you need to know the password)
7. Submit

**If you don't know the password**, create a new account:
- Go to http://localhost:3001/auth/signup
- Fill in details
- Password will be hashed, so remember what you set

## Expected Behavior:
- Email check → redirects to /auth/login
- Enter password → MFA required (OTP sent)
- Check backend console for OTP code
- Enter OTP → Login success

## Current Issue:
Backend process keeps stopping. Need to use `pnpm run dev` with nodemon for auto-restart.
