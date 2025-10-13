/**
 * Account Page Manager for Tim Burton Docuseries
 * Handles authentication check, profile management, and purchase history
 */

class AccountPageManager {
  constructor() {
    this.apiBaseUrl = 'https://us-central1-tim-burton-docuseries.cloudfunctions.net/api';
    this.user = null;
    this.purchases = [];
    this.isUpdating = false;
    
    // Product details (matches backend STRIPE_PRODUCTS)
    this.products = {
      rental: {
        name: 'Tim Burton Docuseries - Rental',
        description: '4-day access to all 4 episodes',
        price: 14.99,
        duration: '4 days'
      },
      regular: {
        name: 'Tim Burton Docuseries - Regular Purchase',
        description: 'Permanent access to 4 episodes',
        price: 24.99,
        duration: 'Permanent'
      },
      boxset: {
        name: 'Tim Burton Docuseries - Box Set',
        description: '4 episodes + 40 hours of bonus content',
        price: 74.99,
        duration: 'Permanent'
      }
    };
    
    this.init();
  }
  
  // ============================================================================
  // INITIALIZATION & AUTH CHECK
  // ============================================================================
  
  async init() {
    // Wait for auth to initialize
    if (!window.timBurtonAuth) {
      console.log('Waiting for auth to initialize...');
      await this.waitForAuth();
    }
    
    // Check if user is signed in
    if (!window.timBurtonAuth.isSignedIn()) {
      console.log('❌ User not signed in, redirecting to homepage...');
      this.redirectToHomepage();
      return;
    }
    
    // User is authenticated, load account data
    this.user = window.timBurtonAuth.getCurrentUser();
    console.log('✅ User authenticated:', this.user.email);
    
    await this.loadAccountData();
  }
  
  /**
   * Wait for auth system to initialize
   */
  async waitForAuth() {
    return new Promise((resolve) => {
      const checkAuth = setInterval(() => {
        if (window.timBurtonAuth && window.timBurtonAuth.isInitialized) {
          clearInterval(checkAuth);
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkAuth);
        resolve();
      }, 5000);
    });
  }
  
  /**
   * Redirect to homepage if not authenticated
   */
  redirectToHomepage() {
    // Show brief message before redirect (optional)
    const message = document.querySelector('[data-account-message]');
    if (message) {
      message.textContent = 'Please sign in to view your account.';
      message.style.display = 'block';
    }
    
    // Redirect after short delay
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }
  
  // ============================================================================
  // LOAD ACCOUNT DATA
  // ============================================================================
  
  async loadAccountData() {
    try {
      // Load user profile (already in memory from auth)
      this.populateProfile();
      
      // Load purchase history
      await this.loadPurchaseHistory();
      
      // Hide loading state
      this.hideLoadingState();
      
      console.log('✅ Account data loaded');
      
    } catch (error) {
      console.error('❌ Error loading account data:', error);
      this.showError('Failed to load account data. Please refresh the page.');
    }
  }
  
  /**
   * Populate profile fields with user data
   */
  populateProfile() {
    // First Name
    const firstNameEl = document.querySelector('[data-profile-first-name]');
    if (firstNameEl) {
      if (firstNameEl.tagName === 'INPUT' || firstNameEl.tagName === 'TEXTAREA') {
        firstNameEl.value = this.user.firstName || '';
      } else {
        firstNameEl.textContent = this.user.firstName || 'User';
      }
    }
    
    // Last Name
    const lastNameEl = document.querySelector('[data-profile-last-name]');
    if (lastNameEl) {
      if (lastNameEl.tagName === 'INPUT' || lastNameEl.tagName === 'TEXTAREA') {
        lastNameEl.value = this.user.lastName || '';
      } else {
        lastNameEl.textContent = this.user.lastName || '';
      }
    }
    
    // Email (display only, separate field for editing)
    const emailDisplayEl = document.querySelector('[data-profile-email-display]');
    if (emailDisplayEl) {
      emailDisplayEl.textContent = this.user.email || '';
    }
    
    // Email (for editing)
    const emailInputEl = document.querySelector('[data-profile-email-input]');
    if (emailInputEl) {
      emailInputEl.value = this.user.email || '';
    }
    
    // Profile Image
    const photoEl = document.querySelector('[data-profile-image]');
    if (photoEl && this.user.photoURL) {
      photoEl.src = this.user.photoURL;
    }
    
    console.log('✅ Profile populated');
  }
  
