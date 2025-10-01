import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';

const router = express.Router();

/**
 * UNIFIED SESSION ENDPOINT
 * This is the ONLY endpoint for authentication token verification and user sync
 * Works with both Google and Email/Password authentication
 */
router.post('/session', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required'
      });
    }
    
    // Verify the ID token (works for all Firebase Auth providers)
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get or create user document in Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Create new user document
      const newUser = {
        uid: uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        photoURL: decodedToken.picture || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await admin.firestore().collection('users').doc(uid).set(newUser);
      
      console.log('✅ New user created:', uid);
      
      return res.json({
        success: true,
        user: newUser
      });
      
    } else {
      // Update last login for existing user
      await admin.firestore().collection('users').doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Get fresh user data
      const userData = (await admin.firestore().collection('users').doc(uid).get()).data();
      
      console.log('✅ Existing user session synced:', uid);
      
      return res.json({
        success: true,
        user: userData
      });
    }
    
  } catch (error: any) {
    console.error('❌ Session sync error:', error);
    
    let errorMessage = 'Session sync failed';
    let statusCode = 400;
    
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Session expired. Please sign in again.';
      statusCode = 401;
    } else if (error.code === 'auth/id-token-revoked') {
      errorMessage = 'Session revoked. Please sign in again.';
      statusCode = 401;
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid session. Please sign in again.';
      statusCode = 401;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * DEPRECATED ENDPOINTS (Keep for backwards compatibility during migration)
 * These will be removed after confirming the new system works
 */

// Google Sign-In endpoint (DEPRECATED - use /session instead)
router.post('/google', async (req, res) => {
  console.warn('⚠️ DEPRECATED: /auth/google called. Use /auth/session instead.');
  
  try {
    const { idToken } = req.body;
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      await admin.firestore().collection('users').doc(uid).set({
        uid: uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await admin.firestore().collection('users').doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
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

// Email/password verify endpoint (DEPRECATED - use /session instead)
router.post('/verify', async (req, res) => {
  console.warn('⚠️ DEPRECATED: /auth/verify called. Use /auth/session instead.');
  
  try {
    const { idToken } = req.body;
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      await admin.firestore().collection('users').doc(uid).set({
        uid: uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email?.split('@')[0],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await admin.firestore().collection('users').doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
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

// Email/password sign-in endpoint (DEPRECATED - client-side Firebase Auth handles this)
router.post('/email', async (req, res) => {
  console.warn('⚠️ DEPRECATED: /auth/email called. Use client-side Firebase Auth instead.');
  
  res.status(410).json({
    success: false,
    error: 'This endpoint is deprecated. Please update your client to use Firebase Auth SDK.'
  });
});

// Email/password sign-up endpoint (DEPRECATED - client-side Firebase Auth handles this)
router.post('/signup', async (req, res) => {
  console.warn('⚠️ DEPRECATED: /auth/signup called. Use client-side Firebase Auth SDK instead.');
  
  res.status(410).json({
    success: false,
    error: 'This endpoint is deprecated. Please update your client to use Firebase Auth SDK.'
  });
});

// Password reset endpoint (DEPRECATED - client-side Firebase Auth handles this)
router.post('/reset-password', async (req, res) => {
  console.warn('⚠️ DEPRECATED: /auth/reset-password called. Use client-side Firebase Auth SDK instead.');
  
  res.status(410).json({
    success: false,
    error: 'This endpoint is deprecated. Please update your client to use Firebase Auth SDK.'
  });
});

// Check authentication status (DEPRECATED)
router.get('/status', async (req, res) => {
  console.warn('⚠️ DEPRECATED: /auth/status called.');
  
  res.json({
    authenticated: false,
    user: null,
    message: 'This endpoint is deprecated. Check auth status client-side using Firebase Auth.'
  });
});

// Logout endpoint (DEPRECATED - client-side handles this)
router.post('/logout', async (req, res) => {
  console.warn('⚠️ DEPRECATED: /auth/logout called. Use client-side Firebase Auth signOut() instead.');
  
  res.json({
    success: true,
    message: 'Use client-side Firebase Auth signOut() method instead.'
  });
});

export { router as authRoutes };
