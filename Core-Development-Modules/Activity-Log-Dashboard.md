# Activity Log & Dashboard

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Activity Tracking](#activity-tracking)
- [Dashboard Components](#dashboard-components)
- [API Endpoints](#api-endpoints)
- [Code Examples](#code-examples)
- [Analytics & Reporting](#analytics--reporting)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Activity Log & Dashboard system provides comprehensive tracking and visualization of all system activities with:

- **Comprehensive Activity Logging** for all user actions
- **Real-time Dashboard** with key metrics
- **User Activity Timeline** for audit trails
- **System Analytics** for insights
- **Role-based Dashboards** (Admin, Landlord, Tenant)
- **Export Capabilities** (CSV, PDF reports)
- **Search & Filter** functionality
- **Performance Metrics** and monitoring
- **Security Event Tracking**

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Actions                             │
│  Login, CRUD Operations, File Uploads, API Calls, etc.      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Activity Logger Middleware                  │
│  - Captures request/response data                           │
│  - Extracts user info                                       │
│  - Records metadata (IP, user agent, duration)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Activity Log Database                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  activity_logs table                                 │   │
│  │  - id, user_id, action, resource_type, resource_id   │   │
│  │  - ip_address, user_agent, status_code, duration_ms  │   │
│  │  - metadata (JSON), created_at                       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Analytics & Dashboard Service                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Aggregator  │  │  Visualizer  │  │   Exporter   │      │
│  │  - Stats     │  │  - Charts    │  │  - CSV       │      │
│  │  - Trends    │  │  - Tables    │  │  - PDF       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Dashboard UI (React)                        │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │ Admin     │  │ Landlord  │  │  Tenant   │               │
│  │ Dashboard │  │ Dashboard │  │ Dashboard │               │
│  └───────────┘  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Middleware → Log to DB → Aggregate → Display
     │                                      │
     └──────── Real-time Update ────────────┘
```

## Activity Tracking

### Activity Types

| Category | Actions | Resource Types |
|----------|---------|----------------|
| **Authentication** | login, logout, register, password_change, mfa_enable, mfa_disable | user |
| **Properties** | create, update, delete, approve, reject, view | property |
| **Agreements** | create, update, sign, send, download, delete | agreement |
| **Payments** | create, process, refund, view | payment |
| **Users** | create, update, delete, suspend, activate | user |
| **System** | backup, restore, config_change, error | system |

### Logged Information

Each activity log entry contains:

```javascript
{
  id: 12345,
  user_id: 123,                        // Who performed the action
  action: "property.create",           // What was done
  resource_type: "property",           // Type of resource
  resource_id: 456,                    // Specific resource ID
  ip_address: "192.168.1.100",         // Client IP
  user_agent: "Mozilla/5.0...",        // Browser/client info
  status_code: 201,                    // HTTP status
  duration_ms: 245,                    // Request duration
  metadata: {                          // Additional context
    property_title: "Modern Apartment",
    changes: { price: "1500" }
  },
  created_at: "2025-12-16T10:30:00Z"   // When it happened
}
```

### Database Schema

```sql
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status_code INTEGER,
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created_at (created_at)
);
```

## Dashboard Components

### Admin Dashboard

**Key Metrics:**
- Total users (by role)
- Total properties (pending, approved, rejected)
- Total agreements (active, expired)
- System health (CPU, memory, disk)
- Recent activity feed
- Security alerts

**Widgets:**
```
┌────────────────────────────────────────────────────────┐
│  Admin Dashboard                          [Filter: Today]│
├────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Users   │  │Properties│  │Agreements│  │ Active │ │
│  │   145    │  │   432    │  │   289    │  │  78%   │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
├────────────────────────────────────────────────────────┤
│  User Growth Chart (Last 30 Days)                      │
│  ┌────────────────────────────────────────────────┐    │
│  │    📈 [Line chart showing user growth]        │    │
│  └────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────┤
│  Pending Approvals                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │ • Property: Modern Apartment (John Smith)      │    │
│  │ • Property: Beach House (Jane Doe)             │    │
│  │ • Agreement: Apt 4B Rental (Review needed)     │    │
│  └────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────┤
│  Recent Activity                                       │
│  ┌────────────────────────────────────────────────┐    │
│  │ 10:30 AM - User john@example.com logged in     │    │
│  │ 10:25 AM - Property #123 approved              │    │
│  │ 10:20 AM - Agreement #456 signed               │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

### Landlord Dashboard

**Key Metrics:**
- Total properties
- Active agreements
- Monthly revenue
- Occupancy rate
- Upcoming renewals
- Maintenance requests

**Widgets:**
```
┌────────────────────────────────────────────────────────┐
│  Landlord Dashboard                   [Welcome, John!] │
├────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │Properties│  │ Active   │  │ Monthly  │  │Occupied│ │
│  │    12    │  │Tenants 8 │  │Revenue   │  │  92%   │ │
│  │          │  │          │  │ $12,000  │  │        │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
├────────────────────────────────────────────────────────┤
│  Revenue Trend (Last 6 Months)                         │
│  ┌────────────────────────────────────────────────┐    │
│  │    📊 [Bar chart showing monthly revenue]     │    │
│  └────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────┤
│  Upcoming Renewals                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │ • Apt 4B - Expires in 30 days (Jane Doe)       │    │
│  │ • Beach House - Expires in 45 days (Tom Smith) │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

### Tenant Dashboard

**Key Metrics:**
- Current property
- Rent status
- Agreement expiry
- Payment history
- Maintenance requests
- Documents

**Widgets:**
```
┌────────────────────────────────────────────────────────┐
│  Tenant Dashboard                     [Welcome, Jane!] │
├────────────────────────────────────────────────────────┤
│  Current Property: Modern Apartment, Apt 4B            │
│  ┌────────────────────────────────────────────────┐    │
│  │  Monthly Rent: $1,500                          │    │
│  │  Next Payment: Jan 1, 2026                     │    │
│  │  Agreement Expires: Dec 31, 2026               │    │
│  │  Landlord: John Smith                          │    │
│  └────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────┤
│  Payment History                                       │
│  ┌────────────────────────────────────────────────┐    │
│  │ Dec 2025 - $1,500 ✓ Paid                       │    │
│  │ Nov 2025 - $1,500 ✓ Paid                       │    │
│  │ Oct 2025 - $1,500 ✓ Paid                       │    │
│  └────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────┤
│  Quick Actions                                         │
│  [Pay Rent] [Contact Landlord] [View Agreement]        │
└────────────────────────────────────────────────────────┘
```

## API Endpoints

### GET /api/dashboard/stats

Get dashboard statistics (role-based).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (Admin):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 145,
      "tenants": 100,
      "landlords": 40,
      "admins": 5,
      "new_this_month": 15
    },
    "properties": {
      "total": 432,
      "pending": 12,
      "approved": 400,
      "rejected": 20
    },
    "agreements": {
      "total": 289,
      "active": 234,
      "expired": 45,
      "pending": 10
    },
    "system": {
      "uptime": "45 days",
      "cpu_usage": "25%",
      "memory_usage": "60%"
    }
  }
}
```

**Response (Landlord):**
```json
{
  "success": true,
  "data": {
    "properties": {
      "total": 12,
      "occupied": 11,
      "vacant": 1
    },
    "revenue": {
      "monthly": 12000,
      "yearly": 144000,
      "pending": 0
    },
    "tenants": {
      "active": 8,
      "upcoming_renewals": 2
    }
  }
}
```

---

### GET /api/activity-logs

Get activity logs with filtering.

**Query Parameters:**
- `user_id`: Filter by user
- `action`: Filter by action type
- `resource_type`: Filter by resource
- `start_date`: Start date (ISO 8601)
- `end_date`: End date (ISO 8601)
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "user": {
        "id": 123,
        "username": "john_doe",
        "email": "john@example.com"
      },
      "action": "property.create",
      "resource_type": "property",
      "resource_id": 456,
      "ip_address": "192.168.1.100",
      "status_code": 201,
      "duration_ms": 245,
      "created_at": "2025-12-16T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### GET /api/activity-logs/user/:userId

Get activity logs for specific user.

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

---

### GET /api/dashboard/charts/user-growth

Get user growth data for charts.

**Query Parameters:**
- `period`: daily, weekly, monthly (default: monthly)
- `duration`: Number of periods (default: 12)

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [
      {
        "label": "New Users",
        "data": [12, 19, 15, 25, 22, 30]
      }
    ]
  }
}
```

---

### GET /api/dashboard/export

Export dashboard data.

**Query Parameters:**
- `format`: csv, pdf
- `type`: stats, activity_logs, revenue

**Response:**
- CSV file download or PDF report

## Code Examples

### Backend - Activity Logger Middleware

```javascript
// backend/middleware/activityLogger.js
const { ActivityLog } = require('../models');

const activityLogger = (action, resourceType = null) => {
  return async (req, res, next) => {
    const start = Date.now();
    
    // Capture original res.json
    const originalJson = res.json.bind(res);
    
    res.json = function (data) {
      const duration = Date.now() - start;
      
      // Log activity asynchronously (don't block response)
      setImmediate(async () => {
        try {
          await ActivityLog.create({
            user_id: req.user?.id || null,
            action: action || `${req.method} ${req.originalUrl}`,
            resource_type: resourceType,
            resource_id: req.params?.id || data?.data?.id || null,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            status_code: res.statusCode,
            duration_ms: duration,
            metadata: {
              method: req.method,
              url: req.originalUrl,
              query: req.query,
              params: req.params
            }
          });
        } catch (error) {
          console.error('Activity log error:', error);
        }
      });
      
      return originalJson(data);
    };
    
    next();
  };
};

// Helper for specific actions
const logAction = async (userId, action, resourceType, resourceId, metadata = {}) => {
  try {
    await ActivityLog.create({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata
    });
  } catch (error) {
    console.error('Log action error:', error);
  }
};

module.exports = { activityLogger, logAction };
```

### Backend - Dashboard Controller

```javascript
// backend/controllers/dashboardController.js
const { User, Property, Agreement, ActivityLog } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'admin') {
      stats = await getAdminStats();
    } else if (userRole === 'landlord') {
      stats = await getLandlordStats(userId);
    } else if (userRole === 'tenant') {
      stats = await getTenantStats(userId);
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
};

const getAdminStats = async () => {
  const [
    totalUsers,
    usersByRole,
    totalProperties,
    propertiesByStatus,
    totalAgreements,
    agreementsByStatus,
    newUsersThisMonth
  ] = await Promise.all([
    User.count(),
    User.findAll({
      attributes: ['role', [sequelize.fn('COUNT', 'id'), 'count']],
      group: ['role']
    }),
    Property.count(),
    Property.findAll({
      attributes: ['status', [sequelize.fn('COUNT', 'id'), 'count']],
      group: ['status']
    }),
    Agreement.count(),
    Agreement.findAll({
      attributes: ['status', [sequelize.fn('COUNT', 'id'), 'count']],
      group: ['status']
    }),
    User.count({
      where: {
        created_at: {
          [Op.gte]: new Date(new Date().setDate(1)) // First day of month
        }
      }
    })
  ]);

  const roleStats = {};
  usersByRole.forEach(item => {
    roleStats[item.role] = parseInt(item.dataValues.count);
  });

  const propertyStats = {};
  propertiesByStatus.forEach(item => {
    propertyStats[item.status] = parseInt(item.dataValues.count);
  });

  const agreementStats = {};
  agreementsByStatus.forEach(item => {
    agreementStats[item.status] = parseInt(item.dataValues.count);
  });

  return {
    users: {
      total: totalUsers,
      ...roleStats,
      new_this_month: newUsersThisMonth
    },
    properties: {
      total: totalProperties,
      ...propertyStats
    },
    agreements: {
      total: totalAgreements,
      ...agreementStats
    }
  };
};

const getLandlordStats = async (landlordId) => {
  const [
    totalProperties,
    occupiedProperties,
    activeAgreements,
    monthlyRevenue
  ] = await Promise.all([
    Property.count({ where: { landlord_id: landlordId } }),
    Agreement.count({
      where: {
        landlord_id: landlordId,
        status: 'active'
      }
    }),
    Agreement.count({
      where: {
        landlord_id: landlordId,
        status: 'active'
      }
    }),
    Agreement.sum('rent_amount', {
      where: {
        landlord_id: landlordId,
        status: 'active'
      }
    })
  ]);

  return {
    properties: {
      total: totalProperties,
      occupied: occupiedProperties,
      vacant: totalProperties - occupiedProperties
    },
    revenue: {
      monthly: monthlyRevenue || 0,
      yearly: (monthlyRevenue || 0) * 12
    },
    tenants: {
      active: activeAgreements
    }
  };
};

const getTenantStats = async (tenantId) => {
  const currentAgreement = await Agreement.findOne({
    where: {
      tenant_id: tenantId,
      status: 'active'
    },
    include: [
      { model: Property },
      { model: User, as: 'landlord' }
    ]
  });

  if (!currentAgreement) {
    return { current_property: null };
  }

  return {
    current_property: {
      id: currentAgreement.property_id,
      title: currentAgreement.Property.title,
      address: currentAgreement.Property.address,
      rent_amount: currentAgreement.rent_amount,
      start_date: currentAgreement.start_date,
      end_date: currentAgreement.end_date,
      landlord: {
        id: currentAgreement.landlord.id,
        name: currentAgreement.landlord.username
      }
    }
  };
};

exports.getUserGrowthChart = async (req, res) => {
  try {
    const { period = 'monthly', duration = 12 } = req.query;

    let groupBy;
    let dateFormat;

    if (period === 'daily') {
      groupBy = sequelize.fn('DATE', sequelize.col('created_at'));
      dateFormat = '%Y-%m-%d';
    } else if (period === 'weekly') {
      groupBy = sequelize.fn('YEARWEEK', sequelize.col('created_at'));
      dateFormat = '%Y-W%u';
    } else {
      groupBy = sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m');
      dateFormat = '%Y-%m';
    }

    const data = await User.findAll({
      attributes: [
        [groupBy, 'period'],
        [sequelize.fn('COUNT', 'id'), 'count']
      ],
      group: ['period'],
      order: [[sequelize.col('period'), 'ASC']],
      limit: parseInt(duration),
      raw: true
    });

    const labels = data.map(item => item.period);
    const values = data.map(item => parseInt(item.count));

    res.json({
      success: true,
      data: {
        labels,
        datasets: [
          {
            label: 'New Users',
            data: values
          }
        ]
      }
    });
  } catch (error) {
    console.error('Get chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chart data'
    });
  }
};
```

### Frontend - Admin Dashboard Component

```javascript
// frontend/src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from '../api/apiClient';
import { Line, Bar } from 'react-chartjs-2';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, chartRes] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/dashboard/charts/user-growth')
      ]);

      setStats(statsRes.data.data);
      setChartData(chartRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-number">{stats.users.total}</div>
          <div className="stat-detail">
            {stats.users.new_this_month} new this month
          </div>
        </div>

        <div className="stat-card">
          <h3>Properties</h3>
          <div className="stat-number">{stats.properties.total}</div>
          <div className="stat-detail">
            {stats.properties.pending} pending approval
          </div>
        </div>

        <div className="stat-card">
          <h3>Agreements</h3>
          <div className="stat-number">{stats.agreements.total}</div>
          <div className="stat-detail">
            {stats.agreements.active} currently active
          </div>
        </div>

        <div className="stat-card">
          <h3>Active Rate</h3>
          <div className="stat-number">
            {Math.round((stats.agreements.active / stats.properties.total) * 100)}%
          </div>
          <div className="stat-detail">Occupancy rate</div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="chart-container">
        <h2>User Growth</h2>
        {chartData && (
          <Line
            data={{
              labels: chartData.labels,
              datasets: chartData.datasets.map(ds => ({
                ...ds,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
              }))
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              }
            }}
          />
        )}
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h2>Recent Activity</h2>
        <ActivityFeed />
      </div>
    </div>
  );
};

