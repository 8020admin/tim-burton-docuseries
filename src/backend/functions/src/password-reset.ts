import * as express from 'express';
import * as admin from 'firebase-admin';
import { sendPasswordResetEmail } from './email';

const router = express.Router();

/**
 * Request password reset
 * Generates a password reset link and sends email
 */
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if user exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error: any) {
      // Don't reveal if user exists or not for security
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Get user data from Firestore for name
    let firstName = 'User';
    try {
      const userDoc = await admin.firestore().collection('users').doc(userRecord.uid).get();
      const userData = userDoc.data();
      firstName = userData?.firstName || 'User';
    } catch (error) {
      console.error('Error fetching user data:', error);
    }

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      // You can customize this URL to point to your custom reset page
      url: process.env.PASSWORD_RESET_URL || 'https://timburton-dev.webflow.io/reset-password',
    });

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(email, firstName, resetLink);

    if (emailResult.success) {
      console.log(`✅ Password reset email sent to: ${email}`);
    } else {
      console.warn(`⚠️ Failed to send password reset email: ${emailResult.error}`);
      // Still return success to user to not reveal if email exists
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    
    // Don't reveal specific errors to prevent enumeration attacks
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  }
});

/**
 * Confirm password reset (optional - for tracking)
 * This can be called after user successfully resets password
 */
router.post('/confirm-password-reset', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Update user record to track password reset
    await admin.firestore().collection('users').doc(uid).update({
      lastPasswordReset: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Password reset confirmed for user: ${uid}`);

    res.json({
      success: true,
      message: 'Password reset confirmed'
    });

  } catch (error: any) {
    console.error('❌ Password reset confirmation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to confirm password reset'
    });
  }
});

export { router as passwordResetRoutes };

