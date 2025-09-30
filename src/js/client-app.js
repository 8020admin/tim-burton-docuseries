/**
 * Client-Side Application
 * Safe code for Webflow - NO sensitive data
 * Communicates with secure backend API
 */

class TimBurtonClient {
  constructor() {
    this.config = window.CLIENT_CONFIG;
    this.user = null;
    this.isAuthenticated = false;
    this.currentContent = null;
    
    this.init();
  }

  /**
   * Initialize the client application
   */
  async init() {
    try {
      console.log('🎬 Initializing Tim Burton Docuseries Client...');
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Check authentication status
      await this.checkAuthStatus();
      
      // Initialize UI
      this.initializeUI();
      
      console.log('✅ Client initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize client:', error);
      this.showError('Failed to initialize the platform. Please refresh the page.');
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Authentication events
    document.addEventListener('auth:login', (e) => this.handleLogin(e.detail));
    document.addEventListener('auth:logout', (e) => this.handleLogout(e.detail));
    
    // Payment events
    document.addEventListener('payment:success', (e) => this.handlePaymentSuccess(e.detail));
    document.addEventListener('payment:error', (e) => this.handlePaymentError(e.detail));
    
    // Content events
    document.addEventListener('content:access', (e) => this.handleContentAccess(e.detail));
    
    // Regional events
    document.addEventListener('region:blocked', (e) => this.handleRegionBlocked(e.detail));
  }

  /**
   * Check authentication status via API
   */
  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.config.api.baseUrl}${this.config.api.endpoints.auth}/status`, {
        credentials: 'include' // Include cookies for session
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          this.user = data.user;
          this.isAuthenticated = true;
          this.updateUIForAuthenticatedUser();
        }
      }
    } catch (error) {
      console.log('User not authenticated');
    }
  }

  /**
   * Initialize UI components
   */
  initializeUI() {
    // Initialize modals
    this.initializeModals();
    
    // Initialize navigation
    this.initializeNavigation();
    
    // Initialize content display
    this.initializeContentDisplay();
  }

  /**
   * Initialize modals
   */
  initializeModals() {
    // Modal initialization
    console.log('🪟 Modals initialized');
  }

  /**
   * Initialize navigation
   */
  initializeNavigation() {
    // Navigation initialization
    console.log('🧭 Navigation initialized');
  }

  /**
   * Initialize content display
   */
  initializeContentDisplay() {
    // Content display initialization
    console.log('📺 Content display initialized');
  }

  /**
   * Handle user login
   */
  handleLogin(userData) {
    this.user = userData;
    this.isAuthenticated = true;
    console.log('✅ User logged in:', userData);
    this.updateUIForAuthenticatedUser();
  }

  /**
   * Handle user logout
   */
  handleLogout() {
    this.user = null;
    this.isAuthenticated = false;
    console.log('👋 User logged out');
    this.updateUIForUnauthenticatedUser();
  }

  /**
   * Handle successful payment
   */
  handlePaymentSuccess(paymentData) {
    console.log('💰 Payment successful:', paymentData);
    this.grantContentAccess(paymentData);
  }

  /**
   * Handle payment error
   */
  handlePaymentError(error) {
    console.error('💳 Payment failed:', error);
    this.showError('Payment failed. Please try again.');
  }

  /**
   * Handle content access
   */
  handleContentAccess(contentData) {
    console.log('🎬 Content access granted:', contentData);
    this.currentContent = contentData;
  }

  /**
   * Handle region blocked
   */
  handleRegionBlocked(regionData) {
    console.log('🚫 Region blocked:', regionData);
    this.showRegionBlockedMessage(regionData);
  }

  /**
   * Grant content access to user
   */
  grantContentAccess(paymentData) {
    console.log('🎫 Granting content access...');
  }

  /**
   * Update UI for authenticated user
   */
  updateUIForAuthenticatedUser() {
    console.log('🔄 Updating UI for authenticated user');
  }

  /**
   * Update UI for unauthenticated user
   */
  updateUIForUnauthenticatedUser() {
    console.log('🔄 Updating UI for unauthenticated user');
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('❌ Error:', message);
  }

  /**
   * Show region blocked message
   */
  showRegionBlockedMessage(regionData) {
    console.log('🚫 Region blocked message:', regionData);
  }

  // API Communication Methods (all sensitive operations go through backend)

  /**
   * Authenticate with Google (via backend)
   */
  async authenticateWithGoogle() {
    try {
      const response = await fetch(`${this.config.api.baseUrl}${this.config.api.endpoints.auth}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.handleLogin(data.user);
        return data.user;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Google authentication failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate with email/password (via backend)
   */
  async authenticateWithEmail(email, password) {
    try {
      const response = await fetch(`${this.config.api.baseUrl}${this.config.api.endpoints.auth}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.handleLogin(data.user);
        return data.user;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Email authentication failed:', error);
      throw error;
    }
  }

  /**
   * Create payment intent (via backend)
   */
  async createPaymentIntent(priceId) {
    try {
      const response = await fetch(`${this.config.api.baseUrl}${this.config.api.endpoints.payments}/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priceId }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.paymentIntent;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Payment intent creation failed:', error);
      throw error;
    }
  }

  /**
   * Get signed video URL (via backend)
   */
  async getSignedVideoUrl(videoId) {
    try {
      const response = await fetch(`${this.config.api.baseUrl}${this.config.api.endpoints.content}/signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.signedUrl;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Signed URL generation failed:', error);
      throw error;
    }
  }
}

// Initialize the client when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.timBurtonClient = new TimBurtonClient();
});
