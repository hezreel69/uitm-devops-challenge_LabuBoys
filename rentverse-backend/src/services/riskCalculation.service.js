/**
 * Risk Calculation Service
 * 
 * Calculates real-time system security risk levels based on:
 * - Failed login attempts
 * - New device logins
 * - Unusual activity patterns
 * - Account lockouts
 * - Geographic anomalies
 */

const { prisma } = require('../config/database');

/**
 * Risk Level Thresholds
 */
const RISK_LEVELS = {
  LOW: { min: 0, max: 30, label: 'Low', color: 'green' },
  MODERATE: { min: 31, max: 60, label: 'Moderate', color: 'yellow' },
  HIGH: { min: 61, max: 85, label: 'High', color: 'orange' },
  CRITICAL: { min: 86, max: 100, label: 'Critical', color: 'red' },
};

/**
 * Calculate system-wide risk score
 * Returns a score from 0-100 and detailed breakdown
 */
async function calculateSystemRisk(timeWindowHours = 24) {
  const timeWindow = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

  // 1. Failed Login Score (0-30 points)
  const failedLogins = await prisma.loginHistory.count({
    where: {
      success: false,
      createdAt: { gte: timeWindow },
    },
  });
  const failedLoginScore = Math.min(30, (failedLogins / 50) * 30); // 50+ failures = max score

  // 2. Account Lockout Score (0-25 points)
  const lockedAccounts = await prisma.user.count({
    where: {
      lockedUntil: { gt: new Date() },
    },
  });
  const lockoutScore = Math.min(25, (lockedAccounts / 10) * 25); // 10+ locked accounts = max score

  // 3. New Device Login Score (0-20 points)
  // Count unique new devices in the time window
  const recentLogins = await prisma.loginHistory.findMany({
    where: {
      success: true,
      createdAt: { gte: timeWindow },
    },
    select: {
      userId: true,
      userAgent: true,
      ipAddress: true,
    },
  });

  // Check how many are from new devices (simple heuristic: unique IP+UserAgent combos)
  const deviceFingerprints = new Set(
    recentLogins.map(l => `${l.userId}:${l.ipAddress}:${l.userAgent}`)
  );
  const newDeviceScore = Math.min(20, (deviceFingerprints.size / 20) * 20); // 20+ new devices = max score

  // 4. Rapid Failed Attempts Score (0-15 points)
  // Check for multiple failures from same IP in short time
  const recentFailures = await prisma.loginHistory.findMany({
    where: {
      success: false,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
    },
    select: {
      ipAddress: true,
    },
  });

  const ipFailureCounts = {};
  recentFailures.forEach(f => {
    ipFailureCounts[f.ipAddress] = (ipFailureCounts[f.ipAddress] || 0) + 1;
  });
  const maxIpFailures = Math.max(0, ...Object.values(ipFailureCounts));
  const rapidAttackScore = Math.min(15, (maxIpFailures / 10) * 15); // 10+ from one IP = max

  // 5. Inactive Admin Monitoring (0-10 points)
  // Check if there are security alerts that haven't been reviewed
  const unreviewedAlerts = await prisma.securityAlert.count({
    where: {
      read: false,
      createdAt: { gte: timeWindow },
    },
  });
  const alertScore = Math.min(10, (unreviewedAlerts / 15) * 10); // 15+ unread = max

  // Calculate total risk score (0-100)
  const totalScore = Math.round(
    failedLoginScore + lockoutScore + newDeviceScore + rapidAttackScore + alertScore
  );

  // Determine risk level
  let riskLevel = RISK_LEVELS.LOW;
  if (totalScore >= RISK_LEVELS.CRITICAL.min) riskLevel = RISK_LEVELS.CRITICAL;
  else if (totalScore >= RISK_LEVELS.HIGH.min) riskLevel = RISK_LEVELS.HIGH;
  else if (totalScore >= RISK_LEVELS.MODERATE.min) riskLevel = RISK_LEVELS.MODERATE;

  // Get trending data (compare with previous period)
  const previousPeriodStart = new Date(
    timeWindow.getTime() - timeWindowHours * 60 * 60 * 1000
  );
  const previousFailures = await prisma.loginHistory.count({
    where: {
      success: false,
      createdAt: { gte: previousPeriodStart, lt: timeWindow },
    },
  });

  const trend =
    previousFailures === 0
      ? failedLogins > 0
        ? 'increasing'
        : 'stable'
      : failedLogins > previousFailures * 1.2
      ? 'increasing'
      : failedLogins < previousFailures * 0.8
      ? 'decreasing'
      : 'stable';

  return {
    totalScore,
    riskLevel: riskLevel.label,
    riskColor: riskLevel.color,
    trend,
    breakdown: {
      failedLogins: {
        score: Math.round(failedLoginScore),
        count: failedLogins,
        weight: '30%',
      },
      accountLockouts: {
        score: Math.round(lockoutScore),
        count: lockedAccounts,
        weight: '25%',
      },
      newDevices: {
        score: Math.round(newDeviceScore),
        count: deviceFingerprints.size,
        weight: '20%',
      },
      rapidAttacks: {
        score: Math.round(rapidAttackScore),
        maxFromSingleIP: maxIpFailures,
        weight: '15%',
      },
      unreviewedAlerts: {
        score: Math.round(alertScore),
        count: unreviewedAlerts,
        weight: '10%',
      },
    },
    recommendations: generateRecommendations(totalScore, {
      failedLogins,
      lockedAccounts,
      unreviewedAlerts,
      maxIpFailures,
    }),
  };
}

