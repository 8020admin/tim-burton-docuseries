/**
 * Button State Manager for Tim Burton Docuseries
 * Handles dynamic button states based on authentication and purchase status
 */

class ButtonStateManager {
  constructor() {
    this.auth = null;
    this.intendedAction = null; // Track what the user wanted to do after sign up
    this.init();
  }

  /**
   * Initialize button state manager
   */
  init() {
    // Wait for auth system to be available
    if (window.timBurtonAuth) {
      this.auth = window.timBurtonAuth;
      this.setupButtonStates();
    } else {
      // Wait for auth system to load
      document.addEventListener('DOMContentLoaded', () => {
        this.auth = window.timBurtonAuth;
        this.setupButtonStates();
      });
    }
  }

  /**
   * Setup button state management
   */
  setupButtonStates() {
    // Listen for authentication events
    document.addEventListener('timBurtonAuth', (event) => {
      this.updateAllButtons();
      
      // Handle intended action after successful authentication
      if ((event.detail.type === 'signIn' || event.detail.type === 'signUp' || event.detail.type === 'sessionRestored') && this.intendedAction) {
        this.executeIntendedActionWhenReady();
      }
    });

    // Initial button state update
    this.updateAllButtons();
  }

  /**
   * Update all buttons based on current state
   */
  updateAllButtons() {
    if (!this.auth) return;

    const buttonState = this.auth.getButtonState();
    
    // Update Sign In/Sign Out buttons
    this.updateSignInButtons(buttonState);
    
    // Update Rent/Buy/Watch Now buttons
    this.updatePurchaseButtons(buttonState);
    
    // Update any other state-dependent buttons
    this.updateOtherButtons(buttonState);
  }

  /**
   * Update Sign In/Sign Out buttons
   */
  updateSignInButtons(buttonState) {
    const signInButtons = document.querySelectorAll('[data-button-type="sign-in"]');
    const signOutButtons = document.querySelectorAll('[data-button-type="sign-out"]');
    
    if (buttonState === 'not-signed-in') {
      // Show Sign In buttons, hide Sign Out buttons
      signInButtons.forEach(button => {
        button.style.display = '';
        button.textContent = 'Sign In';
      });
      signOutButtons.forEach(button => {
        button.style.display = 'none';
      });
    } else {
      // Hide Sign In buttons, show Sign Out buttons
      signInButtons.forEach(button => {
        button.style.display = 'none';
      });
      signOutButtons.forEach(button => {
        button.style.display = '';
        button.textContent = 'Sign Out';
      });
    }
  }

  /**
   * Update Rent/Buy/Watch Now buttons
   */
  updatePurchaseButtons(buttonState) {
    const rentButtons = document.querySelectorAll('[data-button-type="rent"]');
    const buyButtons = document.querySelectorAll('[data-button-type="buy"]');
    const watchNowButtons = document.querySelectorAll('[data-button-type="watch-now"]');
    
    if (buttonState === 'not-signed-in') {
      // Show Rent and Buy buttons, hide Watch Now
      rentButtons.forEach(button => {
        button.style.display = '';
        button.textContent = 'Rent';
      });
      buyButtons.forEach(button => {
        button.style.display = '';
        button.textContent = 'Buy';
      });
      watchNowButtons.forEach(button => {
        button.style.display = 'none';
      });
    } else if (buttonState === 'signed-in-not-paid') {
      // Show Rent and Buy buttons, hide Watch Now
      rentButtons.forEach(button => {
        button.style.display = '';
        button.textContent = 'Rent';
      });
      buyButtons.forEach(button => {
        button.style.display = '';
        button.textContent = 'Buy';
      });
      watchNowButtons.forEach(button => {
        button.style.display = 'none';
      });
    } else if (buttonState === 'signed-in-paid') {
      // Hide Rent and Buy buttons, show Watch Now
      rentButtons.forEach(button => {
        button.style.display = 'none';
      });
      buyButtons.forEach(button => {
        button.style.display = 'none';
      });
      watchNowButtons.forEach(button => {
        button.style.display = '';
        button.textContent = 'Watch Now';
      });
    }
  }

