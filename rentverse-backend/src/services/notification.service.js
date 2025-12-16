const { prisma } = require('../config/database');

class NotificationService {
  /**
   * Create a new notification
   * @param {Object} params - Notification parameters
   * @param {string} params.userId - ID of the user to notify
   * @param {string} params.type - Type of notification
   * @param {string} params.title - Notification title
   * @param {string} params.message - Notification message
   * @param {string} [params.link] - Optional link to navigate to
   * @returns {Promise<Object>} Created notification
   */
  async createNotification({ userId, type, title, message, link = null }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          link,
          read: false,
        },
      });

      return {
        success: true,
        data: notification,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user notifications with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @param {boolean} [options.unreadOnly=false] - Filter unread only
   * @returns {Promise<Object>} Paginated notifications
   */
  async getUserNotifications(
    userId,
    { page = 1, limit = 20, unreadOnly = false } = {}
  ) {
    try {
      const skip = (page - 1) * limit;
      const where = { userId };

      if (unreadOnly) {
        where.read = false;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      return {
        success: true,
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    try {
      // Verify ownership
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        return {
          success: false,
          error: 'Notification not found',
        };
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update count
   */
  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return {
        success: true,
        data: { count: result.count },
      };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Unread count
   */
  async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });

      return {
        success: true,
        data: { count },
      };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete old read notifications (cleanup)
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<Object>} Deletion count
   */
  async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          read: true,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return {
        success: true,
        data: { count: result.count },
      };
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Notification type helpers
  async notifyRentalApplication({
    landlordId,
    tenantName,
    propertyTitle,
    leaseId,
  }) {
    return this.createNotification({
      userId: landlordId,
      type: 'RENTAL_APPLICATION',
      title: 'New Rental Application',
      message: `${tenantName} has applied to rent your property "${propertyTitle}"`,
      link: `/my-agreements`,
    });
  }

  async notifyTenantSigned({ landlordId, tenantName, propertyTitle, leaseId }) {
    return this.createNotification({
      userId: landlordId,
      type: 'AGREEMENT_SIGNED_TENANT',
      title: 'Tenant Signed Agreement',
      message: `${tenantName} has signed the rental agreement for "${propertyTitle}"`,
      link: `/my-agreements`,
    });
  }

  async notifyLandlordSigned({
    tenantId,
    landlordName,
    propertyTitle,
    leaseId,
  }) {
    return this.createNotification({
      userId: tenantId,
      type: 'AGREEMENT_SIGNED_LANDLORD',
      title: 'Landlord Signed Agreement',
      message: `${landlordName} has signed the rental agreement for "${propertyTitle}"`,
      link: `/my-agreements`,
    });
  }
}

module.exports = new NotificationService();
