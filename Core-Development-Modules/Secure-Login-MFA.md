# Secure Login & Multi-Factor Authentication (MFA)

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Authentication Flow](#authentication-flow)
- [MFA Implementation](#mfa-implementation)
- [API Endpoints](#api-endpoints)
- [Code Examples](#code-examples)
- [Security Best Practices](#security-best-practices)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Property Management System implements a robust authentication system with:
- **Password-based authentication** with bcrypt hashing
- **Time-based One-Time Password (TOTP)** for MFA
- **JWT (JSON Web Tokens)** for session management
- **Refresh tokens** for extended sessions
- **Password strength validation**
- **Account lockout** after failed attempts
- **Session management** with idle timeout

## Architecture

### Authentication Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (React)                         │
│  - Login Form                                               │
│  - MFA Setup Component                                      │
│  - Session Manager (Idle Timeout)                          │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS/JWT
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway (Express)                      │
│  - Rate Limiting                                            │
│  - CORS Protection                                          │
│  - Request Validation                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Authentication Service                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  JWT Handler │  │ MFA (TOTP)   │  │ Password Hash   │   │
│  │  - Generate  │  │ - Generate   │  │ - bcrypt (10)   │   │
│  │  - Verify    │  │ - Verify     │  │ - Validation    │   │
│  │  - Refresh   │  │ - QR Code    │  │ - Strength      │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                    │
│  - users (credentials, mfa_secret, mfa_enabled)             │
│  - sessions (tokens, last_activity, expires_at)             │
│  - activity_logs (login attempts, actions)                  │
└─────────────────────────────────────────────────────────────┘
```

### Security Layers

1. **Transport Security**: HTTPS/TLS encryption
2. **Input Validation**: Joi schema validation
3. **Rate Limiting**: Prevent brute force attacks
4. **Password Security**: bcrypt with salt rounds
5. **MFA**: TOTP-based two-factor authentication
6. **Token Security**: JWT with short expiration
7. **Session Management**: Idle timeout and token refresh
8. **Activity Logging**: Track all authentication events

## Authentication Flow

### Standard Login Flow

```
┌──────┐                ┌──────┐                ┌──────────┐
│Client│                │Server│                │ Database │
└───┬──┘                └───┬──┘                └────┬─────┘
    │                       │                        │
    │ 1. POST /auth/login   │                        │
    │   {email, password}   │                        │
    ├──────────────────────>│                        │
    │                       │ 2. Find user by email  │
    │                       ├───────────────────────>│
    │                       │                        │
    │                       │ 3. Return user data    │
    │                       │<───────────────────────┤
    │                       │                        │
    │                       │ 4. Verify password     │
    │                       │    (bcrypt.compare)    │
    │                       │                        │
    │                       │ 5. Check MFA enabled?  │
    │                       │                        │
    │  ┌────────────────────┴─────────────────┐     │
    │  │ If MFA disabled:                     │     │
    │  │ - Generate JWT token                 │     │
    │  │ - Create session                     │     │
    │  │ - Return tokens                      │     │
    │  └────────────────────┬─────────────────┘     │
    │                       │                        │
    │ 6. Response with JWT  │                        │
    │   or MFA required     │                        │
    │<──────────────────────┤                        │
    │                       │                        │
```

### MFA Login Flow

```
┌──────┐                ┌──────┐                ┌──────────┐
│Client│                │Server│                │ Database │
└───┬──┘                └───┬──┘                └────┬─────┘
    │                       │                        │
    │ 1. POST /auth/login   │                        │
    │   {email, password}   │                        │
    ├──────────────────────>│                        │
    │                       │                        │
    │ 2. Password validated │                        │
    │    MFA required       │                        │
    │<──────────────────────┤                        │
    │                       │                        │
    │ 3. POST /auth/verify-mfa                       │
    │   {email, mfaCode}    │                        │
    ├──────────────────────>│                        │
    │                       │ 4. Get user's          │
    │                       │    mfa_secret          │
    │                       ├───────────────────────>│
    │                       │<───────────────────────┤
    │                       │                        │
    │                       │ 5. Verify TOTP code    │
    │                       │    speakeasy.verify()  │
    │                       │                        │
    │                       │ 6. Create session      │
    │                       ├───────────────────────>│
    │                       │                        │
    │ 7. JWT tokens         │                        │
    │<──────────────────────┤                        │
    │                       │                        │
```

## MFA Implementation

### TOTP (Time-based One-Time Password)

The system uses **TOTP** algorithm (RFC 6238) for MFA:
- **Algorithm**: SHA1
- **Period**: 30 seconds
- **Digits**: 6
- **Window**: 2 (allows ±1 time step for clock skew)

### MFA Setup Flow

```
┌──────┐                ┌──────┐                ┌──────────┐
│Client│                │Server│                │ Database │
└───┬──┘                └───┬──┘                └────┬─────┘
    │                       │                        │
    │ 1. POST /auth/enable-mfa                       │
    │   (Authenticated)     │                        │
    ├──────────────────────>│                        │
    │                       │                        │
    │                       │ 2. Generate secret     │
    │                       │    speakeasy           │
    │                       │    .generateSecret()   │
    │                       │                        │
    │                       │ 3. Save secret         │
    │                       ├───────────────────────>│
    │                       │                        │
    │ 4. Return QR code     │                        │
    │   (Base64 image)      │                        │
    │<──────────────────────┤                        │
    │                       │                        │
    │ 5. Scan QR with       │                        │
    │    Authenticator App  │                        │
    │                       │                        │
    │ 6. POST /auth/verify-mfa-setup                 │
    │   {mfaCode}           │                        │
    ├──────────────────────>│                        │
    │                       │                        │
    │                       │ 7. Verify code         │
    │                       │                        │
    │                       │ 8. Set mfa_enabled=true│
    │                       ├───────────────────────>│
    │                       │                        │
    │ 9. MFA enabled        │                        │
    │<──────────────────────┤                        │
    │                       │                        │
```

## API Endpoints

### POST /api/auth/register

Register a new user account.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecureP@ss123",
  "role": "tenant"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "tenant",
    "mfa_enabled": false
  }
}
```

**Validation Rules:**
- Email: Valid email format
- Password: Minimum 8 characters, must contain uppercase, lowercase, number
- Username: 3-30 characters, alphanumeric
- Role: One of [tenant, landlord, admin]

---

### POST /api/auth/login

Authenticate user with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecureP@ss123"
}
```

**Response (No MFA):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "tenant",
    "mfa_enabled": false
  }
}
```

**Response (MFA Required):**
```json
{
  "success": true,
  "mfaRequired": true,
  "message": "MFA code required",
  "tempToken": "temp_token_for_mfa_verification"
}
```

---

### POST /api/auth/verify-mfa

Verify MFA code and complete login.

**Request:**
```json
{
  "email": "john@example.com",
  "mfaCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "tenant",
    "mfa_enabled": true
  }
}
```

---

### POST /api/auth/enable-mfa

Enable MFA for authenticated user.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "secret": "JBSWY3DPEHPK3PXP",
  "message": "Scan this QR code with your authenticator app"
}
```

---

### POST /api/auth/verify-mfa-setup

Verify MFA setup with initial code.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "mfaCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MFA enabled successfully"
}
```

---

### POST /api/auth/disable-mfa

Disable MFA for authenticated user.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "password": "SecureP@ss123",
  "mfaCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MFA disabled successfully"
}
```

---

### POST /api/auth/refresh-token

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /api/auth/logout

Invalidate user session.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /api/auth/change-password

Change user password.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewP@ss456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Code Examples

### Backend - User Registration

```javascript
// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const { User } = require('../models');

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash,
      role: role || 'tenant',
      mfa_enabled: false
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};
```

### Backend - Login with MFA Check

```javascript
// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Session } = require('../models');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      // Log failed attempt
      await logFailedAttempt(user.id, req.ip);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if MFA is enabled
    if (user.mfa_enabled) {
      return res.json({
        success: true,
        mfaRequired: true,
        message: 'MFA code required',
        tempToken: generateTempToken(user.id)
      });
    }

    // Generate tokens
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session
    await Session.create({
      user_id: user.id,
      token: refreshToken,
      last_activity: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Log successful login
    await logActivity(user.id, 'login', req.ip, req.headers['user-agent']);

    const userResponse = user.toJSON();
    delete userResponse.password_hash;
    delete userResponse.mfa_secret;

    res.json({
      success: true,
      token,
      refreshToken,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Helper functions
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
};
```

### Backend - MFA Setup

```javascript
// backend/controllers/authController.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User } = require('../models');

exports.enableMFA = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT middleware

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${process.env.MFA_ISSUER || 'PropertyManagement'} (${req.user.email})`,
      length: 32
    });

    // Save secret to user (but don't enable yet)
    await User.update(
      { mfa_secret: secret.base32 },
      { where: { id: userId } }
    );

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCode: qrCodeDataURL,
      secret: secret.base32,
      message: 'Scan this QR code with your authenticator app'
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enabling MFA'
    });
  }
};

exports.verifyMFASetup = async (req, res) => {
  try {
    const { mfaCode } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user || !user.mfa_secret) {
      return res.status(400).json({
        success: false,
        message: 'MFA not initialized'
      });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: mfaCode,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid MFA code'
      });
    }

    // Enable MFA
    await User.update(
      { mfa_enabled: true },
      { where: { id: userId } }
    );

    // Log activity
    await logActivity(userId, 'mfa_enabled', req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      message: 'MFA enabled successfully'
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying MFA'
    });
  }
};
```

### Frontend - Login Component with MFA

```javascript
// frontend/src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.mfaRequired) {
        setMfaRequired(true);
      } else {
        // Store tokens
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/verify-mfa', {
        email,
        mfaCode
      });

      // Store tokens
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (mfaRequired) {
    return (
      <div className="login-container">
        <h2>Two-Factor Authentication</h2>
        <form onSubmit={handleMFAVerification}>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            maxLength={6}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
```

### Frontend - MFA Setup Component

```javascript
// frontend/src/components/MFASetup.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MFASetup = () => {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1); // 1: Generate, 2: Verify
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const enableMFA = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/auth/enable-mfa', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enable MFA');
    }
  };

  const verifyMFA = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/verify-mfa-setup', 
        { mfaCode: verificationCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('MFA enabled successfully!');
      
      // Update user in localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      user.mfa_enabled = true;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="mfa-setup">
      <h2>Two-Factor Authentication Setup</h2>
      
      {step === 1 && (
        <div>
          <p>Enhance your account security with two-factor authentication.</p>
          <button onClick={enableMFA}>Enable MFA</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Step 1: Scan QR Code</h3>
          <p>Use an authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:</p>
          <img src={qrCode} alt="MFA QR Code" />
          
          <h3>Step 2: Enter Secret (Manual Entry)</h3>
          <p>If you can't scan, enter this secret manually:</p>
          <code>{secret}</code>

          <h3>Step 3: Verify</h3>
          <form onSubmit={verifyMFA}>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              required
            />
            <button type="submit">Verify and Enable</button>
          </form>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </div>
      )}
    </div>
  );
};

export default MFASetup;
```

## Security Best Practices

### Password Security

1. **Hashing Algorithm**: Use bcrypt with at least 10 salt rounds
2. **Password Requirements**:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - Optional: Special characters

3. **Password Storage**: Never store plain text passwords

```javascript
// Example password validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (password.length < minLength) {
    return 'Password must be at least 8 characters';
  }
  if (!hasUpperCase) {
    return 'Password must contain uppercase letter';
  }
  if (!hasLowerCase) {
    return 'Password must contain lowercase letter';
  }
  if (!hasNumbers) {
    return 'Password must contain number';
  }
  
  return null; // Valid
};
```

### JWT Security

1. **Short Expiration**: Access tokens expire in 1-24 hours
2. **Refresh Tokens**: Longer expiration (7 days) for seamless UX
3. **Secure Storage**: Store tokens in httpOnly cookies (backend) or localStorage (frontend with caution)
4. **Token Rotation**: Rotate refresh tokens on each use

```javascript
// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
```

### MFA Security

1. **Secure Secret Storage**: Store MFA secrets encrypted in database
2. **Time Window**: Allow ±1 time step (60 seconds) for clock skew
3. **Backup Codes**: Provide recovery codes (future enhancement)
4. **Rate Limiting**: Limit MFA verification attempts

### Rate Limiting

```javascript
// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many MFA attempts, please try again later'
});

module.exports = { loginLimiter, mfaLimiter };
```

## Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret-different-from-jwt
REFRESH_TOKEN_EXPIRES_IN=7d

# MFA Configuration
MFA_ISSUER=PropertyManagementSystem
MFA_WINDOW=2

# Session Configuration
SESSION_SECRET=your-session-secret
IDLE_TIMEOUT=1800000

# Security
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000
```

### Database Models

```javascript
// backend/models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('tenant', 'landlord', 'admin'),
      defaultValue: 'tenant'
    },
    mfa_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    mfa_secret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    locked_until: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return User;
};
```

## Troubleshooting

### Issue: MFA QR Code Not Displaying

**Symptoms**: QR code is blank or not loading

**Solutions**:
1. Check if `qrcode` package is installed: `npm install qrcode`
2. Verify secret generation: Check if `mfa_secret` is saved in database
3. Check image format: Ensure base64 data URL is correct
4. Browser console: Look for image loading errors

### Issue: MFA Code Always Invalid

**Symptoms**: Valid codes from authenticator app are rejected

**Solutions**:
1. **Time Sync**: Ensure server time is synced with NTP
```bash
# Check server time
date
# Install NTP
sudo apt-get install ntp
```
2. **Window Setting**: Increase `MFA_WINDOW` to 3 in `.env`
3. **Secret Mismatch**: Verify `mfa_secret` in database matches app
4. **Test Code Generation**:
```javascript
const code = speakeasy.totp({
  secret: user.mfa_secret,
  encoding: 'base32'
});
console.log('Expected code:', code);
```

### Issue: Token Expired Immediately

**Symptoms**: JWT expires right after login

**Solutions**:
1. Check `JWT_EXPIRES_IN` in `.env`
2. Verify token generation:
```javascript
const decoded = jwt.decode(token);
console.log('Token expires:', new Date(decoded.exp * 1000));
```
3. Implement token refresh logic in frontend

### Issue: Cannot Login After Multiple Failed Attempts

**Symptoms**: Account locked out

**Solutions**:
1. Check lockout settings in `.env`
2. Manual unlock via database:
```sql
UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = 'user@example.com';
```
3. Implement admin unlock feature

### Issue: CORS Error on Login

**Symptoms**: CORS policy blocking requests

**Solutions**:
1. Verify CORS configuration in `server.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```
2. Ensure frontend URL matches `FRONTEND_URL` in backend `.env`

---

**Last Updated**: December 2025  
**Version**: 1.0.0
