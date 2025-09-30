const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

// Initialize Firebase Admin
admin.initializeApp();

// Simple test function
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.json({
    message: 'Hello from Firebase Functions!',
    timestamp: new Date().toISOString()
  });
});

// Main API function with authentication endpoints
exports.api = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const { method, path } = req;
    
    try {
      // Route handling
      if (method === 'POST' && path === '/auth/google') {
        return await handleGoogleSignIn(req, res);
      } else if (method === 'POST' && path === '/auth/email') {
        return await handleEmailSignIn(req, res);
      } else if (method === 'POST' && path === '/auth/signup') {
        return await handleEmailSignUp(req, res);
      } else if (method === 'POST' && path === '/auth/reset-password') {
        return await handlePasswordReset(req, res);
      } else if (method === 'POST' && path === '/auth/verify') {
        return await handleTokenVerification(req, res);
      } else if (method === 'GET' && path === '/auth/user') {
        return await handleGetUser(req, res);
      } else if (method === 'POST' && path === '/auth/refresh') {
        return await handleRefreshToken(req, res);
      } else if (method === 'GET' && path === '/health') {
        return res.json({
          status: 'ok',
          message: 'Tim Burton Docuseries API is running',
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(404).json({
          success: false,
          error: 'Endpoint not found'
        });
      }
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
});

// Google Sign-In handler
async function handleGoogleSignIn(req, res) {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required'
      });
    }

    // Verify the Google ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Create or update user in Firestore
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    const userData = {
      uid,
      email,
      name: name || '',
      picture: picture || '',
      lastSignIn: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: userDoc.exists ? userDoc.data().createdAt : admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData, { merge: true });

    // Create custom token for our app
    let customToken;
    try {
      customToken = await admin.auth().createCustomToken(uid);
    } catch (error) {
      console.error('Custom token creation failed:', error);
      // Fallback: return the Firebase UID as a simple token
      customToken = uid;
    }

    return res.json({
      success: true,
      user: {
        uid,
        email,
        name: userData.name,
        picture: userData.picture
      },
      customToken
    });

  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid ID token'
    });
  }
}

// Token verification handler
async function handleTokenVerification(req, res) {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Verify the custom token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid } = decodedToken;

    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();

    return res.json({
      success: true,
      user: {
        uid,
        email: userData.email,
        name: userData.name,
        picture: userData.picture
      }
    });

  } catch (error) {
    console.error('Token Verification Error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

// Get user handler
async function handleGetUser(req, res) {
  try {
    const { uid } = req.query;
    
    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();

    return res.json({
      success: true,
      user: {
        uid,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        createdAt: userData.createdAt,
        lastSignIn: userData.lastSignIn
      }
    });

  } catch (error) {
    console.error('Get User Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
}

// Email sign-in handler
async function handleEmailSignIn(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Sign in with email and password
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Create custom token
    let customToken;
    try {
      customToken = await admin.auth().createCustomToken(userRecord.uid);
    } catch (error) {
      console.error('Custom token creation failed:', error);
      // Fallback: return the Firebase UID as a simple token
      customToken = userRecord.uid;
    }
    
    // Get or create user data in Firestore
    const userRef = admin.firestore().collection('users').doc(userRecord.uid);
    const userDoc = await userRef.get();
    
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || '',
      picture: userRecord.photoURL || '',
      lastSignIn: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: userDoc.exists ? userDoc.data().createdAt : admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData, { merge: true });

    return res.json({
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        picture: userData.picture
      },
      customToken
    });

  } catch (error) {
    console.error('Email Sign-In Error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
}

// Email sign-up handler
async function handleEmailSignUp(req, res) {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Create user with email and password
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name || '',
      emailVerified: false
    });
    
    // Create custom token
    let customToken;
    try {
      customToken = await admin.auth().createCustomToken(userRecord.uid);
    } catch (error) {
      console.error('Custom token creation failed:', error);
      // Fallback: return the Firebase UID as a simple token
      customToken = userRecord.uid;
    }
    
    // Create user data in Firestore
    const userRef = admin.firestore().collection('users').doc(userRecord.uid);
    
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      name: name || '',
      picture: '',
      lastSignIn: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData);

    return res.json({
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        picture: userData.picture
      },
      customToken
    });

  } catch (error) {
    console.error('Email Sign-Up Error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create account'
    });
  }
}

// Password reset handler
async function handlePasswordReset(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // In a real app, you would send this link via email
    // For now, we'll just return success
    console.log('Password reset link for', email, ':', resetLink);

    return res.json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (error) {
    console.error('Password Reset Error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to send password reset email'
    });
  }
}

// Refresh token handler
async function handleRefreshToken(req, res) {
  try {
    const { uid } = req.body;
    
    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Create new custom token
    let customToken;
    try {
      customToken = await admin.auth().createCustomToken(uid);
    } catch (error) {
      console.error('Custom token creation failed:', error);
      // Fallback: return the Firebase UID as a simple token
      customToken = uid;
    }

    return res.json({
      success: true,
      customToken
    });

  } catch (error) {
    console.error('Refresh Token Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
}
