<div align="center">
  <table>
    <tr>
      <td align="center" width="200">
        <img src="github/assets/uitm.png" width="100" height="100"><br>
        <b>UiTM Tapah</b>
      </td>
      <td align="center" width="200">
        <img src="github/assets/logo.png" width="120" height="120"><br>
        <i>Building the Future Through Innovation</i>
      </td>
      <td align="center" width="200">
        <img src="github/assets/ClaRityLogo.png" width="100" height="100"><br>
        <b>ClaRity</b>
      </td>
    </tr>
  </table>
</div>

<h1 align="center">🏠 RentVerse by ClaRity</h1>
<p align="center"><i>A Secure Property Rental Platform with DevSecOps Integration</i></p>

---

## 👥 Team Members

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="https://github.com/Nomics03">
          <img src="https://github.com/Nomics03.png" width="100" height="100" style="border-radius: 50%"><br>
          <b>Muhammad 'Adli Bin Mohd Ali</b>
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/YoRzHe-HotaaRu">
          <img src="https://github.com/YoRzHe-HotaaRu.png" width="100" height="100" style="border-radius: 50%"><br>
          <b>Amir Hafizi Bin Musa</b>
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/dev-manchae">
          <img src="https://github.com/dev-manchae.png" width="100" height="100" style="border-radius: 50%"><br>
          <b>Nik Muhammad Haziq bin Nik Hasni</b>
        </a>
      </td>
    </tr>
  </table>
</div>

---

## 🔗 Quick Links

