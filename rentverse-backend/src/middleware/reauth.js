/**
 * Re-authentication middleware for sensitive operations
 * Requires user to have logged in within the last 15 minutes
 */

const { prisma } = require('../config/database');

//const RE_AUTH_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const RE_AUTH_WINDOW = 10 * 1000; // 10 seconds

/**
 * Middleware to require recent authentication for sensitive operations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireRecentAuth = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(`[RE_AUTH] Checking authentication for user: ${userId}`);

    // Get user's last successful login time from database
    const lastLogin = await prisma.loginHistory.findFirst({
      where: {
        userId,
        success: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastLogin) {
      console.log(`[RE_AUTH] No login history found for user: ${userId}`);
      return res.status(403).json({
        success: false,
        error: 'RE_AUTH_REQUIRED',
        message: 'Please log in again to perform this action',
        requireReAuth: true,
      });
    }

    const timeSinceLogin = Date.now() - new Date(lastLogin.createdAt).getTime();
    const secondsSinceLogin = Math.floor(timeSinceLogin / 1000);

    console.log(`[RE_AUTH] User ${userId}:`);
    console.log(`  - Last login: ${lastLogin.createdAt}`);
    console.log(
      `  - Time since login: ${secondsSinceLogin} seconds (${Math.floor(timeSinceLogin / 60000)} minutes)`
    );
    console.log(`  - Window limit: ${RE_AUTH_WINDOW / 1000} seconds`);
    console.log(`  - Expired: ${timeSinceLogin > RE_AUTH_WINDOW}`);

    if (timeSinceLogin > RE_AUTH_WINDOW) {
      console.log(`[RE_AUTH] ❌ Session expired - requiring re-authentication`);
      return res.status(403).json({
        success: false,
        error: 'RE_AUTH_REQUIRED',
        message:
          'Your session has expired for this sensitive action. Please log in again.',
        requireReAuth: true,
        lastLogin: lastLogin.createdAt,
        sessionExpiredSeconds: secondsSinceLogin,
        windowSeconds: RE_AUTH_WINDOW / 1000,
      });
    }

    // User authenticated recently, proceed
    console.log(
      `[RE_AUTH] ✅ Authentication valid - ${secondsSinceLogin}s since login`
    );
    next();
  } catch (error) {
    console.error('[RE_AUTH] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify authentication',
      message: error.message,
    });
  }
};

module.exports = { requireRecentAuth, RE_AUTH_WINDOW };
