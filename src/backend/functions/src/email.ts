import * as sgMail from '@sendgrid/mail';
import * as functions from 'firebase-functions';

/**
 * SendGrid Email Service
 * Handles all transactional emails for the platform
 * Updated: 2025-01-14
 */

// Initialize SendGrid with API key
const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not configured');
    return false;
  }
  sgMail.setApiKey(apiKey);
  return true;
};

// Email configuration
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@project.com';
const FROM_NAME = 'Tim Burton Docuseries';

// Template IDs (to be configured in .env after creating templates in SendGrid)
const TEMPLATES = {
  WELCOME: process.env.SENDGRID_TEMPLATE_WELCOME || '',
  PURCHASE_RENTAL: process.env.SENDGRID_TEMPLATE_PURCHASE_RENTAL || '',
  PURCHASE_REGULAR: process.env.SENDGRID_TEMPLATE_PURCHASE_REGULAR || '',
  PURCHASE_BOXSET: process.env.SENDGRID_TEMPLATE_PURCHASE_BOXSET || '',
  PASSWORD_RESET: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET || '',
  EMAIL_VERIFICATION: process.env.SENDGRID_TEMPLATE_EMAIL_VERIFICATION || '',
  RENTAL_WARNING_48H: process.env.SENDGRID_TEMPLATE_RENTAL_WARNING_48H || '',
  RENTAL_WARNING_24H: process.env.SENDGRID_TEMPLATE_RENTAL_WARNING_24H || '',
  RENTAL_EXPIRED: process.env.SENDGRID_TEMPLATE_RENTAL_EXPIRED || '',
};

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!initializeSendGrid()) {
      return { success: false, error: 'SendGrid not configured' };
    }

    if (!TEMPLATES.WELCOME) {
      console.warn('⚠️ Welcome email template not configured, skipping email');
      return { success: false, error: 'Template not configured' };
    }

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      templateId: TEMPLATES.WELCOME,
      dynamicTemplateData: {
        firstName: firstName || 'User',
      },
    };

    await sgMail.send(msg);
    console.log('✅ Welcome email sent to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmation(
  email: string,
  firstName: string,
  productType: 'rental' | 'regular' | 'boxset',
  purchaseDetails: {
    amount: number;
    purchaseDate: string;
    expiresAt?: string; // For rentals
    receiptUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!initializeSendGrid()) {
      return { success: false, error: 'SendGrid not configured' };
    }

    // Select appropriate template based on product type
    let templateId = '';
    let productName = '';
    
    switch (productType) {
      case 'rental':
        templateId = TEMPLATES.PURCHASE_RENTAL;
        productName = '4-Day Rental';
        break;
      case 'regular':
        templateId = TEMPLATES.PURCHASE_REGULAR;
        productName = 'Regular Purchase';
        break;
      case 'boxset':
        templateId = TEMPLATES.PURCHASE_BOXSET;
        productName = 'Box Set';
        break;
    }

    if (!templateId) {
      console.warn(`⚠️ Purchase confirmation template not configured for ${productType}, skipping email`);
      return { success: false, error: 'Template not configured' };
    }

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      templateId: templateId,
      dynamicTemplateData: {
        firstName: firstName || 'User',
        productName: productName,
        amount: `$${(purchaseDetails.amount / 100).toFixed(2)}`,
        purchaseDate: purchaseDetails.purchaseDate,
        expiresAt: purchaseDetails.expiresAt || null,
        receiptUrl: purchaseDetails.receiptUrl || null,
        isRental: productType === 'rental',
      },
    };

    await sgMail.send(msg);
    console.log(`✅ Purchase confirmation email sent to: ${email} for ${productType}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending purchase confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!initializeSendGrid()) {
      return { success: false, error: 'SendGrid not configured' };
    }

    if (!TEMPLATES.PASSWORD_RESET) {
      console.warn('⚠️ Password reset email template not configured, skipping email');
      return { success: false, error: 'Template not configured' };
    }

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      templateId: TEMPLATES.PASSWORD_RESET,
      dynamicTemplateData: {
        firstName: firstName || 'User',
        resetLink: resetLink,
      },
    };

    await sgMail.send(msg);
    console.log('✅ Password reset email sent to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email verification (optional)
 */
export async function sendEmailVerification(
  email: string,
  firstName: string,
  verificationLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!initializeSendGrid()) {
      return { success: false, error: 'SendGrid not configured' };
    }

    if (!TEMPLATES.EMAIL_VERIFICATION) {
      console.warn('⚠️ Email verification template not configured, skipping email');
      return { success: false, error: 'Template not configured' };
    }

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      templateId: TEMPLATES.EMAIL_VERIFICATION,
      dynamicTemplateData: {
        firstName: firstName || 'User',
        verificationLink: verificationLink,
      },
    };

    await sgMail.send(msg);
    console.log('✅ Email verification sent to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending email verification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send rental expiration warning (48h or 24h)
 */
export async function sendRentalExpirationWarning(
  email: string,
  firstName: string,
  hoursRemaining: 48 | 24,
  expiresAt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!initializeSendGrid()) {
      return { success: false, error: 'SendGrid not configured' };
    }

    const templateId = hoursRemaining === 48 
      ? TEMPLATES.RENTAL_WARNING_48H 
      : TEMPLATES.RENTAL_WARNING_24H;

    if (!templateId) {
      console.warn(`⚠️ Rental warning ${hoursRemaining}h template not configured, skipping email`);
      return { success: false, error: 'Template not configured' };
    }

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      templateId: templateId,
      dynamicTemplateData: {
        firstName: firstName || 'User',
        hoursRemaining: hoursRemaining,
        expiresAt: expiresAt,
      },
    };

    await sgMail.send(msg);
    console.log(`✅ Rental ${hoursRemaining}h warning email sent to:`, email);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Error sending rental ${hoursRemaining}h warning email:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Send rental expired notification
 */
export async function sendRentalExpiredNotification(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!initializeSendGrid()) {
      return { success: false, error: 'SendGrid not configured' };
    }

    if (!TEMPLATES.RENTAL_EXPIRED) {
      console.warn('⚠️ Rental expired template not configured, skipping email');
      return { success: false, error: 'Template not configured' };
    }

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      templateId: TEMPLATES.RENTAL_EXPIRED,
      dynamicTemplateData: {
        firstName: firstName || 'User',
      },
    };

    await sgMail.send(msg);
    console.log('✅ Rental expired notification sent to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending rental expired notification:', error);
    return { success: false, error: error.message };
  }
}

