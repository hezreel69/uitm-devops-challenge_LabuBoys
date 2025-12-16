# Adaptive Defense Dashboard - Risk Analysis

## Table of Contents
- [Overview](#overview)
- [Risk Analysis Engine](#risk-analysis-engine)
- [Threat Detection](#threat-detection)
- [Dashboard Visualization](#dashboard-visualization)
- [Security Metrics](#security-metrics)
- [API Endpoints](#api-endpoints)
- [Code Examples](#code-examples)
- [Alert System](#alert-system)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Adaptive Defense Dashboard provides real-time security monitoring and risk analysis with:

- **Risk Score Calculation** for users and actions
- **Anomaly Detection** for suspicious behavior
- **Threat Intelligence** integration
- **Real-time Security Monitoring**
- **Automated Response** to threats
- **Security Metrics Visualization**
- **Compliance Reporting**
- **Incident Response Workflow**

## Risk Analysis Engine

### Risk Scoring Model

The system calculates risk scores based on multiple factors:

```
Total Risk Score = (
  Authentication Risk × 0.30 +
  Behavioral Risk × 0.25 +
  Network Risk × 0.20 +
  Device Risk × 0.15 +
  Temporal Risk × 0.10
)
```

### Risk Factors

#### 1. Authentication Risk (30%)

| Factor | Weight | Description |
|--------|--------|-------------|
| Failed Login Attempts | 40% | Multiple failed attempts indicate brute force |
| MFA Status | 30% | No MFA enabled increases risk |
| Password Age | 20% | Old passwords are vulnerable |
| Account Age | 10% | New accounts may be malicious |

**Calculation:**
```javascript
authRisk = (
  (failedAttempts / 10) * 0.4 +
  (mfaEnabled ? 0 : 1) * 0.3 +
  (passwordAge / 365) * 0.2 +
  (accountAge < 7 ? 1 : 0) * 0.1
) * 100
```

#### 2. Behavioral Risk (25%)

| Factor | Weight | Description |
|--------|--------|-------------|
| Unusual Activity Pattern | 40% | Activity outside normal hours |
| Rapid Actions | 30% | Many actions in short time |
| High-Risk Operations | 20% | Sensitive operations performed |
| Data Access Pattern | 10% | Accessing unusual data |

#### 3. Network Risk (20%)

| Factor | Weight | Description |
|--------|--------|-------------|
| Unknown IP Address | 40% | IP never seen before |
| Geo-Location Change | 30% | Login from different country |
| VPN/Proxy Usage | 20% | Using anonymization |
| Blacklisted IP | 10% | IP on threat list |

#### 4. Device Risk (15%)

| Factor | Weight | Description |
|--------|--------|-------------|
| Unknown Device | 50% | Never used device |
| Outdated Browser | 30% | Security vulnerabilities |
| Missing Security Features | 20% | No antivirus/firewall |

#### 5. Temporal Risk (10%)

| Factor | Weight | Description |
|--------|--------|-------------|
| Off-Hours Access | 60% | Access during unusual times |
| Rapid Session Changes | 40% | Multiple sessions quickly |

### Risk Levels

| Score | Level | Color | Action |
|-------|-------|-------|--------|
| 0-25 | Low | Green | Monitor |
| 26-50 | Medium | Yellow | Alert admin |
| 51-75 | High | Orange | Require MFA verification |
| 76-100 | Critical | Red | Block and investigate |

## Threat Detection

### Detection Patterns

#### 1. Brute Force Attack

```javascript
Pattern:
- 5+ failed login attempts within 15 minutes
- From same IP address
- Against single or multiple accounts

Response:
- Temporary IP block (30 minutes)
- CAPTCHA requirement
- Email alert to user
```

#### 2. Credential Stuffing

```javascript
Pattern:
- Multiple login attempts
- Different usernames
- Same IP address
- Within short timeframe

Response:
- Rate limiting
- IP blacklist
- Admin notification
```

#### 3. Account Takeover

```javascript
Pattern:
- Successful login from new location
- Password change immediately after login
- Profile modification
- Unusual data access

Response:
- Force logout all sessions
- Require password reset
- Email verification
- Admin review
```

#### 4. Data Exfiltration

```javascript
Pattern:
- Bulk data downloads
- API calls exceeding normal rate
- Access to multiple sensitive resources
- Large file downloads

Response:
- Throttle requests
- Temporary account suspension
- Security team alert
- Log detailed audit trail
```

#### 5. Privilege Escalation

```javascript
Pattern:
- Attempting to access admin endpoints
- Role modification attempts
- Unauthorized resource access

Response:
- Block request
- Log incident
- Immediate admin alert
- Account review
```

## Dashboard Visualization

### Security Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Adaptive Defense Dashboard              [Last 24 Hours]    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Threats  │  │  Risk    │  │ Blocked  │  │ Active   │    │
│  │ Detected │  │  Score   │  │   IPs    │  │ Sessions │    │
│  │    12    │  │   Medium │  │    5     │  │   234    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Threat Map (Geographic Distribution)                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │                                                    │     │
│  │     🌍 World Map with threat indicators           │     │
│  │                                                    │     │
│  └────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  Real-Time Threat Feed                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 🔴 CRITICAL: Brute force from 192.168.1.100       │     │
│  │ 🟠 HIGH: Unusual login location (China)           │     │
│  │ 🟡 MEDIUM: Multiple failed MFA attempts           │     │
│  │ 🟢 LOW: New device login (verified)               │     │
│  └────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  Risk Score Trend (Last 7 Days)                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │    📈 Line chart showing risk over time           │     │
│  └────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  Top Threats                                                │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 1. Brute Force Attempts: 45                        │     │
│  │ 2. Suspicious IPs: 23                              │     │
│  │ 3. Failed MFA: 12                                  │     │
│  │ 4. Unusual Geo-locations: 8                        │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Security Metrics

### Key Performance Indicators

1. **Threat Detection Rate**
   - Number of threats detected per day
   - False positive rate
   - Response time

2. **Account Security**
   - MFA adoption rate
   - Password strength score
   - Failed login attempts

3. **Network Security**
   - Blocked IPs
   - Suspicious locations
   - VPN/Proxy usage

4. **Incident Response**
   - Mean time to detect (MTTD)
   - Mean time to respond (MTTR)
   - Incident resolution rate

## API Endpoints

### GET /api/security/dashboard

Get security dashboard overview.

**Headers:**
```
Authorization: Bearer {admin_jwt_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "threats_detected": 12,
      "risk_level": "medium",
      "blocked_ips": 5,
      "active_sessions": 234
    },
    "recent_threats": [
      {
        "id": 123,
        "type": "brute_force",
        "severity": "critical",
        "ip_address": "192.168.1.100",
        "timestamp": "2025-12-16T10:30:00Z",
        "status": "blocked"
      }
    ],
    "risk_score": {
      "current": 42,
      "trend": "decreasing",
      "history": [45, 48, 50, 47, 44, 42]
    }
  }
}
```

---

### GET /api/security/threats

Get detailed threat list.

**Query Parameters:**
- `severity`: critical, high, medium, low
- `type`: brute_force, credential_stuffing, etc.
- `status`: active, blocked, resolved
- `start_date`, `end_date`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "type": "brute_force",
      "severity": "critical",
      "description": "Multiple failed login attempts",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "target_user": "admin@example.com",
      "attempts": 15,
      "first_seen": "2025-12-16T10:00:00Z",
      "last_seen": "2025-12-16T10:30:00Z",
      "status": "blocked",
      "actions_taken": [
        "IP blocked for 30 minutes",
        "Admin notified",
        "User alerted"
      ]
    }
  ]
}
```

---

### POST /api/security/block-ip

Block an IP address.

**Request:**
```json
{
  "ip_address": "192.168.1.100",
  "reason": "Brute force attack",
  "duration": 1800000
}
```

**Response:**
```json
{
  "success": true,
  "message": "IP blocked successfully",
  "expires_at": "2025-12-16T11:00:00Z"
}
```

---

### GET /api/security/risk-analysis/:userId

Get risk analysis for specific user.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "overall_risk_score": 42,
    "risk_level": "medium",
    "factors": {
      "authentication": {
        "score": 35,
        "details": {
          "mfa_enabled": true,
          "failed_attempts": 2,
          "password_age_days": 45
        }
      },
      "behavioral": {
        "score": 40,
        "details": {
          "unusual_activity": false,
          "rapid_actions": true
        }
      },
      "network": {
        "score": 50,
        "details": {
          "new_ip": true,
          "geo_location": "US",
          "vpn_detected": false
        }
      }
    },
    "recommendations": [
      "Enable MFA for enhanced security",
      "Review recent login locations",
      "Change password if compromised"
    ]
  }
}
```

## Code Examples

### Backend - Risk Analysis Service

```javascript
// backend/services/riskAnalysisService.js
const { User, ActivityLog, Session } = require('../models');
const { Op } = require('sequelize');

class RiskAnalysisService {
  // Calculate overall risk score
  async calculateRiskScore(userId, context = {}) {
    const [
      authRisk,
      behaviorRisk,
      networkRisk,
      deviceRisk,
      temporalRisk
    ] = await Promise.all([
      this.calculateAuthenticationRisk(userId),
      this.calculateBehavioralRisk(userId),
      this.calculateNetworkRisk(userId, context),
      this.calculateDeviceRisk(context),
      this.calculateTemporalRisk(context)
    ]);

    const overallScore = (
      authRisk * 0.30 +
      behaviorRisk * 0.25 +
      networkRisk * 0.20 +
      deviceRisk * 0.15 +
      temporalRisk * 0.10
    );

    return {
      overall: Math.round(overallScore),
      breakdown: {
        authentication: authRisk,
        behavioral: behaviorRisk,
        network: networkRisk,
        device: deviceRisk,
        temporal: temporalRisk
      },
      level: this.getRiskLevel(overallScore)
    };
  }

  // Authentication risk factors
  async calculateAuthenticationRisk(userId) {
    const user = await User.findByPk(userId);
    if (!user) return 100;

    const now = new Date();
    const accountAge = Math.floor((now - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
    const passwordAge = user.password_updated_at 
      ? Math.floor((now - new Date(user.password_updated_at)) / (1000 * 60 * 60 * 24))
      : 365;

    // Get failed login attempts in last 24 hours
    const failedAttempts = await ActivityLog.count({
      where: {
        user_id: userId,
        action: 'login_failed',
        created_at: {
          [Op.gte]: new Date(now - 24 * 60 * 60 * 1000)
        }
      }
    });

    const score = (
      Math.min(failedAttempts / 10, 1) * 40 +
      (user.mfa_enabled ? 0 : 1) * 30 +
      Math.min(passwordAge / 365, 1) * 20 +
      (accountAge < 7 ? 1 : 0) * 10
    );

    return Math.round(score);
  }

  // Behavioral risk analysis
  async calculateBehavioralRisk(userId) {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);

    // Get user's activity in last 24 hours
    const activities = await ActivityLog.findAll({
      where: {
        user_id: userId,
        created_at: { [Op.gte]: last24h }
      },
      order: [['created_at', 'DESC']]
    });

    let unusualActivityScore = 0;
    let rapidActionsScore = 0;

    // Check for unusual activity patterns
    const hourCounts = new Array(24).fill(0);
    activities.forEach(activity => {
      const hour = new Date(activity.created_at).getHours();
      hourCounts[hour]++;
    });

    // Activities between midnight and 5 AM are unusual
    const nightActivity = hourCounts.slice(0, 5).reduce((a, b) => a + b, 0);
    if (nightActivity > 5) {
      unusualActivityScore = 100;
    }

    // Check for rapid actions (more than 100 in an hour)
    const recentHour = activities.filter(a => 
      new Date(a.created_at) > new Date(now - 60 * 60 * 1000)
    );
    if (recentHour.length > 100) {
      rapidActionsScore = 100;
    }

    const score = (
      unusualActivityScore * 0.4 +
      rapidActionsScore * 0.3
    );

    return Math.round(score);
  }

  // Network risk analysis
  async calculateNetworkRisk(userId, context) {
    const { ip_address, geo_location } = context;
    let score = 0;

    // Check if IP is known
    const knownIp = await Session.findOne({
      where: {
        user_id: userId,
        device_info: {
          [Op.like]: `%${ip_address}%`
        }
      }
    });

    if (!knownIp) {
      score += 40; // Unknown IP
    }

    // Check geo-location change
    const lastSession = await Session.findOne({
      where: { user_id: userId },
      order: [['last_activity', 'DESC']]
    });

    if (lastSession) {
      const lastGeo = JSON.parse(lastSession.device_info || '{}').geo_location;
      if (lastGeo && geo_location && lastGeo !== geo_location) {
        score += 30; // Different location
      }
    }

    // Check if IP is blacklisted (simplified)
    const isBlacklisted = await this.checkIPBlacklist(ip_address);
    if (isBlacklisted) {
      score += 10;
    }

    return Math.round(score);
  }

  // Device risk analysis
  calculateDeviceRisk(context) {
    const { user_agent, is_new_device } = context;
    let score = 0;

    if (is_new_device) {
      score += 50;
    }

    // Check for outdated browser (simplified)
    if (user_agent && user_agent.includes('MSIE')) {
      score += 30;
    }

    return Math.round(score);
  }

  // Temporal risk analysis
  calculateTemporalRisk(context) {
    const now = new Date();
    const hour = now.getHours();
    let score = 0;

    // Off-hours (midnight to 6 AM)
    if (hour >= 0 && hour < 6) {
      score += 60;
    }

    return Math.round(score);
  }

  // Get risk level from score
  getRiskLevel(score) {
    if (score < 26) return 'low';
    if (score < 51) return 'medium';
    if (score < 76) return 'high';
    return 'critical';
  }

  // Check IP blacklist
  async checkIPBlacklist(ipAddress) {
    // Implementation would check against threat intelligence database
    // This is a placeholder
    return false;
  }
}

module.exports = new RiskAnalysisService();
```

### Backend - Threat Detection Service

```javascript
// backend/services/threatDetectionService.js
const { ActivityLog, BlockedIP } = require('../models');
const { Op } = require('sequelize');

class ThreatDetectionService {
  constructor() {
    this.threatPatterns = {
      brute_force: this.detectBruteForce.bind(this),
      credential_stuffing: this.detectCredentialStuffing.bind(this),
      data_exfiltration: this.detectDataExfiltration.bind(this)
    };
  }

  // Detect brute force attacks
  async detectBruteForce(ipAddress) {
    const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);

    const failedAttempts = await ActivityLog.count({
      where: {
        action: 'login_failed',
        ip_address: ipAddress,
        created_at: { [Op.gte]: last15Minutes }
      }
    });

    if (failedAttempts >= 5) {
      await this.handleThreat({
        type: 'brute_force',
        severity: 'critical',
        ip_address: ipAddress,
        description: `${failedAttempts} failed login attempts in 15 minutes`,
        actions: ['block_ip', 'notify_admin']
      });
      return true;
    }

    return false;
  }

  // Detect credential stuffing
  async detectCredentialStuffing(ipAddress) {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);

    const attempts = await ActivityLog.findAll({
      where: {
        action: 'login_failed',
        ip_address: ipAddress,
        created_at: { [Op.gte]: lastHour }
      },
      attributes: ['metadata']
    });

    // Check if different usernames were tried
    const uniqueUsernames = new Set(
      attempts.map(a => JSON.parse(a.metadata || '{}').username)
    ).size;

    if (uniqueUsernames > 10) {
      await this.handleThreat({
        type: 'credential_stuffing',
        severity: 'high',
        ip_address: ipAddress,
        description: `Attempted ${uniqueUsernames} different usernames`,
        actions: ['block_ip', 'rate_limit']
      });
      return true;
    }

    return false;
  }

  // Detect data exfiltration
  async detectDataExfiltration(userId) {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);

    const dataAccess = await ActivityLog.count({
      where: {
        user_id: userId,
        action: { [Op.like]: '%download%' },
        created_at: { [Op.gte]: lastHour }
      }
    });

    if (dataAccess > 50) {
      await this.handleThreat({
        type: 'data_exfiltration',
        severity: 'critical',
        user_id: userId,
        description: `${dataAccess} data access operations in 1 hour`,
        actions: ['suspend_account', 'notify_security_team']
      });
      return true;
    }

    return false;
  }

  // Handle detected threat
  async handleThreat(threat) {
    console.log('Threat detected:', threat);

    // Execute actions
    for (const action of threat.actions) {
      switch (action) {
        case 'block_ip':
          await this.blockIP(threat.ip_address, threat.type);
          break;
        case 'notify_admin':
          await this.notifyAdmin(threat);
          break;
        case 'suspend_account':
          await this.suspendAccount(threat.user_id);
          break;
        case 'rate_limit':
          await this.applyRateLimit(threat.ip_address);
          break;
      }
    }

    // Log threat
    await Threat.create(threat);
  }

  // Block IP address
  async blockIP(ipAddress, reason) {
    await BlockedIP.create({
      ip_address: ipAddress,
      reason,
      blocked_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });
  }

  // Notify admin
  async notifyAdmin(threat) {
    // Send notification to admin
    // Implementation depends on notification service
    console.log('Admin notified:', threat);
  }

  // Suspend account
  async suspendAccount(userId) {
    await User.update(
      { is_suspended: true },
      { where: { id: userId } }
    );
  }

  // Apply rate limiting
  async applyRateLimit(ipAddress) {
    // Implementation depends on rate limiting service
    console.log('Rate limit applied to:', ipAddress);
  }
}

module.exports = new ThreatDetectionService();
```

### Frontend - Security Dashboard Component

```javascript
// frontend/src/components/SecurityDashboard.js
import React, { useState, useEffect } from 'react';
import axios from '../api/apiClient';
import { Line } from 'react-chartjs-2';
import './SecurityDashboard.css';

const SecurityDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, threatsRes] = await Promise.all([
        axios.get('/security/dashboard'),
        axios.get('/security/threats?limit=10')
      ]);

      setDashboardData(dashRes.data.data);
      setThreats(threatsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#28a745'
    };
    return colors[severity] || '#6c757d';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="security-dashboard">
      <h1>Adaptive Defense Dashboard</h1>

      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Threats Detected</h3>
          <div className="stat-number critical">
            {dashboardData.overview.threats_detected}
          </div>
        </div>

        <div className="stat-card">
          <h3>Risk Level</h3>
          <div className={`stat-number ${dashboardData.overview.risk_level}`}>
            {dashboardData.overview.risk_level.toUpperCase()}
          </div>
        </div>

        <div className="stat-card">
          <h3>Blocked IPs</h3>
          <div className="stat-number">
            {dashboardData.overview.blocked_ips}
          </div>
        </div>

        <div className="stat-card">
          <h3>Active Sessions</h3>
          <div className="stat-number">
            {dashboardData.overview.active_sessions}
          </div>
        </div>
      </div>

      {/* Risk Score Trend */}
      <div className="chart-container">
        <h2>Risk Score Trend</h2>
        <Line
          data={{
            labels: ['6h ago', '5h ago', '4h ago', '3h ago', '2h ago', '1h ago', 'Now'],
            datasets: [{
              label: 'Risk Score',
              data: dashboardData.risk_score.history,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.1
            }]
          }}
          options={{
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            }
          }}
        />
      </div>

      {/* Real-Time Threat Feed */}
      <div className="threats-section">
        <h2>Real-Time Threat Feed</h2>
        <div className="threats-list">
          {threats.map(threat => (
            <div 
              key={threat.id} 
              className="threat-item"
              style={{ borderLeft: `4px solid ${getSeverityColor(threat.severity)}` }}
            >
              <div className="threat-header">
                <span className="threat-type">{threat.type.replace('_', ' ').toUpperCase()}</span>
                <span className="threat-severity" style={{ color: getSeverityColor(threat.severity) }}>
                  {threat.severity.toUpperCase()}
                </span>
              </div>
              <div className="threat-description">{threat.description}</div>
              <div className="threat-details">
                <span>IP: {threat.ip_address}</span>
                <span>{new Date(threat.timestamp).toLocaleString()}</span>
                <span>Status: {threat.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
```

## Alert System

### Alert Configuration

```javascript
// Alert levels and notification channels
const alertConfig = {
  critical: {
    channels: ['email', 'sms', 'slack'],
    recipients: ['security@example.com', 'admin@example.com'],
    immediate: true
  },
  high: {
    channels: ['email', 'slack'],
    recipients: ['security@example.com'],
    immediate: true
  },
  medium: {
    channels: ['email'],
    recipients: ['admin@example.com'],
    immediate: false,
    digest: true  // Send daily digest
  },
  low: {
    channels: ['dashboard'],
    recipients: [],
    immediate: false
  }
};
```

## Configuration

### Environment Variables

```env
# Risk Analysis
ENABLE_RISK_ANALYSIS=true
RISK_CALCULATION_INTERVAL=300000  # 5 minutes
HIGH_RISK_THRESHOLD=75
MEDIUM_RISK_THRESHOLD=50

# Threat Detection
ENABLE_THREAT_DETECTION=true
BRUTE_FORCE_THRESHOLD=5
BRUTE_FORCE_WINDOW=900000  # 15 minutes
AUTO_BLOCK_DURATION=1800000  # 30 minutes

# Alerts
ENABLE_SECURITY_ALERTS=true
ALERT_EMAIL=security@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

## Troubleshooting

### Issue: False Positives

**Solution:**
1. Adjust risk thresholds
2. Whitelist known IPs
3. Fine-tune detection algorithms
4. Review historical patterns

### Issue: Missing Threats

**Solution:**
1. Lower detection thresholds
2. Add more threat patterns
3. Integrate threat intelligence feeds
4. Enable verbose logging

---

**Last Updated**: December 2025  
**Version**: 1.0.0
