import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';

const router = express.Router();

// Default profile pictures for new users
const DEFAULT_PROFILE_PICTURES = [
  'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd50236fd957bdf0e1066a_Avatar%206-1.avif',
  'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd5023bf5c55201a5cb12d_Avatar%204.avif',
  'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd5023895de9959c03e5fd_Avatar%205.avif',
  'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd5023f316a35fe23bed0b_Avatar%201.avif',
  'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd502305e767007486b8dd_Avatar%202.avif',
  'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd5023adee09af4d09977b_Avatar%203.avif',
  'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd5023acf6eb36a4c1e2fe_Avatar%206.avif',
  'https://cdn.prod.website-files.com/68d6c52a4c87b02b7b6bdc18/68dd502342682a91bff7b23e_Avatar%207.avif'
];

/**
 * Get a random profile picture from the default set
 */
function getRandomProfilePicture(): string {
  const randomIndex = Math.floor(Math.random() * DEFAULT_PROFILE_PICTURES.length);
  return DEFAULT_PROFILE_PICTURES[randomIndex];
}

/**
 * Parse display name into firstName and lastName
 */
function parseDisplayName(displayName: string | null | undefined): { firstName: string; lastName: string } {
  if (!displayName) {
    return { firstName: 'User', lastName: '' };
  }
  
  const nameParts = displayName.trim().split(' ');
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return { firstName, lastName };
}

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
      // Parse display name into firstName and lastName
      const { firstName, lastName } = parseDisplayName(decodedToken.name);
      
      // Create new user document with enhanced profile data
      const newUser = {
        uid: uid,
        email: decodedToken.email,
        firstName: firstName,
        lastName: lastName,
        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        photoURL: decodedToken.picture || getRandomProfilePicture(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await admin.firestore().collection('users').doc(uid).set(newUser);
      
      console.log('✅ New user created:', uid, 'with profile:', { firstName, lastName, photoURL: newUser.photoURL });
      
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

/**
 * UPDATE USER PROFILE
 * Allows users to update their profile information
 */
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, photoURL } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization token required' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Prepare update data
    const updateData: any = {
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    
    // Update display name if firstName or lastName changed
    if (firstName !== undefined || lastName !== undefined) {
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      const currentData = userDoc.data();
      
      const newFirstName = firstName !== undefined ? firstName : (currentData?.firstName || 'User');
      const newLastName = lastName !== undefined ? lastName : (currentData?.lastName || '');
      
      updateData.displayName = newLastName ? `${newFirstName} ${newLastName}` : newFirstName;
    }
    
    // Update user document in Firestore
    await admin.firestore().collection('users').doc(uid).update(updateData);
    
    // Get updated user data
    const updatedUserDoc = await admin.firestore().collection('users').doc(uid).get();
    const updatedUser = updatedUserDoc.data();
    
    console.log('✅ Profile updated for user:', uid, 'with data:', updateData);
    
    res.json({
      success: true,
      user: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Profile update error:', error);
    
    let errorMessage = 'Profile update failed. Please try again.';
    let statusCode = 500;
    
    if (error.code === 'auth/invalid-token') {
      errorMessage = 'Invalid session. Please sign in again.';
      statusCode = 401;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

export { router as authRoutes };
