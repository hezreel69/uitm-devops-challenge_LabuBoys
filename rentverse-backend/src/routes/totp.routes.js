/**
 * TOTP (Time-Based OTP) Routes
 * Endpoints for setting up and managing TOTP-based MFA
 */

const express = require('express');
const { auth } = require('../middleware/auth');
const totpService = require('../services/totp.service');
const { securityLogger } = require('../middleware/apiLogger');

const router = express.Router();

/**
 * @swagger
 * /api/totp/setup:
 *   post:
 *     summary: Generate TOTP secret and QR code
 *     tags: [TOTP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: TOTP secret and QR code generated
 *       401:
 *         description: Unauthorized
 */
router.post('/setup', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;

    // Check if TOTP is already enabled
    const status = await totpService.getStatus(userId);
    if (status.enabled) {
      return res.status(400).json({
        success: false,
        message: 'TOTP is already enabled. Disable it first to set up again.',
      });
    }

    // Generate secret and QR code
    const { secret, qrCode, backupCodes } = await totpService.generateSecret(
      userId,
      email
    );

    // Log the action
    securityLogger.logInfo(req, 'TOTP setup initiated', {
      userId,
      email,
    });

    res.json({
      success: true,
      message:
        'TOTP secret generated. Scan the QR code with your authenticator app.',
      data: {
        qrCode, // Data URL for QR code image
        secret, // Manual entry key (if QR scan fails)
        backupCodes, // Backup codes for account recovery
      },
    });
  } catch (error) {
    console.error('TOTP setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set up TOTP',
    });
  }
});

/**
 * @swagger
 * /api/totp/verify-setup:
 *   post:
 *     summary: Verify TOTP code and enable TOTP
 *     tags: [TOTP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP code from authenticator app
 *     responses:
 *       200:
 *         description: TOTP verified and enabled
 *       400:
 *         description: Invalid TOTP code
 */
router.post('/verify-setup', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit code',
      });
    }

    // Verify and enable TOTP
    const verified = await totpService.verifyAndEnable(userId, token);

    if (verified) {
      securityLogger.logInfo(req, 'TOTP enabled successfully', {
        userId,
        email: req.user.email,
      });

      res.json({
        success: true,
        message:
          'TOTP enabled successfully! Use your authenticator app for future logins.',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid code. Please try again.',
      });
    }
  } catch (error) {
    console.error('TOTP verify error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify TOTP',
    });
  }
});

/**
 * @swagger
 * /api/totp/verify:
 *   post:
 *     summary: Verify TOTP code during login (called by MFA flow)
 *     tags: [TOTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - token
 *             properties:
 *               userId:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: TOTP code verified
 *       400:
 *         description: Invalid code
 */
router.post('/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'userId and token are required',
      });
    }

    if (token.length !== 6 && token.length !== 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code format',
      });
    }

    const verified = await totpService.verify(userId, token);

    if (verified) {
      res.json({
        success: true,
        message: 'Code verified successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid code. Please try again.',
      });
    }
  } catch (error) {
    console.error('TOTP verify error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Verification failed',
    });
  }
});

/**
 * @swagger
 * /api/totp/disable:
 *   post:
 *     summary: Disable TOTP for current user
 *     tags: [TOTP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Current TOTP code to confirm
 *     responses:
 *       200:
 *         description: TOTP disabled
 */
router.post('/disable', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    // Verify current TOTP code before disabling
    const verified = await totpService.verify(userId, token);

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code. Cannot disable TOTP.',
      });
    }

    await totpService.disable(userId);

    securityLogger.logWarning(req, 'TOTP disabled', {
      userId,
      email: req.user.email,
    });

    res.json({
      success: true,
      message: 'TOTP disabled. You will now use email OTP for MFA.',
    });
  } catch (error) {
    console.error('TOTP disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable TOTP',
    });
  }
});

/**
 * @swagger
 * /api/totp/status:
 *   get:
 *     summary: Get TOTP status for current user
 *     tags: [TOTP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: TOTP status retrieved
 */
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await totpService.getStatus(userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('TOTP status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get TOTP status',
    });
  }
});

/**
 * @swagger
 * /api/totp/backup-codes:
 *   post:
 *     summary: Regenerate backup codes
 *     tags: [TOTP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: New backup codes generated
 */
router.post('/backup-codes', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    // Verify TOTP code before regenerating backup codes
    const verified = await totpService.verify(userId, token);

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code. Cannot regenerate backup codes.',
      });
    }

    // Generate new backup codes
    const backupCodes = totpService.generateBackupCodes(10);
    const crypto = require('crypto');
    const hashedCodes = backupCodes.map(code =>
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Update user with new backup codes
    await require('../config/database').prisma.user.update({
      where: { id: userId },
      data: { backupCodes: hashedCodes },
    });

    securityLogger.logInfo(req, 'Backup codes regenerated', { userId });

    res.json({
      success: true,
      message: 'New backup codes generated. Save them in a secure location.',
      data: { backupCodes },
    });
  } catch (error) {
    console.error('Backup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate backup codes',
    });
  }
});

module.exports = router;
