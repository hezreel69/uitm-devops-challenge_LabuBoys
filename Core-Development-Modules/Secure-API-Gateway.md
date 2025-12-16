# Secure API Gateway - JWT, Rate Limiting & Security

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [JWT Authentication](#jwt-authentication)
- [Rate Limiting](#rate-limiting)
- [API Security Layers](#api-security-layers)
- [Middleware Stack](#middleware-stack)
- [API Endpoints](#api-endpoints)
- [Code Examples](#code-examples)
- [Configuration](#configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

## Overview

The Secure API Gateway provides a robust, production-ready security layer for all API communications with:

- **JWT (JSON Web Token)** authentication and authorization
- **Rate limiting** to prevent abuse and DDoS attacks
- **Input validation** using Joi schemas
- **CORS (Cross-Origin Resource Sharing)** protection
- **Request sanitization** to prevent injection attacks
- **API versioning** for backward compatibility
- **Request/Response logging** for audit trails
- **Error handling** with security-aware responses

## Architecture

### API Gateway Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Apps                          │
│         (Web, Mobile, Third-party integrations)             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/TLS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  1. CORS Middleware          (Origin validation)        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  2. Rate Limiter             (IP-based throttling)      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  3. Body Parser              (JSON/URL-encoded)         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  4. Request Sanitizer        (XSS/Injection prevention) │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  5. JWT Authenticator        (Token verification)       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  6. Role-Based Access        (Permission check)         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  7. Input Validator          (Joi schema validation)    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  8. Request Logger           (Audit trail)              │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Route Handlers                            │
│  /api/auth/*     /api/properties/*    /api/agreements/*     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Business Logic & Controllers                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Database (PostgreSQL)                       │
└─────────────────────────────────────────────────────────────┘
```

### Security Flow

```
Request → CORS Check → Rate Limit → Parse Body → Sanitize Input 
  → Verify JWT → Check Permissions → Validate Schema → Route Handler
    → Business Logic → Database → Response
```

## JWT Authentication

### Token Structure

The system uses **JWT (RFC 7519)** with the following structure:

```javascript
// Header
{
  "alg": "HS256",  // Algorithm: HMAC SHA-256
  "typ": "JWT"     // Type: JSON Web Token
}

// Payload (Claims)
{
  "id": 123,                          // User ID
  "email": "user@example.com",        // User email
  "role": "landlord",                 // User role
  "iat": 1640000000,                  // Issued at (timestamp)
  "exp": 1640086400                   // Expires at (timestamp)
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

### Access Token vs Refresh Token

| Feature | Access Token | Refresh Token |
|---------|--------------|---------------|
| **Purpose** | API access | Token renewal |
| **Expiration** | 15 min - 24 hours | 7-30 days |
| **Storage** | Memory/localStorage | httpOnly cookie (recommended) |
| **Payload** | Full user info | Minimal (user ID only) |
| **Revocable** | No (stateless) | Yes (via database) |

### Token Flow

```
┌──────┐                    ┌──────┐                    
│Client│                    │Server│                    
└───┬──┘                    └───┬──┘                    
    │                           │                       
    │ 1. Login (credentials)    │                       
    ├──────────────────────────>│                       
    │                           │                       
    │ 2. Access + Refresh Token │                       
    │<──────────────────────────┤                       
    │                           │                       
    │ 3. API Request (Access)   │                       
    ├──────────────────────────>│                       
    │                           │                       
    │ 4. Response               │                       
    │<──────────────────────────┤                       
    │                           │                       
    │ ... Time passes ...       │                       
    │                           │                       
    │ 5. API Request (Expired)  │                       
    ├──────────────────────────>│                       
    │                           │                       
    │ 6. 401 Unauthorized        │                       
    │<──────────────────────────┤                       
    │                           │                       
    │ 7. Refresh Request        │                       
    ├──────────────────────────>│                       
    │                           │                       
    │ 8. New Access Token       │                       
    │<──────────────────────────┤                       
    │                           │                       
```

## Rate Limiting

### Rate Limiting Strategy

The system implements **multi-tier rate limiting**:

1. **Global Rate Limit**: All requests (100 req/15 min)
2. **Auth Endpoints**: Login/Register (5 req/15 min)
3. **API Endpoints**: Authenticated users (1000 req/hour)
4. **Public Endpoints**: Property listings (50 req/15 min)

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640001000
Retry-After: 900
```

### Rate Limiting Algorithm

Uses **Sliding Window Counter** algorithm:

```
Time Window: 15 minutes (900 seconds)
Max Requests: 100

Example:
├─────────────────────────┤ 15-minute window
│ Request timestamps:      │
│ 00:00, 00:05, 00:10...  │
│ Count: 95/100           │
└─────────────────────────┘

At 00:16:
├─────────────────────────┤ Window slides
│ New window: 00:01-00:16 │
│ Old requests drop off   │
└─────────────────────────┘
```

## API Security Layers

### 1. CORS Protection

Prevents unauthorized cross-origin requests.

```javascript
// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',      // Development
  'https://yourdomain.com',     // Production
  'https://app.yourdomain.com'  // Production app
];

// CORS configuration
{
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400  // 24 hours
}
```

### 2. Input Sanitization

Prevents XSS and injection attacks.

```javascript
// Sanitize recursively
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '')                    // Remove < and >
      .replace(/javascript:/gi, '')            // Remove javascript:
      .replace(/on\w+=/gi, '')                 // Remove event handlers
      .trim();
  }
  if (typeof input === 'object' && input !== null) {
    for (let key in input) {
      input[key] = sanitizeInput(input[key]);
    }
  }
  return input;
};
```

### 3. Input Validation

Uses Joi schemas for strict validation.

```javascript
// Property creation schema
const propertySchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(20).max(2000).required(),
  address: Joi.string().min(10).max(200).required(),
  price: Joi.number().positive().required(),
  bedrooms: Joi.number().integer().min(0).max(20),
  bathrooms: Joi.number().integer().min(0).max(20),
  area: Joi.number().positive(),
  type: Joi.string().valid('apartment', 'house', 'condo', 'studio')
});
```

### 4. SQL Injection Prevention

Uses Sequelize ORM with parameterized queries.

```javascript
// SAFE: Parameterized query
const user = await User.findOne({
  where: { email: userEmail }
});

// UNSAFE: Direct SQL (avoided)
// const user = await sequelize.query(`SELECT * FROM users WHERE email = '${userEmail}'`);
```

### 5. Helmet.js Security Headers

```javascript
// Security headers
helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}),
helmet.hsts({ maxAge: 31536000 }),
helmet.noSniff(),
helmet.frameguard({ action: 'deny' }),
helmet.xssFilter()
```

## Middleware Stack

### Authentication Middleware

```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash', 'mfa_secret'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request
    req.user = user;
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
        message: 'Token expired'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = authenticate;
```

### Authorization Middleware (Role-Based)

```javascript
// backend/middleware/authorize.js
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = authorize;

// Usage:
// router.delete('/properties/:id', authenticate, authorize('admin', 'landlord'), deleteProperty);
```

### Rate Limiting Middleware

```javascript
// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Redis client (optional, for distributed systems)
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // store: new RedisStore({ client: redisClient }) // Use Redis for distributed
});

// Auth endpoints limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many login attempts, please try again in 15 minutes'
  }
});

// API endpoints limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  skip: (req) => req.user?.role === 'admin', // Skip for admins
  message: {
    success: false,
    message: 'API rate limit exceeded'
  }
});

// Custom key generator (IP + User ID)
const customKeyGenerator = (req) => {
  return req.user ? `${req.ip}-${req.user.id}` : req.ip;
};

module.exports = {
  globalLimiter,
  authLimiter,
  apiLimiter,
  customKeyGenerator
};
```

### Validation Middleware

```javascript
// backend/middleware/validate.js
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,  // Return all errors
      stripUnknown: true  // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    req.validatedData = value;
    next();
  };
};

module.exports = validate;
```

### Request Logger Middleware

```javascript
// backend/middleware/logger.js
const { ActivityLog } = require('../models');

const logRequest = async (req, res, next) => {
  const start = Date.now();

  // Log response after it's sent
  res.on('finish', async () => {
    const duration = Date.now() - start;

    try {
      await ActivityLog.create({
        user_id: req.user?.id || null,
        action: `${req.method} ${req.originalUrl}`,
        resource_type: 'api_request',
        resource_id: null,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        status_code: res.statusCode,
        duration_ms: duration,
        metadata: {
          query: req.query,
          params: req.params
        }
      });
    } catch (error) {
      console.error('Failed to log request:', error);
    }
  });

  next();
};

module.exports = logRequest;
```

## API Endpoints

### Endpoint Structure

All API endpoints follow REST conventions:

```
/api/v1/{resource}/{id?}/{action?}

Examples:
GET    /api/v1/properties           - List all properties
GET    /api/v1/properties/123       - Get property by ID
POST   /api/v1/properties           - Create property
PUT    /api/v1/properties/123       - Update property
DELETE /api/v1/properties/123       - Delete property
POST   /api/v1/properties/123/approve - Custom action
```

### Protected Routes Example

```javascript
// backend/routes/properties.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { propertySchema } = require('../validators/propertyValidator');
const propertyController = require('../controllers/propertyController');

// Public routes
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);

// Protected routes (authentication required)
router.use(authenticate);

// Landlord routes
router.post('/', 
  authorize('landlord', 'admin'), 
  validate(propertySchema),
  propertyController.createProperty
);

router.put('/:id', 
  authorize('landlord', 'admin'),
  validate(propertySchema),
  propertyController.updateProperty
);

router.delete('/:id', 
  authorize('landlord', 'admin'),
  propertyController.deleteProperty
);

// Admin-only routes
router.post('/:id/approve', 
  authorize('admin'),
  propertyController.approveProperty
);

module.exports = router;
```

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Modern Apartment",
    "price": 1500
  },
  "message": "Property created successfully",
  "timestamp": "2025-12-16T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "price",
        "message": "Price must be positive"
      }
    ]
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Code Examples

### Complete Server Setup

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');
const logRequest = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const agreementRoutes = require('./routes/agreements');

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// 3. Rate limiting
app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 4. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(logRequest);

// 6. Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/agreements', agreementRoutes);

// 7. Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 8. 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// 9. Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

### Error Handler Middleware

```javascript
// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: 'Resource already exists',
        details: err.errors.map(e => ({
          field: e.path,
          message: `${e.path} already exists`
        }))
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token expired'
      }
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : err.message
    }
  });
};

module.exports = errorHandler;
```

### Frontend API Client with JWT

```javascript
// frontend/src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (add JWT token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (handle token refresh)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/refresh-token`,
          { refreshToken }
        );

        const { token } = response.data;
        localStorage.setItem('token', token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

## Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# JWT
JWT_SECRET=your-super-secret-minimum-32-characters-long
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=different-secret-for-refresh-tokens
REFRESH_TOKEN_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
API_RATE_LIMIT_MAX=1000

# Redis (optional, for distributed rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
MAX_REQUEST_SIZE=10mb
ENABLE_HTTPS=true

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## Monitoring & Logging

### Request Logging Format

```
[2025-12-16 10:30:15] INFO: POST /api/properties
  User: john@example.com (ID: 123)
  IP: 192.168.1.100
  Duration: 245ms
  Status: 201
  User-Agent: Mozilla/5.0...
```

### Metrics to Track

1. **Request Metrics:**
   - Total requests per endpoint
   - Average response time
   - Error rate by endpoint

2. **Authentication Metrics:**
   - Login attempts (success/failure)
   - Token refresh rate
   - MFA verification rate

3. **Rate Limiting Metrics:**
   - Rate limit hits
   - Blocked IPs
   - Top consumers

4. **Security Metrics:**
   - Failed authentication attempts
   - Invalid token attempts
   - Suspicious activity patterns

### Logging Best Practices

```javascript
// Use structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage
logger.info('User login', { userId: 123, ip: req.ip });
logger.error('Database error', { error: err.message, stack: err.stack });
```

## Troubleshooting

### Issue: CORS Errors

**Symptoms:** `Access-Control-Allow-Origin` errors in browser console

**Solutions:**
1. Verify `FRONTEND_URL` in backend `.env`
2. Check CORS middleware configuration
3. Ensure credentials are included in requests:
```javascript
axios.get('/api/properties', { withCredentials: true })
```

### Issue: Rate Limit Too Strict

**Symptoms:** Legitimate users getting blocked

**Solutions:**
1. Increase limits in `.env`
2. Implement user-based rate limiting (higher limits for authenticated users)
3. Use Redis for better distributed rate limiting

### Issue: JWT Token Issues

**Symptoms:** Constant re-login required

**Solutions:**
1. Check token expiration time
2. Implement refresh token logic
3. Verify JWT_SECRET consistency across deployments

### Issue: API Performance Slow

**Solutions:**
1. Add database indexes
2. Implement caching (Redis)
3. Use pagination for large datasets
4. Optimize database queries
5. Enable compression middleware

---

**Last Updated**: December 2025  
**Version**: 1.0.0
