# SendGrid Email Integration Guide

## Overview

This guide covers the SendGrid email integration for the Tim Burton Docuseries platform. The system sends transactional emails for account creation, purchases, password resets, and rental expiration notifications.

---

## ⚡ Current Status

**Implementation:** ✅ Complete and deployed  
**Sender Email:** admin@woodentertainment.net  
**Active Templates:** 7 of 9 (welcome, purchases, password reset, rental warnings)  
**Status:** Working - emails sending but may go to spam without domain authentication

**Next Action:** Set up domain authentication in SendGrid to move emails from spam to inbox (see [Preventing Spam](#preventing-spam-folder-issues))

**Active Email Types:**
- ✅ Welcome Email
- ✅ Purchase Confirmations (Rental, Regular, Box Set)
- ✅ Password Reset
- ✅ Rental Warnings (48h, 24h)
- ⏭️ Email Verification (not created)
- ⏭️ Rental Expired (not created)

---

## Table of Contents

1. [SendGrid Account Setup](#sendgrid-account-setup)
2. [Dynamic Templates](#dynamic-templates)
3. [Environment Configuration](#environment-configuration)
4. [Email Types](#email-types)
5. [Template Variables](#template-variables)
6. [Testing](#testing)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Preventing Spam Folder Issues](#preventing-spam-folder-issues)
10. [Security Best Practices](#security-best-practices)

---

## SendGrid Account Setup

### 1. Create SendGrid Account

1. Go to https://sendgrid.com/
2. Sign up for a free account (100 emails/day)
3. Verify your email address

### 2. Sender Authentication

**Option A: Single Sender Verification (Quick Start)**
1. Navigate to Settings > Sender Authentication
2. Click "Verify a Single Sender"
3. Enter your email: `noreply@project.com` (or your actual email initially)
4. Complete the verification process

**Option B: Domain Authentication (Production)**
1. Navigate to Settings > Sender Authentication
2. Click "Authenticate Your Domain"
3. Follow the DNS setup instructions
4. Add the required DNS records to your domain
5. Wait for verification (can take up to 48 hours)

### 3. Generate API Key

1. Navigate to Settings > API Keys
2. Click "Create API Key"
3. Name: `Tim Burton Docuseries Production`
4. Permissions: **Mail Send** (Full Access)
5. Click "Create & View"
6. **Copy the API key immediately** (you won't be able to see it again)
7. Save it securely

---

## Dynamic Templates

### Creating Templates

Navigate to Email API > Dynamic Templates and create the following 9 templates:

### 1. Welcome Email

**Template Name:** `Welcome - Tim Burton Docuseries`

**Subject:** `Welcome to the Tim Burton Docuseries!`

**Template Variables:**
```json
{
  "firstName": "User"
}
```

**Suggested Content:**
```html
<h1>Welcome, {{firstName}}!</h1>
<p>Thank you for joining the Tim Burton Docuseries community.</p>
<p>You can now rent or purchase episodes to start watching.</p>
<a href="https://timburton-dev.webflow.io/">Start Watching</a>
```

---

### 2. Rental Purchase Confirmation

**Template Name:** `Purchase Confirmation - Rental`

**Subject:** `Your 4-Day Rental is Ready!`

**Template Variables:**
```json
{
  "firstName": "User",
  "productName": "4-Day Rental",
  "amount": "$24.99",
  "purchaseDate": "January 1, 2025",
  "expiresAt": "January 5, 2025"
}
```

**Suggested Content:**
```html
<h1>Thanks for your purchase, {{firstName}}!</h1>
<p>Your {{productName}} is now active.</p>
<p><strong>Purchase Details:</strong></p>
<ul>
  <li>Amount: {{amount}}</li>
  <li>Purchase Date: {{purchaseDate}}</li>
  <li>Expires: {{expiresAt}}</li>
</ul>
<p>You have 4 days to watch all episodes. Start watching now!</p>
<a href="https://timburton-dev.webflow.io/watch">Watch Now</a>
```

---

### 3. Regular Purchase Confirmation

**Template Name:** `Purchase Confirmation - Regular`

**Subject:** `Your Purchase is Complete!`

**Template Variables:**
```json
{
  "firstName": "User",
  "productName": "Regular Purchase",
  "amount": "$39.99",
  "purchaseDate": "January 1, 2025"
}
```

**Suggested Content:**
```html
<h1>Thanks for your purchase, {{firstName}}!</h1>
<p>You now have permanent access to all 4 episodes!</p>
<p><strong>Purchase Details:</strong></p>
<ul>
  <li>Product: {{productName}}</li>
  <li>Amount: {{amount}}</li>
  <li>Purchase Date: {{purchaseDate}}</li>
</ul>
<a href="https://timburton-dev.webflow.io/watch">Start Watching</a>
```

---

### 4. Box Set Purchase Confirmation

**Template Name:** `Purchase Confirmation - Box Set`

**Subject:** `Your Box Set is Ready!`

**Template Variables:**
```json
{
  "firstName": "User",
  "productName": "Box Set",
  "amount": "$74.99",
  "purchaseDate": "January 1, 2025"
}
```

**Suggested Content:**
```html
<h1>Welcome to the Box Set, {{firstName}}!</h1>
<p>You now have access to all 4 episodes plus 40 hours of exclusive bonus content!</p>
<p><strong>Purchase Details:</strong></p>
<ul>
  <li>Product: {{productName}}</li>
  <li>Amount: {{amount}}</li>
  <li>Purchase Date: {{purchaseDate}}</li>
</ul>
<a href="https://timburton-dev.webflow.io/watch">Explore Your Content</a>
```

---

### 5. Password Reset

**Template Name:** `Password Reset`

**Subject:** `Reset Your Password`

**Template Variables:**
```json
{
  "firstName": "User",
  "resetLink": "https://example.com/reset?code=abc123"
}
```

**Suggested Content:**
```html
<h1>Reset Your Password</h1>
<p>Hi {{firstName}},</p>
<p>We received a request to reset your password. Click the button below to create a new password:</p>
<a href="{{resetLink}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

---

### 6. Email Verification (Optional)

**Template Name:** `Email Verification`

**Subject:** `Verify Your Email Address`

**Template Variables:**
```json
{
  "firstName": "User",
  "verificationLink": "https://example.com/verify?code=abc123"
}
```

**Suggested Content:**
```html
<h1>Verify Your Email</h1>
<p>Hi {{firstName}},</p>
<p>Please verify your email address to complete your account setup:</p>
<a href="{{verificationLink}}">Verify Email</a>
<p>This link will expire in 24 hours.</p>
```

---

### 7. Rental Expiration Warning - 48 Hours

**Template Name:** `Rental Expiring in 48 Hours`

**Subject:** `Your Rental Expires in 48 Hours!`

**Template Variables:**
```json
{
  "firstName": "User",
  "hoursRemaining": 48,
  "expiresAt": "January 5, 2025 at 3:00 PM"
}
```

**Suggested Content:**
```html
<h1>Your Rental Expires Soon!</h1>
<p>Hi {{firstName}},</p>
<p>Your 4-day rental will expire in <strong>{{hoursRemaining}} hours</strong> on {{expiresAt}}.</p>
<p>Make sure to finish watching before access ends!</p>
<a href="https://timburton-dev.webflow.io/watch">Continue Watching</a>
<p>Want permanent access? <a href="https://timburton-dev.webflow.io/#buy">Upgrade to Regular or Box Set</a></p>
```

---

### 8. Rental Expiration Warning - 24 Hours

**Template Name:** `Rental Expiring in 24 Hours`

**Subject:** `Final Reminder: Rental Expires in 24 Hours!`

**Template Variables:**
```json
{
  "firstName": "User",
  "hoursRemaining": 24,
  "expiresAt": "January 5, 2025 at 3:00 PM"
}
```

**Suggested Content:**
```html
<h1>Last Chance to Watch!</h1>
<p>Hi {{firstName}},</p>
<p>Your 4-day rental expires in <strong>{{hoursRemaining}} hours</strong> on {{expiresAt}}.</p>
<p>This is your last day to watch!</p>
<a href="https://timburton-dev.webflow.io/watch">Watch Now</a>
<p>Need more time? <a href="https://timburton-dev.webflow.io/#buy">Purchase for permanent access</a></p>
```

---

### 9. Rental Expired

**Template Name:** `Rental Expired`

**Subject:** `Your Rental Has Expired`

**Template Variables:**
```json
{
  "firstName": "User"
}
```

**Suggested Content:**
```html
<h1>Your Rental Has Expired</h1>
<p>Hi {{firstName}},</p>
<p>Your 4-day rental period has ended. We hope you enjoyed the Tim Burton Docuseries!</p>
<p>Want to watch again or access bonus content?</p>
<ul>
  <li><a href="https://timburton-dev.webflow.io/#rent">Rent Again</a> - $24.99 for 4 days</li>
  <li><a href="https://timburton-dev.webflow.io/#buy">Purchase</a> - $39.99 for permanent access</li>
  <li><a href="https://timburton-dev.webflow.io/#buy">Box Set</a> - $74.99 with 40 hours of extras</li>
</ul>
```

---

## Environment Configuration

After creating all templates, add their IDs to your environment file:

**File:** `src/backend/functions/.env`

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@project.com

# Template IDs (get these from SendGrid dashboard after creating templates)
SENDGRID_TEMPLATE_WELCOME=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PURCHASE_RENTAL=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PURCHASE_REGULAR=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PURCHASE_BOXSET=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_EMAIL_VERIFICATION=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_RENTAL_WARNING_48H=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_RENTAL_WARNING_24H=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_RENTAL_EXPIRED=d-xxxxxxxxxxxxxxxxxxxxx

# Optional: Custom password reset URL (default is Webflow site)
PASSWORD_RESET_URL=https://timburton-dev.webflow.io/reset-password
```

**How to get Template IDs:**
1. Go to SendGrid > Email API > Dynamic Templates
2. Click on a template
3. Copy the Template ID from the URL or template details
4. It looks like: `d-1234567890abcdef1234567890abcdef`

---

## Email Types

### Transactional Emails (Automatic)

| Email Type | Trigger | Sent Via |
|------------|---------|----------|
| Welcome Email | New account created | `auth.ts` |
| Purchase Confirmation | Successful payment | `stripe.ts` |
| Password Reset | User requests reset | `password-reset.ts` |
| 48h Rental Warning | 48 hours before expiration | Scheduled function |
| 24h Rental Warning | 24 hours before expiration | Scheduled function |
| Rental Expired | Rental period ends | Scheduled function |

### Optional Emails

| Email Type | Trigger | Notes |
|------------|---------|-------|
| Email Verification | New account | Currently not required |

---

## Template Variables

### Common Variables

Available in most templates:
- `firstName` - User's first name
- `productName` - Name of purchased product
- `amount` - Purchase amount (formatted with $)
- `purchaseDate` - Date of purchase
- `expiresAt` - Expiration date (rentals only)

### Rental-Specific Variables

- `hoursRemaining` - 48 or 24 (for warning emails)

### Password Reset Variables

- `resetLink` - Full URL with reset code

---

## Testing

### Test Email Delivery

1. **Send Test from SendGrid:**
   - Go to your template in SendGrid
   - Click "Send Test"
   - Fill in sample data
   - Enter your email
   - Click "Send"

2. **Test from Application:**
   ```javascript
   // Create a new account (triggers welcome email)
   await timBurtonAuth.signUpWithEmail('test@example.com', 'Password123!', 'Test');
   
   // Request password reset
   await timBurtonAuth.resetPassword('test@example.com');
   ```

3. **Test Purchase Confirmation:**
   - Make a test purchase using Stripe test cards
   - Check your email for confirmation

### Test Scheduled Functions

```bash
# Deploy functions first
cd src/backend/functions
npm run deploy

# Manually trigger scheduled function (Firebase Console)
# Go to Functions > checkRentalExpirations > Testing
# Click "Run Function"
```

---

## Monitoring

### SendGrid Dashboard

1. Navigate to https://app.sendgrid.com/
2. Go to Activity Feed
3. View email statistics:
   - Delivered
   - Opens
   - Clicks
   - Bounces
   - Spam reports

### Email Analytics

- **Delivery Rate:** Should be > 95%
- **Open Rate:** Typical 15-25% for transactional emails
- **Bounce Rate:** Should be < 2%

### Alerts

Set up alerts in SendGrid for:
- Delivery failures
- High bounce rates
- Spam complaints

---

## Troubleshooting

### Emails Not Sending

**Check 1: API Key**
```bash
# Verify API key is set
echo $SENDGRID_API_KEY
```

**Check 2: Template IDs**
- Make sure all template IDs are correct in `.env`
- Template IDs start with `d-`

**Check 3: Sender Email**
- Verify sender email is authenticated
- Check SendGrid > Sender Authentication

**Check 4: Function Logs**
```bash
# View logs
firebase functions:log --only checkRentalExpirations
```

### Template Not Found Error

```
Error: Template not found
```

**Solution:**
- Double-check template ID in `.env`
- Make sure template is active in SendGrid
- Verify template version is published

### Authentication Errors

```
Error: 401 Unauthorized
```

**Solution:**
- Regenerate API key in SendGrid
- Update `.env` file
- Redeploy functions

### Emails Going to Spam

**Solutions:**
1. Set up domain authentication (SPF, DKIM, DMARC)
2. Use a professional sender email (not @gmail.com)
3. Avoid spam trigger words
4. Include unsubscribe link (for marketing emails)

---

## Adding New Email Types

### Step 1: Create Template in SendGrid

1. Go to Email API > Dynamic Templates
2. Click "Create Dynamic Template"
3. Design your template
4. Note the Template ID

### Step 2: Add to Environment

```bash
# Add to .env
SENDGRID_TEMPLATE_NEW_EMAIL=d-xxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Add to Email Service

**File:** `src/backend/functions/src/email.ts`

```typescript
const TEMPLATES = {
  // ... existing templates
  NEW_EMAIL: process.env.SENDGRID_TEMPLATE_NEW_EMAIL || '',
};

export async function sendNewEmail(
  email: string,
  firstName: string,
  customData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!initializeSendGrid()) {
      return { success: false, error: 'SendGrid not configured' };
    }

    if (!TEMPLATES.NEW_EMAIL) {
      console.warn('⚠️ New email template not configured');
      return { success: false, error: 'Template not configured' };
    }

    const msg = {
      to: email,
      from: FROM_EMAIL,
      templateId: TEMPLATES.NEW_EMAIL,
      dynamicTemplateData: {
        firstName: firstName || 'User',
        ...customData
      },
    };

    await sgMail.send(msg);
    console.log('✅ New email sent to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending new email:', error);
    return { success: false, error: error.message };
  }
}
```

### Step 4: Deploy

```bash
npm run build
firebase deploy --only functions
```

---

## Production Checklist

Before going live:

- [ ] Domain authentication set up
- [ ] All 9 templates created and published
- [ ] Template IDs added to `.env`
- [ ] API key generated with correct permissions
- [ ] Sender email verified
- [ ] Test emails sent successfully
- [ ] Scheduled function deployed and tested
- [ ] Email analytics set up
- [ ] Bounce handling configured
- [ ] Update sender email from `noreply@project.com` to actual domain

---

## Support

For SendGrid issues:
- Documentation: https://docs.sendgrid.com/
- Support: https://support.sendgrid.com/

For code issues:
- Check Firebase Functions logs
- Review `email.ts` for error handling
- Test with SendGrid Activity Feed

---

## 📮 Preventing Spam Folder Issues

### Why Emails Go to Spam

Without domain authentication, email providers (Gmail, Outlook, etc.) can't verify you own your domain, so they treat emails as suspicious.

### Primary Solution: Domain Authentication (CRITICAL)

**Impact:** Moves 90%+ emails from spam to inbox  
**Time:** 10 minutes setup + 24-48 hours DNS verification

#### Setup Steps:

1. **Go to SendGrid Dashboard**: Settings > Sender Authentication
2. **Click**: "Authenticate Your Domain"
3. **Select your DNS provider** and enter your domain
4. **Get 3 DNS records** (SendGrid provides):
   ```
   Type: CNAME
   Host: s1._domainkey
   Value: s1.domainkey.u12345.wl.sendgrid.net
   
   Type: CNAME  
   Host: s2._domainkey
   Value: s2.domainkey.u12345.wl.sendgrid.net
   
   Type: CNAME
   Host: em1234
   Value: u12345.wl.sendgrid.net
   ```
5. **Add records** to your domain's DNS settings
6. **Wait for verification** (24-48 hours, often faster)

**Result:** ✅ Emails will go to inbox instead of spam

### Additional Tips

**Email Content:**
- Avoid spam trigger words: "FREE", "CLICK HERE", "ACT NOW"
- Use professional language and proper formatting
- Include clear unsubscribe options (for marketing emails)

**Sending Practices:**
- Start with low volume on new domains (~50/day)
- Gradually increase over weeks
- Maintain consistent sending patterns

**Monitoring:**
- Check SendGrid Activity Feed for bounces
- Monitor spam report rates (should be < 0.1%)
- Use Mail-Tester.com to check spam score

---

## Security Best Practices

1. **Never commit API keys to git**
   - Use `.env` files
   - Add `.env` to `.gitignore`

2. **Rotate API keys regularly**
   - Every 90 days recommended
   - Immediately if compromised

3. **Use minimum required permissions**
   - Only "Mail Send" permission needed
   - Don't use "Full Access"

4. **Monitor for suspicious activity**
   - Check SendGrid Activity Feed
   - Set up alerts for unusual patterns

---

_Last Updated: January 2025_

