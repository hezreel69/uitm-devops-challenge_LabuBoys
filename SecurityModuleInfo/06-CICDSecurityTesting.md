# Module 5: CI/CD Security Testing

## Overview

This module implements DevSecOps practices by integrating security testing into the CI/CD pipeline using GitHub Actions. All security scans run automatically on every push and pull request.

## 🔄 Workflows

### 1. Security Scan (`security-scan.yml`)

**Triggers:** Push to main/develop, PRs, Weekly schedule

| Job | Description |
|-----|-------------|
| **Backend SAST** | ESLint security rules + npm audit |
| **Frontend SAST** | ESLint + TypeScript check + npm audit |
| **Secret Detection** | Gitleaks scans for exposed credentials |
| **Dependency Scan** | Trivy vulnerability scanner |
| **Build Verification** | Ensures both apps compile successfully |

### 2. CodeQL Analysis (`codeql-analysis.yml`)

**Triggers:** Push to main/develop, PRs, Weekly schedule

- Advanced pattern-based security scanning
- Detects common JavaScript/TypeScript vulnerabilities
- Results appear in GitHub Security tab

### 3. Deployment Checks (`deploy-check.yml`)

**Triggers:** Push to main, PRs to main

| Check | Description |
|-------|-------------|
| **Prisma Validation** | Ensures database schema is valid |
| **Environment Check** | Lists required env variables |
| **Production Build** | Tests full production build |
| **Migration Check** | Lists pending database migrations |

---

## 📋 Local Security Commands

### Backend
```bash
cd rentverse-backend

# Run ESLint security check
pnpm lint

# Run dependency vulnerability audit
pnpm security:audit

# Run full security check
pnpm security:check
```

### Frontend
```bash
cd rentverse-frontend

# Run ESLint
pnpm lint

# Run TypeScript check
pnpm type-check

# Run dependency audit
pnpm security:audit

# Run full security check
pnpm security:check
```

---

## 🛡️ Security Scanning Details

### SAST (Static Application Security Testing)

**What it detects:**
- SQL injection vulnerabilities
- Cross-site scripting (XSS)
- Insecure dependencies
- Code quality issues
- Potential security misconfigurations

### Secret Detection (Gitleaks)

**What it detects:**
- API keys
- Passwords
- Private keys
- OAuth tokens
- Database connection strings

### Dependency Scanning (Trivy)

**What it detects:**
- Known CVEs in npm packages
- Outdated dependencies with security issues
- License compliance issues

---

## 📊 Viewing Results

### GitHub Actions Tab
1. Go to your repository on GitHub
2. Click "Actions" tab
3. View workflow runs and their results

### GitHub Security Tab
1. Go to repository → "Security" tab
2. View "Code scanning alerts" for CodeQL results
3. View "Dependabot alerts" for dependency issues

### Workflow Summary
Each workflow generates a summary table showing:
- ✅ Passed checks
- ⚠️ Warnings that need attention
- ❌ Failed checks requiring fixes

---

## 🔧 Configuration

### Environment Variables for CI/CD

Set these secrets in GitHub repository settings:

| Secret | Required For |
|--------|--------------|
| `GITHUB_TOKEN` | Auto-provided by GitHub |
| `DATABASE_URL` | Database connection (if testing) |

### Customizing Scan Severity

In `package.json`, change `--audit-level`:
- `low` - Report all vulnerabilities
- `moderate` - Moderate and above (default)
- `high` - High and critical only
- `critical` - Critical only

---

## 🚨 Handling Security Alerts

### When Vulnerabilities Are Found:

1. **Review the alert** in GitHub Security tab
2. **Check if it's exploitable** in your context
3. **Update the dependency** if possible:
   ```bash
   pnpm update <package-name>
   ```
4. **If no fix available**, document the risk and timeline

### When Secrets Are Detected:

1. **Immediately rotate** the exposed credential
2. **Remove from git history** if necessary
3. **Add to `.gitignore`** if it's a local file

---

## ✅ Best Practices

1. **Never skip** security checks for "quick fixes"
2. **Review alerts promptly** - don't let them accumulate
3. **Keep dependencies updated** - run `pnpm update` regularly
4. **Use environment variables** - never hardcode secrets
5. **Review CodeQL alerts** - they catch subtle issues

---

## 📁 Files Created

```
.github/
└── workflows/
    ├── security-scan.yml      # Main security scanning
    ├── codeql-analysis.yml    # CodeQL advanced analysis
    └── deploy-check.yml       # Pre-deployment verification
```

---

## 🔗 Related Modules

- **Module 1**: Secure Login and MFA (authentication security)
- **Module 2**: Secure API Gateway (rate limiting, input validation)
- **Module 3**: Smart Notification System (security alerts)
- **Module 4**: Activity Log Dashboard (audit trail)

*Last updated: December 2025 By ClaRity*