/**
 * TOTP Service
 * Time-Based One-Time Password authentication using speakeasy
 * Supports Google Authenticator, Authy, Microsoft Authenticator, etc.
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { prisma } = require('../config/database');

class TotpService {
  /**
   * Generate a new TOTP secret for a user
   * @param {string} userId - User ID
   * @param {string} email - User email for QR code label
   * @returns {Promise<{secret: string, qrCode: string, backupCodes: string[]}>}
   */
  async generateSecret(userId, email) {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Rentverse (${email})`,
      issuer: 'Rentverse',
      length: 32,
    });

    // Generate backup codes (10 codes, 8 characters each)
    const backupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Encrypt the secret before storing (use AES-256-GCM)
    const encryptedSecret = this.encryptSecret(secret.base32);

    // Store encrypted secret in database (don't enable yet)
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: encryptedSecret,
        backupCodes: hashedBackupCodes,
        totpEnabled: false,
        totpVerified: false,
      },
    });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      backupCodes, // Return plain codes for user to save
    };
  }

  /**
   * Verify TOTP code and enable TOTP for user
   * @param {string} userId - User ID
   * @param {string} token - 6-digit TOTP code
   * @returns {Promise<boolean>}
   */
  async verifyAndEnable(userId, token) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    });

    if (!user || !user.mfaSecret) {
      throw new Error('TOTP not set up for this user');
    }

    // Decrypt secret
    const secret = this.decryptSecret(user.mfaSecret);

    // Verify token with time window (± 1 period = 30 seconds)
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 step before/after for time sync issues
    });

    if (verified) {
      // Enable TOTP
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpEnabled: true,
          totpVerified: true,
          mfaMethod: 'TOTP',
        },
      });
    }

    return verified;
  }

  /**
   * Verify TOTP code during login
   * @param {string} userId - User ID
   * @param {string} token - 6-digit TOTP code
   * @returns {Promise<boolean>}
   */
  async verify(userId, token) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        mfaSecret: true, 
        totpEnabled: true,
        backupCodes: true,
      },
    });

    if (!user || !user.mfaSecret || !user.totpEnabled) {
      throw new Error('TOTP not enabled for this user');
    }

    // Decrypt secret
    const secret = this.decryptSecret(user.mfaSecret);

    // Try regular TOTP verification
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (verified) {
      return true;
    }

    // If TOTP fails, check if it's a backup code
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    if (user.backupCodes && user.backupCodes.includes(hashedToken)) {
      // Remove used backup code
      const updatedCodes = user.backupCodes.filter(code => code !== hashedToken);
      
      await prisma.user.update({
        where: { id: userId },
        data: { backupCodes: updatedCodes },
      });

      console.log(`[TOTP] Backup code used for user ${userId}. Remaining: ${updatedCodes.length}`);
      return true;
    }

    return false;
  }

  /**
   * Disable TOTP for a user
   * @param {string} userId - User ID
   */
  async disable(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totpEnabled: false,
        totpVerified: false,
        mfaSecret: null,
        backupCodes: [],
        mfaMethod: 'EMAIL',
      },
    });
  }

  /**
   * Generate backup codes for account recovery
   * @param {number} count - Number of codes to generate
   * @returns {string[]}
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Encrypt TOTP secret using AES-256-GCM
   * @param {string} secret - Plain text secret
   * @returns {string} - Encrypted secret (base64)
   */
  encryptSecret(secret) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      process.env.TOTP_ENCRYPTION_KEY || 'default-encryption-key-change-in-production',
      'salt',
      32
    );
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(secret, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Return: iv:authTag:encrypted (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypt TOTP secret
   * @param {string} encryptedSecret - Encrypted secret from database
   * @returns {string} - Plain text secret
   */
  decryptSecret(encryptedSecret) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      process.env.TOTP_ENCRYPTION_KEY || 'default-encryption-key-change-in-production',
      'salt',
      32
    );
    
    const [ivBase64, authTagBase64, encrypted] = encryptedSecret.split(':');
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Get TOTP status for a user
   * @param {string} userId - User ID
   * @returns {Promise<{enabled: boolean, verified: boolean, backupCodesRemaining: number}>}
   */
  async getStatus(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totpEnabled: true,
        totpVerified: true,
        backupCodes: true,
      },
    });

    return {
      enabled: user?.totpEnabled || false,
      verified: user?.totpVerified || false,
      backupCodesRemaining: user?.backupCodes?.length || 0,
    };
  }
}

module.exports = new TotpService();