export default AdminDashboard;
```

## Analytics & Reporting

### Key Analytics

1. **User Analytics**
   - Registration trends
   - Active users (daily, weekly, monthly)
   - User retention rate
   - Churn rate

2. **Property Analytics**
   - Average listing time
   - Occupancy rates
   - Price trends
   - Popular locations

3. **Agreement Analytics**
   - Average contract length
   - Renewal rate
   - Termination reasons

4. **Financial Analytics**
   - Total revenue
   - Revenue by landlord
   - Payment on-time rate
   - Outstanding balances

### Report Generation

```javascript
// backend/services/reportService.js
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');

class ReportService {
  async generateCSV(data, fields) {
    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  async generatePDF(title, data) {
    const doc = new PDFDocument();
    const pdfPath = `reports/${title}-${Date.now()}.pdf`;
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);
    
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();

    // Add data...
    
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    });
  }
}

module.exports = new ReportService();
```

## Configuration

### Environment Variables

```env
# Activity Logging
LOG_ALL_REQUESTS=true
LOG_RETENTION_DAYS=90
ENABLE_PERFORMANCE_LOGGING=true

# Dashboard
DASHBOARD_REFRESH_INTERVAL=30000
ENABLE_REAL_TIME_STATS=true
```

## Troubleshooting

### Issue: Activity Logs Growing Too Large

**Solution:**
1. Implement log rotation
2. Archive old logs
3. Add retention policy
4. Use database partitioning

### Issue: Dashboard Loading Slow

**Solution:**
1. Add caching for stats
2. Use database indexes
3. Implement pagination
4. Lazy load charts

---

**Last Updated**: December 2025  
**Version**: 1.0.0
