# Risk Dashboard Implementation Guide

## Overview
This document describes the comprehensive risk calculation system for the RentVerse admin security dashboard.

---

## 1. Risk Calculation Algorithm

### Risk Score Components (0-100 total)

The system calculates a real-time risk score based on five weighted factors:

| Factor | Weight | Max Points | Description |
|--------|--------|------------|-------------|
| **Failed Logins** | 30% | 30 points | Number of failed login attempts in time window |
| **Account Lockouts** | 25% | 25 points | Currently locked user accounts |
| **New Device Logins** | 20% | 20 points | Unique device fingerprints (IP + UserAgent) |
| **Rapid Failed Attempts** | 15% | 15 points | Multiple failures from same IP in 1 hour |
| **Unreviewed Alerts** | 10% | 10 points | Security alerts not yet acknowledged |

### Risk Levels

```javascript
LOW       (0-30):   ✅ Normal operations
MODERATE  (31-60):  ⚠️  Increased monitoring required
HIGH      (61-85):  🔶 Immediate attention needed
CRITICAL  (86-100): 🚨 System under potential attack
```

---

## 2. API Endpoints

### 2.1 Get Risk Analysis
**Endpoint:** `GET /api/admin/security/risk-analysis?timeWindow=24`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalScore": 45,
    "riskLevel": "Moderate",
    "riskColor": "yellow",
    "trend": "increasing",
    "breakdown": {
      "failedLogins": {
        "score": 15,
        "count": 25,
        "weight": "30%"
      },
      "accountLockouts": {
        "score": 12,
        "count": 5,
        "weight": "25%"
      },
      "newDevices": {
        "score": 10,
        "count": 10,
        "weight": "20%"
      },
      "rapidAttacks": {
        "score": 6,
        "maxFromSingleIP": 4,
        "weight": "15%"
      },
      "unreviewedAlerts": {
        "score": 2,
        "count": 3,
        "weight": "10%"
      }
    },
    "recommendations": [
      {
        "priority": "high",
        "action": "Review failed login patterns and consider blocking suspicious IPs",
        "reason": "25 failed logins in the last 24 hours"
      }
    ]
  }
}
```

### 2.2 Get Risky Users
**Endpoint:** `GET /api/admin/security/risky-users?limit=10&timeWindow=24`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user123",
      "email": "suspicious@example.com",
      "name": "John Doe",
      "totalAttempts": 15,
      "failedAttempts": 12,
      "failureRate": 80,
      "isLocked": true,
      "isActive": true,
      "lockedUntil": "2025-01-17T10:30:00Z"
    }
  ]
}
```

### 2.3 Get Flagged Events
**Endpoint:** `GET /api/admin/security/flagged-events?limit=20`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert123",
      "type": "MULTIPLE_FAILURES",
      "severity": "high",
      "user": {
        "id": "user456",
        "email": "user@example.com",
        "name": "Jane Smith"
      },
      "message": "5 failed login attempts detected",
      "metadata": {
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0..."
      },
      "timestamp": "2025-01-17T09:15:00Z",
      "read": false
    }
  ]
}
```

### 2.4 Auto-Respond to Event
**Endpoint:** `POST /api/admin/security/auto-respond/:eventId`

**Response:**
```json
{
  "success": true,
  "message": "Auto-response executed",
  "data": {
    "alertId": "alert123",
    "alertType": "MULTIPLE_FAILURES",
    "responses": [
      {
        "action": "ip_flagged",
        "message": "IP 192.168.1.100 flagged for review (12 failures)",
        "recommendation": "Consider blocking this IP address"
      }
    ],
    "autoRespondedAt": "2025-01-17T09:30:00Z"
  }
}
```

---

## 3. Auto-Response Logic

The system automatically responds to flagged events based on alert type:

### Account Locked
- ✉️ Send notification email to user
- 📝 Log event for audit trail

### Multiple Failures
- 🚫 Flag IP if >10 failures in 1 hour
- 💡 Recommend IP blocking to admin
- 📧 Alert security team

### New Device Login
- 📧 Notify user via email
- 🔒 Require additional verification (if configured)
- 📝 Log device fingerprint

### Default
- 📝 Log for manual admin review
- ✅ Mark as acknowledged

---

## 4. Dashboard UI Components

### 4.1 Risk Score Widget
```tsx
<RiskScoreWidget>
  <CircularGauge value={45} max={100} color="yellow" />
  <RiskLevel>Moderate</RiskLevel>
  <Trend direction="increasing">↗ +15% from yesterday</Trend>
</RiskScoreWidget>
```

### 4.2 Breakdown Chart
```tsx
<BreakdownChart>
  <BarChart>
    - Failed Logins: 15/30 pts
    - Account Lockouts: 12/25 pts
    - New Devices: 10/20 pts
    - Rapid Attacks: 6/15 pts
    - Unreviewed Alerts: 2/10 pts
  </BarChart>
