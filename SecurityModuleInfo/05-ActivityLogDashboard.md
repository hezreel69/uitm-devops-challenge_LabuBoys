# Activity Log Dashboard (Module 4)

## Overview
Admin-level security dashboard providing visibility into login activity, security alerts, and potential threats for accountability and threat visualization.

---

## Features

### 🔒 Admin API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/security/statistics` | Dashboard statistics (24h) |
| `GET /api/admin/security/login-history` | Paginated login attempts |
| `GET /api/admin/security/alerts` | Security alerts list |
| `GET /api/admin/security/users-at-risk` | High-risk users |
| `GET /api/admin/security/user/:id/history` | User security profile |

All endpoints require **ADMIN role**.

---

### 📊 Dashboard Components

| Component | Description |
|-----------|-------------|
| Stats Cards | Logins, failures, locks, alerts, devices (24h) |
| 7-Day Trend | Visual chart of success vs failed logins |
| Login Table | Searchable history with risk scores |
| Alerts Feed | Recent security alerts with type badges |

---

### 📈 Statistics Response

```json
{
  "summary": {
    "totalLogins24h": 150,
    "failedLogins24h": 12,
    "highRiskLogins24h": 3,
    "lockedAccounts": 1,
    "alertsSent24h": 8,
    "newDevices24h": 5,
    "failureRate": 8
  },
  "trends": {
    "daily": [/* 7 days of data */]
  },
  "alertsByType": [
    { "type": "NEW_DEVICE", "count": 5 },
    { "type": "MULTIPLE_FAILURES", "count": 2 }
  ]
}
```

---

## Access

**URL:** `/admin/security`

**Requirements:**
- Must be logged in
- Must have `ADMIN` role

---

## File Structure

```
Backend:
src/routes/admin.security.routes.js

Frontend:
app/admin/security/page.tsx
```

---

*Last updated: December 2025 By ClaRity*
