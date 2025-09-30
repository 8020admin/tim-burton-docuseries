/**
 * Client-side Authentication Module for Tim Burton Docuseries
 * This code will be added to Webflow as external scripts
 */

class TimBurtonAuth {
  constructor() {
    this.apiBaseUrl = 'https://us-central1-tim-burton-docuseries.cloudfunctions.net/api';
    this.currentUser = null;
    this.customToken = null;
    this.purchaseStatus = null;
    this.firebaseAuth = null;
    
    // Firebase configuration (public - safe to expose)
    this.firebaseConfig = {
      apiKey: "AIzaSyDWN7XRzVHKqB9jmJxQ8F0wZjKvX5sYQqM",
      authDomain: "tim-burton-docuseries.firebaseapp.com",
      projectId: "tim-burton-docuseries"
    };
    
    // Initialize Firebase Auth
    this.initFirebase();
    
    // Initialize Google Sign-In
    this.initGoogleSignIn();
  }
  
  /**
   * Initialize Firebase Auth
   */
  initFirebase() {
    // Load Firebase scripts if not already loaded
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
    if (window.firebase && !firebase.apps.length) {
      firebase.initializeApp(this.firebaseConfig);
      this.firebaseAuth = firebase.auth();
      
      // Listen for auth state changes
      this.firebaseAuth.onAuthStateChanged(async (user) => {
        if (user) {
          await this.handleFirebaseAuthSuccess(user);
        }
      });
      
      // Try to restore session
      this.restoreSession();
    }
  }