  /**
   * Update other state-dependent buttons
   */
  updateOtherButtons(buttonState) {
    // Update any other buttons that depend on authentication state
    const userProfileButtons = document.querySelectorAll('[data-button-type="user-profile"]');
    
    userProfileButtons.forEach(button => {
      if (buttonState === 'not-signed-in') {
        button.style.display = 'none';
      } else {
        button.style.display = '';
      }
    });
  }

  /**
   * Handle button clicks based on button type
   */
  handleButtonClick(button) {
    const buttonType = button.getAttribute('data-button-type');
    const buttonState = this.auth ? this.auth.getButtonState() : 'not-signed-in';
    
    switch (buttonType) {
      case 'sign-in':
        this.handleSignInClick();
        break;
      case 'sign-out':
        this.handleSignOutClick();
        break;
      case 'rent':
        this.handleRentClick();
        break;
      case 'buy':
        this.handleBuyClick();
        break;
      case 'watch-now':
        this.handleWatchNowClick();
        break;
      default:
        console.log('Unknown button type:', buttonType);
    }
  }

  /**
   * Handle Sign In button click
   */
  handleSignInClick() {
    // Open authentication modal in Sign In state
    this.openAuthModal('signin');
  }

  /**
   * Handle Sign Out button click
   */
  handleSignOutClick() {
    if (this.auth) {
      this.auth.signOut();
    }
  }

  /**
   * Handle Rent button click
   */
  handleRentClick() {
    if (!this.auth || !this.auth.isSignedIn()) {
      // Set intended action and open authentication modal in Sign Up state
      this.intendedAction = 'rent';
      this.openAuthModal('signup');
    } else {
      // User is signed in, proceed to Stripe checkout for rental
      this.initiateRentalPurchase();
    }
  }

  /**
   * Handle Buy button click
   */
  handleBuyClick() {
    if (!this.auth || !this.auth.isSignedIn()) {
      // Set intended action and open authentication modal in Sign Up state
      this.intendedAction = 'buy';
      this.openAuthModal('signup');
    } else {
      // User is signed in, show purchase options modal
      this.showPurchaseOptions();
    }
  }

  /**
   * Handle Watch Now button click
   */
  handleWatchNowClick() {
    // Redirect to overview page
    window.location.href = '/watch';
  }

  /**
   * Open authentication modal (Attribute-based)
   */
  openAuthModal(tab = 'signin') {
    // Use the webflow handler if available
    if (window.webflowAuthHandlers) {
      window.webflowAuthHandlers.showAuthModal(tab);
    } else {
      // Fallback to direct attribute selector
      const modal = document.querySelector('[data-modal="auth"]');
      if (modal) {
        modal.style.display = 'flex';
        this.switchAuthTab(tab);
      }
    }
  }

  /**
   * Switch auth tab (Attribute-based)
   */
  switchAuthTab(tabName) {
    // Get all tab buttons and contents using attributes
    const tabs = document.querySelectorAll('[data-auth-tab]');
    const tabContents = document.querySelectorAll('[data-auth-tab-content]');
    
    // Remove active class from all
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    
    // Add active class to target tab and content
    const targetTab = document.querySelector(`[data-auth-tab="${tabName}"]`);
    const targetContent = document.querySelector(`[data-auth-tab-content="${tabName}"]`);
    
    if (targetTab) targetTab.classList.add('active');
    if (targetContent) targetContent.classList.add('active');
  }

  /**
   * Show purchase options modal (Attribute-based)
   */
  showPurchaseOptions() {
    // Use the webflow handler if available
    if (window.webflowAuthHandlers) {
      window.webflowAuthHandlers.showPurchaseModal();
    } else {
      // Fallback to direct attribute selector
      const modal = document.querySelector('[data-modal="purchase"]');
      if (modal) {
        modal.style.display = 'flex';
      } else {
        console.error('Purchase options modal not found');
      }
    }
  }

  /**
   * Hide purchase options modal (Attribute-based)
   */
  hidePurchaseOptions() {
    // Use the webflow handler if available
    if (window.webflowAuthHandlers) {
      window.webflowAuthHandlers.hidePurchaseModal();
    } else {
      // Fallback to direct attribute selector
      const modal = document.querySelector('[data-modal="purchase"]');
      if (modal) {
        modal.style.display = 'none';
      }
    }
  }

  /**
   * Handle regular purchase option click
   */
  handleRegularPurchaseClick() {
    this.hidePurchaseOptions();
    this.initiateRegularPurchase();
  }

