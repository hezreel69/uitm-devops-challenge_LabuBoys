/**
 * Admin Security Routes
 * Provides admin-level access to security logs and statistics
 */

const express = require('express');
const { prisma } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin role
router.use(auth);
router.use(authorize('ADMIN'));

/**
 * @swagger
 * /api/admin/security/statistics:
 *   get:
 *     summary: Get security statistics for dashboard
 *     tags: [Admin Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get 24h statistics
    const [
      totalLogins24h,
      failedLogins24h,
      successfulLogins24h,
      alertsSent24h,
      newDevices24h,
      uniqueUsers24h,
      oauthLogins24h,
      emailLogins24h,
    ] = await Promise.all([
      prisma.loginHistory.count({
        where: { createdAt: { gte: last24h } },
      }),
      prisma.loginHistory.count({
        where: { createdAt: { gte: last24h }, success: false },
      }),
      prisma.loginHistory.count({
        where: { createdAt: { gte: last24h }, success: true },
      }),
      prisma.securityAlert.count({
        where: { createdAt: { gte: last24h } },
      }),
      prisma.userDevice.count({
        where: { createdAt: { gte: last24h } },
      }),
      prisma.loginHistory.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: last24h } },
      }),
      // OAuth logins (Google, Facebook, etc.)
      prisma.loginHistory.count({
        where: {
          createdAt: { gte: last24h },
          success: true,
          loginMethod: {
            in: ['google', 'facebook', 'github', 'twitter', 'apple'],
          },
        },
      }),
      // Email/password logins
      prisma.loginHistory.count({
        where: {
          createdAt: { gte: last24h },
          success: true,
          OR: [{ loginMethod: 'email' }, { loginMethod: null }],
        },
      }),
    ]);

    // Get locked accounts
    const lockedAccounts = await prisma.user.count({
      where: {
        lockedUntil: { gte: now },
      },
    });

    // Get 7-day trend data (including today)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      // Create date boundaries for each day
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const [total, failed] = await Promise.all([
        prisma.loginHistory.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.loginHistory.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd }, success: false },
        }),
      ]);

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        total,
        failed,
        success: total - failed,
      });
    }

    // Get alert type distribution
    const alertsByType = await prisma.securityAlert.groupBy({
      by: ['type'],
      where: { createdAt: { gte: last7d } },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalLogins24h,
          failedLogins24h,
          successfulLogins24h,
          alertsSent24h,
          newDevices24h,
          uniqueUsers24h: uniqueUsers24h.length,
          lockedAccounts,
          failureRate:
            totalLogins24h > 0
              ? Math.round((failedLogins24h / totalLogins24h) * 100)
              : 0,
          // OAuth vs Email login breakdown
          oauthLogins24h,
          emailLogins24h,
        },
        trends: {
          daily: dailyStats,
        },
        alertsByType: alertsByType.map(a => ({
          type: a.type,
          count: a._count,
        })),
      },
    });
  } catch (error) {
    console.error('Security statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security statistics',
    });
  }
});

/**
 * @swagger
 * /api/admin/security/login-history:
 *   get:
 *     summary: Get paginated login history
 *     tags: [Admin Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filter by success status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or IP
 */
router.get('/login-history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where = {};

    // Filter by success status
    if (req.query.success !== undefined) {
      where.success = req.query.success === 'true';
    }

    // Get login history with user info
    const [logins, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.loginHistory.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logins,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login history',
    });
  }
});

/**
 * @swagger
 * /api/admin/security/alerts:
 *   get:
 *     summary: Get all security alerts
 *     tags: [Admin Security]
 *     security:
 *       - bearerAuth: []
 */
router.get('/alerts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where = {};

    // Filter by type
    if (req.query.type) {
      where.type = req.query.type;
    }

    const [alerts, total] = await Promise.all([
      prisma.securityAlert.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.securityAlert.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security alerts',
    });
  }
});