</BreakdownChart>
```

### 4.3 Recommendations Panel
```tsx
<RecommendationsPanel>
  {recommendations.map(rec => (
    <RecommendationCard
      priority={rec.priority}
      action={rec.action}
      reason={rec.reason}
    />
  ))}
</RecommendationsPanel>
```

### 4.4 Risky Users Table
```tsx
<RiskyUsersTable>
  <Columns>
    - Email
    - Failed Attempts
    - Failure Rate (%)
    - Status (Locked/Active)
    - Actions
  </Columns>
</RiskyUsersTable>
```

### 4.5 Flagged Events Feed
```tsx
<FlaggedEventsFeed>
  {events.map(event => (
    <EventCard
      type={event.type}
      severity={event.severity}
      user={event.user}
      timestamp={event.timestamp}
      onAutoRespond={() => handleAutoRespond(event.id)}
    />
  ))}
</FlaggedEventsFeed>
```

---

## 5. Usage Example

```javascript
// Fetch risk analysis every 30 seconds
useEffect(() => {
  const fetchRiskData = async () => {
    const response = await fetch('/api/admin/security/risk-analysis?timeWindow=24')
    const { data } = await response.json()
    
    setRiskScore(data.totalScore)
    setRiskLevel(data.riskLevel)
    setRecommendations(data.recommendations)
  }
  
  fetchRiskData()
  const interval = setInterval(fetchRiskData, 30000)
  return () => clearInterval(interval)
}, [])

// Auto-respond to flagged event
const handleAutoRespond = async (eventId) => {
  const response = await fetch(`/api/admin/security/auto-respond/${eventId}`, {
    method: 'POST'
  })
  const { data } = await response.json()
  
  toast.success(`Auto-response executed: ${data.responses[0].message}`)
  refreshFlaggedEvents()
}
```

---

## 6. Threshold Configuration

Adjust these values in `riskCalculation.service.js` to tune sensitivity:

```javascript
// Failed logins: 50+ = max score (30 points)
const failedLoginScore = Math.min(30, (failedLogins / 50) * 30)

// Locked accounts: 10+ = max score (25 points)
const lockoutScore = Math.min(25, (lockedAccounts / 10) * 25)

// New devices: 20+ = max score (20 points)
const newDeviceScore = Math.min(20, (deviceFingerprints.size / 20) * 20)

// Rapid attacks: 10+ from one IP = max score (15 points)
const rapidAttackScore = Math.min(15, (maxIpFailures / 10) * 15)

// Unread alerts: 15+ = max score (10 points)
const alertScore = Math.min(10, (unreviewedAlerts / 15) * 10)
```

---

## 7. Integration Checklist

- [x] Create `riskCalculation.service.js`
- [x] Add API endpoints to `admin.security.routes.js`
- [ ] Create frontend dashboard components
- [ ] Add real-time polling (30s interval)
- [ ] Implement risk score gauge visualization
- [ ] Add recommendations UI
- [ ] Create risky users table
- [ ] Build flagged events feed
- [ ] Add auto-respond buttons
- [ ] Implement toast notifications for responses
- [ ] Add loading/error states
- [ ] Test with various risk scenarios

---

## 8. Testing Scenarios

### Low Risk (Score: 15)
- 5 failed logins
- 0 locked accounts
- 2 new devices
- 1 unread alert

### Moderate Risk (Score: 45)
- 25 failed logins
- 5 locked accounts
- 10 new devices
- 3 unread alerts

### High Risk (Score: 75)
- 45 failed logins
- 8 locked accounts
- 18 new devices
- 8 rapid attacks from same IP
- 12 unread alerts

### Critical Risk (Score: 95)
- 60+ failed logins
- 12+ locked accounts
- 25+ new devices
- 15+ rapid attacks
- 20+ unread alerts

---

## 9. Next Steps

1. **Frontend Implementation:**
   - Create `app/admin/security/risk-dashboard/page.tsx`
   - Build risk score gauge component
   - Implement real-time data fetching
   - Add auto-response buttons

2. **Notifications:**
   - Email admins when risk exceeds HIGH
   - Browser notifications for CRITICAL events
   - Slack/Discord webhook integration

3. **Advanced Features:**
   - IP geolocation mapping
   - Anomaly detection with ML
   - Customizable risk thresholds
   - Historical risk trends (7-day, 30-day)

---

## 10. Security Considerations

- ✅ All endpoints require ADMIN role
- ✅ Rate limiting on auto-response actions
- ✅ Audit log for all risk calculations
- ✅ Sensitive data (passwords, tokens) never included
- ✅ IP addresses can be anonymized (GDPR compliance)

---

**Status:** Backend implementation complete ✅  
**Next:** Frontend dashboard UI  
**Last Updated:** 2025-01-17
