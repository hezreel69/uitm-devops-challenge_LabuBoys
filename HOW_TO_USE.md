# Property Management System - Complete Setup Guide

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Database Configuration](#database-configuration)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

This Property Management System is a full-stack application featuring:
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + Material-UI
- **Security**: JWT authentication, MFA (TOTP), OAuth integration
- **Features**: Property management, digital agreements, notifications, activity logging

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.x or higher)
- **npm** or **yarn** (v8.x or higher)
- **PostgreSQL** (v13.x or higher)
- **Git**

Optional:
- **Redis** (for session management and caching)
- **Docker** (for containerized deployment)

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE property_management;

# Create user (optional)
CREATE USER prop_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE property_management TO prop_user;
```

#### Run Migrations

The application uses Sequelize ORM for database management:

```bash
# Run all migrations
npx sequelize-cli db:migrate

# Seed database with initial data (optional)
npx sequelize-cli db:seed:all
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=property_management
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# MFA Configuration
MFA_ISSUER=PropertyManagementSystem
MFA_WINDOW=2

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Session Configuration
SESSION_SECRET=your-session-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Security
IDLE_TIMEOUT=1800000
PASSWORD_MIN_LENGTH=8
```

### 5. Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:5000`

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BACKEND_URL=http://localhost:5000

# OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_FACEBOOK_APP_ID=your-facebook-app-id
REACT_APP_GITHUB_CLIENT_ID=your-github-client-id

# Application Configuration
REACT_APP_NAME=Property Management System
REACT_APP_VERSION=1.0.0

# Security
REACT_APP_IDLE_TIMEOUT=1800000

# Feature Flags
REACT_APP_ENABLE_MFA=true
REACT_APP_ENABLE_OAUTH=true
REACT_APP_ENABLE_NOTIFICATIONS=true
```

### 4. Start Frontend Server

```bash
# Development mode
npm start

# Production build
npm run build
```

Frontend will run on `http://localhost:3000`

## Database Configuration

### Database Schema Overview

The application uses the following main tables:

```
users
├── id (primary key)
├── username
├── email
├── password_hash
├── role (tenant, landlord, admin)
├── mfa_enabled
├── mfa_secret
├── oauth_provider
└── oauth_id

properties
├── id (primary key)
├── landlord_id (foreign key -> users)
├── title
├── description
├── address
├── price
├── status (pending, approved, rejected)
└── created_at

agreements
├── id (primary key)
├── property_id (foreign key -> properties)
├── tenant_id (foreign key -> users)
├── landlord_id (foreign key -> users)
├── start_date
├── end_date
├── rent_amount
├── signature_hash
└── pdf_path

notifications
├── id (primary key)
├── user_id (foreign key -> users)
├── type
├── message
├── read
└── created_at

activity_logs
├── id (primary key)
├── user_id (foreign key -> users)
├── action
├── resource_type
├── resource_id
├── ip_address
├── user_agent
└── created_at

sessions
├── id (primary key)
├── user_id (foreign key -> users)
├── token
├── last_activity
└── expires_at
```

### Manual Database Setup

If migrations don't work, you can manually create tables:

```sql
-- See backend/migrations folder for complete SQL scripts
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Production Mode

**Using PM2 (Recommended):**

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd backend
pm2 start npm --name "property-backend" -- start

# Serve frontend build
cd ../frontend
npm run build
pm2 serve build 3000 --name "property-frontend" --spa
```

**Using Docker:**

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/auth.test.js
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### API Testing with Postman/Curl

**Example: Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Example: Get Properties (with JWT)**
```bash
curl -X GET http://localhost:5000/api/properties \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Deployment

### Environment Setup

1. **Production Server Requirements:**
   - Ubuntu 20.04 LTS or higher
   - 2GB RAM minimum (4GB recommended)
   - 20GB disk space
   - Node.js v16+
   - PostgreSQL 13+
   - Nginx (for reverse proxy)

2. **Update Environment Variables:**
   - Change `NODE_ENV=production`
   - Use strong secrets for JWT and sessions
   - Configure proper database credentials
   - Set up SSL certificates

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/property-management

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/property-management/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Database Backup

```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres property_management > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Add to crontab for daily backups
0 2 * * * /path/to/backup-script.sh
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