  /**
   * Handle box set purchase option click
   */
  handleBoxSetPurchaseClick() {
    this.hidePurchaseOptions();
    this.initiateBoxSetPurchase();
  }

  /**
   * Initiate rental purchase
   */
  async initiateRentalPurchase() {
    try {
      if (window.stripeIntegration) {
        await window.stripeIntegration.createRentalCheckout();
      } else {
        throw new Error('Stripe integration not available');
      }
    } catch (error) {
      console.error('Rental purchase error:', error);
      this.showErrorMessage('Failed to start rental purchase. Please try again.');
    }
  }

  /**
   * Initiate regular purchase
   */
  async initiateRegularPurchase() {
    try {
      if (window.stripeIntegration) {
        await window.stripeIntegration.createRegularPurchaseCheckout();
      } else {
        throw new Error('Stripe integration not available');
      }
    } catch (error) {
      console.error('Regular purchase error:', error);
      this.showErrorMessage('Failed to start regular purchase. Please try again.');
    }
  }

  /**
   * Initiate box set purchase
   */
  async initiateBoxSetPurchase() {
    try {
      if (window.stripeIntegration) {
        await window.stripeIntegration.createBoxSetCheckout();
      } else {
        throw new Error('Stripe integration not available');
      }
    } catch (error) {
      console.error('Box set purchase error:', error);
      this.showErrorMessage('Failed to start box set purchase. Please try again.');
    }
  }

  /**
   * Wait for auth state to be ready, then execute intended action
   */
  async executeIntendedActionWhenReady() {
    if (!this.intendedAction) return;
    
    // Wait for auth to be fully ready
    const authReady = await this.waitForAuthReady();
    
    if (!authReady) {
      console.error('Auth state not ready, cannot execute intended action');
      this.intendedAction = null;
      return;
    }
    
    this.executeIntendedAction();
  }
  
  /**
   * Wait for auth state to be ready
   */
  async waitForAuthReady(maxAttempts = 10, delayMs = 50) {
    for (let i = 0; i < maxAttempts; i++) {
      // Check if auth is properly initialized and user is signed in
      if (this.auth && 
          this.auth.isSignedIn && 
          this.auth.isSignedIn() && 
          this.auth.getCurrentUser && 
          this.auth.getCurrentUser()) {
        return true;
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    return false;
  }

  /**
   * Execute the intended action after successful authentication
   */
  executeIntendedAction() {
    if (!this.intendedAction) return;
    
    const action = this.intendedAction;
    this.intendedAction = null; // Clear the intended action
    
    // Execute the intended action
    switch (action) {
      case 'rent':
        this.initiateRentalPurchase();
        break;
      case 'buy':
        this.showPurchaseOptions();
        break;
      default:
        console.log('Unknown intended action:', action);
    }
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    if (window.stripeIntegration) {
      window.stripeIntegration.showErrorMessage(message);
    } else {
      alert(message);
    }
  }
}

// Initialize button state manager
document.addEventListener('DOMContentLoaded', () => {
  window.buttonStateManager = new ButtonStateManager();
  
  // Add click event listeners to all buttons
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-button-type]');
    if (button && window.buttonStateManager) {
      window.buttonStateManager.handleButtonClick(button);
    }
  });

  // Add click event listeners for purchase options modal (Attribute-based)
  document.addEventListener('click', (event) => {
    // Close button - data-modal-action="close" within data-modal="purchase"
    if (event.target.matches('[data-modal="purchase"] [data-modal-action="close"]')) {
      window.buttonStateManager.hidePurchaseOptions();
    }
    // Regular purchase button - data-purchase-type="regular"
    else if (event.target.matches('[data-purchase-type="regular"]')) {
      window.buttonStateManager.handleRegularPurchaseClick();
    }
    // Box set purchase button - data-purchase-type="boxset"
    else if (event.target.matches('[data-purchase-type="boxset"]')) {
      window.buttonStateManager.handleBoxSetPurchaseClick();
    }
  });

  // Close modal when clicking outside (Attribute-based)
  document.addEventListener('click', (event) => {
    const modal = document.querySelector('[data-modal="purchase"]');
    if (event.target === modal) {
      window.buttonStateManager.hidePurchaseOptions();
    }
  });
});

// Export for use in other scripts
window.ButtonStateManager = ButtonStateManager;