  /**
   * Initialize Google Sign-In
   */
  initGoogleSignIn() {
    // Load Google Sign-In script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => this.setupGoogleSignIn();
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
    }
  }

  /**
   * Handle Google Sign-In callback
   */
  async handleGoogleSignIn(response) {
    try {
      const { credential } = response;
      
      // Send the ID token to our backend
      const result = await this.signInWithGoogle(credential);
      
      if (result.success) {
        this.currentUser = result.user;
        this.customToken = result.customToken;
        
        // Store user data in localStorage
        localStorage.setItem('timBurtonUser', JSON.stringify(result.user));
        localStorage.setItem('timBurtonToken', result.customToken);
        
        // Fetch purchase status
        await this.fetchPurchaseStatus();
        
        // Trigger custom event for Webflow
        this.dispatchAuthEvent('signIn', result.user);
        
        console.log('Sign-in successful:', result.user);
      } else {
        throw new Error(result.error || 'Sign-in failed');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      this.dispatchAuthEvent('signInError', { error: error.message });
    }
  }

  /**
   * Handle Firebase Auth success
   */
  async handleFirebaseAuthSuccess(firebaseUser) {
    try {
      // Get ID token from Firebase
      const idToken = await firebaseUser.getIdToken();
      
      // Sync with backend (creates/updates user in Firestore)
      await this.syncWithBackend(idToken, firebaseUser);
      
      // Fetch purchase status
      await this.fetchPurchaseStatus();
      
      // Trigger custom event for Webflow
      this.dispatchAuthEvent('signIn', this.currentUser);
      
      console.log('Authentication successful:', this.currentUser);
    } catch (error) {
      console.error('Auth success handler error:', error);
    }
  }
  
  /**
   * Sync Firebase user with backend
   */
  async syncWithBackend(idToken, firebaseUser) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.currentUser = result.user;
        this.customToken = idToken;
        
        // Store in localStorage
        localStorage.setItem('timBurtonUser', JSON.stringify(result.user));
        localStorage.setItem('timBurtonToken', idToken);
      }
    } catch (error) {
      console.error('Backend sync error:', error);
    }
  }
  
  /**
   * Handle email/password sign in (using Firebase Auth)
   */
  async handleEmailSignIn(email, password) {
    try {
      if (!this.firebaseAuth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      // Sign in with Firebase Auth
      const userCredential = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
      
      // The onAuthStateChanged listener will handle the rest
      return { success: true };
      
    } catch (error) {
      console.error('Email Sign-In Error:', error);
      let errorMessage = 'Sign-in failed';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      this.dispatchAuthEvent('signInError', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle email/password sign up (using Firebase Auth)
   */
  async handleEmailSignUp(email, password, name) {
    try {
      if (!this.firebaseAuth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      // Create user with Firebase Auth
      const userCredential = await this.firebaseAuth.createUserWithEmailAndPassword(email, password);
      
      // Update display name
      if (name && userCredential.user) {
        await userCredential.user.updateProfile({
          displayName: name
        });
      }
      
      // The onAuthStateChanged listener will handle the rest
      return { success: true };
      
    } catch (error) {
      console.error('Email Sign-Up Error:', error);
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
   * Handle password reset (using Firebase Auth)
   */
  async handlePasswordReset(email) {
    try {
      if (!this.firebaseAuth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      // Send password reset email via Firebase
      await this.firebaseAuth.sendPasswordResetEmail(email);
      
      this.dispatchAuthEvent('passwordResetSent', { email });
      console.log('Password reset email sent to:', email);
      return { success: true };
      
    } catch (error) {
      console.error('Password Reset Error:', error);
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
   * Sign in with Google ID token
   */
  async signInWithGoogle(idToken) {
    const response = await fetch(`${this.apiBaseUrl}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken })
    });

    return await response.json();
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email, password) {
    const response = await fetch(`${this.apiBaseUrl}/auth/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    return await response.json();
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email, password, name) {
    const response = await fetch(`${this.apiBaseUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name })
    });

    return await response.json();
  }

  /**
   * Reset password
   */
  async resetPassword(email) {
    const response = await fetch(`${this.apiBaseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    return await response.json();
  }

  /**
   * Verify custom token
   */
  async verifyToken(token) {
    const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });

    return await response.json();
  }

  /**
   * Get user data
   */
  async getUser(uid) {
    const response = await fetch(`${this.apiBaseUrl}/auth/user?uid=${uid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return await response.json();
  }

  /**
   * Refresh custom token
   */
  async refreshToken(uid) {
    const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid })
    });

    return await response.json();
  }

  /**
   * Sign out user
   */
  signOut() {
    // Sign out from Firebase Auth
    if (this.firebaseAuth) {
      this.firebaseAuth.signOut();
    }
    
    this.currentUser = null;
    this.customToken = null;
    this.purchaseStatus = null;
    
    // Clear localStorage
    localStorage.removeItem('timBurtonUser');
    localStorage.removeItem('timBurtonToken');
    
    // Sign out from Google
    if (window.google) {
      google.accounts.id.disableAutoSelect();
    }
    
    // Trigger custom event for Webflow
    this.dispatchAuthEvent('signOut', null);
    
    console.log('User signed out');
  }

  /**
   * Check if user is signed in
   */
  isSignedIn() {
    return this.currentUser !== null && this.customToken !== null;
  }

  /**
   * Check if user has made a purchase
   */
  hasPurchase() {
    return this.purchaseStatus !== null && this.purchaseStatus.hasAccess;
  }

  /**
   * Get purchase status
   */
  getPurchaseStatus() {
    return this.purchaseStatus;
  }

  /**
   * Check if user has box set access
   */
  hasBoxSetAccess() {
    return this.purchaseStatus && this.purchaseStatus.type === 'boxset';
  }

  /**
   * Get user's button state
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

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get custom token
   */
  getCustomToken() {
    return this.customToken;
  }

  /**
   * Fetch purchase status from backend
   */
  async fetchPurchaseStatus() {
    if (!this.isSignedIn()) {
      this.purchaseStatus = null;
      return null;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/purchases/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.customToken}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        this.purchaseStatus = result.purchaseStatus;
        return this.purchaseStatus;
      } else {
        this.purchaseStatus = null;
        return null;
      }
    } catch (error) {
      console.error('Error fetching purchase status:', error);
      this.purchaseStatus = null;
      return null;
    }
  }

  /**
   * Check content access for a specific content type
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

    // Check specific content access
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
   * Get secure content URL (for episodes and bonus content)
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
          'Authorization': `Bearer ${this.customToken}`
        },
        body: JSON.stringify({ contentId, contentType })
      });

      const result = await response.json();
      
      if (result.success) {
        return result.secureUrl;
      } else {
        throw new Error(result.error || 'Failed to get secure content URL');
      }
    } catch (error) {
      console.error('Error getting secure content URL:', error);
      throw error;
    }
  }

  /**
   * Restore session from localStorage
   */
  async restoreSession() {
    try {
      const storedUser = localStorage.getItem('timBurtonUser');
      const storedToken = localStorage.getItem('timBurtonToken');
      
      if (storedUser && storedToken) {
        // For now, we'll restore the session without server verification
        // In production, you might want to verify the token with the server
        this.currentUser = JSON.parse(storedUser);
        this.customToken = storedToken;
        
        // Try to fetch purchase status (this might fail in local testing)
        try {
          await this.fetchPurchaseStatus();
        } catch (error) {
          console.log('Purchase status fetch failed, continuing with session restoration:', error);
          // Set default purchase status if fetch fails
          this.purchaseStatus = null;
        }
        
        // Trigger custom event for Webflow
        this.dispatchAuthEvent('sessionRestored', this.currentUser);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Session restore error:', error);
      // Only clear storage if there's a critical error
      if (error.message && error.message.includes('JSON')) {
        // Invalid JSON in localStorage, clear it
        this.signOut();
      }
      return false;
    }
  }

  /**
   * Dispatch custom authentication events
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

  /**
   * Render Google Sign-In button
   */
  renderGoogleSignInButton(elementId) {
    if (window.google) {
      google.accounts.id.renderButton(
        document.getElementById(elementId),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        }
      );
    }
  }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.timBurtonAuth = new TimBurtonAuth();
  
  // Restore session if available
  window.timBurtonAuth.restoreSession();
});

// Export for use in other scripts
window.TimBurtonAuth = TimBurtonAuth;