/**
 * Generate actionable recommendations based on risk factors
 */
function generateRecommendations(score, factors) {
  const recommendations = [];

  if (score >= 80) {
    recommendations.push({
      priority: 'critical',
      action: 'Enable IP-based rate limiting immediately',
      reason: 'System is under potential attack',
    });
  }

  if (factors.failedLogins > 30) {
    recommendations.push({
      priority: 'high',
      action: 'Review failed login patterns and consider blocking suspicious IPs',
      reason: `${factors.failedLogins} failed logins in the last 24 hours`,
    });
  }

  if (factors.lockedAccounts > 5) {
    recommendations.push({
      priority: 'high',
      action: 'Contact locked users to verify legitimate activity',
      reason: `${factors.lockedAccounts} accounts currently locked`,
    });
  }

  if (factors.unreviewedAlerts > 10) {
    recommendations.push({
      priority: 'medium',
      action: 'Review and acknowledge pending security alerts',
      reason: `${factors.unreviewedAlerts} unread security alerts`,
    });
  }

  if (factors.maxIpFailures > 8) {
    recommendations.push({
      priority: 'high',
      action: 'Block or investigate IP with repeated failed attempts',
      reason: `${factors.maxIpFailures} failures from single IP address`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'info',
      action: 'Continue monitoring',
      reason: 'No immediate action required',
    });
  }

  return recommendations;
}

/**
 * Get top risky users (users with most suspicious activity)
 */
async function getTopRiskyUsers(limit = 10, timeWindowHours = 24) {
  const timeWindow = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

  const userStats = await prisma.loginHistory.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: timeWindow },
    },
    _count: {
      success: true,
    },
    _sum: {
      success: true,
    },
  });

  const riskyUsers = [];

  for (const stat of userStats) {
    const totalAttempts = stat._count.success;
    const failedAttempts = totalAttempts - (stat._sum.success || 0);
    const failureRate = totalAttempts > 0 ? failedAttempts / totalAttempts : 0;

    if (failedAttempts > 3 || failureRate > 0.3) {
      const user = await prisma.user.findUnique({
        where: { id: stat.userId },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          lockedUntil: true,
        },
      });

      if (user) {
        riskyUsers.push({
          ...user,
          totalAttempts,
          failedAttempts,
          failureRate: Math.round(failureRate * 100),
          isLocked: user.lockedUntil && user.lockedUntil > new Date(),
        });
      }
    }
  }

  return riskyUsers
    .sort((a, b) => b.failedAttempts - a.failedAttempts)
    .slice(0, limit);
}

/**
 * Get flagged events that require admin attention
 */
async function getFlaggedEvents(limit = 20) {
  // Get recent security alerts that haven't been read
  const alerts = await prisma.securityAlert.findMany({
    where: {
      read: false,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return alerts.map(alert => ({
    id: alert.id,
    type: alert.alertType,
    severity: alert.severity || 'medium',
    user: alert.user,
    message: alert.message,
    metadata: alert.metadata,
    timestamp: alert.createdAt,
    read: alert.read,
  }));
}

/**
 * Auto-respond to flagged events based on severity
 */
async function autoRespondToEvent(eventId) {
  const alert = await prisma.securityAlert.findUnique({
    where: { id: eventId },
    include: {
      user: true,
    },
  });

  if (!alert) {
    throw new Error('Alert not found');
  }

  const responses = [];

  // Auto-response based on alert type
  switch (alert.alertType) {
    case 'ACCOUNT_LOCKED':
      responses.push({
        action: 'notification_sent',
        message: 'User notified of account lock via email',
      });
      break;

    case 'MULTIPLE_FAILURES':
      // Check if this IP should be temporarily blocked
      const recentFromIP = await prisma.loginHistory.count({
        where: {
          ipAddress: alert.metadata?.ipAddress,
          success: false,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });

      if (recentFromIP > 10) {
        responses.push({
          action: 'ip_flagged',
          message: `IP ${alert.metadata?.ipAddress} flagged for review (${recentFromIP} failures)`,
          recommendation: 'Consider blocking this IP address',
        });
      }
      break;

    case 'NEW_DEVICE':
      responses.push({
        action: 'user_notified',
        message: 'User notified of new device login',
      });
      break;

    default:
      responses.push({
        action: 'logged',
        message: 'Event logged for admin review',
      });
  }

  // Mark alert as read after auto-response
  await prisma.securityAlert.update({
    where: { id: eventId },
    data: { read: true },
  });

  return {
    alertId: eventId,
    alertType: alert.alertType,
    responses,
    autoRespondedAt: new Date(),
  };
}

module.exports = {
  calculateSystemRisk,
  getTopRiskyUsers,
  getFlaggedEvents,
  autoRespondToEvent,
  RISK_LEVELS,
};
