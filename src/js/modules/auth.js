/**
 * Authentication Module
 * Handles user authentication with Firebase and Google Sign-In
 */

class AuthManager {
  constructor(app) {
    this.app = app;
    this.firebase = null;
    this.auth = null;
    this.user = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Firebase Authentication
   */
  async initialize() {
    try {
      // Initialize Firebase
      this.firebase = window.firebase;
      await this.firebase.initializeApp(this.app.config.firebase);
      
      // Get auth instance
      this.auth = this.firebase.auth();
      
      // Set up auth state listener
      this.auth.onAuthStateChanged((user) => {
        this.handleAuthStateChange(user);
      });
      
      this.isInitialized = true;
      console.log('🔥 Firebase Auth initialized');
      
    } catch (error) {
      console.error('❌ Firebase Auth initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle authentication state changes
   */
  handleAuthStateChange(user) {
    if (user) {
      this.user = user;
      this.app.handleLogin({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
    } else {
      this.user = null;
      this.app.handleLogout();
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      if (!this.isInitialized) {
        throw new Error('Auth not initialized');
      }

      const provider = new this.firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const result = await this.auth.signInWithPopup(provider);
      console.log('✅ Google Sign-In successful:', result.user);
      
      return result.user;
      
    } catch (error) {
      console.error('❌ Google Sign-In failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email, password) {
    try {
      if (!this.isInitialized) {
        throw new Error('Auth not initialized');
      }

      const result = await this.auth.signInWithEmailAndPassword(email, password);
      console.log('✅ Email Sign-In successful:', result.user);
      
      return result.user;
      
    } catch (error) {
      console.error('❌ Email Sign-In failed:', error);
      throw error;
    }
  }

  /**
   * Create account with email and password
   */
  async createAccount(email, password, displayName) {
    try {
      if (!this.isInitialized) {
        throw new Error('Auth not initialized');
      }

      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      
      // Update display name
      await result.user.updateProfile({
        displayName: displayName
      });
      
      console.log('✅ Account created successfully:', result.user);
      
      return result.user;
      
    } catch (error) {
      console.error('❌ Account creation failed:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      if (!this.isInitialized) {
        throw new Error('Auth not initialized');
      }

      await this.auth.signOut();
      console.log('✅ Sign out successful');
      
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      if (!this.isInitialized) {
        throw new Error('Auth not initialized');
      }

      await this.auth.sendPasswordResetEmail(email);
      console.log('✅ Password reset email sent');
      
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.user !== null;
  }

  /**
   * Get user token
   */
  async getUserToken() {
    try {
      if (!this.user) {
        throw new Error('No authenticated user');
      }

      const token = await this.user.getIdToken();
      return token;
      
    } catch (error) {
      console.error('❌ Failed to get user token:', error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
} else {
  window.AuthManager = AuthManager;
}
