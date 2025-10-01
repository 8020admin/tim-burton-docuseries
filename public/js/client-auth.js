/**
 * Client-side Authentication Module for Tim Burton Docuseries
 * Clean Firebase Auth implementation with unified backend sync
 * 
 * Architecture:
 * 1. All authentication happens via Firebase Auth SDK (client-side)
 * 2. Backend has ONE endpoint (/auth/session) for token verification and user sync
 * 3. Single localStorage key (timBurtonSession) with consistent schema
 * 4. Clear auth flow: Firebase Auth → Session Sync → Purchase Status → UI Update
 */

class TimBurtonAuth {
  constructor() {
    // Backend API
    this.apiBaseUrl = 'https://us-central1-tim-burton-docuseries.cloudfunctions.net/api';
    
    // Firebase configuration (public - safe to expose)
    this.firebaseConfig = {
      apiKey: "AIzaSyA0ps2qHN9rFsb4zF3NmyZ7bAW6pcpBRFY",
      authDomain: "tim-burton-docuseries.firebaseapp.com",
      projectId: "tim-burton-docuseries"
    };
    
    // State
    this.firebaseAuth = null;
    this.currentUser = null;
    this.idToken = null;
    this.purchaseStatus = null;
    this.isInitialized = false;
    
    // Initialize
    this.initFirebase();
    this.initGoogleSignIn();
  }
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  /**
   * Initialize Firebase Auth SDK
   */
  initFirebase() {
    if (!window.firebase) {
      const scripts = [
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js'
      ];
      
      let loadedCount = 0;
      scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          loadedCount++;
          if (loadedCount === scripts.length) {
            this.setupFirebase();
          }
        };
        script.onerror = () => {
          console.error('Failed to load Firebase SDK:', src);
        };
        document.head.appendChild(script);
      });
    } else {
      this.setupFirebase();
    }
  }
  
  /**
   * Setup Firebase after scripts load
   */
  setupFirebase() {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(this.firebaseConfig);
      }
      
      this.firebaseAuth = firebase.auth();
      
      // Listen for auth state changes (single source of truth)
      this.firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          await this.handleAuthStateChange(firebaseUser);
        } else {
          this.handleSignOut();
        }
      });
      
      this.isInitialized = true;
      console.log('✅ Firebase Auth initialized');
      
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }
  
  /**
   * Initialize Google Sign-In
   */
  initGoogleSignIn() {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => this.setupGoogleSignIn();
      script.onerror = () => {
        console.error('Failed to load Google Sign-In SDK');
      };
      document.head.appendChild(script);
    } else {
      this.setupGoogleSignIn();
    }
  }
  
  /**
   * Setup Google Sign-In button
   */
  setupGoogleSignIn() {
    if (window.google) {
      google.accounts.id.initialize({
        client_id: '939795747867-b7t7hvnrmlakbhrcaqu51fcvrqlerdq8.apps.googleusercontent.com',
        callback: this.handleGoogleSignIn.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true
      });
      console.log('✅ Google Sign-In initialized');
    }
  }
  
  // ============================================================================
  // AUTHENTICATION HANDLERS
  // ============================================================================
  
  /**
   * Handle Firebase Auth state changes
   * This is the SINGLE entry point for all successful authentications
   */
  async handleAuthStateChange(firebaseUser) {
    try {
      console.log('🔐 Auth state changed:', firebaseUser.email);
      
      // Get fresh ID token
      this.idToken = await firebaseUser.getIdToken(true);
      
      // Sync with backend (creates/updates user in Firestore)
      await this.syncSession(this.idToken);
      
      // Fetch purchase status
      await this.fetchPurchaseStatus();
      
      // Save session to localStorage
      this.saveSession();
      
      // Notify UI
      this.dispatchAuthEvent('signIn', this.currentUser);
      
      console.log('✅ Authentication successful:', this.currentUser?.email);
      
    } catch (error) {
      console.error('❌ Auth state change error:', error);
      this.dispatchAuthEvent('authError', { error: error.message });
    }
  }
  
  /**
   * Handle Google Sign-In callback
   * Signs into Firebase Auth with the Google credential
   */
  async handleGoogleSignIn(response) {
    try {
      const { credential } = response;
      
      // Sign in to Firebase with Google credential
      const googleAuthProvider = firebase.auth.GoogleAuthProvider.credential(credential);
      await this.firebaseAuth.signInWithCredential(googleAuthProvider);
      
      // onAuthStateChanged will handle the rest
      
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      this.dispatchAuthEvent('signInError', { error: error.message });
    }
  }
  
  /**
   * Sign in with email/password
   * All authentication goes through Firebase Auth SDK
   */
  async signInWithEmail(email, password) {
    try {
      if (!this.firebaseAuth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      await this.firebaseAuth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged will handle the rest
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Email sign-in error:', error);
      
      let errorMessage = 'Sign-in failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      this.dispatchAuthEvent('signInError', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Sign up with email/password
   */
  async signUpWithEmail(email, password, firstName) {
    try {
      if (!this.firebaseAuth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      const userCredential = await this.firebaseAuth.createUserWithEmailAndPassword(email, password);
      
      // Update display name (use firstName as displayName for now)
      if (firstName && userCredential.user) {
        await userCredential.user.updateProfile({ displayName: firstName });
      }
      
      // onAuthStateChanged will handle the rest
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Email sign-up error:', error);
      
      let errorMessage = 'Sign-up failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak (minimum 6 characters)';
      }
      
      this.dispatchAuthEvent('signUpError', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Send password reset email
   */
  async resetPassword(email) {
    try {
      if (!this.firebaseAuth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      await this.firebaseAuth.sendPasswordResetEmail(email);
      
      this.dispatchAuthEvent('passwordResetSent', { email });
      return { success: true };
      
    } catch (error) {
      console.error('❌ Password reset error:', error);
      
      let errorMessage = 'Password reset failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      this.dispatchAuthEvent('passwordResetError', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Sign out
   */
  async signOut() {
    try {
      // Sign out from Firebase Auth
      if (this.firebaseAuth) {
        await this.firebaseAuth.signOut();
      }
      
      // onAuthStateChanged will call handleSignOut()
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Force sign out even if Firebase fails
      this.handleSignOut();
    }
  }
  
  /**
   * Handle sign out cleanup
   */
  handleSignOut() {
    this.currentUser = null;
    this.idToken = null;
    this.purchaseStatus = null;
    
    // Clear localStorage
    localStorage.removeItem('timBurtonSession');
    
    // Disable Google auto-select
    if (window.google) {
      google.accounts.id.disableAutoSelect();
    }
    
    // Notify UI
    this.dispatchAuthEvent('signOut', null);
    
    console.log('✅ User signed out');
  }
  
  // ============================================================================
  // BACKEND SYNC (Single Unified Endpoint)
  // ============================================================================
  
  /**
   * Sync session with backend
   * This is the ONLY backend endpoint for authentication
   */
  async syncSession(idToken) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      if (!response.ok) {
        throw new Error(`Session sync failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Session sync failed');
      }
      
      this.currentUser = result.user;
      console.log('✅ Session synced with backend');
      
    } catch (error) {
      console.error('❌ Session sync error:', error);
      throw error;
    }
  }
  
  /**
   * Fetch purchase status from backend
   */
  async fetchPurchaseStatus() {
    if (!this.idToken) {
      this.purchaseStatus = null;
      return null;
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.idToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Purchase status fetch failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        this.purchaseStatus = result.purchaseStatus;
        console.log('✅ Purchase status fetched');
      } else {
        this.purchaseStatus = null;
      }
      
      return this.purchaseStatus;
      
    } catch (error) {
      console.error('❌ Purchase status error:', error);
      this.purchaseStatus = null;
      return null;
    }
  }
  
  // ============================================================================
  // SESSION PERSISTENCE
  // ============================================================================
  
  /**
   * Save session to localStorage
   */
  saveSession() {
    try {
      const session = {
        user: this.currentUser,
        idToken: this.idToken,
        purchaseStatus: this.purchaseStatus,
        timestamp: Date.now()
      };
      
      localStorage.setItem('timBurtonSession', JSON.stringify(session));
      
    } catch (error) {
      console.error('❌ Save session error:', error);
    }
  }
  
  /**
   * Restore session from localStorage
   * Note: Firebase Auth maintains its own session, this is just for initial state
   */
  async restoreSession() {
    try {
      const sessionData = localStorage.getItem('timBurtonSession');
      
      if (!sessionData) {
        return false;
      }
      
      const session = JSON.parse(sessionData);
      
      // Check if session is too old (24 hours)
      const MAX_AGE = 24 * 60 * 60 * 1000;
      if (Date.now() - session.timestamp > MAX_AGE) {
        console.log('Session expired, clearing...');
        localStorage.removeItem('timBurtonSession');
        return false;
      }
      
      // Restore state temporarily (Firebase auth will refresh it)
      this.currentUser = session.user;
      this.idToken = session.idToken;
      this.purchaseStatus = session.purchaseStatus;
      
      // Dispatch event so UI can update immediately
      this.dispatchAuthEvent('sessionRestored', this.currentUser);
      
      console.log('✅ Session restored from localStorage');
      return true;
      
    } catch (error) {
      console.error('❌ Session restore error:', error);
      localStorage.removeItem('timBurtonSession');
      return false;
    }
  }
  
  // ============================================================================
  // PUBLIC API - State Getters
  // ============================================================================
  
  isSignedIn() {
    return this.currentUser !== null && this.idToken !== null;
  }
  
  hasPurchase() {
    return this.purchaseStatus !== null && this.purchaseStatus.hasAccess;
  }
  
  hasBoxSetAccess() {
    return this.purchaseStatus && this.purchaseStatus.type === 'boxset';
  }
  
  getCurrentUser() {
    return this.currentUser;
  }
  
  getPurchaseStatus() {
    return this.purchaseStatus;
  }
  
  /**
   * Get button state for UI
   * Returns: 'not-signed-in', 'signed-in-not-paid', 'signed-in-paid'
   */
  getButtonState() {
    if (!this.isSignedIn()) {
      return 'not-signed-in';
    } else if (this.hasPurchase()) {
      return 'signed-in-paid';
    } else {
      return 'signed-in-not-paid';
    }
  }
  
  // ============================================================================
  // CONTENT ACCESS
  // ============================================================================
  
  /**
   * Check if user has access to specific content type
   */
  async checkContentAccess(contentType) {
    if (!this.isSignedIn()) {
      return { hasAccess: false, reason: 'not-signed-in' };
    }
    
    if (!this.purchaseStatus) {
      await this.fetchPurchaseStatus();
    }
    
    if (!this.hasPurchase()) {
      return { hasAccess: false, reason: 'no-purchase' };
    }
    
    switch (contentType) {
      case 'episodes':
        return { hasAccess: true, reason: 'purchased' };
      case 'bonus':
        return {
          hasAccess: this.hasBoxSetAccess(),
          reason: this.hasBoxSetAccess() ? 'boxset-purchased' : 'regular-purchase-only'
        };
      default:
        return { hasAccess: false, reason: 'unknown-content-type' };
    }
  }
  
  /**
   * Get secure content URL
   */
  async getSecureContentUrl(contentId, contentType) {
    if (!this.isSignedIn()) {
      throw new Error('User must be signed in to access content');
    }
    
    const accessCheck = await this.checkContentAccess(contentType);
    if (!accessCheck.hasAccess) {
      throw new Error(`Access denied: ${accessCheck.reason}`);
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/content/secure-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.idToken}`
        },
        body: JSON.stringify({ contentId, contentType })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get secure URL: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.secureUrl;
      } else {
        throw new Error(result.error || 'Failed to get secure content URL');
      }
      
    } catch (error) {
      console.error('❌ Secure content URL error:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================
  
  /**
   * Dispatch custom authentication events for UI to listen to
   */
  dispatchAuthEvent(eventType, data) {
    const event = new CustomEvent('timBurtonAuth', {
      detail: {
        type: eventType,
        data: data,
        user: this.currentUser,
        isSignedIn: this.isSignedIn(),
        hasPurchase: this.hasPurchase(),
        buttonState: this.getButtonState(),
        purchaseStatus: this.purchaseStatus
      }
    });
    
    document.dispatchEvent(event);
  }
  
  // ============================================================================
  // UI HELPERS
  // ============================================================================
  
  /**
   * Render Google Sign-In button
   * @param {string|HTMLElement} elementOrId - Element ID or DOM element
   */
  renderGoogleSignInButton(elementOrId) {
    if (window.google) {
      const element = typeof elementOrId === 'string' 
        ? document.getElementById(elementOrId) || document.querySelector(`[data-google-signin="${elementOrId}"]`)
        : elementOrId;
      
      if (element) {
        google.accounts.id.renderButton(
          element,
          {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 400
          }
        );
      }
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.timBurtonAuth = new TimBurtonAuth();
  
  // Restore session if available
  window.timBurtonAuth.restoreSession();
});

// Export for use in other scripts
window.TimBurtonAuth = TimBurtonAuth;