/**
 * @swagger
 * /api/admin/security/users-at-risk:
 *   get:
 *     summary: Get users with suspicious activity
 *     tags: [Admin Security]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users-at-risk', async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get users with high-risk logins or multiple failures
    const usersWithFailures = await prisma.loginHistory.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: last24h },
        success: false,
      },
      _count: true,
      having: {
        userId: {
          _count: { gte: 3 },
        },
      },
    });

    // Get unique user IDs
    const userIds = usersWithFailures.map(u => u.userId);

    // Fetch user details
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        lockedUntil: true,
        loginAttempts: true,
        lastLoginAt: true,
      },
    });

    // Enrich with risk data
    const usersAtRisk = users.map(user => {
      const failures = usersWithFailures.find(f => f.userId === user.id);

      return {
        ...user,
        failedAttempts24h: failures?._count || 0,
        isLocked: user.lockedUntil && user.lockedUntil > new Date(),
      };
    });

    // Sort by risk (failures)
    usersAtRisk.sort((a, b) => b.failedAttempts24h - a.failedAttempts24h);

    res.json({
      success: true,
      data: {
        users: usersAtRisk.slice(0, 20), // Top 20 at-risk users
        total: usersAtRisk.length,
      },
    });
  } catch (error) {
    console.error('Users at risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users at risk',
    });
  }
});

/**
 * @swagger
 * /api/admin/security/user/{userId}/history:
 *   get:
 *     summary: Get security history for a specific user
 *     tags: [Admin Security]
 *     security:
 *       - bearerAuth: []
 */
router.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const [user, loginHistory, alerts, devices] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          mfaEnabled: true,
          lastLoginAt: true,
          loginAttempts: true,
          lockedUntil: true,
          createdAt: true,
        },
      }),
      prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.securityAlert.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.userDevice.findMany({
        where: { userId },
        orderBy: { lastUsedAt: 'desc' },
      }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user,
        loginHistory,
        alerts,
        devices,
      },
    });
  } catch (error) {
    console.error('User history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user history',
    });
  }
});

/**
 * @swagger
 * /api/admin/security/risk-analysis:
 *   get:
 *     summary: Get real-time system risk analysis
 *     tags: [Admin Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: integer
 *         description: Time window in hours (default 24)
 *     responses:
 *       200:
 *         description: System risk analysis with score and recommendations
 */
router.get('/risk-analysis', async (req, res) => {
  try {
    const riskService = require('../services/riskCalculation.service');
    const timeWindow = parseInt(req.query.timeWindow) || 24;

    const riskAnalysis = await riskService.calculateSystemRisk(timeWindow);

    res.json({
      success: true,
      data: riskAnalysis,
    });
  } catch (error) {
    console.error('Risk analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate risk analysis',
    });
  }
});

/**
 * @swagger
 * /api/admin/security/risky-users:
 *   get:
 *     summary: Get list of users with suspicious activity
 *     tags: [Admin Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of users to return (default 10)
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: integer
 *         description: Time window in hours (default 24)
 *     responses:
 *       200:
 *         description: List of risky users with failure rates
 */
router.get('/risky-users', async (req, res) => {
  try {
    const riskService = require('../services/riskCalculation.service');
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const timeWindow = parseInt(req.query.timeWindow) || 24;

    const riskyUsers = await riskService.getTopRiskyUsers(limit, timeWindow);

    res.json({
      success: true,
      data: riskyUsers,
    });
  } catch (error) {
    console.error('Risky users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risky users',
    });
  }
});

/**
 * @swagger
 * /api/admin/security/flagged-events:
 *   get:
 *     summary: Get flagged security events requiring attention
 *     tags: [Admin Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum events to return (default 20)
 *     responses:
 *       200:
 *         description: List of flagged security events
 */
router.get('/flagged-events', async (req, res) => {
  try {
    const riskService = require('../services/riskCalculation.service');
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const events = await riskService.getFlaggedEvents(limit);

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Flagged events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flagged events',
    });
  }
});

/**
 * @swagger
 * /api/admin/security/auto-respond/{eventId}:
 *   post:
 *     summary: Auto-respond to a flagged security event
 *     tags: [Admin Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Security alert ID
 *     responses:
 *       200:
 *         description: Auto-response executed successfully
 */
router.post('/auto-respond/:eventId', async (req, res) => {
  try {
    const riskService = require('../services/riskCalculation.service');
    const { eventId } = req.params;

    const response = await riskService.autoRespondToEvent(eventId);

    res.json({
      success: true,
      message: 'Auto-response executed',
      data: response,
    });
  } catch (error) {
    console.error('Auto-respond error:', error);
    res.status(error.message === 'Alert not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to execute auto-response',
    });
  }
});

module.exports = router;
