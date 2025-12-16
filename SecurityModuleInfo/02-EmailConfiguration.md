# Email Configuration for OTP Delivery

## Overview
OTP codes are now sent via email using Nodemailer. If SMTP is not configured, the system gracefully falls back to console logging.

---

## Environment Variables

Add these to your `.env` file in `rentverse-backend`:

```env
# SMTP Configuration for OTP Emails
SMTP_HOST=smtp.gmail.com       # Your SMTP server
SMTP_PORT=587                   # Usually 587 (TLS) or 465 (SSL)
SMTP_USER=your-email@gmail.com  # SMTP username
SMTP_PASS=your-app-password     # SMTP password or app password

# Optional: Customize sender
EMAIL_FROM=noreply@rentverse.com
EMAIL_FROM_NAME=RentVerse
```

---

## Provider-Specific Setup

### Gmail
1. Enable 2-Factor Authentication on your Google account
2. Go to: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use that app password as `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Mailtrap (Testing)
1. Sign up at [Mailtrap.io](https://mailtrap.io)
2. Get credentials from your inbox settings

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
```

### Custom SMTP
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

---

## Testing Without SMTP

If SMTP is not configured, emails are logged to the console:

```
========================================
[EMAIL] Would send email (SMTP not configured):
To: user@example.com
Subject: Your RentVerse Verification Code: 123456
Content: Your verification code is 123456...
========================================
```

---

## Files Added/Modified

| File | Description |
|------|-------------|
| `src/services/email.service.js` | Nodemailer email service with templates |
| `src/routes/auth.js` | Updated to send OTP via email |

---

*Last updated: December 2025 By ClaRity*
