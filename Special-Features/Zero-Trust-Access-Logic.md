# Zero-Trust Access Logic - Idle Timeout Implementation

## Table of Contents
- [Overview](#overview)
- [Zero-Trust Principles](#zero-trust-principles)
- [Idle Timeout Mechanism](#idle-timeout-mechanism)
- [Session Management](#session-management)
- [Implementation](#implementation)
- [Code Examples](#code-examples)
- [Security Considerations](#security-considerations)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Zero-Trust Access Logic implements a security-first approach where:

- **Never Trust, Always Verify** - No implicit trust based on network location
- **Idle Timeout** - Automatic logout after period of inactivity
- **Session Tracking** - Monitor and manage active user sessions
- **Activity Monitoring** - Track user interactions in real-time
- **Automatic Token Refresh** - Seamless re-authentication for active users
- **Multi-Device Management** - Track and control sessions across devices
- **Graceful Degradation** - Warning before automatic logout

## Zero-Trust Principles

### Core Concepts

1. **Verify Explicitly**
   - Always authenticate and authorize based on all available data points
   - Use multiple factors (MFA, device fingerprint, behavior)
   - Continuous validation, not one-time authentication

2. **Least Privilege Access**
   - Grant minimal access required for the task
   - Role-based access control (RBAC)
   - Just-in-time permissions

3. **Assume Breach**
   - Design systems assuming attackers may already be inside
   - Minimize blast radius with segmentation
   - Log and monitor all activities

### Implementation in Property Management System

```
┌─────────────────────────────────────────────────────────┐
│              User Authentication Flow                   │
│                                                         │
│  Login → Verify Identity → Check MFA → Grant Token     │
│    ↓                                         ↑          │
│  Monitor Activity ←→ Track Session ←→ Validate Token   │
│    ↓                                         ↑          │
│  Detect Idle → Warn User → Timeout → Logout            │
└─────────────────────────────────────────────────────────┘
```

## Idle Timeout Mechanism

### How It Works

```
User Activity
     │
     ├─ Mouse Move
     ├─ Keyboard Input
     ├─ Click
     ├─ Scroll
     └─ API Call
        │
        ▼
   Update Last Activity
        │
        ▼
   Check Idle Time
        │
        ├─ Active (< 25 min) ──> Continue Session
        │
        ├─ Warning (25-30 min) ─> Show Warning Modal
        │
        └─ Timeout (> 30 min) ──> Auto Logout
```

### Timeout Stages

| Stage | Time | Action | User Experience |
|-------|------|--------|-----------------|
| **Active** | 0-25 min | None | Normal usage |
| **Warning** | 25-30 min | Show modal | "Still there? Click to continue" |
| **Timeout** | 30+ min | Auto logout | Redirect to login page |

### Activity Tracking

**Frontend Events Monitored:**
- Mouse movements
- Keyboard inputs
- Click events
- Scroll events
- Touch events (mobile)
- API requests

**Backend Session Updates:**
- Store last activity timestamp
- Update on each authenticated API call
- Check timeout on every request

## Session Management

### Session Data Structure

```javascript
{
  id: "session_123abc",
  user_id: 456,
  token: "jwt_token_here",
  refresh_token: "refresh_token_here",
  device_info: {
    user_agent: "Mozilla/5.0...",
    ip_address: "192.168.1.100",
    device_type: "desktop",
    browser: "Chrome",
    os: "Windows"
  },
  created_at: "2025-12-16T10:00:00Z",
  last_activity: "2025-12-16T10:30:00Z",
  expires_at: "2025-12-16T11:00:00Z",
  idle_timeout_ms: 1800000,  // 30 minutes
  is_active: true
}
```

### Multi-Device Session Tracking

```
User: john@example.com
├── Session 1 (Desktop - Chrome)
│   ├── Last Activity: 2 min ago
│   ├── Status: Active
│   └── IP: 192.168.1.100
│
├── Session 2 (Mobile - Safari)
│   ├── Last Activity: 15 min ago
│   ├── Status: Active
│   └── IP: 10.0.0.5
│
└── Session 3 (Tablet - Firefox)
    ├── Last Activity: 35 min ago
    ├── Status: Expired
    └── IP: 192.168.1.105
```

## Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Idle Timeout Monitor                            │   │
│  │  - Track user activity                           │   │
│  │  - Send heartbeat to backend                     │   │
│  │  - Show warning modal                            │   │
│  │  - Handle auto logout                            │   │
│  └──────────────────┬───────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────┘
                      │ Heartbeat (every 60s)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Session Manager                                 │   │
│  │  - Update last_activity                          │   │
│  │  - Check timeout on requests                     │   │
│  │  - Invalidate expired sessions                   │   │
│  │  - Clean up old sessions                         │   │
│  └──────────────────┬───────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Database                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  sessions table                                  │   │
│  │  - Track all active sessions                     │   │
│  │  - Store last_activity timestamps                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Code Examples

### Backend - Session Middleware

```javascript
// backend/middleware/sessionManager.js
const { Session, User } = require('../models');
const jwt = require('jsonwebtoken');

const IDLE_TIMEOUT_MS = parseInt(process.env.IDLE_TIMEOUT || 1800000); // 30 minutes

// Middleware to check session timeout
const checkSessionTimeout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find active session
    const session = await Session.findOne({
      where: {
        user_id: decoded.id,
        is_active: true
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Check if session has timed out
    const now = new Date();
    const lastActivity = new Date(session.last_activity);
    const timeSinceActivity = now - lastActivity;

    if (timeSinceActivity > IDLE_TIMEOUT_MS) {
      // Session timed out
      await session.update({ is_active: false });
      
      return res.status(401).json({
        success: false,
        message: 'Session timed out due to inactivity',
        code: 'SESSION_TIMEOUT'
      });
    }

    // Update last activity
    await session.update({ last_activity: now });

    // Attach user to request
    req.user = decoded;
    req.session = session;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      message: 'Session validation error'
    });
  }
};

// Update session activity (heartbeat)
const updateSessionActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const session = await Session.findOne({
      where: {
        user_id: userId,
        is_active: true
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.update({ last_activity: new Date() });

    res.json({
      success: true,
      message: 'Activity updated',
      time_remaining: IDLE_TIMEOUT_MS
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity'
    });
  }
};

// Get active sessions for user
const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await Session.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      order: [['last_activity', 'DESC']]
    });

    const now = new Date();
    const sessionsData = sessions.map(session => {
      const lastActivity = new Date(session.last_activity);
      const timeSinceActivity = now - lastActivity;
      const deviceInfo = JSON.parse(session.device_info || '{}');

      return {
        id: session.id,
        device: deviceInfo.browser || 'Unknown',
        os: deviceInfo.os || 'Unknown',
        ip_address: deviceInfo.ip_address,
        last_activity: session.last_activity,
        time_since_activity: Math.floor(timeSinceActivity / 1000), // seconds
        is_current: session.id === req.session.id
      };
    });

    res.json({
      success: true,
      data: sessionsData
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions'
    });
  }
};

// Terminate specific session
const terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await Session.findOne({
      where: {
        id: sessionId,
        user_id: userId
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.update({ is_active: false });

    res.json({
      success: true,
      message: 'Session terminated'
    });
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to terminate session'
    });
  }
};

// Cleanup expired sessions (run periodically)
const cleanupExpiredSessions = async () => {
  try {
    const cutoffTime = new Date(Date.now() - IDLE_TIMEOUT_MS);

    const result = await Session.update(
      { is_active: false },
      {
        where: {
          is_active: true,
          last_activity: {
            [Op.lt]: cutoffTime
          }
        }
      }
    );

    console.log(`Cleaned up ${result[0]} expired sessions`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

module.exports = {
  checkSessionTimeout,
  updateSessionActivity,
  getActiveSessions,
  terminateSession,
  cleanupExpiredSessions
};
```

### Frontend - Idle Timeout Monitor

```javascript
// frontend/src/utils/idleTimeoutMonitor.js
class IdleTimeoutMonitor {
  constructor(config = {}) {
    this.idleTimeout = config.idleTimeout || 30 * 60 * 1000; // 30 minutes
    this.warningTime = config.warningTime || 5 * 60 * 1000;  // 5 minutes before timeout
    this.heartbeatInterval = config.heartbeatInterval || 60 * 1000; // 1 minute
    
    this.lastActivity = Date.now();
    this.isWarningShown = false;
    this.heartbeatTimer = null;
    this.checkTimer = null;
    
    this.onWarning = config.onWarning || (() => {});
    this.onTimeout = config.onTimeout || (() => {});
    this.onActivity = config.onActivity || (() => {});
  }

  start() {
    this.setupEventListeners();
    this.startHeartbeat();
    this.startTimeoutCheck();
  }

  stop() {
    this.removeEventListeners();
    this.stopHeartbeat();
    this.stopTimeoutCheck();
  }

  setupEventListeners() {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    this.activityHandler = this.handleActivity.bind(this);
    
    events.forEach(event => {
      document.addEventListener(event, this.activityHandler, true);
    });
  }

  removeEventListeners() {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach(event => {
      document.removeEventListener(event, this.activityHandler, true);
    });
  }

  handleActivity() {
    this.lastActivity = Date.now();
    this.isWarningShown = false;
    this.onActivity();
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  startTimeoutCheck() {
    this.checkTimer = setInterval(() => {
      this.checkIdleTimeout();
    }, 1000); // Check every second
  }

  stopTimeoutCheck() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  async sendHeartbeat() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${process.env.REACT_APP_API_URL}/session/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }

  checkIdleTimeout() {
    const now = Date.now();
    const idleTime = now - this.lastActivity;

    // Check if timeout reached
    if (idleTime >= this.idleTimeout) {
      this.handleTimeout();
      return;
    }

    // Check if warning should be shown
    if (idleTime >= (this.idleTimeout - this.warningTime) && !this.isWarningShown) {
      this.handleWarning();
    }
  }

  handleWarning() {
    this.isWarningShown = true;
    const remainingTime = this.idleTimeout - (Date.now() - this.lastActivity);
    this.onWarning(Math.ceil(remainingTime / 1000));
  }

  handleTimeout() {
    this.stop();
    this.onTimeout();
  }

  resetTimer() {
    this.lastActivity = Date.now();
    this.isWarningShown = false;
  }

  getIdleTime() {
    return Date.now() - this.lastActivity;
  }

  getRemainingTime() {
    return Math.max(0, this.idleTimeout - this.getIdleTime());
  }
}

export default IdleTimeoutMonitor;
```

### Frontend - React Hook for Idle Timeout

```javascript
// frontend/src/hooks/useIdleTimeout.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IdleTimeoutMonitor from '../utils/idleTimeoutMonitor';

const useIdleTimeout = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const monitor = new IdleTimeoutMonitor({
      idleTimeout: parseInt(process.env.REACT_APP_IDLE_TIMEOUT || 1800000),
      warningTime: 300000, // 5 minutes
      onWarning: (secondsRemaining) => {
        setShowWarning(true);
        setRemainingTime(secondsRemaining);
      },
      onTimeout: () => {
        handleLogout();
      },
      onActivity: () => {
        setShowWarning(false);
      }
    });

    monitor.start();

    // Update remaining time every second when warning is shown
    const countdownInterval = setInterval(() => {
      if (showWarning) {
        const remaining = monitor.getRemainingTime();
        setRemainingTime(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          handleLogout();
        }
      }
    }, 1000);

    return () => {
      monitor.stop();
      clearInterval(countdownInterval);
    };
  }, []);

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Redirect to login
    navigate('/login?reason=timeout');
  };

  const handleContinue = () => {
    setShowWarning(false);
    // Activity will be automatically tracked
  };

  return {
    showWarning,
    remainingTime,
    handleContinue,
    handleLogout
  };
};

export default useIdleTimeout;
```

### Frontend - Warning Modal Component

```javascript
// frontend/src/components/IdleTimeoutWarning.js
import React from 'react';
import './IdleTimeoutWarning.css';

const IdleTimeoutWarning = ({ show, remainingTime, onContinue, onLogout }) => {
  if (!show) return null;

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className="modal-overlay">
      <div className="idle-warning-modal">
        <h2>Still There?</h2>
        <p>
          You've been inactive for a while. For your security, you'll be 
          automatically logged out in:
        </p>
        <div className="countdown">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="modal-actions">
          <button onClick={onContinue} className="btn-primary">
            Continue Working
          </button>
          <button onClick={onLogout} className="btn-secondary">
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdleTimeoutWarning;
```

### Frontend - App Component with Idle Timeout

```javascript
// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useIdleTimeout from './hooks/useIdleTimeout';
import IdleTimeoutWarning from './components/IdleTimeoutWarning';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

const App = () => {
  const { showWarning, remainingTime, handleContinue, handleLogout } = useIdleTimeout();

  return (
    <BrowserRouter>
      <IdleTimeoutWarning
        show={showWarning}
        remainingTime={remainingTime}
        onContinue={handleContinue}
        onLogout={handleLogout}
      />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
```

## Security Considerations

### Best Practices

1. **Timeout Duration**
   - Balance security vs. user experience
   - Consider sensitivity of data
   - Recommended: 15-30 minutes for financial/sensitive apps

2. **Warning Period**
   - Give users adequate warning (3-5 minutes)
   - Allow easy continuation
   - Clear countdown display

3. **Session Storage**
   - Store sessions server-side
   - Use secure session IDs
   - Encrypt sensitive session data

4. **Token Management**
   - Short-lived access tokens (1-24 hours)
   - Longer refresh tokens (7 days)
   - Rotate tokens on refresh

5. **Device Tracking**
   - Log device information
   - Allow users to view active sessions
   - Enable remote session termination

## Configuration

### Environment Variables

```env
# Idle Timeout (milliseconds)
IDLE_TIMEOUT=1800000           # 30 minutes
IDLE_WARNING_TIME=300000       # 5 minutes before timeout
HEARTBEAT_INTERVAL=60000       # 1 minute

# Session Configuration
SESSION_CLEANUP_INTERVAL=300000  # 5 minutes
MAX_SESSIONS_PER_USER=5

# Security
TRACK_DEVICE_INFO=true
ALLOW_MULTIPLE_SESSIONS=true
NOTIFY_ON_NEW_SESSION=true
```

### Frontend Configuration

```javascript
// frontend/src/config/idleTimeout.js
export default {
  idleTimeout: parseInt(process.env.REACT_APP_IDLE_TIMEOUT || 1800000),
  warningTime: parseInt(process.env.REACT_APP_IDLE_WARNING_TIME || 300000),
  heartbeatInterval: parseInt(process.env.REACT_APP_HEARTBEAT_INTERVAL || 60000)
};
```

## Troubleshooting

### Issue: User Logged Out Too Quickly

**Solution:**
1. Increase `IDLE_TIMEOUT` duration
2. Check if heartbeat is working
3. Verify activity events are being tracked
4. Check server clock synchronization

### Issue: Warning Modal Not Showing

**Solution:**
1. Verify `onWarning` callback is set
2. Check component rendering logic
3. Review console for JavaScript errors
4. Ensure modal CSS is loaded

### Issue: Sessions Not Expiring

**Solution:**
1. Check session cleanup job is running
2. Verify database timestamps
3. Review session update logic
4. Check timezone settings

### Issue: Multiple Devices Conflict

**Solution:**
1. Implement proper session isolation
2. Use unique session IDs per device
3. Allow multiple active sessions
4. Provide session management UI

---

**Last Updated**: December 2025  
**Version**: 1.0.0
