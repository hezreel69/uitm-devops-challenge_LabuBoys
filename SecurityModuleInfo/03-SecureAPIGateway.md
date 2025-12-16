# Secure API Gateway (Module 2)

## Overview
This module implements a secure API gateway layer with HTTPS support, JWT token security, rate-limiting, and access validation according to OWASP M5–M6 guidelines.

---

## Security Features Implemented

### 1. Rate Limiting

| Limiter | Limit | Window | Purpose |
|---------|-------|--------|---------|
| Global | 100 requests | 15 minutes | General API protection |
| Auth | 5 requests | 15 minutes | Brute force prevention |
| Strict | 3 requests | 1 minute | Password reset, MFA |
| API | 1000 requests | 1 hour | Authenticated users |
| OTP | 5 attempts | 5 minutes | OTP verification |
| Registration | 5 accounts | 15 minutes | Account spam prevention |

**Response on Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "You have exceeded the request limit. Please try again later.",
  "retryAfter": "15 minutes"
}
```

### 2. JWT Token Security

- **Token Blacklisting:** Logout invalidates tokens immediately
- **Expiration Validation:** Expired tokens are rejected with `TOKEN_EXPIRED` code
- **Refresh Support:** Optional auth middleware for token refresh flows

**Logout Endpoint:**
```
POST /api/auth/logout
Authorization: Bearer <token>
```

### 3. Request Validation

- **XSS Prevention:** All inputs sanitized via `xss` library
- **SQL Injection Detection:** Suspicious patterns logged (warning mode)
- **Request Size Limiting:** Max 10KB body size
- **Input Sanitization:** Applied to body, query, and params

### 4. Security Headers (Helmet)

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | Self + specific sources | XSS prevention |
| Strict-Transport-Security | max-age=31536000 | Force HTTPS |
| X-Content-Type-Options | nosniff | MIME sniffing prevention |
| X-Frame-Options | DENY | Clickjacking prevention |
| Referrer-Policy | strict-origin-when-cross-origin | Privacy |
| X-XSS-Protection | 1; mode=block | Legacy XSS filter |

### 5. API Logging & Audit

**Log Files:**
- `logs/access.log` - All API requests
- `logs/security.log` - Security events

**Security Events Logged to `security.log`:**

| Event Type | Trigger | Details Logged |
|------------|---------|----------------|
| AUTH_FAILURE | User not found | IP, email, reason |
| AUTH_FAILURE | Account inactive | IP, email, reason |
| AUTH_FAILURE | Account locked | IP, email, remaining time |
| AUTH_FAILURE | Wrong password | IP, email, attempts remaining |
| AUTH_SUCCESS | Successful login | IP, user ID |
| AUTH_SUCCESS | MFA verification passed | IP, user ID |
| MFA_EVENT | OTP verification failed | IP, user ID, success=false |
| MFA_EVENT | OTP verification passed | IP, user ID, success=true |
| TOKEN_BLACKLISTED | User logout | IP, user ID, reason |
| SUSPICIOUS | Unauthorized role access | IP, required roles, user role |

**Example security.log entry:**
```json
{
  "type": "AUTH_FAILURE",
  "ip": "::1",
  "path": "/api/auth/login",
  "email": "user@example.com",
  "reason": "Wrong password (2 attempts remaining)",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-12-12T17:16:15.168Z"
}
```

---

## File Structure

```
src/
├── middleware/
│   ├── rateLimit.js      # Rate limiting middleware
│   ├── requestValidator.js # XSS/SQL injection prevention
│   ├── apiLogger.js      # Access & security logging
│   └── auth.js           # Enhanced JWT auth with blacklist
├── services/
│   └── tokenBlacklist.js # Token invalidation service
└── app.js                # Enhanced Helmet configuration
```

---

## OWASP Compliance

### M5: Insecure Communication
- ✅ HSTS headers enforce HTTPS
- ✅ Secure cookie settings
- ✅ CSP headers prevent data leakage

### M6: Poor Authorization
- ✅ JWT token validation
- ✅ Token blacklisting on logout
- ✅ Role-based access control
- ✅ Rate limiting prevents abuse
- ✅ Security event logging

---

## Testing

### Test Rate Limiting
```bash
# Test auth rate limit (5 requests max)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

### Test Security Headers
```bash
curl -I http://localhost:3000/health
```

Expected headers:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```

### Test Token Blacklisting
```bash
# Login to get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login ... | jq -r '.data.token')

# Logout (blacklists token)
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Try to use blacklisted token (should fail)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
# Returns: {"success":false,"message":"Access denied. Token has been invalidated."}
```

---

## Configuration

No additional environment variables required. All features use sensible defaults.

Optional customization in `middleware/rateLimit.js`:
- Adjust rate limits per endpoint
- Configure different limits for production vs development

---



LOG FILES
Ways to View Them:
1. From VS Code: Just navigate to:

\uitm-devops-challenge-clarity\rentverse-backend\logs\
2. From Terminal:

# View access log
Get-Content "\uitm-devops-challenge-clarity\rentverse-backend\logs\access.log"
# View security log  
Get-Content "\uitm-devops-challenge-clarity\rentverse-backend\logs\security.log"
# Live tail (watch new entries):
Get-Content "\uitm-devops-challenge-clarity\rentverse-backend\logs\security.log" -Wait -Tail 20
Note: The logs folder and files are created automatically when the first log entry is written (e.g., when someone makes an API request or a security event occurs). If the folder doesn't exist yet, make some API requests to the backend first!


*Last updated: December 2025 By ClaRity*
