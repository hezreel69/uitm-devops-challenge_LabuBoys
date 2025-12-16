# Zero-Trust Access Logic

## Overview

RentVerse implements a comprehensive Zero-Trust security framework that continuously verifies user identity and monitors for suspicious activity. The system follows the principle of "never trust, always verify" by analyzing multiple factors for every authentication attempt.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Zero-Trust Access Layer                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │ Device       │   │ Risk Score   │   │ Suspicious Pattern   │ │
│  │ Detection    │   │ Calculation  │   │ Detection            │ │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘ │
│         │                  │                       │             │
│         └──────────────────┼───────────────────────┘             │
│                            ▼                                     │
│              ┌──────────────────────────┐                        │
│              │   Access Decision Engine  │                       │
│              │   • Allow                 │                       │
│              │   • Require MFA           │                       │
│              │   • Block + Alert         │                       │
│              └──────────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Login History Tracking
**Model:** `LoginHistory`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `userId` | String | Associated user |
| `ipAddress` | String | Client IP address |
| `userAgent` | String | Browser/device info |
| `deviceType` | String | mobile, desktop, tablet |
| `browser` | String | Chrome, Firefox, Safari, etc. |
| `os` | String | Windows, macOS, Linux, iOS, Android |
| `country` | String | Geolocated country |
| `city` | String | Geolocated city |
| `success` | Boolean | Login attempt result |
| `failReason` | String | Reason for failure |
| `riskScore` | Int | 0-100 risk assessment |
| `createdAt` | DateTime | Timestamp |

### 2. Device Trust Management
**Model:** `UserDevice`

Tracks all devices that have accessed a user's account:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `userId` | String | Device owner |
| `deviceHash` | String | SHA-256 hash of device fingerprint |
| `deviceName` | String | User-friendly name (e.g., "Chrome on Windows") |
| `deviceType` | String | mobile, desktop, tablet |
| `browser` | String | Browser name |
| `os` | String | Operating system |
| `ipAddress` | String | Last known IP |
| `lastUsedAt` | DateTime | Last activity |
| `isTrusted` | Boolean | Marked as trusted by user |

### 3. Security Alerts
**Model:** `SecurityAlert`

Real-time security notifications sent to users:

| Alert Type | Trigger | Severity |
|------------|---------|----------|
| `NEW_DEVICE` | Login from unknown device | Medium |
| `MULTIPLE_FAILURES` | 3+ failed attempts in 5 minutes | High |
| `ACCOUNT_LOCKED` | Account temporarily locked | High |
| `PASSWORD_CHANGED` | Password was updated | Medium |
| `SUSPICIOUS_TIMING` | Login at unusual hours (2-5 AM) | Low |
| `MULTIPLE_IPS` | 3+ different IPs in 1 hour | High |

## Risk Score Calculation

The system calculates a risk score (0-100) for each login attempt:

```javascript
calculateRiskScore(userId, ipAddress, userAgent) {
    let riskScore = 0;
    
    // New/unknown device: +30 points
    if (isNewDevice) {
        riskScore += 30;
    }
    
    // IP used for failed attempts on other accounts: +25 points
    if (ipFailures > 5) {
        riskScore += 25;
    }
    
    // Multiple failed attempts recently: +20 points
    if (recentFailures > 3) {
        riskScore += 20;
    }
    
    // Login from multiple IPs in short time: +15 points
    if (multipleIPs > 3) {
        riskScore += 15;
    }
    
    // Unusual timing (2 AM - 5 AM): +10 points
    if (hour >= 2 && hour <= 5) {
        riskScore += 10;
    }
    
    return Math.min(riskScore, 100);
}
```

## Suspicious Pattern Detection

### Patterns Monitored

| Pattern | Detection Logic | Action |
|---------|-----------------|--------|
| Brute Force | 3+ failures in 5 min | Block + Alert |
| Credential Stuffing | Same IP, different accounts | Rate limit |
| Session Hijacking | Device change mid-session | Invalidate session |
| Account Takeover | Multiple IPs in short time | Require MFA |
| Unusual Access | Login at 2-5 AM | Low priority alert |

### Implementation

