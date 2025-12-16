# Smart Notification & Alert System

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Notification Types](#notification-types)
- [Delivery Channels](#delivery-channels)
- [Real-time Notifications](#real-time-notifications)
- [API Endpoints](#api-endpoints)
- [Code Examples](#code-examples)
- [Email Templates](#email-templates)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Smart Notification & Alert System provides a comprehensive multi-channel communication platform with:

- **Real-time Notifications** using WebSocket/Socket.IO
- **Email Notifications** for important events
- **In-app Notifications** with badge counters
- **Push Notifications** (mobile ready)
- **Smart Scheduling** to avoid notification fatigue
- **User Preferences** for notification control
- **Notification Templates** for consistency
- **Read/Unread Tracking**
- **Notification Grouping** for related events

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                 Notification Sources                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Agreement │  │Property  │  │Payment   │  │  System  │    │
│  │ Events   │  │ Events   │  │ Events   │  │  Alerts  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            Notification Service (Backend)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Notification Manager                                │   │
│  │  - Event Detection                                   │   │
│  │  - Template Selection                                │   │
│  │  - Channel Routing                                   │   │
│  │  - Preference Check                                  │   │
│  └────────────┬──────────────┬──────────────┬───────────┘   │
│               │              │              │               │
│      ┌────────▼────┐  ┌──────▼──────┐  ┌───▼──────┐        │
│      │ In-App      │  │   Email     │  │ WebSocket│        │
│      │ Notification│  │   Service   │  │ (Real-time)       │
│      │ Storage     │  │  (SMTP)     │  │          │        │
│      └────────┬────┘  └──────┬──────┘  └───┬──────┘        │
└───────────────┼───────────────┼─────────────┼───────────────┘
                │               │             │
                ▼               ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Delivery                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Database   │  │Email Client │  │Web Browser  │         │
│  │ (Persistent)│  │   (Inbox)   │  │(Real-time)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Notification Flow

```
Event Triggered
     │
     ▼
Check User Preferences
     │
     ├─ Email Enabled? ──────> Send Email
     │
     ├─ In-App Enabled? ─────> Create DB Record
     │
     └─ Real-time Enabled? ──> Emit WebSocket Event
     │
     ▼
Log Notification
```

## Notification Types

### 1. Agreement Notifications

| Event | Trigger | Recipients | Channels |
|-------|---------|------------|----------|
| **Agreement Created** | Landlord creates agreement | Tenant | Email + In-app |
| **Agreement Signed** | Tenant/Landlord signs | Other party | Email + In-app + Real-time |
| **Agreement Executed** | Both parties signed | Both parties | Email + In-app |
| **Agreement Expiring** | 30 days before expiration | Both parties | Email + In-app |
| **Agreement Expired** | End date reached | Both parties | Email + In-app |

### 2. Property Notifications

| Event | Trigger | Recipients | Channels |
|-------|---------|------------|----------|
| **Property Submitted** | Landlord creates property | Admin | In-app |
| **Property Approved** | Admin approves | Landlord | Email + In-app + Real-time |
| **Property Rejected** | Admin rejects | Landlord | Email + In-app |
| **Property Updated** | Landlord edits | Admin (if pending) | In-app |
| **New Property Available** | Property approved | Tenants (matching preferences) | Email + In-app |

### 3. Payment Notifications

| Event | Trigger | Recipients | Channels |
|-------|---------|------------|----------|
| **Payment Due** | 5 days before due date | Tenant | Email + In-app |
| **Payment Received** | Payment processed | Landlord | Email + In-app + Real-time |
| **Payment Overdue** | After due date | Tenant | Email + In-app |
| **Payment Reminder** | Daily until paid | Tenant | Email |

### 4. System Notifications

| Event | Trigger | Recipients | Channels |
|-------|---------|------------|----------|
| **Account Created** | User registration | User | Email |
| **Password Changed** | Password update | User | Email |
| **MFA Enabled** | MFA setup completed | User | Email + In-app |
| **Login from New Device** | New device detected | User | Email |
| **Security Alert** | Suspicious activity | User + Admin | Email + In-app |

### 5. Admin Notifications

| Event | Trigger | Recipients | Channels |
|-------|---------|------------|----------|
| **New User Registered** | User signs up | Admin | In-app |
| **Pending Approval** | Property/Agreement needs review | Admin | In-app |
| **Report Filed** | User reports issue | Admin | Email + In-app |
| **System Error** | Critical error occurred | Admin | Email |

## Delivery Channels

### 1. In-App Notifications

**Features:**
- Persistent storage in database
- Read/Unread status
- Badge counter
- Notification panel
- Click to view details
- Mark as read/unread
- Delete notifications

**Database Schema:**
```javascript
notifications
├── id (primary key)
├── user_id (foreign key)
├── type (agreement, property, payment, system)
├── title (string)
├── message (text)
├── data (JSON - additional context)
├── read (boolean)
├── action_url (optional link)
├── created_at (timestamp)
└── read_at (timestamp)
```

### 2. Email Notifications

**Features:**
- HTML templates
- Dynamic content
- Attachment support
- Unsubscribe links
- Tracking (opens, clicks)
- Retry on failure
- Queue management

**Email Service:**
- SMTP (Gmail, SendGrid, etc.)
- Nodemailer library
- Template engine (Handlebars/EJS)
- Inline CSS for compatibility

### 3. Real-Time Notifications (WebSocket)

**Features:**
- Instant delivery
- Bi-directional communication
- Auto-reconnect
- Room-based broadcasting
- Online status tracking

**Implementation:**
- Socket.IO for WebSocket
- Event-based architecture
- Room management by user ID
- Connection state handling

### 4. Push Notifications (Future)

**Planned Features:**
- Mobile app notifications
- Browser push notifications
- FCM (Firebase Cloud Messaging)
- APNs (Apple Push Notification)

## Real-time Notifications

### WebSocket Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Client (Browser)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Socket.IO Client                                │   │
│  │  - Connect to server                             │   │
│  │  - Join user room                                │   │
│  │  - Listen for events                             │   │
│  │  - Display notifications                         │   │
│  └─────────────────┬────────────────────────────────┘   │
└────────────────────┼────────────────────────────────────┘
                     │ WebSocket Connection
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Socket.IO Server (Backend)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Connection Manager                              │   │
│  │  - Authenticate client                           │   │
│  │  - Create user room                              │   │
│  │  - Handle events                                 │   │
│  └─────────────────┬────────────────────────────────┘   │
│                    │                                     │
│  ┌─────────────────▼────────────────────────────────┐   │
│  │  Event Emitter                                   │   │
│  │  - notification:new                              │   │
│  │  - notification:read                             │   │
│  │  - notification:deleted                          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Socket Events

**Server to Client:**
- `notification:new` - New notification received
- `notification:read` - Notification marked as read
- `notification:count` - Updated unread count

**Client to Server:**
- `notification:markRead` - Mark notification as read
- `notification:markAllRead` - Mark all as read
- `connection` - Client connects
- `disconnect` - Client disconnects

## API Endpoints

### GET /api/notifications

Get user's notifications.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `read`: Filter by read status (true/false)
- `type`: Filter by type (agreement, property, payment, system)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "type": "agreement",
      "title": "Agreement Signed",
      "message": "Jane Doe signed the rental agreement",
      "data": {
        "agreement_id": 456
      },
      "read": false,
      "action_url": "/agreements/456",
      "created_at": "2025-12-16T10:30:00Z"
    }
  ],
  "unread_count": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### GET /api/notifications/unread-count

Get count of unread notifications.

**Response:**
```json
{
  "success": true,
  "count": 5
}
```

---

### PUT /api/notifications/:id/read

Mark notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### PUT /api/notifications/mark-all-read

Mark all notifications as read.

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updated_count": 5
}
```

---

### DELETE /api/notifications/:id

Delete a notification.

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

### POST /api/notifications/preferences

Update notification preferences.

**Request:**
```json
{
  "email_notifications": true,
  "inapp_notifications": true,
  "agreement_notifications": true,
  "property_notifications": true,
  "payment_notifications": true,
  "system_notifications": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated"
}
```

## Code Examples

### Backend - Notification Service

```javascript
// backend/services/notificationService.js
const { Notification, User } = require('../models');
const emailService = require('./emailService');
const { io } = require('../socket'); // Socket.IO instance

class NotificationService {
  // Create and send notification
  async createNotification({
    user_id,
    type,
    title,
    message,
    data = {},
    action_url = null
  }) {
    try {
      // Check user preferences
      const user = await User.findByPk(user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Create in-app notification
      const notification = await Notification.create({
        user_id,
        type,
        title,
        message,
        data: JSON.stringify(data),
        action_url,
        read: false
      });

      // Send real-time notification via WebSocket
      if (user.realtime_notifications !== false) {
        this.sendRealtime(user_id, notification);
      }

      // Send email notification
      if (user.email_notifications && this.shouldSendEmail(type)) {
        await this.sendEmail(user, type, title, message, data);
      }

      return notification;
    } catch (error) {
      console.error('Notification error:', error);
      throw error;
    }
  }

  // Send real-time notification
  sendRealtime(user_id, notification) {
    try {
      const room = `user:${user_id}`;
      io.to(room).emit('notification:new', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: JSON.parse(notification.data),
        action_url: notification.action_url,
        created_at: notification.created_at
      });
    } catch (error) {
      console.error('WebSocket send error:', error);
    }
  }

  // Send email notification
  async sendEmail(user, type, title, message, data) {
    try {
      const template = this.getEmailTemplate(type);
      await emailService.send({
        to: user.email,
        subject: title,
        template,
        data: {
          user,
          title,
          message,
          ...data
        }
      });
    } catch (error) {
      console.error('Email send error:', error);
    }
  }

  // Check if email should be sent for this type
  shouldSendEmail(type) {
    const emailTypes = [
      'agreement_signed',
      'agreement_executed',
      'property_approved',
      'property_rejected',
      'payment_due',
      'security_alert'
    ];
    return emailTypes.includes(type);
  }

  // Get email template for type
  getEmailTemplate(type) {
    const templates = {
      agreement_signed: 'agreement-signed',
      agreement_executed: 'agreement-executed',
      property_approved: 'property-approved',
      property_rejected: 'property-rejected',
      payment_due: 'payment-due',
      security_alert: 'security-alert'
    };
    return templates[type] || 'default';
  }

  // Notification helpers for specific events
  async notifyAgreementSigned(agreement, signer) {
    const recipient = signer.id === agreement.landlord_id 
      ? agreement.tenant_id 
      : agreement.landlord_id;

    return this.createNotification({
      user_id: recipient,
      type: 'agreement',
      title: 'Agreement Signed',
      message: `${signer.username} signed the rental agreement`,
      data: { agreement_id: agreement.id },
      action_url: `/agreements/${agreement.id}`
    });
  }

  async notifyPropertyApproved(property) {
    return this.createNotification({
      user_id: property.landlord_id,
      type: 'property',
      title: 'Property Approved',
      message: `Your property "${property.title}" has been approved`,
      data: { property_id: property.id },
      action_url: `/properties/${property.id}`
    });
  }

  async notifyPaymentDue(payment, tenant) {
    return this.createNotification({
      user_id: tenant.id,
      type: 'payment',
      title: 'Payment Due',
      message: `Rent payment of $${payment.amount} is due in 5 days`,
      data: { 
        payment_id: payment.id,
        amount: payment.amount,
        due_date: payment.due_date
      },
      action_url: `/payments/${payment.id}`
    });
  }

  // Mark notification as read
  async markAsRead(notification_id, user_id) {
    const notification = await Notification.findOne({
      where: { id: notification_id, user_id }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.read = true;
    notification.read_at = new Date();
    await notification.save();

    // Notify via WebSocket
    const room = `user:${user_id}`;
    io.to(room).emit('notification:read', { id: notification_id });

    return notification;
  }

  // Get unread count
  async getUnreadCount(user_id) {
    return Notification.count({
      where: { user_id, read: false }
    });
  }
}

module.exports = new NotificationService();
```

### Backend - Notification Controller

```javascript
// backend/controllers/notificationController.js
const { Notification } = require('../models');
const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { read, type, page = 1, limit = 20 } = req.query;

    const where = { user_id };
    if (read !== undefined) {
      where.read = read === 'true';
    }
    if (type) {
      where.type = type;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const unread_count = await notificationService.getUnreadCount(user_id);

    res.json({
      success: true,
      data: rows.map(n => ({
        ...n.toJSON(),
        data: JSON.parse(n.data)
      })),
      unread_count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id, req.user.id);
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const updated = await Notification.update(
      { read: true, read_at: new Date() },
      { where: { user_id: req.user.id, read: false } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      updated_count: updated[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read'
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.destroy({
      where: { id, user_id: req.user.id }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};
```

### Backend - Socket.IO Setup

```javascript
// backend/socket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user-specific room
    const room = `user:${socket.userId}`;
    socket.join(room);

    // Handle mark as read
    socket.on('notification:markRead', async (notificationId) => {
      try {
        await notificationService.markAsRead(notificationId, socket.userId);
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO, io };
```

### Frontend - Notification Component

```javascript
// frontend/src/components/NotificationBell.js
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from '../api/apiClient';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchNotifications();
    initializeSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    const newSocket = io(process.env.REACT_APP_BACKEND_URL, {
      auth: { token }
    });

    newSocket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      showToast(notification.title, notification.message);
    });

    newSocket.on('notification:read', ({ id }) => {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    setSocket(newSocket);
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications?limit=10');
      setNotifications(response.data.data);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const showToast = (title, message) => {
    // Simple toast notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  };

  return (
    <div className="notification-bell">
      <button
        className="bell-button"
        onClick={() => setShowPanel(!showPanel)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>

      {showPanel && (
        <div className="notification-panel">
          <div className="panel-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>Mark all as read</button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.action_url) {
                      window.location.href = notification.action_url;
                    }
                  }}
                >
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="panel-footer">
            <a href="/notifications">View all notifications</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
```

## Email Templates

### Email Service Setup

```javascript
// backend/services/emailService.js
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async send({ to, subject, template, data }) {
    try {
      // Load template
      const templatePath = path.join(__dirname, '../templates/emails', `${template}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateSource);
      const html = compiledTemplate(data);

      // Send email
      const info = await this.transporter.sendMail({
        from: `"Property Management" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      });

      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
```

### Sample Email Template

```html
<!-- backend/templates/emails/agreement-signed.hbs -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { 
      display: inline-block; 
      padding: 10px 20px; 
      background: #4CAF50; 
      color: white; 
      text-decoration: none; 
      border-radius: 5px; 
    }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Agreement Signed</h1>
    </div>
    <div class="content">
      <p>Hello {{user.username}},</p>
      <p>{{message}}</p>
      <p>
        <strong>Agreement Details:</strong><br>
        Property: {{data.property_address}}<br>
        Start Date: {{data.start_date}}<br>
        Monthly Rent: ${{data.rent_amount}}
      </p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{data.action_url}}" class="button">View Agreement</a>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message from Property Management System.</p>
      <p>If you have questions, please contact support.</p>
    </div>
  </div>
</body>
</html>
```

## Configuration

### Environment Variables

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Notification Settings
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_REALTIME_NOTIFICATIONS=true
NOTIFICATION_RETENTION_DAYS=30

# WebSocket
SOCKET_PORT=5000
SOCKET_CORS_ORIGIN=http://localhost:3000
```

## Troubleshooting

### Issue: Real-time Notifications Not Working

**Solution:**
1. Check Socket.IO connection in browser console
2. Verify JWT token is being sent
3. Check backend Socket.IO initialization
4. Review CORS settings

### Issue: Emails Not Sending

**Solution:**
1. Verify SMTP credentials
2. Check firewall/port blocking
3. Enable "Less secure apps" (Gmail)
4. Use app-specific password
5. Check email service logs

### Issue: Notification Overload

**Solution:**
1. Implement notification grouping
2. Add user preferences
3. Use digest emails (daily summary)
4. Implement quiet hours

---

**Last Updated**: December 2025  
**Version**: 1.0.0
