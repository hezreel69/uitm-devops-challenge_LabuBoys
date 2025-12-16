# Smart Notification & Alert System (Module 3)

## Overview
This module implements intelligent security monitoring that logs user activities and alerts on suspicious login patterns, following DevSecOps best practices for incident detection.

---

## Features Implemented

### 1. Login History Tracking

Every login attempt is recorded with:
- IP address
- User agent details
- Device type (mobile/desktop/tablet)
- Browser and OS
- Success/failure status
- Risk score (0-100)
- Timestamp

### 2. Device Recognition

The system tracks known devices per user:
- Generates unique device hash from user agent + IP
- Automatically registers new devices
- Sends email alerts on first-time device logins
- Maintains trust status per device

### 3. Risk Scoring

Each login attempt receives a risk score (0-100):

| Factor | Points |
|--------|--------|
| New/unknown device | +30 |
| Recent failed attempts (per failure) | +10 (max 30) |
| Unusual login time (2-5 AM) | +15 |
| IP with multiple failures on other accounts | +25 |

### 4. Security Alerts

| Alert Type | Trigger | Email Sent |
|------------|---------|------------|
| NEW_DEVICE | Login from unrecognized device | ✅ Yes |
| MULTIPLE_FAILURES | 3+ failed attempts in 5 min | ✅ Yes |
| ACCOUNT_LOCKED | Account locked due to attempts | ✅ Yes |
| PASSWORD_CHANGED | Password was changed | ✅ Yes |
| SUSPICIOUS_TIMING | Login at unusual hours (2-5 AM) | ❌ No (logged only) |

---

## Database Schema

### LoginHistory
Tracks all login attempts with full metadata.
```prisma
model LoginHistory {
  id          String   @id
  userId      String
  ipAddress   String
  userAgent   String?
  deviceType  String?  // mobile, desktop, tablet
  browser     String?
  os          String?
  success     Boolean
  failReason  String?
  riskScore   Int      // 0-100
  createdAt   DateTime
}
```

### UserDevice
Known devices per user.
```prisma
model UserDevice {
  id          String   @id
  userId      String
  deviceHash  String   // SHA256 hash
  deviceName  String?  // "Chrome on Windows"
  deviceType  String?
  browser     String?
  os          String?
  isTrusted   Boolean
  lastUsedAt  DateTime
}
```

### SecurityAlert
Alert history for users.
```prisma
model SecurityAlert {
  id        String    @id
  userId    String
  type      AlertType // Enum
  title     String
  message   String
  metadata  Json?
  isRead    Boolean
  emailSent Boolean
  createdAt DateTime
}
```

---

## File Structure

```
src/
├── services/
│   ├── suspiciousActivity.service.js  # Login pattern analysis
│   └── securityAlert.service.js       # Alert creation & emails
└── routes/
    └── auth.js                        # Integrated tracking
```

---

## Email Templates

Security alert emails include:
- Color-coded headers by alert type
- Device/IP details
- Timestamp
- Action recommendations
- Professional HTML design

---

## Testing

### Trigger New Device Alert
1. Login from a new browser/device
2. Check email for "New Device Login Detected"

### Trigger Multiple Failures Alert
1. Attempt 3+ failed logins in 5 minutes
2. Alert sent after 3rd failure

### Trigger Account Locked Alert
1. Attempt 5 failed logins
2. Account locks + email sent

### Trigger Password Change Alert
1. Change password while logged in
2. Email confirms password change

---

## API Endpoints

### Get Login History
```
GET /api/auth/login-history
Authorization: Bearer <token>
```

### Get Security Alerts
```
GET /api/auth/security-alerts
Authorization: Bearer <token>
```

### Get Registered Devices
```
GET /api/auth/devices
Authorization: Bearer <token>
```

*(Note: These endpoints can be added in a future iteration)*

---

*Last updated: December 2025 By ClaRity*