| Platform | Link |
|----------|------|
| 🌐 **Live Website** | [https://rentverse-frontend-nine.vercel.app/](https://rentverse-frontend-nine.vercel.app/) |
| 📱 **Mobile App (APK)** | [Download RentVerse APK](MobileAppBuild/rentverse-clarity.apk) |

---

## 📸 Platform Preview

### Web Application
<!-- PLACEHOLDER: Add screenshot of web application here -->
![Web Application](github/assets/web-preview.png)

### Mobile Application
<!-- PLACEHOLDER: Add screenshot of mobile application here -->
![Mobile Application](github/assets/mobile-preview.png)

---

# 🛡️ Core Development Modules

## Module 1: Secure Login & MFA

**Description:** Create MFA/OTP-based login with role-based access.

**Security Focus:** Authentication & Authorization (OWASP M1–M3)

<!-- PLACEHOLDER: Add screenshot of login/MFA flow here -->
![MFA Login Flow](github/assets/module1-mfa.png)

### Implementation Details

#### 🔐 Multi-Factor Authentication (MFA/OTP)
- **OTP Generation**: Cryptographically secure 6-digit OTP codes using `crypto.randomBytes()`
- **OTP Hashing**: OTPs are stored hashed using bcrypt for secure storage
- **Expiry**: OTPs expire after 5 minutes
- **Rate Limiting**: Maximum 5 OTP verification attempts to prevent brute force

**Key Files:**
- `src/services/otp.service.js` - OTP generation, verification, and management
- `src/services/email.service.js` - OTP email delivery with styled templates

```javascript
// OTP Generation (Cryptographically Secure)
generateOtpCode() {
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    return (randomNumber % 1000000).toString().padStart(6, '0');
}
```

#### 👤 Role-Based Access Control (RBAC)
- **Roles**: `USER` (tenant), `ADMIN` (administrator)
- **Middleware**: `authorize()` middleware enforces role-based access
- **Logging**: Unauthorized access attempts are logged to security logs

**Key Files:**
- `src/middleware/auth.js` - JWT authentication and role authorization

```javascript
// Role Authorization Middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            securityLogger.logSuspiciousActivity(req, 'Unauthorized access attempt');
            return res.status(403).json({ message: 'Insufficient permissions.' });
        }
        next();
    };
};
```

#### 🔑 OAuth Integration
- **Google OAuth**: Full integration with Google Sign-In
- **Deep Linking**: Mobile app support via custom URL scheme (`rentverseclarity://`)
- **Security Alerts**: Email notifications sent for OAuth logins

#### 🚫 Account Lockout
- **Max Attempts**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **Notification**: Account lock alerts sent via email

---

## Module 2: Secure API Gateway

**Description:** Apply HTTPS, JWT tokens, rate-limiting, and access validation.

**Security Focus:** Secure Communication (OWASP M5–M6)

<!-- PLACEHOLDER: Add screenshot of API security here -->
![API Gateway Security](github/assets/module2-api.png)

### Implementation Details

#### 🔒 JWT Authentication
- **Token Blacklist**: Tokens can be invalidated on logout
- **Token Expiry**: Configurable expiration (default: 7 days)
- **Secure Headers**: Authorization header validation

**Key Files:**
- `src/middleware/auth.js` - JWT verification with blacklist support
- `src/services/tokenBlacklist.js` - Token invalidation management

```javascript
// JWT Verification with Blacklist Check
if (isBlacklisted(token)) {
    return res.status(401).json({ message: 'Token has been revoked.' });
}
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

#### ⏱️ Rate Limiting
| Limiter Type | Limit | Window | Purpose |
|--------------|-------|--------|---------|
| Global | 100 requests | 15 min | DDoS prevention |
| Auth | 5 attempts | 15 min | Brute force prevention |
| OTP | 5 attempts | 5 min | OTP abuse prevention |
| Strict | 3 requests | 1 min | Sensitive operations |
| API | 2000 requests | 15 min | General API protection |

**Key Files:**
- `src/middleware/rateLimit.js` - Multiple rate limiters for different endpoints

#### 🛡️ Security Middleware Stack
- **Helmet.js**: Security headers (XSS, CSP, HSTS)
- **CORS**: Configurable cross-origin resource sharing
- **XSS Protection**: Request sanitization via `xss` library
- **SQL Injection Detection**: Pattern-based detection and logging

**Key Files:**
- `src/middleware/requestValidator.js` - XSS sanitization and injection detection
- `src/app.js` - Security middleware configuration

---

## Module 3: Digital Agreement

**Description:** Add secure signature validation and access permissions.

**Security Focus:** Data Integrity & Workflow Validation

<!-- PLACEHOLDER: Add screenshot of digital agreement here -->
![Digital Agreement](github/assets/module3-agreement.png)

### Implementation Details

#### ✍️ Digital Signature System
- **SHA-256 Hashing**: Signatures are hashed with timestamp and user info
- **IP Address Logging**: Signer's IP address recorded for audit
- **Tamper Detection**: Hash verification for document integrity

**Key Files:**
- `src/services/digitalAgreement.service.js` - Signature creation and verification

```javascript
// Signature Hash Creation
createSignatureHash(signature, timestamp, leaseId, userId) {
    const data = `${signature}|${timestamp}|${leaseId}|${userId}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}
```

#### 📋 Workflow States
| Status | Description |
|--------|-------------|
| `DRAFT` | Agreement created, not yet initiated |
| `PENDING_LANDLORD` | Waiting for landlord signature |
| `PENDING_TENANT` | Landlord signed, awaiting tenant |
| `COMPLETED` | Both parties signed |
| `EXPIRED` | Signing deadline passed |
| `CANCELLED` | Agreement cancelled |

#### 📝 Audit Trail
- **Full Audit Logging**: Every action logged to `agreement_audit_logs`
- **Actions Tracked**: CREATED, VIEWED, SIGNED, CANCELLED, DOWNLOADED, etc.
- **Metadata**: IP address, timestamp, and performer recorded

**Key Files:**
- `src/routes/agreement.routes.js` - Agreement signing endpoints
- Prisma model: `AgreementAuditLog`

---

## Module 4: Smart Notification & Alert System

**Description:** Log user activities and alert suspicious login patterns.

**Security Focus:** DevSecOps Monitoring & Incident Detection

<!-- PLACEHOLDER: Add screenshot of notification system here -->
![Smart Notifications](github/assets/module4-alerts.png)

### Implementation Details

#### 🚨 Security Alert Types
| Alert Type | Trigger | Email Sent |
|------------|---------|------------|
| `NEW_DEVICE` | Login from unrecognized device | ✅ Yes |
| `MULTIPLE_FAILURES` | 3+ failed logins in 5 minutes | ✅ Yes |
| `ACCOUNT_LOCKED` | Account locked after max attempts | ✅ Yes |
| `SUSPICIOUS_TIMING` | Login between 2-5 AM | ❌ No |
| `PASSWORD_CHANGED` | Password update | ✅ Yes |

**Key Files:**
- `src/services/securityAlert.service.js` - Alert creation and email dispatch

```javascript
// New Device Alert
async function alertNewDevice(userId, deviceInfo) {
    return createAlert({
        userId,
        type: 'NEW_DEVICE',
        title: 'New Device Login Detected',
        message: `A new device was used: ${deviceInfo.browser} on ${deviceInfo.os}`,
        sendEmail: true,
    });
}
```

#### 📊 Risk Scoring
- **New Device**: +30 points
- **Recent Failures**: +10 per failure (max 30)
- **Unusual Time**: +15 points
- **Suspicious IP**: +25 points (5+ failures from same IP)

**Key Files:**
- `src/services/suspiciousActivity.service.js` - Risk calculation and pattern detection

#### 📧 Email Notifications
- **OAuth Login Alerts**: Security alerts with red styling for Google/OAuth logins
- **OTP Delivery**: Styled OTP emails with countdown timer
- **MFA Status Changes**: Notifications when MFA is enabled/disabled

---

## Module 5: Activity Log Dashboard

**Description:** Provide admin-level logs for failed logins and critical actions.

**Security Focus:** Threat Visualization & Accountability

<!-- PLACEHOLDER: Add screenshot of security dashboard here -->
![Activity Log Dashboard](github/assets/module5-dashboard.png)

### Implementation Details

#### 📈 Dashboard Statistics
- **24h Login Metrics**: Total, successful, failed logins
- **OAuth vs Email**: Breakdown of login methods
- **High Risk Logins**: Logins with risk score ≥50
- **Locked Accounts**: Currently locked user accounts
- **7-Day Trends**: Daily login success/failure charts

**Key Files:**
- `src/routes/admin.security.routes.js` - Admin security API endpoints

```javascript
// Statistics Endpoint
GET /api/admin/security/statistics
Response: {
    totalLogins24h, failedLogins24h, successfulLogins24h,
    highRiskLogins24h, alertsSent24h, newDevices24h,
    oauthLogins24h, emailLogins24h, lockedAccounts,
    failureRate, trends: { daily: [...] }
}
```

#### 📋 Login History
- **Paginated View**: Browse all login attempts
- **Filters**: By success/failure, high risk, user
- **Details**: IP address, device type, browser, OS, risk score

#### 🔍 User Investigation
- **Per-User History**: View specific user's login activity
- **Device Management**: See registered devices per user
- **Alert History**: User's security alerts

---

## Module 6: CI/CD Security Testing (Bonus)

**Description:** Integrate GitHub Actions for static code analysis (SAST) and deployment checks.

**Security Focus:** Continuous Testing (DevSecOps)

<!-- PLACEHOLDER: Add screenshot of CI/CD workflow here -->
![CI/CD Security](github/assets/module6-cicd.png)

### Implementation Details

#### 🔬 Static Application Security Testing (SAST)
- **ESLint Security Scan**: Code quality and security linting
- **TypeScript Check**: Type safety verification
- **npm Audit**: Critical vulnerability detection

**Workflow File:** `.github/workflows/security-scan.yml`

#### 🔍 CodeQL Analysis
- **Language**: JavaScript/TypeScript
- **Queries**: `security-extended`, `security-and-quality`
- **Schedule**: Weekly on Mondays + on every push/PR
- **SARIF Upload**: Results uploaded to GitHub Security tab

**Workflow File:** `.github/workflows/codeql-analysis.yml`

#### 🕵️ Secret Detection
- **Tool**: Gitleaks
- **Scope**: Full repository history scan
- **Trigger**: Every push and pull request

#### 📦 Dependency Vulnerability Scan
- **Tool**: Trivy
- **Severity**: CRITICAL and HIGH
- **Scope**: Filesystem scan of all dependencies

#### 🏗️ Build Verification
- **Backend**: Prisma generation + syntax check
- **Frontend**: Next.js build verification

#### 📊 Security Summary
After each scan, a summary is generated:

| Check | Status |
|-------|--------|
| Backend SAST | ✅ Completed |
| Frontend SAST | ✅ Completed |
| Secret Detection | ✅ Completed |
| Dependency Scan | ✅ Completed |
| CodeQL Analysis | ✅ Completed |

---

## 🚀 Feature Innovation Pool

Additional advanced security features implemented beyond core modules.

---

### Category 1: Threat Intelligence System

**Description**: A rule-based module that detects unusual access patterns, repeated failed logins, and potential intrusion attempts through intelligent pattern analysis.

**Screenshot Placeholder**:
![Threat Intelligence](github/assets/innovation-threat-intel.png)

#### Implementation Details

**Risk Score Calculation** ([suspiciousActivity.service.js](rentverse-backend/src/services/suspiciousActivity.service.js)):
```javascript
// Dynamic risk scoring based on multiple factors
async function calculateRiskScore(userId, ipAddress, userAgent) {
    let riskScore = 0;
    
    // New device detection (+30 points)
    const deviceHash = generateDeviceHash(userAgent, ipAddress);
    const knownDevice = await prisma.userDevice.findFirst({
        where: { userId, deviceHash },
    });
    if (!knownDevice) riskScore += 30;
    
    // IP failure history (+25 points if >5 failures)
    const ipFailures = await prisma.loginHistory.count({
        where: {
            ipAddress,
            success: false,
            createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
    });
    if (ipFailures > 5) riskScore += 25;
    
    return Math.min(riskScore, 100);
}
```

**Suspicious Pattern Detection**:
| Pattern Type | Detection Criteria | Severity |
|--------------|-------------------|----------|
| Multiple Failures | 3+ failures in 5 minutes | High |
| Geographic Anomaly | Logins from 3+ IPs in 1 hour | Medium |
| Unusual Timing | Logins between 2-5 AM | Low |
| Brute Force | 5 failed attempts → account lock | Critical |

**Key Files**:
- `suspiciousActivity.service.js` - Pattern detection & risk scoring
- `otp.service.js` - Failed attempt tracking & account lockout
- `apiLogger.js` - Security event logging

---

### Category 2: Zero-Trust Access Logic

**Description**: Implements conditional access controls including device verification, automatic token invalidation, and comprehensive session management.

**Screenshot Placeholder**:
![Zero-Trust Access](github/assets/innovation-zero-trust.png)

#### Implementation Details

**Device Fingerprinting & Tracking** ([suspiciousActivity.service.js](rentverse-backend/src/services/suspiciousActivity.service.js)):
```javascript
// Generate unique device hash from user agent + IP
function generateDeviceHash(userAgent, ipAddress) {
    const data = `${userAgent || 'unknown'}-${ipAddress || 'unknown'}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// Register and track devices per user
async function checkDevice(userId, userAgent, ipAddress) {
    const deviceHash = generateDeviceHash(userAgent, ipAddress);
    
    const existingDevice = await prisma.userDevice.findFirst({
        where: { userId, deviceHash },
    });
    
    if (!existingDevice) {
        // Alert user about new device login
        return { isNew: true, device: await registerNewDevice() };
    }
    return { isNew: false, device: existingDevice };
}
```

**Token Blacklist System** ([tokenBlacklist.js](rentverse-backend/src/services/tokenBlacklist.js)):
- Immediate token invalidation on logout
- Automatic cleanup of expired tokens every hour
- User-wide token revocation capability
- Statistics tracking for security monitoring

**Zero-Trust Features**:
| Feature | Implementation | OWASP Alignment |
|---------|---------------|-----------------|
| New Device Alerts | Email + Security Alert | M1, M3 |
| Token Blacklisting | In-memory with cleanup | M6 |
| Session Validation | JWT expiry + blacklist check | M1 |
| User-Agent Tracking | SHA-256 fingerprinting | M3 |

---

### Category 3: Adaptive Defense Dashboard

**Description**: An interactive admin dashboard that visualizes system risk levels and auto-responds to flagged security events with automated countermeasures.

**Screenshot Placeholder**:
![Adaptive Defense Dashboard](github/assets/innovation-adaptive-dashboard.png)

#### Implementation Details

**Security Statistics API** ([admin.security.routes.js](rentverse-backend/src/routes/admin.security.routes.js)):
```javascript
// Real-time security metrics
const statistics = {
    totalLogins24h,
    failedLogins24h,
    successfulLogins24h,
    highRiskLogins24h,      // Risk score >= 50
    alertsSent24h,
    newDevices24h,
    uniqueUsers24h,
    lockedAccounts,         // Currently locked
    oauthLogins24h,         // Google, Facebook, etc.
    emailLogins24h,
    failureRate: Math.round((failedLogins24h / totalLogins24h) * 100),
};
```

**Auto-Response Mechanisms**:
| Trigger | Automatic Response | Notification |
|---------|-------------------|--------------|
| 5 Failed Logins | Account locked 15 min | Email + Alert |
| High Risk Login | Security alert created | Email |
| New Device | Device registered + alert | Email |
| Multiple IPs | Suspicious activity flag | Dashboard |

**Users at Risk Tracking**:
```javascript
// Identify high-risk users automatically
const usersWithHighRisk = await prisma.loginHistory.groupBy({
    by: ['userId'],
    where: {
        createdAt: { gte: last24h },
        riskScore: { gte: 50 },
    },
    _count: true,
});
```

**Dashboard Features**:
- 7-day login trend visualization
- Alert type distribution charts
- Top 20 at-risk users list
- User investigation with full history
- One-click account unlock capability

---

### Category 4: Automated Security Testing

**Description**: Integrated security scanning tools in the CI/CD pipeline that run automatically before each deployment to catch vulnerabilities early.

**Screenshot Placeholder**:
![Automated Security Testing](github/assets/innovation-security-testing.png)

#### Implementation Details

**GitHub Actions Security Workflow** ([.github/workflows/security-scan.yml](.github/workflows/security-scan.yml)):

| Tool | Purpose | Integration |
|------|---------|-------------|
| **ESLint** | Static code analysis | Every PR/push |
| **TypeScript** | Type safety verification | Every PR/push |
| **npm audit** | Dependency vulnerabilities | Every PR/push |
| **CodeQL** | Advanced security analysis | Every PR/push |
| **Gitleaks** | Secret detection | Every PR/push |
| **Trivy** | Container/dependency scan | Every PR/push |

**Pipeline Configuration**:
```yaml
# Security scanning on every push
jobs:
  backend-sast:
    - npm audit --audit-level=moderate
    - npx eslint src/ --max-warnings 0
    
  secret-detection:
    - gitleaks detect --source . --verbose
    
  dependency-scan:
    - trivy fs . --severity HIGH,CRITICAL
    
  codeql-analysis:
    - github/codeql-action/analyze
```

**Security Gates**:
- ❌ Build fails on HIGH/CRITICAL vulnerabilities
- ❌ Build fails on detected secrets
- ❌ Build fails on critical ESLint errors
- ✅ Security report generated for each run

**Current Pipeline Status**:
| Check | Status |
|-------|--------|
| Backend SAST | ✅ Active |
| Frontend SAST | ✅ Active |
| Secret Detection | ✅ Active |
| Dependency Scan | ✅ Active |
| CodeQL Analysis | ✅ Active |

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, Passport.js (OAuth)
- **Email**: Nodemailer / Resend

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Maps**: MapTiler SDK

### Mobile
- **Framework**: Capacitor
- **Platform**: Android (APK)
- **Deep Linking**: Custom URL scheme

### DevSecOps
- **CI/CD**: GitHub Actions
- **SAST**: ESLint, CodeQL
- **Secret Scan**: Gitleaks
- **Dependency Scan**: Trivy
- **Hosting**: Vercel (Frontend), Render (Backend)

---

## 📚 API Documentation

Interactive API documentation available at:
- **Swagger UI**: `/docs` endpoint on the backend

---

<div align="center">
  <p><i>Built with ❤️ by Team ClaRity for UiTM DevOps Challenge</i></p>
  <p>© 2025 RentVerse. All rights reserved.</p>
</div>
