# Module 1: Secure Login and Multi-Factor Authentication (MFA)

> **Security Focus**: OWASP M1–M3 (Improper Credential Usage, Inadequate Supply Chain Security, Insecure Authentication/Authorization)

## 📋 Overview

This module implements a secure login system with **OTP-based Multi-Factor Authentication (MFA)** and role-based access control. When MFA is enabled for a user, they must enter a 6-digit code sent to their email after providing their password.

## 🔐 Key Features

### 1. Multi-Factor Authentication (MFA)
- 6-digit OTP codes sent via email
- 5-minute code expiry
- Maximum 5 attempts before code invalidation
- Users can toggle MFA on/off in settings

### 2. Account Protection
- **Account lockout** after 5 failed login attempts (15-minute lock)
- Failed attempts are tracked per user
- Successful login resets attempt counter

### 3. Role-Based Access Control
- `USER` role: Regular users
- `ADMIN` role: Administrative access
- Protected routes check user role via `authorize()` middleware

---

## 🗃️ Database Changes

### User Model (Extended)
```prisma
model User {
  // ... existing fields ...
  mfaEnabled       Boolean   @default(false)  // Is MFA turned on?
  mfaSecret        String?                     // For future TOTP support
  lastLoginAt      DateTime?                   // Last successful login
  loginAttempts    Int       @default(0)       // Failed attempts counter
  lockedUntil      DateTime?                   // Account lock expiry
}
```

### OtpCode Model (New)
```prisma
model OtpCode {
  id          String    @id @default(uuid())
  userId      String                // Who owns this OTP
  code        String                // Hashed OTP (never store plain!)
  type        OtpType               // LOGIN, PASSWORD_RESET, EMAIL_VERIFY
  expiresAt   DateTime              // When it becomes invalid
  usedAt      DateTime?             // When it was consumed
  attempts    Int       @default(0) // Wrong guesses count
}
```

---

## 🔄 Login Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Enter     │────▶│   Check     │────▶│   MFA       │────▶│   Enter     │
│  Password   │     │  Password   │     │  Enabled?   │     │   OTP       │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                   │ No               │
                           │                   ▼                  ▼
                           │            ┌─────────────┐     ┌─────────────┐
                           │            │   Issue     │     │  Verify     │
                           │            │   Token     │◀────│   OTP       │
                           │            └─────────────┘     └─────────────┘
                           │
                    (Failed attempt)
                           │
                           ▼
                    ┌─────────────┐
                    │  5 fails?   │──Yes──▶ Lock Account
                    │  Lock 15min │
                    └─────────────┘
```

---

## 📁 Files Modified/Created

### Backend
| File | Description |
|------|-------------|
| `prisma/schema.prisma` | Added `OtpCode` model and MFA fields to `User` |
| `src/services/otp.service.js` | OTP generation, verification, account lockout |
| `src/routes/auth.js` | Login with MFA, MFA endpoints |

### Frontend
| File | Description |
|------|-------------|
| `components/OtpVerification.tsx` | 6-digit OTP input component |
| `components/ModalLogIn.tsx` | Updated to show OTP screen when needed |
| `stores/authStore.ts` | Added MFA state and actions |
| `app/api/auth/mfa/*/route.ts` | API route proxies for MFA endpoints |

---

## 🔌 API Endpoints

### Login (Updated)
```
POST /api/auth/login
Body: { email, password }

Response (MFA Not Enabled):
{ success: true, data: { user, token } }

Response (MFA Required):
{ success: true, data: { mfaRequired: true, sessionToken, expiresAt } }
```

### MFA Verify
```
POST /api/auth/mfa/verify
Body: { sessionToken, otp }
Response: { success: true, data: { user, token } }
```

### MFA Enable
```
POST /api/auth/mfa/enable
Headers: Authorization: Bearer <token>
Response: { success: true, message: "MFA enabled" }
```

### MFA Disable
```
POST /api/auth/mfa/disable
Headers: Authorization: Bearer <token>
Body: { password }
Response: { success: true, message: "MFA disabled" }
```

### MFA Resend
```
POST /api/auth/mfa/resend
Body: { sessionToken }
Response: { success: true, data: { expiresAt } }
```

---

## 🛡️ Security Measures

| Risk | Mitigation |
|------|------------|
| OTP brute force | Max 5 attempts per OTP, then invalidate |
| Password brute force | Account lock after 5 failed logins |
| OTP theft | Codes expire after 5 minutes |
| OTP storage | Codes are bcrypt hashed before storage |
| Session hijacking | Short-lived MFA session tokens (10 min) |
| Timing attacks | Constant-time password comparison (bcrypt) |

---

## 🧪 How to Test

### Enable MFA for a User
1. Log in as a user
2. Go to account settings (or use API directly)
3. Enable MFA via `POST /api/auth/mfa/enable`

### Test MFA Login
1. Log out
2. Try to log in - you should see the OTP screen
3. Check backend console for OTP (currently logged there)
4. Enter OTP to complete login

### Test Account Lockout
1. Enter wrong password 5 times
2. Account should be locked for 15 minutes
3. Correct password won't work during lockout

---

## 🔮 Future Improvements

- [x] Email sending integration (Nodemailer, SendGrid)
- [ ] TOTP authenticator app support (Google Authenticator)
- [ ] Backup recovery codes
- [ ] Remember device functionality
- [ ] Rate limiting at API gateway level

---

## 📚 OWASP References

- **M1 - Improper Credential Usage**: Passwords are hashed with bcrypt, never stored in plain text
- **M2 - Inadequate Supply Chain Security**: Dependencies are from trusted sources (npm)
- **M3 - Insecure Authentication/Authorization**: MFA provides second factor, role-based access enforced

---

*Last updated: December 2025 By ClaRity*