  /**
   * Load purchase history from backend
   */
  async loadPurchaseHistory() {
    try {
      const idToken = await window.timBurtonAuth.getIdToken();
      
      const response = await fetch(`${this.apiBaseUrl}/payments/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load purchase history: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        this.purchases = result.purchases;
        this.displayPurchaseHistory();
      } else {
        throw new Error(result.error || 'Failed to load purchase history');
      }
      
    } catch (error) {
      console.error('❌ Error loading purchase history:', error);
      this.showError('Failed to load purchase history.');
    }
  }
  
  /**
   * Display purchase history in the UI
   */
  displayPurchaseHistory() {
    const container = document.querySelector('[data-purchase-history]');
    if (!container) {
      console.warn('Purchase history container not found');
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (this.purchases.length === 0) {
      container.innerHTML = '<p>No purchases yet.</p>';
      return;
    }
    
    // Display each purchase
    this.purchases.forEach(purchase => {
      const purchaseEl = this.createPurchaseElement(purchase);
      container.appendChild(purchaseEl);
    });
    
    console.log(`✅ Displayed ${this.purchases.length} purchase(s)`);
  }
  
  /**
   * Create purchase element
   */
  createPurchaseElement(purchase) {
    const div = document.createElement('div');
    div.className = 'purchase-item';
    div.setAttribute('data-purchase-item', '');
    
    const product = this.products[purchase.productType];
    const amount = (purchase.amount / 100).toFixed(2);
    const date = purchase.createdAt ? new Date(purchase.createdAt._seconds * 1000).toLocaleDateString() : 'N/A';
    
    // Check if rental is expired
    let expirationText = '';
    if (purchase.productType === 'rental' && purchase.expiresAt) {
      const expiresAt = new Date(purchase.expiresAt._seconds * 1000);
      const now = new Date();
      if (now > expiresAt) {
        expirationText = '<span class="expired">Expired</span>';
      } else {
        expirationText = `<span class="active">Expires: ${expiresAt.toLocaleDateString()}</span>`;
      }
    }
    
    div.innerHTML = `
      <div data-purchase-product-name>${product ? product.name : purchase.productType}</div>
      <div data-purchase-date>${date}</div>
      <div data-purchase-amount>$${amount} USD</div>
      ${expirationText ? `<div data-purchase-expiration>${expirationText}</div>` : ''}
      <button data-download-receipt data-purchase-id="${purchase.id}">
        Download Receipt
      </button>
    `;
    
    // Add receipt download handler
    const receiptBtn = div.querySelector('[data-download-receipt]');
    receiptBtn.addEventListener('click', () => this.downloadReceipt(purchase.id));
    
    return div;
  }
  
  /**
   * Download receipt from Stripe
   */
  async downloadReceipt(purchaseId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/receipt/${purchaseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get receipt URL');
      }
      
      const result = await response.json();
      
      if (result.success && result.receiptUrl) {
        // Open receipt in new window
        window.open(result.receiptUrl, '_blank');
      } else {
        throw new Error('Receipt URL not available');
      }
      
    } catch (error) {
      console.error('❌ Error downloading receipt:', error);
      alert('Failed to download receipt. Please contact support.');
    }
  }
  
  // ============================================================================
  // PROFILE UPDATES
  // ============================================================================
  
  /**
   * Update first name
   */
  async updateFirstName() {
    const firstNameInput = document.querySelector('[data-profile-first-name]');
    if (!firstNameInput || firstNameInput.tagName !== 'INPUT') {
      console.error('First name input not found');
      return;
    }
    
    const newFirstName = firstNameInput.value.trim();
    
    if (!newFirstName) {
      this.showError('First name cannot be empty');
      return;
    }
    
    if (newFirstName === this.user.firstName) {
      this.showMessage('No changes to save');
      return;
    }
    
    try {
      this.isUpdating = true;
      this.showLoadingState('Updating first name...');
      
      const idToken = await window.timBurtonAuth.getIdToken();
      
      const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          firstName: newFirstName
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update first name');
      }
      
      const result = await response.json();
      
      if (result.success) {
        this.user.firstName = newFirstName;
        this.showMessage('First name updated successfully!');
        
        // Update auth state
        window.timBurtonAuth.currentUser.firstName = newFirstName;
      } else {
        throw new Error(result.error || 'Update failed');
      }
      
    } catch (error) {
      console.error('❌ Error updating first name:', error);
      this.showError('Failed to update first name. Please try again.');
    } finally {
      this.isUpdating = false;
      this.hideLoadingState();
    }
  }
  
  /**
   * Update email
   * Uses Firebase Auth updateEmail()
   */
  async updateEmail() {
    const emailInput = document.querySelector('[data-profile-email-input]');
    if (!emailInput) {
      console.error('Email input not found');
      return;
    }
    
    const newEmail = emailInput.value.trim();
    
    if (!newEmail) {
      this.showError('Email cannot be empty');
      return;
    }
    
    if (newEmail === this.user.email) {
      this.showMessage('No changes to save');
      return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      this.showError('Invalid email format');
      return;
    }
    
    try {
      this.isUpdating = true;
      this.showLoadingState('Updating email...');
      
      const firebaseUser = window.timBurtonAuth.firebaseAuth.currentUser;
      
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }
      
      // Update email in Firebase Auth
      await firebaseUser.updateEmail(newEmail);
      
      // Send email verification
      await firebaseUser.sendEmailVerification();
      
      this.user.email = newEmail;
      this.showMessage('Email updated! Please check your inbox for verification email.');
      
      // Update auth state
      window.timBurtonAuth.currentUser.email = newEmail;
      
    } catch (error) {
      console.error('❌ Error updating email:', error);
      
      let errorMessage = 'Failed to update email. Please try again.';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security, please sign out and sign in again before changing your email.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another account.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      this.showError(errorMessage);
    } finally {
      this.isUpdating = false;
      this.hideLoadingState();
    }
  }
  
  /**
   * Update password
   * Uses Firebase Auth updatePassword()
   */
  async updatePassword() {
    const currentPasswordInput = document.querySelector('[data-current-password]');
    const newPasswordInput = document.querySelector('[data-new-password]');
    const confirmPasswordInput = document.querySelector('[data-confirm-password]');
    
    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
      console.error('Password fields not found');
      return;
    }
    
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showError('All password fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.showError('New passwords do not match');
      return;
    }
    
    if (newPassword === currentPassword) {
      this.showError('New password must be different from current password');
      return;
    }
    
    // Validate password strength (same as signup)
    const passwordValidation = window.timBurtonAuth.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      this.showError(passwordValidation.errors.join('. '));
      return;
    }
    
    try {
      this.isUpdating = true;
      this.showLoadingState('Updating password...');
      
      const firebaseUser = window.timBurtonAuth.firebaseAuth.currentUser;
      
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('User not authenticated');
      }
      
      // Re-authenticate user with current password
      const credential = firebase.auth.EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );
      
      await firebaseUser.reauthenticateWithCredential(credential);
      
      // Update password
      await firebaseUser.updatePassword(newPassword);
      
      // Clear password fields
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
      
      this.showMessage('Password updated successfully!');
      
    } catch (error) {
      console.error('❌ Error updating password:', error);
      
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security, please sign out and sign in again before changing your password.';
      }
      
      this.showError(errorMessage);
    } finally {
      this.isUpdating = false;
      this.hideLoadingState();
    }
  }
  
  // ============================================================================
  // UI HELPERS
  // ============================================================================
  
  showLoadingState(message = 'Loading...') {
    const loader = document.querySelector('[data-account-loading]');
    if (loader) {
      loader.textContent = message;
      loader.style.display = 'block';
    }
  }
  
  hideLoadingState() {
    const loader = document.querySelector('[data-account-loading]');
    if (loader) {
      loader.style.display = 'none';
    }
  }
  
  showMessage(message) {
    const messageEl = document.querySelector('[data-account-success]');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    } else {
      alert(message);
    }
  }
  
  showError(message) {
    const errorEl = document.querySelector('[data-account-error]');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        errorEl.style.display = 'none';
      }, 5000);
    } else {
      alert(message);
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize account page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.accountPageManager = new AccountPageManager();
});

// Make available globally
window.AccountPageManager = AccountPageManager;

