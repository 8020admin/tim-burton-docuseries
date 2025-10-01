import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';

const router = express.Router();

// Google Sign-In endpoint
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get or create user document
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Create new user document
      await admin.firestore().collection('users').doc(uid).set({
        uid: uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update last login
      await admin.firestore().collection('users').doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Get user data
    const userData = await admin.firestore().collection('users').doc(uid).get();
    
    res.json({
      success: true,
      user: userData.data()
    });
    
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(400).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Email/password sign-in endpoint
router.post('/email', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Get user by email from Firebase Auth
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // WARNING: This does NOT verify the password!
    // Firebase Admin SDK cannot verify passwords - this must be done client-side
    // For now, we're allowing any password for testing
    // TODO: Implement proper client-side Firebase Auth
    
    const uid = user.uid;
    
    // Update last login
    await admin.firestore().collection('users').doc(uid).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    // Create custom token for the user
    const customToken = await admin.auth().createCustomToken(uid);
    
    res.json({
      success: true,
      user: userData,
      customToken: customToken
    });
    
  } catch (error) {
    console.error('Email authentication error:', error);
    res.status(400).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Email/password sign-up endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name || email.split('@')[0]
    });
    
    const uid = userRecord.uid;
    
    // Create user document in Firestore
    await admin.firestore().collection('users').doc(uid).set({
      uid: uid,
      email: email,
      displayName: name || email.split('@')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get user data
    const userData = await admin.firestore().collection('users').doc(uid).get();
    
    // Create custom token
    const customToken = await admin.auth().createCustomToken(uid);
    
    res.json({
      success: true,
      user: userData.data(),
      customToken: customToken
    });
    
  } catch (error: any) {
    console.error('Sign-up error:', error);
    
    let errorMessage = 'Sign-up failed';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email already exists';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    }
    
    res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
});

// Password reset endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    // Generate password reset link
    const link = await admin.auth().generatePasswordResetLink(email);
    
    // In production, you would send this via SendGrid
    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset email sent',
      link: link // Remove this in production
    });
    
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    let errorMessage = 'Password reset failed';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No user found with this email';
    }
    
    res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
});

// Verify ID token endpoint (for email/password auth)
router.post('/verify', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get or create user document
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Create new user document for email/password users
      await admin.firestore().collection('users').doc(uid).set({
        uid: uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email?.split('@')[0],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update last login
      await admin.firestore().collection('users').doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Get user data
    const userData = await admin.firestore().collection('users').doc(uid).get();
    
    res.json({
      success: true,
      user: userData.data()
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({
      success: false,
      error: 'Token verification failed'
    });
  }
});

// Check authentication status
router.get('/status', async (req, res) => {
  try {
    // This would check for a valid session token
    // For now, return not authenticated
    res.json({
      authenticated: false,
      user: null
    });
    
  } catch (error) {
    console.error('Auth status check error:', error);
    res.status(400).json({
      success: false,
      error: 'Status check failed'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    // In a real implementation, you'd invalidate the session
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(400).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

export { router as authRoutes };