#### 2. JWT Token Invalid

**Error:**
```
JsonWebTokenError: invalid signature
```

**Solution:**
- Ensure `JWT_SECRET` is the same in backend `.env`
- Clear browser localStorage and login again
- Check token expiration settings

#### 3. MFA QR Code Not Displaying

**Solution:**
- Verify `speakeasy` and `qrcode` packages are installed
- Check MFA secret generation in backend
- Ensure frontend is properly decoding base64 QR code

#### 4. OAuth Login Fails

**Solution:**
- Verify OAuth credentials in `.env`
- Check redirect URIs in OAuth provider console
- Ensure callback URLs match: `http://localhost:5000/api/auth/google/callback`

#### 5. File Upload Fails

**Error:**
```
Error: File too large
```

**Solution:**
- Check `MAX_FILE_SIZE` in backend `.env`
- Verify `multer` configuration
- Ensure upload directory exists and has write permissions

#### 6. CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:5000' has been blocked by CORS policy
```

**Solution:**
- Verify `FRONTEND_URL` in backend `.env`
- Check CORS middleware configuration in `backend/server.js`
- Ensure credentials are included in frontend API calls

#### 7. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

#### 8. Missing Environment Variables

**Error:**
```
TypeError: Cannot read property 'SECRET' of undefined
```

**Solution:**
- Ensure `.env` file exists in the correct directory
- Verify all required variables are set
- Check `dotenv` is loaded at the top of entry file

### Performance Optimization

1. **Enable Database Indexing:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_agreements_property ON agreements(property_id);
```

2. **Enable Redis Caching:**
```bash
# Install Redis
sudo apt install redis-server

# Configure in backend
npm install redis
```

3. **Optimize Frontend Bundle:**
```bash
# Analyze bundle size
npm run build
npm install -g source-map-explorer
source-map-explorer 'build/static/js/*.js'
```

### Logging

**Backend Logs:**
```bash
# Using PM2
pm2 logs property-backend

# Using Docker
docker-compose logs -f backend

# Direct file logs (if configured)
tail -f backend/logs/app.log
```

**Frontend Logs:**
- Check browser console (F12)
- Enable React DevTools for debugging

## Support and Documentation

- **API Documentation:** `http://localhost:5000/api-docs` (if Swagger is configured)
- **GitHub Repository:** [Link to repository]
- **Issue Tracker:** [Link to issues]

## Quick Reference

### User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, manage users, approve properties |
| **Landlord** | Create properties, manage agreements |
| **Tenant** | View properties, sign agreements |

### Default Admin Account

After seeding database:
- **Email:** admin@example.com
- **Password:** admin123
- **Note:** Change password immediately after first login

### Important Commands

```bash
# Backend
npm run dev          # Start development server
npm test             # Run tests
npm run migrate      # Run database migrations
npm run seed         # Seed database

# Frontend
npm start            # Start development server
npm run build        # Production build
npm test             # Run tests

# Database
psql -U postgres property_management  # Connect to database
npx sequelize-cli db:migrate:undo     # Undo last migration
npx sequelize-cli db:seed:undo:all    # Undo all seeds
```

## Next Steps

1. Review [Core Development Modules](./Core-Development-Modules/) for detailed implementation docs
2. Check [Special Features](./Special-Features/) for advanced functionality
3. Configure OAuth providers for social login
4. Set up email notifications (SMTP)
5. Configure automated backups
6. Set up monitoring (PM2, New Relic, etc.)
7. Implement CI/CD pipeline

---

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Maintainer:** Development Team
