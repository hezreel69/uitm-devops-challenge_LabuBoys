# OAuth Integration - Google, Facebook, GitHub, Apple

## Table of Contents
- [Overview](#overview)
- [OAuth 2.0 Flow](#oauth-20-flow)
- [Provider Setup](#provider-setup)
- [Implementation](#implementation)
- [API Endpoints](#api-endpoints)
- [Code Examples](#code-examples)
- [Security Considerations](#security-considerations)
- [User Account Linking](#user-account-linking)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The OAuth Integration provides seamless social login functionality supporting multiple providers:

- **Google OAuth 2.0** - Login with Google accounts
- **Facebook Login** - Login with Facebook accounts
- **GitHub OAuth** - Login with GitHub accounts
- **Apple Sign In** - Login with Apple ID
- **Account Linking** - Link multiple OAuth providers to one account
- **Profile Sync** - Automatically sync user profile data
- **Email Verification** - Skip verification for OAuth logins
- **Fallback Authentication** - Support traditional email/password

## OAuth 2.0 Flow

### Authorization Code Flow

```
┌────────┐                                         ┌────────────┐
│ Client │                                         │   OAuth    │
│ (User) │                                         │  Provider  │
└───┬────┘                                         └─────┬──────┘
    │                                                    │
    │ 1. Click "Login with Google"                      │
    ├───────────────────────────────────────────────────>│
    │                                                    │
    │ 2. Redirect to OAuth provider                     │
    │    with client_id and redirect_uri                │
    │<───────────────────────────────────────────────────┤
    │                                                    │
    │ 3. User logs in and grants permissions            │
    ├───────────────────────────────────────────────────>│
    │                                                    │
    │ 4. Redirect back with authorization code          │
    │<───────────────────────────────────────────────────┤
    │                                                    │
    ▼                                                    │
┌────────────┐                                          │
│   Backend  │                                          │
│   Server   │                                          │
└─────┬──────┘                                          │
      │                                                  │
      │ 5. Exchange code for access token               │
      ├─────────────────────────────────────────────────>│
      │                                                  │
      │ 6. Return access token                          │
      │<─────────────────────────────────────────────────┤
      │                                                  │
      │ 7. Get user info with access token              │
      ├─────────────────────────────────────────────────>│
      │                                                  │
      │ 8. Return user profile data                     │
      │<─────────────────────────────────────────────────┤
      │                                                  │
      │ 9. Create/update user in database               │
      │    Generate JWT token                           │
      │                                                  │
      ▼                                                  │
┌────────┐                                              │
│ Client │                                              │
└────────┘                                              │
```

## Provider Setup

### Google OAuth Setup

1. **Create Project in Google Cloud Console**
   - Go to https://console.cloud.google.com
   - Create new project or select existing
   - Enable Google+ API

2. **Configure OAuth Consent Screen**
   - User Type: External
   - App name: Property Management System
   - User support email: your-email@example.com
   - Authorized domains: yourdomain.com

3. **Create OAuth 2.0 Credentials**
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback`
     - `https://api.yourdomain.com/api/auth/google/callback`

4. **Get Credentials**
   - Client ID: `1234567890-abc123def456.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-abc123def456...`

---

### Facebook Login Setup

1. **Create Facebook App**
   - Go to https://developers.facebook.com
   - Create App → Consumer
   - App name: Property Management System

2. **Add Facebook Login Product**
   - Settings → Basic
   - Add Platform → Website
   - Site URL: `https://yourdomain.com`

3. **Configure OAuth Settings**
   - Valid OAuth Redirect URIs:
     - `http://localhost:5000/api/auth/facebook/callback`
     - `https://api.yourdomain.com/api/auth/facebook/callback`
   - Client OAuth Login: Yes
   - Web OAuth Login: Yes

4. **Get Credentials**
   - App ID: `1234567890123456`
   - App Secret: `abc123def456...`

---

### GitHub OAuth Setup

1. **Create OAuth App**
   - Go to https://github.com/settings/developers
   - New OAuth App
   - Application name: Property Management System
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL:
     - `http://localhost:5000/api/auth/github/callback`
     - `https://api.yourdomain.com/api/auth/github/callback`

2. **Get Credentials**
   - Client ID: `Iv1.abc123def456`
   - Client Secret: `abc123def456...`

---

### Apple Sign In Setup

1. **Register App ID**
   - Go to https://developer.apple.com
   - Certificates, Identifiers & Profiles
   - Register new App ID
   - Enable Sign In with Apple capability

2. **Create Service ID**
   - Register new Services ID
   - Enable Sign In with Apple
   - Configure Web Authentication:
     - Primary App ID: (your App ID)
     - Domains: `yourdomain.com`
     - Return URLs: `https://api.yourdomain.com/api/auth/apple/callback`

3. **Create Private Key**
   - Keys → Register new Key
   - Enable Sign In with Apple
   - Download `.p8` key file

4. **Get Credentials**
   - Team ID: `ABCDE12345`
   - Services ID: `com.yourdomain.propertymanagement`
   - Key ID: `FGHIJ67890`
   - Private Key: (`.p8` file content)

## Implementation

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  OAuth Routes                           │
│  /auth/google           /auth/facebook                  │
│  /auth/github           /auth/apple                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│               OAuth Controller                          │
│  - Initiate OAuth flow                                  │
│  - Handle callbacks                                     │
│  - Exchange code for token                              │
│  - Get user profile                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              OAuth Service                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Google  │  │ Facebook │  │  GitHub  │  │ Apple  │ │
│  │ Strategy │  │ Strategy │  │ Strategy │  │Strategy│ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│            User Management                              │
│  - Find or create user                                  │
│  - Link OAuth account                                   │
│  - Generate JWT token                                   │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- OAuth accounts table
CREATE TABLE oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,  -- google, facebook, github, apple
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(255),
  profile_picture VARCHAR(500),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_user_id)
);

-- Index for faster lookups
CREATE INDEX idx_oauth_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider ON oauth_accounts(provider, provider_user_id);
```

## API Endpoints

### GET /api/auth/google

Initiate Google OAuth flow.

**Response:**
- Redirects to Google OAuth consent screen

---

### GET /api/auth/google/callback

Handle Google OAuth callback.

**Query Parameters:**
- `code`: Authorization code from Google

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@gmail.com",
    "username": "John Doe",
    "oauth_provider": "google",
    "profile_picture": "https://lh3.googleusercontent.com/..."
  }
}
```

---

### POST /api/auth/link-oauth

Link OAuth account to existing user.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "provider": "google",
  "code": "authorization_code_from_provider"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Google account linked successfully"
}
```

---

### DELETE /api/auth/unlink-oauth/:provider

Unlink OAuth account.

**Response:**
```json
{
  "success": true,
  "message": "Google account unlinked"
}
```

## Code Examples

### Backend - Google OAuth Implementation

```javascript
// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, OAuthAccount } = require('../models');
const jwt = require('jsonwebtoken');

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create OAuth account
      let oauthAccount = await OAuthAccount.findOne({
        where: {
          provider: 'google',
          provider_user_id: profile.id
        }
      });

      let user;

      if (oauthAccount) {
        // OAuth account exists, get user
        user = await User.findByPk(oauthAccount.user_id);
        
        // Update tokens
        await oauthAccount.update({
          access_token: accessToken,
          refresh_token: refreshToken,
          email: profile.emails[0].value,
          display_name: profile.displayName,
          profile_picture: profile.photos[0]?.value
        });
      } else {
        // New OAuth account
        // Check if user exists with this email
        const email = profile.emails[0].value;
        user = await User.findOne({ where: { email } });

        if (!user) {
          // Create new user
          user = await User.create({
            email,
            username: profile.displayName,
            oauth_provider: 'google',
            oauth_id: profile.id,
            email_verified: true,  // OAuth emails are verified
            profile_picture: profile.photos[0]?.value
          });
        }

        // Create OAuth account link
        oauthAccount = await OAuthAccount.create({
          user_id: user.id,
          provider: 'google',
          provider_user_id: profile.id,
          email: profile.emails[0].value,
          display_name: profile.displayName,
          profile_picture: profile.photos[0]?.value,
          access_token: accessToken,
          refresh_token: refreshToken
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Initiate Google OAuth
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { id: req.user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
      );

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/oauth/callback?token=${token}&refreshToken=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
    }
  }
);

module.exports = router;
```

### Backend - Facebook OAuth Implementation

```javascript
// backend/routes/auth.js (continued)
const FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let oauthAccount = await OAuthAccount.findOne({
        where: {
          provider: 'facebook',
          provider_user_id: profile.id
        }
      });

      let user;

      if (oauthAccount) {
        user = await User.findByPk(oauthAccount.user_id);
        await oauthAccount.update({
          access_token: accessToken,
          email: profile.emails?.[0]?.value,
          display_name: `${profile.name.givenName} ${profile.name.familyName}`,
          profile_picture: profile.photos?.[0]?.value
        });
      } else {
        const email = profile.emails?.[0]?.value;
        user = await User.findOne({ where: { email } });

        if (!user) {
          user = await User.create({
            email,
            username: `${profile.name.givenName} ${profile.name.familyName}`,
            oauth_provider: 'facebook',
            oauth_id: profile.id,
            email_verified: true,
            profile_picture: profile.photos?.[0]?.value
          });
        }

        oauthAccount = await OAuthAccount.create({
          user_id: user.id,
          provider: 'facebook',
          provider_user_id: profile.id,
          email: profile.emails?.[0]?.value,
          display_name: `${profile.name.givenName} ${profile.name.familyName}`,
          profile_picture: profile.photos?.[0]?.value,
          access_token: accessToken
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

router.get('/facebook',
  passport.authenticate('facebook', {
    scope: ['email', 'public_profile'],
    session: false
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: req.user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    );

    res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${token}&refreshToken=${refreshToken}`);
  }
);
```

### Frontend - Google OAuth Button

```javascript
// frontend/src/components/GoogleLoginButton.js
import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  return (
    <button onClick={handleGoogleLogin} className="google-login-btn">
      <img src="/icons/google.svg" alt="Google" />
      Continue with Google
    </button>
  );
};

export default GoogleLoginButton;
```

### Frontend - OAuth Callback Handler

```javascript
// frontend/src/pages/OAuthCallback.js
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token && refreshToken) {
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Decode token to get user info
      const user = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      navigate('/login?error=missing_tokens');
    }
  }, [searchParams, navigate]);

  return (
    <div className="oauth-callback">
      <div className="loader">Processing login...</div>
    </div>
  );
};

export default OAuthCallback;
```

### Frontend - Social Login Component

```javascript
// frontend/src/components/SocialLogin.js
import React from 'react';
import './SocialLogin.css';

const SocialLogin = () => {
  const handleOAuthLogin = (provider) => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/${provider}`;
  };

  return (
    <div className="social-login">
      <div className="divider">
        <span>Or continue with</span>
      </div>

      <div className="social-buttons">
        <button 
          onClick={() => handleOAuthLogin('google')} 
          className="social-btn google"
        >
          <img src="/icons/google.svg" alt="Google" />
          Google
        </button>

        <button 
          onClick={() => handleOAuthLogin('facebook')} 
          className="social-btn facebook"
        >
          <img src="/icons/facebook.svg" alt="Facebook" />
          Facebook
        </button>

        <button 
          onClick={() => handleOAuthLogin('github')} 
          className="social-btn github"
        >
          <img src="/icons/github.svg" alt="GitHub" />
          GitHub
        </button>

        <button 
          onClick={() => handleOAuthLogin('apple')} 
          className="social-btn apple"
        >
          <img src="/icons/apple.svg" alt="Apple" />
          Apple
        </button>
      </div>
    </div>
  );
};

export default SocialLogin;
```

## Security Considerations

### Best Practices

1. **State Parameter**
   - Use random state parameter to prevent CSRF
   - Validate state on callback

2. **HTTPS Only**
   - Always use HTTPS in production
   - OAuth providers require secure redirect URIs

3. **Token Storage**
   - Store OAuth tokens securely
   - Encrypt sensitive data in database
   - Never expose client secrets in frontend

4. **Scope Minimization**
   - Request only necessary permissions
   - Google: `profile`, `email`
   - Facebook: `email`, `public_profile`

5. **Token Refresh**
   - Implement refresh token logic
   - Handle token expiration gracefully

6. **Account Linking**
   - Verify user identity before linking
   - Prevent account hijacking
   - Allow unlinking OAuth accounts

## User Account Linking

### Linking Flow

```javascript
// User is logged in and wants to link Google account
const linkOAuthAccount = async (provider, code) => {
  try {
    const response = await axios.post('/api/auth/link-oauth', {
      provider,
      code
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log('Account linked:', response.data);
  } catch (error) {
    console.error('Link failed:', error);
  }
};
```

## Configuration

### Environment Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=1234567890-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

# Facebook OAuth
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abc123def456

# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=abc123def456

# Apple Sign In
APPLE_CLIENT_ID=com.yourdomain.propertymanagement
APPLE_TEAM_ID=ABCDE12345
APPLE_KEY_ID=FGHIJ67890
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...

# OAuth Settings
OAUTH_CALLBACK_URL=http://localhost:5000/api/auth
FRONTEND_URL=http://localhost:3000
```

## Troubleshooting

### Issue: Redirect URI Mismatch

**Error:** `redirect_uri_mismatch`

**Solution:**
1. Verify callback URL in OAuth provider settings
2. Ensure URL matches exactly (including protocol)
3. Check for trailing slashes

### Issue: Invalid Client

**Error:** `invalid_client`

**Solution:**
1. Verify Client ID and Secret
2. Check environment variables are loaded
3. Ensure credentials are for correct environment

### Issue: Access Denied

**Error:** `access_denied`

**Solution:**
1. User cancelled OAuth flow
2. App not approved by provider
3. Missing required permissions

### Issue: Token Expired

**Solution:**
1. Implement token refresh logic
2. Request offline_access scope (if available)
3. Re-authenticate user

---

**Last Updated**: December 2025  
**Version**: 1.0.0
