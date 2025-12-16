# 🎯 QUICK START - Testing TOTP Implementation

## What's Been Implemented

✅ **Backend TOTP System** - Fully functional
- TOTP service with encryption
- 6 API endpoints for TOTP management
- Database schema updated
- Backup codes support

⏳ **Frontend** - Not yet implemented (awaiting your approval to continue)

---

## 🧪 Testing Backend TOTP Endpoints

### Prerequisites:
1. **Backend running** on port 3000
2. **User logged in** with valid JWT token
3. **Authenticator app** installed (Google Authenticator, Authy, Microsoft Authenticator)

### Step 1: Generate TOTP Secret

```bash
# Using curl (replace YOUR_TOKEN with actual JWT)
curl -X POST http://localhost:3000/api/totp/setup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "success": true,
  "message": "TOTP secret generated...",
  "data": {
    "qrCode": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backupCodes": ["A1B2C3D4", "E5F6G7H8", ...]
  }
}
```

### Step 2: Save the Data

1. **QR Code**: Save the base64 image or display it in your app
2. **Secret**: Manual entry key (if QR scan fails)
3. **Backup Codes**: Save these securely!

### Step 3: Scan QR Code

Open your authenticator app:
- **Google Authenticator**: Tap +, choose "Scan QR code"
- **Authy**: Tap +, choose "Scan QR Code"
- **Microsoft Authenticator**: Tap +, choose "Other account"

Scan the QR code from Step 1.

### Step 4: Verify and Enable TOTP

```bash
# Get 6-digit code from your authenticator app
curl -X POST http://localhost:3000/api/totp/verify-setup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
```

**Response**:
```json
{
  "success": true,
  "message": "TOTP enabled successfully!"
}
```

### Step 5: Check TOTP Status

```bash
curl -X GET http://localhost:3000/api/totp/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "verified": true,
    "backupCodesRemaining": 10
  }
}
```

### Step 6: Test TOTP Login

Now when you login, the system should:
1. Check user's `mfaMethod` field
2. If `"TOTP"`, require TOTP code instead of email OTP
3. Verify using `/api/totp/verify` endpoint

**Current Limitation**: Frontend doesn't support TOTP login yet. You'll need to implement the frontend components first.

---

## 🔧 Optional: Test Backup Codes

### Verify with Backup Code:

```bash
# Use backup code instead of TOTP (works during login)
curl -X POST http://localhost:3000/api/totp/verify \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "token": "A1B2C3D4"}'
```

**Note**: Each backup code can only be used once!

### Regenerate Backup Codes:

```bash
# Requires current TOTP code
curl -X POST http://localhost:3000/api/totp/backup-codes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
```

---

## 🛠️ Environment Setup

### Required Environment Variable:

Add to `rentverse-backend/.env`:

```env
# TOTP Encryption Key (32 characters minimum)
TOTP_ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Generate secure key**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📱 Authenticator Apps

### Recommended Apps:

1. **Google Authenticator**
   - iOS: https://apps.apple.com/app/google-authenticator/id388497605
   - Android: https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2

2. **Microsoft Authenticator**
   - iOS: https://apps.apple.com/app/microsoft-authenticator/id983156458
   - Android: https://play.google.com/store/apps/details?id=com.azure.authenticator

3. **Authy**
   - iOS: https://apps.apple.com/app/authy/id494168017
   - Android: https://play.google.com/store/apps/details?id=com.authy.authy

---

## 🎨 Frontend Implementation (Next Steps)

### Components Needed:

1. **`components/TotpSetupWizard.tsx`**
   ```tsx
   // Multi-step wizard:
   // Step 1: "Secure Your Account" intro
   // Step 2: "Install App" with app store links
   // Step 3: "Scan QR Code" (display QR from API)
   // Step 4: "Enter Code" (verify with 6-digit input)
   // Step 5: "Save Backup Codes" (downloadable)
   ```

2. **`components/TotpInput.tsx`**
   ```tsx
   // 6-digit OTP input component
   // Auto-focus, auto-submit when complete
   // Similar to existing OTP input but labeled "Authenticator Code"
   ```

3. **`components/ModalMfaVerify.tsx`** (Modify existing)
   ```tsx
   // Check user.mfaMethod
   // If "TOTP": Show TotpInput
   // If "EMAIL": Show email OTP input
   // Add "Use backup code" link
   ```

4. **`app/account/security/totp/page.tsx`**
   ```tsx
   // TOTP management page
   // - Show status (Enabled/Disabled)
   // - "Set up TOTP" button (opens wizard)
   // - "Disable TOTP" button (requires code)
   // - "Regenerate Backup Codes" button
   // - Show backup codes count
   ```

### AuthStore Updates:

```typescript
// Add to stores/authStore.ts
interface AuthStore {
  // ... existing fields
  
  // New TOTP fields
  totpSetupData: {
    qrCode: string | null
    secret: string | null
    backupCodes: string[] | null
  }
  
  // New methods
  setupTotp: () => Promise<void>
  verifyTotpSetup: (token: string) => Promise<boolean>
  disableTotp: (token: string) => Promise<void>
  getTotpStatus: () => Promise<void>
}
```

---

## ✅ Backend API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/totp/setup` | POST | ✅ | Generate secret & QR |
| `/api/totp/verify-setup` | POST | ✅ | Verify & enable TOTP |
| `/api/totp/verify` | POST | ❌ | Verify during login |
| `/api/totp/disable` | POST | ✅ | Disable TOTP |
| `/api/totp/status` | GET | ✅ | Get TOTP status |
| `/api/totp/backup-codes` | POST | ✅ | Regenerate codes |

---

## 🐛 Troubleshooting

### Issue: "TOTP not set up for this user"
**Solution**: Call `/api/totp/setup` first

### Issue: "Invalid code"
**Reasons**:
1. Time sync issue (device clock wrong)
2. Used wrong account in authenticator app
3. TOTP not enabled yet
4. Code expired (30-second window)

**Solution**: 
- Check device time is correct
- Ensure you're using the right account
- Codes refresh every 30 seconds

### Issue: Backend restart doesn't load TOTP routes
**Solution**: 
1. Check `src/app.js` has `app.use('/api/totp', totpRoutes)`
2. Restart backend: `pnpm run dev`
3. Check logs for errors

---

## 📊 Database Changes

### New User Fields:
```sql
-- Check if fields exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('mfaMethod', 'totpEnabled', 'totpVerified', 'backupCodes');
```

### View User TOTP Status:
```sql
-- Check a specific user
SELECT 
  email, 
  "mfaMethod", 
  "totpEnabled", 
  "totpVerified",
  array_length("backupCodes", 1) as backup_codes_count
FROM users
WHERE email = 'your-email@example.com';
```

---

## 🎯 Success Criteria

✅ Backend implementation complete when:
- [x] TOTP service created with encryption
- [x] All 6 API endpoints working
- [x] Database schema updated
- [x] Migration applied successfully
- [x] Routes registered in app.js

⏳ Frontend implementation complete when:
- [ ] Setup wizard functional
- [ ] TOTP login working
- [ ] Backup codes can be used
- [ ] Management page functional
- [ ] All components integrated

✅ Feature complete when:
- [ ] User can enable TOTP
- [ ] User can login with TOTP
- [ ] User can use backup codes
- [ ] User can disable TOTP
- [ ] User can regenerate backup codes

---

**Backend Status**: ✅ Ready for frontend integration
**Next Step**: Implement frontend components or continue with other features?