```javascript
checkSuspiciousPatterns(userId, ipAddress) {
    const alerts = [];
    
    // Check for multiple failed attempts
    if (recentFailures >= 3) {
        alerts.push({
            type: 'BRUTE_FORCE_ATTEMPT',
            severity: 'high',
            message: `${recentFailures} failed login attempts in 5 minutes`
        });
    }
    
    // Check for multiple different IPs
    if (uniqueIPs >= 3) {
        alerts.push({
            type: 'MULTIPLE_IP_ADDRESSES',
            severity: 'medium',
            message: `Logins from ${uniqueIPs} different IPs in the last hour`
        });
    }
    
    // Check unusual timing
    if (hour >= 2 && hour <= 5) {
        alerts.push({
            type: 'SUSPICIOUS_TIMING',
            severity: 'low',
            message: 'Login at unusual hour (between 2 AM and 5 AM)'
        });
    }
    
    return { hasSuspiciousActivity: alerts.length > 0, alerts };
}
```

## Rate Limiting

### Tiers

| Limiter | Scope | Limit | Window |
|---------|-------|-------|--------|
| Global | All routes | 2000 requests | 15 min |
| API | Authenticated APIs | 2000 requests | 15 min |
| Auth | Login/Register | 10 attempts | 15 min |
| OTP | OTP verification | 5 attempts | 15 min |
| Sensitive | Password change, etc. | 5 requests | 15 min |

### Implementation

```javascript
// Authentication rate limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        error: 'Too many login attempts',
        message: 'Please try again after 15 minutes',
    }
});
```

## MFA Integration

### Flow

1. User enters email + password
2. System validates credentials
3. If MFA enabled:
   - Generate 6-digit OTP
   - Send via email (Resend API)
   - User enters OTP
   - Validate OTP (3 attempts max, 5 min expiry)
4. Issue JWT token

### OTP Security

| Feature | Implementation |
|---------|----------------|
| Hash storage | OTP stored as bcrypt hash |
| Expiry | 5 minutes |
| Max attempts | 3 |
| Rate limit | 5 OTP requests per 15 min |

## Security Logging

### Log Files

```
logs/
├── security.log    # Security events (auth, rate limits, suspicious)
├── api.log         # API request logs
└── error.log       # Application errors
```

### Logged Events

- `AUTH_SUCCESS` - Successful authentication
- `AUTH_FAILURE` - Failed authentication with reason
- `RATE_LIMIT` - Rate limit exceeded
- `SUSPICIOUS` - Suspicious activity detected
- `TOKEN_BLACKLIST` - Token invalidated

## API Endpoints

### Device Management

```
GET  /api/users/me/devices        # List user's devices
DELETE /api/users/me/devices/:id  # Remove a device
```

### Login History

```
GET /api/users/me/login-history   # Get recent logins
```

### Security Alerts

```
GET  /api/users/me/alerts         # Get security alerts
PATCH /api/users/me/alerts/:id/read # Mark as read
```

### Admin Security Dashboard

```
GET /api/admin/security/statistics     # Security stats
GET /api/admin/security/alerts         # All system alerts
GET /api/admin/security/suspicious     # Suspicious activities
```

## Files Reference

| File | Purpose |
|------|---------|
| `src/services/suspiciousActivity.service.js` | Device tracking, risk scoring, pattern detection |
| `src/services/securityAlert.service.js` | Security alert creation and email notifications |
| `src/middleware/rateLimit.js` | Rate limiting configuration |
| `src/middleware/auth.js` | JWT authentication with blacklist support |
| `src/middleware/apiLogger.js` | Security event logging |
| `src/routes/admin.security.routes.js` | Admin security dashboard APIs |

## Security Standards Compliance

| Standard | Coverage |
|----------|----------|
| OWASP M1 | Improper Credential Usage - MFA, OTP expiry |
| OWASP M3 | Insecure Communication - HTTPS enforced |
| OWASP M4 | Insufficient Input Validation - Rate limiting |
| OWASP M6 | Inadequate Privacy Controls - Secure logging |
| OWASP M8 | Security Misconfiguration - Environment variables |

---

*Last Updated: December 2024*
