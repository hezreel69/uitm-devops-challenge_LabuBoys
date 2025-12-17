# 🏠 RentVerse - Intelligent Property Rental Platform

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://rentverse-frontend-one.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)](https://uitm-devops-challenge-labuboys.onrender.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

> **RentVerse** is a modern, secure, and intelligent property rental platform featuring advanced security mechanisms, digital agreement signing, real-time risk monitoring, and smart notifications.

---

## 🚀 Live Deployment

**Frontend:** [https://rentverse-frontend-one.vercel.app/]  
**Backend API:** [(https://uitm-devops-challenge-labuboys.onrender.com/)]

Open the deployment link on a mobile phone browser to install the Progressive Web App (PWA) and add it to your home screen.

---

Team Members

1. Alif Hezreel Bin Jaldeen (2024779455)
2. Asad Ismet Badjened (2024554331)
3. Syafiq Aiman Bin S. Shamsuddin (2024927491)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Documentation](#-documentation)
- [Security Features](#-security-features)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🔐 **Core Security & Authentication**
- **Multi-Factor Authentication (MFA)** with TOTP support
- **Zero-Trust Access Logic** with intelligent idle timeout
- **Secure API Gateway** with JWT authentication and rate limiting
- **Real-Time Activity Logging** for all user actions
- **Adaptive Defense Dashboard** with risk analysis

### 📜 **Digital Agreement Management**
- **E-Signature Integration** for legally binding contracts
- **PDF Generation** with cryptographic hash verification
- **Dual Signature Workflow** (landlord → tenant)
- **Audit Trail** for complete signature history
- **Document Integrity Verification**

### 🔔 **Smart Notifications & Alerts**
- **Real-Time Security Alerts** (new device, suspicious activity, account lockout)
- **Email Notifications** for critical events
- **In-App Notification Center** with read/unread tracking
- **Alert Type Classification** (info, warning, critical)

### 🏘️ **Property Management**
- **Property Listing** with image uploads and geolocation
- **Admin Approval Workflow** for new property submissions
- **Property Search & Filtering** by city, type, price range
- **Featured Properties** highlighting system

### 👥 **User Management**
- **Role-Based Access Control** (USER, ADMIN)
- **User Profile Management** with OAuth support (Google, Facebook, GitHub, Apple)
- **Account Locking** after failed login attempts
- **User Statistics Dashboard** for admins

### 📊 **Admin Dashboards**
- **Main Admin Dashboard** with live KPIs (properties, users, agreements)
- **Security Dashboard** with real-time threat monitoring
- **Activity Log Dashboard** for login history and suspicious patterns
- **Risk Analysis Dashboard** with 5-factor risk scoring

### 🛡️ **Zero-Trust & Adaptive Defense**
- **Idle Timeout Detection** (auto-logout after inactivity)
- **Session Expiry Management** with visual countdown
- **Risk Score Calculation** based on:
  - Failed login attempts (30%)
  - Account lockouts (25%)
  - New device logins (20%)
  - Rapid attacks from same IP (15%)
  - Unreviewed security alerts (10%)
- **Automated Recommendations** based on current risk level

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Icons:** Lucide React
- **HTTP Client:** Fetch API with custom forwarding

### **Backend**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** JavaScript (ES6+)
- **Authentication:** JWT, Passport.js
- **ORM:** Prisma
- **Validation:** Express Validator

### **Database**
- **Primary:** PostgreSQL
- **ORM:** Prisma ORM
- **Migrations:** Prisma Migrate

### **Security**
- **Password Hashing:** bcrypt (12 rounds)
- **Rate Limiting:** Express Rate Limit
- **Token Blacklisting:** In-memory cache
- **CORS:** Configurable origins
- **MFA:** TOTP (Time-based One-Time Password)

### **File Storage**
- **S3-Compatible Storage:** Supabase Storage / AWS S3 / MinIO
- **Uploads:** Property images, user avatars

### **Email Service**
- **Providers:** Resend API / SMTP (Gmail, custom)
- **Templates:** HTML email templates with inline CSS

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RentVerse Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Frontend   │ ◄─────► │   Backend    │                 │
│  │  (Next.js)   │  HTTP   │  (Express)   │                 │
│  └──────────────┘         └──────┬───────┘                 │
│         │                         │                          │
│         │                         ▼                          │
│         │                  ┌──────────────┐                 │
│         │                  │  PostgreSQL  │                 │
│         │                  │   Database   │                 │
│         │                  └──────────────┘                 │
│         │                         │                          │
│         └─────────────────────────┼──────────────┐          │
│                                   │              │          │
│                            ┌──────▼─────┐  ┌────▼─────┐   │
│                            │   S3/      │  │  Email    │   │
│                            │  Storage   │  │  Service  │   │
│                            └────────────┘  └───────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### **Key Components:**

1. **Frontend (Next.js 14)**
   - Server-Side Rendering (SSR)
   - Client-Side State Management (Zustand)
   - API Route Forwarding
   - Real-Time Polling (10s interval)

2. **Backend (Express.js)**
   - RESTful API Design
   - JWT-Based Authentication
   - Role-Based Authorization (ADMIN, USER)
   - Rate Limiting & Security Middleware
   - Prisma ORM for Database Access

3. **Database (PostgreSQL)**
   - Users, Properties, Leases, Agreements
   - Login History, Security Alerts, Notifications
   - Audit Logs, User Devices

4. **External Services**
   - S3-Compatible Storage (Images, PDFs)
   - Email Service (OTP, Notifications)
   - OAuth Providers (Google, Facebook, GitHub, Apple)

---

## 🚀 Getting Started

See [**HOW_TO_USE.md**](./HOW_TO_USE.md) for detailed setup instructions.

### **Quick Start**

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/rentverse.git
cd rentverse

# Setup Backend
cd rentverse-backend
npm install
cp .env.example .env
# Configure .env file
npx prisma migrate deploy
npx prisma generate
npm run dev

# Setup Frontend (in new terminal)
cd ../rentverse-frontend
npm install
cp .env.example .env.local
# Configure .env.local
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Admin Dashboard: http://localhost:3001/admin

---

## 📚 Documentation

Comprehensive documentation is available in organized folders:

### **Core Development Modules**
- [Secure Login & MFA](./Core-Development-Modules/Secure-Login-MFA.md)
- [Secure API Gateway](./Core-Development-Modules/Secure-API-Gateway.md)
- [Digital Agreement System](./Core-Development-Modules/Digital-Agreement-System.md)
- [Smart Notification & Alert System](./Core-Development-Modules/Smart-Notification-Alert-System.md)
- [Activity Log Dashboard](./Core-Development-Modules/Activity-Log-Dashboard.md)

### **Special Features**
- [Zero-Trust Access Logic](./Special-Features/Zero-Trust-Access-Logic.md)
- [Adaptive Defense Dashboard](./Special-Features/Adaptive-Defense-Dashboard.md)
- [OAuth Integration](./Special-Features/OAuth-Integration.md)
- [Property Approval Workflow](./Special-Features/Property-Approval-Workflow.md)

---

## 🔒 Security Features

### **Authentication & Authorization**
- ✅ JWT-based authentication with token blacklisting
- ✅ Multi-Factor Authentication (MFA/TOTP)
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Role-based access control (RBAC)
- ✅ OAuth 2.0 integration (Google, Facebook, GitHub, Apple)

### **Zero-Trust Security**
- ✅ Idle timeout detection (10s for testing, configurable)
- ✅ Automatic session expiry with visual warnings
- ✅ Activity tracking (mouse, keyboard, scroll, touch events)
- ✅ Session-based re-authentication removed for UX balance

### **API Security**
- ✅ Rate limiting (auth: 5 req/15min, strict: 3 req/15min)
- ✅ CORS configuration with whitelisted origins
- ✅ Request validation with express-validator
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection with sanitized inputs

### **Account Protection**
- ✅ Account lockout after 5 failed attempts (15-minute lock)
- ✅ Failed attempt tracking and alerts
- ✅ New device detection and email notifications
- ✅ IP address logging for audit trails

### **Real-Time Threat Monitoring**
- ✅ Risk score calculation (0-100) with 5 weighted factors
- ✅ Trend analysis (increasing/decreasing/stable)
- ✅ Automated recommendations based on risk level
- ✅ Flagged events dashboard with auto-response

---

## 📊 Statistics & Analytics

### **Admin Dashboard Metrics**
- **Total Properties:** Live count from database
- **Total Users:** Active user count
- **Signed Agreements:** Completed rental agreements
- **Pending Approvals:** Properties awaiting admin review

### **Security Dashboard Metrics**
- **Total Logins (24h):** All authentication attempts
- **Failed Attempts (24h):** Unsuccessful logins
- **Locked Accounts:** Currently locked users
- **New Devices (24h):** First-time device logins
- **Alerts Sent (24h):** Security notifications dispatched

### **Risk Analysis Breakdown**
- **Failed Logins (30%):** Max 30 points
- **Account Lockouts (25%):** Max 25 points
- **New Devices (20%):** Max 20 points
- **Rapid Attacks (15%):** Max 15 points
- **Unreviewed Alerts (10%):** Max 10 points

**Risk Levels:**
- 🟢 **Low (0-30):** Normal operations
- 🟡 **Moderate (31-60):** Increased monitoring
- 🟠 **High (61-85):** Immediate attention needed
- 🔴 **Critical (86-100):** System under attack

---

## 🎯 Key Differentiators

### **1. Adaptive Defense System**
Unlike traditional static security systems, RentVerse uses **real-time risk calculation** to adapt security measures based on current threat levels.

### **2. Zero-Trust with UX Balance**
Removed intrusive re-authentication prompts for sensitive actions, replacing them with intelligent idle timeout that balances security and user experience.

### **3. Comprehensive Audit Trail**
Every action is logged with:
- User ID, IP address, device fingerprint
- Timestamp, success/failure status
- Detailed metadata (browser, OS, location)

### **4. Digital Agreement Legal Compliance**
- Cryptographic signature hashing
- PDF generation with immutable document hashes
- Dual-signature workflow with timestamp verification
- Complete audit trail for legal validity

### **5. Smart Notification Intelligence**
Automated alerts based on:
- Account locked → Email user immediately
- Multiple failures → Alert admin if >3 attempts
- New device → Notify user and require verification
- Suspicious IP → Flag for manual review

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and development process.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Team

- **Lead Developer:** [Your Name](https://github.com/YOUR_USERNAME)
- **Backend Developer:** [Name](https://github.com/)
- **Frontend Developer:** [Name](https://github.com/)
- **Security Consultant:** [Name](https://github.com/)

---

## 📧 Contact

- **Email:** support@rentverse.com
- **Website:** [YOUR_DEPLOYMENT_LINK_HERE]
- **GitHub:** [https://github.com/YOUR_USERNAME/rentverse](https://github.com/YOUR_USERNAME/rentverse)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Express.js](https://expressjs.com/) - Backend framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Lucide Icons](https://lucide.dev/) - Icon library

---

<div align="center">
  <p>Made with ❤️ by the RentVerse Team</p>
  <p>© 2025 RentVerse. All Rights Reserved.</p>
</div>
